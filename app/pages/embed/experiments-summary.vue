<script setup lang="ts">
import { loadPayuExperiments } from "~/services/payuExperiments";
import type { PayuExperiment } from "~/services/payuExperiments";

definePageMeta({ layout: "embed" });

useSeoMeta({ title: "CMIP7 Experiments Summary" });

const config = useRuntimeConfig();

const payuExperiments = ref<PayuExperiment[]>([]);
const payuLoading = ref(true);
const payuError = ref<string | null>(null);

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
});
</script>

<template>
  <main class="items-center px-4 py-8">
    <ExperimentSummaryCards
      :experiments="payuExperiments"
      :loading="payuLoading"
      :error="payuError"
    />
  </main>
</template>
