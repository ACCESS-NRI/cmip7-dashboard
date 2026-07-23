// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import SectionNav from "../SectionNav.vue";

describe("SectionNav", () => {
  it("lists every section as a navigation indicator", async () => {
    const wrapper = await mountSuspended(SectionNav, {
      props: { activeId: "big-picture" },
    });

    for (const label of ["Big picture", "Progress"]) {
      expect(wrapper.text()).toContain(label);
    }
    // Framed as a location indicator, not a selector.
    expect(wrapper.text()).toContain("On this page");
  });

  it("marks the active section for the current activeId", async () => {
    const wrapper = await mountSuspended(SectionNav, {
      props: { activeId: "progress" },
    });

    expect(
      wrapper
        .find('[data-test="section-nav-item-progress"]')
        .attributes("data-active"),
    ).toBe("true");
    expect(
      wrapper
        .find('[data-test="section-nav-item-big-picture"]')
        .attributes("data-active"),
    ).toBeUndefined();
  });

  it("emits navigate with the section id when clicked", async () => {
    const wrapper = await mountSuspended(SectionNav, {
      props: { activeId: "big-picture" },
    });

    await wrapper
      .find('[data-test="section-nav-item-progress"]')
      .trigger("click");

    expect(wrapper.emitted("navigate")?.at(-1)).toEqual(["progress"]);
  });
});
