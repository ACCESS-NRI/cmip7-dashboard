// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { ContentCollectionItem } from "@nuxt/content";
import ExperimentCard from "../ExperimentCard.vue";
import type { PayuExperiment } from "~/services/payuExperiments";
import { EXPERIMENT_CLASSES } from "~/services/experimentClass";

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
    serviceUnits: 100,
    yearsRun: 50,
    expectedYearsRun: 172,
    memberExpectedYearsRun: 172,
    expectedEnsembleCount: 1,
    members: [],
    esgfPublishedCount: 0,
    experimentClass: EXPERIMENT_CLASSES.historical,
    tiers: [],
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
  it("shows progress and ESGF in the status variant, without the overview", async () => {
    const wrapper = await mountCard({
      experiment: makeExperiment(),
      post: makePost(),
    });

    expect(wrapper.find('[data-test="card-status"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="progress-bar"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="esgf-status"]').exists()).toBe(true);
  });
});
