import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as experimentConfigModule from "../experimentConfig";
import {
  formatServiceUnits,
  loadPayuExperiments,
  normalizePayuExperiment,
  calculateYearsRun,
} from "../payuExperiments";
import type { PayuExperimentRaw } from "../payuExperiments";
import type { ExperimentConfig } from "../experimentConfig";

mockNuxtImport("useRuntimeConfig", () => () => ({ app: { baseURL: "/" } }));

const BASE_RAW: PayuExperimentRaw = {
  experiment_name: "test-run",
  experiment_uuid: "abc-123",
  experiment_model_start_time: "0101-01-01T00:00:00",
  experiment_model_current_time: "0275-01-01T00:00:00",
  experiment_service_units: 42,
};

describe("formatServiceUnits", () => {
  it("uses experiment_service_units when present", () => {
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

  it("uses name from config, not the payu API", () => {
    const result = normalizePayuExperiment(BASE_CONFIG, BASE_PAYU);
    expect(result.name).toBe("test-run");
    expect(result.uuid).toBe("abc-123");
  });

  it("uses telemetry from payu when available", () => {
    const result = normalizePayuExperiment(BASE_CONFIG, BASE_PAYU);
    expect(result.modelStartTime).toBe("0101-01-01T00:00:00");
    expect(result.modelCurrentTime).toBe("0275-01-01T00:00:00");
    expect(result.yearsRun).toBe(174);
    expect(result.serviceUnitsDisplay).toBe("42");
  });

  it("uses fallback values when payu data is undefined", () => {
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

  it("resolves the experiment class from the config class field", () => {
    const result = normalizePayuExperiment(
      { ...BASE_CONFIG, class: "historical" },
      BASE_PAYU,
    );
    expect(result.experimentClass.id).toBe("historical");
  });

  it("falls back to the idealised class when config declares no class", () => {
    // BASE_CONFIG has no class field.
    const result = normalizePayuExperiment(BASE_CONFIG, BASE_PAYU);
    expect(result.experimentClass.id).toBe("idealised");
    expect(result.experimentClass.isProjection).toBe(false);
  });

  it("includes all payu fields in details for forward compatibility", () => {
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
    vi.spyOn(experimentConfigModule, "loadExperimentConfig").mockResolvedValue(
      CONFIG,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const stubFetch = (payuResponse: unknown) =>
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => Promise.resolve(payuResponse)),
    );

  it("iterates config and looks up payu telemetry by UUID", async () => {
    stubFetch({ ok: true, json: async () => PAYU_DATA });

    const result = await loadPayuExperiments(API_URL);
    expect(fetch).toHaveBeenCalledWith(API_URL);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("test-run");
    expect(result[0]!.uuid).toBe("abc-123");
    expect(result[0]!.yearsRun).toBe(174);
    expect(result[0]!.expectedYearsRun).toBe(300);
  });

  it("returns experiments from config even if payu data is missing", async () => {
    stubFetch({ ok: true, json: async () => [] });

    const result = await loadPayuExperiments(API_URL);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("test-run");
    expect(result[0]!.modelStartTime).toBe("—");
    expect(result[0]!.yearsRun).toBe(0);
  });

  it("falls back to config-only experiments when the payu API errors", async () => {
    stubFetch({ ok: false, status: 500 });

    const result = await loadPayuExperiments(API_URL);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("test-run");
    expect(result[0]!.yearsRun).toBe(0);
  });

  it("falls back to config-only experiments when the payu API is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network down"))),
    );

    const result = await loadPayuExperiments(API_URL);
    expect(result).toHaveLength(1);
    expect(result[0]!.serviceUnitsDisplay).toBe("—");
  });

  it("skips the telemetry fetch when the API URL is not configured", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await loadPayuExperiments("");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("test-run");
  });

  it("throws when the experiment config cannot be loaded", async () => {
    vi.spyOn(experimentConfigModule, "loadExperimentConfig").mockRejectedValue(
      new Error("Failed to load experiment config: 404"),
    );
    stubFetch({ ok: true, json: async () => PAYU_DATA });

    await expect(loadPayuExperiments(API_URL)).rejects.toThrow(
      "experiment config",
    );
  });
});
