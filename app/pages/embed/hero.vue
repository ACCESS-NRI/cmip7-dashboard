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
  <!-- pb-1 pr-1: a small cushion on the measured wrapper (not margin on the
       card — a card margin would collapse out of <main> and escape the
       getBoundingClientRect().bottom we report, and a right margin would only
       inset a full-width card). Padding sits inside the measured box, so the
       bottom gutter is captured in the reported height and the right gutter
       gives breathing room without overflow; the card stays flush top-left. -->
  <main ref="mainRef" class="pb-1 pr-1">
    <!-- Flush embed: no shadow, and a smaller radius to match the host page's
         chips (the standalone dashboard's raised rounded-2xl card is the default
         inside DashboardHero). -->
    <DashboardHero
      :experiments="payuExperiments"
      :loading="payuLoading"
      :error="payuError"
      class="rounded-lg"
    />
  </main>
</template>
