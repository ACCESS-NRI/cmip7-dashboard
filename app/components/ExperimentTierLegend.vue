<!--
  ExperimentTierLegend — a key to the participation tiers on the dashboard.

  Lists only the tiers actually present in the current experiment set (resolved
  by experimentTiersPresent), each with its badge and description. Stateless: the
  resolved tiers for the experiments in view are passed in as a prop.

  Used by: app/pages/index.vue
-->
<script setup lang="ts">
import { computed } from "vue";
import { experimentTiersPresent } from "~/services/experimentTier";
import type { ExperimentTier } from "~/services/experimentTier";

const props = defineProps<{
  /** Resolved tiers for each experiment currently on the dashboard. */
  experimentTiers: ExperimentTier[][];
}>();

const tiers = computed(() => experimentTiersPresent(props.experimentTiers));
</script>

<!-- Explains the DECK / AFT participation layers (issue #21) as a stack: DECK is
     the foundation, AFT sits on top of it. Orthogonal to the scientific
     taxonomy legend — this answers "which CMIP7 layer", not "is it a
     projection". Only lists the tiers actually present in the current set. -->
<template>
  <section
    v-if="tiers.length"
    class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    data-test="experiment-tier-legend"
    aria-label="What the CMIP7 experiment layers mean"
  >
    <h2
      class="mb-1 text-sm font-semibold uppercase text-gray-700 dark:text-gray-200"
    >
      How these fit into CMIP7
    </h2>
    <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
      Simulations are organised in stacked layers: a shared
      <Jargon term="DECK">foundation</Jargon>, with priority simulations
      <Jargon term="Fast Track">fast-tracked</Jargon> on top for assessment.
    </p>
    <ul class="space-y-3">
      <li
        v-for="tier in tiers"
        :key="tier.id"
        class="flex gap-3"
        :data-test="`tier-legend-item-${tier.id}`"
      >
        <UBadge
          :color="tier.color"
          variant="outline"
          :icon="tier.icon"
          :label="tier.label"
          class="mt-0.5 shrink-0"
        />
        <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {{ tier.description }}
        </p>
      </li>
    </ul>
  </section>
</template>
