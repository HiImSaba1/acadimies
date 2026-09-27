export function afterPageTransition(callback: () => void): () => void {
  let cancelled = false;
  let firstFrame = 0;
  let secondFrame = 0;

  firstFrame = window.requestAnimationFrame(() => {
    secondFrame = window.requestAnimationFrame(async () => {
      const transitions = document.getAnimations().filter((animation) => {
        const pseudoElement = (animation.effect as KeyframeEffect | null)?.pseudoElement ?? "";
        return pseudoElement.includes("::view-transition");
      });
      if (transitions.length) {
        await Promise.allSettled(transitions.map((animation) => animation.finished));
      }
      if (!cancelled) callback();
    });
  });

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(firstFrame);
    window.cancelAnimationFrame(secondFrame);
  };
}
