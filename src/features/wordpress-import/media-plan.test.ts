import { describe, expect, it } from "vitest";
import { inspectWordPressExport } from "./inspect";
import { createWordPressMediaPlan, safeWordPressImageUrl } from "./media-plan";
import { wordpressMediaStorage } from "./media-storage";

const xml = `<?xml version="1.0"?><rss><channel><wp:base_site_url>https://acadimies.gr</wp:base_site_url>
<item><title>Portrait</title><link>https://acadimies.gr/image</link><wp:post_id>42</wp:post_id><wp:post_parent>12</wp:post_parent><wp:post_type>attachment</wp:post_type><wp:status>inherit</wp:status><wp:attachment_url>https://acadimies.gr/wp-content/uploads/2020/01/portrait.jpg</wp:attachment_url></item>
<item><title>Unsafe</title><link>https://acadimies.gr/image2</link><wp:post_id>43</wp:post_id><wp:post_type>attachment</wp:post_type><wp:status>inherit</wp:status><wp:attachment_url>https://elsewhere.test/a.jpg</wp:attachment_url></item>
<item><title>Story</title><link>https://acadimies.gr/story</link><wp:post_id>12</wp:post_id><wp:post_type>post</wp:post_type><wp:status>publish</wp:status><wp:postmeta><wp:meta_key>_thumbnail_id</wp:meta_key><wp:meta_value>42</wp:meta_value></wp:postmeta></item>
</channel></rss>`;

describe("WordPress media plan", () => {
  it("keeps parent and featured image associations for later promotion", () => {
    const items = inspectWordPressExport(xml).items;
    expect(items[0]?.parentExternalId).toBe("12");
    expect(items[2]?.featuredMediaExternalId).toBe("42");
  });
  it("accounts for every attachment without trusting foreign URLs", () => {
    const plan = createWordPressMediaPlan(inspectWordPressExport(xml));
    expect(plan.counts).toEqual({ attachments: 2, eligible: 1, quarantined: 0, excluded: 0, missingUrl: 0, unsafeUrl: 1 });
    expect(plan.candidates.map((item) => item.externalId)).toEqual(["42"]);
  });
  it("rejects redirects, credentials and non-image paths up front", () => {
    expect(safeWordPressImageUrl("https://acadimies.gr.evil.test/wp-content/uploads/a.jpg")).toBeNull();
    expect(safeWordPressImageUrl("https://acadimies.gr/wp-content/uploads/a.svg")).toBeNull();
    expect(safeWordPressImageUrl("https://acadimies.gr/wp-content/uploads/a.jpg?x=1")).toBeNull();
    expect(safeWordPressImageUrl("http://acadimies.gr/wp-content/uploads/a.jpg"))
      .toBe("https://acadimies.gr/wp-content/uploads/a.jpg");
  });
  it("normalizes trusted legacy URLs with encoded or Greek filenames", () => {
    expect(safeWordPressImageUrl("http://www.acadimies.gr/wp-content/uploads/2017/05/%CE%BD%CE%AD%CE%B1%20%CE%B5%CE%B9%CE%BA%CF%8C%CE%BD%CE%B1-(1).jpg"))
      .toBe("https://acadimies.gr/wp-content/uploads/2017/05/%CE%BD%CE%AD%CE%B1%20%CE%B5%CE%B9%CE%BA%CF%8C%CE%BD%CE%B1-(1).jpg");
    expect(safeWordPressImageUrl("https://acadimies.gr/wp-content/uploads/2017/05/../secret.jpg")).toBeNull();
  });
  it("builds chronological, collision-safe public storage keys", () => {
    expect(wordpressMediaStorage({ externalId: "42", url: "https://acadimies.gr/wp-content/uploads/2020/01/portrait.jpg" }))
      .toEqual({ year: "2020", month: "01", storageKey: "images/2020/01/42.webp", publicUrl: "/images/2020/01/42.webp" });
  });
});
