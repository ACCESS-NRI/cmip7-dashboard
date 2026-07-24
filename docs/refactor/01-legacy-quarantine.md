# Subplan 01 — Quarantine dormant code in `legacy/`

Read `00-overview.md` first. The hard rule (zero functionality changes) and the
verification protocol there apply throughout.

## Background

A prototype "Under the hood" section was hidden from the dashboard (PR #44,
commit 8d3716a "Minor updates to CSS and wording & hide under the hood
section"). That left a large slice of the codebase unmounted but still living
alongside the live code, which badly hurts greppability: a maintainer reading
`app/services/` today cannot tell that the whole DuckDB/parquet stack serves
nothing.

The team's decision is to **park this code, not delete it** — it may return.
Parked code is moved **verbatim** (no refactoring, no improvements) into a
top-level `legacy/` directory that Nuxt does not scan, with a README explaining
what it is and how to revive it. Its tests move with it and keep running
(vitest picks up `**/*.spec.ts` project-wide, so no vitest config change is
needed).

## Inventory of dormant code (verified by grep — nothing imports these outside
the group itself and their own specs)

The dormant dependency chain, root to leaf:

- `app/components/DummyClimatePlot.client.vue` — 463-line prototype chart
  (Chart.js line plot with a hand-rolled axis zoom/pan plugin). Mounted on no
  page and referenced by no markdown content.
- `app/composables/useDummyClimatePlot.ts` — chart-data shaping for the plot.
- `app/services/cmip7PlotData.ts` — picks x/y columns from parquet rows.
- `app/services/cmip7Source.ts` — resolves the parquet source from runtime
  config.
- `app/services/dataSource.ts` — DuckDB-WASM parquet loading/querying.
- `app/services/duckdbClient.ts` — DuckDB-WASM init/teardown.
- `app/services/acacia.ts` — rewrites `s3://` URLs to the Pawsey Acacia HTTPS
  endpoint.

Separately orphaned (from the same hidden section):

- `app/components/DetailLevelPicker.vue` — sidebar detail-level menu; mounted
  nowhere.
- `app/composables/useDetailLevel.ts` — shared detail-level state; consumed
  only by `DetailLevelPicker.vue`.

## Steps

### 1. Create the legacy tree and move files with `git mv`

Use `git mv` so history follows the files. Target layout:

```
legacy/
  README.md                                  (new — see step 4)
  components/
    DummyClimatePlot.client.vue
    DetailLevelPicker.vue
    __tests__/
      DummyClimatePlot.spec.ts
      DummyClimatePlot.zoom.spec.ts
      DetailLevelPicker.spec.ts
  composables/
    useDummyClimatePlot.ts
    useDetailLevel.ts
    __tests__/
      useDummyClimatePlot.spec.ts
      useDetailLevel.spec.ts
  services/
    acacia.ts
    cmip7PlotData.ts
    cmip7Source.ts
    dataSource.ts
    duckdbClient.ts
    __tests__/
      acacia.spec.ts
      cmip7PlotData.spec.ts
      dataSource.spec.ts
```

Source paths are the same names under `app/components/`, `app/composables/`,
`app/services/` and their `__tests__/` folders. There is no spec for
`cmip7Source.ts` or `duckdbClient.ts` — that's expected.

### 2. Fix imports inside the moved files and specs

Moved files currently import each other via the `~/` alias (which points at
`app/`). Rewrite those to **relative** paths within `legacy/`, e.g. in
`DummyClimatePlot.client.vue`:

- `~/composables/useDummyClimatePlot` → `../composables/useDummyClimatePlot`
- `~/services/cmip7PlotData` → `../services/cmip7PlotData`
- (same pattern for `cmip7Source`, `dataSource`)

Do the same in the moved specs (they import the modules under test and, in the
component specs, the component). Imports of npm packages (`chart.js`,
`vue-chartjs`, `@duckdb/duckdb-wasm`, `vue`) are unchanged. Do not change one
line of implementation logic while doing this.

Note: `DetailLevelPicker.vue` and `DummyClimatePlot.client.vue` use Nuxt
auto-imports (`computed`, Nuxt UI components like `UNavigationMenu`/`UIcon`,
and `useDetailLevel`). Their specs run in the Nuxt test environment
(`@vitest-environment nuxt` pragma at the top of the spec), which still
resolves Nuxt UI components at mount time. What no longer resolves outside
`app/` is the auto-import of the moved *composables*: add an explicit relative
import (e.g. `import { useDetailLevel } from "../composables/useDetailLevel";`
in `DetailLevelPicker.vue`) if the file does not already import it explicitly.
`cmip7Source.ts` calls `useRuntimeConfig()` bare — add
`import { useRuntimeConfig } from "#imports";` only if typecheck or its
(nonexistent) consumers demand it; since nothing in `app/` imports it anymore,
prefer leaving the file byte-identical and see whether `npm run lint` passes.
If vue-tsc fails on legacy files, the fallback is to exclude `legacy/` from
typechecking via a `typescript.tsConfig.exclude` entry — but try without first
and report which was needed.

### 3. Confirm nothing live references the moved files

`grep -rn "DummyClimatePlot\|useDummyClimatePlot\|cmip7PlotData\|cmip7Source\|dataSource\|duckdbClient\|acacia\|DetailLevelPicker\|useDetailLevel" app/`
must return nothing (except unrelated words — read the matches). The
`cmip7ParquetSource` / `cmip7ParquetFileName` runtime-config keys in
`nuxt.config.ts` **stay** — add a one-line comment there noting they serve the
parked plot in `legacy/`.

### 4. Write `legacy/README.md`

Contents (write it properly, not as bullets-of-bullets):

- What this directory is: unmounted code parked deliberately, still
  unit-tested, excluded from the Nuxt app build because it lives outside
  `app/` (Nuxt only scans `app/` for components/composables/pages).
- Per-piece inventory: the DummyClimatePlot chart + its pipeline (what each of
  the 7 files does, in one line each), and the DetailLevelPicker +
  useDetailLevel pair. Why they were parked (the "Under the hood" section was
  hidden in PR #44).
- How to revive the plot: move files back under `app/`, restore `~/` imports,
  mount `<DummyClimatePlot />` on a page; the `NUXT_PUBLIC_CMIP7_PARQUET_*`
  env vars / runtime-config keys still exist.
- A revival to-do: `DummyClimatePlot.client.vue` contains a ~250-line inline
  Chart.js axis-zoom/pan plugin (`axisZoomPlugin` + its handlers). If revived,
  extract that plugin into its own module with tests before building on it.

### 5. Small in-place cleanups in live code

These were explicitly approved; call them out in the PR description:

- `app/components/GitCommit.vue`: delete the unused copy-to-clipboard
  machinery — `copied`, `copiedTimer`, `copyCommitSha`, the
  `onBeforeUnmount` cleanup, and the now-unused `ref`/`onBeforeUnmount`
  imports if they become unused. Nothing in the template references any of it
  (verify with grep before and after). Template is untouched.
- `app/components/ExperimentCard.vue`: **keep** the `overview` variant (it is
  a designed API that content may use again), but its file docstring (added
  here or in subplan 05) must state that only `variant="status"` is currently
  used, by `app/pages/index.vue`.
- `package.json`: remove dependencies `maplibre-gl`, `proj4`,
  `@carbonplan/zarr-layer` — zero references anywhere in the repo. Run
  `npm install` to update the lockfile. Do **not** remove `better-sqlite3`
  (@nuxt/content's SQLite driver), `chart.js`, or `vue-chartjs` (used by the
  parked plot and its still-running specs).

### 6. Verify

Run the full verification protocol from `00-overview.md`. Additionally:
`npx vitest run` must still report **157 tests / 26 files** — the legacy specs
still run from their new location. Also run `npm run build` once to prove the
production build works without the removed deps.
