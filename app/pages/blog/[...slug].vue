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
</script>

<template>
  <AppSidebar />

  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="CMIP7 Dashboard" class="lg:hidden" />
    </template>

    <template #body>
      <div class="mx-auto w-full max-w-2xl text-left">
        <NuxtLink
          to="/blog"
          class="mb-6 inline-flex items-center gap-1 text-sm text-blue-700 hover:underline dark:text-blue-400"
        >
          <UIcon name="i-lucide-arrow-left" /> All updates
        </NuxtLink>

        <BlogArticle v-if="post" :post="post" />
      </div>
    </template>
  </UDashboardPanel>
</template>
