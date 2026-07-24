import { describe, expect, it } from "vitest";
import { buildCmip7PlotData } from "../cmip7PlotData";

describe("cmip7PlotData", () => {
  it("builds one plot series per numeric data column", () => {
    const result = buildCmip7PlotData(
      [
        { year: 2027, ACCESS_CM2: 1.2, ACCESS_ESM1_5: 1.3, note: "a" },
        { year: 2028, ACCESS_CM2: 1.4, ACCESS_ESM1_5: 1.5, note: "b" },
      ],
      [
        { name: "year", type: "BIGINT" },
        { name: "ACCESS_CM2", type: "DOUBLE" },
        { name: "ACCESS_ESM1_5", type: "DOUBLE" },
        { name: "note", type: "VARCHAR" },
      ],
    );

    expect(result.xColumn).toBe("year");
    expect(result.yColumns).toEqual(["ACCESS_CM2", "ACCESS_ESM1_5"]);
    expect(result.series).toEqual([
      {
        label: "ACCESS_CM2",
        color: "#2563eb",
        points: [
          { label: "2027", value: 1.2 },
          { label: "2028", value: 1.4 },
        ],
      },
      {
        label: "ACCESS_ESM1_5",
        color: "#f97316",
        points: [
          { label: "2027", value: 1.3 },
          { label: "2028", value: 1.5 },
        ],
      },
    ]);
  });

  it("uses row numbers as labels when no x column is present", () => {
    const result = buildCmip7PlotData(
      [
        { Model_A: 1.2, Model_B: 1.1 },
        { Model_A: 1.4, Model_B: 1.3 },
      ],
      [
        { name: "Model_A", type: "DOUBLE" },
        { name: "Model_B", type: "DOUBLE" },
      ],
    );

    expect(result.xColumn).toBeNull();
    expect(result.yColumns).toEqual(["Model_A", "Model_B"]);
    expect(result.series.at(0)?.points).toEqual([
      { label: "1", value: 1.2 },
      { label: "2", value: 1.4 },
    ]);
  });
});
