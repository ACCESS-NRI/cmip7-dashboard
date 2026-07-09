/**
 * Experiment taxonomy (issue #14).
 *
 * The dashboard is broadening beyond scientist users, so it must never let a
 * non-specialist mistake an idealised/diagnostic run (e.g. `abrupt-4xCO2`) for a
 * policy-facing climate projection. Every experiment is sorted into one class
 * with plain-language framing and — critically — an explicit `isProjection`
 * flag so the UI can mark non-projection runs as such.
 *
 * The class of each experiment is declared explicitly in
 * `public/experiment-config.json` (a `class` field) rather than inferred from
 * the name — the experiments are a known, finite enumeration, so hard-coding is
 * safer than name-matching. This module holds the class *definitions*; the
 * *assignment* is data. A missing or unknown class resolves to the conservative
 * default (`idealised`, i.e. explicitly NOT a projection), so a new experiment
 * can never *silently* be presented as one.
 */

export type ExperimentClassId =
  "projection" | "historical" | "baseline" | "idealised";

export interface ExperimentClass {
  id: ExperimentClassId;
  /** Full label for badges and legends, e.g. "Idealised experiment". */
  label: string;
  /** Compact label for tight spaces, e.g. "Idealised". */
  shortLabel: string;
  /** Plain-language, no-CMIP-knowledge-required description. */
  description: string;
  /**
   * Whether this class represents a policy-facing projection of a possible
   * future. Everything else is a control, a reconstruction of the past, or a
   * deliberately artificial experiment — and must be marked so it is not read
   * as a forecast.
   */
  isProjection: boolean;
  /** Nuxt UI colour used for the badge / accent. */
  color: "primary" | "info" | "neutral" | "warning";
  /** Lucide icon name for the badge. */
  icon: string;
}

export const EXPERIMENT_CLASSES: Record<ExperimentClassId, ExperimentClass> = {
  projection: {
    id: "projection",
    label: "Projection",
    shortLabel: "Projection",
    description:
      "A plausible future climate under a specific scenario of emissions and policy choices. This is the closest thing here to a real-world outlook.",
    isProjection: true,
    color: "primary",
    icon: "i-lucide-trending-up",
  },
  historical: {
    id: "historical",
    label: "Historical",
    shortLabel: "Historical",
    description:
      "A reconstruction of the observed past, used to check the model against what actually happened. Not a statement about the future.",
    isProjection: false,
    color: "info",
    icon: "i-lucide-history",
  },
  baseline: {
    id: "baseline",
    label: "Baseline control",
    shortLabel: "Control",
    description:
      "A stable, unchanging reference world that every other run is measured against. It describes no real time or place.",
    isProjection: false,
    color: "neutral",
    icon: "i-lucide-anchor",
  },
  idealised: {
    id: "idealised",
    label: "Idealised experiment",
    shortLabel: "Idealised",
    description:
      "A deliberately artificial “what-if” that probes how the model responds — for example, abruptly quadrupling CO₂. It is a laboratory test of the model, not a forecast of the real world.",
    isProjection: false,
    color: "warning",
    icon: "i-lucide-flask-conical",
  },
};

/**
 * Resolve an experiment's declared class id (from experiment-config.json) to its
 * full definition. A missing or unrecognised id falls back to `idealised`, the
 * safe default: it is visibly marked as *not* a projection, so nothing is ever
 * silently presented as a forecast.
 */
export function resolveExperimentClass(
  id: ExperimentClassId | undefined,
): ExperimentClass {
  return (id && EXPERIMENT_CLASSES[id]) || EXPERIMENT_CLASSES.idealised;
}

/** The classes present in a set of experiments, in display order. */
const CLASS_ORDER: ExperimentClassId[] = [
  "projection",
  "historical",
  "baseline",
  "idealised",
];

/** The distinct classes present among the given class ids, in display order. */
export function experimentClassesPresent(
  ids: (ExperimentClassId | undefined)[],
): ExperimentClass[] {
  const present = new Set(ids.map((id) => resolveExperimentClass(id).id));
  return CLASS_ORDER.filter((id) => present.has(id)).map(
    (id) => EXPERIMENT_CLASSES[id],
  );
}
