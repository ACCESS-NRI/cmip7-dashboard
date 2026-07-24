/**
 * payuExperiments — the normalised experiment view model and its loader.
 *
 * Pure TypeScript, no Vue imports. Merges the static experiment-config.json onto
 * live payu telemetry (by UUID) into the PayuExperiment shape the UI consumes,
 * and exposes the small pure predicates describing an experiment's ensemble
 * (`hasEnsemble`, `startedMembers`, `pendingMembers`) alongside it.
 *
 * Used by: app/composables/usePayuExperiments.ts,
 * app/services/experimentGroups.ts, app/components/DashboardHero.vue,
 * app/components/ExperimentCard.vue, app/components/ExperimentSummaryCards.vue,
 * app/components/ExperimentTotals.vue, app/components/PayuExperimentAccordion.vue,
 * app/components/ExperimentProgrammeGroups.vue,
 * app/components/ExperimentGroupRow.vue
 */
import { loadExperimentConfig } from "./experimentConfig";
import type {
  ExperimentConfig,
  ExperimentEnsembleMember,
} from "./experimentConfig";
import { resolveExperimentClass } from "./experimentClass";
import type { ExperimentClass } from "./experimentClass";
import { experimentTiers } from "./experimentTier";
import type { ExperimentTier } from "./experimentTier";

/** Raw shape produced by the Payu experiment API / CLI output. */
export interface PayuExperimentRaw {
  experiment_name: string;
  experiment_uuid: string;
  experiment_model_start_time: string;
  experiment_model_current_time: string;
  /** Direct service-units figure; may be absent while a run is in progress. */
  experiment_service_units?: number | null;
  /** Fallback CPU-time value used when service units are not yet calculated. */
  experiment_resources_used_cput?: number | null;
  /** Any additional fields forwarded transparently to the UI. */
  [key: string]: unknown;
}

/**
 * A single run within an experiment. An experiment with no ensemble has exactly
 * one member (itself); an ensemble experiment has one per realisation.
 */
export interface PayuExperimentMember {
  /** Realisation label from the config, e.g. `r1i1p1f1`. */
  name: string;
  uuid: string;
  modelStartTime: string;
  modelCurrentTime: string;
  serviceUnitsDisplay: string;
  serviceUnits: number | null;
  yearsRun: number;
  /** Years this one realisation is expected to run. */
  expectedYearsRun: number | null;
  /** False when no payu telemetry matched this member's UUID. */
  hasTelemetry: boolean;
  details: Record<string, unknown>;
}

/** Normalised view model consumed by the accordion component. */
export interface PayuExperiment {
  name: string;
  uuid: string;
  modelStartTime: string;
  modelCurrentTime: string;
  serviceUnitsDisplay: string;
  /** True service-units figure for aggregation; null when not yet calculated. */
  serviceUnits: number | null;
  /** Years run summed across every ensemble member. */
  yearsRun: number;
  /**
   * Years the whole experiment is expected to run: the per-member figure times
   * the planned ensemble size, so progress reflects the full workload rather
   * than one realisation's share of it.
   */
  expectedYearsRun: number | null;
  /** Years a single realisation is expected to run. */
  memberExpectedYearsRun: number | null;
  /** Planned ensemble size; 1 for an experiment that is a single run. */
  expectedEnsembleCount: number;
  /**
   * The realisations that exist, in natural realisation order. Can be shorter
   * than `expectedEnsembleCount` while members are still being started, and
   * empty for an experiment with no UUID recorded yet.
   */
  members: PayuExperimentMember[];
  /**
   * Ensemble members published to ESGF, out of `expectedEnsembleCount`. The
   * single source of truth for publication: a derived "is it published"
   * boolean alongside it would only drift once a count can be partial.
   */
  esgfPublishedCount: number;
  /** Resolved scientific taxonomy class (issue #14), from the config `class`. */
  experimentClass: ExperimentClass;
  /**
   * Resolved participation tiers (issue #21), from the config `deck`/`aft`
   * flags, in stacking order. Empty when the experiment is in no headline tier.
   */
  tiers: ExperimentTier[];
  /** All original key/value pairs for the expanded details panel. */
  details: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Ensemble predicates
// ---------------------------------------------------------------------------

/** True when there is an ensemble to fan out to — planned, started, or both. */
export function hasEnsemble(experiment: PayuExperiment): boolean {
  return experiment.expectedEnsembleCount > 1 || experiment.members.length > 1;
}

/** Members with telemetry showing time on the clock. */
export function startedMembers(experiment: PayuExperiment): number {
  return experiment.members.filter((member) => member.yearsRun > 0).length;
}

/**
 * Members that are planned but have no run recorded yet. Counted against the
 * planned ensemble size rather than the member list, so an experiment whose
 * members have not been created still shows what is outstanding.
 */
export function pendingMembers(experiment: PayuExperiment): number {
  return Math.max(
    0,
    experiment.expectedEnsembleCount - startedMembers(experiment),
  );
}

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

/**
 * Produces a human-readable service-units string. Isolating this logic means
 * the calculation strategy can be updated in one place without touching the
 * component.
 */
export function formatServiceUnits(raw: PayuExperimentRaw): string {
  if (raw.experiment_service_units != null) {
    return String(raw.experiment_service_units);
  }
  if (raw.experiment_resources_used_cput != null) {
    return `${raw.experiment_resources_used_cput} (CPU-T)`;
  }
  return "—";
}

/** Model years run, derived from the start/current model time years. */
export function calculateYearsRun(raw: PayuExperimentRaw): number {
  const startYear = parseInt(raw.experiment_model_start_time.slice(0, 4), 10);
  const currentYear = parseInt(
    raw.experiment_model_current_time.slice(0, 4),
    10,
  );
  return currentYear - startYear;
}

/**
 * The runs shown as an experiment's fan-out: the realisations you can expand to
 * inspect one at a time. An ensemble lists its realisations; a plain experiment
 * is a single run named after the experiment itself. `related_experiments` are
 * deliberately *not* here — they roll up into the totals but are not a fan-out
 * (see `relatedSubRuns`).
 */
function configMembers(
  configEntry: ExperimentConfig,
): ExperimentEnsembleMember[] {
  if (configEntry.ensembles?.length) {
    // Config order is arbitrary, and a plain sort puts r10 ahead of r2.
    return [...configEntry.ensembles].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
  }
  if (configEntry.uuid) {
    return [{ name: configEntry.name, uuid: configEntry.uuid }];
  }
  return [];
}

/**
 * Sub-runs of one experiment recorded under separate payu UUIDs (e.g.
 * piControl's PI-CNP / Ndep2-PI-CNP concentrations runs). Their telemetry sums
 * into the experiment's totals, but they are one experiment — not an ensemble —
 * so they contribute no fan-out and do not change the planned ensemble size.
 * Only read when there is no ensemble, which already supplies the runs.
 */
function relatedSubRuns(
  configEntry: ExperimentConfig,
): ExperimentEnsembleMember[] {
  if (configEntry.ensembles?.length) return [];
  return configEntry.related_experiments ?? [];
}

export function normalizePayuMember(
  member: ExperimentEnsembleMember,
  expectedYearsRun: number | null,
  payuData: PayuExperimentRaw | undefined,
): PayuExperimentMember {
  return {
    name: member.name,
    uuid: member.uuid,
    modelStartTime: payuData?.experiment_model_start_time ?? "—",
    modelCurrentTime: payuData?.experiment_model_current_time ?? "—",
    serviceUnitsDisplay: payuData ? formatServiceUnits(payuData) : "—",
    serviceUnits: payuData?.experiment_service_units ?? null,
    yearsRun: payuData ? calculateYearsRun(payuData) : 0,
    expectedYearsRun,
    hasTelemetry: payuData !== undefined,
    details: payuData ? { ...payuData } : {},
  };
}

/**
 * Members published to ESGF, from the config's `esgf_published` count. A
 * boolean is read as the whole ensemble or none of it, and a count beyond the
 * planned ensemble size is clamped so the column cannot read 12/10.
 */
export function esgfPublishedCount(
  esgfPublished: number | boolean | undefined,
  expectedEnsembleCount: number,
): number {
  if (esgfPublished === undefined) return 0;
  if (typeof esgfPublished === "boolean") {
    return esgfPublished ? expectedEnsembleCount : 0;
  }
  return Math.min(
    Math.max(0, Math.round(esgfPublished)),
    expectedEnsembleCount,
  );
}

/** Sum of the members that have a figure; null when none of them do. */
function sumServiceUnits(members: PayuExperimentMember[]): number | null {
  const reported = members.filter((member) => member.serviceUnits !== null);
  if (reported.length === 0) return null;
  return reported.reduce((sum, member) => sum + (member.serviceUnits ?? 0), 0);
}

export function normalizePayuExperiment(
  configEntry: ExperimentConfig,
  telemetry: PayuExperimentRaw[] = [],
): PayuExperiment {
  const memberExpectedYearsRun = configEntry.expected_years_run ?? null;
  const expectedEnsembleCount = Math.max(
    1,
    configEntry.expected_n_ensembles ?? 1,
  );

  const findTelemetry = (member: ExperimentEnsembleMember) =>
    normalizePayuMember(
      member,
      memberExpectedYearsRun,
      telemetry.find((row) => row.experiment_uuid === member.uuid),
    );

  const members = configMembers(configEntry).map(findTelemetry);
  // Related sub-runs sum into the totals but never fan out, so they are kept
  // apart from `members` (which drives the fan-out) and only joined for the
  // roll-up below.
  const relatedRuns = relatedSubRuns(configEntry).map(findTelemetry);
  const summedRuns = [...members, ...relatedRuns];

  // A single-run experiment reports that run's own telemetry directly, so
  // consumers that predate ensembles keep seeing what they always did. A set of
  // related sub-runs has no single run to speak for it, so those fields stay
  // blank while the numeric totals below still sum across them.
  const soleMember = members.length === 1 ? members[0] : undefined;

  return {
    name: configEntry.name,
    uuid: configEntry.uuid ?? "",
    modelStartTime: soleMember?.modelStartTime ?? "—",
    modelCurrentTime: soleMember?.modelCurrentTime ?? "—",
    serviceUnitsDisplay: soleMember?.serviceUnitsDisplay ?? "—",
    serviceUnits: sumServiceUnits(summedRuns),
    yearsRun: summedRuns.reduce((sum, member) => sum + member.yearsRun, 0),
    expectedYearsRun:
      memberExpectedYearsRun === null
        ? null
        : memberExpectedYearsRun * expectedEnsembleCount,
    memberExpectedYearsRun,
    expectedEnsembleCount,
    members,
    esgfPublishedCount: esgfPublishedCount(
      configEntry.esgf_published,
      expectedEnsembleCount,
    ),
    experimentClass: resolveExperimentClass(configEntry.class),
    tiers: experimentTiers({ deck: configEntry.deck, aft: configEntry.aft }),
    details: soleMember?.details ?? {},
  };
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

/**
 * Live payu telemetry is best-effort: when the API is not configured or
 * unreachable, the dashboard still shows every experiment from the config,
 * just without per-run telemetry.
 */
async function fetchTelemetry(apiUrl: string): Promise<PayuExperimentRaw[]> {
  if (!apiUrl) return [];
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

/**
 * Build the dashboard experiment list. The experiment-config.json is the source
 * of truth for which experiments to show (including ones that have not run yet)
 * and the only load that can fail; live payu telemetry from the
 * tracking-services API is matched in per ensemble member, by UUID, when
 * available.
 *
 * The API endpoint is supplied by the caller (from
 * `useRuntimeConfig().public.payuCmip7ApiUrl`) so the loader stays unit-testable.
 */
export async function loadPayuExperiments(
  apiUrl: string,
): Promise<PayuExperiment[]> {
  const [config, payuData] = await Promise.all([
    loadExperimentConfig(),
    fetchTelemetry(apiUrl),
  ]);

  // Iterate over config (source of truth), look up payu telemetry by UUID.
  return config.map((configEntry) =>
    normalizePayuExperiment(configEntry, payuData),
  );
}
