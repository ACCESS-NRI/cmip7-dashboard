// @vitest-environment nuxt
import { describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import Jargon from "../Jargon.vue";
import type { GlossaryEntry } from "~/composables/useGlossary";

const deck: GlossaryEntry = {
  slug: "deck",
  term: "DECK",
  expansion: "Diagnosis, Evaluation, and Characterization of Klima",
  short: "The standard baseline set of experiments every CMIP model runs.",
  long: "The DECK is a small, fixed set of core experiments that every model contributes.",
  links: [
    {
      title: "Eyring et al. (2016)",
      url: "https://doi.org/10.5194/gmd-9-1937-2016",
    },
  ],
};

vi.mock("~/composables/useGlossary", () => ({
  useGlossary: () => ({
    terms: { value: [deck] },
    getTerm: (key: string) =>
      key.trim().toLowerCase() === "deck" ? deck : undefined,
  }),
}));

// Render the tooltip/popover slots inline so their bindings are assertable
// without depending on reka-ui's teleport + floating-ui behaviour in happy-dom.
const stubs = {
  UTooltip: {
    props: ["text"],
    template: `<span :data-tooltip="text"><slot /></span>`,
  },
  UPopover: { template: `<span><slot /><slot name="content" /></span>` },
};

function mountJargon(term: string) {
  return mountSuspended(Jargon, { props: { term }, global: { stubs } });
}

describe("Jargon", () => {
  it("renders a known term as an accessible trigger carrying the expansion", async () => {
    const wrapper = await mountJargon("DECK");

    const trigger = wrapper.find('[data-test="jargon"]');
    expect(trigger.exists()).toBe(true);
    expect(trigger.text()).toBe("DECK");
    expect(trigger.attributes("data-term")).toBe("deck");
    // The acronym expansion is in the tooltip and echoed in the aria-label.
    expect(wrapper.find("[data-tooltip]").attributes("data-tooltip")).toContain(
      "Diagnosis, Evaluation",
    );
    expect(trigger.attributes("aria-label")).toContain("Diagnosis, Evaluation");
  });

  it("reveals the full definition, further reading and a glossary deep link", async () => {
    const wrapper = await mountJargon("deck");

    expect(wrapper.find('[data-test="jargon-long"]').text()).toContain(
      "small, fixed set of core experiments",
    );
    expect(
      wrapper.find('[data-test="further-reading"] a').attributes("href"),
    ).toBe("https://doi.org/10.5194/gmd-9-1937-2016");
    expect(
      wrapper.find('[data-test="jargon-glossary-link"]').attributes("href"),
    ).toContain("/glossary#deck");
  });

  it("falls back to plain text for a term that is not in the glossary", async () => {
    const wrapper = await mountSuspended(Jargon, {
      props: { term: "notaterm" },
      slots: { default: () => "notaterm" },
      global: { stubs },
    });

    expect(wrapper.find('[data-test="jargon"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="jargon-plain"]').text()).toBe("notaterm");
  });
});
