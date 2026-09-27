import { describe, expect, it } from "vitest";
import { inspectWordPressExport } from "./inspect";
import { createWordPressEditorialAudit } from "./editorial-audit";

const xml = `<rss><channel><title>Ακαδημίες</title><wp:base_site_url>https://acadimies.gr</wp:base_site_url>
<item><title>Προπόνηση παιδιών</title><link>https://acadimies.gr/post/</link><content:encoded><![CDATA[<p>Ασφαλές κείμενο</p>]]></content:encoded>
<wp:post_id>10</wp:post_id><wp:status>publish</wp:status><wp:post_type>post</wp:post_type><wp:post_date_gmt>2019-04-01 12:00:00</wp:post_date_gmt>
<wp:postmeta><wp:meta_key>_thumbnail_id</wp:meta_key><wp:meta_value>11</wp:meta_value></wp:postmeta><category domain="category" nicename="coaches">Προπονητές</category></item>
<item><title>Φωτογραφία</title><link>https://acadimies.gr/media/</link><wp:post_id>11</wp:post_id><wp:status>inherit</wp:status><wp:post_type>attachment</wp:post_type><wp:attachment_url>https://acadimies.gr/wp-content/uploads/photo.jpg</wp:attachment_url></item>
</channel></rss>`;

describe("WordPress editorial audit", () => {
  it("reconciles posts, media, years and featured-image relationships without returning content bodies", () => {
    const audit = createWordPressEditorialAudit(inspectWordPressExport(xml));
    expect(audit.reconciliation).toMatchObject({ totalItems: 2, postAndPageItems: 1, attachmentItems: 1, otherItems: 0 });
    expect(audit.imageReferences.featuredResolved).toBe(1);
    expect(audit.years).toContainEqual(["2019", 1]);
    expect(audit.categories).toContainEqual(["coaches", 1]);
    expect(audit.samples[0]?.id).toBe("10");
    expect(JSON.stringify(audit)).not.toContain("Ασφαλές κείμενο");
    expect(audit.databaseWrites).toBe(false);
  });

  it("bounds sample size", () => {
    expect(() => createWordPressEditorialAudit(inspectWordPressExport(xml), 51)).toThrow(/Sample limit/);
  });
});
