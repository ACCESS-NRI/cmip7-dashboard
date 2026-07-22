<script setup lang="ts">
// Shared dashboard sidebar chrome used by every page in the default layout:
// the site title (header), an optional page-specific middle (default slot, e.g.
// the dashboard's SectionNav), and the primary nav + build version pinned to the
// bottom. There is no top bar — this sidebar is the site's only navigation.
const { items } = useSiteNav();
</script>

<template>
  <UDashboardSidebar collapsible resizable>
    <slot />

    <!-- Primary nav + build version at the bottom of the sidebar. The active
         link keeps its green text but drops the grey pill background. -->
    <template #footer>
      <div class="flex w-full flex-col gap-3">
        <UNavigationMenu
          :items="items"
          orientation="vertical"
          :ui="{ link: 'before:bg-transparent' }"
          class="-mx-1.5"
        />
        <GitCommit />
      </div>
    </template>
  </UDashboardSidebar>
</template>
