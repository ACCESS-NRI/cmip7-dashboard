<script setup lang="ts">
import { reactive, watch } from "vue";
import type { ContentCollectionItem } from "@nuxt/content";
import { loadPayuExperiments } from "~/services/payuExperiments";
import type { PayuExperiment } from "~/services/payuExperiments";
import { SECTIONS } from "~/composables/sections";
import type { SectionId } from "~/composables/sections";
import { useActiveSection } from "~/composables/useActiveSection";
import accessLogo from "~/assets/ACCESS-logo.svg";

useSeoMeta({
  title: "CMIP7 Dashboard",
  description:
    "A lightweight interface for tracking CMIP7 climate model outputs and derived metrics.",
});

// Metadata for the two collapsible detail sections (single-sourced from SECTIONS).
const progressMeta = SECTIONS.find((s) => s.id === "progress")!;
const hoodMeta = SECTIONS.find((s) => s.id === "under-the-hood")!;

// Progressive disclosure: the detail sections start collapsed. Open state lives
// here so the sidebar nav can open a section when you jump to it.
const openSections = reactive<Record<"progress" | "under-the-hood", boolean>>({
  progress: false,
  "under-the-hood": false,
});

// Scroll-spy that drives the sidebar's active-section highlight. The detail
// sections mount only once experiments load, so re-observe when that happens.
const { activeId, refresh } = useActiveSection(SECTIONS.map((s) => s.id));

function scrollToSection(id: SectionId) {
  if (id === "progress" || id === "under-the-hood") openSections[id] = true;
  nextTick(() => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// Explainer posts are tagged with an `experiment` name in their frontmatter;
// map them by that name so grouped experiment rows can open the explainer.
const { data: explainers } = await useAsyncData("experiment-explainers", () =>
  queryCollection("content").where("experiment", "IS NOT NULL").all(),
);

const postByExperiment = computed<Record<string, ContentCollectionItem>>(() => {
  const map: Record<string, ContentCollectionItem> = {};
  for (const post of explainers.value ?? []) {
    if (post.experiment) map[post.experiment] = post;
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

// Once the experiments load, the section anchors exist — attach the scroll-spy.
watch(payuExperiments, () => refresh());
</script>

<template>
  <AppSidebar>
    <SectionNav :active-id="activeId" @navigate="scrollToSection" />
  </AppSidebar>

  <UDashboardPanel>
    <template #header>
      <!-- Desktop shows the sidebar itself, so the navbar only exists on
           mobile to host the sidebar (section nav) toggle. -->
      <UDashboardNavbar title="CMIP7 Dashboard" class="lg:hidden" />
    </template>

    <template #body>
      <!-- One hero: a slim brand rail beside the rolled-up campaign stats. The
           asymmetric split keeps the card short so DECK / Fast Track sit near
           the fold on an iPad. -->
      <DashboardHero
        :experiments="payuExperiments"
        :loading="payuLoading"
        :error="payuError"
      />

      <template v-if="!payuLoading && !payuError && payuExperiments.length > 0">
        <!-- Big picture: the always-visible primary view — programme layers
             carry the high-level overview. -->
        <section id="big-picture" class="mb-4 scroll-mt-6">
          <ExperimentProgrammeGroups
            :experiments="payuExperiments"
            :post-by-experiment="postByExperiment"
          />
        </section>

        <!-- Everything below is a deeper look, opened on demand. -->
        <div
          class="mb-2 flex items-center gap-3"
          data-test="deeper-views-divider"
        >
          <UIcon
            name="i-lucide-layers"
            class="size-4 shrink-0 text-gray-400 dark:text-gray-500"
            aria-hidden="true"
          />
          <span
            class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
          >
            Deeper views into the data
          </span>
          <span class="h-px flex-1 bg-gray-200 dark:bg-gray-700"></span>
        </div>

        <div class="mb-4 space-y-6">
          <!-- Progress: one status card per experiment (progress + publication). -->
          <DetailSection
            id="progress"
            v-model:open="openSections.progress"
            :title="progressMeta.name"
            :description="progressMeta.description"
            :icon="progressMeta.icon"
          >
            <div
              class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
              data-test="experiment-grid"
            >
              <ExperimentCard
                v-for="experiment in payuExperiments"
                :key="experiment.uuid || experiment.name"
                :experiment="experiment"
                :post="postByExperiment[experiment.name] ?? null"
                variant="status"
              />
            </div>
          </DetailSection>

          <!-- Under the hood: the classic dashboard view — summary tiles, full
               per-run telemetry, and the derived-signal plot. -->
          <DetailSection
            id="under-the-hood"
            v-model:open="openSections['under-the-hood']"
            :title="hoodMeta.name"
            :description="hoodMeta.description"
            :icon="hoodMeta.icon"
          >
            <div class="space-y-6">
              <ExperimentSummaryCards :experiments="payuExperiments" />
              <PayuExperimentAccordion :experiments="payuExperiments" />
              <ClientOnly>
                <DummyClimatePlot />
                <template #fallback>
                  <div
                    class="flex min-h-72 items-center justify-center rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-400 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                  >
                    Loading plot…
                  </div>
                </template>
              </ClientOnly>
            </div>
          </DetailSection>
        </div>

        <!-- Explainers for the two orthogonal axes, side by side: the scientific
             taxonomy (issue #14) and the CMIP7 participation layers (issue #21).
             Per Kelsey's feedback these sit at the end of the page rather than
             leading it. They explain the encodings used across the page. -->
        <div class="mb-4 grid gap-6 lg:grid-cols-2">
          <ExperimentClassLegend
            :class-ids="payuExperiments.map((e) => e.experimentClass.id)"
          />
          <ExperimentTierLegend
            :experiment-tiers="payuExperiments.map((e) => e.tiers)"
          />
        </div>
      </template>

      <section
        class="mx-auto mb-4 space-y-3 rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        <h2
          class="text-sm font-semibold uppercase text-gray-700 dark:text-gray-200"
        >
          About
        </h2>
        <p>
          This dashboard is a browser-based view over
          <Jargon term="CMIP7">CMIP7</Jargon> model runs and derived indicators
          such as <Jargon term="TCRE">TCRE</Jargon>. Scientists can publish
          CMIP7 updates by adding a markdown file under
          <code>content/blog/</code> — it appears on the
          <NuxtLink
            to="/blog"
            class="font-medium text-blue-700 hover:underline dark:text-blue-400"
            >blog</NuxtLink
          >
          automatically. New to the terminology? The
          <NuxtLink
            to="/glossary"
            class="font-medium text-blue-700 hover:underline dark:text-blue-400"
            >glossary</NuxtLink
          >
          explains the CMIP7 jargon used across this dashboard.
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
              :src="accessLogo"
              alt="ACCESS-NRI"
              class="h-9 object-contain opacity-80"
            />
          </a>
        </div>
      </section>
    </template>
  </UDashboardPanel>
</template>
