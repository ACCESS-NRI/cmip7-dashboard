// Loose shape of a content page as it comes back from the collection: the top-
// level fields plus the `meta.*` fallbacks older posts store them under.
type BlogPage = {
  path?: string;
  title?: string;
  description?: string;
  date?: string;
  author?: string;
  meta?: {
    title?: string;
    description?: string;
    date?: string;
    author?: string;
  };
};

/**
 * useBlogPosts — the blog listing, sorted newest-first.
 *
 * Queries every content page, keeps only the ones under `/blog/` (excluding the
 * index route), sorts them date-descending, and normalises each into the flat
 * `{ href, title, description, date, author }` shape the listing renders,
 * resolving the `meta.*` fallbacks for posts that store fields there. Keeps the
 * `"blog-posts"` `useAsyncData` key so caching behaviour is unchanged.
 *
 * Used by: app/components/BlogItems.vue
 */
export async function useBlogPosts() {
  const { data: posts } = await useAsyncData("blog-posts", async () => {
    const pages = (await queryCollection("content").all()) as BlogPage[];

    return pages
      .filter(
        (page) => page.path?.startsWith("/blog/") && page.path !== "/blog",
      )
      .sort((a, b) => {
        const aDate = a.date ?? a.meta?.date;
        const bDate = b.date ?? b.meta?.date;
        const aTime = aDate ? new Date(aDate).getTime() : 0;
        const bTime = bDate ? new Date(bDate).getTime() : 0;

        return bTime - aTime;
      })
      .map((page) => ({
        href: page.path ?? "/blog",
        title: page.title ?? page.meta?.title ?? "Untitled update",
        description: page.description ?? page.meta?.description ?? "",
        date: page.date ?? page.meta?.date,
        author: page.author ?? page.meta?.author,
      }));
  });

  return { posts };
}
