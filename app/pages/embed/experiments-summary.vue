<script setup lang="ts">
import { usePayuExperiments } from "~/composables/usePayuExperiments";

definePageMeta({ layout: "embed" });

useSeoMeta({ title: "CMIP7 Experiments Summary" });

const {
  experiments: payuExperiments,
  loading: payuLoading,
  error: payuError,
} = usePayuExperiments();
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
