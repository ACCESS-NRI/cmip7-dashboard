import { describe, expect, it } from "vitest";
import {
  resolveExperimentClass,
  experimentClassesPresent,
} from "../experimentClass";

describe("resolveExperimentClass", () => {
  it("resolves a declared class id to its full definition", () => {
    expect(resolveExperimentClass("baseline").id).toBe("baseline");
    expect(resolveExperimentClass("historical").id).toBe("historical");
    expect(resolveExperimentClass("sensitivity").id).toBe("sensitivity");
    expect(resolveExperimentClass("projection").id).toBe("projection");
  });

  it("marks only projections as isProjection", () => {
    expect(resolveExperimentClass("projection").isProjection).toBe(true);
    for (const id of ["baseline", "historical", "sensitivity"] as const) {
      expect(resolveExperimentClass(id).isProjection, id).toBe(false);
    }
  });

  it("falls back to sensitivity (not a projection) when no class is declared", () => {
    const cls = resolveExperimentClass(undefined);
    expect(cls.id).toBe("sensitivity");
    expect(cls.isProjection).toBe(false);
  });

  it("falls back to sensitivity for a class id outside the known set", () => {
    // The config is external data, so guard against a stray value.
    const cls = resolveExperimentClass("nonsense" as never);
    expect(cls.id).toBe("sensitivity");
  });
});

describe("experimentClassesPresent", () => {
  it("returns the distinct classes present, in display order, deduplicated", () => {
    const result = experimentClassesPresent([
      "sensitivity",
      "historical",
      "baseline",
      "historical",
      "sensitivity",
    ]);
    expect(result.map((c) => c.id)).toEqual([
      "historical",
      "baseline",
      "sensitivity",
    ]);
  });

  it("omits classes not present (no projection when none are declared)", () => {
    const result = experimentClassesPresent(["baseline", "sensitivity"]);
    expect(result.map((c) => c.id)).not.toContain("projection");
  });
});
