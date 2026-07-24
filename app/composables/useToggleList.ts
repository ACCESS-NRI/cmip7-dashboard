/**
 * useToggleList — a set of open ids held as a reactive array.
 *
 * The array-of-open-ids pattern used for independently open/closed items:
 * `isOpen(id)` reads membership, `toggle(id)` flips it immutably (replacing the
 * array so watchers fire). Owns no view-transition or animation logic — a caller
 * that needs one wraps `toggle` itself. Not for `v-model`-bound widgets like
 * UAccordion, which manage their own open state.
 *
 * Used by: app/components/ExperimentProgrammeGroups.vue
 */
import { ref } from "vue";
import type { Ref } from "vue";

export function useToggleList(): {
  open: Ref<string[]>;
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
} {
  const open = ref<string[]>([]);

  function isOpen(id: string): boolean {
    return open.value.includes(id);
  }

  function toggle(id: string): void {
    open.value = isOpen(id)
      ? open.value.filter((openId) => openId !== id)
      : [...open.value, id];
  }

  return { open, isOpen, toggle };
}
