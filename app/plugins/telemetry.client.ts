// Wires up PostHog SPA pageview capture on app start (client-only: there is
// no router navigation to observe during prerender/SSR).
export default defineNuxtPlugin(() => {
  useRoutePageviews().start();
});
