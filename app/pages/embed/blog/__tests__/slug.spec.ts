// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import type { ContentCollectionItem } from "@nuxt/content";
import EmbedBlogPage from "../[...slug].vue";

const state = vi.hoisted(() => ({
  routePath: "/embed/blog/test",
  post: null as ContentCollectionItem | null,
  queriedPath: "",
}));

mockNuxtImport("useRoute", () => () => ({ path: state.routePath }));

// Capture the path the page hands to queryCollection so we can assert the
// /embed prefix is stripped before the content lookup.
mockNuxtImport("queryCollection", () => () => ({
  path: (p: string) => {
    state.queriedPath = p;
    return { first: () => Promise.resolve(state.post) };
  },
}));

const contentRendererStub = {
  props: ["value"],
  template: '<div data-test="content">{{ value?.title }}</div>',
};

async function mountEmbed() {
  return mountSuspended(EmbedBlogPage, {
    global: { stubs: { ContentRenderer: contentRendererStub } },
  });
}

describe("embed blog page", () => {
  beforeEach(() => {
    state.routePath = "/embed/blog/test";
    state.queriedPath = "";
    state.post = {
      id: "content/blog/test.md",
      title: "A test update",
      path: "/blog/test",
    } as unknown as ContentCollectionItem;
  });

  it("strips the /embed prefix before querying content", async () => {
    await mountEmbed();

    expect(state.queriedPath).toBe("/blog/test");
  });

  it("renders the post without site chrome or a back-link", async () => {
    const wrapper = await mountEmbed();

    expect(wrapper.find('[data-test="content"]').text()).toBe("A test update");
    expect(wrapper.text()).not.toContain("All updates");
  });

  it("reports its height to the parent window on mount", async () => {
    const postMessage = vi.spyOn(window.parent, "postMessage");

    await mountEmbed();
    await flushPromises();

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ height: expect.any(Number) }),
      "*",
    );
  });
});
