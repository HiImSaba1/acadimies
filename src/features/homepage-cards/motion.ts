export type CardEntryEdge = "top" | "right" | "bottom" | "left";

export function closestCardEdge(input: {
  clientX: number;
  clientY: number;
  left: number;
  top: number;
  width: number;
  height: number;
}): CardEntryEdge {
  const distances = {
    top: Math.abs(input.clientY - input.top),
    right: Math.abs(input.left + input.width - input.clientX),
    bottom: Math.abs(input.top + input.height - input.clientY),
    left: Math.abs(input.clientX - input.left),
  };
  return (Object.entries(distances) as [CardEntryEdge, number][])
    .sort((a, b) => a[1] - b[1])[0][0];
}

export const hiddenClipByEdge: Record<CardEntryEdge, string> = {
  top: "inset(0 0 100% 0)",
  right: "inset(0 0 0 100%)",
  bottom: "inset(100% 0 0 0)",
  left: "inset(0 100% 0 0)",
};
