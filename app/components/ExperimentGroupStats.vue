<!--
  ExperimentGroupStats — the stats sidebar inside an open programme-group panel.

  Renders the five status counts (Simulations / Running / Completed / Not started
  / Published) and the simulated-years figure for one group. Stateless: the parent
  passes the precomputed group summary in as a prop.

  Used by: app/components/ExperimentProgrammeGroups.vue
-->
<script setup lang="ts">
import type { ExperimentGroupSummary } from "~/services/experimentGroups";

defineProps<{
  summary: ExperimentGroupSummary;
}>();
</script>

<template>
  <aside
    class="space-y-4 border-b border-gray-100 p-5 dark:border-gray-800 xl:border-r xl:border-b-0"
  >
    <dl class="grid grid-cols-2 gap-3 text-sm xl:grid-cols-1">
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Simulations</dt>
        <dd class="mt-1 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {{ summary.total }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Running</dt>
        <dd class="mt-1 text-lg font-semibold text-blue-600 dark:text-blue-400">
          {{ summary.running }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Completed</dt>
        <dd
          class="mt-1 text-lg font-semibold text-green-600 dark:text-green-400"
        >
          {{ summary.completed }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Not started</dt>
        <dd class="mt-1 text-lg font-semibold text-gray-600 dark:text-gray-300">
          {{ summary.notStarted }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Published</dt>
        <dd class="mt-1 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {{ summary.published }}
        </dd>
      </div>
    </dl>

    <div class="border-t border-gray-100 pt-4 dark:border-gray-800">
      <p class="text-2xl font-semibold text-gray-800 dark:text-gray-100">
        {{ formatNumber(summary.yearsRun) }}
      </p>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        simulated years
        <template v-if="summary.plannedYears">
          of {{ formatNumber(summary.plannedYears) }} planned
        </template>
      </p>
    </div>
  </aside>
</template>
