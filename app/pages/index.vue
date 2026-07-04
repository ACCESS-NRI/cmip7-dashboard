<script setup lang="ts">
import type { ContentCollectionItem } from "@nuxt/content";
import { loadPayuExperiments } from "~/services/payuExperiments";
import type { PayuExperiment } from "~/services/payuExperiments";
import { useDetailLevel } from "~/composables/useDetailLevel";

useSeoMeta({
  title: "CMIP7 Dashboard",
  description:
    "A lightweight interface for tracking CMIP7 climate model outputs and derived metrics.",
});

definePageMeta({ layout: "dashboard" });

const level = useDetailLevel();

// Explainer posts are tagged with an `experiment` name in their frontmatter;
// map them by that name so each card can surface its Overview-level content.
const { data: explainers } = await useAsyncData("experiment-explainers", () =>
  queryCollection("content").where("experiment", "IS NOT NULL").all(),
);

const postByExperiment = computed(() => {
  const map = new Map<string, ContentCollectionItem>();
  for (const post of explainers.value ?? []) {
    if (post.experiment) map.set(post.experiment, post);
  }
  return map;
});

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
  <UDashboardSidebar collapsible resizable>
    <DetailLevelPicker />
  </UDashboardSidebar>

  <UDashboardPanel>
    <template #header>
      <!-- Desktop shows the sidebar itself, so the navbar only exists on
           mobile to host the sidebar (detail picker) toggle. -->
      <UDashboardNavbar class="lg:hidden" />
    </template>

    <template #body>
      <!-- Top row: the hero alongside the campaign stats — one rolled-up
           planned-vs-done figure at Big picture, per-metric stat cards on the
           deeper levels. -->
      <div class="mb-12 grid items-stretch gap-6 lg:grid-cols-2">
        <section
          id="hero"
          class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
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
          <p
            class="mb-2 text-sm font-semibold uppercase text-blue-700 dark:text-blue-400"
          >
            Climate model intelligence
          </p>
          <h1
            class="mb-3 text-2xl font-semibold text-gray-800 sm:text-3xl dark:text-gray-100"
          >
            CMIP7 Dashboard
          </h1>
          <p
            class="text-sm leading-relaxed text-gray-500 sm:text-base dark:text-gray-400"
          >
            A lightweight interface for tracking climate model outputs and
            derived metrics as runs progress. Use the detail-level control to
            choose how much you see — from a plain-language overview to the raw
            run telemetry. Read the latest
            <NuxtLink
              to="/blog"
              class="font-medium text-blue-700 hover:underline dark:text-blue-400"
              >CMIP7 updates</NuxtLink
            >.
          </p>
        </section>

        <div
          v-if="payuLoading"
          data-test="experiments-loading"
          class="flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-10 text-sm text-gray-400 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500"
        >
          Loading experiments…
        </div>

        <div
          v-else-if="payuError"
          data-test="experiments-error"
          class="flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-6 text-sm text-red-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-red-400"
        >
          {{ payuError }}
        </div>

        <div
          v-else-if="payuExperiments.length === 0"
          data-test="experiments-empty"
          class="flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-10 text-sm text-gray-400 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500"
        >
          No experiments found.
        </div>

        <ExperimentTotals
          v-else-if="level === 0"
          :experiments="payuExperiments"
          class="h-full"
        />
        <ExperimentSummaryCards
          v-else
          :experiments="payuExperiments"
          vertical
          class="h-full"
        />
      </div>

      <template v-if="!payuLoading && !payuError && payuExperiments.length > 0">
        <!-- Taxonomy explainer: keeps idealised/diagnostic runs from being read
             as projections (issue #14). Shown where non-specialists browse. -->
        <ExperimentClassLegend
          v-if="level < 2"
          :experiment-names="payuExperiments.map((e) => e.name)"
          class="mb-12"
        />

        <!-- Big picture/Progress: one card per experiment, reframed by the picker. -->
        <div
          v-if="level < 2"
          class="mb-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
          data-test="experiment-grid"
        >
          <ExperimentCard
            v-for="experiment in payuExperiments"
            :key="experiment.uuid || experiment.name"
            :experiment="experiment"
            :post="postByExperiment.get(experiment.name) ?? null"
          />
        </div>

        <!-- Under the hood: the classic dashboard view — full per-run telemetry. -->
        <div v-else class="mb-12">
          <PayuExperimentAccordion :experiments="payuExperiments" />
        </div>
      </template>

      <!-- Under the hood also restores the derived-signal plot from the classic view. -->
      <ClientOnly v-if="level >= 2">
        <DummyClimatePlot />
        <template #fallback>
          <section
            class="mx-auto mb-12 flex min-h-72 max-w-2xl items-center justify-center rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-400 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
          >
            Loading plot…
          </section>
        </template>
      </ClientOnly>

      <section
        class="mx-auto mb-12 max-w-2xl space-y-3 rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        <h2
          class="text-sm font-semibold uppercase text-gray-700 dark:text-gray-200"
        >
          About
        </h2>
        <p>
          This dashboard is a browser-based view over CMIP7 model runs and
          derived indicators such as TCRE. Scientists can publish CMIP7 updates
          by adding a markdown file under <code>content/blog/</code> — it
          appears on the
          <NuxtLink
            to="/blog"
            class="font-medium text-blue-700 hover:underline dark:text-blue-400"
            >blog</NuxtLink
          >
          automatically.
        </p>
        <div
          class="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-3 dark:border-gray-700"
        >
          <span class="text-xs text-gray-400 dark:text-gray-500"
            >Built with ACCESS-NRI tooling</span
          >
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
    </template>
  </UDashboardPanel>
</template>
