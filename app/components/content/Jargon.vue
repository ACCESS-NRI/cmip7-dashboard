<script setup lang="ts">
import { computed } from "vue";
import { useGlossary } from "~/composables/useGlossary";

// Inline jargon/acronym term (issue #12). Two accessible levels of detail:
//   1. hover / focus / tap → a UTooltip with the quick expansion;
//   2. click / tap / keyboard → a UPopover card with the full explanation,
//      further reading, and a link into the glossary.
// It lives in components/content/ so it is also usable inside markdown via MDC
// (`:jargon[DECK]{term="DECK"}`). Unknown terms degrade to plain text, so a
// typo'd `term` never breaks the surrounding page.
const props = defineProps<{
  /** The glossary key to look up (term, slug or alias). */
  term: string;
}>();

const { getTerm } = useGlossary();
const entry = computed(() => getTerm(props.term));

// Quick tooltip text: the acronym expansion if there is one, else the one-liner.
const tooltipText = computed(
  () => entry.value?.expansion ?? entry.value?.short ?? "",
);
</script>

<template>
  <!-- Not in the glossary: render the label as ordinary text. -->
  <span v-if="!entry" data-test="jargon-plain"
    ><slot>{{ term }}</slot></span
  >

  <UPopover v-else :data-test="'jargon-popover'">
    <UTooltip :text="tooltipText">
      <button
        type="button"
        data-test="jargon"
        :data-term="entry.slug"
        class="cursor-help border-b border-dotted border-current font-medium text-primary underline-offset-2"
        :aria-label="`${entry.term}${
          entry.expansion ? ` (${entry.expansion})` : ''
        }: ${entry.short} Activate for the full definition.`"
      >
        <slot>{{ entry.term }}</slot>
      </button>
    </UTooltip>

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
