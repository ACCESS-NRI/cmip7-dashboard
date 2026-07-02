import { describe, expect, it, vi, afterEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { loadExperimentConfig } from "../experimentConfig";
import type { ExperimentConfig } from "../experimentConfig";

const { baseURL } = vi.hoisted(() => ({ baseURL: { value: "/" } }));

mockNuxtImport("useRuntimeConfig", () => () => ({
  app: { baseURL: baseURL.value },
}));

const CONFIG: ExperimentConfig[] = [
  {
    uuid: "abc-123",
    name: "test-run",
    expected_years_run: 300,
    esgf_published: false,
  },
];

describe("loadExperimentConfig", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    baseURL.value = "/";
  });

  it("fetches the config relative to the app base URL", async () => {
    baseURL.value = "/cmip7-dashboard/";
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: async () => CONFIG })),
    );

    const result = await loadExperimentConfig();
    expect(fetch).toHaveBeenCalledWith(
      "/cmip7-dashboard/experiment-config.json",
    );
    expect(result).toEqual(CONFIG);
  });

  it("fetches from the root when the base URL is /", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: async () => CONFIG })),
    );

    await loadExperimentConfig();
    expect(fetch).toHaveBeenCalledWith("/experiment-config.json");
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false, status: 404 })),
    );

    await expect(loadExperimentConfig()).rejects.toThrow("404");
  });
});
