import { describe, expect, it } from "vitest";
import {
  classifyExperiment,
  experimentClassesPresent,
} from "../experimentClass";

describe("classifyExperiment", () => {
  it("classifies pre-industrial controls as the baseline", () => {
    expect(classifyExperiment("piControl").id).toBe("baseline");
    expect(classifyExperiment("esm-piControl").id).toBe("baseline");
  });

  it("classifies historical and amip runs as historical", () => {
    expect(classifyExperiment("historical").id).toBe("historical");
    expect(classifyExperiment("esm-historical").id).toBe("historical");
    expect(classifyExperiment("amip").id).toBe("historical");
  });

  it("classifies 4xCO2 / 1pctCO2 / flat10 runs as idealised", () => {
    for (const name of [
      "abrupt-4xCO2",
      "1pctCO2",
      "1pctCO2-bgc",
      "esm-flat10",
      "esm-flat10-zec",
    ]) {
      expect(classifyExperiment(name).id, name).toBe("idealised");
    }
  });

  it("treats fixed-SST piClim diagnostics (incl. the Control member) as idealised, not baseline", () => {
    expect(classifyExperiment("piClim-Control").id).toBe("idealised");
    expect(classifyExperiment("piClim-4xCO2").id).toBe("idealised");
    expect(classifyExperiment("piClim-anthro").id).toBe("idealised");
  });

  it("recognises SSP/scenario names as projections", () => {
    expect(classifyExperiment("ssp245").id).toBe("projection");
    expect(classifyExperiment("ssp585").id).toBe("projection");
    expect(classifyExperiment("scenarioMIP-x").id).toBe("projection");
  });

  it("defaults unknown names to idealised so nothing is silently marked a projection", () => {
    const cls = classifyExperiment("some-future-experiment");
    expect(cls.id).toBe("idealised");
    expect(cls.isProjection).toBe(false);
  });

  it("marks only projections as isProjection", () => {
    expect(classifyExperiment("ssp245").isProjection).toBe(true);
    for (const name of ["piControl", "historical", "abrupt-4xCO2", "amip"]) {
      expect(classifyExperiment(name).isProjection, name).toBe(false);
    }
  });
});

describe("experimentClassesPresent", () => {
  it("returns the distinct classes present, in display order, deduplicated", () => {
    const result = experimentClassesPresent([
      "abrupt-4xCO2",
      "historical",
      "piControl",
      "esm-historical",
      "1pctCO2",
    ]);
    expect(result.map((c) => c.id)).toEqual([
      "historical",
      "baseline",
      "idealised",
    ]);
  });

  it("omits classes not present (no projection when none are scenarios)", () => {
    const result = experimentClassesPresent(["piControl", "abrupt-4xCO2"]);
    expect(result.map((c) => c.id)).not.toContain("projection");
  });
});
