# `legacy/` — parked, unmounted code

This directory holds code that is **deliberately parked, not deleted**. None of
it is mounted anywhere in the live application: no page renders it and no
markdown content references it. It is kept because it may return.

Because Nuxt only scans `app/` for components, composables, and pages, code
living here is completely excluded from the application build — moving it out of
`app/` is what took it out of the bundle. Its unit tests, however, still run:
Vitest picks up `**/*.spec.ts` across the whole project, so the specs colocated
in the `__tests__/` folders below execute on every `npx vitest run`, exactly as
they did before the move.

Everything here was parked when the prototype **"Under the hood"** section was
hidden from the dashboard (PR #44, commit 8d3716a). Nothing has been refactored
in the move — the files are verbatim apart from rewriting their cross-imports
from the `~/` alias to relative paths, which the alias no longer covers outside
`app/`.

## What's here

### The DummyClimatePlot chart and its data pipeline

A prototype time-series chart that read a remote parquet file via DuckDB-WASM
and drew it with Chart.js. Root-to-leaf:

- `components/DummyClimatePlot.client.vue` — the prototype chart component: a
  Chart.js line plot with a hand-rolled axis zoom/pan plugin.
- `composables/useDummyClimatePlot.ts` — shapes queried rows into the
  Chart.js dataset structure the component renders.
- `services/cmip7PlotData.ts` — picks the x/y columns out of the parquet rows.
- `services/cmip7Source.ts` — resolves the parquet source location from
  runtime config.
- `services/dataSource.ts` — loads and queries a remote parquet file with
  DuckDB-WASM.
- `services/duckdbClient.ts` — initialises and tears down the DuckDB-WASM
  instance.
- `services/acacia.ts` — rewrites `s3://` URLs to the Pawsey Acacia HTTPS
  endpoint so the parquet file can be fetched over the web.

### The DetailLevelPicker

An orphan from the same hidden section — a sidebar control for choosing a
"detail level", together with the shared state it drove:

- `components/DetailLevelPicker.vue` — the sidebar detail-level menu.
- `composables/useDetailLevel.ts` — the shared detail-level state; it was only
  ever consumed by `DetailLevelPicker.vue`.

## Reviving the plot

1. Move the files back under `app/` (`app/components/`, `app/composables/`,
   `app/services/`) and their specs back into the matching `app/**/__tests__/`
   folders.
2. Restore the `~/` alias imports that were rewritten to relative paths on the
   way in (e.g. `../services/dataSource` → `~/services/dataSource`).
3. Mount `<DummyClimatePlot />` on a page. The runtime-config keys it needs —
   `cmip7ParquetSource` / `cmip7ParquetFileName`, fed by the
   `NUXT_PUBLIC_CMIP7_PARQUET_SOURCE` / `NUXT_PUBLIC_CMIP7_PARQUET_FILE_NAME`
   env vars — still exist in `nuxt.config.ts`.

The `chart.js`, `vue-chartjs`, and `@duckdb/duckdb-wasm` dependencies the plot
relies on are still installed (kept for these parked files and their specs).

### Revival to-do

`components/DummyClimatePlot.client.vue` carries a ~250-line inline Chart.js
axis zoom/pan plugin (`axisZoomPlugin` and its handlers). Before building
anything new on top of the plot, extract that plugin into its own module with
its own tests — it is far too large to keep living inside the component.
