<template>
  <main class="py-8 px-4 items-center">
    <ExperimentSummaryCards
      :experiments="payuExperiments"
      :loading="payuLoading"
      :error="payuError"
    />
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import ExperimentSummaryCards from "./ExperimentSummaryCards.vue";
import { loadPayuExperiments } from "@/services/payuExperiments";
import type { PayuExperiment } from "@/services/payuExperiments";

const payuExperiments = ref<PayuExperiment[]>([]);
const payuLoading = ref(true);
const payuError = ref<string | null>(null);

onMounted(async () => {
  try {
    payuExperiments.value = await loadPayuExperiments();
  } catch (err) {
    payuError.value =
      err instanceof Error ? err.message : "Failed to load experiments.";
  } finally {
    payuLoading.value = false;
  }
});
</script>
