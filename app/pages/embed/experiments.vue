<script setup lang="ts">
// Iframe-embeddable experiment list (embed layout, no site chrome). Loads payu
// telemetry via usePayuExperiments, renders the PayuExperimentAccordion, and
// reports its height to the host frame via useIframeEmbedHeight.
import { usePayuExperiments } from "~/composables/usePayuExperiments";
import { useIframeEmbedHeight } from "~/composables/useIframeEmbedHeight";

definePageMeta({ layout: "embed" });

useSeoMeta({ title: "CMIP7 Experiments" });

const {
  experiments: payuExperiments,
  loading: payuLoading,
  error: payuError,
} = usePayuExperiments();

const { elementRef: mainRef, start } = useIframeEmbedHeight();

// The first height report must happen only after the experiments have loaded
// and the accordion has rendered — the same ordering the inline version had
// when the fetch and the notify lived in one onMounted. usePayuExperiments now
// owns that fetch, so begin reporting when its loading flag settles (which,
// like the original, fires on both success and failure).
watch(payuLoading, (loading) => {
  if (!loading) start();
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
