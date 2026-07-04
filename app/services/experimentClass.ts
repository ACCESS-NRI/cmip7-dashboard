/**
 * Experiment taxonomy (issue #14).
 *
 * The dashboard is broadening beyond scientist users, so it must never let a
 * non-specialist mistake an idealised/diagnostic run (e.g. `abrupt-4xCO2`) for a
 * policy-facing climate projection. Every experiment is sorted into one class
 * with plain-language framing and — critically — an explicit `isProjection`
 * flag so the UI can mark non-projection runs as such.
 *
 * Classification is derived from the experiment name so it needs no change to
 * the external experiment-config.json or the tracking-services API. The default
 * for an unrecognised name is the conservative one: treat it as NOT a
 * projection, so a new experiment can never *silently* be presented as one.
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
 * Ordered name-matching rules. The first match wins, so more specific rules
 * come first. An experiment that matches nothing falls through to `idealised`,
 * which is the safe default: it is visibly marked as *not* a projection.
 */
const RULES: { test: RegExp; classId: ExperimentClassId }[] = [
  // Policy-facing scenarios (none in the current config, but future-proofed so
  // real projections light up the emphasised treatment automatically).
  { test: /^(ssp|scenario|rcp)/i, classId: "projection" },
  // Fixed-SST radiative-forcing diagnostics are idealised, even the "Control"
  // member of the family — catch them before the piControl baseline rule.
  { test: /^piClim/i, classId: "idealised" },
  // Pre-industrial control: the quiet baseline.
  { test: /piControl/i, classId: "baseline" },
  // Reconstructions / evaluations of the observed record.
  { test: /(historical|amip)/i, classId: "historical" },
];

/**
 * Classify a CMIP7 experiment by name. Case-insensitive; unknown names are
 * treated as idealised (i.e. explicitly not a projection).
 */
export function classifyExperiment(name: string): ExperimentClass {
  for (const rule of RULES) {
    if (rule.test.test(name)) return EXPERIMENT_CLASSES[rule.classId];
  }
  return EXPERIMENT_CLASSES.idealised;
}

/** The classes present in a set of experiments, in display order. */
const CLASS_ORDER: ExperimentClassId[] = [
  "projection",
  "historical",
  "baseline",
  "idealised",
];

export function experimentClassesPresent(names: string[]): ExperimentClass[] {
  const present = new Set(names.map((n) => classifyExperiment(n).id));
  return CLASS_ORDER.filter((id) => present.has(id)).map(
    (id) => EXPERIMENT_CLASSES[id],
  );
}
