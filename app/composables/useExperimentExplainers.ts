import { computed, type ComputedRef } from "vue";
import type { ContentCollectionItem } from "@nuxt/content";

/**
 * useExperimentExplainers — map explainer posts to the experiments they describe.
 *
 * Explainer posts carry an `experiment` name in their frontmatter. This queries
 * every such post and indexes them by that name, so grouped experiment rows can
 * open the matching explainer. Async because it awaits the underlying
 * `useAsyncData` load; the caller `await`s it at the top level of its
 * `<script setup>`, preserving the page's existing await semantics. The
 * `"experiment-explainers"` key is shared with the page's previous inline query
 * so caching behaviour is unchanged.
 *
 * Used by: app/pages/index.vue
 */
export async function useExperimentExplainers(): Promise<{
  postByExperiment: ComputedRef<Record<string, ContentCollectionItem>>;
}> {
  const { data: explainers } = await useAsyncData("experiment-explainers", () =>
    queryCollection("content").where("experiment", "IS NOT NULL").all(),
  );

  const postByExperiment = computed<Record<string, ContentCollectionItem>>(
    () => {
      const map: Record<string, ContentCollectionItem> = {};
      for (const post of explainers.value ?? []) {
        if (post.experiment) map[post.experiment] = post;
      }
      return map;
    },
  );

  return { postByExperiment };
}
