import { describe, expect, it } from "vitest";
import { useToggleList } from "../useToggleList";

describe("useToggleList", () => {
  it("starts empty and reports nothing open", () => {
    const { open, isOpen } = useToggleList();
    expect(open.value).toEqual([]);
    expect(isOpen("a")).toBe(false);
  });

  it("toggles an id on and off", () => {
    const { isOpen, toggle } = useToggleList();

    toggle("a");
    expect(isOpen("a")).toBe(true);

    toggle("a");
    expect(isOpen("a")).toBe(false);
  });

  it("tracks several ids independently", () => {
    const { open, isOpen, toggle } = useToggleList();

    toggle("a");
    toggle("b");
    expect(open.value).toEqual(["a", "b"]);

    toggle("a");
    expect(isOpen("a")).toBe(false);
    expect(isOpen("b")).toBe(true);
    expect(open.value).toEqual(["b"]);
  });

  it("replaces the array reference so watchers fire", () => {
    const { open, toggle } = useToggleList();
    const before = open.value;
    toggle("a");
    expect(open.value).not.toBe(before);
  });
});
