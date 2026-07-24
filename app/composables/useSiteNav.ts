import type { NavigationMenuItem } from "@nuxt/ui";

/**
 * useSiteNav — the site-wide primary navigation items.
 *
 * Site-wide primary navigation, rendered in the AppSidebar footer. Kept in a
 * composable so the nav definition has a single home (and is easy to unit-test);
 * marks the active tab from the current route.
 *
 * Used by: app/components/AppSidebar.vue
 */
export function useSiteNav() {
  const route = useRoute();

  const items = computed<NavigationMenuItem[]>(() => [
    { label: "Dashboard", to: "/", exact: true },
    // startsWith so the tab stays active on nested entries (/blog/:slug),
    // which are separate route records from /blog and wouldn't match otherwise.

    // Keep the blog hidden here: still accessible via pages though.
    //{ label: "Blog", to: "/blog", active: route.path.startsWith("/blog") },
    {
      label: "Glossary",
      to: "/glossary",
      active: route.path.startsWith("/glossary"),
    },
  ]);

  return { items };
}
