/**
 * Experiment participation tiers (issue #21).
 *
 * A second axis, orthogonal to the scientific taxonomy in `experimentClass.ts`.
 * Where the taxonomy answers "is this a real-world projection?", the tiers
 * answer "what role does this experiment play in CMIP7's structure?":
 *
 *  - DECK — the foundational baseline experiments every CMIP7 model runs. The
 *    bedrock that makes models comparable at all.
 *  - AFT (Assessment Fast Track) — a curated, high-priority subset layered on
 *    top of DECK to feed policy assessment sooner.
 *
 * These are stacked, related-but-distinct layers: an experiment can be DECK,
 * AFT, both, or neither. Membership is declared explicitly in
 * `public/experiment-config.json` (`deck`/`aft` booleans) — it is not derivable
 * from the name — and this module holds only the tier *definitions*.
 *
 * REF (Rapid Evaluation Framework) is deliberately NOT a tier here: it is an
 * evaluation-status dimension, not an experiment-membership one, so it lives in
 * its own component (`EvaluationStatus.vue`) rather than as a badge alongside
 * these.
 */

export type ExperimentTierId = "deck" | "aft";

export interface ExperimentTier {
  id: ExperimentTierId;
  /** Full label for badges and legends, e.g. "Assessment Fast Track". */
  label: string;
  /** Compact label for tight spaces, e.g. "AFT". */
  shortLabel: string;
  /** Plain-language, no-CMIP-knowledge-required description. */
  description: string;
  /** DECK is the foundational layer that AFT (and everything else) builds on. */
  foundational: boolean;
  /** Nuxt UI colour used for the badge / accent. */
  color: "secondary" | "success";
  /** Lucide icon name for the badge. */
  icon: string;
}

/** Membership flags as declared per experiment in experiment-config.json. */
export interface ExperimentTierMembership {
  deck?: boolean;
  aft?: boolean;
}

export const EXPERIMENT_TIERS: Record<ExperimentTierId, ExperimentTier> = {
  deck: {
    id: "deck",
    label: "DECK",
    shortLabel: "DECK",
    description:
      "A foundational simulation set every CMIP7 model runs. This shared baseline is what makes different models comparable in the first place.",
    foundational: true,
    color: "secondary",
    icon: "i-lucide-layers",
  },
  aft: {
    id: "aft",
    label: "Assessment Fast Track",
    shortLabel: "AFT",
    description:
      "A high-priority simulation fast-tracked to feed climate assessment sooner. Layered on top of the DECK foundation, not a replacement for it.",
    foundational: false,
    color: "success",
    icon: "i-lucide-zap",
  },
};

/** Tiers ordered from foundational (DECK) outward (AFT). */
const TIER_ORDER: ExperimentTierId[] = ["deck", "aft"];

/**
 * The tiers a single experiment belongs to, in stacking order (DECK before
 * AFT). An experiment with neither flag returns an empty list — a valid state
 * (e.g. a MIP-specific diagnostic that is part of no headline layer).
 */
export function experimentTiers(
  membership: ExperimentTierMembership,
): ExperimentTier[] {
  return TIER_ORDER.filter((id) => membership[id]).map(
    (id) => EXPERIMENT_TIERS[id],
  );
}

/**
 * The distinct tiers present across a set of experiments' resolved tiers, in
 * stacking order — used to render the legend with only the layers actually on
 * screen.
 */
export function experimentTiersPresent(
  perExperiment: ExperimentTier[][],
): ExperimentTier[] {
  const present = new Set<ExperimentTierId>();
  for (const tiers of perExperiment) {
    for (const tier of tiers) present.add(tier.id);
  }
  return TIER_ORDER.filter((id) => present.has(id)).map(
    (id) => EXPERIMENT_TIERS[id],
  );
}
