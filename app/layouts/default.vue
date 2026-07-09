<!-- Default layout: shared site header + a plain scrolling main area. -->
<template>
  <div class="min-h-screen bg-default text-default">
    <SiteHeader />
    <UMain>
      <slot />
    </UMain>
  </div>
</template>
