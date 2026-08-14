<!--
  ExperimentTotals — the campaign-wide totals tile at the top of the dashboard.

  Rolls every experiment's years, service units and completion count into one
  planned-vs-done summary with a progress bar. Simulations are counted per
  ensemble member, so a 30-member ensemble reads as 30 of them. Purely
  presentational: the parent page owns loading/error state and passes the
  experiment list in as a prop. The "Data published" figure is a hardcoded
  placeholder until the API exposes a data-volume field (see the PUBLISHED_GB
  note below).

  Used by: app/pages/index.vue
-->
<script setup lang="ts">
import { computed } from "vue";
import type { PayuExperiment } from "~/services/payuExperiments";
import { experimentRunCounts } from "~/services/experimentGroups";

const props = defineProps<{
  experiments: PayuExperiment[];
}>();

// HARDCODED PLACEHOLDER — nothing publishes a data-volume figure yet: neither
// experiment-config.json nor the payu telemetry API carries one. Replace this
// with a real per-experiment sum (inside the loop below, off a new field on
// PayuExperiment in ~/services/payuExperiments) once the API exposes it. Until
// then the tile honestly reads 0 GB.
const PUBLISHED_GB = 0;

// Rough campaign-wide estimate (issue #62): a typical simulation year's data
// volume times the planned years. We reuse the planned-years roll-up below
// rather than hardcoding it, so the estimate tracks the experiment config.
const GB_PER_SIMULATION_YEAR = 15.4;

// Roll every experiment's years up into one planned-vs-done figure — the
// gentlest, big-picture read on how far the whole campaign has progressed.
// Purely presentational: the page owns loading/error states.
const totals = computed(() => {
  let done = 0;
  let planned = 0;
  let serviceUnits = 0;
  let completed = 0;
  let count = 0;
  for (const experiment of props.experiments) {
    done += experiment.yearsRun;
    if (experiment.expectedYearsRun !== null) {
      planned += experiment.expectedYearsRun;
    }
    serviceUnits += experiment.serviceUnits ?? 0;
    // Per ensemble member, so the count is on the same footing as the years
    // above it — a 30-member ensemble is 30 simulations, not one.
    const counts = experimentRunCounts(experiment);
    completed += counts.completed;
    count += counts.total;
  }
  const percent =
    planned > 0 ? Math.min(100, Math.round((done / planned) * 100)) : null;
  return {
    done,
    planned,
    percent,
    serviceUnits,
    completed,
    publishedGb: PUBLISHED_GB,
    expectedGb: Math.round(planned * GB_PER_SIMULATION_YEAR),
    count,
  };
});
</script>

<template>
  <section aria-label="Total model years" data-test="experiment-totals">
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
        {{ totals.percent }}% complete across {{ totals.count }} simulations
      </p>
    </div>
    <p v-else class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      Across {{ totals.count }} simulations
    </p>

    <div
      class="mt-6 grid grid-cols-1 gap-4 border-t border-gray-200 pt-5 lg:grid-cols-3 dark:border-gray-700"
      data-test="totals-extra"
    >
      <div>
        <p
          class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
        >
          CPU Hours used
        </p>
        <p
          class="mt-1 text-xl font-semibold text-gray-800 sm:text-2xl dark:text-gray-100"
        >
          {{ formatNumber(totals.serviceUnits) }}
        </p>
      </div>
      <div>
        <p
          class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
        >
          Simulations completed
        </p>
        <p
          class="mt-1 text-xl font-semibold text-gray-800 sm:text-2xl dark:text-gray-100"
        >
          {{ totals.completed }}
          <span class="text-lg font-normal text-gray-400 dark:text-gray-500">
            / {{ totals.count }}
          </span>
        </p>
      </div>
      <div data-test="totals-published">
        <p
          class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
        >
          Data published
        </p>
        <p
          class="mt-1 text-xl font-semibold text-gray-800 sm:text-2xl dark:text-gray-100"
        >
          {{ formatNumber(totals.publishedGb) }}
          <span class="text-lg font-normal text-gray-400 dark:text-gray-500">
            / {{ formatNumber(totals.expectedGb) }} GB
          </span>
        </p>
      </div>
    </div>
  </section>
</template>
