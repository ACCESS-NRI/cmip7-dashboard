<!--
  RunProgressBar — years-run bar with its percentage alongside.

  Shared by the experiment rows and the ensemble-member rows fanned out beneath
  them, so both read against the same scale. Falls back to a plain years figure
  when nothing has declared how long the run is expected to be. Horizontal bar +
  trailing percent, supports a `compact` mode for nested rows, and turns green on
  completion.

  Not to be confused with ExperimentProgress.vue: that one is a stacked
  label-over-bar with an "across N members" caption and no completion colour,
  serving a different layout (the accordion and card grid). They are kept
  separate on purpose — see ExperimentProgress.vue.

  Used by: app/components/ExperimentGroupRow.vue
-->
<script setup lang="ts">
import { computed } from "vue";
import {
  experimentProgressPercent,
  experimentRunStatus,
} from "~/services/experimentGroups";

const props = withDefaults(
  defineProps<{
    yearsRun: number;
    expectedYearsRun: number | null;
    /** Thinner bar and tighter text, for rows nested under another row. */
    compact?: boolean;
    /** Prefix for the `data-test` hooks, so callers can target their own rows. */
    testId?: string;
  }>(),
  { compact: false, testId: "run-progress" },
);

const run = computed(() => ({
  yearsRun: props.yearsRun,
  expectedYearsRun: props.expectedYearsRun,
}));

const percent = computed(() => experimentProgressPercent(run.value));
const isComplete = computed(
  () => experimentRunStatus(run.value) === "completed",
);
</script>

<template>
  <div
    v-if="percent !== null"
    class="flex items-center gap-3"
    :data-test="`${testId}-bar`"
  >
    <div
      class="min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
      :class="compact ? 'h-1.5' : 'h-2'"
    >
      <div
        class="h-full rounded-full transition-all"
        :class="
          isComplete
            ? 'bg-green-500 dark:bg-green-400'
            : 'bg-blue-500 dark:bg-blue-400'
        "
        :style="{ width: `${percent}%` }"
      ></div>
    </div>
    <span
      class="w-10 shrink-0 text-right text-xs text-gray-600 dark:text-gray-400"
    >
      {{ percent }}%
    </span>
  </div>
  <span
    v-else
    class="text-xs text-gray-500 dark:text-gray-400"
    :data-test="`${testId}-unknown`"
  >
    {{ formatNumber(yearsRun) }} years
  </span>
</template>
