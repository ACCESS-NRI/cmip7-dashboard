<!--
  SectionNav — the "On this page" section list in the sidebar.

  A navigation *indicator*, not a selector: it reflects which section is in view
  (activeId, driven by the page's scroll-spy) and lets you jump to one. The
  section list comes from composables/sections.ts; active state and navigation
  are owned by the page.

  Used by: app/pages/index.vue
-->
<script setup lang="ts">
import { SECTIONS } from "~/composables/sections";
import type { SectionId } from "~/composables/sections";

defineProps<{ activeId: string }>();
const emit = defineEmits<{ navigate: [id: SectionId] }>();
</script>

<template>
  <nav data-test="section-nav" aria-label="On this page">
    <p
      class="px-2.5 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
    >
      On this page
    </p>
    <ul class="space-y-1">
      <li v-for="section in SECTIONS" :key="section.id">
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition"
          :class="
            section.id === activeId
              ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          "
          :aria-current="section.id === activeId ? 'true' : undefined"
          :data-active="section.id === activeId ? 'true' : undefined"
          :data-test="`section-nav-item-${section.id}`"
          @click="emit('navigate', section.id)"
        >
          <UIcon
            :name="section.icon"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <span class="min-w-0 flex-1 truncate">{{ section.name }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>
