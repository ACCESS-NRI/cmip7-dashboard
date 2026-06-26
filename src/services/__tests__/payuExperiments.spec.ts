import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  formatServiceUnits,
  loadPayuExperiments,
  normalizePayuExperiment,
  calculateYearsRun,
} from "../payuExperiments";
import type { PayuExperimentRaw } from "../payuExperiments";
import type { ExperimentConfig } from "../experimentConfig";

const BASE_RAW: PayuExperimentRaw = {
  experiment_name: "test-run",
  experiment_uuid: "abc-123",
  experiment_model_start_time: "0101-01-01T00:00:00",
  experiment_model_current_time: "0275-01-01T00:00:00",
  experiment_service_units: 42,
};

describe("formatServiceUnits", () => {
  it("uses experiment_service_units_used when present", () => {
    expect(
      formatServiceUnits({ ...BASE_RAW, experiment_service_units: 7 }),
    ).toBe("7");
  });

  it("uses experiment_resources_used_cput when service units are null", () => {
    expect(
      formatServiceUnits({
        ...BASE_RAW,
        experiment_service_units: null,
        experiment_resources_used_cput: 99.5,
      }),
    ).toBe("99.5 (CPU-T)");
  });

  it("returns an em-dash when both fields are absent", () => {
    const raw: PayuExperimentRaw = {
      experiment_name: "x",
      experiment_uuid: "y",
      experiment_model_start_time: "0001-01-01T00:00:00",
      experiment_model_current_time: "0002-01-01T00:00:00",
    };
    expect(formatServiceUnits(raw)).toBe("—");
  });
});

describe("calculateYearsRun", () => {
  it("returns the difference in years between start and current time", () => {
    // BASE_RAW: 0101 → 0275 = 174 years
    expect(calculateYearsRun(BASE_RAW)).toBe(174);
  });

  it("returns 0 when start and current year are the same", () => {
    expect(
      calculateYearsRun({
        ...BASE_RAW,
        experiment_model_current_time: "0101-06-01T00:00:00",
      }),
    ).toBe(0);
  });
});

describe("normalizePayuExperiment", () => {
  const BASE_CONFIG: ExperimentConfig = {
    uuid: "abc-123",
    name: "test-run",
    description: "Test experiment",
    expected_years_run: 300,
    esgf_published: false,
  };

  const BASE_PAYU: PayuExperimentRaw = {
    experiment_name: "old-name", // ← ignored; config name is used
    experiment_uuid: "abc-123",
    experiment_model_start_time: "0101-01-01T00:00:00",
    experiment_model_current_time: "0275-01-01T00:00:00",
    experiment_service_units: 42,
  };

  it("uses name from config, not Payu API", () => {
    const result = normalizePayuExperiment(BASE_CONFIG, BASE_PAYU);
    expect(result.name).toBe("test-run");
    expect(result.uuid).toBe("abc-123");
  });

  it("uses telemetry from Payu when available", () => {
    const result = normalizePayuExperiment(BASE_CONFIG, BASE_PAYU);
    expect(result.modelStartTime).toBe("0101-01-01T00:00:00");
    expect(result.modelCurrentTime).toBe("0275-01-01T00:00:00");
    expect(result.yearsRun).toBe(174);
    expect(result.serviceUnitsDisplay).toBe("42");
  });

  it("uses fallback values when Payu data is undefined", () => {
    const result = normalizePayuExperiment(BASE_CONFIG, undefined);
    expect(result.modelStartTime).toBe("—");
    expect(result.modelCurrentTime).toBe("—");
    expect(result.yearsRun).toBe(0);
    expect(result.serviceUnitsDisplay).toBe("—");
    expect(result.details).toEqual({});
  });

  it("uses config for expectedYearsRun and esgfPublished", () => {
    const result = normalizePayuExperiment(BASE_CONFIG, BASE_PAYU);
    expect(result.expectedYearsRun).toBe(300);
    expect(result.esgfPublished).toBe(false);
  });

  it("includes all Payu fields in details for forward compatibility", () => {
    const payuData: PayuExperimentRaw = {
      ...BASE_PAYU,
      some_future_field: "value",
    };
    const result = normalizePayuExperiment(BASE_CONFIG, payuData);
    expect(result.details).toMatchObject({ some_future_field: "value" });
  });
});

describe("loadPayuExperiments", () => {
  const API_URL = "http://test-api/experiments/";
  const CONFIG: ExperimentConfig[] = [
    {
      uuid: "abc-123",
      name: "test-run",
      expected_years_run: 300,
      esgf_published: false,
    },
  ];
  const PAYU_DATA: PayuExperimentRaw[] = [
    {
      experiment_name: "old-name",
      experiment_uuid: "abc-123",
      experiment_model_start_time: "0101-01-01T00:00:00",
      experiment_model_current_time: "0275-01-01T00:00:00",
      experiment_service_units: 42,
    },
  ];

  beforeEach(() => {
    vi.stubEnv("VITE_PAYU_CMIP7_API_URL", API_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("iterates config and looks up Payu telemetry by UUID", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url) => {
        if (url === "/experiment-config.json") {
          return Promise.resolve({
            ok: true,
            json: async () => CONFIG,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => PAYU_DATA,
        });
      }),
    );

    const result = await loadPayuExperiments();
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("test-run");
    expect(result[0]!.uuid).toBe("abc-123");
    expect(result[0]!.yearsRun).toBe(174);
    expect(result[0]!.expectedYearsRun).toBe(300);
  });

  it("returns experiments from config even if Payu data is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url) => {
        if (url === "/experiment-config.json") {
          return Promise.resolve({
            ok: true,
            json: async () => CONFIG,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }),
    );

    const result = await loadPayuExperiments();
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("test-run");
    expect(result[0]!.modelStartTime).toBe("—");
    expect(result[0]!.yearsRun).toBe(0);
  });

  it("throws when Payu API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url) => {
        if (url === "/experiment-config.json") {
          return Promise.resolve({
            ok: true,
            json: async () => CONFIG,
          });
        }
        return Promise.resolve({ ok: false, status: 500 });
      }),
    );

    await expect(loadPayuExperiments()).rejects.toThrow("500");
  });

  it("throws when VITE_PAYU_CMIP7_API_URL is not set", async () => {
    vi.stubEnv("VITE_PAYU_CMIP7_API_URL", "");
    await expect(loadPayuExperiments()).rejects.toThrow(
      "VITE_PAYU_CMIP7_API_URL",
    );
  });
});
