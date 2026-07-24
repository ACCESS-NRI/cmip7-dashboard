# Subplan 03 — Shared formatting utils and near-duplicate documentation

Read `00-overview.md` first. The hard rule (zero functionality changes) and the
verification protocol there apply throughout. Subplan 01 should be merged;
this subplan is independent of 02 and 04.

## Background

Small formatting helpers are re-declared per component, and two pairs of
look-alike code exist that must **not** be merged because their edge-case
behaviour differs. This subplan gives the true duplicates one home and
documents the false duplicates so a future maintainer doesn't "deduplicate"
them into a bug.

## 1. Create `app/utils/format.ts`

Nuxt auto-imports functions from `app/utils/`, so components can call these
without import lines. Standard module docstring per `00-overview.md`.

### `formatNumber`

```ts
/** Locale-aware integer formatting, e.g. 1720 -> "1,720". */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}
```

Replace the three per-component definitions (delete the local helper, keep the
call sites):

- `app/components/ExperimentProgrammeGroups.vue` — `function formatNumber`
- `app/components/ExperimentTotals.vue` — `const formatNumber`
- `app/components/RunProgressBar.vue` — `const formatNumber`

All three are semantically `value.toLocaleString()` with no arguments — output
is identical.

Do **not** touch `ExperimentSummaryCards.vue`: its
`toLocaleString(undefined, { maximumFractionDigits: 2 })` has different
options and stays as-is (it formats fractional service-unit totals).

### `formatPostDate`

`app/components/BlogArticle.vue` and `app/components/BlogItems.vue` both format
dates with `toLocaleDateString("en-AU", { year: "numeric", month: "long",
day: "numeric" })` but differ on missing input: `BlogArticle` returns `""`,
`BlogItems` returns `"Draft"`. Extract one util that preserves both:

```ts
/**
 * Blog byline date in en-AU long form, e.g. "24 July 2026".
 * `fallback` is what a missing/empty date renders as: BlogArticle shows
 * nothing (""), the blog index shows "Draft".
 */
export function formatPostDate(value?: string, fallback = ""): string {
  if (!value) return fallback;
  return new Date(value).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
```

Call sites: `BlogArticle.vue` uses `formatPostDate(post.date)`;
`BlogItems.vue` uses `formatPostDate(post.date, "Draft")`. Delete the local
helpers. Rendered output must be identical for every input (verify against the
existing `BlogArticle.spec.ts`).

## 2. Document — do NOT merge — the two percent computations

`app/components/ExperimentProgress.vue` computes:

```ts
props.expectedYearsRun ? Math.min(100, Math.round(...)) : null
```

while `app/services/experimentGroups.ts` `experimentProgressPercent` guards
with `expectedYearsRun === null`. These look interchangeable but are not:
when `expectedYearsRun === 0`, the component's truthy check yields `null`
(renders the plain years badge) whereas the service function would divide by
zero. **Leave both implementations exactly as they are.** Add to each a short
comment/docstring note explaining the difference and cross-referencing the
other, so the next reader knows the non-unification is deliberate.

## 3. Document — do NOT merge — the two progress-bar components

`app/components/RunProgressBar.vue` (used by the programme-group rows and
ensemble member rows; horizontal bar + trailing percent, `compact` mode,
completion turns it green) and `app/components/ExperimentProgress.vue` (used by
`PayuExperimentAccordion` and `ExperimentCard`; stacked label-over-bar with the
"across N members" caption, no completion colour). They render differently and
serve different layouts. Give each the standard docstring, and in each,
explicitly name the other with one line on why they are separate components.

## 4. Docstrings for touched files

Every file modified in this subplan ends up with the standard header from
`00-overview.md` (the new util module, the four components whose helpers were
removed, and the two documented pairs).

## Verify

Full protocol from `00-overview.md`. The specs most sensitive to this change:
`BlogArticle.spec.ts`, `ExperimentTotals.spec.ts`,
`ExperimentProgrammeGroups.spec.ts` — all must pass unmodified.
