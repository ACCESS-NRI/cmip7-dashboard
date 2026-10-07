// @vitest-environment nuxt
import { describe, expect, it, vi } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { useRoutePageviews } from "../useRoutePageviews";

const capture = vi.hoisted(() => vi.fn());
mockNuxtImport("useTelemetry", () => () => ({ capture }));

const afterEachCallbacks = vi.hoisted(
  () => [] as ((to: { fullPath: string }) => void)[],
);
mockNuxtImport("useRouter", () => () => ({
  afterEach: (cb: (to: { fullPath: string }) => void) => {
    afterEachCallbacks.push(cb);
  },
}));

describe("useRoutePageviews", () => {
  it("captures a pageview with the new path on route change", () => {
    useRoutePageviews().start();

    afterEachCallbacks[0]({ fullPath: "/glossary" });

    expect(capture).toHaveBeenCalledWith("$pageview", { path: "/glossary" });
  });
});
