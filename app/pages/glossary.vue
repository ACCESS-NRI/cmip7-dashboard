<script setup lang="ts">
import { computed, ref } from "vue";
import { useGlossary } from "~/composables/useGlossary";

// Central glossary of CMIP7 jargon (issue #12). Searchable cards, each with an
// `id` anchor so terms can be deep-linked from anywhere (e.g. /glossary#deck,
// which the inline <Jargon> popover links to).
const { terms } = useGlossary();

const search = ref("");
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return terms.value;
  return terms.value.filter((t) =>
    [t.term, t.expansion, t.short, t.long]
      .filter((f): f is string => Boolean(f))
      .some((f) => f.toLowerCase().includes(q)),
  );
});

useSeoMeta({
  title: "Glossary",
  description:
    "Plain-language explanations of the CMIP7 acronyms and terms used across the dashboard.",
});
</script>

<template>
  <main class="container mx-auto max-w-3xl px-6 py-12 text-left">
    <header class="mb-8">
      <h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
        Glossary
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Plain-language explanations of the acronyms and terms used across this
        dashboard. Search below, or link straight to a term with
        <code>/glossary#term</code>.
      </p>
    </header>

    <UInput
      v-model="search"
      icon="i-lucide-search"
      placeholder="Search terms…"
      size="lg"
      class="mb-8 w-full"
      data-test="glossary-search"
    />

    <div class="space-y-4">
      <section
        v-for="entry in filtered"
        :id="entry.slug"
        :key="entry.slug"
        class="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm target:ring-2 target:ring-primary dark:border-gray-700 dark:bg-gray-900"
        data-test="glossary-card"
      >
        <div class="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ entry.term }}
          </h2>
          <p
            v-if="entry.expansion"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            {{ entry.expansion }}
          </p>
        </div>
        <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ entry.short }}
        </p>
        <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {{ entry.long }}
        </p>
        <FurtherReading
          v-if="entry.links?.length"
          :links="entry.links"
          class="mt-4"
        />
      </section>

      <p
        v-if="!filtered.length"
        class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
        data-test="glossary-empty"
      >
        No terms match “{{ search }}”.
      </p>
    </div>
  </main>
</template>
