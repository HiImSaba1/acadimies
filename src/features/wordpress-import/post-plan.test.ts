import { describe, expect, it } from "vitest";
import { inspectWordPressExport } from "./inspect";
import { createWordPressPostPlan, legacyArticleDocument, legacyPlainText } from "./post-plan";

const xml = `<?xml version="1.0"?><rss><channel><wp:base_site_url>https://acadimies.gr</wp:base_site_url>
<item><title>Ακαδημία νέων</title><link>https://acadimies.gr/story</link><wp:post_id>12</wp:post_id><wp:post_type>post</wp:post_type><wp:status>publish</wp:status><content:encoded><![CDATA[<h2>Αρχή</h2><p>Κείμενο <strong>πλούσιο</strong>.</p><figure><img src="https://acadimies.gr/wp-content/uploads/2020/01/team.jpg"><figcaption>Η ομάδα μετά τον αγώνα.</figcaption></figure>]]></content:encoded><wp:postmeta><wp:meta_key>_thumbnail_id</wp:meta_key><wp:meta_value>42</wp:meta_value></wp:postmeta></item>
<item><title>Casino bonus</title><link>https://acadimies.gr/spam</link><wp:post_id>13</wp:post_id><wp:post_type>post</wp:post_type><wp:status>trash</wp:status></item>
<item><title>Team</title><link>https://acadimies.gr/wp-content/uploads/2020/01/team.jpg</link><wp:post_id>42</wp:post_id><wp:post_type>attachment</wp:post_type><wp:status>inherit</wp:status><wp:attachment_url>https://acadimies.gr/wp-content/uploads/2020/01/team.jpg</wp:attachment_url></item>
</channel></rss>`;

describe("WordPress post plan", () => {
  it("counts original publication state but never assigns published status", () => {
    const plan = createWordPressPostPlan(inspectWordPressExport(xml));
    expect(plan.counts).toMatchObject({ articlesAndPages: 2, eligibleForReview: 1, quarantined: 1,
      publishedOriginally: 1, trashedOriginally: 1, withFeaturedReference: 1 });
    expect(plan.candidates[0]?.featuredMediaExternalId).toBe("42");
    expect(plan.candidates[0]?.mediaCaptions).toEqual({ "42": "Η ομάδα μετά τον αγώνα." });
    expect(plan.candidates[0]?.slug).toBe("akadimia-neon");
  });
  it("creates a bounded, editable plain-text draft while keeping legacy HTML separately", () => {
    const candidate = createWordPressPostPlan(inspectWordPressExport(xml)).candidates[0]!;
    const doc = legacyArticleDocument(candidate);
    expect(doc.blocks).toHaveLength(2);
    expect(doc.blocks.map((block) => block.type)).toEqual(["heading", "paragraph"]);
    expect(JSON.stringify(doc)).not.toContain("<strong>");
    expect(candidate.sanitizedHtml).toContain("<strong>");
    expect(legacyPlainText("<p>One</p><p>Two</p>")).toBe("One\nTwo");
  });
});
