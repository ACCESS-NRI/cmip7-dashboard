<script setup lang="ts">
// Iframe-embeddable blog post (embed layout, no site chrome). Renders any
// content/blog/*.md by path through BlogArticle and reports its height to the
// host frame via useIframeEmbedHeight.
import { useIframeEmbedHeight } from "~/composables/useIframeEmbedHeight";

definePageMeta({ layout: "embed" });

const route = useRoute();

// This route is prefixed with /embed, but content lives at /blog/<slug>, so
// strip the prefix before looking the post up by its content path.
const contentPath = route.path.replace(/^\/embed/, "");

const { data: post } = await useAsyncData(`blog-embed-${route.path}`, () =>
  queryCollection("content").path(contentPath).first(),
);

if (!post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Update not found",
    fatal: true,
  });
}

useSeoMeta({ title: () => post.value?.title });

const { elementRef: mainRef, start } = useIframeEmbedHeight();

onMounted(async () => {
  await start();
});
</script>

<template>
  <main ref="mainRef" class="px-4 py-8">
    <BlogArticle v-if="post" :post="post" />
  </main>
</template>
