// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { ContentCollectionItem } from "@nuxt/content";
import BlogArticle from "../BlogArticle.vue";

// The article body is delegated to Nuxt Content's <ContentRenderer>; stub it so
// we can assert the post is handed through without parsing real markdown.
const contentRendererStub = {
  props: ["value"],
  template: '<div data-test="content">{{ value?.title }}</div>',
};

function makePost(
  overrides: Partial<ContentCollectionItem> = {},
): ContentCollectionItem {
  return {
    id: "content/blog/test.md",
    title: "A test update",
    path: "/blog/test",
    ...overrides,
  } as unknown as ContentCollectionItem;
}

async function mountArticle(post: ContentCollectionItem) {
  return mountSuspended(BlogArticle, {
    props: { post },
    global: { stubs: { ContentRenderer: contentRendererStub } },
  });
}

describe("BlogArticle", () => {
  it("passes the post through to ContentRenderer", async () => {
    const wrapper = await mountArticle(makePost({ title: "Hello world" }));

    expect(wrapper.find('[data-test="content"]').text()).toBe("Hello world");
  });

  it("renders the post title as a heading", async () => {
    const wrapper = await mountArticle(makePost({ title: "Hello world" }));

    expect(wrapper.find("h1").text()).toBe("Hello world");
  });

  it("renders further-reading links from frontmatter when present", async () => {
    const wrapper = await mountArticle(
      makePost({
        furtherReading: [
          { title: "WCRP CMIP", url: "https://wcrp-cmip.org/cmip7/" },
        ],
      } as Partial<ContentCollectionItem>),
    );

    const link = wrapper.find('[data-test="further-reading"] a');
    expect(link.attributes("href")).toBe("https://wcrp-cmip.org/cmip7/");
    expect(link.attributes("target")).toBe("_blank");
  });

  it("omits further reading when there are no links", async () => {
    const wrapper = await mountArticle(makePost());

    expect(wrapper.find('[data-test="further-reading"]').exists()).toBe(false);
  });

  it("renders the formatted date and author when both are present", async () => {
    const wrapper = await mountArticle(
      makePost({ date: "2026-01-15", author: "Jane Doe" }),
    );

    const header = wrapper.find("header");
    // Avoid asserting the exact day to stay timezone-independent.
    expect(header.text()).toContain("January");
    expect(header.text()).toContain("2026");
    expect(header.text()).toContain("Jane Doe");
  });

  it("shows the author separator only when an author is set", async () => {
    const withAuthor = await mountArticle(
      makePost({ date: "2026-01-15", author: "Jane Doe" }),
    );
    expect(withAuthor.find("header").text()).toContain("·");

    const dateOnly = await mountArticle(makePost({ date: "2026-01-15" }));
    expect(dateOnly.find("header").text()).not.toContain("·");
  });

  it("leaves the header empty when there is no date or author", async () => {
    const wrapper = await mountArticle(makePost());

    expect(wrapper.find("header").text()).toBe("");
    // The article body still renders.
    expect(wrapper.find('[data-test="content"]').exists()).toBe(true);
  });
});
