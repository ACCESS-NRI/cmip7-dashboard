import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import DashboardHome from "./DashboardHome.vue";

vi.mock("vue-chartjs", () => ({
  Line: {
    name: "Line",
    props: ["data", "options"],
    template: '<div data-test="line-chart" />',
  },
}));

describe("DashboardHome", () => {
  it("renders the dashboard home page", () => {
    const wrapper = mount(DashboardHome);

    expect(wrapper.text()).toContain("CMIP7 Dashboard");
    expect(wrapper.text()).toContain("Vue 3 + Vite");
    expect(wrapper.text()).toContain("CMIP7 readiness signal");
    expect(wrapper.text()).toContain("ACCESS-NRI tooling");
  });
});
