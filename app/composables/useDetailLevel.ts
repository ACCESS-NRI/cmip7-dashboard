import type { Ref } from "vue";

/**
 * Detail levels for the dashboard, from the gentlest on-ramp (0) to the raw
 * telemetry (2). The picker and the experiment cards both read this so
 * changing the level reframes every card at once.
 */
export type DetailLevel = 0 | 1 | 2;

export interface DetailLevelMeta {
  value: DetailLevel;
  name: string;
  description: string;
}

/** Ordered low→high so index === level; the picker builds its entries from this. */
export const DETAIL_LEVELS: readonly DetailLevelMeta[] = [
  {
    value: 0,
    name: "Big picture",
    description: "What these experiments are and why they matter",
  },
  {
    value: 1,
    name: "Progress",
    description: "How far each experiment has run, at a glance",
  },
  {
    value: 2,
    name: "Under the hood",
    description: "Full run telemetry and derived plots",
  },
] as const;

/**
 * Shared, navigation-persistent detail level. Backed by `useState` so the
 * picker and every card stay in sync and the choice survives route changes.
 */
export function useDetailLevel(): Ref<DetailLevel> {
  return useState<DetailLevel>("detail-level", () => 0);
}
