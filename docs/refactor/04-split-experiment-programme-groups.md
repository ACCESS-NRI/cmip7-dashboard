# Subplan 04 — Decompose `ExperimentProgrammeGroups.vue`

Read `00-overview.md` first. The hard rule (zero functionality changes) and the
verification protocol there apply throughout. Subplan 01 must be merged; 03 is
recommended first (if it has landed, use the shared `formatNumber` util in the
extracted components; if not, keep the local helper and let 03 clean it up).

## Background

`app/components/ExperimentProgrammeGroups.vue` is 521 lines and carries four
distinct responsibilities: a band-layout algorithm, the group card chrome with
its view-transition open/close, a per-group stats panel, and per-experiment
rows with an ensemble fan-out. Its 519-line spec
(`app/components/__tests__/ExperimentProgrammeGroups.spec.ts`) mounts the
parent and asserts entirely through `data-test` attributes and DOM structure —
which is exactly what lets us split the file safely.

**The spec must pass unmodified.** That is the acceptance test for this whole
subplan. Every `data-test` attribute, class list, aria attribute, and element
nesting must survive the split byte-for-byte.

## Step 1 — Extract the band-layout algorithm to a service

New file `app/services/groupBandLayout.ts` (pure TypeScript, no Vue):

- Move the `GroupMode` type and the body of the `layout` computed into an
  exported pure function:

  ```ts
  export type GroupMode = "open" | "tile" | "strip";
  export interface GroupBand<G extends { id: string }> {
    group: G;
    span: number;
    mode: GroupMode;
  }
  export function layoutGroupBands<G extends { id: string }>(
    groups: readonly G[],
    isOpen: (id: string) => boolean,
  ): GroupBand<G>[]
  ```

  (A generic over `{ id: string }` keeps the service free of a dependency on
  `ExperimentGroup`; if the generic fights the implementing model, a concrete
  `ExperimentGroup` signature importing from `./experimentGroups` is
  acceptable.)
- Move the excellent existing comments (the "bands over a six-column grid"
  explanation and the "run of closed groups" note) with the code.
- The component's `layout` computed becomes
  `computed(() => layoutGroupBands(groups.value, isOpen))`.
- New spec `app/services/__tests__/groupBandLayout.spec.ts` covering: all
  closed (3 groups → three spans of 2, mode `tile`); one open (span 6 `open`,
  remaining run splits the row); a lone closed group on its row → `strip`;
  single group total → open span 6 / closed strip.

## Step 2 — Move pure row helpers into the payu service

`hasEnsemble`, `startedMembers`, `pendingMembers` are pure functions of a
`PayuExperiment`. Move them to `app/services/payuExperiments.ts` as named
exports, keeping their doc comments. The component (and the new row component
below) imports them. This makes "what counts as an ensemble / a started
member / a pending member" greppable next to the data model it describes.

`rowKey` and the open/expanded arrays stay in the components (UI concerns).

## Step 3 — Extract two child components

Cut the template into children that receive props and emit events — they own
no state. **Copy the template fragments verbatim**, including comments,
classes, and `data-test` attributes. The parent keeps: the six-column grid
`<section>`, the `v-for` over bands, the `<article>` card chrome (its border
colours, `viewTransitionName`, `data-mode`), the header `<button>`, the
open/expanded state arrays, and `toggleGroup` with its `startViewTransition`
wrapper (the view-transition logic is coupled to the card geometry and stays
with it).

### `app/components/ExperimentGroupStats.vue`

The `<aside>` inside the open panel: the 5-entry `<dl>` (Simulations /
Running / Completed / Not started / Published) and the simulated-years block.

- Props: `summary: ExperimentGroupSummary`.
- Uses `formatNumber` (util if 03 landed, else local const).

### `app/components/ExperimentGroupRow.vue`

One `<li>` of the experiment list: the four-column row (name/explainer +
class badge + `RunProgressBar` + `EsgfStatus`) **and** the ensemble fan-out
`<ul>` with its member rows and the "N further members not started yet" item.

- Props: `groupId: string`, `experiment: PayuExperiment`,
  `post: ContentCollectionItem | null` (the explainer, already resolved by the
  parent), `expanded: boolean`.
- Emits: `toggle` (the parent flips `expandedRows` — expansion state stays
  keyed per group in the parent because the same experiment can appear in two
  groups and must expand independently; keep the existing comment saying so).
- The `rowKey`-derived ids used in `aria-controls` / `:id` /
  `data-test` must produce exactly the same strings as today (pass the key in
  as a prop or rebuild it identically from `groupId` + experiment — same
  `uuid || name` fallback).

The parent's `<li v-for>` becomes
`<ExperimentGroupRow ... @toggle="toggleRow(...)">`. The `explainerFor` lookup
stays in the parent (it owns `postByExperiment`).

Deliberately **not** extracted: the collapsed-card header button (its
tile/strip/open class juggling is inseparable from the band layout the parent
owns) and the glossary footer (3 lines). Do not create components for them.

## Step 4 — Optional: `useToggleList()`

Only if it stays behaviour-identical, extract the repeated
"array-of-open-ids" pattern (`openGroups` + `expandedRows` here;
`openPanels` in `PayuExperimentAccordion.vue` is the same shape but is bound
via `v-model` to `UAccordion` and exposed to tests — **leave the accordion
alone**):

```ts
// app/composables/useToggleList.ts
export function useToggleList(): {
  open: Ref<string[]>;
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
}
```

`toggleGroup`'s view-transition wrapper then calls `toggle` inside its
`apply()`. If wiring this through `startViewTransition` gets awkward, skip
this step entirely — it is a nice-to-have.

## Step 5 — Docstrings

Standard headers (per `00-overview.md`) on: the slimmed
`ExperimentProgrammeGroups.vue` (now describing itself as the
layout/state-owning parent and naming its children), both new child
components, `groupBandLayout.ts`, and updated `Used by:` mentions in
`payuExperiments.ts`'s module header.

## Verify

Full protocol from `00-overview.md`, plus specifically:

- `npx vitest run app/components/__tests__/ExperimentProgrammeGroups.spec.ts`
  passes **without any edit to the spec**.
- In the dev smoke test: open DECK (view transition morphs, neighbours
  reflow), expand an ensemble row (chevron rotates, members list scrolls at
  `max-h-[22rem]`), check a closed lone group renders as a slim strip at
  desktop width, and check mobile width (cards stack, description hidden on
  strips).
- `git diff --stat` sanity: the parent component should shrink by roughly the
  size of the extracted fragments; no template fragment should appear twice.
