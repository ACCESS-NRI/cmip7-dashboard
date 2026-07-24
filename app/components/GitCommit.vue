<!--
  GitCommit — the build/version footer pinned to the bottom of the sidebar.

  Shows the short commit SHA (linked to GitHub) and, when tagged, the app
  version and build time, all sourced from runtime config injected at build time.
  Degrades gracefully when the commit/tag are "unknown".

  Used by: app/components/AppSidebar.vue
-->
<script setup lang="ts">
const config = useRuntimeConfig();

const commitSha = config.public.gitCommitSha;
const appVersion = config.public.appVersion;
const githubRepositoryUrl = config.public.githubRepositoryUrl;
const buildTime = config.public.buildTime;

const hasValidCommit = !!commitSha && commitSha !== "unknown";
const hasTag = !!appVersion && appVersion !== "unknown";

const shortCommitSha = hasValidCommit ? commitSha.substring(0, 7) : "";

// Badge shows the release tag when available, otherwise the short commit SHA.
const badgeLabel = hasTag ? appVersion : shortCommitSha;

// Clicking the badge goes to the tag (release page) when tagged, else the commit.
const badgeUrl = hasTag
  ? `${githubRepositoryUrl}/releases/tag/${appVersion}`
  : hasValidCommit
    ? `${githubRepositoryUrl}/commit/${commitSha}`
    : undefined;
</script>

<template>
  <UPopover
    mode="hover"
    :open-delay="200"
    :close-delay="150"
    :content="{
      side: 'bottom',
      align: 'end',
      sideOffset: 10,
      collisionPadding: 16,
    }"
  >
    <component
      :is="badgeUrl ? 'a' : 'span'"
      :href="badgeUrl"
      :target="badgeUrl ? '_blank' : undefined"
      :rel="badgeUrl ? 'noopener noreferrer' : undefined"
      class="inline-flex items-center gap-2 rounded-md border border-green-300 bg-green-50 px-2.5 py-1 font-mono text-xs text-green-700 transition-colors hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30"
    >
      <UIcon name="i-simple-icons-github" class="size-3.5" />
      <span>{{ badgeLabel }}</span>
    </component>

    <template #content>
      <div class="w-[min(22rem,calc(100vw-2rem))] p-4">
        <dl class="mb-3 space-y-1 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="font-semibold text-gray-700 dark:text-gray-200">
              Version
            </dt>
            <dd class="font-mono text-gray-600 dark:text-gray-300">
              {{ hasTag ? appVersion : "—" }}
            </dd>
          </div>
          <div v-if="buildTime" class="flex justify-between gap-3">
            <dt class="font-semibold text-gray-700 dark:text-gray-200">
              Built
            </dt>
            <dd class="text-xs text-gray-500 dark:text-gray-400">
              {{ new Date(buildTime).toLocaleString() }}
            </dd>
          </div>
        </dl>
      </div>
    </template>
  </UPopover>
</template>
