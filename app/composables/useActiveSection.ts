import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

/**
 * useActiveSection — scroll-spy for the sidebar navigation indicator.
 *
 * Watches the given section elements (by id) and reports which one is currently
 * in the middle of the viewport, so the sidebar can highlight "where you are" as
 * you scroll — it is a position indicator, not a selector.
 *
 * Client-only: a no-op during SSR (there is no viewport to observe). Because
 * the detail sections mount after the experiment data loads, `refresh()` lets
 * the caller re-attach the observer once those elements exist.
 *
 * Used by: app/pages/index.vue
 */
export function useActiveSection(ids: readonly string[]) {
  const activeId = ref<string>(ids[0] ?? "");

  let observer: IntersectionObserver | null = null;
  // Latest visibility per section, so when several straddle the centre band we
  // can pick the earliest one in document order rather than flickering.
  const visible = new Set<string>();

  function observe() {
    if (!observer) return;
    for (const id of ids) {
      const el = document.getElementById(id);
      // Observing the same element twice is a no-op, so refresh() is safe.
      if (el) observer.observe(el);
    }
  }

  onMounted(() => {
    if (typeof IntersectionObserver === "undefined") return;

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = ids.find((id) => visible.has(id));
        if (first) activeId.value = first;
      },
      // Only count a section as active while it crosses the centre 10% of the
      // viewport, which keeps exactly one highlighted as you scroll.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    observe();
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
  });

  return { activeId, refresh: () => nextTick(observe) };
}
