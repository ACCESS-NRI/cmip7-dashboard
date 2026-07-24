import { nextTick, ref, type Ref } from "vue";

/**
 * useIframeEmbedHeight — report an embed page's height to its parent frame.
 *
 * Embed pages render inside a host iframe that cannot know their content
 * height. This posts the measured `scrollHeight` to `window.parent` and keeps
 * it in sync as panels expand/collapse. Deliberately does NOT register
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
    if (elementRef.value) {
      window.parent.postMessage({ height: elementRef.value.scrollHeight }, "*");
    }
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
