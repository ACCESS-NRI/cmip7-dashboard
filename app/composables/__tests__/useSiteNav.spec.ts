// @vitest-environment nuxt
import type { NavigationMenuItem } from "@nuxt/ui";
import { describe, expect, it, vi } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { useSiteNav } from "../useSiteNav";

const currentPath = vi.hoisted(() => ({ value: "/" }));

mockNuxtImport("useRoute", () => () => ({ path: currentPath.value }));

function navItemsFor(path: string): NavigationMenuItem[] {
  currentPath.value = path;
  return useSiteNav().items.value;
}

function itemByLabel(
  items: NavigationMenuItem[],
  label: string,
): NavigationMenuItem {
  const item = items.find((i) => i.label === label);
  expect(item, `nav item "${label}"`).toBeTruthy();
  return item!;
}

describe("useSiteNav", () => {
  it("marks Dashboard as an exact-match link", () => {
    const dashboard = itemByLabel(navItemsFor("/"), "Dashboard");
    expect(dashboard.to).toBe("/");
    expect(dashboard.exact).toBe(true);
  });

  it("marks Glossary active on nested glossary paths", () => {
    const glossary = itemByLabel(navItemsFor("/glossary#deck"), "Glossary");
    expect(glossary.to).toBe("/glossary");
    expect(glossary.active).toBe(true);
  });

  // Blog nav item is currently commented out in useSiteNav. Assert the expected
  // items are present and Blog is not, so this catches an accidental
  // reintroduction (and flags us to restore the active-state tests) either way.
  it("exposes Dashboard and Glossary but not Blog", () => {
    const labels = navItemsFor("/").map((i) => i.label);
    expect(labels).toContain("Dashboard");
    expect(labels).toContain("Glossary");
    expect(labels).not.toContain("Blog");
  });
});
