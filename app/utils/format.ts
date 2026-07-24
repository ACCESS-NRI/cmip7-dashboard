/**
 * format — small, locale-aware presentation helpers.
 *
 * Pure functions only, no Vue imports. Auto-imported by Nuxt from app/utils/,
 * so components call these without an import line. Deliberately narrow: number
 * and date formatting that would otherwise be re-declared per component. Note
 * that ExperimentSummaryCards keeps its own fractional formatter
 * (`toLocaleString(undefined, { maximumFractionDigits: 2 })`) — it is not the
 * same function as formatNumber here and must not be folded in.
 *
 * Used by: app/components/ExperimentProgrammeGroups.vue,
 * app/components/ExperimentTotals.vue, app/components/RunProgressBar.vue,
 * app/components/BlogArticle.vue, app/components/BlogItems.vue
 */

/** Locale-aware integer formatting, e.g. 1720 -> "1,720". */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Blog byline date in en-AU long form, e.g. "24 July 2026".
 * `fallback` is what a missing/empty date renders as: BlogArticle shows
 * nothing (""), the blog index shows "Draft".
 */
export function formatPostDate(value?: string, fallback = ""): string {
  if (!value) return fallback;
  return new Date(value).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
