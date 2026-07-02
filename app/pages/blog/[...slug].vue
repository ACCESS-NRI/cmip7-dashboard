<script setup lang="ts">
const route = useRoute();

// Any content/blog/*.md is rendered here by its path — drop in a markdown file
// and the page exists, no code change required.
const { data: post } = await useAsyncData(`blog-${route.path}`, () =>
  queryCollection("content").path(route.path).first(),
);

if (!post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Update not found",
    fatal: true,
  });
}

useSeoMeta({
  title: () => post.value?.title,
  description: () => post.value?.description,
});

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-AU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
</script>

<template>
  <main class="container mx-auto max-w-2xl px-6 py-12 text-left">
    <NuxtLink
      to="/blog"
      class="mb-6 inline-flex items-center gap-1 text-sm text-blue-700 hover:underline dark:text-blue-400"
    >
      <UIcon name="i-lucide-arrow-left" /> All updates
    </NuxtLink>

    <article v-if="post">
      <header class="mb-6">
        <div
          v-if="post.date || post.author"
          class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500"
        >
          {{ formatDate(post.date as string | undefined) }}
          <span v-if="post.author"> · {{ post.author }}</span>
        </div>
      </header>
      <ContentRenderer
        :value="post"
        class="prose dark:prose-invert max-w-none"
      />
    </article>
  </main>
</template>
