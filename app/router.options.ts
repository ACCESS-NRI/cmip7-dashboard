import { createWebHashHistory, createWebHistory } from "vue-router";
import type { RouterConfig } from "@nuxt/schema";

// TEMP (branch previews): use a hash router only for /branches/<name>/ deploys,
// so GitHub Pages never has to SPA-fallback to main's root 404.html. Main, prod
// and local dev keep history mode. Delete this file to fully revert.
export default <RouterConfig>{
  history: (base) =>
    base?.includes("/branches/")
      ? createWebHashHistory(base)
      : createWebHistory(base),
};
