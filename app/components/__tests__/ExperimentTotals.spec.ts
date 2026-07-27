// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import ExperimentTotals from "../ExperimentTotals.vue";
import type {
  PayuExperiment,
  PayuExperimentMember,
} from "~/services/payuExperiments";
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
    memberExpectedYearsRun: 100,
    expectedEnsembleCount: 1,
    members: [],
    esgfPublishedCount: 0,
    experimentClass: EXPERIMENT_CLASSES.historical,
    tiers: [],
    details: {},
    ...overrides,
  };
}

function makeMember(name: string, yearsRun: number): PayuExperimentMember {
  return {
    name,
    uuid: `uuid-${name}`,
    modelStartTime: "1850-01-01",
    modelCurrentTime: "1900-01-01",
    serviceUnitsDisplay: "10",
    serviceUnits: 10,
    yearsRun,
    expectedYearsRun: 100,
    hasTelemetry: yearsRun > 0,
    details: {},
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
      "20% complete across 2 simulations",
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
    expect(extra.text()).toContain("CPU Hours used");
    expect(extra.text()).toContain("Simulations completed");
    // 1 of 2 experiments completed
    expect(extra.text()).toContain("1");
    expect(extra.text()).toContain("2");
  });

  it("counts each ensemble member as its own simulation", async () => {
    const wrapper = await mountSuspended(ExperimentTotals, {
      props: {
        experiments: [
          makeExperiment({
            name: "esm-historical",
            expectedEnsembleCount: 4,
            expectedYearsRun: 400,
            yearsRun: 344,
            members: [
              makeMember("r1i1p1f1", 100),
              makeMember("r2i1p1f1", 100),
              makeMember("r3i1p1f1", 100),
              makeMember("r4i1p1f1", 44),
            ],
          }),
          makeExperiment({ name: "abrupt-4xCO2", yearsRun: 0 }),
        ],
      },
    });

    // 3 of the ensemble's 4 members are done, alongside one single run that is
    // not — 3 of 5 simulations, not 0 of 2 experiments.
    expect(wrapper.find('[data-test="totals-progress"]').text()).toContain(
      "69% complete across 5 simulations",
    );
    const extra = wrapper.find('[data-test="totals-extra"]');
    expect(extra.text().replace(/\s+/g, " ")).toContain("3 / 5");
  });

  // Asserts the placeholder on purpose: this should fail loudly, as a prompt to
  // update it, the day a real data-volume figure is wired in.
  it("shows the hardcoded published data volume in GB", async () => {
    const wrapper = await mountSuspended(ExperimentTotals, {
      props: { experiments: [makeExperiment()] },
    });

    const published = wrapper.find('[data-test="totals-published"]');
    expect(published.text()).toContain("Data published");
    expect(published.text()).toContain("0");
    expect(published.text()).toContain("GB");
  });

  it("ignores experiments with no expected years when computing progress", async () => {
    const wrapper = await mountSuspended(ExperimentTotals, {
      props: {
        experiments: [makeExperiment({ yearsRun: 10, expectedYearsRun: null })],
      },
    });

    // No planned total → no percentage, just the experiment count.
    expect(wrapper.find('[data-test="totals-progress"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("Across 1 simulations");
  });
});
