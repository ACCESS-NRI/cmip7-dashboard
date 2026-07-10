<script setup lang="ts">
import { computed, ref } from "vue";
import type { ContentCollectionItem } from "@nuxt/content";
import type { PayuExperiment } from "~/services/payuExperiments";
import {
  experimentProgressPercent,
  experimentRunStatus,
  groupExperimentsByProgramme,
} from "~/services/experimentGroups";
import type { ExperimentRunStatus } from "~/services/experimentGroups";

const props = defineProps<{
  experiments: PayuExperiment[];
  postByExperiment?: Record<string, ContentCollectionItem>;
}>();

const groups = computed(() => groupExperimentsByProgramme(props.experiments));
const openGroups = ref<string[]>([]);

const { getTerm } = useGlossary();

/**
 * The plain-language glossary definition shown in the collapsed footer. Sourced
 * from the glossary's `long` field (deck / aft → fast-track), falling back to the
 * group's own description for groups with no glossary entry (e.g. "other").
 */
function glossaryLongFor(group: { id: string; description: string }): string {
  return getTerm(group.id)?.long ?? group.description;
}

function toggleGroup(id: string) {
  openGroups.value = openGroups.value.includes(id)
    ? openGroups.value.filter((openId) => openId !== id)
    : [...openGroups.value, id];
}

function isOpen(id: string): boolean {
  return openGroups.value.includes(id);
}

function explainerFor(
  experiment: PayuExperiment,
): ContentCollectionItem | null {
  return props.postByExperiment?.[experiment.name] ?? null;
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function statusLabel(status: ExperimentRunStatus): string {
  if (status === "not-started") return "Not started";
  return status === "completed" ? "Completed" : "Running";
}

function statusIcon(status: ExperimentRunStatus): string {
  if (status === "completed") return "i-lucide-check";
  if (status === "running") return "i-lucide-circle";
  return "i-lucide-circle";
}

function statusClass(status: ExperimentRunStatus): string {
  if (status === "completed") return "text-green-600 dark:text-green-400";
  if (status === "running") return "text-blue-600 dark:text-blue-400";
  return "text-gray-400 dark:text-gray-500";
}
</script>

<template>
  <section
    class="space-y-5"
    aria-label="Simulation groups"
    data-test="experiment-programme-groups"
  >
    <article
      v-for="group in groups"
      :key="group.id"
      class="overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-gray-900"
      :class="{
        'border-blue-200 dark:border-blue-800': group.id === 'deck',
        'border-green-200 dark:border-green-800': group.id === 'aft',
        'border-gray-200 dark:border-gray-700': group.id === 'other',
      }"
      :data-test="`experiment-group-${group.id}`"
    >
      <button
        type="button"
        class="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
        :aria-expanded="isOpen(group.id)"
        :aria-controls="`experiment-group-panel-${group.id}`"
        :data-test="`experiment-group-toggle-${group.id}`"
        @click="toggleGroup(group.id)"
      >
        <UIcon
          :name="group.icon"
          class="size-5 shrink-0"
          :class="{
            'text-blue-600 dark:text-blue-400': group.id === 'deck',
            'text-green-600 dark:text-green-400': group.id === 'aft',
            'text-gray-500 dark:text-gray-400': group.id === 'other',
          }"
        />
        <span class="min-w-0 flex-1">
          <span
            class="block text-base font-semibold text-gray-800 dark:text-gray-100"
          >
            {{ group.label }}
          </span>
          <span class="mt-1 block text-sm text-gray-500 dark:text-gray-400">
            {{ group.description }}
          </span>
        </span>
        <UBadge
          :color="group.color"
          variant="subtle"
          :label="
            group.summary.percent === null
              ? `${group.summary.total} experiments`
              : `${group.summary.percent}% complete`
          "
          class="shrink-0"
          :data-test="`experiment-group-percent-${group.id}`"
        />
        <UIcon
          name="i-lucide-chevron-down"
          class="size-5 shrink-0 text-gray-400 transition-transform"
          :class="{ 'rotate-180': isOpen(group.id) }"
          aria-hidden="true"
        />
      </button>

      <div
        v-show="isOpen(group.id)"
        :id="`experiment-group-panel-${group.id}`"
        class="border-t border-gray-100 dark:border-gray-800"
        :data-test="`experiment-group-panel-${group.id}`"
      >
        <div class="grid gap-0 lg:grid-cols-[16rem_1fr]">
          <aside
            class="space-y-4 border-b border-gray-100 p-5 dark:border-gray-800 lg:border-r lg:border-b-0"
          >
            <dl class="grid grid-cols-2 gap-3 text-sm lg:grid-cols-1">
              <div>
                <dt class="text-gray-500 dark:text-gray-400">Experiments</dt>
                <dd
                  class="mt-1 text-lg font-semibold text-gray-800 dark:text-gray-100"
                >
                  {{ group.summary.total }}
                </dd>
              </div>
              <div>
                <dt class="text-gray-500 dark:text-gray-400">Running</dt>
                <dd
                  class="mt-1 text-lg font-semibold text-blue-600 dark:text-blue-400"
                >
                  {{ group.summary.running }}
                </dd>
              </div>
              <div>
                <dt class="text-gray-500 dark:text-gray-400">Completed</dt>
                <dd
                  class="mt-1 text-lg font-semibold text-green-600 dark:text-green-400"
                >
                  {{ group.summary.completed }}
                </dd>
              </div>
              <div>
                <dt class="text-gray-500 dark:text-gray-400">Not started</dt>
                <dd
                  class="mt-1 text-lg font-semibold text-gray-600 dark:text-gray-300"
                >
                  {{ group.summary.notStarted }}
                </dd>
              </div>
            </dl>

            <div class="border-t border-gray-100 pt-4 dark:border-gray-800">
              <p
                class="text-2xl font-semibold text-gray-800 dark:text-gray-100"
              >
                {{ formatNumber(group.summary.yearsRun) }}
              </p>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                simulated years
                <template v-if="group.summary.plannedYears">
                  of {{ formatNumber(group.summary.plannedYears) }} planned
                </template>
              </p>
            </div>
          </aside>

          <div class="min-w-0">
            <div
              class="hidden grid-cols-[1fr_7rem_8rem_12rem] gap-4 border-b border-gray-100 px-5 py-3 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800 dark:text-gray-500 md:grid"
            >
              <span>Experiment status</span>
              <span>Type</span>
              <span>Status</span>
              <span>Progress</span>
            </div>

            <ul class="divide-y divide-gray-100 dark:divide-gray-800">
              <li
                v-for="experiment in group.experiments"
                :key="`${group.id}-${experiment.uuid || experiment.name}`"
                class="grid gap-3 px-5 py-3 md:grid-cols-[1fr_7rem_8rem_12rem] md:items-center md:gap-4"
                :data-test="`experiment-group-row-${group.id}`"
              >
                <div class="min-w-0 text-sm">
                  <ExperimentExplainer
                    v-if="explainerFor(experiment)"
                    :post="explainerFor(experiment)!"
                    :label="experiment.name"
                  />
                  <p
                    v-else
                    class="truncate text-sm font-medium text-gray-800 dark:text-gray-100"
                  >
                    {{ experiment.name }}
                  </p>
                </div>

                <div>
                  <ExperimentClassBadge
                    :experiment-class="experiment.experimentClass"
                    size="sm"
                  />
                </div>

                <div
                  class="flex items-center gap-2 text-sm"
                  :class="statusClass(experimentRunStatus(experiment))"
                  :data-test="`experiment-status-${experimentRunStatus(experiment)}`"
                >
                  <UIcon
                    :name="statusIcon(experimentRunStatus(experiment))"
                    class="size-3.5 shrink-0"
                    :class="{
                      'fill-current':
                        experimentRunStatus(experiment) === 'running',
                    }"
                  />
                  <span>{{
                    statusLabel(experimentRunStatus(experiment))
                  }}</span>
                </div>

                <div class="min-w-0">
                  <div
                    v-if="experimentProgressPercent(experiment) !== null"
                    class="flex items-center gap-3"
                    data-test="group-progress-bar"
                  >
                    <div
                      class="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                    >
                      <div
                        class="h-full rounded-full transition-all"
                        :class="
                          experimentRunStatus(experiment) === 'completed'
                            ? 'bg-green-500 dark:bg-green-400'
                            : 'bg-blue-500 dark:bg-blue-400'
                        "
                        :style="{
                          width: `${experimentProgressPercent(experiment)}%`,
                        }"
                      ></div>
                    </div>
                    <span
                      class="w-10 shrink-0 text-right text-xs text-gray-600 dark:text-gray-400"
                    >
                      {{ experimentProgressPercent(experiment) }}%
                    </span>
                  </div>
                  <span
                    v-else
                    class="text-xs text-gray-500 dark:text-gray-400"
                    data-test="group-progress-unknown"
                  >
                    {{ formatNumber(experiment.yearsRun) }} years
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div
        v-show="!isOpen(group.id)"
        class="flex items-start gap-2 border-t border-gray-100 px-5 py-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400"
        :data-test="`experiment-group-glossary-${group.id}`"
      >
        <UIcon
          name="i-lucide-book-open"
          class="mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />
        <p>{{ glossaryLongFor(group) }}</p>
      </div>
    </article>
  </section>
</template>
