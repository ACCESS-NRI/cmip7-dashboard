<template>
  <main ref="mainRef" class="py-8 px-4 items-center">
    <PayuExperimentAccordion
      :experiments="payuExperiments"
      :loading="payuLoading"
      :error="payuError"
    />
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from "vue";
import PayuExperimentAccordion from "./PayuExperimentAccordion.vue";
import { loadPayuExperiments } from "@/services/payuExperiments";
import type { PayuExperiment } from "@/services/payuExperiments";

const payuExperiments = ref<PayuExperiment[]>([]);
const payuLoading = ref(true);
const payuError = ref<string | null>(null);

const mainRef = ref<HTMLElement | null>(null);

function notifyHeight() {
  if (mainRef.value) {
    const height = mainRef.value.scrollHeight;
    window.parent.postMessage({ height }, "*");
  }
}

onMounted(async () => {
  try {
    payuExperiments.value = await loadPayuExperiments();
  } catch (err) {
    payuError.value =
      err instanceof Error ? err.message : "Failed to load experiments.";
  } finally {
    payuLoading.value = false;
  }

  // Notify parent of height after data loads
  await nextTick();
  notifyHeight();

  // Watch for any size changes (accordion expand/collapse)
  if (mainRef.value) {
    const observer = new ResizeObserver(() => {
      notifyHeight();
    });
    observer.observe(mainRef.value);
  }
});
</script>
