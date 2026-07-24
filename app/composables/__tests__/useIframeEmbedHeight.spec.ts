import { afterEach, describe, expect, it, vi } from "vitest";
import { useIframeEmbedHeight } from "../useIframeEmbedHeight";

// Give an element a fixed scrollHeight; happy-dom reports 0 for detached nodes.
function elementWithScrollHeight(height: number): HTMLElement {
  const el = document.createElement("div");
  Object.defineProperty(el, "scrollHeight", {
    value: height,
    configurable: true,
  });
  return el;
}

describe("useIframeEmbedHeight", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the bound element's scrollHeight to the parent frame after start()", async () => {
    const postMessage = vi
      .spyOn(window.parent, "postMessage")
      .mockImplementation(() => {});

    const { elementRef, start } = useIframeEmbedHeight();
    elementRef.value = elementWithScrollHeight(321);

    await start();

    expect(postMessage).toHaveBeenCalledWith({ height: 321 }, "*");
  });

  it("does not post when no element is bound", async () => {
    const postMessage = vi
      .spyOn(window.parent, "postMessage")
      .mockImplementation(() => {});

    const { start } = useIframeEmbedHeight();

    await start();

    expect(postMessage).not.toHaveBeenCalled();
  });
});
