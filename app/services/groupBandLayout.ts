/**
 * groupBandLayout — arranges programme groups into rows over a six-column grid.
 *
 * Pure functions only, no Vue imports. Given the groups in display order and a
 * predicate for which are open, it returns a band per group carrying the column
 * span and the presentation mode (open panel / shared tile / lone strip). The
 * caller maps span to Tailwind classes and mode to card chrome.
 *
 * Used by: app/components/ExperimentProgrammeGroups.vue
 */

/**
 * How a card presents itself: `open` is the expanded panel, `tile` a card sharing
 * its row with another closed group, `strip` a closed group alone on its row.
 */
export type GroupMode = "open" | "tile" | "strip";

export interface GroupBand<G extends { id: string }> {
  group: G;
  span: number;
  mode: GroupMode;
}

/**
 * Lays the groups out as bands over a six-column grid: each open group takes a full
 * row, and each run of consecutive closed groups splits a row evenly between them.
 * That keeps the vertical order intact — opening DECK expands it above Scenarios and
 * Other, which close ranks into a two-up row. A closed group left alone on its row
 * renders as a slim strip rather than a stretched, mostly-empty tile.
 */
export function layoutGroupBands<G extends { id: string }>(
  groups: readonly G[],
  isOpen: (id: string) => boolean,
): GroupBand<G>[] {
  const bands: GroupBand<G>[] = [];

  for (let index = 0; index < groups.length;) {
    const group = groups[index]!;

    if (isOpen(group.id)) {
      bands.push({ group, span: 6, mode: "open" });
      index += 1;
      continue;
    }

    // Take the whole run of closed groups: they share one row between them.
    let end = index;
    while (end < groups.length && !isOpen(groups[end]!.id)) end += 1;

    const run = groups.slice(index, end);
    for (const closed of run) {
      bands.push({
        group: closed,
        span: 6 / run.length,
        mode: run.length === 1 ? "strip" : "tile",
      });
    }
    index = end;
  }

  return bands;
}
