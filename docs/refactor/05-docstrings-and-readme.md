# Subplan 05 — Docstring sweep and README rewrite

Read `00-overview.md` first — especially the "Docstring directive" section,
which defines the exact header format this subplan applies. Run this subplan
**last**: it covers every file subplans 01–04 did not already bring up to
standard.

## Part 1 — Docstring sweep

Bring every remaining live component/composable/service up to the standard
header (HTML comment for `.vue`, JSDoc for `.ts`, each with a `Used by:`
line). Most files already have a good header comment — the work is usually
just moving it to the top of the file (for `.vue` files whose comment sits
above `<template>` mid-file), shaping it, and adding `Used by:`. **Keep the
existing prose; do not rewrite good comments into worse ones.** No code
changes in this subplan — comments and README only.

Checklist of files expected to need attention (skip any a previous subplan
already brought to standard; add any it missed):

Components (`app/components/`):

- `AppSidebar.vue`, `SectionNav.vue`, `DetailSection.vue` — have good
  comments; shape + `Used by:`.
- `DashboardHero.vue`, `ExperimentTotals.vue`, `ExperimentSummaryCards.vue` —
  note in `ExperimentTotals.vue` the existing HARDCODED PLACEHOLDER comment
  about the 0 GB data-volume tile must survive verbatim.
- `ExperimentCard.vue` — must state that only `variant="status"` is currently
  used (see subplan 01), by `app/pages/index.vue`.
- `PayuExperimentAccordion.vue` — used only by `pages/embed/experiments.vue`;
  the docstring should say this is the embed/iframe view of the experiment
  list (the dashboard proper uses `ExperimentProgrammeGroups`).
- `RunProgressBar.vue`, `ExperimentProgress.vue` — done in subplan 03; verify.
- `EsgfStatus.vue`, `EvaluationStatus.vue`, `ExperimentClassBadge.vue`,
  `ExperimentTierBadge.vue`, `ExperimentClassLegend.vue`,
  `ExperimentTierLegend.vue`, `ExperimentExplainer.vue`, `FurtherReading.vue`,
  `GitCommit.vue`, `BlogArticle.vue`, `BlogItems.vue`,
  `content/Jargon.vue`.

Composables (`app/composables/`): `sections.ts`, `useActiveSection.ts`,
`useGlossary.ts`, `useSiteNav.ts`, plus any created by subplan 02.

Services (`app/services/`): `experimentClass.ts`, `experimentConfig.ts`,
`experimentGroups.ts`, `experimentTier.ts`, `payuExperiments.ts` — these
already have strong module docs; add `Used by:` lines and confirm shape.

Pages and layouts get lighter treatment (they are routes, discoverable by
path): a 1–3 line comment at the top of each `<script setup>` saying what the
route shows and where its data comes from, if not already present. Files:
`app/pages/index.vue`, `glossary.vue`, `blog/index.vue`, `blog/[...slug].vue`,
`embed/blog/[...slug].vue`, `embed/experiments.vue`,
`embed/experiments-summary.vue`, `app/layouts/default.vue`,
`app/layouts/embed.vue`, `app/app.vue`.

Accuracy check for every `Used by:` line: grep the component/function name and
list what actually references it *at the time of writing*. Do not guess.

## Part 2 — Rewrite `README.md`

The current README is stale: it calls the project a "Vue 3 + TypeScript + Vite
dashboard scaffold" and documents `VITE_*` env vars that no longer exist (the
app migrated to Nuxt; config now uses `NUXT_PUBLIC_*` runtime-config keys —
see `nuxt.config.ts`).

New README contents, in order:

1. **What this is** — a Nuxt 4 dashboard tracking ACCESS-NRI's CMIP7
   simulation campaign: live payu telemetry merged over
   `public/experiment-config.json`, plus a blog and glossary driven by
   @nuxt/content. Deployed as a static site on GitHub Pages under
   `/cmip7-dashboard/`.
2. **Stack** — Nuxt 4, @nuxt/ui (+ Tailwind 4), @nuxt/content, vitest +
   @nuxt/test-utils, PostHog analytics.
3. **Directory tour** — the paragraph-per-directory architecture map from
   `docs/refactor/00-overview.md` (pages / components / composables /
   services / content / public / legacy / docs). Keep it terse; link to
   `legacy/README.md`.
4. **Data sources** — `public/experiment-config.json` as the source of truth
   (fields: uuid, name, expected_years_run, esgf_published, class, deck/aft,
   expected_n_ensembles, ensembles, related_experiments — one line each, or
   point at the documented interface in `app/services/experimentConfig.ts`);
   the payu telemetry API (`NUXT_PUBLIC_PAYU_CMIP7_API_URL`, best-effort — the
   dashboard renders from config alone when unset/unreachable).
5. **Environment variables** — `NUXT_PUBLIC_PAYU_CMIP7_API_URL`,
   `NUXT_PUBLIC_POSTHOG_KEY`, `NUXT_PUBLIC_POSTHOG_HOST`, and the parked
   `NUXT_PUBLIC_CMIP7_PARQUET_SOURCE` / `NUXT_PUBLIC_CMIP7_PARQUET_FILE_NAME`
   (marked as serving `legacy/` code only). Delete every `VITE_*` mention.
6. **Content authoring** — how to add a blog post (markdown file in
   `content/blog/` with `title`/`description`/`date`/`author` frontmatter;
   optional `experiment` to attach it to an experiment as its explainer;
   optional `furtherReading` links) and a glossary term (YAML file in
   `content/glossary/`, schema in `content.config.ts`, usable inline via the
   `<Jargon>` component).
7. **Commands** — dev/build/generate/preview, `npm test`, `npm run lint`,
   `npm run format`.
8. **Maintenance** — one short paragraph pointing at `docs/refactor/` (the
   refactor plans, deletable once executed) and the docstring convention: every
   component/composable/service opens with a header explaining what it does
   and who uses it.

## Verify

Full protocol from `00-overview.md`. Since this subplan changes only comments
and markdown, `git diff` must show **no changes to code lines** — review the
diff for accidental edits (a good check: `npx vitest run` result and the built
output are identical to before). Prettier formats markdown: run
`npm run format` before the final `npm run lint`.
