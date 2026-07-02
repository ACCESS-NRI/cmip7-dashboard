import { loadExperimentConfig } from "./experimentConfig";
import type { ExperimentConfig } from "./experimentConfig";

/** Raw shape produced by the Payu experiment API / CLI output. */
export interface PayuExperimentRaw {
  experiment_name: string;
  experiment_uuid: string;
  experiment_model_start_time: string;
  experiment_model_current_time: string;
  /** Direct service-units figure; may be absent while a run is in progress. */
  experiment_service_units?: number | null;
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
  yearsRun: number;
  expectedYearsRun: number | null;
  esgfPublished: boolean | null;
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

/** Model years run, derived from the start/current model time years. */
export function calculateYearsRun(raw: PayuExperimentRaw): number {
  const startYear = parseInt(raw.experiment_model_start_time.slice(0, 4), 10);
  const currentYear = parseInt(
    raw.experiment_model_current_time.slice(0, 4),
    10,
  );
  return currentYear - startYear;
}

export function normalizePayuExperiment(
  configEntry: ExperimentConfig,
  payuData: PayuExperimentRaw | undefined,
): PayuExperiment {
  return {
    name: configEntry.name,
    uuid: configEntry.uuid,
    modelStartTime: payuData?.experiment_model_start_time ?? "—",
    modelCurrentTime: payuData?.experiment_model_current_time ?? "—",
    serviceUnitsDisplay: payuData ? formatServiceUnits(payuData) : "—",
    yearsRun: payuData ? calculateYearsRun(payuData) : 0,
    expectedYearsRun: configEntry.expected_years_run,
    esgfPublished: configEntry.esgf_published ?? null,
    details: payuData ? { ...payuData } : {},
  };
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

/**
 * Build the dashboard experiment list. The experiment-config.json is the source
 * of truth for which experiments to show (including ones that have not run yet);
 * live payu telemetry from the tracking-services API is matched in by UUID.
 *
 * The API endpoint is supplied by the caller (from
 * `useRuntimeConfig().public.payuCmip7ApiUrl`) so the loader stays unit-testable.
 */
export async function loadPayuExperiments(
  apiUrl: string,
): Promise<PayuExperiment[]> {
  if (!apiUrl) {
    throw new Error("payuCmip7ApiUrl is not configured");
  }

  const [response, config] = await Promise.all([
    fetch(apiUrl),
    loadExperimentConfig().catch(() => [] as ExperimentConfig[]),
  ]);

  if (!response.ok) {
    throw new Error(`Failed to fetch experiments: ${response.status}`);
  }
  const payuData: PayuExperimentRaw[] = await response.json();

  // Iterate over config (source of truth), look up payu telemetry by UUID.
  return config.map((configEntry) => {
    const telemetry = payuData.find(
      (p) => p.experiment_uuid === configEntry.uuid,
    );
    return normalizePayuExperiment(configEntry, telemetry);
  });
}
