<script setup lang="ts">
const config = useRuntimeConfig();

const commitSha = config.public.gitCommitSha;
const githubRepositoryUrl = config.public.githubRepositoryUrl;
const buildTime = config.public.buildTime;

const shortCommitSha = commitSha ? commitSha.substring(0, 7) : "";
const commitUrl =
  commitSha && commitSha !== "unknown" && githubRepositoryUrl
    ? `${githubRepositoryUrl}/commit/${commitSha}`
    : undefined;
const copied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

const copyCommitSha = async () => {
  if (!commitSha) return;

  try {
    await navigator.clipboard.writeText(commitSha);
    copied.value = true;

    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copied.value = false;
    }, 1600);
  } catch (err) {
    console.error("Failed to copy commit SHA:", err);
  }
};

onBeforeUnmount(() => {
  if (copiedTimer) clearTimeout(copiedTimer);
});
</script>

<template>
  <UPopover
    :content="{
      side: 'bottom',
      align: 'end',
      sideOffset: 10,
      collisionPadding: 16,
    }"
  >
    <UButton
      variant="subtle"
      size="sm"
      class="font-mono"
      trailing-icon="i-lucide-chevron-down"
    >
      <template #leading> </template>
      <span class="hidden font-sans font-medium sm:inline">Commit</span>
      <span>{{ shortCommitSha }}</span>
    </UButton>

    <template #content>
      <div class="w-[min(22rem,calc(100vw-2rem))] p-4">
        <div class="flex justify-end">
          <div class="mb-3 flex items-start gap-3">
            <a
              v-if="commitUrl"
              :href="commitUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="group min-w-0 text-right text-blue-600 underline decoration-blue-300 underline-offset-4 transition-colors hover:text-blue-700 hover:decoration-blue-500 dark:text-blue-400 dark:decoration-blue-500/70 dark:hover:text-blue-300 dark:hover:decoration-blue-300"
            >
              <p class="flex justify-end text-sm font-semibold">
                Build commit
                <UIcon name="i-simple-icons-github" class="ml-2 size-4" />
              </p>
              <p
                v-if="buildTime"
                class="mt-0.5 text-xs text-blue-500 no-underline dark:text-blue-300/80"
              >
                {{ new Date(buildTime).toLocaleString() }}
              </p>
            </a>
            <div
              v-else
              class="min-w-0 text-right text-gray-600 dark:text-gray-300"
            >
              <p class="flex justify-end text-sm font-semibold">
                Build commit
                <UIcon name="i-simple-icons-github" class="ml-2 size-4" />
              </p>
              <p
                v-if="buildTime"
                class="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
              >
                {{ new Date(buildTime).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>

        <code
          class="block rounded-lg border border-green-300 bg-green-100 px-3 py-2 font-mono text-xs leading-5 text-green-700 shadow-inner break-all dark:border-green-800/70 dark:bg-green-950/40 dark:text-green-300"
        >
          {{ commitSha }}
        </code>

        <div class="mt-3 flex justify-end">
          <UButton
            :label="copied ? 'Copied' : 'Copy SHA'"
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            :color="copied ? 'success' : 'primary'"
            size="sm"
            variant="soft"
            @click="copyCommitSha"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
