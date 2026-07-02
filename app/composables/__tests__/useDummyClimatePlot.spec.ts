import { ref } from "vue";
import { describe, expect, it } from "vitest";
import { useDummyClimatePlot } from "../useDummyClimatePlot";

describe("useDummyClimatePlot", () => {
  it("exposes labels, raw model series, latest values, and deltas", () => {
    const plot = useDummyClimatePlot(
      ref([
        {
          label: "Model 1",
          color: "#2563eb",
          points: [
            { label: "2027", value: 1.2 },
            { label: "2028", value: 1.4 },
            { label: "2029", value: 1.7 },
          ],
        },
        {
          label: "Model 2",
          color: "#f97316",
          points: [
            { label: "2027", value: 1.1 },
            { label: "2028", value: 1.2 },
            { label: "2029", value: 1.5 },
          ],
        },
      ]),
    );

    expect(plot.labels.value).toEqual(["2027", "2028", "2029"]);
    expect(plot.rawSeries.value).toEqual([
      { label: "Model 1", color: "#2563eb", values: [1.2, 1.4, 1.7] },
      { label: "Model 2", color: "#f97316", values: [1.1, 1.2, 1.5] },
    ]);
    expect(plot.latestValues.value).toEqual([
      { label: "Model 1", value: 1.7 },
      { label: "Model 2", value: 1.5 },
    ]);
    expect(plot.deltas.value).toEqual([
      { label: "Model 1", value: 0.5 },
      { label: "Model 2", value: 0.4 },
    ]);
  });
});
