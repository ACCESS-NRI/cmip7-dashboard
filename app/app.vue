<!-- Root component: wraps every route in @nuxt/ui's <UApp> provider, then the
     active layout and page. Layout selection and data live in the pages. -->
<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
