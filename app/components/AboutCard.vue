<!--
  AboutCard — the "About" panel at the foot of the dashboard home page.

  A short explainer of what the dashboard is (a browser view over CMIP7 model runs
  and derived indicators), how scientists publish updates (a markdown file under
  content/blog/), and where to learn the terminology (the glossary). The footer row
  carries the ACCESS-NRI attribution/logo and, across from it, a "Need help?"
  support prompt (issue #61) linking to the ACCESS-Hive Forum help post — see the
  discussion on that issue for why we point at the Forum post rather than the ANU
  contact block or the Hive Docs page. Rendered unconditionally by index.vue — it
  stays visible even while payu telemetry is loading or has errored, so there is
  always some orientation and a way to get help on the page.

  Used by: app/pages/index.vue
-->
<script setup lang="ts">
import accessLogo from "~/assets/ACCESS-logo.svg";
</script>

<template>
  <section
    data-test="about-card"
    class="mx-auto mb-4 space-y-3 rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
  >
    <h2
      class="text-sm font-semibold uppercase text-gray-700 dark:text-gray-200"
    >
      About
    </h2>
    <p>
      This dashboard is a browser-based view over
      <Jargon term="CMIP7">CMIP7</Jargon> model runs and derived indicators such
      as <Jargon term="TCRE">TCRE</Jargon>. Scientists can publish CMIP7 updates
      by adding a markdown file under <code>content/blog/</code> — it appears on
      the
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
    <!-- Footer row: attribution on the left, the "Need help?" support prompt
         across from it on the right. On mobile the row stacks (flex-col-reverse)
         so support sits above the attribution but still below the divider. -->
    <div
      class="flex flex-col-reverse gap-4 border-t border-gray-200 pt-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-3">
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
      <p
        data-test="need-help"
        class="flex items-start gap-2 text-xs text-gray-500 sm:max-w-md sm:justify-end sm:text-right dark:text-gray-400"
      >
        <UIcon
          name="i-lucide-life-buoy"
          class="mt-0.5 size-4 shrink-0 text-primary opacity-80 sm:order-last"
          aria-hidden="true"
        />
        <span>
          <span class="font-semibold text-gray-700 dark:text-gray-200"
            >Need help?</span
          >
          Questions about this dashboard or something not working as expected?
          See
          <a
            href="https://forum.access-hive.org.au/t/access-help-and-support/908"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-blue-700 hover:underline dark:text-blue-400"
            >how to get help and support on the ACCESS-Hive Forum</a
          >.
        </span>
      </p>
    </div>
  </section>
</template>
