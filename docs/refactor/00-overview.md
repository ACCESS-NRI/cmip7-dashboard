# CMIP7 Dashboard maintainability refactor — overview

This document is the top-level plan for a refactor of this repository. It is
intended to be given to the implementing model **together with exactly one of
the numbered subplans** (`01-…` to `05-…`) per work session. Read this file in
full before starting any subplan.

## Why this refactor exists

The site was built quickly and organically. It works, and its test suite is
healthy, but the team now needs to maintain it long-term. The goals are:

1. **Smaller, single-purpose components** — no 500-line `.vue` files.
2. **Composables for repeated page logic** — the standard Nuxt pattern.
3. **Greppability** — a maintainer should be able to find where anything lives
   from a name or a `data-test` attribute, and know what is live vs. parked.
4. **Docstrings everywhere** — every component/composable/service opens with a
   header a human can read to get up to speed (see "Docstring directive").

## The hard rule: zero functionality changes

This is a behaviour-preserving refactor. Concretely, all of the following must
be true after every subplan:

- Rendered DOM structure, CSS classes, and every `data-test` attribute are
  unchanged.
- Component props, emits, and `defineExpose` surfaces are unchanged.
- Runtime-config keys in `nuxt.config.ts` and all network calls are unchanged.
- No new npm dependencies.
- Existing test **assertions are never edited**. The only permitted change to
  an existing spec file is updating an import path when the module it imports
  physically moved (subplan 01) — and only 01 moves files.
- The full suite passes: `npx vitest run` (baseline: 157 tests, 26 files, all
  green) and `npm run lint` (prettier check + vue-tsc) is clean.

If a step in a subplan cannot be done without breaking one of these rules,
**stop and report the conflict** rather than improvising.

## Architecture map (current state)

- `app/pages/` — routes. Pages own data fetching (payu experiments, content
  queries) and pass results down as props. `pages/embed/*` are bare,
  iframe-embeddable variants using the `embed` layout.
- `app/components/` — presentational components; state is passed in as props
  except for purely local UI state (open/closed panels). `components/content/`
  holds components usable from markdown via MDC (`Jargon`).
- `app/services/` — plain TypeScript, no Vue: payu telemetry normalisation
  (`payuExperiments.ts`), grouping/summary maths (`experimentGroups.ts`), the
  experiment class/tier taxonomies (`experimentClass.ts`,
  `experimentTier.ts`), config loading (`experimentConfig.ts`). Unit-tested
  directly.
- `app/composables/` — Vue/Nuxt-aware shared logic (`useGlossary`,
  `useActiveSection`, `useSiteNav`) plus the section metadata (`sections.ts`).
- `content/` — @nuxt/content sources: blog posts (`content/blog/*.md`, schema
  in `content.config.ts`) and the glossary (`content/glossary/*.yml`).
- `public/experiment-config.json` — the source of truth for which experiments
  exist, their expected years/ensembles, class, and tier flags. Live payu
  telemetry is merged onto it by UUID at runtime.
- `legacy/` — (created by subplan 01) parked code that is not mounted anywhere
  but may return. Documented in `legacy/README.md`. Its tests still run.
- Tests are colocated in `__tests__/` directories and rely heavily on
  `data-test` attributes — this is the safety net that proves behaviour is
  preserved. Treat `data-test` values as a public API.

## Docstring directive

Every `.vue` component and every `.ts` file under `app/components/`,
`app/composables/`, and `app/services/` (and everything moved to `legacy/`)
must open with a header block so a human can get up to speed without reading
the implementation.

For `.vue` files — an HTML comment as the very first lines of the file:

```html
<!--
  ComponentName — one-line purpose.

  A short paragraph (2–6 lines): what it renders, what state it owns vs. what
  the parent owns, and anything surprising a maintainer needs to know.

  Used by: app/pages/index.vue, app/components/SomeParent.vue
-->
```

For `.ts` files — a JSDoc block as the very first lines of the module:

```ts
/**
 * moduleName — one-line purpose.
 *
 * A short paragraph: what it does, what it deliberately does not do, and any
 * invariants (e.g. "pure functions only, no Vue imports").
 *
 * Used by: app/components/Foo.vue, app/pages/index.vue
 */
```

Rules:

- The `Used by:` line lists direct consumers (components/pages/services). If a
  component is only reached via auto-import from templates, grep for its name
  to find them. Write `Used by: (currently unmounted — see legacy/README.md)`
  where that is the truth.
- Many files already carry excellent header comments. **Do not rewrite or
  discard them** — fold them into the standard shape, keeping their content.
  Never delete existing inline comments in function bodies or templates.
- Docstrings describe what IS, not the history of the refactor. Never write
  "moved from X" or "extracted during refactor".

## Verification protocol (run after every subplan)

1. `npx vitest run` — full suite green, no skipped tests.
2. `npm run lint` — prettier check and vue-tsc both clean. If prettier
   complains, run `npm run format` and re-check.
3. `npm run dev` smoke test in a browser:
   - Dashboard loads; hero shows totals.
   - Open and close a programme group card (DECK); expand an ensemble row
     inside it; the view-transition animation still fires.
   - Open the "Progress" detailed view section; cards render.
   - Hover a highlighted jargon term (e.g. ESGF) — popover appears.
   - Visit `/glossary` (search works) and `/blog` (posts list, one opens).
   - Visit `/embed/experiments` — accordion renders without site chrome.

## Subplans

Execute in this order; each is an independent PR-sized unit of work:

| # | File | What | Depends on |
|---|------|------|-----------|
| 01 | `01-legacy-quarantine.md` | Move dead/dormant code to `legacy/`, prune unused deps | — |
| 02 | `02-page-composables.md` | Extract duplicated page logic into composables | 01 |
| 03 | `03-shared-utils.md` | Shared formatting utils; document near-duplicate pairs | 01 |
| 04 | `04-split-experiment-programme-groups.md` | Decompose the 521-line groups component | 01 (03 recommended first) |
| 05 | `05-docstrings-and-readme.md` | Docstring sweep for untouched files; rewrite README | 01–04 |

Subplans 02, 03, 04 touch disjoint areas except that 04's new components should
use the `formatNumber` util if 03 has already landed (each subplan states what
to do in either case).
