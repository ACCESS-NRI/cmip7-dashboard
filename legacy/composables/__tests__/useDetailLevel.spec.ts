// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { useDetailLevel } from "../useDetailLevel";

const Harness = defineComponent({
  setup() {
    return { level: useDetailLevel() };
  },
  template: '<div data-test="level">{{ level }}</div>',
});

describe("useDetailLevel", () => {
  it("defaults to Overview (0)", async () => {
    const wrapper = await mountSuspended(Harness);
    expect(wrapper.find('[data-test="level"]').text()).toBe("0");
  });

  it("shares one state across consumers", async () => {
    const first = await mountSuspended(Harness);
    const second = await mountSuspended(Harness);

    (first.vm as unknown as { level: number }).level = 2;
    await first.vm.$nextTick();
    await second.vm.$nextTick();

    expect(second.find('[data-test="level"]').text()).toBe("2");
  });
});
