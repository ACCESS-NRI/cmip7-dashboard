import { describe, expect, it } from "vitest";
import { layoutGroupBands } from "../groupBandLayout";

const groups = [{ id: "deck" }, { id: "scenario" }, { id: "other" }];

function withOpen(...openIds: string[]) {
  const open = new Set(openIds);
  return (id: string) => open.has(id);
}

describe("layoutGroupBands", () => {
  it("splits three closed groups evenly across one row", () => {
    const bands = layoutGroupBands(groups, withOpen());
    expect(bands).toEqual([
      { group: { id: "deck" }, span: 2, mode: "tile" },
      { group: { id: "scenario" }, span: 2, mode: "tile" },
      { group: { id: "other" }, span: 2, mode: "tile" },
    ]);
  });

  it("gives an open group a full row and splits the closed run beneath it", () => {
    const bands = layoutGroupBands(groups, withOpen("deck"));
    expect(bands).toEqual([
      { group: { id: "deck" }, span: 6, mode: "open" },
      { group: { id: "scenario" }, span: 3, mode: "tile" },
      { group: { id: "other" }, span: 3, mode: "tile" },
    ]);
  });

  it("renders a closed group left alone on its row as a strip", () => {
    const bands = layoutGroupBands(groups, withOpen("scenario"));
    expect(bands).toEqual([
      { group: { id: "deck" }, span: 6, mode: "strip" },
      { group: { id: "scenario" }, span: 6, mode: "open" },
      { group: { id: "other" }, span: 6, mode: "strip" },
    ]);
  });

  it("stacks every group full width when all are open", () => {
    const bands = layoutGroupBands(
      groups,
      withOpen("deck", "scenario", "other"),
    );
    expect(bands.map((band) => [band.mode, band.span])).toEqual([
      ["open", 6],
      ["open", 6],
      ["open", 6],
    ]);
  });

  it("handles a single group: open span 6, closed span 6 strip", () => {
    const one = [{ id: "deck" }];
    expect(layoutGroupBands(one, withOpen())).toEqual([
      { group: { id: "deck" }, span: 6, mode: "strip" },
    ]);
    expect(layoutGroupBands(one, withOpen("deck"))).toEqual([
      { group: { id: "deck" }, span: 6, mode: "open" },
    ]);
  });
});
