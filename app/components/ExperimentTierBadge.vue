<!--
  ExperimentTierBadge — a coloured badge labelling an experiment's participation tier.

  Renders a CMIP7 participation tier (e.g. DECK, AFT) with its colour, at one of
  two sizes. Stateless: the tier is passed in as a prop. The tier taxonomy lives
  in services/experimentTier.ts.

  Used by: app/components/ExperimentCard.vue
-->
<script setup lang="ts">
import type { ExperimentTier } from "~/services/experimentTier";

withDefaults(
  defineProps<{
    /** The participation tier to label. */
    tier: ExperimentTier;
    size?: "sm" | "md";
  }>(),
  { size: "md" },
);
</script>

<!-- Participation-tier badge for an experiment (issue #21). Uses the `outline`
     variant — distinct from the class badge's `subtle` fill — so the two
     orthogonal axes (what kind of run vs. which CMIP7 layer) read as separate
     things at a glance. -->
<template>
  <UBadge
    :color="tier.color"
    variant="outline"
    :size="size"
    :icon="tier.icon"
    :label="tier.shortLabel"
    :title="tier.description"
    data-test="experiment-tier-badge"
    :data-tier="tier.id"
  />
</template>
