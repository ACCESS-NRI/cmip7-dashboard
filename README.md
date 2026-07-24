# CMIP7 Dashboard

A [Nuxt 4](https://nuxt.com/) dashboard tracking the progress of ACCESS-NRI's
CMIP7 simulation campaign. Live [payu](https://payu.readthedocs.io/) telemetry is
merged over a static config (`public/experiment-config.json`) to show how far each
experiment has run, alongside a blog and glossary driven by
[@nuxt/content](https://content.nuxt.com/). It is deployed as a static site on
GitHub Pages under `/cmip7-dashboard/`.

## Stack

- **Nuxt 4** (Vue 3 + TypeScript, static generation)
- **@nuxt/ui** with **Tailwind CSS 4**
- **@nuxt/content** for the blog and glossary
- **vitest** + **@nuxt/test-utils** for the test suite
- **PostHog** for analytics

## Directory tour

- `app/pages/` — routes. Pages own data fetching (payu experiments, content
  queries) and pass results down as props. `pages/embed/*` are bare,
  iframe-embeddable variants using the `embed` layout.
- `app/components/` — presentational components; state is passed in as props
  except for purely local UI state (open/closed panels). `components/content/`
  holds components usable from markdown via MDC (`Jargon`).
- `app/composables/` — Vue/Nuxt-aware shared logic (`useGlossary`,
  `useActiveSection`, `useSiteNav`, the payu/blog/embed loaders) plus the section
  metadata (`sections.ts`).
- `app/services/` — plain TypeScript, no Vue: payu telemetry normalisation
  (`payuExperiments.ts`), grouping/summary maths (`experimentGroups.ts`), the
  experiment class/tier taxonomies (`experimentClass.ts`, `experimentTier.ts`),
  config loading (`experimentConfig.ts`). Unit-tested directly.
- `app/utils/` — tiny auto-imported formatting helpers (`format.ts`).
- `content/` — @nuxt/content sources: blog posts (`content/blog/*.md`) and the
  glossary (`content/glossary/*.yml`). Schemas live in `content.config.ts`.
- `public/` — static assets, including `experiment-config.json` (see below).
- `legacy/` — parked code that is not mounted anywhere but may return. See
  [`legacy/README.md`](legacy/README.md).
- `docs/refactor/` — the maintainability refactor plans (deletable once
  executed).

Every component, composable, and service opens with a header comment saying what
it does and who uses it — read that before diving into the implementation.

## Data sources

**`public/experiment-config.json`** is the source of truth for which experiments
exist and what is expected of them. Live payu telemetry is merged onto it by UUID
at runtime. Each entry's fields (fully typed and documented on the
`ExperimentConfig` interface in `app/services/experimentConfig.ts`):

- `uuid` — the run's payu UUID, for experiments that are a single run.
- `name` — experiment name (e.g. `historical`).
- `expected_years_run` — model years the experiment is expected to run.
- `esgf_published` — how many ensemble members are published to ESGF (a boolean
  from older configs still loads).
- `class` — scientific taxonomy class (issue #14); missing resolves to the
  conservative `idealised` default.
- `deck` / `aft` — participation-tier flags (issue #21); independent booleans.
- `expected_n_ensembles` — planned ensemble size; absent means a single run.
- `ensembles` — the ensemble members that exist, each with its own UUID.
- `related_experiments` — sub-runs summed into this experiment's totals (e.g.
  piControl's concentration runs), not treated as an ensemble.

**Payu telemetry API** (`NUXT_PUBLIC_PAYU_CMIP7_API_URL`) supplies the live
run progress. It is best-effort: when the variable is unset or the endpoint is
unreachable, the dashboard still renders from the static config alone.

## Environment variables

All runtime config uses Nuxt's `NUXT_PUBLIC_*` convention (see
`nuxt.config.ts`). None are required for the app to render.

- `NUXT_PUBLIC_PAYU_CMIP7_API_URL` — payu telemetry endpoint. Unset → config-only.
- `NUXT_PUBLIC_POSTHOG_KEY` — PostHog project key for analytics.
- `NUXT_PUBLIC_POSTHOG_HOST` — PostHog host.
- `NUXT_PUBLIC_CMIP7_PARQUET_SOURCE` — **parked**: serves only the
  `legacy/` DummyClimatePlot code (see [`legacy/README.md`](legacy/README.md)).
- `NUXT_PUBLIC_CMIP7_PARQUET_FILE_NAME` — **parked**: as above.

## Content authoring

**Add a blog post** — drop a markdown file in `content/blog/`. Frontmatter:
`title`, `description`, `date`, `author`. Optional `experiment` attaches the post
to a CMIP7 experiment as its dashboard explainer (it still appears in the `/blog`
feed). Optional `furtherReading` is a list of `{ title, url }` links. No code
change is needed — the page exists as soon as the file does.

**Add a glossary term** — add a YAML file in `content/glossary/` (the file stem
becomes the anchor slug). Schema in `content.config.ts`: `term`, optional
`expansion`, `short`, `long`, optional `aliases`, optional `links`. Terms are
usable inline anywhere via the `<Jargon term="…">` component (including in
markdown via MDC).

## Commands

```sh
npm install          # install dependencies
npm run dev          # start the dev server
npm run build        # build for production
npm run generate     # pre-render the static site (GitHub Pages)
npm run preview      # preview the production build
npm test             # run the vitest suite
npm run lint         # prettier check + vue-tsc typecheck
npm run format       # apply prettier
```

## Maintenance

The refactor plans under `docs/refactor/` describe the structure this codebase
was brought to and can be deleted once fully executed. The convention they
establish: every component, composable, and service opens with a header
explaining what it does and who uses it (`Used by:`) — keep it accurate when you
change who calls what.
