---
title: "First look at global mean surface temperature"
description: "An early look at the global mean surface temperature anomaly from the latest CMIP7 runs."
date: "2026-06-20"
author: "ACCESS-NRI"
---

# First look at global mean surface temperature

The dashboard now pulls global mean surface temperature (`tas`) from the latest
parquet output. This is an early, prototype signal — expect the source and
processing to change as runs progress.

## What you're looking at

The plot on the [dashboard](/) shows the `tas` anomaly over time, loaded directly
in the browser from the parquet source via DuckDB-WASM. You can zoom with the
mouse wheel, pan by dragging, and double-click to reset.

| Field | Value |
| ----- | ----- |
| Variable | `tas` (near-surface air temperature) |
| Source | `gm_tas.pq` |
| Loader | DuckDB-WASM (client side) |

## Next steps

- Wire up additional derived indicators such as TCRE.
- Replace the prototype source with the canonical CMIP7 catalogue entry.

If you have a CMIP7 update to share, see
[Welcome to CMIP7 updates](/blog/welcome-to-cmip7-updates) for how to publish one.
