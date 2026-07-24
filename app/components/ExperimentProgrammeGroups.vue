<!--
  ExperimentProgrammeGroups — the three programme-group cards (DECK, Scenarios,
  Other) with their expandable experiment and ensemble-member rows.

  Groups the experiment list via groupExperimentsByProgramme, arranges the cards
  into rows with layoutGroupBands, and owns the open/closed UI state for both the
  group panels and the per-experiment ensemble rows. Delegates each open group's
  sidebar to ExperimentGroupStats and each experiment row to ExperimentGroupRow;
  the collapsed-card header and glossary footer stay here because their layout is
  coupled to the band the parent owns. The experiment data and per-experiment
  explainer posts are passed in as props. Uses the view-transition API for the
  expand/collapse animation.

  Used by: app/pages/index.vue
-->
<script setup lang="ts">
import { computed, nextTick } from "vue";
import type { ContentCollectionItem } from "@nuxt/content";
import type { PayuExperiment } from "~/services/payuExperiments";
import { groupExperimentsByProgramme } from "~/services/experimentGroups";
import { layoutGroupBands } from "~/services/groupBandLayout";

const props = defineProps<{
  experiments: PayuExperiment[];
  postByExperiment?: Record<string, ContentCollectionItem>;
}>();

const groups = computed(() => groupExperimentsByProgramme(props.experiments));

// The expanded/collapsed state of the group panels.
const { isOpen, toggle: toggleOpenGroup } = useToggleList();

/** Span classes are written out so Tailwind can see them in the source. */
const SPAN_CLASS: Record<number, string> = {
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  6: "lg:col-span-6",
};

const layout = computed(() => layoutGroupBands(groups.value, isOpen));

const { getTerm } = useGlossary();

/**
 * The plain-language glossary definition shown in the collapsed footer. Sourced
 * from the glossary's `long` field, looked up by group id (deck, scenario), and
 * falling back to the group's own description for groups with no glossary entry
 * (e.g. "other").
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
  const apply = () => toggleOpenGroup(id);

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

function explainerFor(
  experiment: PayuExperiment,
): ContentCollectionItem | null {
  return props.postByExperiment?.[experiment.name] ?? null;
}

// ---------------------------------------------------------------------------
// Ensemble fan-out
// ---------------------------------------------------------------------------

// An experiment row stays a single line summarising the whole ensemble; its
// members are one click away, rendered by ExperimentGroupRow. Expansion is keyed
// per group because an experiment can appear in more than one group, and the
// copies expand independently.
const { isOpen: isRowExpanded, toggle: toggleRow } = useToggleList();

function rowKey(groupId: string, experiment: PayuExperiment): string {
  return `${groupId}-${experiment.uuid || experiment.name}`;
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
          'border-indigo-200 dark:border-indigo-800': group.id === 'scenario',
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
            'text-indigo-600 dark:text-indigo-400': group.id === 'scenario',
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
          <ExperimentGroupStats :summary="group.summary" />

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
              <ExperimentGroupRow
                v-for="experiment in group.experiments"
                :key="rowKey(group.id, experiment)"
                :group-id="group.id"
                :experiment="experiment"
                :post="explainerFor(experiment)"
                :expanded="isRowExpanded(rowKey(group.id, experiment))"
                @toggle="toggleRow(rowKey(group.id, experiment))"
              />
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
