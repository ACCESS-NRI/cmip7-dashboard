<template>
  <section
    class="mx-auto mb-12 max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
    aria-label="Payu experiment runs"
  >
    <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
      <h2
        class="text-sm font-semibold uppercase text-gray-700 dark:text-gray-200"
      >
        Experiment runs
      </h2>
    </div>

    <!-- Loading state -->
    <div
      v-if="loading"
      data-test="payu-loading"
      class="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500"
    >
      Loading experiments…
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      data-test="payu-error"
      class="px-5 py-6 text-sm text-red-600 dark:text-red-400"
    >
      {{ error }}
    </div>

    <!-- Empty state -->
    <div
      v-else-if="experiments.length === 0"
      data-test="payu-empty"
      class="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500"
    >
      {{ emptyMessage }}
    </div>

    <!-- Column headers + accordion — shown when there's data -->
    <template v-else>
      <div
        class="grid items-center border-b border-gray-100 px-5 py-2 dark:border-gray-700"
        style="grid-template-columns: 1fr 11rem 4rem"
      >
        <span
          class="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500"
        >
          Experiment
        </span>
        <span
          class="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500"
        >
          Simulations
        </span>
        <span
          class="text-center text-xs font-semibold uppercase text-gray-400 dark:text-gray-500"
        >
          ESGF
        </span>
      </div>

      <!-- Accordion list -->
      <UAccordion
        v-model="openPanels"
        type="multiple"
        :items="items"
        :unmount-on-hide="false"
        class="px-2 py-1"
        data-test="payu-accordion"
      >
        <template #default="{ item }">
          <div
            class="grid w-full items-center"
            style="grid-template-columns: 1fr 11rem 4rem"
            data-test="accordion-trigger"
          >
            <!-- Experiment column -->
            <span
              class="min-w-0 truncate text-sm font-medium text-gray-800 dark:text-gray-100"
            >
              {{ item.experiment.name }}
            </span>

            <!-- Simulations column: progress bar or fallback badge -->
            <div
              v-if="item.experiment.expectedYearsRun !== null"
              class="flex flex-col gap-1"
              data-test="progress-bar"
            >
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ item.experiment.yearsRun }} /
                {{ item.experiment.expectedYearsRun }} years
              </span>
              <div
                class="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
              >
                <div
                  class="h-full rounded-full bg-blue-500 transition-all dark:bg-blue-400"
                  data-test="progress-fill"
                  :style="{
                    width: `${Math.min(100, Math.round((item.experiment.yearsRun / item.experiment.expectedYearsRun) * 100))}%`,
                  }"
                ></div>
              </div>
            </div>
            <span
              v-else
              class="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              data-test="years-run-badge"
            >
              {{ item.experiment.yearsRun }} years
            </span>

            <!-- ESGF column -->
            <div class="flex justify-center" data-test="esgf-status">
              <input
                type="checkbox"
                :checked="item.experiment.esgfPublished ?? false"
                disabled
                class="h-4 w-4 rounded accent-blue-600"
                :aria-label="`ESGF published: ${item.experiment.esgfPublished ? 'yes' : 'no'}`"
              />
            </div>
          </div>
        </template>

        <template #content="{ item }">
          <div
            v-if="Object.keys(item.experiment.details).length === 0"
            class="px-1 py-2 text-center text-sm text-gray-400 dark:text-gray-500"
            data-test="accordion-content"
          >
            No model runs found
          </div>
          <dl
            v-else
            class="grid grid-cols-1 gap-y-2 px-1 py-2 sm:grid-cols-2"
            data-test="accordion-content"
          >
            <template
              v-for="[key, value] in Object.entries(item.experiment.details)"
              :key="key"
            >
              <div class="min-w-0">
                <dt
                  class="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500"
                >
                  {{ formatKey(key) }}
                </dt>
                <dd
                  class="mt-0.5 break-all text-sm text-gray-700 dark:text-gray-300"
                >
                  {{ formatValue(value) }}
                </dd>
              </div>
            </template>
          </dl>
        </template>
      </UAccordion>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { AccordionItem } from "@nuxt/ui";
import type { PayuExperiment } from "~/services/payuExperiments";

const props = withDefaults(
  defineProps<{
    experiments: PayuExperiment[];
    loading?: boolean;
    error?: string | null;
    emptyMessage?: string;
  }>(),
  {
    loading: false,
    error: null,
    emptyMessage: "No experiment runs found.",
  },
);

// Map experiments onto nuxt-ui accordion items; the full experiment is carried
// on each item so the trigger/content slots can render its fields.
type PayuAccordionItem = AccordionItem & { experiment: PayuExperiment };

const items = computed<PayuAccordionItem[]>(() =>
  props.experiments.map((experiment) => ({
    value: experiment.uuid || experiment.name,
    label: experiment.name,
    experiment,
  })),
);

// Track open panel UUIDs; multiple open at once is always allowed.
const openPanels = ref<string[]>([]);

// Expose for testing
defineExpose({ openPanels });

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatKey(key: string): string {
  return key.replaceAll("_", " ");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}
</script>
