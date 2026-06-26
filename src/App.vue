<script setup lang="ts">
import AppHeader from "./components/AppHeader.vue";
import { isNavigating } from "./router";
import { useRoute } from "vue-router";
const route = useRoute();
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 text-gray-950 dark:bg-gray-950 dark:text-gray-50"
  >
    <Transition name="fade">
      <div
        v-if="isNavigating"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm"
      >
        <div
          class="flex items-center gap-4 rounded-lg bg-white p-6 shadow-2xl dark:bg-gray-900"
        >
          <div
            class="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-b-teal-600 dark:border-slate-700 dark:border-b-teal-400"
          ></div>
          <span class="text-lg font-medium text-slate-800 dark:text-slate-100"
            >Loading...</span
          >
        </div>
      </div>
    </Transition>

    <AppHeader v-if="!route.meta.embed" />
    <RouterView />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
