<script setup lang="ts">
import { computed } from "vue";
import { experimentClassesPresent } from "~/services/experimentClass";
import type { ExperimentClassId } from "~/services/experimentClass";

const props = defineProps<{
  /** Taxonomy class ids of the experiments currently on the dashboard. */
  classIds: ExperimentClassId[];
}>();

const classes = computed(() => experimentClassesPresent(props.classIds));
</script>

<!-- Explains the experiment taxonomy so the projection / non-projection
     distinction (issue #14) does not rely on prior CMIP knowledge. Only lists
     the classes actually present in the current experiment set. -->
<template>
  <section
    class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    data-test="experiment-class-legend"
    aria-label="What the experiment types mean"
  >
    <h2
      class="mb-1 text-sm font-semibold uppercase text-gray-700 dark:text-gray-200"
    >
      What these simulations are
    </h2>
    <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
      Most runs here are controlled model experiments, not forecasts of the real
      world. Only simulations marked
      <span class="font-medium text-primary">Projection</span> describe a
      possible future.
    </p>
    <ul class="space-y-3">
      <li
        v-for="cls in classes"
        :key="cls.id"
        class="flex gap-3"
        :data-test="`legend-item-${cls.id}`"
      >
        <UBadge
          :color="cls.color"
          variant="subtle"
          :icon="cls.icon"
          :label="cls.label"
          class="mt-0.5 shrink-0"
        />
        <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {{ cls.description }}
        </p>
      </li>
    </ul>
  </section>
</template>
