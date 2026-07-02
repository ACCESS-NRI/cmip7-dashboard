export interface ExperimentConfig {
  uuid: string;
  name: string;
  description?: string;
  expected_years_run: number;
  esgf_published?: boolean;
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
