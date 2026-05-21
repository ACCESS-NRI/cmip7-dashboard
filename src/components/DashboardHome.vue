<template>
  <main class="container mx-auto px-6 pt-6">
    <section
      id="hero"
      class="mx-auto mb-8 mt-12 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div class="mb-5 flex justify-center">
        <a
          href="https://www.access-nri.org.au"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="ACCESS-NRI"
        >
          <img
            src="/ACCESS-logo.svg"
            alt="ACCESS-NRI"
            class="h-16 object-contain"
          />
        </a>
      </div>
      <p class="mb-2 text-sm font-semibold uppercase text-blue-700">
        Climate model intelligence
      </p>
      <h1 class="mb-3 text-2xl font-semibold text-gray-800 sm:text-3xl">
        CMIP7 Dashboard
      </h1>
      <p class="text-sm leading-relaxed text-gray-500 sm:text-base">
        A lightweight interface for exploring CMIP7 model outputs, dataset
        readiness, and dashboard workflows as the catalogue takes shape.
      </p>
    </section>

    <section
      class="mx-auto mb-12 grid max-w-2xl gap-4 sm:grid-cols-3"
      aria-label="Dashboard status"
    >
      <div
        v-for="item in statusCards"
        :key="item.label"
        class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
      >
        <p class="text-xs font-semibold uppercase text-gray-400">
          {{ item.label }}
        </p>
        <p class="mt-2 text-sm font-semibold text-gray-800">
          {{ item.value }}
        </p>
      </div>
    </section>

    <DummyClimatePlot />

    <section
      class="mx-auto mb-12 max-w-2xl space-y-3 rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-600 shadow-sm"
    >
      <h2 class="text-sm font-semibold uppercase text-gray-700">About</h2>
      <p>
        This scaffold will become a browser-based view over CMIP7 data products
        and derived indicators. For now it keeps the app shell, routing,
        telemetry, test setup, and data-visualisation dependencies in place.
      </p>
      <div
        class="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-3"
      >
        <span class="text-xs text-gray-400">Built with ACCESS-NRI tooling</span>
        <a
          href="https://www.access-nri.org.au"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/ACCESS-logo.svg"
            alt="ACCESS-NRI"
            class="h-9 object-contain opacity-80"
          />
        </a>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import DummyClimatePlot from "./DummyClimatePlot.vue";

const statusCards = [
  { label: "App", value: "Vue 3 + Vite" },
  { label: "Maps", value: "MapLibre-ready" },
  { label: "Charts", value: "Chart.js-ready" },
];
</script>
