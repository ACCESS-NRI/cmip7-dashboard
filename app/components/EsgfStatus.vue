<script setup lang="ts">
defineProps<{
  published: boolean | null;
}>();
</script>

<!-- ESGF publication indicator. The default slot can add a caption next to
     the checkbox; shared by the accordion and the card grid. -->
<template>
  <div class="flex items-center gap-2" data-test="esgf-status">
    <input
      type="checkbox"
      :checked="published ?? false"
      disabled
      class="h-4 w-4 rounded accent-blue-600"
      :aria-label="`ESGF published: ${published ? 'yes' : 'no'}`"
    />
    <slot />
  </div>
</template>
