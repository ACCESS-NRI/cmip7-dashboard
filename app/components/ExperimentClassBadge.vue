<!--
  ExperimentClassBadge — a coloured badge labelling an experiment's taxonomy class.

  Renders the resolved scientific class (e.g. projection, idealised) with its
  framing colour, at one of two sizes. Stateless: the class is passed in as a
  prop. The taxonomy itself lives in services/experimentClass.ts.

  Used by: app/components/ExperimentGroupRow.vue, app/components/ExperimentCard.vue,
  app/components/PayuExperimentAccordion.vue
-->
<script setup lang="ts">
import type { ExperimentClass } from "~/services/experimentClass";

withDefaults(
  defineProps<{
    /** The resolved taxonomy class to label. */
    experimentClass: ExperimentClass;
    size?: "sm" | "md";
  }>(),
  { size: "md" },
);
</script>

<!-- Class badge for an experiment (issue #14): flags at a glance whether a run
     is a projection or an idealised/diagnostic/control experiment. -->
<template>
  <UBadge
    :color="experimentClass.color"
    variant="subtle"
    :size="size"
    :icon="experimentClass.icon"
    :label="experimentClass.shortLabel"
    :title="experimentClass.description"
    :data-test="`experiment-class-badge`"
    :data-class="experimentClass.id"
  />
</template>
