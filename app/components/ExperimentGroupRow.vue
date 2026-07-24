<!--
  ExperimentGroupRow — one experiment row within a programme group, with its
  ensemble fan-out.

  Renders the four-column row (name/explainer, class badge, progress bar, ESGF
  status) and, when the experiment is an ensemble, an expandable list of member
  rows plus a "N further members not started yet" note. Owns no expansion state:
  the parent passes `expanded` and listens for `toggle`. Expansion is keyed per
  group in the parent because the same experiment can appear in more than one
  group and each copy must expand independently.

  Used by: app/components/ExperimentProgrammeGroups.vue
-->
<script setup lang="ts">
import { computed } from "vue";
import type { ContentCollectionItem } from "@nuxt/content";
import type { PayuExperiment } from "~/services/payuExperiments";
import {
  hasEnsemble,
  startedMembers,
  pendingMembers,
} from "~/services/payuExperiments";

const props = defineProps<{
  groupId: string;
  experiment: PayuExperiment;
  /** The explainer post for this experiment, already resolved by the parent. */
  post: ContentCollectionItem | null;
  expanded: boolean;
}>();

defineEmits<{ toggle: [] }>();

// Rebuilt identically to the parent's key so the aria-controls / panel ids match
// across the two components; the same uuid-or-name fallback.
const rowKey = computed(
  () => `${props.groupId}-${props.experiment.uuid || props.experiment.name}`,
);
</script>

<template>
  <li :data-test="`experiment-group-row-${groupId}`">
    <div
      class="grid gap-3 px-5 py-3 md:grid-cols-[minmax(0,1fr)_7rem_12rem_8rem] md:items-center md:gap-4"
    >
      <div class="flex min-w-0 items-center gap-1.5 text-sm">
        <!-- The chevron sits in a fixed gutter that non-ensemble
             rows keep as blank space, so every name lines up. -->
        <button
          v-if="hasEnsemble(experiment)"
          type="button"
          class="-m-1 shrink-0 rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          :aria-expanded="expanded"
          :aria-controls="`ensemble-panel-${rowKey}`"
          :aria-label="`${expanded ? 'Hide' : 'Show'} ${experiment.name} ensemble members`"
          :data-test="`ensemble-toggle-${experiment.name}`"
          @click="$emit('toggle')"
        >
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4 transition-transform"
            :class="{
              'rotate-90': expanded,
            }"
          />
        </button>
        <span v-else class="size-4 shrink-0" aria-hidden="true"></span>

        <ExperimentExplainer
          v-if="post"
          :post="post"
          :label="experiment.name"
        />
        <p
          v-else
          class="truncate text-sm font-medium text-gray-800 dark:text-gray-100"
        >
          {{ experiment.name }}
        </p>

        <!-- The bar sums the whole ensemble, so say how many runs
             that is; otherwise 172 / 1,720 years reads as a stall. -->
        <span
          v-if="hasEnsemble(experiment)"
          class="shrink-0 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500"
          :data-test="`ensemble-count-${experiment.name}`"
        >
          {{ startedMembers(experiment) }}/{{
            experiment.expectedEnsembleCount
          }}
          members
        </span>
      </div>

      <div>
        <ExperimentClassBadge
          :experiment-class="experiment.experimentClass"
          size="sm"
        />
      </div>

      <RunProgressBar
        class="min-w-0"
        :years-run="experiment.yearsRun"
        :expected-years-run="experiment.expectedYearsRun"
        test-id="group-progress"
      />

      <!-- self-center rather than relying on the row's items-center:
           the name cell can wrap to two lines and the count should
           stay on the middle of the row, not ride its top. -->
      <div class="flex h-full items-center">
        <EsgfStatus
          :published-count="experiment.esgfPublishedCount"
          :total="experiment.expectedEnsembleCount"
        >
          <!-- The column header labels this on md+; on stacked
               mobile rows there is no header, so caption inline. -->
          <span class="text-xs text-gray-500 md:hidden dark:text-gray-400">
            <Jargon term="ESGF">ESGF</Jargon> published
          </span>
        </EsgfStatus>
      </div>
    </div>

    <!-- Fanned-out ensemble members: the same four columns, indented
         into the name column so every bar stays on the parent's
         scale. Long ensembles (30 members) scroll in place rather
         than pushing the rest of the group off screen. -->
    <ul
      v-show="expanded"
      :id="`ensemble-panel-${rowKey}`"
      class="max-h-[22rem] overflow-y-auto border-t border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/30"
      :data-test="`ensemble-panel-${experiment.name}`"
    >
      <li
        v-for="member in experiment.members"
        :key="member.uuid"
        class="grid gap-1 py-1.5 pl-10 pr-5 md:grid-cols-[minmax(0,1fr)_7rem_12rem_8rem] md:items-center md:gap-4"
        :data-test="`ensemble-member-${experiment.name}`"
      >
        <p class="truncate font-mono text-xs text-gray-600 dark:text-gray-400">
          {{ member.name }}
        </p>
        <span aria-hidden="true"></span>
        <RunProgressBar
          class="min-w-0"
          :years-run="member.yearsRun"
          :expected-years-run="member.expectedYearsRun"
          compact
          test-id="member-progress"
        />
        <span aria-hidden="true"></span>
      </li>

      <!-- Planned members with nothing to show yet. Named as a
           count so the row still adds up to the planned ensemble. -->
      <li
        v-if="pendingMembers(experiment) > 0"
        class="py-2 pl-10 pr-5 text-xs italic text-gray-400 dark:text-gray-500"
        :data-test="`ensemble-pending-${experiment.name}`"
      >
        {{ pendingMembers(experiment) }} further
        {{ pendingMembers(experiment) === 1 ? "member" : "members" }}
        not started yet
      </li>
    </ul>
  </li>
</template>
