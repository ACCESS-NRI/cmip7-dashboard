<!--
  DetailSection — a collapsible "detailed view" section.

  Reuses the ExperimentProgrammeGroups card/header/panel language, but the muted
  icon chip and "Detailed view" eyebrow mark it as a secondary, deeper look —
  subordinate to the always-open Big picture above it. Open state is owned by the
  page (v-model:open) so the sidebar nav can open a section on navigate.

  Used by: app/pages/index.vue
-->
<script setup lang="ts">
defineProps<{
  /** Anchor id — also the scroll-spy / SectionNav target. */
  id: string;
  title: string;
  description: string;
  icon: string;
}>();

// Open state is owned by the page (v-model:open) so the sidebar nav can open a
// section on navigate; defaults closed for progressive disclosure.
const open = defineModel<boolean>("open", { default: false });
</script>

<template>
  <section :id="id" class="scroll-mt-6" :data-test="`detail-section-${id}`">
    <article
      class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <button
        type="button"
        class="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
        :aria-expanded="open"
        :aria-controls="`detail-section-panel-${id}`"
        :data-test="`detail-section-toggle-${id}`"
        @click="open = !open"
      >
        <span
          class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
        >
          <UIcon :name="icon" class="size-5" aria-hidden="true" />
        </span>
        <span class="min-w-0 flex-1">
          <span
            class="block text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
          >
            Detailed view
          </span>
          <span
            class="block text-base font-semibold text-gray-800 dark:text-gray-100"
          >
            {{ title }}
          </span>
          <span class="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">
            {{ description }}
          </span>
        </span>
        <span
          class="hidden shrink-0 text-xs font-medium text-gray-400 sm:inline dark:text-gray-500"
        >
          {{ open ? "Hide" : "Show" }}
        </span>
        <UIcon
          name="i-lucide-chevron-down"
          class="size-5 shrink-0 text-gray-400 transition-transform"
          :class="{ 'rotate-180': open }"
          aria-hidden="true"
        />
      </button>

      <div
        v-show="open"
        :id="`detail-section-panel-${id}`"
        class="border-t border-gray-100 p-5 dark:border-gray-800"
        :data-test="`detail-section-panel-${id}`"
      >
        <slot />
      </div>
    </article>
  </section>
</template>
