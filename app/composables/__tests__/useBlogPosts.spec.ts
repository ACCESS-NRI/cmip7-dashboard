// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { clearNuxtData } from "#app";
import { useBlogPosts } from "../useBlogPosts";

// Mutable fixture the hoisted `queryCollection` mock reads. Each test sets
// `state.items` before mounting; `.all()` resolves it during suspense.
const state = vi.hoisted(() => ({ items: [] as unknown[] }));

mockNuxtImport("queryCollection", () => () => ({
  all: () => Promise.resolve(state.items),
}));

// Capture the composable's real return so `.value` assertions read the live ref
// rather than a template-unwrapped proxy.
let api: Awaited<ReturnType<typeof useBlogPosts>>;

const Harness = defineComponent({
  async setup() {
    // useAsyncData dedupes on the "blog-posts" key, so clear it between mounts.
    clearNuxtData("blog-posts");
    api = await useBlogPosts();
    return () => h("div");
  },
});

async function mountBlog(items: unknown[]) {
  state.items = items;
  await mountSuspended(Harness);
  return api;
}

beforeEach(() => {
  state.items = [];
});

describe("useBlogPosts", () => {
  it("keeps only posts under /blog/, excluding the /blog index", async () => {
    const { posts } = await mountBlog([
      { path: "/blog/one", title: "One", date: "2026-01-01" },
      { path: "/glossary/foo", title: "Not a blog" },
      { path: "/blog", title: "Index" },
    ]);

    expect((posts.value ?? []).map((p) => p.href)).toEqual(["/blog/one"]);
  });

  it("sorts posts newest-first by date", async () => {
    const { posts } = await mountBlog([
      { path: "/blog/older", title: "Older", date: "2025-01-01" },
      { path: "/blog/newer", title: "Newer", date: "2026-02-01" },
      { path: "/blog/middle", title: "Middle", date: "2025-06-01" },
    ]);

    expect((posts.value ?? []).map((p) => p.href)).toEqual([
      "/blog/newer",
      "/blog/middle",
      "/blog/older",
    ]);
  });

  it("resolves the meta.* fallbacks when top-level fields are absent", async () => {
    const { posts } = await mountBlog([
      {
        path: "/blog/meta-post",
        meta: {
          title: "Meta Title",
          description: "Meta description",
          date: "2027-01-01",
          author: "Meta Author",
        },
      },
    ]);

    expect(posts.value?.[0]).toMatchObject({
      href: "/blog/meta-post",
      title: "Meta Title",
      description: "Meta description",
      date: "2027-01-01",
      author: "Meta Author",
    });
  });

  it("falls back to placeholder title and empty description when both are missing", async () => {
    const { posts } = await mountBlog([{ path: "/blog/bare" }]);

    expect(posts.value?.[0]).toMatchObject({
      href: "/blog/bare",
      title: "Untitled update",
      description: "",
    });
    expect(posts.value?.[0]?.author).toBeUndefined();
  });
});
