<script setup lang="ts">
import { computed } from "vue";
import type { PayuExperiment } from "~/services/payuExperiments";

const props = defineProps<{
  experiments: PayuExperiment[];
}>();

// Roll every experiment's years up into one planned-vs-done figure — the
// gentlest, big-picture read on how far the whole campaign has progressed.
// Purely presentational: the page owns loading/error states.
const totals = computed(() => {
  let done = 0;
  let planned = 0;
  for (const experiment of props.experiments) {
    done += experiment.yearsRun;
    if (experiment.expectedYearsRun !== null) {
      planned += experiment.expectedYearsRun;
    }
  }
  const percent =
    planned > 0 ? Math.min(100, Math.round((done / planned) * 100)) : null;
  return { done, planned, percent, count: props.experiments.length };
});

const formatNumber = (value: number) => value.toLocaleString();
</script>

<template>
  <section
    class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    aria-label="Total model years"
    data-test="experiment-totals"
  >
    <p
      class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
    >
      Total model years simulated
    </p>

    <p class="mt-2 text-3xl font-semibold text-gray-800 dark:text-gray-100">
      {{ formatNumber(totals.done) }}
      <span class="text-lg font-normal text-gray-400 dark:text-gray-500">
        / {{ formatNumber(totals.planned) }} years planned
      </span>
    </p>

    <div
      v-if="totals.percent !== null"
      class="mt-4"
      data-test="totals-progress"
    >
      <div
        class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
      >
        <div
          class="h-full rounded-full bg-blue-500 transition-all dark:bg-blue-400"
          :style="{ width: `${totals.percent}%` }"
        ></div>
      </div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {{ totals.percent }}% complete across {{ totals.count }} experiments
      </p>
    </div>
    <p v-else class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      Across {{ totals.count }} experiments
    </p>
  </section>
</template>
