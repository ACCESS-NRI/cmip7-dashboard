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
    esgfPublished: false,
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
            esgfPublished: true,
            tiers: [EXPERIMENT_TIERS.deck],
          }),
          makeExperiment({
            name: "unpublished",
            esgfPublished: false,
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

    const checkboxes = deck
      .findAll('[data-test="esgf-status"] input[type="checkbox"]')
      .map((input) => (input.element as HTMLInputElement).checked);
    expect(checkboxes).toEqual([true, false]);

    // One of the two DECK experiments is published.
    expect(deck.text()).toContain("Published");
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
