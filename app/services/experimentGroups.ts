import type { PayuExperiment } from "./payuExperiments";
import { EXPERIMENT_TIERS } from "./experimentTier";
import type { ExperimentTierId } from "./experimentTier";

export type ExperimentRunStatus = "completed" | "running" | "not-started";
export type ExperimentGroupId = ExperimentTierId | "other";

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
  color: "secondary" | "success" | "neutral";
  icon: string;
  experiments: PayuExperiment[];
  summary: ExperimentGroupSummary;
}

export function experimentRunStatus(
  experiment: PayuExperiment,
): ExperimentRunStatus {
  if (
    experiment.expectedYearsRun !== null &&
    experiment.yearsRun >= experiment.expectedYearsRun
  ) {
    return "completed";
  }
  return experiment.yearsRun > 0 ? "running" : "not-started";
}

export function experimentProgressPercent(
  experiment: PayuExperiment,
): number | null {
  if (experiment.expectedYearsRun === null) return null;
  return Math.min(
    100,
    Math.round((experiment.yearsRun / experiment.expectedYearsRun) * 100),
  );
}

export function summarizeExperimentGroup(
  experiments: PayuExperiment[],
): ExperimentGroupSummary {
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
    if (experiment.esgfPublished === true) published += 1;

    const status = experimentRunStatus(experiment);
    if (status === "completed") completed += 1;
    if (status === "running") running += 1;
    if (status === "not-started") notStarted += 1;
  }

  return {
    total: experiments.length,
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

export function groupExperimentsByProgramme(
  experiments: PayuExperiment[],
): ExperimentGroup[] {
  const groupDefinitions = [
    {
      ...EXPERIMENT_TIERS.deck,
      experiments: experiments.filter((experiment) =>
        hasTier(experiment, "deck"),
      ),
    },
    {
      ...EXPERIMENT_TIERS.aft,
      experiments: experiments.filter((experiment) =>
        hasTier(experiment, "aft"),
      ),
    },
    {
      id: "other" as const,
      label: "Other simulations",
      description:
        "Simulations tracked by the dashboard that are not currently marked as DECK or Assessment Fast Track.",
      color: "neutral" as const,
      icon: "i-lucide-circle-ellipsis",
      experiments: experiments.filter(
        (experiment) => experiment.tiers.length === 0,
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
