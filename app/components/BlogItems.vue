<!--
  BlogItems — the blog listing as a stack of post cards.

  Renders every published post (newest-first) as a link card showing its date,
  optional author, title, and description. The data comes from the useBlogPosts
  composable and dates are formatted by the shared formatPostDate util (a missing
  date renders as "Draft" here); this component owns only the presentation.
  Shows a "No updates published yet" note when the list is empty.

  Used by: app/pages/blog/index.vue
-->
<script setup lang="ts">
import { useBlogPosts } from "~/composables/useBlogPosts";

const { posts } = await useBlogPosts();
</script>

<template>
  <div class="flex flex-col gap-4">
    <NuxtLink
      v-for="post in posts ?? []"
      :key="post.href"
      :to="post.href"
      class="flex flex-col gap-2 px-6 py-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div
        class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium"
      >
        {{ formatPostDate(post.date, "Draft") }}
        <span v-if="post.author"> · {{ post.author }}</span>
      </div>
      <div
        class="text-sm font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug"
      >
        {{ post.title }}
      </div>
      <div class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        {{ post.description }}
      </div>
    </NuxtLink>

    <p
      v-if="(posts ?? []).length === 0"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      No updates published yet.
    </p>
  </div>
</template>
