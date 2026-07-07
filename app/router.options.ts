import {
  createMemoryHistory,
  createWebHashHistory,
  createWebHistory,
} from "vue-router";
import type { RouterConfig } from "@nuxt/schema";

// TEMP (branch previews): use a hash router only for /branches/<name>/ deploys,
// so GitHub Pages never has to SPA-fallback to main's root 404.html. Main, prod
// and local dev keep history mode. Delete this file to fully revert.
export default <RouterConfig>{
  history: (base) => {
    // On the server (SSR/prerender of main) there is no `window`; createWebHistory
    // and createWebHashHistory both touch it, so use in-memory history there.
    // This mirrors Nuxt's default router.options, which the client branches below
    // otherwise replace. Branch previews are SPA-only, so this only runs on the client.
    if (import.meta.server) return createMemoryHistory(base);
    return base?.includes("/branches/")
      ? createWebHashHistory(base)
      : createWebHistory(base);
  },
};
