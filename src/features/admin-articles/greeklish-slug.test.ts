import { describe, expect, it } from "vitest";
import { suggestGreeklishSlug } from "./greeklish-slug";

describe("Greeklish title slugs", () => {
  it("transliterates Greek accents and mixed-language titles deterministically", () => {
    expect(suggestGreeklishSlug("Ακαδημίες και Παιδιά: Νέα εποχή!"))
      .toBe("akadimies-kai-paidia-nea-epochi");
    expect(suggestGreeklishSlug("Football στην Ελλάδα"))
      .toBe("football-stin-ellada");
  });

  it("always returns a valid bounded slug", () => {
    expect(suggestGreeklishSlug("!!!")).toBe("arthro");
    expect(suggestGreeklishSlug("Α".repeat(500))).toHaveLength(191);
  });
});
