import { describe, expect, it } from "vitest";
import {
  resolveExperimentClass,
  experimentClassesPresent,
} from "../experimentClass";

describe("resolveExperimentClass", () => {
  it("resolves a declared class id to its full definition", () => {
    expect(resolveExperimentClass("baseline").id).toBe("baseline");
    expect(resolveExperimentClass("historical").id).toBe("historical");
    expect(resolveExperimentClass("idealised").id).toBe("idealised");
    expect(resolveExperimentClass("projection").id).toBe("projection");
  });

  it("marks only projections as isProjection", () => {
    expect(resolveExperimentClass("projection").isProjection).toBe(true);
    for (const id of ["baseline", "historical", "idealised"] as const) {
      expect(resolveExperimentClass(id).isProjection, id).toBe(false);
    }
  });

  it("falls back to idealised (not a projection) when no class is declared", () => {
    const cls = resolveExperimentClass(undefined);
    expect(cls.id).toBe("idealised");
    expect(cls.isProjection).toBe(false);
  });

  it("falls back to idealised for a class id outside the known set", () => {
    // The config is external data, so guard against a stray value.
    const cls = resolveExperimentClass("nonsense" as never);
    expect(cls.id).toBe("idealised");
  });
});

describe("experimentClassesPresent", () => {
  it("returns the distinct classes present, in display order, deduplicated", () => {
    const result = experimentClassesPresent([
      "idealised",
      "historical",
      "baseline",
      "historical",
      "idealised",
    ]);
    expect(result.map((c) => c.id)).toEqual([
      "historical",
      "baseline",
      "idealised",
    ]);
  });

  it("omits classes not present (no projection when none are declared)", () => {
    const result = experimentClassesPresent(["baseline", "idealised"]);
    expect(result.map((c) => c.id)).not.toContain("projection");
  });
});
