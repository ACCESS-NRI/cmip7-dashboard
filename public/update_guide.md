## Updating the Experiment Tracker

All experiments displayed on the dashboard — planned or running — are configured in [`public/experiment-config.json`](experiment-config.json).

## Showing Planned Experiments

To show a planned experiment to the dashboard, we need to add a section to the configuration file, e.g.

```json
 { 
   "name": "abrupt-127k", 
   "description": "-", 
   "expected_years_run": 100, 
   "esgf_published": 0, 
   "class": "idealised", 
   "aft": true 
 } 
```

Where fields are:
- `name` (str): Name of the CMIP7 experiment/s.
- `description` (str): Unused placeholder for one sentence description the experiment.
- `class` (str): Experiment classification. One of "baseline", "idealised", "historical", or "projection".
- `deck` (bool): If true, the experiment is part of DECK. Optional as default is false.
- `aft` (bool): If true, the experiment is part of Assessment Fast Track. Optional as default is false.
- `esgf_published` (int): Number of simulations published to ESGF.
- `expected_years_run` (int): Number of model years expected run by each experiment/ensemble. This is used to calculate progress.
- `expected_n_ensembles` (int): Optional. The target number of ensemble members. This is used to calculate progress.

## Showing Started/Running/Finished Experiments

If only one simulation is being run (not multiple ensembles), when the simulation has started, the `uuid` can then be added as a top level field:

```json
 { 
   "name": "esm-piControl", 
   "uuid": "cfcbc3a9-6f5a-4fa5-b963-24bd050e546b"
 }
```

When ensembles have started running, each ensemble name (e.g. `r10i1p1f1`) and `uuid` can be added to an ensembles array field:

```json
 "ensembles": [ 
   { 
     "name": "r10i1p1f1", 
     "uuid": "aaca3142-20d2-43d4-94ab-c6417fd73f3d" 
   }, 
   { 
     "name": "r2i1p1f1", 
     "uuid": "faef2965-5944-4ffc-b85c-d998285b7960" 
   }
 ]
```

For `piControl`, as the same experiment was run over two different Payu experiments, these were added to a related_experiments array field:

```json
 "related_experiments": [ 
   { 
     "name": "PI-CNP-concentrations", 
     "uuid": "92f372d7-50e3-4aac-b373-99eef3cd85c4" 
   }, 
   { 
     "name": "Ndep2-PI-CNP-concentrations", 
     "uuid": "e523e199-80f6-4ca6-b84a-e513a16f2029" 
   } 
 ]
```

So there should at maximum one top-level field of `uuid`, `ensembles`, or `related_experiments`.

## Verifying changes to configuration

There is a GitHub workflow `.github/workflows/validate-experiment-config.yml` that runs a schema validation check using the schema `public/experiment-config.schema.json`. This runs automatically on any pull request that modifies `public/experiment-config.json`.

## Adding experiments telemetry to a public Tracking Services endpoint

To access the payu telemetry for a given UUID, we need to add the UUID and a name to a CMIP7 Experiments table in the Tracking Services Database. There is a GitHub workflow `.github/workflows/sync-experiments.yml` that adds any new UUIDs to the database. This runs automatically when changes to `experiment-config.json` are merged to `main`, or can be triggered manually on [GitHub UI](https://github.com/ACCESS-NRI/cmip7-dashboard/actions/workflows/sync-experiments.yml). 

This requires two Github secrets:
- `secrets.TS_API_BASE_URL`
- `secrets.TS_API_TOKEN` - Django Token Auth credential that requires view and add permissions to the `cmip7_experiments` table.
