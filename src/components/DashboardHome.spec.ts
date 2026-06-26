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

vi.mock("@/services/dataSource", () => ({
  loadRemoteParquetDataSource: vi.fn().mockResolvedValue({
    columns: ["year", "Model_A"],
    rows: [{ year: 2027, Model_A: 1.55 }],
    schema: [
      { name: "year", type: "BIGINT" },
      { name: "Model_A", type: "DOUBLE" },
    ],
  }),
}));

describe("DashboardHome", () => {
  it("renders the dashboard home page", () => {
    const wrapper = mount(DashboardHome);
    expect(wrapper.text()).toContain("CMIP7 Dashboard");
    expect(wrapper.text()).toContain("CMIP7 readiness signal");
    expect(wrapper.text()).toContain("ACCESS-NRI tooling");
  });
});
