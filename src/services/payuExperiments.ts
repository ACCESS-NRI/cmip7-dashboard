/** Raw shape produced by the Payu experiment API / CLI output. */
export interface PayuExperimentRaw {
  experiment_name: string;
  experiment_uuid: string;
  experiment_model_start_time: string;
  experiment_model_current_time: string;
  /** Direct service-units figure; may be absent while a run is in progress. */
  experiment_service_units_used?: number | null;
  /** Fallback CPU-time value used when service units are not yet calculated. */
  experiment_resources_used_cput?: number | null;
  /** Any additional fields forwarded transparently to the UI. */
  [key: string]: unknown;
}

/** Normalised view model consumed by the accordion component. */
export interface PayuExperiment {
  name: string;
  uuid: string;
  modelStartTime: string;
  modelCurrentTime: string;
  serviceUnitsDisplay: string;
  /** All original key/value pairs for the expanded details panel. */
  details: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

/**
 * Produces a human-readable service-units string. Isolating this logic means
 * the calculation strategy can be updated in one place without touching the
 * component.
 */
export function formatServiceUnits(raw: PayuExperimentRaw): string {
  if (raw.experiment_service_units != null) {
    return String(raw.experiment_service_units);
  }
  if (raw.experiment_resources_used_cput != null) {
    return `${raw.experiment_resources_used_cput} (CPU-T)`;
  }
  return "—";
}

export function normalizePayuExperiment(
  raw: PayuExperimentRaw,
): PayuExperiment {
  return {
    name: raw.experiment_name,
    uuid: raw.experiment_uuid,
    modelStartTime: raw.experiment_model_start_time,
    modelCurrentTime: raw.experiment_model_current_time,
    serviceUnitsDisplay: formatServiceUnits(raw),
    details: { ...raw },
  };
}


// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------


export async function loadPayuExperiments(): Promise<PayuExperiment[]> {
  const url = import.meta.env.VITE_PAYU_CMIP7_API_URL;
  if (!url) {
    throw new Error("VITE_PAYU_CMIP7_API_URL is not configured");
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch experiments: ${response.status}`);
  }
  const data: PayuExperimentRaw[] = await response.json();
  return data.map(normalizePayuExperiment);
}
