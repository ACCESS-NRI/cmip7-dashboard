<!-- Default layout: a UDashboardGroup fills the viewport for page-level
     sidebar/panel content. There is no top bar — each page renders an
     <AppSidebar> (site nav + build version) alongside its <UDashboardPanel>.
     The group's `fixed inset-0` base is retargeted to fill the flex column via
     the `ui.dashboardGroup.base` override in app.config.ts. -->
<template>
  <div class="flex h-svh flex-col bg-default text-default">
    <UDashboardGroup>
      <slot />
    </UDashboardGroup>
  </div>
</template>
