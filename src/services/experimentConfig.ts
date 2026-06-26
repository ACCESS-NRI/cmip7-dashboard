export interface ExperimentConfig {
  uuid: string;
  name: string;
  description?: string;
  expected_years_run: number;
  esgf_published?: boolean;
}

export async function loadExperimentConfig(): Promise<ExperimentConfig[]> {
  const response = await fetch("/experiment-config.json");
  if (!response.ok) {
    throw new Error(`Failed to load experiment config: ${response.status}`);
  }
  return response.json() as Promise<ExperimentConfig[]>;
}

export function getExpectedYearsRun(
  config: ExperimentConfig[],
  uuid: string,
): number | null {
  return config.find((c) => c.uuid === uuid)?.expected_years_run ?? null;
}

export function getEsgfPublished(
  config: ExperimentConfig[],
  uuid: string,
): boolean | null {
  return config.find((c) => c.uuid == uuid)?.esgf_published ?? null;
}
