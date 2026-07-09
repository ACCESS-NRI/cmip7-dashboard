// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import ExperimentTotals from "../ExperimentTotals.vue";
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

describe("ExperimentTotals", () => {
  it("sums years done and planned across experiments", async () => {
    const wrapper = await mountSuspended(ExperimentTotals, {
      props: {
        experiments: [
          makeExperiment({ yearsRun: 50, expectedYearsRun: 100 }),
          makeExperiment({
            name: "piControl",
            yearsRun: 30,
            expectedYearsRun: 300,
          }),
        ],
      },
    });

    // 80 done of 400 planned = 20% across 2 experiments
    expect(wrapper.text()).toContain("80");
    expect(wrapper.text()).toContain("400");
    expect(wrapper.find('[data-test="totals-progress"]').text()).toContain(
      "20% complete across 2 experiments",
    );
  });

  it("sums service units used and counts completed experiments", async () => {
    const wrapper = await mountSuspended(ExperimentTotals, {
      props: {
        experiments: [
          // completed: yearsRun >= expectedYearsRun
          makeExperiment({
            serviceUnits: 1200,
            yearsRun: 100,
            expectedYearsRun: 100,
          }),
          // running, and one experiment with no telemetry service units
          makeExperiment({
            name: "piControl",
            serviceUnits: null,
            yearsRun: 30,
            expectedYearsRun: 300,
          }),
        ],
      },
    });

    const extra = wrapper.find('[data-test="totals-extra"]');
    expect(extra.text()).toContain("1,200");
    expect(extra.text()).toContain("Service units used");
    expect(extra.text()).toContain("Experiments completed");
    // 1 of 2 experiments completed
    expect(extra.text()).toContain("1");
    expect(extra.text()).toContain("2");
  });

  it("ignores experiments with no expected years when computing progress", async () => {
    const wrapper = await mountSuspended(ExperimentTotals, {
      props: {
        experiments: [makeExperiment({ yearsRun: 10, expectedYearsRun: null })],
      },
    });

    // No planned total → no percentage, just the experiment count.
    expect(wrapper.find('[data-test="totals-progress"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("Across 1 experiments");
  });
});
