<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();

const items = computed<NavigationMenuItem[]>(() => [
  { label: "Dashboard", to: "/", exact: true },
  // startsWith so the tab stays active on nested entries (/blog/:slug),
  // which are separate route records from /blog and wouldn't match otherwise.
  { label: "Blog", to: "/blog", active: route.path.startsWith("/blog") },
]);
</script>

<!-- Default layout: nuxt-ui header + navigation, replaces the old AppHeader.vue. -->
<template>
  <div class="min-h-screen bg-default text-default">
    <UHeader title="CMIP7 Dashboard">
      <UNavigationMenu :items="items" />
      <template #right>
        <div class="flex items-center gap-4">
          <GitCommit />
        </div>
      </template>
      <template #body>
        <UNavigationMenu :items="items" orientation="vertical" class="mx-2.5" />
      </template>
    </UHeader>
    <UMain>
      <slot />
    </UMain>
  </div>
</template>
