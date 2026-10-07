import type {
  TelemetryEvent,
  TelemetryProperties,
} from "~/services/telemetryEvents";

/**
 * useTelemetry — the single entry point for PostHog capture calls.
 *
 * Every component/composable that wants to record an interaction goes through
 * `capture()` here rather than importing posthog-js (or @posthog/nuxt)
 * directly, so there is exactly one place that knows about PostHog's API.
 * `capture()` is a safe no-op — it does nothing and never throws — when no
 * PostHog key is configured (local dev, PR previews without the secret,
 * tests) or when the client isn't available (SSR/prerender), so analytics can
 * never affect dashboard rendering or navigation.
 *
 * Used by: app/composables/useRoutePageviews.ts
 */
export function useTelemetry() {
  function capture<E extends TelemetryEvent>(
    event: E,
    properties?: TelemetryProperties[E],
  ) {
    try {
      const config = useRuntimeConfig();
      if (!config.public.posthog?.publicKey) return;

      usePostHog()?.capture(event, properties);
    } catch {
      // Analytics must never break the dashboard — swallow and move on.
    }
  }

  return { capture };
}
