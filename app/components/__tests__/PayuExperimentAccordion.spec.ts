// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import PayuExperimentAccordion from "../PayuExperimentAccordion.vue";
import type { PayuExperiment } from "~/services/payuExperiments";
import { EXPERIMENT_CLASSES } from "~/services/experimentClass";

const MOCK_EXPERIMENTS: PayuExperiment[] = [
  {
    name: "Ndep2-PI-CNP-concentrations",
    uuid: "e523e199-80f6-4ca6-b84a-e513a16f2029",
    modelStartTime: "0101-01-01T00:00:00",
    modelCurrentTime: "0275-01-01T00:00:00",
    serviceUnitsDisplay: "1",
    serviceUnits: 1,
    yearsRun: 174,
    expectedYearsRun: 500,
    esgfPublished: false,
    experimentClass: EXPERIMENT_CLASSES.idealised,
    tiers: [],
    details: {
      experiment_name: "Ndep2-PI-CNP-concentrations",
      experiment_uuid: "e523e199-80f6-4ca6-b84a-e513a16f2029",
      experiment_model_start_time: "0101-01-01T00:00:00",
      experiment_model_current_time: "0275-01-01T00:00:00",
      experiment_service_units_used: 1,
    },
  },
  {
    name: "piControl-spun-up",
    uuid: "f9e8d7c6-fedc-ba98-7654-321012345678",
    modelStartTime: "0001-01-01T00:00:00",
    modelCurrentTime: "0050-01-01T00:00:00",
    serviceUnitsDisplay: "0",
    serviceUnits: 0,
    yearsRun: 49,
    expectedYearsRun: 500,
    esgfPublished: true,
    experimentClass: EXPERIMENT_CLASSES.baseline,
    tiers: [],
    details: {
      experiment_name: "piControl-spun-up",
      experiment_uuid: "f9e8d7c6-fedc-ba98-7654-321012345678",
      experiment_model_start_time: "0001-01-01T00:00:00",
      experiment_model_current_time: "0050-01-01T00:00:00",
      experiment_service_units_used: 0,
    },
  },
];

describe("PayuExperimentAccordion", () => {
  it("renders an accordion trigger for each experiment", async () => {
    const wrapper = await mountSuspended(PayuExperimentAccordion, {
      props: { experiments: MOCK_EXPERIMENTS },
    });

    expect(wrapper.findAll('[data-test="accordion-trigger"]')).toHaveLength(2);
    expect(wrapper.text()).toContain("Ndep2-PI-CNP-concentrations");
    expect(wrapper.text()).toContain("piControl-spun-up");
  });

  it("shows the progress bar when expectedYearsRun is set", async () => {
    const wrapper = await mountSuspended(PayuExperimentAccordion, {
      props: { experiments: [MOCK_EXPERIMENTS[0]!] },
    });

    expect(wrapper.find('[data-test="progress-bar"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("174 / 500 years");
  });

  it("shows the years-run badge when expectedYearsRun is null", async () => {
    const wrapper = await mountSuspended(PayuExperimentAccordion, {
      props: {
        experiments: [{ ...MOCK_EXPERIMENTS[0]!, expectedYearsRun: null }],
      },
    });

    expect(wrapper.find('[data-test="years-run-badge"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="progress-bar"]').exists()).toBe(false);
  });

  it("renders the ESGF checkbox in the header", async () => {
    const wrapper = await mountSuspended(PayuExperimentAccordion, {
      props: { experiments: [MOCK_EXPERIMENTS[0]!] },
    });

    expect(wrapper.find('[data-test="esgf-status"]').exists()).toBe(true);
  });

  it("shows a checked ESGF checkbox when esgfPublished is true", async () => {
    const wrapper = await mountSuspended(PayuExperimentAccordion, {
      props: {
        experiments: [{ ...MOCK_EXPERIMENTS[0]!, esgfPublished: true }],
      },
    });

    const checkbox = wrapper.find('[data-test="esgf-status"] input');
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);
  });

  it("shows an unchecked ESGF checkbox when esgfPublished is false", async () => {
    const wrapper = await mountSuspended(PayuExperimentAccordion, {
      props: {
        experiments: [{ ...MOCK_EXPERIMENTS[0]!, esgfPublished: false }],
      },
    });

    const checkbox = wrapper.find('[data-test="esgf-status"] input');
    expect((checkbox.element as HTMLInputElement).checked).toBe(false);
  });

  it("shows an unchecked ESGF checkbox when esgfPublished is null", async () => {
    const wrapper = await mountSuspended(PayuExperimentAccordion, {
      props: {
        experiments: [{ ...MOCK_EXPERIMENTS[0]!, esgfPublished: null }],
      },
    });

    const checkbox = wrapper.find('[data-test="esgf-status"] input');
    expect((checkbox.element as HTMLInputElement).checked).toBe(false);
  });

  it("renders all detail fields in the panel", async () => {
    const wrapper = await mountSuspended(PayuExperimentAccordion, {
      props: { experiments: [MOCK_EXPERIMENTS[0]!] },
    });

    const content = wrapper.find('[data-test="accordion-content"]');
    expect(content.text()).toContain("experiment name");
    expect(content.text()).toContain("Ndep2-PI-CNP-concentrations");
    expect(content.text()).toContain("experiment service units used");
  });

  it("shows the loading state while data is being fetched", async () => {
    const wrapper = await mountSuspended(PayuExperimentAccordion, {
      props: { experiments: [], loading: true },
    });

    expect(wrapper.find('[data-test="payu-loading"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="payu-accordion"]').exists()).toBe(false);
  });

  it("shows the error state when an error is provided", async () => {
    const wrapper = await mountSuspended(PayuExperimentAccordion, {
      props: {
        experiments: [],
        error: "Network request failed",
      },
    });

    expect(wrapper.find('[data-test="payu-error"]').text()).toContain(
      "Network request failed",
    );
    expect(wrapper.find('[data-test="payu-accordion"]').exists()).toBe(false);
  });

  it("shows the empty state when there are no experiments", async () => {
    const wrapper = await mountSuspended(PayuExperimentAccordion, {
      props: { experiments: [] },
    });

    expect(wrapper.find('[data-test="payu-empty"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="payu-empty"]').text()).toContain(
      "No experiment runs found.",
    );
  });

  it("accepts a custom empty message", async () => {
    const wrapper = await mountSuspended(PayuExperimentAccordion, {
      props: { experiments: [], emptyMessage: "No runs yet." },
    });

    expect(wrapper.find('[data-test="payu-empty"]').text()).toContain(
      "No runs yet.",
    );
  });

  it("starts with no open panels", async () => {
    const wrapper = await mountSuspended(PayuExperimentAccordion, {
      props: { experiments: MOCK_EXPERIMENTS },
    });

    const vm = wrapper.vm as unknown as { openPanels: string[] };
    expect(vm.openPanels).toEqual([]);
  });
});
