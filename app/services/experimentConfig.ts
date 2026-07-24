import type { ExperimentClassId } from "./experimentClass";

/** A named run with its own payu UUID: one ensemble member of an experiment. */
export interface ExperimentEnsembleMember {
  name: string;
  uuid: string;
}

export interface ExperimentConfig {
  /**
   * The run's UUID, for experiments that are a single run. Ensemble
   * experiments carry a per-member UUID in `ensembles` instead and omit this.
   */
  uuid?: string;
  name: string;
  description?: string;
  expected_years_run: number;
  /**
   * How many ensemble members have been published to ESGF. Booleans from
   * earlier configs still load, since the two representations line up at the
   * ends: `false` is none published, `true` is the whole ensemble.
   */
  esgf_published?: number | boolean;
  /**
   * Scientific taxonomy class (issue #14), declared explicitly per experiment
   * rather than inferred from the name. Optional so older/partial configs still
   * load; a missing value resolves to the conservative `idealised` default.
   */
  class?: ExperimentClassId;
  /**
   * Participation-tier membership (issue #21), declared explicitly per
   * experiment. `deck` marks a foundational baseline experiment; `aft` marks an
   * Assessment Fast Track priority. Both are optional and independent — an
   * experiment can be DECK, AFT, both, or neither. Seeded best-effort and
   * flagged for domain review.
   */
  deck?: boolean;
  aft?: boolean;
  /**
   * How many ensemble members are planned for this experiment (issue #19).
   * Absent means a single run is expected. Members that have actually been
   * started appear in `ensembles`; the two can disagree while a campaign is
   * still spinning up, so progress is measured against this planned count.
   */
  expected_n_ensembles?: number;
  /** Ensemble members that exist, each with its own payu UUID. */
  ensembles?: ExperimentEnsembleMember[];
  /**
   * The same simulation recorded under several UUIDs. Carried through so the
   * config round-trips, but deliberately not interpreted yet — how these should
   * roll up into one figure is still an open question.
   */
  related_experiments?: ExperimentEnsembleMember[];
}

export async function loadExperimentConfig(): Promise<ExperimentConfig[]> {
  // Resolve against the app base URL so it works under the GitHub Pages
  // sub-path (e.g. /cmip7-dashboard/) as well as at the root in dev/tests.
  const basePath = useRuntimeConfig().app.baseURL;
  const response = await fetch(`${basePath}experiment-config.json`);
  if (!response.ok) {
    throw new Error(`Failed to load experiment config: ${response.status}`);
  }
  return response.json() as Promise<ExperimentConfig[]>;
}
