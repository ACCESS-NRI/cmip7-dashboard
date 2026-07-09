<!-- Dashboard layout: shared site header on top, with a UDashboardGroup
     filling the rest of the viewport for page-level sidebar/panel content.
     The group's `fixed inset-0` base is retargeted to sit below the header
     via the `ui.dashboardGroup.base` override in app.config.ts. -->
<template>
  <div class="flex h-svh flex-col bg-default text-default">
    <SiteHeader />
    <UDashboardGroup>
      <slot />
    </UDashboardGroup>
  </div>
</template>
