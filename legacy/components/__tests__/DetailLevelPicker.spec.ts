// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import type { DOMWrapper } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import DetailLevelPicker from "../DetailLevelPicker.vue";

// Drive the shared detail level directly so each test starts from a known level.
const levelState = vi.hoisted(() => ({
  ref: null as null | { value: number },
}));

vi.mock("../../composables/useDetailLevel", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../composables/useDetailLevel")>();
  return { ...actual, useDetailLevel: () => levelState.ref };
});

function findEntry(
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
  label: string,
) {
  const entry = wrapper
    .findAll("a, button")
    .find((node: DOMWrapper<Element>) => node.text().includes(label));
  expect(entry, `picker entry "${label}"`).toBeTruthy();
  return entry!;
}

describe("DetailLevelPicker", () => {
  beforeEach(() => {
    levelState.ref = ref(0);
  });

  it("lists all levels under the parent entry, defaulting to Big picture", async () => {
    const wrapper = await mountSuspended(DetailLevelPicker);

    for (const label of ["Big picture", "Progress", "Under the hood"]) {
      expect(wrapper.text()).toContain(label);
    }
    expect(findEntry(wrapper, "Big picture").attributes("data-active")).toBe(
      "",
    );
    expect(
      wrapper.find('[data-test="active-level-description"]').text(),
    ).toContain("why they matter");
  });

  it("updates the shared level when an entry is selected", async () => {
    const wrapper = await mountSuspended(DetailLevelPicker);

    await findEntry(wrapper, "Under the hood").trigger("click");

    expect(levelState.ref!.value).toBe(2);
    expect(
      wrapper.find('[data-test="active-level-description"]').text(),
    ).toContain("telemetry");
  });
});
