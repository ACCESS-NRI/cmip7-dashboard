import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as experimentConfigModule from "../experimentConfig";
import {
  formatServiceUnits,
  loadPayuExperiments,
  normalizePayuExperiment,
  calculateYearsRun,
  esgfPublishedCount,
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

describe("esgfPublishedCount", () => {
  it("reads a count straight through", () => {
    expect(esgfPublishedCount(4, 10)).toBe(4);
    expect(esgfPublishedCount(0, 10)).toBe(0);
  });

  it("reads legacy booleans as all or nothing", () => {
    expect(esgfPublishedCount(true, 10)).toBe(10);
    expect(esgfPublishedCount(false, 10)).toBe(0);
  });

  it("treats an absent field as nothing published", () => {
    expect(esgfPublishedCount(undefined, 10)).toBe(0);
  });

  it("clamps a count that overshoots the planned ensemble", () => {
    // Better a wrong-looking 10/10 than an impossible 12/10.
    expect(esgfPublishedCount(12, 10)).toBe(10);
    expect(esgfPublishedCount(-1, 10)).toBe(0);
  });
});

describe("normalizePayuExperiment", () => {
  const BASE_CONFIG: ExperimentConfig = {
    uuid: "abc-123",
    name: "test-run",
    description: "Test experiment",
    expected_years_run: 300,
    esgf_published: 0,
  };

  const BASE_PAYU: PayuExperimentRaw = {
    experiment_name: "old-name", // ← ignored; config name is used
    experiment_uuid: "abc-123",
    experiment_model_start_time: "0101-01-01T00:00:00",
    experiment_model_current_time: "0275-01-01T00:00:00",
    experiment_service_units: 42,
  };

  it("uses name from config, not the payu API", () => {
    const result = normalizePayuExperiment(BASE_CONFIG, [BASE_PAYU]);
    expect(result.name).toBe("test-run");
    expect(result.uuid).toBe("abc-123");
  });

  it("uses telemetry from payu when available", () => {
    const result = normalizePayuExperiment(BASE_CONFIG, [BASE_PAYU]);
    expect(result.modelStartTime).toBe("0101-01-01T00:00:00");
    expect(result.modelCurrentTime).toBe("0275-01-01T00:00:00");
    expect(result.yearsRun).toBe(174);
    expect(result.serviceUnitsDisplay).toBe("42");
    expect(result.serviceUnits).toBe(42);
  });

  it("uses fallback values when payu data is undefined", () => {
    const result = normalizePayuExperiment(BASE_CONFIG, []);
    expect(result.modelStartTime).toBe("—");
    expect(result.modelCurrentTime).toBe("—");
    expect(result.yearsRun).toBe(0);
    expect(result.serviceUnitsDisplay).toBe("—");
    expect(result.serviceUnits).toBe(null);
    expect(result.details).toEqual({});
  });

  it("uses config for expectedYearsRun and the ESGF count", () => {
    const result = normalizePayuExperiment(BASE_CONFIG, [BASE_PAYU]);
    expect(result.expectedYearsRun).toBe(300);
    expect(result.esgfPublishedCount).toBe(0);
  });

  it("takes a partial ESGF count from the config", () => {
    const result = normalizePayuExperiment(
      { ...BASE_CONFIG, esgf_published: 4, expected_n_ensembles: 10 },
      [BASE_PAYU],
    );
    expect(result.esgfPublishedCount).toBe(4);
    expect(result.expectedEnsembleCount).toBe(10);
  });

  it("resolves the experiment class from the config class field", () => {
    const result = normalizePayuExperiment(
      { ...BASE_CONFIG, class: "historical" },
      [BASE_PAYU],
    );
    expect(result.experimentClass.id).toBe("historical");
  });

  it("falls back to the idealised class when config declares no class", () => {
    // BASE_CONFIG has no class field.
    const result = normalizePayuExperiment(BASE_CONFIG, [BASE_PAYU]);
    expect(result.experimentClass.id).toBe("idealised");
    expect(result.experimentClass.isProjection).toBe(false);
  });

  it("includes all payu fields in details for forward compatibility", () => {
    const payuData: PayuExperimentRaw = {
      ...BASE_PAYU,
      some_future_field: "value",
    };
    const result = normalizePayuExperiment(BASE_CONFIG, [payuData]);
    expect(result.details).toMatchObject({ some_future_field: "value" });
  });

  it("treats a single-run experiment as an ensemble of one", () => {
    const result = normalizePayuExperiment(BASE_CONFIG, [BASE_PAYU]);
    expect(result.expectedEnsembleCount).toBe(1);
    expect(result.members).toHaveLength(1);
    expect(result.members[0]!.name).toBe("test-run");
    expect(result.members[0]!.uuid).toBe("abc-123");
    expect(result.members[0]!.expectedYearsRun).toBe(300);
  });

  it("has no members when the config records no UUID or related runs", () => {
    const { uuid: _uuid, ...withoutUuid } = BASE_CONFIG;
    const result = normalizePayuExperiment(withoutUuid, [BASE_PAYU]);
    expect(result.members).toEqual([]);
    expect(result.yearsRun).toBe(0);
    expect(result.details).toEqual({});
  });

  describe("related sub-runs", () => {
    // piControl: one experiment whose run is split across two payu UUIDs, with
    // no top-level uuid and no ensemble of its own.
    const RELATED_CONFIG: ExperimentConfig = {
      name: "piControl",
      expected_years_run: 1000,
      esgf_published: 0,
      related_experiments: [
        { name: "PI-CNP-concentrations", uuid: "cnp-1" },
        { name: "Ndep2-PI-CNP-concentrations", uuid: "cnp-2" },
      ],
    };

    const relatedRaw = (
      uuid: string,
      currentYear: string,
    ): PayuExperimentRaw => ({
      experiment_name: "piControl",
      experiment_uuid: uuid,
      experiment_model_start_time: "0001-01-01T00:00:00",
      experiment_model_current_time: `${currentYear}-01-01T00:00:00`,
      experiment_service_units: 100,
    });

    it("sums related sub-runs into a single experiment total", () => {
      const result = normalizePayuExperiment(RELATED_CONFIG, [
        relatedRaw("cnp-1", "0401"), // 400 years
        relatedRaw("cnp-2", "0301"), // 300 years
      ]);

      expect(result.yearsRun).toBe(700);
      expect(result.serviceUnits).toBe(200);
      // Measured against the single experiment's planned length, not doubled.
      expect(result.expectedYearsRun).toBe(1000);
      expect(result.expectedEnsembleCount).toBe(1);
    });

    it("does not fan the related sub-runs out as ensemble members", () => {
      const result = normalizePayuExperiment(RELATED_CONFIG, [
        relatedRaw("cnp-1", "0401"),
      ]);

      // No fan-out: an ensemble of one, with no members exposed to expand.
      expect(result.members).toEqual([]);
      expect(result.esgfPublishedCount).toBe(0);
    });
  });

  describe("ensembles", () => {
    const ENSEMBLE_CONFIG: ExperimentConfig = {
      name: "historical",
      expected_years_run: 172,
      expected_n_ensembles: 3,
      ensembles: [
        { name: "r10i1p1f1", uuid: "uuid-10" },
        { name: "r2i1p1f1", uuid: "uuid-2" },
        { name: "r1i1p1f1", uuid: "uuid-1" },
      ],
    };

    const memberRaw = (
      uuid: string,
      currentYear: string,
      serviceUnits: number,
    ): PayuExperimentRaw => ({
      experiment_name: "historical",
      experiment_uuid: uuid,
      experiment_model_start_time: "1850-01-01T00:00:00",
      experiment_model_current_time: `${currentYear}-01-01T00:00:00`,
      experiment_service_units: serviceUnits,
    });

    const ENSEMBLE_PAYU = [
      memberRaw("uuid-1", "1900", 10),
      memberRaw("uuid-2", "1880", 5),
    ];

    it("sums years run across every member", () => {
      const result = normalizePayuExperiment(ENSEMBLE_CONFIG, ENSEMBLE_PAYU);
      // r1 has run 50 years, r2 30, r10 has no telemetry at all.
      expect(result.yearsRun).toBe(80);
      expect(result.members.map((m) => m.yearsRun)).toEqual([50, 30, 0]);
    });

    it("measures progress against the whole planned ensemble", () => {
      const result = normalizePayuExperiment(ENSEMBLE_CONFIG, ENSEMBLE_PAYU);
      expect(result.expectedYearsRun).toBe(516); // 172 × 3
      expect(result.memberExpectedYearsRun).toBe(172);
      expect(result.expectedEnsembleCount).toBe(3);
    });

    it("orders members by realisation number, not lexically", () => {
      const result = normalizePayuExperiment(ENSEMBLE_CONFIG, ENSEMBLE_PAYU);
      expect(result.members.map((m) => m.name)).toEqual([
        "r1i1p1f1",
        "r2i1p1f1",
        "r10i1p1f1",
      ]);
    });

    it("flags members that have no telemetry yet", () => {
      const result = normalizePayuExperiment(ENSEMBLE_CONFIG, ENSEMBLE_PAYU);
      expect(result.members.map((m) => m.hasTelemetry)).toEqual([
        true,
        true,
        false,
      ]);
    });

    it("sums service units across members", () => {
      const result = normalizePayuExperiment(ENSEMBLE_CONFIG, ENSEMBLE_PAYU);
      expect(result.serviceUnits).toBe(15);
    });

    it("keeps the planned size when no members have been started", () => {
      const result = normalizePayuExperiment(
        { name: "amip", expected_years_run: 43, expected_n_ensembles: 10 },
        [],
      );
      expect(result.members).toEqual([]);
      expect(result.expectedYearsRun).toBe(430);
      expect(result.yearsRun).toBe(0);
      expect(result.serviceUnits).toBe(null);
    });
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
