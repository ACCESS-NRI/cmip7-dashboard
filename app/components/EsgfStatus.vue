<!--
  EsgfStatus — the ESGF publication readout for one experiment.

  Shows how many ensemble members are published to ESGF out of the total, as a
  count that turns complete when all members are published. Stateless: the counts
  are passed in as props, and an optional slot supplies an inline caption.

  Used by: app/components/ExperimentGroupRow.vue,
  app/components/PayuExperimentAccordion.vue, app/components/ExperimentCard.vue
-->
<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  /** Ensemble members published to ESGF. */
  publishedCount: number;
  /** Members expected in total; 1 for an experiment that is a single run. */
  total: number;
}>();

const isComplete = computed(
  () => props.total > 0 && props.publishedCount >= props.total,
);
</script>

<!-- ESGF publication indicator: how many of an experiment's ensemble members
     have been published. The default slot can add a caption beside the count;
     shared by the accordion, the card grid and the grouped rows. -->
<template>
  <div class="flex items-center gap-2" data-test="esgf-status">
    <span
      class="text-sm tabular-nums"
      :class="
        isComplete
          ? 'font-medium text-green-600 dark:text-green-400'
          : 'text-gray-600 dark:text-gray-400'
      "
      :aria-label="`${publishedCount} of ${total} published to ESGF`"
      data-test="esgf-count"
    >
      {{ publishedCount }}/{{ total }}
    </span>
    <slot />
  </div>
</template>
