<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import type { ContentCollectionItem } from "@nuxt/content";
import type { PayuExperiment } from "~/services/payuExperiments";
import type { ExperimentGroup } from "~/services/experimentGroups";
import {
  experimentProgressPercent,
  experimentRunStatus,
  groupExperimentsByProgramme,
} from "~/services/experimentGroups";

const props = defineProps<{
  experiments: PayuExperiment[];
  postByExperiment?: Record<string, ContentCollectionItem>;
}>();

const groups = computed(() => groupExperimentsByProgramme(props.experiments));
const openGroups = ref<string[]>([]);

/**
 * How a card presents itself: `open` is the expanded panel, `tile` a card sharing
 * its row with another closed group, `strip` a closed group alone on its row.
 */
type GroupMode = "open" | "tile" | "strip";

/** Span classes are written out so Tailwind can see them in the source. */
const SPAN_CLASS: Record<number, string> = {
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  6: "lg:col-span-6",
};

/**
 * Lays the groups out as bands over a six-column grid: each open group takes a full
 * row, and each run of consecutive closed groups splits a row evenly between them.
 * That keeps the vertical order intact — opening DECK expands it above Fast Track and
 * Other, which close ranks into a two-up row. A closed group left alone on its row
 * renders as a slim strip rather than a stretched, mostly-empty tile.
 */
const layout = computed<
  { group: ExperimentGroup; span: number; mode: GroupMode }[]
>(() => {
  const bands: { group: ExperimentGroup; span: number; mode: GroupMode }[] = [];

  for (let index = 0; index < groups.value.length;) {
    const group = groups.value[index]!;

    if (isOpen(group.id)) {
      bands.push({ group, span: 6, mode: "open" });
      index += 1;
      continue;
    }

    // Take the whole run of closed groups: they share one row between them.
    let end = index;
    while (end < groups.value.length && !isOpen(groups.value[end]!.id))
      end += 1;

    const run = groups.value.slice(index, end);
    for (const closed of run) {
      bands.push({
        group: closed,
        span: 6 / run.length,
        mode: run.length === 1 ? "strip" : "tile",
      });
    }
    index = end;
  }

  return bands;
});

const { getTerm } = useGlossary();

/**
 * The plain-language glossary definition shown in the collapsed footer. Sourced
 * from the glossary's `long` field (deck / aft → fast-track), falling back to the
 * group's own description for groups with no glossary entry (e.g. "other").
 */
function glossaryLongFor(group: { id: string; description: string }): string {
  return getTerm(group.id)?.long ?? group.description;
}

/**
 * Toggling reflows the whole row — the card grows, its neighbours change column
 * span and slide — so it runs inside a view transition, which morphs every named
 * card from its old rectangle to its new one (see `main.css` for the timing).
 * Where the API is missing (older browsers, and happy-dom under test) the state
 * change applies synchronously and the layout snaps.
 */
function toggleGroup(id: string) {
  const apply = () => {
    openGroups.value = openGroups.value.includes(id)
      ? openGroups.value.filter((openId) => openId !== id)
      : [...openGroups.value, id];
  };

  if (typeof document === "undefined" || !("startViewTransition" in document)) {
    apply();
    return;
  }

  // The callback must resolve only once Vue has patched the DOM, or the browser
  // captures the "after" state too early.
  document.startViewTransition(() => {
    apply();
    return nextTick();
  });
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
</script>

<template>
  <section
    class="grid gap-5 lg:grid-cols-6"
    aria-label="Simulation groups"
    data-test="experiment-programme-groups"
  >
    <article
      v-for="{ group, span, mode } in layout"
      :key="group.id"
      class="overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-gray-900"
      :class="[
        SPAN_CLASS[span],
        {
          'border-blue-200 dark:border-blue-800': group.id === 'deck',
          'border-green-200 dark:border-green-800': group.id === 'aft',
          'border-gray-200 dark:border-gray-700': group.id === 'other',
        },
      ]"
      :style="{ viewTransitionName: `experiment-group-${group.id}` }"
      :data-test="`experiment-group-${group.id}`"
      :data-mode="mode"
    >
      <button
        type="button"
        class="flex w-full items-start gap-4 px-5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
        :class="mode === 'strip' ? 'py-3' : 'py-4'"
        :aria-expanded="isOpen(group.id)"
        :aria-controls="`experiment-group-panel-${group.id}`"
        :data-test="`experiment-group-toggle-${group.id}`"
        @click="toggleGroup(group.id)"
      >
        <UIcon
          :name="group.icon"
          class="mt-0.5 size-5 shrink-0"
          :class="{
            'text-blue-600 dark:text-blue-400': group.id === 'deck',
            'text-green-600 dark:text-green-400': group.id === 'aft',
            'text-gray-500 dark:text-gray-400': group.id === 'other',
          }"
        />
        <span class="min-w-0 flex-1">
          <!-- The badge rides the title line, right-aligned: the label span is
               flex-1, so its right edge is the header's right edge and the badge
               lands in the same place open or closed. On a tile at lg the column
               is too narrow to share that line, so title and badge stack — the
               badge drops onto its own row beneath the label. -->
          <span
            class="flex items-center justify-between gap-3"
            :class="{ 'lg:flex-col lg:items-start lg:gap-2': mode === 'tile' }"
          >
            <span
              class="text-base font-semibold text-gray-800 dark:text-gray-100"
            >
              {{ group.label }}
            </span>
            <UBadge
              :color="group.color"
              variant="subtle"
              :label="
                group.summary.percent === null
                  ? `${group.summary.total} simulations`
                  : `${group.summary.percent}% complete`
              "
              class="shrink-0"
              :data-test="`experiment-group-percent-${group.id}`"
            />
          </span>
          <!-- Strips have one line to play with, so the description is dropped
               there (and on mobile, where every closed card is a strip). Tiles
               show it from lg up, under the stacked title and badge. -->
          <span
            class="mt-1 block text-sm text-gray-500 dark:text-gray-400"
            :class="{
              hidden: mode === 'strip',
              'hidden lg:block': mode === 'tile',
            }"
          >
            {{ group.description }}
          </span>
        </span>
        <!-- The badge carries the percentage; only a strip (a closed group alone
             on its row, lg+ only) has room to also spell out the count. On mobile
             every closed card is a single-column strip visually, so the count is
             hidden to keep the header a clean one-liner. -->
        <span
          v-if="mode !== 'open' && group.summary.percent !== null"
          class="hidden shrink-0 text-sm text-gray-500 dark:text-gray-400"
          :class="{ 'lg:inline': mode === 'strip' }"
          :data-test="`experiment-group-count-${group.id}`"
        >
          {{ group.summary.total }} simulations
        </span>
        <UIcon
          name="i-lucide-chevron-down"
          class="mt-0.5 size-5 shrink-0 text-gray-400 transition-transform"
          :class="{ 'rotate-180': isOpen(group.id) }"
          aria-hidden="true"
        />
      </button>

      <!-- Named separately from the card so the card's chrome morphs its
           geometry while the panel fades in over it, rather than the whole card
           cross-fading as one stretched image. Hidden with v-show, so when
           closed it is display:none and simply is not captured. -->
      <div
        v-show="isOpen(group.id)"
        :id="`experiment-group-panel-${group.id}`"
        class="border-t border-gray-100 dark:border-gray-800"
        :style="{ viewTransitionName: `experiment-group-panel-${group.id}` }"
        :data-test="`experiment-group-panel-${group.id}`"
      >
        <div class="grid gap-0 xl:grid-cols-[16rem_1fr]">
          <aside
            class="space-y-4 border-b border-gray-100 p-5 dark:border-gray-800 xl:border-r xl:border-b-0"
          >
            <dl class="grid grid-cols-2 gap-3 text-sm xl:grid-cols-1">
              <div>
                <dt class="text-gray-500 dark:text-gray-400">Simulations</dt>
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
              <div>
                <dt class="text-gray-500 dark:text-gray-400">Published</dt>
                <dd
                  class="mt-1 text-lg font-semibold text-gray-800 dark:text-gray-100"
                >
                  {{ group.summary.published }}
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
              class="hidden grid-cols-[minmax(0,1fr)_7rem_12rem_8rem] gap-4 border-b border-gray-100 px-5 py-3 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800 dark:text-gray-500 md:grid"
            >
              <span>Simulation status</span>
              <span>Type</span>
              <span>Progress</span>
              <span><Jargon term="ESGF">ESGF Published</Jargon></span>
            </div>

            <ul class="divide-y divide-gray-100 dark:divide-gray-800">
              <li
                v-for="experiment in group.experiments"
                :key="`${group.id}-${experiment.uuid || experiment.name}`"
                class="grid gap-3 px-5 py-3 md:grid-cols-[minmax(0,1fr)_7rem_12rem_8rem] md:items-center md:gap-4"
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

                <div>
                  <EsgfStatus :published="experiment.esgfPublished">
                    <!-- The column header labels this on md+; on stacked
                         mobile rows there is no header, so caption inline. -->
                    <span
                      class="text-xs text-gray-500 md:hidden dark:text-gray-400"
                    >
                      <Jargon term="ESGF">ESGF</Jargon> published
                    </span>
                  </EsgfStatus>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- The plain-language definition sits under the table rather than on
             the collapsed card: it runs to a full paragraph, which made closed
             tiles far taller than the row they share. -->
        <div
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
      </div>
    </article>
  </section>
</template>
