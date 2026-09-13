<script setup lang="ts">
// Iframe-embeddable dashboard hero (embed layout, no site chrome). Loads payu
// telemetry via usePayuExperiments, renders the DashboardHero masthead, and
// reports its height to the host frame via useIframeEmbedHeight.
import { usePayuExperiments } from "~/composables/usePayuExperiments";
import { useIframeEmbedHeight } from "~/composables/useIframeEmbedHeight";

definePageMeta({ layout: "embed" });

useSeoMeta({ title: "CMIP7 Dashboard Hero" });

const {
  experiments: payuExperiments,
  loading: payuLoading,
  error: payuError,
} = usePayuExperiments();

const { elementRef: mainRef, start } = useIframeEmbedHeight();

// The first height report must happen only after the experiments have loaded
// and the hero totals have rendered — usePayuExperiments fetches client-side in
// onMounted, so begin reporting when its loading flag settles (which fires on
// both success and failure). Same ordering embed/experiments.vue relies on.
watch(payuLoading, (loading) => {
  if (!loading) start();
});
</script>

<template>
  <main ref="mainRef" class="px-4 py-8">
    <DashboardHero
      :experiments="payuExperiments"
      :loading="payuLoading"
      :error="payuError"
    />
  </main>
</template>
