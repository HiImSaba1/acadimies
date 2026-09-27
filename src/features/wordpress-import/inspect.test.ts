import { describe, expect, it } from "vitest";
import {
  createSafeInspectionReport,
  inspectWordPressExport,
} from "./inspect";

const fixture = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/">
  <channel>
    <title>Ακαδημίες</title>
    <language>el</language>
    <wp:wxr_version>1.2</wp:wxr_version>
    <wp:base_site_url>https://acadimies.gr</wp:base_site_url>
    <item>
      <title><![CDATA[Ασφαλές άρθρο]]></title>
      <link>https://acadimies.gr/asfales-arthro/</link>
      <dc:creator><![CDATA[editor]]></dc:creator>
      <content:encoded><![CDATA[<p>Κείμενο</p><script>alert(1)</script>]]></content:encoded>
      <wp:post_id>10</wp:post_id>
      <wp:post_name>asfales-arthro</wp:post_name>
      <wp:status>publish</wp:status>
      <wp:post_type>post</wp:post_type>
      <category domain="category" nicename="academies"><![CDATA[Ακαδημίες]]></category>
    </item>
    <item>
      <title>Casino withdrawal bonus</title>
      <link>https://foreign.example/spam</link>
      <content:encoded><![CDATA[<p>Injected post</p>]]></content:encoded>
      <wp:post_id>11</wp:post_id>
      <wp:status>publish</wp:status>
      <wp:post_type>post</wp:post_type>
    </item>
  </channel>
</rss>`;

describe("inspectWordPressExport", () => {
  it("counts content and quarantines risky records without losing them", () => {
    const result = inspectWordPressExport(fixture);

    expect(result.totals).toMatchObject({
      items: 2,
      clean: 0,
      quarantined: 2,
      byPostType: { post: 2 },
      byStatus: { publish: 2 },
    });
    expect(result.items[0]?.sanitizedHtml).toBe("<p>Κείμενο</p>");
    expect(result.items[0]?.riskFlags).toContain("active-content");
    expect(result.items[1]?.riskFlags).toEqual([
      "foreign-canonical",
      "suspected-spam",
    ]);
  });

  it("keeps content bodies out of the safe review report", () => {
    const report = createSafeInspectionReport(inspectWordPressExport(fixture));
    expect(JSON.stringify(report)).not.toContain("Injected post");
    expect(report.quarantine).toHaveLength(2);
  });
});
