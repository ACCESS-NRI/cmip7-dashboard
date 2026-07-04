// @vitest-environment nuxt
import { describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import GlossaryPage from "../glossary.vue";
import type { GlossaryEntry } from "~/composables/useGlossary";

const terms: GlossaryEntry[] = [
  {
    slug: "cmip",
    term: "CMIP",
    expansion: "Coupled Model Intercomparison Project",
    short: "The international model-comparison effort.",
    long: "CMIP agrees on a shared set of experiments so models can be compared.",
  },
  {
    slug: "deck",
    term: "DECK",
    expansion: "Diagnosis, Evaluation, and Characterization of Klima",
    short: "The standard baseline set of experiments.",
    long: "A fixed set of core experiments every model contributes.",
  },
];

vi.mock("~/composables/useGlossary", () => ({
  useGlossary: () => ({ terms: { value: terms }, getTerm: () => undefined }),
}));

describe("glossary page", () => {
  it("lists every term as a card with its slug as an anchor id", async () => {
    const wrapper = await mountSuspended(GlossaryPage);

    const cards = wrapper.findAll('[data-test="glossary-card"]');
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.attributes("id"))).toEqual(["cmip", "deck"]);
    expect(wrapper.text()).toContain("Coupled Model Intercomparison Project");
  });

  it("filters the cards as you type in the search box", async () => {
    const wrapper = await mountSuspended(GlossaryPage);

    await wrapper.find("input").setValue("klima");

    const cards = wrapper.findAll('[data-test="glossary-card"]');
    expect(cards).toHaveLength(1);
    expect(cards[0]!.attributes("id")).toBe("deck");
  });

  it("shows an empty state when nothing matches", async () => {
    const wrapper = await mountSuspended(GlossaryPage);

    await wrapper.find("input").setValue("zzzzz");

    expect(wrapper.findAll('[data-test="glossary-card"]')).toHaveLength(0);
    expect(wrapper.find('[data-test="glossary-empty"]').exists()).toBe(true);
  });
});
