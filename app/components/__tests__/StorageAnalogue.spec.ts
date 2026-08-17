// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import StorageAnalogue from "../StorageAnalogue.vue";

// Render the popover slots inline so their bindings are assertable without
// depending on reka-ui's teleport + floating-ui behaviour in happy-dom.
const stubs = {
  UPopover: { template: `<span><slot /><slot name="content" /></span>` },
};

function mount(gb: number) {
  return mountSuspended(StorageAnalogue, { props: { gb }, global: { stubs } });
}

describe("StorageAnalogue", () => {
  it("renders the figure as a trigger and lists everyday comparisons", async () => {
    const wrapper = await mount(1720);

    const trigger = wrapper.find('[data-test="storage-analogue"]');
    expect(trigger.exists()).toBe(true);
    expect(trigger.text()).toContain("1,720 GB");

    const items = wrapper.findAll('[data-test="storage-analogue-item"]');
    // iPhones, Shakespeare, DVDs, Netflix hours.
    expect(items).toHaveLength(4);

    const text = items.map((i) => i.text()).join(" | ");
    // 1720 / 128 ≈ 13 full iPhones.
    expect(text).toContain("13");
    expect(text).toContain("full iPhones");
    // 1720 / 4.7 ≈ 366 DVDs.
    expect(text).toContain("366");
    expect(text).toContain("DVDs");
    // 1720 / 3 ≈ 573 hours of Netflix HD.
    expect(text).toContain("573");
    expect(text).toContain("hours of Netflix HD");
    // 1720 * 1024 / 5 ≈ 352,256 copies of the complete works.
    expect(text).toContain("352,256");
    expect(text).toContain("complete works of Shakespeare");
  });

  it("describes the figure and its comparisons in the trigger's aria-label", async () => {
    const withData = await mount(1720);
    expect(
      withData.find('[data-test="storage-analogue"]').attributes("aria-label"),
    ).toBe("1,720 GB. Everyday comparisons available.");

    const empty = await mount(0);
    expect(
      empty.find('[data-test="storage-analogue"]').attributes("aria-label"),
    ).toBe("0 GB.");
  });

  it("respects a default-slot override for the trigger label", async () => {
    const wrapper = await mountSuspended(StorageAnalogue, {
      props: { gb: 1720 },
      slots: { default: () => "≈1.7 TB" },
      global: { stubs },
    });

    expect(wrapper.find('[data-test="storage-analogue"]').text()).toContain(
      "≈1.7 TB",
    );
  });

  it("shows no comparison for a zero size instead of 'zero iPhones'", async () => {
    const wrapper = await mount(0);

    expect(wrapper.find('[data-test="storage-analogue"]').text()).toContain(
      "0 GB",
    );
    expect(wrapper.findAll('[data-test="storage-analogue-item"]')).toHaveLength(
      0,
    );
  });
});
