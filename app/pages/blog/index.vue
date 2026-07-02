<script setup lang="ts">
useSeoMeta({
  title: "CMIP7 Updates",
  description:
    "Updates and notes on CMIP7 model runs from the ACCESS-NRI team.",
});
</script>

<template>
  <main class="container mx-auto max-w-2xl px-6 py-12 text-left">
    <h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
      CMIP7 Updates
    </h1>
    <p class="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
      Notes and updates on CMIP7 model runs. To publish a new update, add a
      markdown file under <code>content/blog/</code> with <code>title</code>,
      <code>description</code>, <code>date</code> and
      <code>author</code> frontmatter — it will appear here automatically.
    </p>
    <BlogItems />
  </main>
</template>
