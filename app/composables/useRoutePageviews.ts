/**
 * useRoutePageviews — captures a PostHog pageview on every client-side route
 * change.
 *
 * @posthog/nuxt's init runs with `capture_pageview: false` (see
 * nuxt.config.ts) because this is a statically-generated SPA: only the first
 * visit is an actual page load, every navigation after that is a vue-router
 * change PostHog's autocapture never sees. This is the one place that turns
 * router navigations into pageview events, via useTelemetry() rather than
 * talking to PostHog directly.
 *
 * Used by: app/plugins/telemetry.client.ts
 */
import { TELEMETRY_EVENTS } from "~/services/telemetryEvents";

export function useRoutePageviews() {
  const { capture } = useTelemetry();
  const router = useRouter();

  function start() {
    router.afterEach((to) => {
      capture(TELEMETRY_EVENTS.pageview, { path: to.fullPath });
    });
  }

  return { start };
}
