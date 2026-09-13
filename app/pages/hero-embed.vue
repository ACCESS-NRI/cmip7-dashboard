<script setup lang="ts">
// In-app host for the iframe-embedded dashboard hero. Its body is just an
// <iframe> pointing at /embed/hero (the bare, embed-layout hero page). It
// implements the receiving half of the useIframeEmbedHeight contract: the embed
// page posts { height } to its parent whenever its content resizes, and this
// page grows the iframe to match so there is no inner scrollbar or gap.
import { onBeforeUnmount, onMounted, ref } from "vue";

useSeoMeta({ title: "Hero Embed" });

const iframeRef = ref<HTMLIFrameElement | null>(null);

function onMessage(event: MessageEvent) {
  const height = (event.data as { height?: unknown } | null)?.height;
  if (typeof height === "number" && iframeRef.value) {
    iframeRef.value.style.height = `${height}px`;
  }
}

onMounted(() => window.addEventListener("message", onMessage));
onBeforeUnmount(() => window.removeEventListener("message", onMessage));
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <iframe
      ref="iframeRef"
      src="/embed/hero"
      title="CMIP7 Dashboard Hero"
      class="block w-full border-0"
      style="height: 320px"
    />
  </div>
</template>
