// @vitest-environment nuxt
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import DummyClimatePlot from "../DummyClimatePlot.client.vue";

// Unlike DummyClimatePlot.spec.ts we deliberately do NOT mock `vue-chartjs`
// here: we want the real Chart.js so the `axisZoom` plugin lifecycle
// (afterInit/afterDestroy) and the window-level pointer handlers actually run.
vi.mock("~/services/dataSource", () => ({
  loadRemoteParquetDataSource: vi.fn().mockResolvedValue({
    columns: ["year", "Model_A", "Model_B"],
    rows: [
      { year: 2027, Model_A: 1.55, Model_B: 1.3 },
      { year: 2028, Model_A: 1.75, Model_B: 1.4 },
      { year: 2029, Model_A: 1.95, Model_B: 1.5 },
    ],
    schema: [
      { name: "year", type: "BIGINT" },
      { name: "Model_A", type: "DOUBLE" },
      { name: "Model_B", type: "DOUBLE" },
    ],
  }),
}));

// The shared test setup stubs `getContext` to return null, which makes Chart.js
// bail out before `afterInit`. Provide a permissive 2d-context stub so the chart
// initialises far enough to register (and later tear down) its listeners.
const realGetContext = HTMLCanvasElement.prototype.getContext;

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    return new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === "canvas") return this;
          if (prop === "measureText") return () => ({ width: 10 });
          if (prop === "createLinearGradient")
            return () => ({ addColorStop() {} });
          if (prop === "createPattern") return () => ({});
          if (prop === "getImageData") return () => ({ data: [] });
          return () => {};
        },
        set: () => true,
      },
    );
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

afterAll(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext;
});

/** Collect the handlers registered on window for a given pointer event type. */
function windowHandlersFor(spy: ReturnType<typeof vi.spyOn>, type: string) {
  return spy.mock.calls
    .filter((call) => call[0] === type)
    .map((call) => call[1]);
}

describe("DummyClimatePlot axis-zoom teardown", () => {
  it("removes the window pointer listeners it added when the chart is destroyed", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const wrapper = await mountSuspended(DummyClimatePlot);
    await vi.waitFor(() => {
      expect(wrapper.find("canvas").exists()).toBe(true);
    });

    // afterInit attaches pan handlers to window.
    const addedMove = windowHandlersFor(addSpy, "pointermove");
    const addedUp = windowHandlersFor(addSpy, "pointerup");
    expect(addedMove.length).toBeGreaterThan(0);
    expect(addedUp.length).toBeGreaterThan(0);

    removeSpy.mockClear();

    // Destroying the chart used to throw because Chart.js nulls `chart.canvas`
    // during destroy; the fix captures the canvas in afterInit so teardown
    // still reaches the window listeners instead of leaking them.
    expect(() => wrapper.unmount()).not.toThrow();

    const removedMove = windowHandlersFor(removeSpy, "pointermove");
    const removedUp = windowHandlersFor(removeSpy, "pointerup");
    // Every handler added to window is removed again (no leak).
    for (const handler of addedMove) expect(removedMove).toContain(handler);
    for (const handler of addedUp) expect(removedUp).toContain(handler);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("pointer handlers no-op safely when no pan is in progress", async () => {
    const wrapper = await mountSuspended(DummyClimatePlot);
    await vi.waitFor(() => {
      expect(wrapper.find("canvas").exists()).toBe(true);
    });

    // A stray pointer move/up with no preceding pointerdown must not throw:
    // handlePointerMove/handlePointerUp look the state up defensively.
    expect(() =>
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 10, clientY: 10 }),
      ),
    ).not.toThrow();
    expect(() =>
      window.dispatchEvent(new PointerEvent("pointerup")),
    ).not.toThrow();

    wrapper.unmount();
  });
});
