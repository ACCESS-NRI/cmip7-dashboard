// @vitest-environment nuxt
import { describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import DummyClimatePlot from "../DummyClimatePlot.client.vue";

vi.mock("vue-chartjs", () => ({
  Line: {
    name: "Line",
    props: ["data", "options"],
    template: '<div data-test="line-chart" />',
  },
}));

vi.mock("~/services/dataSource", () => ({
  loadRemoteParquetDataSource: vi.fn().mockResolvedValue({
    columns: ["year", "Model_A", "Model_B"],
    rows: [
      { year: 2027, Model_A: 1.55, Model_B: 1.3 },
      { year: 2028, Model_A: 1.75, Model_B: 1.4 },
    ],
    schema: [
      { name: "year", type: "BIGINT" },
      { name: "Model_A", type: "DOUBLE" },
      { name: "Model_B", type: "DOUBLE" },
    ],
  }),
}));

describe("DummyClimatePlot", () => {
  it("renders the parquet-backed plot shell", async () => {
    const wrapper = await mountSuspended(DummyClimatePlot);

    expect(wrapper.text()).toContain("CMIP7 readiness signal");
    expect(wrapper.find('[data-test="line-chart"]').exists()).toBe(true);

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain("1.75 tas");
      expect(wrapper.text()).toContain("Model_A change: +0.20 tas.");
      expect(wrapper.text()).toContain(
        "Loaded 3 columns from s3://gm-tas/gm_tas.pq, plotting 2 lines by year.",
      );
    });
  });
});
