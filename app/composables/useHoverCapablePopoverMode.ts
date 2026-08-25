import { onBeforeUnmount, onMounted, ref } from "vue";

/**
 * useHoverCapablePopoverMode — pick a UPopover `mode` that also works on touch.
 *
 * Nuxt UI's `<UPopover mode="hover">` renders reka-ui's HoverCard, which is
 * pointer-only: its trigger opens on pointerenter (excluded for touch pointers)
 * or on focus, and iOS Safari doesn't focus a <button> on tap — so a hover-mode
 * popover never opens on a real iPhone. (Device emulators still report a
 * "mouse" pointer, which is why the bug hides in the simulator.)
 *
 * This returns "hover" where the primary input can hover and "click" (reka's
 * plain Popover, which toggles reliably on tap) where it can't. It starts as
 * "hover" so SSR and the pre-hydration paint match the desktop default, then
 * corrects on mount and reacts to the media query changing (e.g. a tablet
 * switching between touch and an attached trackpad).
 *
 * Used by: app/components/content/Jargon.vue, app/components/GitCommit.vue,
 * app/components/StorageAnalogue.vue
 */
export function useHoverCapablePopoverMode() {
  const mode = ref<"hover" | "click">("hover");

  let query: MediaQueryList | null = null;
  const sync = () => {
    mode.value = query?.matches ? "click" : "hover";
  };

  onMounted(() => {
    if (typeof window.matchMedia !== "function") return;
    query = window.matchMedia("(hover: none)");
    sync();
    query.addEventListener("change", sync);
  });

  onBeforeUnmount(() => {
    query?.removeEventListener("change", sync);
    query = null;
  });

  return mode;
}
