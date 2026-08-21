// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import AboutCard from "../AboutCard.vue";

// Stub Jargon so the card renders without the glossary composable; we only care
// that its inline terms survive as text here.
const stubs = {
  Jargon: { template: "<span><slot /></span>" },
};

function mount() {
  return mountSuspended(AboutCard, { global: { stubs } });
}

describe("AboutCard", () => {
  it("renders the About heading and explainer copy", async () => {
    const wrapper = await mount();

    const card = wrapper.find('[data-test="about-card"]');
    expect(card.exists()).toBe(true);
    expect(card.text()).toContain("About");
    expect(card.text()).toContain("browser-based view over");
    expect(card.text()).toContain("content/blog/");
  });

  it("links to the blog and glossary routes", async () => {
    const wrapper = await mount();

    const hrefs = wrapper.findAll("a").map((a) => a.attributes("href"));
    // NuxtLink renders to <a> with the resolved route.
    expect(hrefs).toContain("/blog");
    expect(hrefs).toContain("/glossary");
  });

  it("credits ACCESS-NRI with a logo linking to the website", async () => {
    const wrapper = await mount();

    const logo = wrapper.find('img[alt="ACCESS-NRI"]');
    expect(logo.exists()).toBe(true);

    const link = wrapper.find('a[href="https://www.access-nri.org.au"]');
    expect(link.exists()).toBe(true);
    expect(link.attributes("rel")).toBe("noopener noreferrer");
    expect(link.attributes("target")).toBe("_blank");
  });
});
