import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import DummyClimatePlot from "../DummyClimatePlot.vue";

vi.mock("vue-chartjs", () => ({
  Line: {
    name: "Line",
    props: ["data", "options"],
    template: '<div data-test="line-chart" />',
  },
}));

describe("DummyClimatePlot", () => {
  it("renders the raw dummy plot shell", () => {
    const wrapper = mount(DummyClimatePlot);

    expect(wrapper.text()).toContain("CMIP7 readiness signal");
    expect(wrapper.text()).toContain("51.8 index");
    expect(wrapper.text()).toContain("Current change: +10.6 index points");
    expect(wrapper.find('[data-test="line-chart"]').exists()).toBe(true);
  });
});
