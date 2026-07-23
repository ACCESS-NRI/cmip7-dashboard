/**
 * The dashboard's on-page sections, in scroll order. "Big picture" is the
 * always-visible primary content; "Progress" is the collapsible detailed view
 * beneath it. The sidebar nav (SectionNav) and the page's section anchors are
 * both built from this single list, so their ids and labels can never drift
 * apart.
 */
export type SectionId = "big-picture" | "progress";

export interface SectionMeta {
  id: SectionId;
  name: string;
  description: string;
  icon: string;
}

/** Ordered top→bottom to match the page; the scroll-spy nav renders them as-is. */
export const SECTIONS: readonly SectionMeta[] = [
  {
    id: "big-picture",
    name: "Big picture",
    description: "What these experiments are and why they matter",
    icon: "i-lucide-telescope",
  },
  {
    id: "progress",
    name: "Progress",
    description: "How far each simulation has run, at a glance",
    icon: "i-lucide-gauge",
  },
] as const;
