import { describe, expect, it } from "vitest";
import { closestCardEdge, hiddenClipByEdge } from "./motion";

describe("direction-aware editorial cards", () => {
  const card = { left: 100, top: 100, width: 400, height: 300 };

  it("selects the nearest physical entry edge", () => {
    expect(closestCardEdge({ ...card, clientX: 105, clientY: 250 })).toBe("left");
    expect(closestCardEdge({ ...card, clientX: 300, clientY: 395 })).toBe("bottom");
    expect(closestCardEdge({ ...card, clientX: 495, clientY: 250 })).toBe("right");
    expect(closestCardEdge({ ...card, clientX: 300, clientY: 105 })).toBe("top");
  });

  it("defines a closed clip state for every edge", () => {
    expect(Object.keys(hiddenClipByEdge).sort()).toEqual(["bottom", "left", "right", "top"]);
  });
});
