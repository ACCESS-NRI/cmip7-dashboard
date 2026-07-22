// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import DashboardHero from "../DashboardHero.vue";
import type { PayuExperiment } from "~/services/payuExperiments";
import { EXPERIMENT_CLASSES } from "~/services/experimentClass";

function makeExperiment(
  overrides: Partial<PayuExperiment> = {},
): PayuExperiment {
  return {
    name: "historical",
    uuid: "uuid-1",
    modelStartTime: "1850-01-01",
    modelCurrentTime: "1900-01-01",
    serviceUnitsDisplay: "100",
    serviceUnits: 100,
    yearsRun: 50,
    expectedYearsRun: 100,
    esgfPublished: false,
    experimentClass: EXPERIMENT_CLASSES.historical,
    tiers: [],
    details: {},
    ...overrides,
  };
}

describe("DashboardHero", () => {
  it("shows the loading state instead of the totals", async () => {
    const wrapper = await mountSuspended(DashboardHero, {
      props: { experiments: [], loading: true, error: null },
    });

    expect(wrapper.find('[data-test="experiments-loading"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-test="experiment-totals"]').exists()).toBe(
      false,
    );
  });

  it("shows the error message when loading failed", async () => {
    const wrapper = await mountSuspended(DashboardHero, {
      props: { experiments: [], loading: false, error: "boom" },
    });

    const error = wrapper.find('[data-test="experiments-error"]');
    expect(error.exists()).toBe(true);
    expect(error.text()).toContain("boom");
  });

  it("shows the empty state when there are no experiments", async () => {
    const wrapper = await mountSuspended(DashboardHero, {
      props: { experiments: [], loading: false, error: null },
    });

    expect(wrapper.find('[data-test="experiments-empty"]').exists()).toBe(true);
  });

  it("renders the totals once experiments are loaded", async () => {
    const wrapper = await mountSuspended(DashboardHero, {
      props: { experiments: [makeExperiment()], loading: false, error: null },
    });

    expect(wrapper.find('[data-test="experiment-totals"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="experiments-empty"]').exists()).toBe(
      false,
    );
  });
});
