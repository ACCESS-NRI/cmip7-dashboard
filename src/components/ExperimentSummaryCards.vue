<template>
  <section
    class="mx-auto grid max-w-2xl gap-4 sm:grid-cols-3"
    aria-label="Payu experiment summary"
  >
    <div
      class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <p
        class="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500"
      >
        Total years simulated
      </p>
      <p class="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
        {{ totalYearsRun }}
      </p>
    </div>
    <div
      class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <p
        class="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500"
      >
        Service units used
      </p>
      <p class="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
        {{ totalServiceUnits }}
      </p>
    </div>
    <div
      class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <p
        class="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500"
      >
        Data volumes
      </p>
      <p class="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
        -
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PayuExperiment } from "@/services/payuExperiments";

const props = withDefaults(
  defineProps<{
    experiments: PayuExperiment[];
    loading?: boolean;
    error?: string | null;
  }>(),
  {
    loading: false,
    error: null,
  },
);

const totalYearsRun = computed(() => {
  if (props.loading || props.error) return "-";
  return props.experiments.reduce((sum, e) => sum + e.yearsRun, 0);
});

const totalServiceUnits = computed(() => {
  if (props.loading || props.error) return "-";
  const total = props.experiments.reduce((sum, e) => {
    const su = e.details["experiment_service_units"];
    return typeof su === "number" ? sum + su : sum;
  }, 0);
  return total.toLocaleString(undefined, { maximumFractionDigits: 2 });
});
</script>
