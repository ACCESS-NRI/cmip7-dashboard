import type { ExperimentClassId } from "./experimentClass";

export interface ExperimentConfig {
  uuid: string;
  name: string;
  description?: string;
  expected_years_run: number;
  esgf_published?: boolean;
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
