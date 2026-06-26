export interface ExperimentConfig {
  uuid: string;
  name: string;
  description?: string;
  expected_years_run: number;
  esgf_published?: boolean;
}

export async function loadExperimentConfig(): Promise<ExperimentConfig[]> {
    const basePath = import.meta.env.BASE_URL;
    const response = await fetch(`${basePath}experiment-config.json`);
    if (!response.ok) {
        throw new Error(`Failed to load experiment config: ${response.status}`);
    }
    return response.json() as Promise<ExperimentConfig[]>;
}
