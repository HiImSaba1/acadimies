import { describe, expect, it } from "vitest";
import { createWordPressStagePlan, shouldRefreshStagedRecord } from "./stage";
import { inspectWordPressExport } from "./inspect";

const fixture = `<?xml version="1.0"?><rss><channel>
<wp:base_site_url>https://acadimies.gr</wp:base_site_url>
<item><title>Καθαρό άρθρο</title><link>https://acadimies.gr/article</link><content:encoded><![CDATA[<p>Text</p>]]></content:encoded><wp:post_id>10</wp:post_id><wp:status>publish</wp:status><wp:post_type>post</wp:post_type><category domain="category" nicename="news">Νέα</category></item>
<item><title>Σελίδα</title><link>https://acadimies.gr/about</link><wp:post_id>11</wp:post_id><wp:status>publish</wp:status><wp:post_type>page</wp:post_type></item>
<item><title>Εικόνα</title><link>https://acadimies.gr/image</link><wp:post_id>12</wp:post_id><wp:status>inherit</wp:status><wp:post_type>attachment</wp:post_type><wp:attachment_url>https://acadimies.gr/uploads/image.webp</wp:attachment_url></item>
<item><title>Casino bonus</title><link>https://foreign.example/spam</link><wp:post_id>13</wp:post_id><wp:status>trash</wp:status><wp:post_type>post</wp:post_type></item>
<item><title>Menu</title><link>https://acadimies.gr/menu</link><wp:post_id>14</wp:post_id><wp:status>publish</wp:status><wp:post_type>nav_menu_item</wp:post_type></item>
</channel></rss>`;

describe("WordPress staging plan", () => {
  const plan = createWordPressStagePlan(inspectWordPressExport(fixture));

  it("reconciles every legacy item without publishing one", () => {
    expect(plan.items).toBe(5);
    expect(plan.states).toEqual({ staged: 3, quarantined: 1, excluded: 1 });
    expect(plan.records.map((record) => record.state)).toEqual([
      "staged", "staged", "staged", "quarantined", "excluded",
    ]);
  });

  it("keeps post taxonomy and attachment references in the staging payload", () => {
    expect(plan.records[0].payload.categories).toEqual([{ domain: "category", slug: "news", name: "Νέα" }]);
    expect(plan.records[2].payload.attachmentUrl).toBe("https://acadimies.gr/uploads/image.webp");
  });

  it("preserves quarantined and non-public legacy records for review", () => {
    expect(plan.records[3].state).toBe("quarantined");
    expect(plan.records[3].riskFlags).toContain("suspected-spam");
    expect(plan.records[4].state).toBe("excluded");
  });

  it("does not overwrite approved, promoted or excluded reviewer decisions", () => {
    for (const state of ["approved", "promoted", "excluded"] as const) {
      expect(shouldRefreshStagedRecord(state, "old", "new")).toBe(false);
    }
    expect(shouldRefreshStagedRecord("staged", "old", "old")).toBe(false);
    expect(shouldRefreshStagedRecord("staged", "old", "new")).toBe(true);
  });

  it("rejects duplicate source identifiers before any database write", () => {
    const inspection = inspectWordPressExport(fixture);
    inspection.items.push(inspection.items[0]);
    expect(() => createWordPressStagePlan(inspection)).toThrow(/Duplicate legacy identifier/);
  });
});
