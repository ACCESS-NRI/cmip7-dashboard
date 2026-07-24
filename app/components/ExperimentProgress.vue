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

const percent = computed(() =>
  props.expectedYearsRun
    ? Math.min(100, Math.round((props.yearsRun / props.expectedYearsRun) * 100))
    : null,
);
</script>

<!-- Years-run progress against the expected total, or a plain badge when no
     expectation is configured. Shared by the accordion and the card grid. -->
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
