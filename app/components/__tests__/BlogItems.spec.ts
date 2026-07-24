// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import BlogItems from "../BlogItems.vue";
import { useBlogPosts } from "~/composables/useBlogPosts";

vi.mock("~/composables/useBlogPosts", () => ({
  useBlogPosts: vi.fn(),
}));

const useBlogPostsMock = vi.mocked(useBlogPosts);

function mockPosts(posts: unknown[]) {
  useBlogPostsMock.mockResolvedValue({
    posts: ref(posts),
  } as unknown as Awaited<ReturnType<typeof useBlogPosts>>);
}

afterEach(() => {
  useBlogPostsMock.mockReset();
});

describe("BlogItems", () => {
  it("renders a card per post with a formatted date and author", async () => {
    mockPosts([
      {
        href: "/blog/first-look",
        title: "First look at gm_tas",
        description: "An early readiness signal.",
        date: "2026-02-01",
        author: "Jo",
      },
    ]);

    const wrapper = await mountSuspended(BlogItems);

    // NuxtLink prefixes hrefs with the app base URL, which differs between
    // environments (/ locally, /cmip7-dashboard/ in a production build), so
    // assert the target path appears rather than pinning the exact attribute.
    expect(wrapper.html()).toContain("/blog/first-look");
    expect(wrapper.text()).toContain("First look at gm_tas");
    expect(wrapper.text()).toContain("An early readiness signal.");
    // formatPostDate renders the en-AU long form and appends the author.
    expect(wrapper.text()).toContain("1 February 2026");
    expect(wrapper.text()).toContain("Jo");
  });

  it("shows 'Draft' when a post has no date", async () => {
    mockPosts([{ href: "/blog/undated", title: "Undated", description: "" }]);

    const wrapper = await mountSuspended(BlogItems);

    expect(wrapper.text()).toContain("Draft");
  });

  it("shows the empty-state note when there are no posts", async () => {
    mockPosts([]);

    const wrapper = await mountSuspended(BlogItems);

    expect(wrapper.text()).toContain("No updates published yet.");
  });
});
