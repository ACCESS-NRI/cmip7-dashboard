<script setup lang="ts">
// The /blog route: lists every published post as cards via the BlogItems
// component (which loads the posts through useBlogPosts).
useSeoMeta({
  title: "CMIP7 Updates",
  description:
    "Updates and notes on CMIP7 model runs from the ACCESS-NRI team.",
});
</script>

<template>
  <AppSidebar />

  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="CMIP7 Dashboard" class="lg:hidden" />
    </template>

    <template #body>
      <div class="mx-auto w-full max-w-2xl text-left">
        <h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          CMIP7 Updates
        </h1>
        <p
          class="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400"
        >
          Notes and updates on CMIP7 model runs. To publish a new update, add a
          markdown file under <code>content/blog/</code> with
          <code>title</code>, <code>description</code>, <code>date</code> and
          <code>author</code> frontmatter — it will appear here automatically.
        </p>
        <BlogItems />
      </div>
    </template>
  </UDashboardPanel>
</template>
