import { describe, expect, it } from "vitest";
import {
  experimentProgressPercent,
  experimentRunCounts,
  experimentRunStatus,
  groupExperimentsByProgramme,
  summarizeExperimentGroup,
} from "../experimentGroups";
import type { PayuExperiment, PayuExperimentMember } from "../payuExperiments";
import { EXPERIMENT_CLASSES } from "../experimentClass";
import { EXPERIMENT_TIERS } from "../experimentTier";

function makeExperiment(
  overrides: Partial<PayuExperiment> = {},
): PayuExperiment {
  return {
    name: "historical",
    uuid: "uuid-1",
    modelStartTime: "1850-01-01",
    modelCurrentTime: "1900-01-01",
    serviceUnitsDisplay: "100",
    serviceUnits: 100,
    yearsRun: 50,
    expectedYearsRun: 100,
    memberExpectedYearsRun: 100,
    expectedEnsembleCount: 1,
    members: [],
    esgfPublishedCount: 0,
    experimentClass: EXPERIMENT_CLASSES.historical,
    tiers: [],
    details: {},
    ...overrides,
  };
}

function makeMember(name: string, yearsRun: number): PayuExperimentMember {
  return {
    name,
    uuid: `uuid-${name}`,
    modelStartTime: "1850-01-01",
    modelCurrentTime: "1900-01-01",
    serviceUnitsDisplay: "10",
    serviceUnits: 10,
    yearsRun,
    expectedYearsRun: 100,
    hasTelemetry: yearsRun > 0,
    details: {},
  };
}

describe("experimentRunStatus", () => {
  it("marks completed, running, and not-started experiments", () => {
    expect(
      experimentRunStatus(
        makeExperiment({ yearsRun: 100, expectedYearsRun: 100 }),
      ),
    ).toBe("completed");
    expect(
      experimentRunStatus(
        makeExperiment({ yearsRun: 10, expectedYearsRun: 100 }),
      ),
    ).toBe("running");
    expect(
      experimentRunStatus(
        makeExperiment({ yearsRun: 0, expectedYearsRun: 100 }),
      ),
    ).toBe("not-started");
  });

  it("treats unknown planned years as running once any years exist", () => {
    expect(
      experimentRunStatus(
        makeExperiment({ yearsRun: 10, expectedYearsRun: null }),
      ),
    ).toBe("running");
  });
});

describe("experimentProgressPercent", () => {
  it("clamps progress to 100 percent", () => {
    expect(
      experimentProgressPercent(
        makeExperiment({ yearsRun: 125, expectedYearsRun: 100 }),
      ),
    ).toBe(100);
  });

  it("returns null when planned years are unknown", () => {
    expect(
      experimentProgressPercent(makeExperiment({ expectedYearsRun: null })),
    ).toBeNull();
  });
});

describe("experimentRunCounts", () => {
  it("counts an ensemble one member at a time", () => {
    expect(
      experimentRunCounts(
        makeExperiment({
          expectedEnsembleCount: 3,
          expectedYearsRun: 300,
          yearsRun: 244,
          members: [
            makeMember("r1i1p1f1", 100),
            makeMember("r2i1p1f1", 100),
            makeMember("r3i1p1f1", 44),
          ],
        }),
      ),
    ).toEqual({ total: 3, completed: 2, running: 1, notStarted: 0 });
  });

  it("counts planned members that do not exist yet as not started", () => {
    expect(
      experimentRunCounts(
        makeExperiment({
          expectedEnsembleCount: 10,
          members: [makeMember("r1i1p1f1", 100), makeMember("r2i1p1f1", 100)],
        }),
      ),
    ).toEqual({ total: 10, completed: 2, running: 0, notStarted: 8 });
  });

  it("counts more realisations than planned rather than dropping them", () => {
    expect(
      experimentRunCounts(
        makeExperiment({
          expectedEnsembleCount: 1,
          members: [makeMember("r1i1p1f1", 100), makeMember("r2i1p1f1", 0)],
        }),
      ),
    ).toEqual({ total: 2, completed: 1, running: 0, notStarted: 1 });
  });

  it("counts a single run whole, so summed sub-runs still complete it", () => {
    // piControl's shape: related sub-runs sum into the experiment's yearsRun but
    // are deliberately absent from `members`, so its lone member reads short.
    expect(
      experimentRunCounts(
        makeExperiment({
          name: "piControl",
          yearsRun: 500,
          expectedYearsRun: 500,
          members: [makeMember("piControl", 300)],
        }),
      ),
    ).toEqual({ total: 1, completed: 1, running: 0, notStarted: 0 });
  });

  it("counts an experiment with no members recorded as one planned run", () => {
    expect(
      experimentRunCounts(makeExperiment({ yearsRun: 0, members: [] })),
    ).toEqual({ total: 1, completed: 0, running: 0, notStarted: 1 });
  });
});

describe("summarizeExperimentGroup", () => {
  it("summarizes counts, years, and percent complete", () => {
    const summary = summarizeExperimentGroup([
      makeExperiment({
        yearsRun: 100,
        expectedYearsRun: 100,
        esgfPublishedCount: 1,
      }),
      makeExperiment({ yearsRun: 25, expectedYearsRun: 100 }),
      makeExperiment({ yearsRun: 0, expectedYearsRun: 100 }),
    ]);

    expect(summary).toMatchObject({
      total: 3,
      completed: 1,
      running: 1,
      notStarted: 1,
      published: 1,
      yearsRun: 125,
      plannedYears: 300,
      percent: 42,
    });
  });

  it("counts ensemble members, not experiments", () => {
    const summary = summarizeExperimentGroup([
      makeExperiment({
        name: "esm-historical",
        expectedEnsembleCount: 3,
        expectedYearsRun: 300,
        yearsRun: 244,
        esgfPublishedCount: 2,
        members: [
          makeMember("r1i1p1f1", 100),
          makeMember("r2i1p1f1", 100),
          makeMember("r3i1p1f1", 44),
        ],
      }),
      makeExperiment({ name: "abrupt-4xCO2", yearsRun: 0 }),
    ]);

    expect(summary).toMatchObject({
      total: 4,
      completed: 2,
      running: 1,
      notStarted: 1,
      // A part-published ensemble counts its published members rather than
      // rounding down to nothing.
      published: 2,
    });
  });
});

describe("groupExperimentsByProgramme", () => {
  it("returns DECK, Scenarios, and Other groups in display order", () => {
    const groups = groupExperimentsByProgramme([
      makeExperiment({
        name: "historical",
        tiers: [EXPERIMENT_TIERS.deck],
      }),
      makeExperiment({
        name: "scen7-h",
        tiers: [EXPERIMENT_TIERS.aft],
        experimentClass: EXPERIMENT_CLASSES.projection,
      }),
      makeExperiment({
        name: "piClim-Control",
        tiers: [],
        experimentClass: EXPERIMENT_CLASSES.idealised,
      }),
    ]);

    expect(groups.map((group) => group.id)).toEqual([
      "deck",
      "scenario",
      "other",
    ]);
    expect(groups.map((group) => group.label)).toEqual([
      "DECK",
      "Scenarios",
      "Other simulations",
    ]);
  });

  it("splits the Fast Track between scenarios and other", () => {
    const scenario = makeExperiment({
      name: "scen7-h",
      tiers: [EXPERIMENT_TIERS.aft],
      experimentClass: EXPERIMENT_CLASSES.projection,
    });
    const idealised = makeExperiment({
      name: "esm-flat10",
      tiers: [EXPERIMENT_TIERS.aft],
      experimentClass: EXPERIMENT_CLASSES.idealised,
    });

    const groups = groupExperimentsByProgramme([scenario, idealised]);

    expect(
      groups.find((group) => group.id === "scenario")?.experiments,
    ).toEqual([scenario]);
    expect(groups.find((group) => group.id === "other")?.experiments).toEqual([
      idealised,
    ]);
  });

  it("shows experiments with overlapping membership in both groups", () => {
    const deckScenario = makeExperiment({
      name: "scen7-h",
      tiers: [EXPERIMENT_TIERS.deck],
      experimentClass: EXPERIMENT_CLASSES.projection,
    });

    const groups = groupExperimentsByProgramme([deckScenario]);

    expect(groups).toHaveLength(2);
    expect(groups.find((group) => group.id === "deck")?.experiments).toEqual([
      deckScenario,
    ]);
    expect(
      groups.find((group) => group.id === "scenario")?.experiments,
    ).toEqual([deckScenario]);
  });

  it("omits empty groups", () => {
    const groups = groupExperimentsByProgramme([
      makeExperiment({
        name: "piClim-Control",
        tiers: [],
        experimentClass: EXPERIMENT_CLASSES.idealised,
      }),
    ]);

    expect(groups.map((group) => group.id)).toEqual(["other"]);
  });
});
