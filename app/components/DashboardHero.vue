<!--
  DashboardHero — the masthead at the top of the dashboard.

  Purely presentational: the page owns the fetch, this renders whichever of the
  loading / error / empty / totals states applies, alongside the ACCESS branding.

  Used by: app/pages/index.vue
-->
<script setup lang="ts">
import type { PayuExperiment } from "~/services/payuExperiments";
// The hero leads with the full ACCESS "National Research Infrastructure" lockup
// (not the globe-only mark the AboutCard uses) to give ACCESS-NRI top billing —
// this dashboard is built by ACCESS-NRI.
import accessLogo from "~/assets/access-nri-logo.png";
// Partner logos (issue #60): mixed formats — nci-logo is a transparent PNG with
// a black wordmark, nesp-logo a white-background JPG. All three logos sit on
// white chips (see template): the ACCESS lockup carries dark navy text that
// would fade on the dark card, and the chips keep every mark legible and
// consistent in both light and dark themes.
import nciLogo from "~/assets/nci-logo.png";
import nespLogo from "~/assets/nesp-logo.jpg";

defineProps<{
  experiments: PayuExperiment[];
  loading: boolean;
  error: string | null;
}>();
</script>

<template>
  <section
    id="hero"
    class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
  >
    <!-- Full-width banner across the top of the hero: the campaign headline and
         a one-line status subtitle, then the ACCESS-NRI logo leading, with the
         NCI (compute) and NESP Climate Systems Hub (funding) partner logos
         beside it (issue #60). At lg and up the logos sit to the right of the
         headline; on narrower displays the row stacks (flex-col) so the logos
         drop below the title and wrap rather than squeezing the headline or
         overflowing the card. ACCESS leads with its full "National Research
         Infrastructure" lockup — widest of the three since it builds the
         dashboard — while all three chips share one height. The white chips
         keep the mixed artwork legible against both the light and dark card. -->
    <div
      class="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-6 dark:border-gray-700 lg:flex-row lg:items-start lg:justify-between"
    >
      <div>
        <h2
          class="text-xl font-semibold text-gray-800 sm:text-2xl dark:text-gray-100"
        >
          Tracking Australia's Global Climate Projections with ACCESS-ESM1.6
        </h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Live status of CMIP7 model simulations and data publication
        </p>
      </div>
      <div
        class="flex flex-wrap items-center justify-start gap-3 lg:shrink-0 lg:justify-end"
      >
        <a
          href="https://www.access-nri.org.au"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="ACCESS-NRI"
          class="inline-flex items-center rounded-md bg-white px-3 py-1 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
        >
          <img :src="accessLogo" alt="ACCESS-NRI" class="h-14 object-contain" />
        </a>
        <a
          href="https://nci.org.au"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="NCI Australia"
          class="inline-flex items-center rounded-md bg-white px-3 py-1 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
        >
          <img :src="nciLogo" alt="NCI Australia" class="h-14 object-contain" />
        </a>
        <a
          href="https://nesp2climate.com.au"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="NESP Climate Systems Hub"
          class="inline-flex items-center rounded-md bg-white px-3 py-1 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
        >
          <img
            :src="nespLogo"
            alt="NESP Climate Systems Hub"
            class="h-14 object-contain"
          />
        </a>
      </div>
    </div>

    <!-- Stat zone: hosts the loading/error/empty states and totals. -->
    <div
      v-if="loading"
      data-test="experiments-loading"
      class="flex items-center justify-center py-6 text-sm text-gray-400 dark:text-gray-500"
    >
      Loading simulations…
    </div>

    <div
      v-else-if="error"
      data-test="experiments-error"
      class="flex items-center justify-center py-6 text-sm text-red-600 dark:text-red-400"
    >
      {{ error }}
    </div>

    <div
      v-else-if="experiments.length === 0"
      data-test="experiments-empty"
      class="flex items-center justify-center py-6 text-sm text-gray-400 dark:text-gray-500"
    >
      No simulations found.
    </div>

    <ExperimentTotals v-else :experiments="experiments" />
  </section>
</template>
