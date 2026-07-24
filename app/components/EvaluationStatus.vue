<!--
  EvaluationStatus — placeholder readout for the Rapid Evaluation Framework.

  REF is not wired to a data source yet, so this renders a "not yet available"
  state until an evaluation status is supplied. Stateless: the optional status is
  passed in as a prop.

  Used by: app/components/ExperimentCard.vue
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    /**
     * Optional evaluation state from the Rapid Evaluation Framework. REF is not
     * wired to a data source yet, so this is a placeholder: when absent, the
     * component shows a "not yet available" state.
     */
    refStatus?: string | null;
  }>(),
  { refStatus: null },
);
</script>

<!-- REF (Rapid Evaluation Framework) placeholder (issue #21).

     REF is a SEPARATE dimension from run progress: it is about how well an
     experiment's output evaluates, not how many years it has run. It is styled
     as deliberately detached — muted, dashed border — so it never reads as part
     of the progress/telemetry block, and there is no live data source yet. -->
<template>
  <div
    class="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:border-gray-600 dark:bg-gray-800/40 dark:text-gray-400"
    data-test="evaluation-status"
  >
    <UIcon name="i-lucide-radar" class="size-4 shrink-0" />
    <span>
      Evaluation (<Jargon term="REF">REF</Jargon>) —
      <template v-if="refStatus">{{ refStatus }}</template>
      <template v-else>Rapid Evaluation Framework — not yet available</template>
    </span>
  </div>
</template>
