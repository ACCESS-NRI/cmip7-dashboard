/**
 * telemetryEvents — the CMIP7 dashboard's PostHog event taxonomy.
 *
 * Centralises every event name and its allowed property shape so a component
 * can never emit an arbitrary event or a free-form property bag. Add an event
 * here — with sign-off per the privacy constraints in issue #87 — before
 * instrumenting a new interaction. No user identity, credentials, secrets, or
 * free-form text goes in any payload.
 *
 * Used by: app/composables/useTelemetry.ts, app/composables/useRoutePageviews.ts
 */
export const TELEMETRY_EVENTS = {
  pageview: "$pageview",
} as const;

export type TelemetryEvent =
  (typeof TELEMETRY_EVENTS)[keyof typeof TELEMETRY_EVENTS];

export interface TelemetryProperties {
  [TELEMETRY_EVENTS.pageview]: { path: string };
}
