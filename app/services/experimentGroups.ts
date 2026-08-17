/**
 * experimentGroups — grouping and summary maths over the experiment list.
 *
 * Pure functions only, no Vue imports. Turns the flat experiment list into
 * per-run status/percent, per-group rollup summaries, and the three
 * programme cards (DECK / Scenarios / Other) shown on the dashboard. Counting
 * is per ensemble member throughout: one simulation means one realisation.
 * `experimentProgressPercent` here intentionally differs from the percent
 * computed in ~/components/ExperimentProgress.vue on the expectedYearsRun === 0
 * edge case; see the note on that function.
 *
 * Used by: app/components/ExperimentProgrammeGroups.vue,
 * app/components/ExperimentTotals.vue, app/components/RunProgressBar.vue
 */
import { hasEnsemble } from "./payuExperiments";
import type { PayuExperiment } from "./payuExperiments";
import { EXPERIMENT_TIERS } from "./experimentTier";
import type { ExperimentTierId } from "./experimentTier";

export type ExperimentRunStatus = "completed" | "running" | "not-started";
export type ExperimentGroupId = "deck" | "scenario" | "other";

/** Group rollup. Every count here is in ensemble members, not experiments. */
export interface ExperimentGroupSummary {
  total: number;
  completed: number;
  running: number;
  notStarted: number;
  published: number;
  yearsRun: number;
  plannedYears: number;
  percent: number | null;
}

export interface ExperimentGroup {
  id: ExperimentGroupId;
  label: string;
  description: string;
  color: "secondary" | "success" | "primary" | "neutral";
  icon: string;
  experiments: PayuExperiment[];
  summary: ExperimentGroupSummary;
}

/**
 * Anything with years-run against an expectation. Both a whole experiment and a
 * single ensemble member satisfy this, so one status/percent rule covers the
 * top-level rows and the members fanned out beneath them.
 */
export interface RunProgress {
  yearsRun: number;
  expectedYearsRun: number | null;
}

export function experimentRunStatus(run: RunProgress): ExperimentRunStatus {
  if (run.expectedYearsRun !== null && run.yearsRun >= run.expectedYearsRun) {
    return "completed";
  }
  return run.yearsRun > 0 ? "running" : "not-started";
}

// The `=== null` guard is deliberately narrower than the truthy check used by
// the `percent` computed in ~/components/ExperimentProgress.vue. They are NOT
// interchangeable: an expectedYearsRun of 0 passes this guard and would divide
// by zero here, whereas the component's truthy check would return null. This
// function's callers never pass 0, so the guard is correct as written — do not
// "align" it with the component's truthy form. See the matching note there.
export function experimentProgressPercent(run: RunProgress): number | null {
  if (run.expectedYearsRun === null) return null;
  return Math.min(100, Math.round((run.yearsRun / run.expectedYearsRun) * 100));
}

/** One experiment's runs, bucketed by status. The buckets sum to `total`. */
export interface ExperimentRunCounts {
  total: number;
  completed: number;
  running: number;
  notStarted: number;
}

/**
 * How many simulations an experiment is, and how far along each of them is.
 * A 30-member ensemble is 30 simulations, not one — counting whole experiments
 * would let 29 finished realisations read as nothing completed.
 *
 * The total is the *planned* ensemble size, so members that have not been
 * created yet still count as outstanding work, matching `expectedYearsRun`
 * (already the per-member figure times the planned size).
 *
 * An experiment that is a single run is counted whole rather than through its
 * lone member, which keeps two cases right: `piControl`, whose related sub-runs
 * sum into `yearsRun` but are deliberately absent from `members`, and an
 * experiment with no UUID recorded, which has no members but is still one
 * planned run.
 */
export function experimentRunCounts(
  experiment: PayuExperiment,
): ExperimentRunCounts {
  const total = Math.max(
    experiment.expectedEnsembleCount,
    experiment.members.length,
  );

  if (!hasEnsemble(experiment)) {
    const status = experimentRunStatus(experiment);
    return {
      total,
      completed: status === "completed" ? 1 : 0,
      running: status === "running" ? 1 : 0,
      notStarted: status === "not-started" ? 1 : 0,
    };
  }

  let completed = 0;
  let running = 0;
  for (const member of experiment.members) {
    const status = experimentRunStatus(member);
    if (status === "completed") completed += 1;
    if (status === "running") running += 1;
  }

  return {
    total,
    completed,
    running,
    // Planned members with no run recorded yet land here too, so the buckets
    // always add up to the planned ensemble size.
    notStarted: Math.max(0, total - completed - running),
  };
}

export function summarizeExperimentGroup(
  experiments: PayuExperiment[],
): ExperimentGroupSummary {
  let total = 0;
  let completed = 0;
  let running = 0;
  let notStarted = 0;
  let published = 0;
  let yearsRun = 0;
  let plannedYears = 0;

  for (const experiment of experiments) {
    yearsRun += experiment.yearsRun;
    if (experiment.expectedYearsRun !== null) {
      plannedYears += experiment.expectedYearsRun;
    }
    // Counted in members, like the status buckets below, so a part-published
    // ensemble is not rounded away to nothing.
    published += experiment.esgfPublishedCount;

    const counts = experimentRunCounts(experiment);
    total += counts.total;
    completed += counts.completed;
    running += counts.running;
    notStarted += counts.notStarted;
  }

  return {
    total,
    completed,
    running,
    notStarted,
    published,
    yearsRun,
    plannedYears,
    percent:
      plannedYears > 0
        ? Math.min(100, Math.round((yearsRun / plannedYears) * 100))
        : null,
  };
}

function hasTier(experiment: PayuExperiment, id: ExperimentTierId): boolean {
  return experiment.tiers.some((tier) => tier.id === id);
}

/**
 * The three cards on the big-picture row. DECK comes off the tier axis; the
 * other two split everything else by whether it is a future scenario, which is
 * already declared per experiment as `class: "projection"` in
 * experiment-config.json — the Fast Track is spread across both, since a
 * fast-tracked scenario and a fast-tracked sensitivity run answer very different
 * questions for a reader.
 *
 * DECK and scenario membership are independent, so a DECK experiment classed as
 * a projection would appear in both; `other` is the true complement of the two,
 * so every experiment lands in at least one card.
 */
export function groupExperimentsByProgramme(
  experiments: PayuExperiment[],
): ExperimentGroup[] {
  const groupDefinitions = [
    {
      // Label, description, colour and icon come from the tier definition; the
      // id is re-pinned because `EXPERIMENT_TIERS` types it as any tier id, and
      // only DECK is a group.
      ...EXPERIMENT_TIERS.deck,
      id: "deck" as const,
      experiments: experiments.filter((experiment) =>
        hasTier(experiment, "deck"),
      ),
    },
    {
      id: "scenario" as const,
      label: "Scenarios",
      description:
        "Simulations of plausible future climates under different emissions and policy pathways — the closest thing here to a real-world outlook.",
      color: "primary" as const,
      icon: "i-lucide-trending-up",
      experiments: experiments.filter(
        (experiment) => experiment.experimentClass.isProjection,
      ),
    },
    {
      id: "other" as const,
      label: "Other simulations",
      description:
        "Simulations that are neither DECK baselines nor future scenarios — sensitivity and single-forcing runs that probe how the model itself behaves.",
      color: "neutral" as const,
      icon: "i-lucide-circle-ellipsis",
      experiments: experiments.filter(
        (experiment) =>
          !hasTier(experiment, "deck") &&
          !experiment.experimentClass.isProjection,
      ),
    },
  ];

  return groupDefinitions
    .filter((group) => group.experiments.length > 0)
    .map((group) => ({
      id: group.id,
      label: group.label,
      description: group.description,
      color: group.color,
      icon: group.icon,
      experiments: group.experiments,
      summary: summarizeExperimentGroup(group.experiments),
    }));
}
