<!--
  ExperimentProgress — years-run progress against the expected total, or a plain
  badge when no expectation is configured.

  Stacked label-over-bar with an "across N members" caption for ensembles, and no
  completion colour. Shared by the accordion and the card grid.

  Not to be confused with RunProgressBar.vue: that one is a horizontal bar with a
  trailing percent, a `compact` mode, and a green completion state, serving the
  programme-group and ensemble-member rows. They render differently for
  different layouts and are kept separate on purpose — see RunProgressBar.vue.

  Used by: app/components/ExperimentCard.vue,
  app/components/PayuExperimentAccordion.vue
-->
<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  yearsRun: number;
  expectedYearsRun: number | null;
  /**
   * Planned ensemble size. Shown when it is more than one, because the years
   * figures are then summed across every member and the totals look
   * inexplicably large without it.
   */
  ensembleCount?: number;
}>();

// Deliberately a truthy check rather than the `=== null` guard used by
// experimentProgressPercent in ~/services/experimentGroups.ts. They are NOT
// interchangeable: when expectedYearsRun is 0, this yields null (rendering the
// plain years badge) whereas the service function would divide by zero. Do not
// unify the two — see the matching note in experimentGroups.ts.
const percent = computed(() =>
  props.expectedYearsRun
    ? Math.min(100, Math.round((props.yearsRun / props.expectedYearsRun) * 100))
    : null,
);
</script>

<template>
  <div
    v-if="percent !== null"
    class="flex flex-col gap-1"
    data-test="progress-bar"
  >
    <span class="text-xs text-gray-500 dark:text-gray-400">
      {{ yearsRun }} / {{ expectedYearsRun }} years
      <template v-if="ensembleCount && ensembleCount > 1">
        <span data-test="progress-ensemble-count">
          across {{ ensembleCount }} members
        </span>
      </template>
    </span>
    <div
      class="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
    >
      <div
        class="h-full rounded-full bg-blue-500 transition-all dark:bg-blue-400"
        data-test="progress-fill"
        :style="{ width: `${percent}%` }"
      ></div>
    </div>
  </div>
  <span
    v-else
    class="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
    data-test="years-run-badge"
  >
    {{ yearsRun }} years
  </span>
</template>
