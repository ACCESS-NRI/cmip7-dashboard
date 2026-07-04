<script setup lang="ts">
import { computed } from "vue";
import { classifyExperiment } from "~/services/experimentClass";

const props = withDefaults(
  defineProps<{
    /** Experiment name to classify and label. */
    name: string;
    size?: "sm" | "md";
  }>(),
  { size: "md" },
);

const experimentClass = computed(() => classifyExperiment(props.name));
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
