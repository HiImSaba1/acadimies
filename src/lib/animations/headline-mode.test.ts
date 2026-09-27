import { describe, expect, it } from "vitest";
import { headlineMotion, headlineSplitMode } from "./headline-mode";

describe("headline SplitText mode", () => {
  it("uses characters only for one or two words", () => {
    expect(headlineSplitMode("Ακαδημίες")).toBe("chars");
    expect(headlineSplitMode("Νέα ακαδημιών")).toBe("chars");
    expect(headlineSplitMode("Παιδί και ψυχολογία")).toBe("words");
  });

  it("keeps both modes fast and makes character staggering tighter", () => {
    expect(headlineMotion("chars").duration).toBeLessThan(1);
    expect(headlineMotion("words").duration).toBeLessThan(1);
    expect(headlineMotion("chars").stagger).toBeLessThan(headlineMotion("words").stagger);
  });
});
