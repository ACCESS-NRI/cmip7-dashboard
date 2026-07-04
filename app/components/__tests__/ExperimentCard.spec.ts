// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { ContentCollectionItem } from "@nuxt/content";
import ExperimentCard from "../ExperimentCard.vue";
import type { PayuExperiment } from "~/services/payuExperiments";

// Drive the shared detail level directly so each test can pin a level.
const levelState = vi.hoisted(() => ({
  ref: null as null | { value: number },
}));

vi.mock("~/composables/useDetailLevel", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~/composables/useDetailLevel")>();
  return { ...actual, useDetailLevel: () => levelState.ref };
});

const ContentRendererStub = {
  props: ["value"],
  template: '<div data-test="content">{{ value?.title }}</div>',
};

function makeExperiment(
  overrides: Partial<PayuExperiment> = {},
): PayuExperiment {
  return {
    name: "historical",
    uuid: "uuid-1",
    modelStartTime: "1850-01-01",
    modelCurrentTime: "1900-01-01",
    serviceUnitsDisplay: "100",
    yearsRun: 50,
    expectedYearsRun: 172,
    esgfPublished: false,
    details: { experiment_name: "historical", experiment_service_units: 100 },
    ...overrides,
  };
}

function makePost(): ContentCollectionItem {
  return {
    title: "What is historical",
    description: "The historical run recreates the observed climate.",
    date: "2026-01-01",
    author: "Jane Doe",
    furtherReading: [
      { title: "WCRP CMIP", url: "https://wcrp-cmip.org/cmip7/" },
    ],
  } as unknown as ContentCollectionItem;
}

function mountCard(props: {
  experiment: PayuExperiment;
  post?: ContentCollectionItem | null;
}) {
  return mountSuspended(ExperimentCard, {
    props,
    global: { stubs: { ContentRenderer: ContentRendererStub } },
  });
}

describe("ExperimentCard", () => {
  beforeEach(() => {
    levelState.ref = ref(0);
  });

  it("shows the explainer description at Overview level", async () => {
    const wrapper = await mountCard({
      experiment: makeExperiment(),
      post: makePost(),
    });

    expect(wrapper.find('[data-test="card-overview"]').text()).toContain(
      "The historical run recreates the observed climate.",
    );
    // Full article stays collapsed until asked for.
    expect(wrapper.find('[data-test="overview-article"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="card-status"]').exists()).toBe(false);
  });

  it("expands the full article and further reading via the collapsible", async () => {
    const wrapper = await mountCard({
      experiment: makeExperiment(),
      post: makePost(),
    });

    await wrapper.find('[data-test="overview-toggle"]').trigger("click");

    expect(wrapper.find('[data-test="overview-article"]').text()).toContain(
      "What is historical",
    );
    const link = wrapper.find('[data-test="further-reading"] a');
    expect(link.attributes("href")).toBe("https://wcrp-cmip.org/cmip7/");
    expect(link.attributes("target")).toBe("_blank");
  });

  it("shows a placeholder at Overview when no post is tagged", async () => {
    const wrapper = await mountCard({
      experiment: makeExperiment(),
      post: null,
    });

    expect(wrapper.find('[data-test="overview-placeholder"]').exists()).toBe(
      true,
    );
  });

  it("labels the experiment class and warns that idealised runs are not projections", async () => {
    const wrapper = await mountCard({
      experiment: makeExperiment({ name: "abrupt-4xCO2" }),
      post: null,
    });

    const badge = wrapper.find('[data-test="experiment-class-badge"]');
    expect(badge.attributes("data-class")).toBe("idealised");
    expect(
      wrapper.find('[data-test="not-a-projection-note"]').text(),
    ).toContain("not a real-world climate projection");
  });

  it("does not warn for a historical run, which is not idealised", async () => {
    const wrapper = await mountCard({
      experiment: makeExperiment({ name: "historical" }),
      post: makePost(),
    });

    expect(
      wrapper
        .find('[data-test="experiment-class-badge"]')
        .attributes("data-class"),
    ).toBe("historical");
    expect(wrapper.find('[data-test="not-a-projection-note"]').exists()).toBe(
      false,
    );
  });

  it("shows progress and ESGF at Status level, without the overview", async () => {
    levelState.ref = ref(1);
    const wrapper = await mountCard({
      experiment: makeExperiment(),
      post: makePost(),
    });

    expect(wrapper.find('[data-test="card-status"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="progress-bar"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="esgf-status"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="card-overview"]').exists()).toBe(false);
  });
});
