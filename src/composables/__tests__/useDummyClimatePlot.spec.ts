import { ref } from "vue";
import { describe, expect, it } from "vitest";
import { useDummyClimatePlot } from "../useDummyClimatePlot";

describe("useDummyClimatePlot", () => {
  it("exposes labels, raw values, latest value, and delta", () => {
    const plot = useDummyClimatePlot(
      ref([
        { label: "2027", value: 41.2 },
        { label: "2028", value: 43.1 },
        { label: "2029", value: 42.6 },
      ]),
    );

    expect(plot.labels.value).toEqual(["2027", "2028", "2029"]);
    expect(plot.values.value).toEqual([41.2, 43.1, 42.6]);
    expect(plot.latestValue.value).toBe(42.6);
    expect(plot.delta.value).toBe(1.4);
  });
});
