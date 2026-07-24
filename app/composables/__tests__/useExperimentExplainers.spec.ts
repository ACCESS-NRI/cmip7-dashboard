// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { clearNuxtData } from "#app";
import { useExperimentExplainers } from "../useExperimentExplainers";

// Mutable fixture the hoisted `queryCollection` mock reads. The composable calls
// queryCollection("content").where(...).all(), so the mock chains both.
const state = vi.hoisted(() => ({ items: [] as unknown[] }));

mockNuxtImport("queryCollection", () => () => ({
  where: () => ({ all: () => Promise.resolve(state.items) }),
}));

let api: Awaited<ReturnType<typeof useExperimentExplainers>>;

const Harness = defineComponent({
  async setup() {
    // useAsyncData dedupes on the key, so clear it between mounts.
    clearNuxtData("experiment-explainers");
    api = await useExperimentExplainers();
    return () => h("div");
  },
});

async function mountExplainers(items: unknown[]) {
  state.items = items;
  await mountSuspended(Harness);
  return api;
}

beforeEach(() => {
  state.items = [];
});

describe("useExperimentExplainers", () => {
  it("indexes posts by their experiment frontmatter name", async () => {
    const abrupt = { experiment: "abrupt-4xCO2", title: "Abrupt" };
    const historical = { experiment: "historical", title: "Historical" };

    const { postByExperiment } = await mountExplainers([abrupt, historical]);

    expect(postByExperiment.value["abrupt-4xCO2"]).toMatchObject(abrupt);
    expect(postByExperiment.value["historical"]).toMatchObject(historical);
  });

  it("skips posts without an experiment name", async () => {
    const { postByExperiment } = await mountExplainers([
      { title: "Untagged post" },
    ]);

    expect(postByExperiment.value).toEqual({});
  });

  it("returns an empty map when there are no posts", async () => {
    const { postByExperiment } = await mountExplainers([]);

    expect(postByExperiment.value).toEqual({});
  });
});
