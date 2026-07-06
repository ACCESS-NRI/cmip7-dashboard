<script setup lang="ts">
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

const mainRef = ref<HTMLElement | null>(null);

// Iframe-embed helper: tell the parent document how tall we are so it can size
// the iframe to fit, and keep it in sync as content/layout changes.
function notifyHeight() {
  if (mainRef.value) {
    window.parent.postMessage({ height: mainRef.value.scrollHeight }, "*");
  }
}

onMounted(async () => {
  await nextTick();
  notifyHeight();

  if (mainRef.value) {
    const observer = new ResizeObserver(() => notifyHeight());
    observer.observe(mainRef.value);
  }
});
</script>

<template>
  <main ref="mainRef" class="px-4 py-8">
    <BlogArticle v-if="post" :post="post" />
  </main>
</template>
