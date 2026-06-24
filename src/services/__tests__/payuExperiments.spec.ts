import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  formatServiceUnits,
  loadPayuExperiments,
  normalizePayuExperiment,
  calculateYearsRun,
} from "../payuExperiments";
import type { PayuExperimentRaw } from "../payuExperiments";

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
  it("maps raw fields to the normalised view model", () => {
    const result = normalizePayuExperiment(BASE_RAW);

    expect(result.name).toBe("test-run");
    expect(result.uuid).toBe("abc-123");
    expect(result.modelStartTime).toBe("0101-01-01T00:00:00");
    expect(result.modelCurrentTime).toBe("0275-01-01T00:00:00");
    expect(result.serviceUnitsDisplay).toBe("42");
    expect(result.yearsRun).toBe(174);
  });

  it("includes all raw fields in details for forward compatibility", () => {
    const raw: PayuExperimentRaw = {
      ...BASE_RAW,
      some_future_field: "value",
    };
    const result = normalizePayuExperiment(raw);

    expect(result.details).toMatchObject({ some_future_field: "value" });
  });

  it("details is a copy and does not share a reference with the raw object", () => {
    const raw = { ...BASE_RAW };
    const result = normalizePayuExperiment(raw);

    raw.experiment_name = "mutated";
    expect(result.details["experiment_name"]).toBe("test-run");
  });
});

describe("loadPayuExperiments", () => {
  const API_URL = "http://test-api/experiments/";
  const mockResults: PayuExperimentRaw[] = [BASE_RAW];

  beforeEach(() => {
    vi.stubEnv("VITE_PAYU_CMIP7_API_URL", API_URL);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("fetches from VITE_PAYU_CMIP7_API_URL and returns normalised experiments", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResults,
      }),
    );
    const result = await loadPayuExperiments();
    expect(fetch).toHaveBeenCalledWith(API_URL);
    expect(result).toHaveLength(mockResults.length);
    expect(result[0]).toHaveProperty("name");
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
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
