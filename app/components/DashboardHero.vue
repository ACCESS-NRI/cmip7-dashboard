<script setup lang="ts">
import type { PayuExperiment } from "~/services/payuExperiments";
import accessLogo from "~/assets/ACCESS-logo.svg";

// Purely presentational: the page owns the fetch, this renders whichever of
// loading / error / empty / totals applies.
defineProps<{
  experiments: PayuExperiment[];
  loading: boolean;
  error: string | null;
}>();
</script>

<template>
  <section
    id="hero"
    class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
  >
    <!-- Full-width banner across the top of the hero: the campaign headline and
         a one-line status subtitle on the left, the ACCESS-NRI logo on the
         right, spanning above the stats. -->
    <div
      class="mb-6 flex items-start justify-between gap-4 border-b border-gray-200 pb-6 dark:border-gray-700"
    >
      <div>
        <h2
          class="text-xl font-semibold text-gray-800 sm:text-2xl dark:text-gray-100"
        >
          Tracking Australia's Global Climate Projections with ACCESS-ESM1.6
        </h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Live status of CMIP7 model simulations and data publication
        </p>
      </div>
      <a
        href="https://www.access-nri.org.au"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="ACCESS-NRI"
        class="flex shrink-0 items-center"
      >
        <img :src="accessLogo" alt="ACCESS-NRI" class="h-16 object-contain" />
      </a>
    </div>

    <!-- Stat zone: hosts the loading/error/empty states and totals. -->
    <div
      v-if="loading"
      data-test="experiments-loading"
      class="flex items-center justify-center py-6 text-sm text-gray-400 dark:text-gray-500"
    >
      Loading simulations…
    </div>

    <div
      v-else-if="error"
      data-test="experiments-error"
      class="flex items-center justify-center py-6 text-sm text-red-600 dark:text-red-400"
    >
      {{ error }}
    </div>

    <div
      v-else-if="experiments.length === 0"
      data-test="experiments-empty"
      class="flex items-center justify-center py-6 text-sm text-gray-400 dark:text-gray-500"
    >
      No simulations found.
    </div>

    <ExperimentTotals v-else :experiments="experiments" />
  </section>
</template>
