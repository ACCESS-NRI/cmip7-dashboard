import { computed } from "vue";

/**
 * useGlossary — single source of truth for the CMIP7 glossary (issue #12).
 *
 * The `glossary` Content collection (content/glossary/*.yml) feeds both the
 * /glossary page and the inline <Jargon> component through this composable.
 *
 * The whole (small) glossary is fetched once per page via `useAsyncData`, whose
 * shared "glossary" key dedupes the request no matter how many <Jargon> tags a
 * page renders, and resolves during SSR so tooltips work without hydration.
 *
 * Used by: app/components/content/Jargon.vue,
 * app/components/ExperimentProgrammeGroups.vue, app/pages/glossary.vue
 */
export interface GlossaryEntry {
  /** Anchor slug (the file stem), used for /glossary#<slug> deep links. */
  slug: string;
  term: string;
  expansion?: string;
  short: string;
  long: string;
  aliases?: string[];
  links?: { title: string; url: string }[];
}

/** A raw item from the data collection, plus the system fields we read off it. */
type RawGlossaryItem = Omit<GlossaryEntry, "slug"> & {
  id?: string;
  stem?: string;
};

function toEntry(item: RawGlossaryItem): GlossaryEntry {
  // Data-collection items carry a `stem`/`id` path (e.g. "glossary/deck");
  // the trailing segment (minus any extension) is the anchor slug.
  const path = item.stem ?? item.id ?? item.term;
  const slug = path
    .split("/")
    .pop()!
    .replace(/\.[^.]+$/, "");
  return {
    slug,
    term: item.term,
    expansion: item.expansion,
    short: item.short,
    long: item.long,
    aliases: item.aliases,
    links: item.links,
  };
}

export function useGlossary() {
  const { data } = useAsyncData("glossary", () =>
    queryCollection("glossary").all(),
  );

  /** All terms, alphabetised — what the glossary page lists. */
  const terms = computed<GlossaryEntry[]>(() =>
    ((data.value ?? []) as RawGlossaryItem[])
      .map(toEntry)
      .sort((a, b) => a.term.localeCompare(b.term)),
  );

  /** Case-insensitive lookup by term, slug or alias. */
  const byKey = computed(() => {
    const map = new Map<string, GlossaryEntry>();
    for (const entry of terms.value) {
      map.set(entry.term.toLowerCase(), entry);
      map.set(entry.slug.toLowerCase(), entry);
      for (const alias of entry.aliases ?? [])
        map.set(alias.toLowerCase(), entry);
    }
    return map;
  });

  /** Resolve a term written inline; `undefined` when it isn't in the glossary. */
  const getTerm = (key: string): GlossaryEntry | undefined =>
    byKey.value.get(key.trim().toLowerCase());

  return { terms, getTerm };
}
