// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { clearNuxtData } from "#app";
import { useGlossary, type GlossaryEntry } from "~/composables/useGlossary";

// Raw shape as it arrives from the data collection: the `stem`/`id` path plus
// the schema fields, before `toEntry` derives the slug.
type RawItem = Partial<GlossaryEntry> & {
  term: string;
  short: string;
  long: string;
  id?: string;
  stem?: string;
};

// Mutable fixture the hoisted `queryCollection` mock reads. Each test sets
// `state.items` before mounting; `.all()` resolves it during suspense.
const state = vi.hoisted(() => ({ items: [] as unknown[] }));

mockNuxtImport("queryCollection", () => () => ({
  all: () => Promise.resolve(state.items),
}));

// Capture the composable's real return (with unwrapped refs intact) rather than
// reading it off `wrapper.vm`, whose proxy would unwrap `terms` into a plain
// array and break the `.value` assertions.
let api: ReturnType<typeof useGlossary>;

const Harness = defineComponent({
  setup() {
    // useAsyncData dedupes on the shared "glossary" key, so without this the
    // first mount's fixture would be reused by every later mount.
    clearNuxtData("glossary");
    api = useGlossary();
    return () => h("div");
  },
});

async function mountGlossary(items: RawItem[]) {
  state.items = items;
  await mountSuspended(Harness);
  return api;
}

const deck: RawItem = {
  stem: "glossary/deck",
  term: "DECK",
  expansion: "Diagnosis, Evaluation, and Characterization of Klima",
  short: "The standard baseline set of experiments.",
  long: "A fixed set of core experiments every model contributes.",
  aliases: ["DECK experiments"],
  links: [{ title: "CMIP", url: "https://example.org/deck" }],
};

beforeEach(() => {
  state.items = [];
});

describe("useGlossary", () => {
  describe("toEntry — slug derivation", () => {
    it("takes the trailing segment of `stem` as the slug", async () => {
      const { terms } = await mountGlossary([deck]);
      expect(terms.value[0]!.slug).toBe("deck");
    });

    it("falls back to `id` and strips the file extension", async () => {
      const { terms } = await mountGlossary([
        { id: "glossary/cmip.yml", term: "CMIP", short: "s", long: "l" },
      ]);
      expect(terms.value[0]!.slug).toBe("cmip");
    });

    it("falls back to `term` when neither `stem` nor `id` is present", async () => {
      const { terms } = await mountGlossary([
        { term: "ENSO", short: "s", long: "l" },
      ]);
      expect(terms.value[0]!.slug).toBe("ENSO");
    });

    it("copies the remaining fields through, leaving omitted optionals undefined", async () => {
      const { terms } = await mountGlossary([
        deck,
        { stem: "glossary/enso", term: "ENSO", short: "s", long: "l" },
      ]);

      expect(terms.value.find((t) => t.slug === "deck")).toMatchObject({
        term: "DECK",
        expansion: deck.expansion,
        short: deck.short,
        long: deck.long,
        aliases: deck.aliases,
        links: deck.links,
      });

      const enso = terms.value.find((t) => t.slug === "enso")!;
      expect(enso.expansion).toBeUndefined();
      expect(enso.aliases).toBeUndefined();
      expect(enso.links).toBeUndefined();
    });
  });

  describe("terms ordering", () => {
    it("alphabetises by term regardless of source order", async () => {
      const { terms } = await mountGlossary([
        { stem: "glossary/deck", term: "DECK", short: "s", long: "l" },
        { stem: "glossary/amip", term: "AMIP", short: "s", long: "l" },
        { stem: "glossary/cmip", term: "CMIP", short: "s", long: "l" },
      ]);
      expect(terms.value.map((t) => t.term)).toEqual(["AMIP", "CMIP", "DECK"]);
    });
  });

  describe("byKey — getTerm lookup", () => {
    it("resolves by term, slug and alias", async () => {
      const { getTerm } = await mountGlossary([deck]);
      expect(getTerm("DECK")?.slug).toBe("deck");
      expect(getTerm("deck")?.slug).toBe("deck");
      expect(getTerm("DECK experiments")?.slug).toBe("deck");
    });

    it("is case-insensitive", async () => {
      const { getTerm } = await mountGlossary([deck]);
      expect(getTerm("DeCk")?.slug).toBe("deck");
      expect(getTerm("deck EXPERIMENTS")?.slug).toBe("deck");
    });

    it("trims surrounding whitespace before looking up", async () => {
      const { getTerm } = await mountGlossary([deck]);
      expect(getTerm("  deck  ")?.slug).toBe("deck");
    });

    it("returns undefined for a key that isn't in the glossary", async () => {
      const { getTerm } = await mountGlossary([deck]);
      expect(getTerm("not-a-term")).toBeUndefined();
    });
  });
});
