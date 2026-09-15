import { nextTick, ref, type Ref } from "vue";

/**
 * useIframeEmbedHeight — report an embed page's height to its parent frame.
 *
 * Embed pages render inside a host iframe that cannot know their content
 * height. This posts the bound element's document-space bottom edge to
 * `window.parent` and keeps it in sync as panels expand/collapse. Deliberately
 * does NOT register
 * `onMounted` itself: some pages must send the first measurement only after
 * their own data fetch resolves, so each caller invokes `start()` at the exact
 * point in its own `onMounted` where the reporting should begin.
 *
 * Two quirks are intentional and must not be "fixed": the target origin is the
 * wildcard `"*"` (the host frame may be served from any origin), and the
 * `ResizeObserver` is never disconnected (embed pages live for the whole
 * lifetime of the iframe, so there is nothing to clean up).
 *
 * Used by: app/pages/embed/experiments.vue,
 * app/pages/embed/blog/[...slug].vue
 */
export function useIframeEmbedHeight(): {
  elementRef: Ref<HTMLElement | null>;
  start: () => Promise<void>;
} {
  const elementRef = ref<HTMLElement | null>(null);

  function notifyHeight() {
    if (!elementRef.value) return;
    // Measure to the element's bottom edge in document space, not its own
    // scrollHeight. scrollHeight omits everything OUTSIDE the element — the
    // body/html margins and the embed layout wrapper — so the parent sized the
    // frame a few px short and it showed a scrollbar. rect.bottom + scrollY
    // folds that outer offset back in, still shrinks when content collapses
    // (unlike documentElement.scrollHeight, which the collapsible embeds rely
    // on), and Math.ceil absorbs the sub-pixel that a plain floor would drop.
    const rect = elementRef.value.getBoundingClientRect();
    const height = Math.ceil(rect.bottom + window.scrollY);
    window.parent.postMessage({ height }, "*");
  }

  async function start() {
    await nextTick();
    notifyHeight();

    if (elementRef.value) {
      const observer = new ResizeObserver(() => notifyHeight());
      observer.observe(elementRef.value);
    }
  }

  return { elementRef, start };
}
