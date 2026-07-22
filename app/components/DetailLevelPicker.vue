<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { DETAIL_LEVELS, useDetailLevel } from "~/composables/useDetailLevel";

const level = useDetailLevel();

// One parent entry with the levels nested under it, in the style of the
// Nuxt UI sidebar settings pattern.
const items = computed<NavigationMenuItem[]>(() => [
  {
    label: "Detail level",
    icon: "i-lucide-sliders-horizontal",
    defaultOpen: true,
    children: DETAIL_LEVELS.map((meta) => ({
      label: meta.name,
      active: level.value === meta.value,
      onSelect: () => {
        level.value = meta.value;
      },
    })),
  },
]);

const activeMeta = computed(() => DETAIL_LEVELS[level.value]);
</script>

<template>
  <div data-test="detail-level-picker">
    <UNavigationMenu :items="items" orientation="vertical" />
    <!-- Vertical menus render child labels only, so spell out what the
         active level shows just below the menu. -->
    <p
      class="mt-2 px-2.5 text-xs text-gray-400 dark:text-gray-500"
      data-test="active-level-description"
    >
      {{ activeMeta?.description }}
    </p>
  </div>
</template>
