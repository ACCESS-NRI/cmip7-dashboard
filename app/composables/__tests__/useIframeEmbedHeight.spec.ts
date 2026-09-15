import { afterEach, describe, expect, it, vi } from "vitest";
import { useIframeEmbedHeight } from "../useIframeEmbedHeight";

// Give an element a fixed document-space bottom edge; happy-dom returns an
// all-zero rect for detached nodes, so stub the one field notifyHeight reads.
function elementWithBottom(bottom: number): HTMLElement {
  const el = document.createElement("div");
  el.getBoundingClientRect = () =>
    ({
      bottom,
      top: 0,
      left: 0,
      right: 0,
      width: 0,
      height: bottom,
    }) as DOMRect;
  return el;
}

describe("useIframeEmbedHeight", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the bound element's document-space height to the parent frame after start()", async () => {
    const postMessage = vi
      .spyOn(window.parent, "postMessage")
      .mockImplementation(() => {});

    const { elementRef, start } = useIframeEmbedHeight();
    elementRef.value = elementWithBottom(321);

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
