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
 * The runs that make up an experiment. An ensemble lists its realisations; a
 * plain experiment is a single run named after the experiment itself. An
 * experiment with neither (only `related_experiments`, which is not yet
 * interpreted) has no runs to report on.
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

  const members = configMembers(configEntry).map((member) =>
    normalizePayuMember(
      member,
      memberExpectedYearsRun,
      telemetry.find((row) => row.experiment_uuid === member.uuid),
    ),
  );

  // A single-run experiment reports that run's own telemetry directly, so
  // consumers that predate ensembles keep seeing what they always did.
  const soleMember = members.length === 1 ? members[0] : undefined;

  return {
    name: configEntry.name,
    uuid: configEntry.uuid ?? "",
    modelStartTime: soleMember?.modelStartTime ?? "—",
    modelCurrentTime: soleMember?.modelCurrentTime ?? "—",
    serviceUnitsDisplay: soleMember?.serviceUnitsDisplay ?? "—",
    serviceUnits: sumServiceUnits(members),
    yearsRun: members.reduce((sum, member) => sum + member.yearsRun, 0),
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
