// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { useTelemetry } from "../useTelemetry";

const posthogClient = vi.hoisted(() => ({
  value: { capture: vi.fn() } as
    { capture: ReturnType<typeof vi.fn> } | undefined,
}));
const publicKey = vi.hoisted(() => ({ value: "test-key" }));

mockNuxtImport("usePostHog", () => () => posthogClient.value);
mockNuxtImport("useRuntimeConfig", () => () => ({
  public: { posthog: { publicKey: publicKey.value } },
}));

describe("useTelemetry", () => {
  afterEach(() => {
    posthogClient.value = { capture: vi.fn() };
    publicKey.value = "test-key";
  });

  it("forwards capture calls to PostHog when a key is configured", () => {
    useTelemetry().capture("$pageview", { path: "/" });
    expect(posthogClient.value!.capture).toHaveBeenCalledWith("$pageview", {
      path: "/",
    });
  });

  it("is a no-op when no PostHog key is configured", () => {
    publicKey.value = "";
    useTelemetry().capture("$pageview", { path: "/" });
    expect(posthogClient.value!.capture).not.toHaveBeenCalled();
  });

  it("never throws when the PostHog client is unavailable", () => {
    posthogClient.value = undefined;
    expect(() =>
      useTelemetry().capture("$pageview", { path: "/" }),
    ).not.toThrow();
  });
});
