// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { useHoverCapablePopoverMode } from "~/composables/useHoverCapablePopoverMode";

type ChangeListener = (e: { matches: boolean }) => void;

// Minimal MediaQueryList stub: reports a fixed `matches` and captures the
// change listener so a test can flip the query at runtime.
function stubMatchMedia(matches: boolean) {
  let listener: ChangeListener | null = null;
  const mql = {
    matches,
    addEventListener: (_: string, cb: ChangeListener) => {
      listener = cb;
    },
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mql),
  );
  return {
    // Mirror a real MediaQueryList: `matches` reflects the new state on change.
    fireChange: (next: boolean) => {
      mql.matches = next;
      listener?.({ matches: next });
    },
    removeEventListener: mql.removeEventListener,
  };
}

const Harness = defineComponent({
  setup() {
    return { mode: useHoverCapablePopoverMode() };
  },
  template: '<span data-test="mode">{{ mode }}</span>',
});

describe("useHoverCapablePopoverMode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses hover mode when the primary input can hover", async () => {
    stubMatchMedia(false);
    const wrapper = await mountSuspended(Harness);
    expect(wrapper.find('[data-test="mode"]').text()).toBe("hover");
  });

  it("uses click mode when the primary input cannot hover", async () => {
    stubMatchMedia(true);
    const wrapper = await mountSuspended(Harness);
    expect(wrapper.find('[data-test="mode"]').text()).toBe("click");
  });

  it("reacts to the hover capability changing at runtime", async () => {
    const mq = stubMatchMedia(false);
    const wrapper = await mountSuspended(Harness);
    expect(wrapper.find('[data-test="mode"]').text()).toBe("hover");

    mq.fireChange(true);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="mode"]').text()).toBe("click");
  });

  it("stops listening when the consumer unmounts", async () => {
    const mq = stubMatchMedia(true);
    const wrapper = await mountSuspended(Harness);
    wrapper.unmount();
    expect(mq.removeEventListener).toHaveBeenCalled();
  });
});
