# Subplan 02 — Extract duplicated page logic into composables

Read `00-overview.md` first. The hard rule (zero functionality changes) and the
verification protocol there apply throughout. Subplan 01 should already be
merged (it removes files this plan would otherwise trip over).

## Background

Three pages copy-paste the same payu data-loading block, two embed pages
copy-paste the same iframe-height-reporting block, and two components inline
content queries that belong in composables. Extracting these gives each pattern
one greppable home with one docstring.

Every extraction here is a **pure motion of code**: the composable must produce
byte-for-byte the same behaviour the inline version had. Where the inline
versions differ slightly from each other, the composable must preserve each
call site's exact behaviour (details below).

## 1. `app/composables/usePayuExperiments.ts`

Current duplication — this block appears near-identically in:

- `app/pages/index.vue`
- `app/pages/embed/experiments.vue`
- `app/pages/embed/experiments-summary.vue`

```ts
const payuExperiments = ref<PayuExperiment[]>([]);
const payuLoading = ref(true);
const payuError = ref<string | null>(null);

onMounted(async () => {
  try {
    payuExperiments.value = await loadPayuExperiments(
      config.public.payuCmip7ApiUrl as string,
    );
  } catch (err) {
    payuError.value =
      err instanceof Error ? err.message : "Failed to load experiments.";
  } finally {
    payuLoading.value = false;
  }
});
```

New composable:

```ts
export function usePayuExperiments(): {
  experiments: Ref<PayuExperiment[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
}
```

- Reads `useRuntimeConfig().public.payuCmip7ApiUrl` itself (all three call
  sites use the same key) and registers the same `onMounted` loader.
- Identical initial values (`[]`, `true`, `null`) and identical error message
  fallback string.
- Call sites replace their local refs with the composable's returns. In
  `index.vue`, note the `watch(payuExperiments, () => refresh())` scroll-spy
  hook — rewire it to the composable's `experiments` ref; it must still fire
  when the data lands.
- Client-side loading semantics must not change: the fetch stays inside
  `onMounted` (do not convert to `useAsyncData` — that would move work to SSR
  and change behaviour).

## 2. `app/composables/useIframeEmbedHeight.ts`

Current duplication — `app/pages/embed/blog/[...slug].vue` and
`app/pages/embed/experiments.vue` both do:

```ts
const mainRef = ref<HTMLElement | null>(null);

function notifyHeight() {
  if (mainRef.value) {
    window.parent.postMessage({ height: mainRef.value.scrollHeight }, "*");
  }
}

onMounted(async () => {
  // (experiments.vue: after its data fetch) …
  await nextTick();
  notifyHeight();
  if (mainRef.value) {
    const observer = new ResizeObserver(() => notifyHeight());
    observer.observe(mainRef.value);
  }
});
```

New composable, shaped so both call sites keep their exact timing:

```ts
/** Returns the element ref to bind and a start() that begins reporting. */
export function useIframeEmbedHeight(): {
  elementRef: Ref<HTMLElement | null>;
  start: () => Promise<void>; // awaits nextTick, notifies once, attaches observer
}
```

- Do **not** register `onMounted` inside the composable: in
  `embed/experiments.vue` the first notify happens only *after* the data fetch
  completes, and that ordering must be preserved. Each page calls
  `await start()` at the same point in its own `onMounted` where the inline
  code ran.
- Preserve current behaviour exactly, including the quirks: the target origin
  stays `"*"` and the observer is deliberately never disconnected (embed pages
  live for the iframe's lifetime). Say both things in the docstring so nobody
  "fixes" them casually.
- Template bindings `ref="mainRef"` change to the composable's ref (the
  variable name at the call site may stay `mainRef` via destructure-rename to
  minimise the diff).

## 3. `app/composables/useExperimentExplainers.ts`

Move from `app/pages/index.vue`: the `useAsyncData("experiment-explainers", …)`
query and the `postByExperiment` computed that maps posts by their
`experiment` frontmatter name. Return `{ postByExperiment }` (the computed).
Keep the same `useAsyncData` key (`"experiment-explainers"`) so caching
behaviour is unchanged. The page keeps passing `postByExperiment` down as
props exactly as today.

Note: the page uses top-level `await useAsyncData(...)`. Keep the composable
async-friendly the same way the page consumes it today (either the composable
returns the already-awaited data via `await` at its call site, or it wraps the
await internally — whichever keeps `index.vue`'s `<script setup>` top-level
await semantics identical; the simplest is an async composable the page
`await`s).

## 4. `app/composables/useBlogPosts.ts`

Move from `app/components/BlogItems.vue`: the local `BlogPage` type, the
`useAsyncData("blog-posts", …)` query with its `/blog/` path filter,
date-descending sort, and field normalisation (`href`/`title`/`description`/
`date`/`author` with the `meta.*` fallbacks). Return the posts ref.
`BlogItems.vue` keeps its template and its `formatPostDate` helper (that helper
is subplan 03's business — leave it alone here) and becomes mostly template.
Keep the `"blog-posts"` key.

## Tests

- Existing specs are untouched and must pass unchanged (`DashboardHero`,
  `PayuExperimentAccordion`, the embed blog spec, etc. mount components, not
  pages, so they are unaffected; `app/pages/embed/blog/__tests__/slug.spec.ts`
  exercises the embed page — it must pass as-is).
- Add small new specs where cheap wins exist:
  `app/composables/__tests__/useIframeEmbedHeight.spec.ts` (postMessage fired
  with `scrollHeight` after `start()`; the global `ResizeObserver` mock in
  `app/test/setup.ts` already exists) and
  `app/composables/__tests__/useBlogPosts.spec.ts` if mocking
  `queryCollection` is straightforward in this repo's Nuxt test environment
  (see how existing composable specs mock; if it is not straightforward, skip
  it and say so in the PR rather than building a mock rig).

## Docstrings

Each new composable gets the standard header from `00-overview.md`, including
`Used by:` lines naming the exact pages/components above.

## Verify

Full protocol from `00-overview.md`. Pay particular attention in the dev smoke
test to: dashboard loads with data; `/embed/experiments` resizes its iframe
host (check the console for errors at least); blog list renders and is date-
sorted newest-first.
