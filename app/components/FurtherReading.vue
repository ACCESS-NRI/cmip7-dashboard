<script setup lang="ts">
defineProps<{
  links: { title: string; url: string }[];
}>();
</script>

<!-- Outbound "Further reading" links from a post's frontmatter; shared by the
     dashboard overview cards and the blog post pages. -->
<template>
  <div data-test="further-reading">
    <p class="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">
      Further reading
    </p>
    <ul class="mt-1 space-y-1">
      <li v-for="link in links" :key="link.url">
        <a
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          {{ link.title }}
        </a>
      </li>
    </ul>
  </div>
</template>
