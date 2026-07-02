<script setup lang="ts">
import { loadPayuExperiments } from "~/services/payuExperiments";
import type { PayuExperiment } from "~/services/payuExperiments";

definePageMeta({ layout: "embed" });

useSeoMeta({ title: "CMIP7 Experiments" });

const config = useRuntimeConfig();

const payuExperiments = ref<PayuExperiment[]>([]);
const payuLoading = ref(true);
const payuError = ref<string | null>(null);

const mainRef = ref<HTMLElement | null>(null);

// Iframe-embed helper: tell the parent document how tall we are so it can size
// the iframe to fit, and keep it in sync as panels expand/collapse.
function notifyHeight() {
  if (mainRef.value) {
    window.parent.postMessage({ height: mainRef.value.scrollHeight }, "*");
  }
}

onMounted(async () => {
  try {
    payuExperiments.value = await loadPayuExperiments(
      config.public.payuCmip7ApiUrl as string,
    );
  } catch (err) {
    payuError.value =
      err instanceof Error ? err.message : "Failed to load experiments.";
  } finally {
    payuLoading.value = false;
  }

  await nextTick();
  notifyHeight();

  if (mainRef.value) {
    const observer = new ResizeObserver(() => notifyHeight());
    observer.observe(mainRef.value);
  }
});
</script>

<template>
  <main ref="mainRef" class="items-center px-4 py-8">
    <PayuExperimentAccordion
      :experiments="payuExperiments"
      :loading="payuLoading"
      :error="payuError"
    />
  </main>
</template>
