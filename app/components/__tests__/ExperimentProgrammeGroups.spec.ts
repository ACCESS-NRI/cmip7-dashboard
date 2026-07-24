// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { ContentCollectionItem } from "@nuxt/content";
import ExperimentProgrammeGroups from "../ExperimentProgrammeGroups.vue";
import type { PayuExperiment } from "~/services/payuExperiments";
import { EXPERIMENT_CLASSES } from "~/services/experimentClass";
import { EXPERIMENT_TIERS } from "~/services/experimentTier";

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

function makePost(): ContentCollectionItem {
  return {
    title: "What is historical",
    description: "The historical run recreates observed climate.",
    experiment: "historical",
    furtherReading: [
      { title: "WCRP CMIP", url: "https://wcrp-cmip.org/cmip7/" },
    ],
  } as unknown as ContentCollectionItem;
}

const ContentRendererStub = {
  props: ["value"],
  template: '<div data-test="content-renderer">{{ value?.title }}</div>',
};

describe("ExperimentProgrammeGroups", () => {
  it("renders programme groups in display order", async () => {
    const wrapper = await mountSuspended(ExperimentProgrammeGroups, {
      props: {
        experiments: [
          makeExperiment({
            name: "historical",
            tiers: [EXPERIMENT_TIERS.deck],
          }),
          makeExperiment({ name: "esm-flat10", tiers: [EXPERIMENT_TIERS.aft] }),
          makeExperiment({ name: "piClim-Control", tiers: [] }),
        ],
      },
    });

    const groupLabels = wrapper
      .findAll('[data-test^="experiment-group-toggle-"]')
      .map((toggle) => toggle.text());

    expect(groupLabels[0]).toContain("DECK");
    expect(groupLabels[1]).toContain("Assessment Fast Track");
    expect(groupLabels[2]).toContain("Other simulations");
  });

  it("shows overlapping experiments in both relevant groups", async () => {
    const wrapper = await mountSuspended(ExperimentProgrammeGroups, {
      props: {
        experiments: [
          makeExperiment({
            name: "historical",
            tiers: [EXPERIMENT_TIERS.deck, EXPERIMENT_TIERS.aft],
          }),
        ],
      },
    });

    expect(
      wrapper.find('[data-test="experiment-group-deck"]').text(),
    ).toContain("historical");
    expect(wrapper.find('[data-test="experiment-group-aft"]').text()).toContain(
      "historical",
    );
  });

  it("renders status counts and progress for a group", async () => {
    const wrapper = await mountSuspended(ExperimentProgrammeGroups, {
      props: {
        experiments: [
          makeExperiment({
            name: "complete",
            yearsRun: 100,
            expectedYearsRun: 100,
            tiers: [EXPERIMENT_TIERS.deck],
          }),
          makeExperiment({
            name: "running",
            yearsRun: 25,
            expectedYearsRun: 100,
            tiers: [EXPERIMENT_TIERS.deck],
          }),
          makeExperiment({
            name: "not-started",
            yearsRun: 0,
            expectedYearsRun: 100,
            tiers: [EXPERIMENT_TIERS.deck],
          }),
        ],
      },
    });

    const deck = wrapper.find('[data-test="experiment-group-deck"]');
    expect(deck.text()).toContain("42% complete");
    expect(deck.text()).toContain("Running");
    expect(deck.text()).toContain("Completed");
    expect(deck.text()).toContain("Not started");
    expect(deck.text()).toContain("Published");
    expect(deck.findAll('[data-test="group-progress-bar"]')).toHaveLength(3);
  });

  it("shows ESGF publication status per row instead of run status", async () => {
    const wrapper = await mountSuspended(ExperimentProgrammeGroups, {
      props: {
        experiments: [
          makeExperiment({
            name: "published",
            esgfPublishedCount: 1,
            tiers: [EXPERIMENT_TIERS.deck],
          }),
          makeExperiment({
            name: "unpublished",
            esgfPublishedCount: 0,
            tiers: [EXPERIMENT_TIERS.deck],
          }),
        ],
      },
    });

    const deck = wrapper.find('[data-test="experiment-group-deck"]');
    // The run-status column is gone; ESGF publication takes its place.
    expect(deck.find('[data-test="experiment-status-running"]').exists()).toBe(
      false,
    );

    const counts = deck
      .findAll('[data-test="esgf-count"]')
      .map((count) => count.text());
    expect(counts).toEqual(["1/1", "0/1"]);

    // One of the two DECK experiments is published.
    expect(deck.text()).toContain("Published");
  });

  it("counts ESGF publication across the ensemble", async () => {
    const wrapper = await mountSuspended(ExperimentProgrammeGroups, {
      props: {
        experiments: [
          makeExperiment({
            name: "esm-historical",
            expectedEnsembleCount: 30,
            esgfPublishedCount: 0,
            tiers: [EXPERIMENT_TIERS.deck],
          }),
        ],
      },
    });

    expect(wrapper.find('[data-test="esgf-count"]').text()).toBe("0/30");
  });

  it("renders experiment type badges in their own column", async () => {
    const wrapper = await mountSuspended(ExperimentProgrammeGroups, {
      props: {
        experiments: [
          makeExperiment({
            name: "abrupt-4xCO2",
            experimentClass: EXPERIMENT_CLASSES.idealised,
            tiers: [EXPERIMENT_TIERS.deck],
          }),
        ],
      },
    });

    const badge = wrapper.find('[data-test="experiment-class-badge"]');
    expect(badge.exists()).toBe(true);
    expect(badge.attributes("data-class")).toBe("idealised");
  });

  it("opens a matching explainer post from the experiment name", async () => {
    const wrapper = await mountSuspended(ExperimentProgrammeGroups, {
      props: {
        experiments: [
          makeExperiment({
            name: "historical",
            tiers: [EXPERIMENT_TIERS.deck],
          }),
        ],
        postByExperiment: { historical: makePost() },
      },
      global: { stubs: { ContentRenderer: ContentRendererStub } },
    });

    await wrapper
      .find('[data-test="experiment-explainer-link-historical"]')
      .trigger("click");

    expect(document.body.textContent).toContain("What is historical");
    expect(document.body.textContent).toContain("WCRP CMIP");
  });

  it("does not make experiment names clickable when no explainer exists", async () => {
    const wrapper = await mountSuspended(ExperimentProgrammeGroups, {
      props: {
        experiments: [
          makeExperiment({
            name: "historical",
            tiers: [EXPERIMENT_TIERS.deck],
          }),
        ],
      },
    });

    expect(
      wrapper
        .find('[data-test="experiment-explainer-link-historical"]')
        .exists(),
    ).toBe(false);
  });

  describe("row layout", () => {
    async function mountThreeGroups() {
      return mountSuspended(ExperimentProgrammeGroups, {
        props: {
          experiments: [
            makeExperiment({
              name: "historical",
              tiers: [EXPERIMENT_TIERS.deck],
            }),
            makeExperiment({
              name: "esm-flat10",
              tiers: [EXPERIMENT_TIERS.aft],
            }),
            makeExperiment({ name: "piClim-Control", tiers: [] }),
          ],
        },
      });
    }

    /** [mode, span class] for each group card, in display order. */
    function cards(wrapper: Awaited<ReturnType<typeof mountThreeGroups>>) {
      return wrapper
        .findAll('[data-test^="experiment-group-"][data-mode]')
        .map((card) => [
          card.attributes("data-mode"),
          card.classes().find((name) => name.startsWith("lg:col-span-")),
        ]);
    }

    async function open(
      wrapper: Awaited<ReturnType<typeof mountThreeGroups>>,
      id: string,
    ) {
      await wrapper
        .find(`[data-test="experiment-group-toggle-${id}"]`)
        .trigger("click");
    }

    it("puts all three closed groups in one three-column row", async () => {
      const wrapper = await mountThreeGroups();

      expect(cards(wrapper)).toEqual([
        ["tile", "lg:col-span-2"],
        ["tile", "lg:col-span-2"],
        ["tile", "lg:col-span-2"],
      ]);
    });

    it("expands the first group above a two-up row of the rest", async () => {
      const wrapper = await mountThreeGroups();
      await open(wrapper, "deck");

      expect(cards(wrapper)).toEqual([
        ["open", "lg:col-span-6"],
        ["tile", "lg:col-span-3"],
        ["tile", "lg:col-span-3"],
      ]);
    });

    it("renders closed groups left alone on a row as strips", async () => {
      const wrapper = await mountThreeGroups();
      await open(wrapper, "aft");

      // Opening the middle group strands DECK above it and Other below it.
      expect(cards(wrapper)).toEqual([
        ["strip", "lg:col-span-6"],
        ["open", "lg:col-span-6"],
        ["strip", "lg:col-span-6"],
      ]);
      expect(
        wrapper.find('[data-test="experiment-group-count-deck"]').text(),
      ).toBe("1 simulations");
    });

    it("keeps the percentage badge on the title line, open or closed", async () => {
      const wrapper = await mountThreeGroups();

      // The badge shares a row with the label rather than sitting below it, so
      // it lands in the same place whichever mode the card is in.
      const titleRow = () =>
        wrapper.find('[data-test="experiment-group-percent-deck"]').element
          .parentElement;

      expect(titleRow()?.textContent).toContain("DECK");
      expect(titleRow()?.textContent).toContain("50% complete");
      expect(titleRow()?.textContent).not.toContain(
        "A foundational experiment",
      );

      await open(wrapper, "deck");

      expect(titleRow()?.textContent).toContain("DECK");
      expect(titleRow()?.textContent).toContain("50% complete");
    });

    it("stacks every group full width when all are open", async () => {
      const wrapper = await mountThreeGroups();
      await open(wrapper, "deck");
      await open(wrapper, "aft");
      await open(wrapper, "other");

      expect(cards(wrapper)).toEqual([
        ["open", "lg:col-span-6"],
        ["open", "lg:col-span-6"],
        ["open", "lg:col-span-6"],
      ]);
    });
  });

  describe("ensemble fan-out", () => {
    function makeMember(name: string, yearsRun: number) {
      return {
        name,
        uuid: `uuid-${name}`,
        modelStartTime: "1850-01-01",
        modelCurrentTime: "1900-01-01",
        serviceUnitsDisplay: "10",
        serviceUnits: 10,
        yearsRun,
        expectedYearsRun: 172,
        hasTelemetry: yearsRun > 0,
        details: {},
      };
    }

    function makeEnsemble(overrides: Partial<PayuExperiment> = {}) {
      return makeExperiment({
        name: "historical",
        tiers: [EXPERIMENT_TIERS.deck],
        yearsRun: 130,
        expectedYearsRun: 516,
        memberExpectedYearsRun: 172,
        expectedEnsembleCount: 3,
        members: [
          makeMember("r1i1p1f1", 86),
          makeMember("r2i1p1f1", 44),
          makeMember("r3i1p1f1", 0),
        ],
        ...overrides,
      });
    }

    it("keeps the ensemble collapsed to one summed row by default", async () => {
      const wrapper = await mountSuspended(ExperimentProgrammeGroups, {
        props: { experiments: [makeEnsemble()] },
      });

      const toggle = wrapper.find('[data-test="ensemble-toggle-historical"]');
      expect(toggle.attributes("aria-expanded")).toBe("false");
      // 130 of 516 planned years — the sum, not one member's share.
      expect(wrapper.find('[data-test="group-progress-bar"]').text()).toContain(
        "25%",
      );
      expect(
        wrapper.find('[data-test="ensemble-count-historical"]').text(),
      ).toBe("2/3 members");
    });

    it("fans out to a row per ensemble member when expanded", async () => {
      const wrapper = await mountSuspended(ExperimentProgrammeGroups, {
        props: { experiments: [makeEnsemble()] },
      });

      const toggle = wrapper.find('[data-test="ensemble-toggle-historical"]');
      await toggle.trigger("click");

      expect(toggle.attributes("aria-expanded")).toBe("true");
      const members = wrapper.findAll(
        '[data-test="ensemble-member-historical"]',
      );
      expect(members).toHaveLength(3);
      expect(members[0]!.text()).toContain("r1i1p1f1");
      // Each member reads against its own 172-year expectation: 86 → 50%.
      expect(members[0]!.text()).toContain("50%");
      expect(members[2]!.text()).toContain("0%");
    });

    it("names the planned members that have not started", async () => {
      const wrapper = await mountSuspended(ExperimentProgrammeGroups, {
        props: {
          experiments: [
            makeEnsemble({
              expectedEnsembleCount: 10,
              members: [makeMember("r1i1p1f1", 86)],
            }),
          ],
        },
      });

      await wrapper
        .find('[data-test="ensemble-toggle-historical"]')
        .trigger("click");

      expect(
        wrapper.find('[data-test="ensemble-pending-historical"]').text(),
      ).toBe("9 further members not started yet");
    });

    it("gives a single-run experiment no fan-out control", async () => {
      const wrapper = await mountSuspended(ExperimentProgrammeGroups, {
        props: {
          experiments: [
            makeExperiment({
              name: "abrupt-4xCO2",
              tiers: [EXPERIMENT_TIERS.deck],
            }),
          ],
        },
      });

      expect(
        wrapper.find('[data-test="ensemble-toggle-abrupt-4xCO2"]').exists(),
      ).toBe(false);
      expect(
        wrapper.find('[data-test="ensemble-count-abrupt-4xCO2"]').exists(),
      ).toBe(false);
    });

    it("expands the two copies of a shared experiment independently", async () => {
      const wrapper = await mountSuspended(ExperimentProgrammeGroups, {
        props: {
          experiments: [
            makeEnsemble({
              tiers: [EXPERIMENT_TIERS.deck, EXPERIMENT_TIERS.aft],
            }),
          ],
        },
      });

      const deck = wrapper.find('[data-test="experiment-group-deck"]');
      const aft = wrapper.find('[data-test="experiment-group-aft"]');

      await deck
        .find('[data-test="ensemble-toggle-historical"]')
        .trigger("click");

      expect(
        deck
          .find('[data-test="ensemble-toggle-historical"]')
          .attributes("aria-expanded"),
      ).toBe("true");
      expect(
        aft
          .find('[data-test="ensemble-toggle-historical"]')
          .attributes("aria-expanded"),
      ).toBe("false");
    });
  });

  it("collapses and expands a group", async () => {
    const wrapper = await mountSuspended(ExperimentProgrammeGroups, {
      props: {
        experiments: [
          makeExperiment({
            name: "historical",
            tiers: [EXPERIMENT_TIERS.deck],
          }),
        ],
      },
    });

    const toggle = wrapper.find('[data-test="experiment-group-toggle-deck"]');
    expect(toggle.attributes("aria-expanded")).toBe("false");

    await toggle.trigger("click");
    expect(toggle.attributes("aria-expanded")).toBe("true");
  });
});
