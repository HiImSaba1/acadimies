import { getTableConfig } from "drizzle-orm/mysql-core";
import { describe, expect, it } from "vitest";
import {
  articleTemplateKeys,
  auditEvents,
  categories,
  headerTemplateKeys,
  legacyImportBatches,
  legacyImportRecords,
  mediaAssets,
  newsletterCampaigns,
  newsletterConsentEvents,
  newsletterOutbox,
  newsletterSubscribers,
  postCategories,
  postDailyViews,
  postRevisions,
  posts,
  postTags,
  tags,
  users,
} from ".";

describe("editorial schema contract", () => {
  it("keeps stable template keys for database persistence", () => {
    expect(headerTemplateKeys).toEqual([
      "minimal_editorial",
      "classic_broadsheet",
      "neon_sports",
      "split_ticker",
      "mega_menu_grid",
    ]);
    expect(articleTemplateKeys).toEqual([
      "longform",
      "matchday",
      "gallery",
      "interview",
      "cinematic",
      "chess",
      "sidebar",
    ]);
  });

  it("persists immutable administrative audit events", () => {
    expect(getTableConfig(auditEvents).name).toBe("audit_events");
    expect(getTableConfig(auditEvents).columns.map((column) => column.name)).toEqual(
      expect.arrayContaining(["actor_id", "action", "entity_type", "entity_id", "metadata"]),
    );
  });

  it("separates login usernames from optional recovery email addresses", () => {
    const config = getTableConfig(users);
    const columns = config.columns.map((column) => column.name);
    expect(columns).toEqual(expect.arrayContaining(["username", "email", "password_hash"]));
    expect(config.indexes.map((index) => index.config.name)).toEqual(
      expect.arrayContaining(["users_username_unique", "users_email_unique"]),
    );
  });

  it("defines every Sprint 02 table with an explicit stable name", () => {
    const tableNames = [
      users,
      categories,
      posts,
      postCategories,
      tags,
      postTags,
      postRevisions,
      mediaAssets,
      legacyImportBatches,
      legacyImportRecords,
    ].map((table) => getTableConfig(table).name);

    expect(tableNames).toEqual([
      "users",
      "categories",
      "posts",
      "post_categories",
      "tags",
      "post_tags",
      "post_revisions",
      "media_assets",
      "legacy_import_batches",
      "legacy_import_records",
    ]);
    expect(new Set(tableNames).size).toBe(tableNames.length);
  });

  it("stores both article images and native SEO fields in posts", () => {
    const columns = getTableConfig(posts).columns.map((column) => column.name);
    expect(columns).toEqual(expect.arrayContaining([
      "featured_media_id", "secondary_media_id", "seo_title", "seo_description",
    ]));
  });

  it("stores readership only as anonymous daily post totals", () => {
    const config = getTableConfig(postDailyViews);
    expect(config.name).toBe("post_daily_views");
    expect(config.columns.map((column) => column.name)).toEqual(["post_id", "view_date", "views", "updated_at"]);
  });

  it("separates newsletter consent, campaign drafts, and delivery outbox", () => {
    expect([newsletterSubscribers, newsletterConsentEvents, newsletterCampaigns, newsletterOutbox].map((table) => getTableConfig(table).name)).toEqual([
      "newsletter_subscribers", "newsletter_consent_events", "newsletter_campaigns", "newsletter_outbox",
    ]);
    expect(getTableConfig(newsletterSubscribers).indexes.map((index) => index.config.name)).toEqual(expect.arrayContaining(["newsletter_subscribers_email_unique", "newsletter_subscribers_confirmation_unique", "newsletter_subscribers_unsubscribe_unique"]));
    expect(getTableConfig(newsletterOutbox).indexes.map((index) => index.config.name)).toContain("newsletter_outbox_dedupe_unique");
  });
});
