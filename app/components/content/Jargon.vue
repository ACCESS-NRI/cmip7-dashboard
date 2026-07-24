<!--
  Jargon — inline jargon/acronym term with a hover popover (issue #12).

  A single hover popover (reka's HoverCard under the hood) surfaces the
  definition on hover *and* keyboard focus, and its panel is itself hoverable so
  the further-reading and glossary links stay clickable. The trigger is visibly
  highlighted so it's obvious the term is explained. On touch, tapping focuses
  the trigger and opens the card. Lives in components/content/ so it also works
  inside markdown via MDC (`:jargon[DECK]{term="DECK"}`). Unknown terms degrade
  to plain text, so a typo'd `term` never breaks the surrounding page.

  Used by: app/components/ExperimentCard.vue,
  app/components/EvaluationStatus.vue, app/components/ExperimentGroupRow.vue,
  app/components/ExperimentProgrammeGroups.vue,
  app/components/ExperimentTierLegend.vue,
  app/components/PayuExperimentAccordion.vue, app/pages/index.vue,
  app/pages/glossary.vue, and content/*.md via MDC
-->
<script setup lang="ts">
import { computed } from "vue";
import { useGlossary } from "~/composables/useGlossary";

const props = defineProps<{
  /** The glossary key to look up (term, slug or alias). */
  term: string;
}>();

const { getTerm } = useGlossary();
const entry = computed(() => getTerm(props.term));

// Screen-reader label: term, its expansion, and the one-line gloss.
const ariaLabel = computed(() => {
  const e = entry.value;
  if (!e) return "";
  const head = e.expansion ? `${e.term}, ${e.expansion}` : e.term;
  return `${head}. ${e.short} Definition available.`;
});
</script>

<template>
  <!-- Not in the glossary: render the label as ordinary text. -->
  <span v-if="!entry" data-test="jargon-plain"
    ><slot>{{ term }}</slot></span
  >

  <UPopover
    v-else
    mode="hover"
    :open-delay="120"
    :close-delay="120"
    :data-test="'jargon-popover'"
  >
    <button
      type="button"
      data-test="jargon"
      :data-term="entry.slug"
      :aria-label="ariaLabel"
      class="jargon cursor-help rounded-[0.25rem] bg-primary/10 px-1 font-medium text-primary underline decoration-primary/40 decoration-dotted underline-offset-[3px] transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
    >
      <slot>{{ entry.term }}</slot
      ><UIcon
        name="i-lucide-info"
        class="ml-0.5 inline-block size-3 translate-y-[1px] opacity-60"
      />
    </button>

    <template #content>
      <div class="max-w-xs space-y-2 p-4">
        <div>
          <p class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ entry.term }}
          </p>
          <p
            v-if="entry.expansion"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            {{ entry.expansion }}
          </p>
        </div>
        <p
          class="text-sm leading-relaxed text-gray-600 dark:text-gray-300"
          data-test="jargon-long"
        >
          {{ entry.long }}
        </p>
        <FurtherReading v-if="entry.links?.length" :links="entry.links" />
        <NuxtLink
          :to="`/glossary#${entry.slug}`"
          class="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          data-test="jargon-glossary-link"
        >
          Full definition
          <UIcon name="i-lucide-arrow-right" class="size-3.5" />
        </NuxtLink>
      </div>
    </template>
  </UPopover>
</template>
