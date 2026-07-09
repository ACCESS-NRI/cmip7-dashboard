<script setup lang="ts">
import { ref } from "vue";
import type { ContentCollectionItem } from "@nuxt/content";

// Clickable experiment name that opens the full explainer post in a modal.
// A deliberate sibling of the Jargon component (components/content/Jargon.vue):
// it borrows the same "highlighted, obviously-explained term" chip vocabulary
// but is recoloured blue (vs Jargon's green primary) and, being a click-to-open
// modal rather than a hover popover, uses a pointer cursor and a ghost fill that
// only appears on hover. Owns its own UModal so the parent stays state-free.
const props = defineProps<{
  /** The explainer post to render inside the modal. */
  post: ContentCollectionItem;
  /** Display label for the trigger (defaults to the slot). */
  label?: string;
}>();

const open = ref(false);
</script>

<template>
  <button
    type="button"
    :data-test="`experiment-explainer-link-${label}`"
    class="max-w-full cursor-pointer truncate rounded-[0.25rem] px-1 text-left font-medium text-blue-700 underline decoration-blue-500/40 decoration-dotted underline-offset-[3px] transition-colors hover:bg-blue-500/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 dark:text-blue-400"
    @click="open = true"
  >
    <slot>{{ label }}</slot
    ><UIcon
      name="i-lucide-info"
      class="ml-0.5 inline-block size-3 translate-y-[1px] opacity-60"
    />
  </button>

  <UModal
    v-model:open="open"
    :title="post.title"
    :description="post.description"
    scrollable
    :ui="{
      content: 'max-w-3xl',
      body: 'max-h-[75vh] overflow-y-auto',
    }"
    data-test="experiment-explainer-modal"
  >
    <template #body>
      <ContentRenderer
        :value="post"
        class="prose dark:prose-invert max-w-none"
        data-test="experiment-explainer-content"
      />
      <FurtherReading
        v-if="post.furtherReading?.length"
        :links="post.furtherReading"
        class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700"
      />
    </template>
  </UModal>
</template>
