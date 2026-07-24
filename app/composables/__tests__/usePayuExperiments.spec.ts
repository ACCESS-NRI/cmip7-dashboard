// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { usePayuExperiments } from "../usePayuExperiments";
import {
  loadPayuExperiments,
  type PayuExperiment,
} from "~/services/payuExperiments";

vi.mock("~/services/payuExperiments", () => ({
  loadPayuExperiments: vi.fn(),
}));

const loadMock = vi.mocked(loadPayuExperiments);

const API_URL = "https://api.example/experiments";
mockNuxtImport("useRuntimeConfig", () => () => ({
  public: { payuCmip7ApiUrl: API_URL },
}));

// A couple of experiments are enough — the composable does not inspect them.
const EXPERIMENTS = [
  { name: "exp-1" },
  { name: "exp-2" },
] as unknown as PayuExperiment[];

// Capture the live return so `.value` reads the ref, not a template proxy.
let api: ReturnType<typeof usePayuExperiments>;

const Harness = defineComponent({
  setup() {
    api = usePayuExperiments();
    return () => h("div");
  },
});

afterEach(() => {
  loadMock.mockReset();
});

describe("usePayuExperiments", () => {
  it("starts loading with the documented initial values", async () => {
    // A never-resolving load keeps the composable in its initial state.
    loadMock.mockReturnValue(new Promise(() => {}));

    await mountSuspended(Harness);

    expect(api.loading.value).toBe(true);
    expect(api.experiments.value).toEqual([]);
    expect(api.error.value).toBeNull();
  });

  it("loads experiments from the configured URL and clears loading", async () => {
    loadMock.mockResolvedValue(EXPERIMENTS);

    await mountSuspended(Harness);

    await vi.waitFor(() => expect(api.loading.value).toBe(false));
    expect(loadMock).toHaveBeenCalledWith(API_URL);
    expect(api.experiments.value).toEqual(EXPERIMENTS);
    expect(api.error.value).toBeNull();
  });

  it("surfaces an Error's message and stops loading on failure", async () => {
    loadMock.mockRejectedValue(new Error("network down"));

    await mountSuspended(Harness);

    await vi.waitFor(() => expect(api.loading.value).toBe(false));
    expect(api.error.value).toBe("network down");
    expect(api.experiments.value).toEqual([]);
  });

  it("falls back to a generic message when the rejection is not an Error", async () => {
    loadMock.mockRejectedValue("boom");

    await mountSuspended(Harness);

    await vi.waitFor(() => expect(api.loading.value).toBe(false));
    expect(api.error.value).toBe("Failed to load experiments.");
  });
});
