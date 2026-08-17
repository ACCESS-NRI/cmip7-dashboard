<!--
  StorageAnalogue — an inline GB figure with a hover popover that translates the
  number into everyday comparisons (issue: storage-analogue).

  Big data-volume estimates are hard to feel: "26,000 GB" means little on its own.
  This wraps such a figure in a hover popover (reka's UPopover, like Jargon.vue)
  that reads it back as ~N full iPhones, complete works of Shakespeare, DVDs and
  hours of Netflix HD. It borrows Jargon's trigger + popover styling but works
  differently: comparisons are computed on the fly from the `gb` prop — there is no
  glossary lookup and no glossary deep link. The trigger is a plain dotted underline
  (no background highlight). Non-positive sizes render just the figure with a gentle
  "no comparison yet" note rather than "0 iPhones".

  Used by: app/components/ExperimentTotals.vue
-->
<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  /** The size to translate into everyday comparisons, in gigabytes. */
  gb: number;
}>();

// Reference sizes for the comparisons. `gbPer` is how many GB one of the thing is
// (Shakespeare's complete works ≈ 5 MB of plain text → 5/1024 GB; a Netflix HD
// hour ≈ 3 GB). Kept deliberately round — these are for intuition, not accounting.
const REFERENCES = [
  {
    key: "iphones",
    icon: "i-lucide-smartphone",
    label: "full iPhones",
    gbPer: 128,
  },
  { key: "dvds", icon: "i-lucide-disc", label: "DVDs", gbPer: 4.7 },
  {
    key: "netflix",
    icon: "i-lucide-clapperboard",
    label: "hours of Netflix HD",
    gbPer: 3,
  },
  {
    key: "shakespeare",
    icon: "i-lucide-book-open",
    label: "copies of the complete works of Shakespeare",
    gbPer: 5 / 1024,
  },
] as const;

const comparisons = computed(() =>
  props.gb > 0
    ? REFERENCES.map((r) => ({
        key: r.key,
        icon: r.icon,
        value: formatNumber(Math.round(props.gb / r.gbPer)),
        label: r.label,
      }))
    : [],
);

const ariaLabel = computed(() =>
  props.gb > 0
    ? `${formatNumber(props.gb)} GB. Everyday comparisons available.`
    : `${formatNumber(props.gb)} GB.`,
);
</script>

<template>
  <UPopover
    mode="hover"
    :open-delay="120"
    :close-delay="120"
    :data-test="'storage-analogue-popover'"
  >
    <UButton
      variant="ghost"
      color="neutral"
      data-test="storage-analogue"
      :aria-label="ariaLabel"
      class="storage-analogue inline cursor-help p-0 font-medium leading-none text-gray-400 underline decoration-current/40 decoration-dotted underline-offset-[3px] transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 [font-size:inherit]"
    >
      <slot>{{ formatNumber(gb) }} GB</slot>
    </UButton>

    <template #content>
      <div class="max-w-xs space-y-2 p-4">
        <p class="text-sm font-semibold text-gray-900 dark:text-white">
          That's roughly&hellip;
        </p>
        <ul v-if="comparisons.length" class="space-y-1.5">
          <li
            v-for="c in comparisons"
            :key="c.key"
            data-test="storage-analogue-item"
            class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
          >
            <UIcon
              :name="c.icon"
              class="mt-0.5 size-4 shrink-0 text-primary opacity-70"
            />
            <span>
              <span class="font-semibold text-gray-900 dark:text-white">{{
                c.value
              }}</span>
              {{ c.label }}
            </span>
          </li>
        </ul>
        <p v-else class="text-sm text-gray-500 dark:text-gray-400">
          No comparison yet &mdash; nothing published so far.
        </p>
      </div>
    </template>
  </UPopover>
</template>
