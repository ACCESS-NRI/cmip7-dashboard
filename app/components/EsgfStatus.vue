<!--
  EsgfStatus — the ESGF publication readout for one experiment.

  Shows how many datasets have been published to ESGF. Stateless: the counts
  are passed in as props, and an optional slot supplies an inline caption.

  Used by: app/components/ExperimentGroupRow.vue,
  app/components/PayuExperimentAccordion.vue, app/components/ExperimentCard.vue
-->
<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  /** Datasets published to ESGF. */
  publishedDatasetCount: number;
}>();

const hasDatasetsPublished = computed(() => props.publishedDatasetCount > 0);
</script>

<!-- ESGF publication indicator: how many of datasets for an experiment's
     ensemble members have been published.
     The default slot can add a caption beside the count;
     shared by the accordion, the card grid and the grouped rows. -->
<template>
  <div class="flex items-center gap-2" data-test="esgf-status">
    <span
      class="text-sm tabular-nums"
      :class="
        hasDatasetsPublished
          ? 'font-medium text-green-600 dark:text-green-400'
          : 'text-gray-600 dark:text-gray-400'
      "
      :aria-label="`${publishedDatasetCount} datasets published to ESGF`"
      data-test="esgf-count"
    >
      {{ publishedDatasetCount }}
    </span>
    <slot />
  </div>
</template>
