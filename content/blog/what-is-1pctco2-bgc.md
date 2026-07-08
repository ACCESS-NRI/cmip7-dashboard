---
title: "What is the 1pctCO2-bgc experiment?"
description: "The same 1%-a-year CO2 ramp, but only the carbon cycle 'sees' it — isolating how much carbon the land and ocean soak up."
author: "Charles Turner, ACCESS-NRI"
date: "2026-07-08"
experiment: 1pctCO2-bgc
furtherReading:
  - title: "WCRP CMIP — the Coupled Model Intercomparison Project"
    url: "https://wcrp-cmip.org/cmip7/"
  - title: "Jones et al. (2016): C4MIP experimental protocol (defines 1pctCO2-bgc and -rad)"
    url: "https://doi.org/10.5194/gmd-9-2853-2016"
---

**1pctCO2-bgc** is a companion to `1pctCO2` that splits the climate system in
two. The CO2 still rises by 1% every year, but only the **biogeochemistry** —
the carbon cycle — is allowed to notice it. The radiation code is told CO2 is
still at its pre-industrial level, so the climate never actually warms.

## What it does

This is a deliberately artificial trick. By letting plants and the ocean respond
to rising CO2 while keeping the physical climate fixed, we isolate a single
effect: **how much extra carbon the land and ocean draw down purely because there
is more CO2 in the air**, with no warming to complicate it. "bgc" stands for
biogeochemically coupled.

## Why we care

On its own, `1pctCO2-bgc` measures the *concentration–carbon feedback*: the
appetite of natural carbon sinks as CO2 climbs. Paired with its radiatively
coupled twin `1pctCO2-rad`, it lets scientists cleanly separate the two ways CO2
affects the carbon cycle:

- **This run** — more CO2 means more uptake by land and ocean.
- **`1pctCO2-rad`** — a warmer climate weakens that uptake.

Comparing the fully coupled `1pctCO2` against these two idealised halves is how
models quantify carbon–climate feedbacks, which shape the remaining
:jargon[carbon budget]{term="TCRE"}.
