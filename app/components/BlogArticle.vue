<!--
  BlogArticle — shared blog-post renderer.

  Used by the /blog/:slug page and the iframe embed route so both show the same
  title, byline, body and further-reading list. Purely presentational: the post
  is passed in as a prop. A missing date renders as nothing (the empty-string
  fallback of formatPostDate).

  Used by: app/pages/blog/[...slug].vue, app/pages/embed/blog/[...slug].vue
-->
<script setup lang="ts">
import type { ContentCollectionItem } from "@nuxt/content";

defineProps<{ post: ContentCollectionItem }>();
</script>

<template>
  <article>
    <!-- Post titles live in frontmatter (not as a markdown h1), so the blog
         index, dashboard explainer cards and this page all render the same
         source of truth. Kept outside <header> so the byline stays isolated. -->
    <h1
      v-if="post.title"
      class="mb-2 text-3xl font-bold text-gray-900 dark:text-white"
    >
      {{ post.title }}
    </h1>
    <header class="mb-6">
      <div
        v-if="post.date || post.author"
        class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500"
      >
        {{ formatPostDate(post.date) }}
        <span v-if="post.author"> · {{ post.author }}</span>
      </div>
    </header>
    <ContentRenderer :value="post" class="prose dark:prose-invert max-w-none" />

    <FurtherReading
      v-if="post.furtherReading?.length"
      :links="post.furtherReading"
      class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700"
    />
  </article>
</template>
