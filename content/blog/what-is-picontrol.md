---
title: "What is the piControl experiment?"
description: "A long, stable simulation of a pre-industrial world that acts as the quiet baseline for every other run."
author: "Charles Turner, ACCESS-NRI"
date: "2026-07-02"
experiment: piControl
furtherReading:
  - title: "WCRP CMIP — the Coupled Model Intercomparison Project"
    url: "https://wcrp-cmip.org/cmip7/"
  - title: "Eyring et al. (2016): CMIP6 experimental design and organisation (defines the DECK, including piControl)"
    url: "https://doi.org/10.5194/gmd-9-1937-2016"
---

**piControl** — pre-industrial control — is a long simulation of the climate as
it was *before* large-scale human influence, with greenhouse gases, aerosols and
land use all held fixed at their roughly-1850 levels.

## What it does

Nothing is changed once the run starts. The forcings are constant, so the
climate simply settles into its own natural rhythm and drifts only very slowly.
These runs are long — often a thousand model years or more — precisely because
we want to see that natural, unforced variability play out over centuries.

## Why we care

piControl is the **reference point** for almost everything else on this
dashboard:

- Other experiments (like `historical` or `abrupt-4xCO2`) branch off from it, so
  their results are read as a *departure* from this quiet baseline.
- It tells us how much a climate can wobble on its own, which is how we judge
  whether a change in another run is a real signal or just noise.
- A stable piControl with little drift is a basic sign the model is behaving.

It is one of the core :jargon[DECK]{term="DECK"} experiments that every
:jargon[CMIP]{term="CMIP"} model runs, which is what lets results be compared
across models and across CMIP generations.
