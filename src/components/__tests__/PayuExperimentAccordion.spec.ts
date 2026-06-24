import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import PayuExperimentAccordion from "../PayuExperimentAccordion.vue";
import type { PayuExperiment } from "@/services/payuExperiments";

// Stub PrimeVue accordion components so tests run without a full PrimeVue
// plugin installation, mirroring how DummyClimatePlot stubs vue-chartjs.
vi.mock("primevue/accordion", () => ({
  default: {
    name: "Accordion",
    props: ["value", "multiple"],
    emits: ["update:value"],
    template: '<div data-test="accordion-root"><slot /></div>',
  },
}));
vi.mock("primevue/accordionpanel", () => ({
  default: {
    name: "AccordionPanel",
    props: ["value"],
    template: '<div data-test="accordion-item"><slot /></div>',
  },
}));
vi.mock("primevue/accordionheader", () => ({
  default: {
    name: "AccordionHeader",
    template: '<button data-test="accordion-trigger"><slot /></button>',
  },
}));
vi.mock("primevue/accordioncontent", () => ({
  default: {
    name: "AccordionContent",
    template: '<div data-test="accordion-content"><slot /></div>',
  },
}));

const MOCK_EXPERIMENTS: PayuExperiment[] = [
  {
    name: "Ndep2-PI-CNP-concentrations",
    uuid: "e523e199-80f6-4ca6-b84a-e513a16f2029",
    modelStartTime: "0101-01-01T00:00:00",
    modelCurrentTime: "0275-01-01T00:00:00",
    serviceUnitsDisplay: "1",
    yearsRun: 174,
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
    yearsRun: 49,
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
  it("renders accordion items for each experiment", () => {
    const wrapper = mount(PayuExperimentAccordion, {
      props: { experiments: MOCK_EXPERIMENTS },
    });

    expect(wrapper.findAll('[data-test="accordion-item"]')).toHaveLength(2);
    expect(wrapper.text()).toContain("Ndep2-PI-CNP-concentrations");
    expect(wrapper.text()).toContain("piControl-spun-up");
  });

  it("shows the model current time and service units in the summary", () => {
    const wrapper = mount(PayuExperimentAccordion, {
      props: { experiments: [MOCK_EXPERIMENTS[0]!] },
    });

    expect(wrapper.text()).toContain("0275-01-01T00:00:00");
    expect(wrapper.text()).toContain("1 SU");
  });

  it("renders all detail fields in the expanded panel", () => {
    const wrapper = mount(PayuExperimentAccordion, {
      props: { experiments: [MOCK_EXPERIMENTS[0]!] },
    });

    const content = wrapper.find('[data-test="accordion-content"]');
    expect(content.text()).toContain("experiment name");
    expect(content.text()).toContain("Ndep2-PI-CNP-concentrations");
    expect(content.text()).toContain("experiment service units used");
  });

  it("shows the loading state while data is being fetched", () => {
    const wrapper = mount(PayuExperimentAccordion, {
      props: { experiments: [], loading: true },
    });

    expect(wrapper.find('[data-test="payu-loading"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="payu-accordion"]').exists()).toBe(false);
  });

  it("shows the error state when an error is provided", () => {
    const wrapper = mount(PayuExperimentAccordion, {
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

  it("shows the empty state when there are no experiments", () => {
    const wrapper = mount(PayuExperimentAccordion, {
      props: { experiments: [] },
    });

    expect(wrapper.find('[data-test="payu-empty"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="payu-empty"]').text()).toContain(
      "No experiment runs found.",
    );
  });

  it("accepts a custom empty message", () => {
    const wrapper = mount(PayuExperimentAccordion, {
      props: { experiments: [], emptyMessage: "No runs yet." },
    });

    expect(wrapper.find('[data-test="payu-empty"]').text()).toContain(
      "No runs yet.",
    );
  });

  it("starts with no open panels", () => {
    const wrapper = mount(PayuExperimentAccordion, {
      props: { experiments: MOCK_EXPERIMENTS },
    });

    const vm = wrapper.vm as { openPanels: string[] };
    expect(vm.openPanels).toEqual([]);
  });
});
