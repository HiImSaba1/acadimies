import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  date,
  datetime,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const headerTemplateKeys = [
  "minimal_editorial",
  "classic_broadsheet",
  "neon_sports",
  "split_ticker",
  "mega_menu_grid",
] as const;

export const articleTemplateKeys = [
  "longform",
  "matchday",
  "gallery",
  "interview",
  "cinematic",
  "chess",
  "sidebar",
] as const;

export const postStatuses = [
  "draft",
  "review",
  "scheduled",
  "published",
  "archived",
] as const;

export const importStates = [
  "discovered",
  "staged",
  "quarantined",
  "approved",
  "promoted",
  "failed",
  "excluded",
] as const;

export const newsletterSubscriberStatuses = ["pending", "confirmed", "unsubscribed"] as const;
export const newsletterCampaignStatuses = ["draft", "ready", "scheduled", "sending", "sent", "cancelled"] as const;

export const staffRoles = [
  "owner",
  "editor",
  "author",
  "migration_reviewer",
] as const;

export type StaffRole = (typeof staffRoles)[number];

const timestamps = {
  createdAt: datetime("created_at", { mode: "date", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime("updated_at", { mode: "date", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .$onUpdate(() => new Date()),
};

export const users = mysqlTable(
  "users",
  {
    id: char("id", { length: 36 }).primaryKey(),
    username: varchar("username", { length: 191 }).notNull(),
    email: varchar("email", { length: 191 }),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    role: mysqlEnum("role", staffRoles)
      .notNull()
      .default("author"),
    passwordHash: varchar("password_hash", { length: 255 }),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_username_unique").on(table.username),
    uniqueIndex("users_email_unique").on(table.email),
  ],
);

export const categories = mysqlTable(
  "categories",
  {
    id: char("id", { length: 36 }).primaryKey(),
    parentId: char("parent_id", { length: 36 }),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 191 }).notNull(),
    description: text("description"),
    defaultHeaderTemplate: mysqlEnum("default_header_template", headerTemplateKeys),
    defaultArticleTemplate: mysqlEnum("default_article_template", articleTemplateKeys),
    legacyWordPressId: bigint("legacy_wordpress_id", { mode: "number", unsigned: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("categories_slug_unique").on(table.slug),
    uniqueIndex("categories_legacy_wordpress_id_unique").on(table.legacyWordPressId),
    index("categories_parent_idx").on(table.parentId),
  ],
);

export const posts = mysqlTable(
  "posts",
  {
    id: char("id", { length: 36 }).primaryKey(),
    authorId: char("author_id", { length: 36 }).references(() => users.id),
    title: varchar("title", { length: 512 }).notNull(),
    slug: varchar("slug", { length: 191 }).notNull(),
    excerpt: text("excerpt"),
    status: mysqlEnum("status", postStatuses).notNull().default("draft"),
    headerTemplate: mysqlEnum("header_template", headerTemplateKeys),
    articleTemplate: mysqlEnum("article_template", articleTemplateKeys),
    contentDocument: json("content_document").$type<Record<string, unknown>>().notNull(),
    sanitizedLegacyHtml: text("sanitized_legacy_html"),
    featuredMediaId: char("featured_media_id", { length: 36 }),
    secondaryMediaId: char("secondary_media_id", { length: 36 }),
    legacyWordPressId: bigint("legacy_wordpress_id", { mode: "number", unsigned: true }),
    legacyUrl: varchar("legacy_url", { length: 1024 }),
    publishedAt: datetime("published_at", { mode: "date", fsp: 3 }),
    scheduledFor: datetime("scheduled_for", { mode: "date", fsp: 3 }),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: varchar("seo_description", { length: 320 }),
    canonicalUrl: varchar("canonical_url", { length: 1024 }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("posts_slug_unique").on(table.slug),
    uniqueIndex("posts_legacy_wordpress_id_unique").on(table.legacyWordPressId),
    index("posts_status_published_idx").on(table.status, table.publishedAt),
    index("posts_author_idx").on(table.authorId),
  ],
);

export const postCategories = mysqlTable(
  "post_categories",
  {
    postId: char("post_id", { length: 36 })
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    categoryId: char("category_id", { length: 36 })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    position: int("position", { unsigned: true }).notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.postId, table.categoryId] })],
);

export const postDailyViews = mysqlTable(
  "post_daily_views",
  {
    postId: char("post_id", { length: 36 }).notNull(),
    viewDate: date("view_date", { mode: "string" }).notNull(),
    views: int("views", { unsigned: true }).notNull().default(0),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.viewDate] }),
    index("post_daily_views_date_idx").on(table.viewDate),
  ],
);

export const tags = mysqlTable(
  "tags",
  {
    id: char("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 191 }).notNull(),
    legacyWordPressId: bigint("legacy_wordpress_id", {
      mode: "number",
      unsigned: true,
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("tags_slug_unique").on(table.slug),
    uniqueIndex("tags_legacy_wordpress_id_unique").on(table.legacyWordPressId),
  ],
);

export const postTags = mysqlTable(
  "post_tags",
  {
    postId: char("post_id", { length: 36 })
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: char("tag_id", { length: 36 })
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.postId, table.tagId] })],
);

export const postRevisions = mysqlTable(
  "post_revisions",
  {
    id: char("id", { length: 36 }).primaryKey(),
    postId: char("post_id", { length: 36 })
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    editorId: char("editor_id", { length: 36 }).references(() => users.id),
    revisionNumber: int("revision_number", { unsigned: true }).notNull(),
    snapshot: json("snapshot").$type<Record<string, unknown>>().notNull(),
    changeSummary: varchar("change_summary", { length: 512 }),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => [
    uniqueIndex("post_revisions_number_unique").on(
      table.postId,
      table.revisionNumber,
    ),
    index("post_revisions_created_idx").on(table.postId, table.createdAt),
  ],
);

export const postRedirects = mysqlTable(
  "post_redirects",
  {
    id: char("id", { length: 36 }).primaryKey(),
    postId: char("post_id", { length: 36 }).notNull(),
    sourceSlug: varchar("source_slug", { length: 191 }).notNull(),
    createdBy: char("created_by", { length: 36 }),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => [
    uniqueIndex("post_redirect_source_unique").on(table.sourceSlug),
    index("post_redirect_post_idx").on(table.postId, table.createdAt),
  ],
);

export const mediaAssets = mysqlTable(
  "media_assets",
  {
    id: char("id", { length: 36 }).primaryKey(),
    uploaderId: char("uploader_id", { length: 36 }).references(() => users.id),
    storageKey: varchar("storage_key", { length: 191 }).notNull(),
    publicUrl: varchar("public_url", { length: 1024 }),
    originalUrl: varchar("original_url", { length: 1024 }),
    mimeType: varchar("mime_type", { length: 191 }).notNull(),
    byteSize: bigint("byte_size", { mode: "number", unsigned: true }),
    width: int("width", { unsigned: true }),
    height: int("height", { unsigned: true }),
    altText: varchar("alt_text", { length: 512 }),
    checksumSha256: char("checksum_sha256", { length: 64 }),
    legacyWordPressId: bigint("legacy_wordpress_id", { mode: "number", unsigned: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("media_storage_key_unique").on(table.storageKey),
    uniqueIndex("media_legacy_wordpress_id_unique").on(table.legacyWordPressId),
    index("media_checksum_idx").on(table.checksumSha256),
  ],
);

export const auditEvents = mysqlTable(
  "audit_events",
  {
    id: char("id", { length: 36 }).primaryKey(),
    actorId: char("actor_id", { length: 36 }).references(() => users.id),
    action: varchar("action", { length: 96 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: char("entity_id", { length: 36 }).notNull(),
    metadata: json("metadata").$type<Record<string, unknown>>().notNull(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => [
    index("audit_entity_idx").on(table.entityType, table.entityId, table.createdAt),
    index("audit_actor_idx").on(table.actorId, table.createdAt),
  ],
);

export const newsletterSubscribers = mysqlTable(
  "newsletter_subscribers",
  {
    id: char("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 191 }).notNull(),
    status: mysqlEnum("status", newsletterSubscriberStatuses).notNull().default("pending"),
    locale: mysqlEnum("locale", ["el", "en"]).notNull().default("el"),
    consentSource: varchar("consent_source", { length: 191 }).notNull(),
    consentIpHash: char("consent_ip_hash", { length: 64 }),
    confirmationTokenHash: char("confirmation_token_hash", { length: 64 }),
    confirmationExpiresAt: datetime("confirmation_expires_at", { mode: "date", fsp: 3 }),
    unsubscribeTokenHash: char("unsubscribe_token_hash", { length: 64 }).notNull(),
    consentedAt: datetime("consented_at", { mode: "date", fsp: 3 }).notNull(),
    confirmedAt: datetime("confirmed_at", { mode: "date", fsp: 3 }),
    unsubscribedAt: datetime("unsubscribed_at", { mode: "date", fsp: 3 }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("newsletter_subscribers_email_unique").on(table.email),
    uniqueIndex("newsletter_subscribers_confirmation_unique").on(table.confirmationTokenHash),
    uniqueIndex("newsletter_subscribers_unsubscribe_unique").on(table.unsubscribeTokenHash),
    index("newsletter_subscribers_status_idx").on(table.status, table.createdAt),
  ],
);

export const newsletterConsentEvents = mysqlTable(
  "newsletter_consent_events",
  {
    id: char("id", { length: 36 }).primaryKey(),
    subscriberId: char("subscriber_id", { length: 36 }).notNull(),
    event: mysqlEnum("event", ["requested", "confirmed", "unsubscribed", "resubscribed"]).notNull(),
    source: varchar("source", { length: 191 }).notNull(),
    ipHash: char("ip_hash", { length: 64 }),
    userAgent: varchar("user_agent", { length: 512 }),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => [
    foreignKey({ name: "newsletter_consent_subscriber_fk", columns: [table.subscriberId],
      foreignColumns: [newsletterSubscribers.id] }).onDelete("cascade"),
    index("newsletter_consent_subscriber_idx").on(table.subscriberId, table.createdAt),
  ],
);

export const newsletterCampaigns = mysqlTable(
  "newsletter_campaigns",
  {
    id: char("id", { length: 36 }).primaryKey(),
    createdBy: char("created_by", { length: 36 }).notNull(),
    title: varchar("title", { length: 191 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    previewText: varchar("preview_text", { length: 320 }),
    contentDocument: json("content_document").$type<Record<string, unknown>>().notNull(),
    status: mysqlEnum("status", newsletterCampaignStatuses).notNull().default("draft"),
    scheduledFor: datetime("scheduled_for", { mode: "date", fsp: 3 }),
    sentAt: datetime("sent_at", { mode: "date", fsp: 3 }),
    ...timestamps,
  },
  (table) => [
    foreignKey({ name: "newsletter_campaign_creator_fk", columns: [table.createdBy], foreignColumns: [users.id] }),
    index("newsletter_campaigns_status_idx").on(table.status, table.updatedAt),
  ],
);

export const newsletterOutbox = mysqlTable(
  "newsletter_outbox",
  {
    id: char("id", { length: 36 }).primaryKey(),
    subscriberId: char("subscriber_id", { length: 36 }).notNull(),
    campaignId: char("campaign_id", { length: 36 }),
    kind: mysqlEnum("kind", ["double_opt_in", "campaign"]).notNull(),
    dedupeKey: varchar("dedupe_key", { length: 191 }).notNull(),
    recipientEmail: varchar("recipient_email", { length: 191 }).notNull(),
    payload: json("payload").$type<Record<string, unknown>>().notNull(),
    status: mysqlEnum("status", ["pending", "sent", "failed", "suppressed"]).notNull().default("pending"),
    attempts: int("attempts", { unsigned: true }).notNull().default(0),
    lastError: text("last_error"),
    sentAt: datetime("sent_at", { mode: "date", fsp: 3 }),
    ...timestamps,
  },
  (table) => [
    foreignKey({ name: "newsletter_outbox_subscriber_fk", columns: [table.subscriberId],
      foreignColumns: [newsletterSubscribers.id] }).onDelete("cascade"),
    foreignKey({ name: "newsletter_outbox_campaign_fk", columns: [table.campaignId],
      foreignColumns: [newsletterCampaigns.id] }).onDelete("cascade"),
    uniqueIndex("newsletter_outbox_dedupe_unique").on(table.dedupeKey),
    index("newsletter_outbox_delivery_idx").on(table.status, table.createdAt),
  ],
);

export const legacyImportBatches = mysqlTable(
  "legacy_import_batches",
  {
    id: char("id", { length: 36 }).primaryKey(),
    sourceFile: varchar("source_file", { length: 512 }).notNull(),
    sourceSha256: char("source_sha256", { length: 64 }).notNull(),
    sourceSiteUrl: varchar("source_site_url", { length: 1024 }),
    state: mysqlEnum("state", ["inspected", "staging", "review", "completed", "failed"])
      .notNull()
      .default("inspected"),
    totals: json("totals").$type<Record<string, number>>().notNull(),
    startedAt: datetime("started_at", { mode: "date", fsp: 3 }),
    completedAt: datetime("completed_at", { mode: "date", fsp: 3 }),
    ...timestamps,
  },
  (table) => [uniqueIndex("legacy_import_batches_source_sha_unique").on(table.sourceSha256)],
);

export const legacyImportRecords = mysqlTable(
  "legacy_import_records",
  {
    id: char("id", { length: 36 }).primaryKey(),
    batchId: char("batch_id", { length: 36 })
      .notNull()
      .references(() => legacyImportBatches.id, { onDelete: "cascade" }),
    externalId: varchar("external_id", { length: 128 }).notNull(),
    sourceType: varchar("source_type", { length: 64 }).notNull(),
    checksumSha256: char("checksum_sha256", { length: 64 }).notNull(),
    state: mysqlEnum("state", importStates).notNull().default("discovered"),
    sourceUrl: varchar("source_url", { length: 1024 }),
    riskFlags: json("risk_flags").$type<string[]>().notNull(),
    payload: json("payload").$type<Record<string, unknown>>().notNull(),
    promotedPostId: char("promoted_post_id", { length: 36 }).references(() => posts.id),
    error: text("error"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("legacy_record_batch_external_unique").on(
      table.batchId,
      table.sourceType,
      table.externalId,
    ),
    index("legacy_record_state_idx").on(table.batchId, table.state),
  ],
);

export const postRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  categories: many(postCategories),
  tags: many(postTags),
  revisions: many(postRevisions),
  redirects: many(postRedirects),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  posts: many(postCategories),
}));

export const postCategoryRelations = relations(postCategories, ({ one }) => ({
  post: one(posts, { fields: [postCategories.postId], references: [posts.id] }),
  category: one(categories, {
    fields: [postCategories.categoryId],
    references: [categories.id],
  }),
}));

export const tagRelations = relations(tags, ({ many }) => ({
  posts: many(postTags),
}));

export const postTagRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.id] }),
}));

export const postRevisionRelations = relations(postRevisions, ({ one }) => ({
  post: one(posts, { fields: [postRevisions.postId], references: [posts.id] }),
  editor: one(users, { fields: [postRevisions.editorId], references: [users.id] }),
}));

export const postRedirectRelations = relations(postRedirects, ({ one }) => ({
  post: one(posts, { fields: [postRedirects.postId], references: [posts.id] }),
  creator: one(users, { fields: [postRedirects.createdBy], references: [users.id] }),
}));
