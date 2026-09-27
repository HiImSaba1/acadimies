# Acadimies sprint ledger

## Status vocabulary

- `PLANNED`: scoped but not implemented.
- `IMPLEMENTED`: code exists but owner verification is pending.
- `VERIFIED`: fresh owner-run artifacts passed after the latest change.
- `BLOCKED`: cannot continue safely without a named external dependency.

## Sprint 00 - Discovery and preservation

Status: `IMPLEMENTED`

- Confirmed the source is a WordPress WXR 1.2 XML export.
- Confirmed the target is MySQL database `next_acadimies`.
- Preserved the source XML without modification.
- Identified that image binaries require a later transfer phase.
- Established mandatory quarantine because the legacy publication contains
  likely injected/spam content.

## Sprint 01 - MySQL and migration inspection foundation

Status: `VERIFIED` on 2026-09-14.

Scope:

- MySQL Drizzle connection and strict environment validation.
- Initial editorial, template, media, and migration-ledger schema.
- Dry-run WXR inspection with sanitization, checksums, counts, and quarantine.
- Unit contracts for database targeting and migration risk handling.
- Owner-run verification with UTF-8 result and failure artifacts.

Explicitly excluded:

- Creating or changing MySQL tables.
- Connecting to phpMyAdmin.
- Staging or publishing legacy records.
- Downloading attachment files.
- Authentication UI and editorial CRUD.

Acceptance criteria:

- Root dependencies contain `mysql2` and no configured PostgreSQL driver.
- TypeScript, ESLint, Vitest, and production build pass.
- The full supplied WXR file produces a JSON inspection report.
- Inspection performs no database or public-content writes.
- Suspicious and active-content records are retained in quarantine totals.

Verification evidence:

- TypeScript and ESLint passed.
- Vitest passed 6/6 tests.
- Next.js 16.3.5 production build passed.
- WXR inspection reconciled 6,183 items: 6,088 clean and 95 quarantined.
- The inspection recorded 4,753 posts, 7 pages, and 1,375 attachments.
- `sprint-01-failures.txt` reports `PASS - no failed steps.`

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint01Verify
```

Expected artifacts:

- `artifacts/verification/sprint-01-results.txt`
- `artifacts/verification/sprint-01-failures.txt`
- `artifacts/verification/sprint-01-wordpress-inspection.json`

## Sprint 02 - Schema migration and publication repositories

Status: `VERIFIED` on 2026-09-14.

- Added tags, post-tag relations, and immutable numbered post revisions.
- Added strict public queries that exclude drafts, review records, and future
  publication timestamps.
- Added an editorial repository boundary with explicit role validation.
- Added deterministic post, category, and publication template resolution.
- Added stable cache tags and Next.js 16 two-argument revalidation contracts.
- Added schema, publication visibility, template, role, and cache-tag tests.
- Prepared the schema for migration generation; no SQL was generated or applied.

Acceptance criteria:

- TypeScript, ESLint, Vitest, and production build pass.
- Public repository predicates require `published` plus an arrived UTC time.
- Template selection follows post, category, then site fallback order.
- Unknown roles cannot open the editorial repository.
- Schema contract includes all ten Sprint 02 tables.
- Verification performs no database connection or mutation.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint02Verify
```

Expected artifacts:

- `artifacts/verification/sprint-02-results.txt`
- `artifacts/verification/sprint-02-failures.txt`

Verification evidence:

- TypeScript and ESLint passed.
- Vitest passed 12/12 tests across five files.
- Next.js 16.3.5 production build passed.
- `sprint-02-failures.txt` reports `PASS - no failed steps.`

## Sprint 03 - Creative newspaper design system

Status: `VERIFIED` on 2026-09-14.

- Added a Greek-first masthead, editorial hierarchy, newspaper grid, story
  sections, ticker, expert quote, development feature, and publication footer.
- Added reusable story card, section heading, ticker, and abstract editorial
  artwork primitives with accessible labels.
- Added Lenis scrolling, GSAP ScrollTrigger reveals with cleanup,
  `invalidateOnRefresh`, temporary `will-change`, and Motion page entrance.
- Added global reduced-motion fallbacks and disabled Lenis when reduction is
  requested.
- Added desktop, mobile, keyboard, overflow, semantic hierarchy, artwork-alt,
  and reduced-motion Playwright contracts.
- Browser verification uses the installed stable Google Chrome channel on this
  workstation, avoiding a redundant Playwright Chromium download.

Explicitly excluded:

- MySQL reads or schema mutation.
- Production WordPress images and migrated article links.
- Five-header switching and article templates.
- Admin CRUD and authentication.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint03Verify
```

Expected artifacts:

- `artifacts/verification/sprint-03-results.txt`
- `artifacts/verification/sprint-03-failures.txt`
- Playwright trace, screenshot, and video only when a browser contract fails.

Verification evidence:

- TypeScript, ESLint, 14/14 Vitest tests, and production build passed.
- Playwright passed 10 applicable contracts; two project-inapplicable checks
  were intentionally skipped.
- Desktop, mobile, reduced-motion, keyboard, overflow, semantic, and artwork
  accessibility contracts passed.
- `sprint-03-failures.txt` reports `PASS - no failed steps.`

## Sprint 04 - Header library and publication shell

Status: `VERIFIED` on 2026-09-14.

- Added Minimal Editorial, Classic Broadsheet, Modern Neon Sports, Split Ticker,
  and Mega-menu Grid header components.
- Added a closed registry keyed by the persisted MySQL header-template enum.
- Added shared semantic navigation, masthead, edition, search, language, and
  accessible mobile-menu primitives.
- Added a temporary homepage preview selector for reviewing all five designs
  before the admin template selector exists.
- Added unit coverage ensuring every persisted header key maps exactly once.
- Added desktop, mobile, and reduced-motion browser coverage for switching all
  header templates and opening search/menu panels.

Explicitly excluded:

- Persisting the preview selection in MySQL.
- Authentication and administrative template controls.
- Database reads and schema mutation.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint04Verify
```

Expected artifacts:

- `artifacts/verification/sprint-04-results.txt`
- `artifacts/verification/sprint-04-failures.txt`

Verification evidence:

- TypeScript, ESLint, Vitest, and production build passed.
- Playwright passed all 16 applicable header and publication contracts across
  desktop, mobile, and reduced-motion Chrome profiles.
- Two ticker tests were intentionally skipped outside the reduced-motion
  project.
- `sprint-04-failures.txt` reports `PASS - no failed steps.`

## Sprint 05 - Article template library

Status: `VERIFIED` on 2026-09-14.

- Added validated JSON article documents designed for MySQL persistence and admin editing.
- Added long-form, matchday, gallery, and interview templates behind a closed dispatcher.
- Added `/article-preview` with safe template selection and representative content blocks.
- Added responsive paragraph, score, Q&A, quote, and media rendering plus browser coverage.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint05Verify
```

Verification evidence:

- TypeScript, ESLint, Vitest, and production build passed.
- Playwright passed all 19 applicable contracts across desktop, mobile, and reduced-motion profiles.
- Two ticker tests were intentionally skipped outside the reduced-motion project.
- `sprint-05-failures.txt` reports `PASS - no failed steps.`

## Sprint 06 - Authentication and authorization

Status: `VERIFIED` on 2026-09-14.

- Added database-backed credentials authentication with Argon2 verification.
- Added optional Google OAuth that only admits pre-existing active staff emails.
- Added signed eight-hour sessions, typed roles, a capability matrix, and server-side guards.
- Added protected `/admin`, an accessible Greek-first login, and a truthful admin foundation shell.
- Added unit authorization contracts and browser coverage for the unauthenticated boundary.

Explicitly excluded:

- Creating the MySQL schema or the first owner account.
- Article CRUD, publishing actions, or WordPress record promotion.
- Persisted audit events; these arrive with authenticated mutations in Sprint 07.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint06Verify
```

Verification evidence:

- TypeScript, ESLint, 18/18 Vitest tests, and production build passed.
- Playwright passed all 22 applicable contracts; two ticker checks were intentionally skipped.
- Protected admin routes were confirmed dynamic and unauthenticated access redirected to login.
- `sprint-06-failures.txt` reports `PASS - no failed steps.`

## Sprint 07 - Editorial admin CRUD

Status: `IMPLEMENTED`, owner verification pending.

- Added database-backed article listing, creation, editing, category assignment, and template controls.
- Added author ownership checks plus role-aware draft, review, publish, and archive transitions.
- Every create/update transaction now writes a numbered immutable revision and an audit event.
- Added server-side Zod validation and permission checks inside every Server Action.
- Added protected admin article routes and responsive editorial forms.

Explicitly excluded:

- Applying schema changes to `next_acadimies` or creating the first owner account.
- Category/tag/media CRUD and the visual block editor; these follow after the database activation gate.
- WordPress staging or promotion.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint07Verify
```

## Sprint 08 - WordPress staging and migration review

Status: `IMPLEMENTED - OWNER VERIFICATION PENDING`

- Idempotent staging, mappings, admin review, promotion and reconciliation.

## Sprint 08A - Editorial motion foundation

Status: `VERIFIED` on 2026-09-14.

- Confirmed the product boundary as a standard football-academy news and advice publication.
- Added a native App Router incoming-page curtain reveal with no colored overlay.
- Added accessible GSAP SplitText headline animation with masked letters, opacity, and subtle rotation.
- Added reusable clip-reveal and parallax-media primitives with scoped cleanup.
- Coordinated Lenis with GSAP ticker and ScrollTrigger refresh behavior.
- Added route focus restoration, hydration-error coverage, and reduced-motion fallbacks.

Explicitly excluded:

- Live scores, fixtures, betting patterns, academy profiles, directories, scouting, and player databases.
- The latest-five database hero, animated card overlays, new article templates, and curtain footer.
- Database migrations or content writes.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint08AVerify
```

Verification evidence:

- TypeScript, ESLint, 22/22 Vitest tests, and production build passed.
- Playwright passed all 28 applicable contracts; two ticker checks were intentionally skipped.
- Keyboard navigation, route focus restoration, hydration checks, and reduced motion passed.
- `sprint-08A-failures.txt` reports `PASS - no failed steps.`

## Sprint 08B - Latest-five editorial hero

Status: `VERIFIED` on 2026-09-14.

- Replaced the static lead area with a maximum-70vh five-story editorial carousel.
- Added a strict newest-five published MySQL query with deterministic ordering.
- Added an explicit preview/database data-source boundary ahead of schema activation.
- Added masked headline and directional visual reveals, pagination, arrow controls, keyboard navigation, and touch drag.
- Added autoplay with hover, focus, visibility, interaction, and reduced-motion pause rules.
- Added empty, one-story, missing-image, and accessible current-slide behavior.

Explicitly excluded:

- Database migration or content writes.
- Live scores, fixtures, academy profiles, and betting-style interaction.
- Homepage story-card overlays and the two new article designs.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint08BVerify
```

Verification evidence:

- Playwright passed all 31 applicable contracts; two ticker checks were intentionally skipped.
- Latest-five ordering, keyboard operation, viewport height, responsive layout, and reduced motion passed.
- `sprint-08B-failures.txt` reports `PASS - no failed steps.`

## Sprint 08C - Editorial story-card grid

Status: `IMPLEMENTED`, owner verification pending.

- Refined the latest-story area into a cleaner asymmetric newspaper grid.
- Added scroll-triggered clip reveals for story media.
- Added direction-aware dark overlays that enter from the pointer's nearest edge.
- Added masked overlay headlines with restrained opacity and rotation motion.
- Kept base headlines and metadata semantic and permanently readable on touch devices.
- Added keyboard-equivalent focus behavior and immediate reduced-motion states.
- Added environment-backed owner bootstrap using `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
- Separated unique login usernames from optional private recovery email addresses.
- Added safe backend readiness diagnostics and authentication/database configuration tests.
- Rebuilt the admin login as a responsive editorial split-screen experience.
- Added a coordinated GSAP pitch reveal, character title entrance, staggered form motion, and animated field focus states.
- Added browser contracts for the protected login composition, field count, and security context label.
- Reworked the latest-story feed into a clean three-column editorial portfolio grid with animated overlays.
- Refined the five-story hero transition with a tactile clipped, scaled, and lightly rotated stack motion.
- Replaced the shallow footer bar with a full editorial curtain footer, large publication mark, navigation, and GSAP reveals.
- Uses one fixed public header containing only the logo, language switcher, and balanced menu pill; it is transparent at the page top and becomes a restrained glass surface after scrolling.
- Moved the news rail out of the header region and directly below the hero as a responsive, CSS-only editorial CTA marquee based on the Sabaweb offer-page pattern.
- Kept the marquee independent of Lenis and GSAP, with seamless duplicated rails, hover pause, and a static reduced-motion fallback.
- Expanded the lead slider to a true `100dvh` stage and overlaid the transparent header directly on its media.
- Isolated the glass layer from the full-screen menu so its opaque curtain always covers the sticky footer and complete viewport.
- Added immediate cross-card animation cancellation so only the currently hovered story overlay can animate.
- Increased the latest-story hero from 70 to 85 viewport-height units with responsive pixel caps.
- Simplified the Voices story rows to image-and-text cards without media overlays, using a reversed-color hover and drawn title underline.
- Rebalanced Voices to a 35/65 quote-to-stories split and guaranteed three editorial story rows.
- Expanded quick-post rows to a readable 35vh maximum with explicit spacing between cards.
- Converted the neon Voices panel into a linked feature post with compact typography and the same reverse/underline interaction.
- Moved the sticky curtain footer below the elevated publication content layer so it cannot cover story cards.
- Retimed the footer curtain to the true bottom-of-page threshold and added masked word reveals across all footer copy and links.
- Made every homepage section opaque above the sticky footer layer so the curtain cannot bleed through before the page bottom.
- Moved story overlay geometry to CSS for immediate hover response; GSAP now animates only masked title words and cancels previous-card tweens.
- Reduced the footer publication wordmark to the compact global title scale.

## Sprint 08D - Six-section engagement homepage

Status: `IN PROGRESS - VISUAL AND INTERACTION LAYER IMPLEMENTED`

1. Latest five published posts in a full `100dvh` hero carousel with sticky horizontal media parallax.
2. Three posts from the highest-read category over a rolling 30-day window.
3. A full-dvh draggable feature carousel for the most-viewed individual posts.
4. A responsive 2x2 editorial grid for the second highest-read category.
5. A varied metro-layout feed for the third highest-read category.
6. A subscriber CTA with a real consent-aware email capture boundary.

Motion boundary:

- CSS handles hover, transforms, color reversal, snapping, and simple clip-path transitions.
- GSAP is reserved for masked text, scroll-triggered reveals, and carousel transition choreography.
- Every interaction has keyboard, touch, and reduced-motion equivalents.

Implemented in the visual layer:

- Six clearly labelled homepage sections with alternating 70/30 editorial heading composition.
- Full-dvh latest-five hero, three-card popular feed, pointer-draggable most-viewed rail, 2x2 knowledge grid, varied people/psychology metro grid, and newsletter CTA.
- Twenty-percent glass header background revealed with clip-path, plus a reduced footer statement scale.
- Added direction-aware header visibility: it hides after 150px while scrolling down, reveals on upward movement, and remains visible whenever the menu is open.
- Consolidated homepage and footer CTAs into one reusable button component based on the Santra character-swap, clipped-background, and arrow interaction, with enforced single-line labels.
- Refined the full-screen menu with compact typography, a dedicated close control, CSS row reversal, and clipped editorial image previews while preserving the GSAP character swap.
- Removed the oversized menu wordmark and reduced category-link typography without changing the established row heights.
- Standardized both footer actions on the reusable one-line animated button, shortened the stories label bilingually, and enforced a minimum line-height ratio of one.
- Fixed Greek CTA glyph clipping with internal animation-mask breathing room, removed the transformed-header containing block that trapped the menu curtain, and aligned admin browser contracts with the intentional mobile form-only layout.
- Increased animated-button mask leading and character travel to prevent the alternate label from peeking through, with dark text on light buttons and a universal dark/neon arrow hover state.
- Removed the narrow character cap from section headings, enforced responsive single-line category titles, and tightened section and heading spacing for a denser newspaper rhythm.
- Right-aligned title and kicker typography whenever the alternating editorial heading places its title block on the right.
- Removed section numbers, popularity-ranking kickers, and redundant heading labels from every homepage section.
- Replaced the multi-target GSAP menu timeline with one high-stacking CSS clip-path curtain; GSAP now remains only on link-letter hover motion, eliminating staggered interaction delays and competing open/close tweens.
- Made the open header a deterministic viewport-sized interaction layer, preserved keyboard-focused card overlays against incidental pointer movement, and changed owner verification to stream one completed Playwright PASS/FAIL row at a time.
- Preserved the native page scrollbar while the menu is open, added thin branded scrollbar styling, and made the fullscreen curtain its own overscroll-contained vertical scroller for short screens.
- Stabilized keyboard focus by keeping permanent story links outside SplitText DOM reconstruction, enforced the menu pill label on one line at every breakpoint, and made CTA clipping contracts measure the visible label box rather than the intentionally hidden animated duplicate.
- Newsletter submission is intentionally local-only until Sprint 08E adds double opt-in persistence and delivery consent.

Data boundary:

- Rankings come from persisted post-view aggregates with bot-resistant deduplication and a deterministic recent-post fallback.
- Category and post ranking claims are never generated from preview array order.
- Newsletter delivery is not activated in the visual sprint.

## Sprint 08E - Newsletter consent and campaign queue

Status: `IMPLEMENTED`, database activation and owner verification pending.

- Persist pending and confirmed subscribers with double opt-in and opaque unsubscribe tokens.
- Add admin campaign drafts for academy events, tournaments, and recommended reading.
- Prepare an idempotent per-recipient outbox with audit status and unsubscribe suppression.
- Keep all campaigns and queued deliveries dormant until SMTP authentication, retry handling, and provider tests pass.
- No betting, live-match, academy-directory, or unsolicited-contact functionality.

Implementation boundary:

- Added separate subscriber, immutable consent-event, campaign-draft, and idempotent outbox tables.
- Public signup requires an explicit checkbox, validates email server-side, rejects honeypot submissions, hashes IP addresses, and stores opaque confirmation/unsubscribe token hashes.
- Double-opt-in and unsubscribe endpoints change state only through valid opaque tokens; unsubscribe suppresses every pending delivery.
- Added an owner/editor-only newsletter workspace with subscriber state, draft campaigns, and an explicit no-delivery status.
- Campaign creation is draft-only. No SMTP connection, scheduler, bulk send, or automatic promotional email is enabled in this sprint.

Before verification, apply the new schema with `npm run db:push`, then run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint08EVerify
```

Explicitly excluded:

- SMTP delivery, bulk sends, campaign scheduling, and provider credentials.
- Unsolicited contacts, imported email lists, and subscribers without recorded consent.

## Sprint 08F - SEO category archives and continuous reading

Status: `IMPLEMENTED`, owner verification pending.

- Added six canonical, indexable category landing pages with Greek editorial metadata and static route discovery.
- Reused the compact global header shell with a light-surface contrast mode and the native bottom-to-top route curtain.
- Added a restrained GSAP SplitText category headline while keeping article cards stable and keyboard accessible.
- Server-renders 12 stories per archive page and exposes crawlable previous/next URLs. JavaScript progressively enhances those links into grid-only server-action swaps, preserving the hero, header and footer without a document reload.
- Uses the publication repository in database mode with published-only visibility, deterministic ordering, bounded offsets, and ISR every five minutes.
- Added a responsive three-column desktop and two-column smaller-screen archive grid with reduced-motion support and an accessible loading status.
- Added real `/posts/[slug]` database-backed destinations so category links never lead to a placeholder or dead route in database mode.
- Added unit and Playwright contracts for category catalog uniqueness, canonical metadata, responsive columns, bounded page parsing and AJAX-style pagination.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint08FVerify
```

## Sprint 08G - WordPress staging and read-only admin review

Status: `VERIFIED` for code and WXR dry-run on 2026-09-15; database staging activation pending.

- Added a deterministic WXR staging plan that accounts for every inspected legacy item: posts, pages, attachments, and WordPress-internal records.
- Preserved legacy IDs, original status, source URLs, taxonomy references, sanitized HTML/excerpts, attachment URLs, creator login, and SHA-256 content checksums.
- Suspicious records remain quarantined; WordPress-internal records are retained as excluded rather than discarded.
- Added a unique source-file checksum index and resumable, idempotent staging into `legacy_import_batches` and `legacy_import_records` only.
- Reruns preserve approved, promoted, and excluded reviewer decisions; duplicate WXR identifiers fail before database writes.
- Added a protected, capability-gated `/admin/imports` read-only staging overview. Bodies and credentials are not printed in CLI output or the admin listing.
- Added unit contracts for accounting, media/taxonomy preservation, quarantine, duplicate rejection, and review-state protection; browser coverage guards the unauthenticated admin boundary.
- The verification runner executes a full WXR dry-run with no MySQL connection or writes.

Explicitly excluded:

- Publishing or promoting imported content into `posts`, `categories`, or `media_assets`.
- Downloading media, changing public URLs, importing legacy subscribers, or SMTP delivery.
- Bulk approval controls; those need a separate human review and reconciliation gate.

Owner verification (no staging write):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint08GVerify
```

After reviewing a clean gate, apply the schema index (`npm run db:push`) and explicitly stage the source with:

```powershell
npm run wp:stage -- --source .\WordPress.2026-09-14.xml --apply
```

The `--apply` command writes only to the import ledger and can be rerun after an interruption. It does not publish content.

Verification evidence:

- TypeScript, ESLint, Vitest, production build, and all 55 applicable Playwright contracts passed; two marquee checks were intentionally skipped.
- The WXR dry-run reconciled 6,183 records: 6,071 staged candidates, 95 quarantined, and 17 excluded WordPress-internal records.
- The dry-run reported zero database writes, public-content writes, and media downloads.
- `sprint-08G-failures.txt` reports `PASS - no failed steps.`

## Sprint 08H - Editorial migration review workflow

Status: `IMPLEMENTED`, owner verification and staging activation pending.

- Replaced the fixed 50-record staging overview with a bounded 25-record page, state/type filters, stable ordering, totals, and previous/next links.
- Added a protected detail route with original legacy ID/status, author, taxonomy names, source/attachment references, risk flags, and a capped plain-text preview. It does not execute HTML or fetch remote images.
- Added individual approve/exclude controls with capability checks inside the Server Action, validated form data, a checksum/state freshness check, and a transactional row lock.
- Only clean, supported staged posts/pages/attachments may be approved. Quarantined records cannot be approved in this sprint; they may be excluded while remaining in the ledger.
- Every accepted decision writes an audit event in the same transaction. Approved/excluded reviewer states are protected against later WXR restaging.
- Added unit contracts for transition policy and browser coverage for the protected nested review route.

Explicitly excluded:

- Bulk review, automatic approvals, publishing/promoting content into `posts`, downloading media, or sending email.
- A live reviewer/database smoke test until the owner has applied the schema and explicitly staged the WXR source.

Owner verification (no migration write):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint08HVerify
```

## Sprint 09C - Editorial media, SEO and Greek proofreading

Status: `IMPLEMENTED`, owner-run schema application and verification pending.

- Added searchable, bounded media selection for the article cover, secondary image, and image blocks. The media-search endpoint checks the staff session and media capability before any database read.
- Validated every selected media reference against an image asset with a usable public URL before article creation/update; invalid or unresolved references are rejected.
- Persisted `featured_media_id`, new nullable `secondary_media_id`, `seo_title`, and `seo_description` with article revisions in MySQL. The new column requires an owner-run, idempotent targeted migration; it does not synchronize unrelated schema changes.
- Published posts now render registered article images and use cover images in Open Graph/Twitter metadata. Empty SEO fields fall back to the article title and excerpt.
- Enabled Greek browser spellcheck and offline punctuation, repetition, and common-accent hints. Hints never auto-rewrite editorial copy or send it to a third-party service; this is not a full Greek thesaurus.
- Added an owner-run, dry-run-first registration of the 41 existing local `/public/webp` images as idempotent media metadata records. It never copies/downloads files or imports WordPress attachments. Contextual alt text remains editorial work.
- Added schema, media URL/reference, proofreading, mutation, protected-endpoint, and read-only database-readiness checks.

Explicitly excluded: media upload/transfer, WordPress attachment downloading, bulk image registration, automatic orthography correction, and publishing staged WordPress content. The WXR gate remains dry-run.

Owner sequence: apply only the nullable column with `npm run editor:media:migrate`. Optionally inspect local-image registration using `npm run editor:media:register-demo`, then explicitly register these images with the Windows-safe `npm run editor:media:register-demo:apply`. Finally run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint09CVerify
```

The verification action reads database readiness but never applies migrations or downloads media.

## Sprint 09 - Media transfer and gallery workflow

Status: `PLANNED`

- Validated attachment transfer, derivatives, alt text, focal points, galleries.

## Sprint 09D - Historical WordPress attachment transfer

Status: `IMPLEMENTED`, owner-run verification and explicit transfer pending.

- The WXR contains remote attachment URLs, not image binaries. `/public/webp` remains temporary template imagery and is not treated as migrated WordPress media.
- The dry-run media plan accounts for every attachment and separates eligible, quarantined, missing-URL, and unsafe-URL records. Only HTTPS image URLs under `acadimies.gr/wp-content/uploads/` are eligible.
- Preserve attachment parent IDs and article `_thumbnail_id` references in the staging ledger for later post/image linking. No article is promoted or published here.
- The owner-only apply command requires the matching WXR review ledger; it never downloads quarantined/excluded/review-locked records. Downloads are bounded to 20 attachments by default, at most 50 per run, and support an offset for resumable batches. HTTP redirects and non-image responses are rejected; remote file size and decode pixels are bounded. Images are normalized to metadata-stripped WebP.
- Imported files are kept separately in ignored `/public/wordpress-media`, with unique legacy IDs and matching `media_assets` records. Existing files or database records are never overwritten. Reconciliation errors remain visible per legacy ID. A persistent media volume or object-storage adapter will be needed if deployed to an ephemeral/serverless host; do not deploy this local-file strategy without confirming hosting.

Owner verification, with no database writes or downloads:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint09DVerify
```

After reviewing the dry-run counts, owner-triggered transfer sequence (the first command stages metadata only):

```powershell
npm run wp:stage:apply
npm run wp:media:apply
```

For subsequent bounded batches, use `npm run wp:media:apply -- --offset 20 --limit 20` (then offset 40, etc.). If a batch fails, review its IDs and retry the same offset; completed images are checked and skipped. Do not assume remote WordPress images are accessible until the owner runs the transfer.

## Sprint 09E - Historical articles into editorial drafts

Status: `IMPLEMENTED`, owner-run verification and editorial approvals pending.

- The WXR draft preflight counts posts/pages by original WordPress status, quarantined items, missing text, featured image references, matched inline images, gallery shortcodes, and unmatched inline image URLs. It performs no database writes.
- A bounded apply requires the matching staged batch and explicit `approved` review state for each source record. Quarantined, excluded, staged-but-unapproved, and checksum-changed records cannot be promoted. Original `publish` never becomes a public post automatically.
- Approved content is stored as a private `draft` in `posts`, with the full sanitized legacy HTML retained in `sanitized_legacy_html` and editable text/image blocks prepared for the admin article editor. Imported WordPress image assets are linked when present; unmatched or not-yet-downloaded body images remain counted for review rather than replaced by `/webp`.
- Existing category slugs are linked where available. Missing categories are counted, not invented. Legacy ID, URL, original publication date, draft revision, review state, and audit trail are retained. Slug collisions use a deterministic `-wp-ID` suffix. Repeated runs skip already promoted records without overwriting edits.
- Inline/gallery images are currently appended to editable blocks for editorial arrangement; the retained original HTML preserves original positions and captions. Rich HTML-to-block fidelity, taxonomy creation, redirects, and final public publishing remain separate editorial/release work.

Owner verification (dry-run only):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint09EVerify
```

After verification, stage the XML if needed with `npm run wp:stage:apply`, review and approve individual safe posts in `/admin/imports`, transfer relevant images using `npm run wp:media:apply`, then promote a reviewed article by its WordPress ID using `npm run wp:drafts:apply -- --legacy-id 1234`. Up to ten ordered candidates can also be inspected with `npm run wp:drafts:apply`; subsequent slices use `-- --offset 10 --limit 10`. No command in the verification runner approves, downloads, promotes, or publishes records.

## Sprint 10A - SEO, indexing, cache invalidation and legacy redirects

Status: `IMPLEMENTED`, owner-run verification pending.

- Published article pages now derive canonical, Open Graph and Twitter metadata from persisted editorial fields. They expose safely serialized `NewsArticle` and breadcrumb JSON-LD with database publication/modification dates, author attribution and the registered featured image.
- Added crawl-safe `/robots.txt` and `/sitemap.xml`. The sitemap contains the homepage, approved category archives and—only in database publication mode—published, due articles. Admin, preview, draft, scheduled and archived content are excluded. One sitemap is intentionally capped at 50,000 articles; sitemap partitioning is required before that production limit is approached.
- Added five-minute tagged public reads for article pages, category batches and the homepage hero. Article mutations invalidate the affected article, category and latest-story tags without flushing unrelated public category/article caches.
- Added a narrow top-level legacy WordPress slug route. It redirects only when an exact retained legacy URL resolves to a currently published, due database article; unknown, draft, scheduled, archived and preview-mode slugs return not found.
- Added unit contracts for structured data, safe JSON-LD serialization, social metadata and exact legacy URL candidates, plus browser contracts for robots, sitemap exclusions and the preview legacy boundary.
- `unstable_cache` is a deliberate transitional boundary for the current Next.js configuration. A future Cache Components migration can replace it without changing repository contracts. Public full-text search is deferred to Sprint 10B.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint10AVerify
```

This verification performs no publishing, WordPress media downloads or production deployment. Legacy redirects become active only for records that editors have explicitly published in database publication mode.

## Sprint 10B - Public editorial search

Status: `VERIFIED` (owner-run Sprint10BVerify passed 2026-09-15).

- Added a Greek-first `/search` archive with a URL-driven query, approved category filter, accessible search semantics, editorial result grid, empty/short-query states, loading feedback and bounded previous/next navigation.
- Search results use only published articles whose publication time is due. Draft, scheduled, archived, admin and preview records cannot enter the database result query. Search result pages are `noindex,follow` so arbitrary query URLs do not create thin indexable pages.
- Database mode uses the existing publication visibility index plus an explicit MySQL FULLTEXT index across title, excerpt and retained sanitized WordPress body text. Current rich-text JSON remains searchable through a bounded fallback until a future generated search-document column is justified by production volume.
- Search input is whitespace-normalized, limited to 100 characters, requires two characters, accepts only catalogued category slugs, caps page traversal and escapes SQL wildcard characters. Results are cached for five minutes and invalidated by the existing publication tag after editorial mutations.
- Added the search destination to the full-screen editorial menu, unit contracts for query normalization/URL generation, and browser coverage for the form, `noindex` policy, results and rejected category/page input.

One-time database preparation (idempotent and restricted to `next_acadimies`):

```powershell
npm run search:index:migrate
```

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint10BVerify
```

The migration creates only `posts_public_search_fulltext` and prints no credentials. Verification checks the index but does not create it, publish records, download media or modify WordPress staging data. Real post/image ingestion remains Sprint 10C.

## Sprint 10C - Historical-content audit and migration readiness

Status: `VERIFIED` (owner reported clean Sprint 10C results; audit review and migration apply remain separate).

- Added `wp:editorial-audit`, a read-only report of WXR post/page/media reconciliation, original statuses, years, categories, featured-image ID resolution, inline-image gaps, and a bounded sample of safe originally published article IDs/titles. It does not include body HTML, write to MySQL, download images, or publish posts.
- Treat the supplied example image as a structural editorial reference only; its fashion/real-estate/cruise copy and imagery are unrelated to the academy publication.
- Review this audit before assigning the new card styles or post templates to legacy records. The existing staging ledger, media transfer and approved-draft promotion remain the only ingestion path. No automatic approval or publication is introduced.

Owner-run audit from `web`:

```powershell
npm run wp:editorial-audit -- --samples 12
```

For a retained report, use `--output .\artifacts\wordpress-editorial-audit.json`; the command refuses to overwrite an existing report. After reviewing the counts, run the owner verification action added for this sprint, then stage/approve selected safe posts in `/admin/imports`, transfer media in bounded batches, and promote only approved WordPress IDs as private drafts. We will review those run results before any bulk apply or publication.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint10CVerify
```

## Sprint 10D - Editorial cards and top-three trending strip

Status: `IMPLEMENTED`, owner-run verification pending; historical-post pilot not yet applied.

- Build a reusable story card with a consistent 10px radius and a small bottom-right circular publication-date badge. Sequence the container/circle clip reveal, image zoom, then short date/title SplitText reveal; use scoped GSAP/ScrollTrigger cleanup, `invalidateOnRefresh`, reduced-motion static states, and CSS-first hover behavior.
- Add a three-story trending strip directly below the global header/lead hero, sourced only from published due posts. Maintain the current homepage six-section editorial hierarchy rather than adding a seventh full-height block. Desktop and mobile density, keyboard access, LCP and CLS are acceptance gates.
- Add a compact homepage category mosaic below the latest-post hero: one or two newest published stories from every active editorial category, with category-specific layout accents (not separate competing visual systems), clear section titles and links to each category archive. Deduplicate stories already shown in the lead hero when enough content exists. Keep the six primary editorial sections; the mosaic replaces/reorganizes existing category sections rather than indefinitely adding full-height sections. Empty categories show no fabricated posts.
- After the 10C audit is reviewed, run a small owner-approved XML migration pilot before judging these layouts against real content: stage the matching archive, transfer only the selected post images, approve chosen safe records in `/admin/imports`, and promote them as private drafts. Publishing those pilot drafts is a separate editorial decision. The homepage continues to show only published, due posts.

Implementation: database mode reads each catalogued category's newest published, due posts and excludes duplicate lead stories; preview mode is illustrative. The three-story trending strip uses the latest homepage hero records. Date circles show one centered short month/year label (for example `Jun 26'`). The preview fixtures now carry explicit illustrative dates rendered as non-`time` circles with accessible preview labels; database posts use only persisted publication dates in semantic `time` circles. The two existing category showcase sections still use preview fixtures and will be replaced after the real-data migration pilot rather than pretending those fixtures are database posts.

Footer refinement: the editorial-team admin link was removed from the public footer, while `EditorialButton` remains reusable. Its compact, borderless animated variant now serves the story CTA, five Quick links and the verified Facebook/Instagram destinations. The five Quick links are currently editorial-priority category routes, not a claimed view-count ranking: category-view analytics do not yet exist. Replace the selection with an actual top-five query once measured readership data is available.

Design refinement: the 10px frame and small date circle are shared by regular homepage/category article grids, with the existing dark hover overlay and animated title retained. On hover/focus the base title fades so the title is not visibly duplicated. Compact Voices rows retain their image/text and reversed-color hover design, with 10px rounded borders and half-size internal padding; the draggable carousel shows three complete cards on desktop/laptop and two on mobile. Its cards are now compact image-cover stories with the title over the photograph, a date circle, and accessible previous/next arrows in addition to pointer dragging. The homepage/category hero bottom corners and reusable editorial buttons use the same 10px radius.

Owner verification (read-only regarding the WordPress archive):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint10DVerify
```

## Sprint 10H - Category filters and vintage editions

Status: `IMPLEMENTED`, owner-run verification pending.

- Add URL-backed `related|recent|oldest` sorting to category archives with an accessible GSAP-revealed dropdown. `related` means same-category relevance to an explicit keyword/query when supplied; without a query it uses editorial publication ranking, not private analytics.
- Give the Coaches and Academy News categories a vintage broadsheet skin: masthead, rules, restrained serif hierarchy and shaped/date-badge cards. Preserve existing URLs, SEO metadata, progressive archive pagination and mobile readability. Confirm the actual category slugs in the XML/database before assigning the skin.
- Implemented against the confirmed public archive slugs `proponitiki` and `nea-akadimion`. Sorting is URL-backed, survives automatic pagination, rejects unknown values, and keeps the default URL canonical. The admin login now reuses the third active homepage slide image with a local fallback so authentication stays reachable during database outages.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint10HVerify
```

## Sprint 10I - New post templates and related-story engine

Status: `IMPLEMENTED - OWNER VERIFICATION PENDING`

- Extend the existing admin-selectable four-template registry with three new styles: cinematic full-media chapters inspired by Trigger; alternating image/text chess chapters; and refined masthead plus sticky related sidebar inspired by Antonio Tuscani. A fourth minimal newspaper article style may be added after the owner reviews the first three. Inspiration is structural, not a theme/code/assets copy.
- Update the editor document contract for alternating chapter blocks and keyword/tag assignments. Keep old `longform|matchday|gallery|interview` records valid and migrate the MySQL enum with a targeted owner-run migration before new keys are selectable.
- Implement one published-only, due-only related query: same-category newest first, then overlapping approved tags/SEO keywords to fill a deduplicated maximum of five. Sidebar templates use the sticky list; non-sidebar templates use a below-article carousel. No live-match or betting mechanics.
- Add once-only article text-line reveals around the lower 20% viewport trigger (`start: "top 80%"`), approximately one second per block, no scrub/yoyo/reverse, with reduced-motion instant content and no hidden text if JavaScript fails. Check reading continuity and long-article cost.
- Implemented the seven-key closed dispatcher, admin template cards, typed alternating media/text chapter blocks, sticky same-archive sidebar treatment, and the once-only line-reveal lifecycle. The editor now restores and searches imported tags, accepts a bounded set of new SEO keywords, generates collision-safe Greeklish tag slugs, and persists `post_tags` transactionally for the related-story fallback. Added a targeted enum inspection/migration rather than allowing `db:push` to make unrelated schema changes.
- Replaced category infinite scrolling with 12-story, URL-addressable pagination that progressively enhances to an AJAX-style grid swap. Previous/next links remain crawlable without JavaScript, numbered circles expose every page, Back/Forward history is restored, and loading skeletons cover the asynchronous swap without refreshing the surrounding archive page.
- Final presentation refinements include compact stacked month/year date badges, unified 10px card/grid/overlay/button radii, and the owner-selected local image `/images/2026/01/25397.webp` for the homepage newsletter CTA. The admin inspection gate now also proves the category, tag, post-tag, revision and media tables required by this editor.

Owner verification:

```powershell
npm run article:templates:migrate
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint10IVerify
```

## Sprint 10J - Historical publication fidelity and legacy URL protection

Status: `IMPLEMENTED - OWNER VERIFICATION PENDING`

- Added safe permanent redirects for historical WordPress root slugs and `/?p={legacyId}` links. Resolution is restricted to a single positive numeric identifier and only published, due database articles can redirect; drafts, scheduled posts, archived records, trash and quarantine remain unavailable.
- Improved WXR conversion so headings, paragraphs and quotations retain their editorial semantics instead of becoming one undifferentiated paragraph stream. Captions associated with resolved inline WordPress images are retained when imported media blocks are created or backfilled.
- Added `wp:reconcile`, a read-only XML/database integrity report covering source totals, promoted legacy posts, imported media, post and ledger states, missing legacy URLs, future-dated records incorrectly marked published, and dangling promotion references. It prints no article bodies, credentials or personal data and performs no writes, downloads or publication changes.
- Extended the owner verification runner with `Sprint10JVerify`. The inherited build, unit, browser, admin, search, XML dry-run, media dry-run and promotion-preflight gates remain active, followed by the new read-only reconciliation report.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint10JVerify
```

## Sprint 10K - Anonymous readership analytics

Status: `IMPLEMENTED - DATABASE PREPARATION AND OWNER VERIFICATION PENDING`

- Added `post_daily_views`, an aggregate table containing only article ID, calendar date and a counter. No IP address, user-agent, fingerprint, account, cookie or raw event history is collected.
- Published article pages record at most once per browser session using `sessionStorage`; storage is a client deduplication convenience rather than an identity. The API accepts only a bounded slug and increments only published, due articles.
- The homepage draggable popular rail now uses the highest aggregate readership from the last 30 days. Until five ranked articles exist it deliberately falls back to the newest public stories instead of fabricating popularity.
- Added `/admin/analytics` with today's aggregate, the 30-day total and the ten most-read articles. This is read-only and available only inside the authenticated admin workspace.
- Added a targeted idempotent migration/inspection script and inherited build, unit, browser, admin, search and WordPress reconciliation gates. Verification never creates the analytics table.

One-time database preparation:

```powershell
npm run analytics:migrate
```

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint10KVerify
```

## Sprint 10E - Reader information, consent and author biography

Status: `IMPLEMENTED`, owner-run verification and legal review pending.

- Added `/cookies` and `/privacy-policy` as Greek-first editorial pages, plus `/dora-ioakeimidou` as a restrained writer biography. Only verified public article themes are described; no portrait, invented career claim or unreviewed private biography is published. The writer's supplied Facebook profile is linked from her bio, and the footer Socials column links to the bio rather than directly to that profile.
- Adapted the Moumkas cookie experience using the same `react-cookie-consent` package, with equal Accept/Reject buttons, a persistent versioned choice, a clear re-open control and no implied analytics activation. The current site has no analytics, advertising pixels or embedded social feed; future optional technologies require new purpose-specific information and a new consent version rather than reusing `v1`.
- Footer includes accessible Cookies and Privacy links using the same compact `EditorialButton` animation. The owner-provided `info@acadimies.gr` appears in both explanations. Both legal pages stay `noindex` and out of the sitemap while draft; the privacy page explicitly notes that the controller's formal identity, hosting, retention and delivery integrations need confirmation before production/legal sign-off.
- Browser contracts verify consent persistence and withdrawal/reopening, routes, official links, contact email and the biography's placement. `Sprint10EVerify` synchronizes dependencies and runs strict TypeScript, lint, Vitest, build, editorial browsers and inherited backend/XML dry-run gates. No assistant-run project commands or database writes.
- Restored the bottom-right date circle on illustrative homepage/category cards with visually formatted preview dates that are clearly identified as design-only in accessibility text. Real database dates remain separate and authoritative. The draggable carousel now uses smaller 10px-rounded photo cards, puts each title over the image, retains the date circle and adds accessible one-card previous/next controls without removing drag support.
- The draggable carousel section now uses intrinsic height and section padding for its rhythm, with no `100dvh` minimum or rail-bottom spacer. The reusable `StoryCard` has two explicit image-led treatments: `shaped` for compact image plus short editorial copy and `cover` for the photo-overlay title/date composition. Homepage story grids alternate them, while category archives and search use a stable every-third-card cover rhythm across each 12-story page. The shaped trending/category mosaic cards were scaled down to the Academy News density. Previously approved Voices row/neon cards retain their dedicated compact/reversed-hover behavior.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint10EVerify
```

## Sprint 10G - Migration apply and fidelity review

Status: `PLANNED`, requires owner approval of audit and bounded apply batches.

- Owner runs XML staging, selected remote image transfers, and reviewed draft promotion. Reconcile WXR IDs against MySQL `legacy_import_records`, `posts`, `media_assets`, original dates, redirects, missing featured/body images and category/tag mappings. No auto-publication of WordPress `publish`, and no substitution of temporary `/webp` photos for missing historical images.
- The 10C audit exposed encoded historic taxonomy slugs (for example the old “Νέα ομάδων” category) that do not match the six new editorial archive slugs. Editors must approve an explicit old-to-new category mapping before seeded posts can populate the homepage mosaic; the importer must not silently invent or guess these assignments.
- This is the complete historical seeding milestone: all safe post/page candidates are accounted for as promoted drafts or explicit review/exclusion decisions, then visible by year in `/admin/articles/{year}`. Public category archives and homepage modules show only those subsequently reviewed and published. The original 3,975 trashed records and 95 quarantined items are retained in the import ledger, not silently published or discarded.
- Restore image placement/captions from retained sanitized HTML where the plain-text block conversion loses fidelity. Resolve trash/spam/95 quarantined items explicitly, not by silently dropping them. Deployment storage for downloaded files must be selected before release.
- Public database articles now include chronological previous/next navigation and a five-item related-story resolver: same categories first, shared tags second, then newest public archive stories as a bounded fallback. Draft, scheduled, archived and future-dated content remains excluded.

## Sprint 09F - Year-based editorial archive

Status: `IMPLEMENTED`, owner-run verification pending.

- Replaced the flat `/admin/articles` list with a database-backed year index. Each bordered year row shows its article count and opens `/admin/articles/{year}`.
- Historical WordPress drafts use their retained original publication date for archive grouping; new unpublished drafts fall back to their database creation year.
- Added compact year cards with the registered local featured image, status, author, title, excerpt, and a direct edit link. Missing images receive a stable placeholder; temporary `/webp` and imported `/wordpress-media` records remain distinct.
- Added closed A–Ω and Ω–Α title sorting through `?sort=az|za`. Unknown sort values fall back to A–Ω and invalid/non-year archive paths return not found. Existing `/admin/articles/{id}/edit` routes remain unchanged.
- Added unit contracts for year parsing, safe sort parsing, and historical-date grouping, plus an unauthenticated browser boundary check for nested year archives.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint09FVerify
```

## Sprint 10E - Editorial surface cohesion

Status: `IMPLEMENTED`, owner-run verification pending.

- Doubled the sticky header glass layer opacity from 20% to 40% while keeping the top-of-page state transparent through the existing clip-path reveal.
- Added a cohesive 10px radius to the dark popular-post carousel panel; carousel height remains intrinsic and is governed by section padding.
- Corrected the shaped card date badge refs so semantic `<time>` elements remain strictly typed.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint10EVerify
```

## Sprint 11 - Release verification

Status: `IMPLEMENTED`, owner-run verification and live deployment rehearsal pending.

- Added global response hardening for MIME sniffing, framing, referrer leakage, browser permissions and legacy cross-domain policy files. Browser contracts verify the headers on all desktop, mobile and reduced-motion projects.
- Added a deterministic production homepage budget based on the unique initial client-reference chunks emitted by `next build`: 300 KiB uncompressed JavaScript and 180 KiB uncompressed CSS. Development-server payloads and network timing are deliberately excluded from this static budget.
- Added a read-only release inspector covering the complete editorial/newsletter/import/analytics schema, canonical category coverage, published-content availability, featured-media referential integrity, local public-media existence and safe paths, SMTP/contact readiness and a deterministic schema fingerprint.
- The schema fingerprint and authoritative counts provide the baseline for comparing a restored copy. Verification deliberately does not perform a restore into `next_acadimies`; the final production rehearsal requires a separately named disposable database and hosting backup credentials.
- Contact delivery now accepts the existing `CONTACT_TO_EMAIL` variable as well as `CONTACT_RECIPIENT_EMAIL`. Complete SMTP credentials enable delivery unless `SMTP_ENABLED=false` explicitly disables it. No verification command sends mail or prints credentials or personal data.
- Added `Sprint11Verify`, inheriting strict TypeScript, ESLint, Vitest, production build, admin/search/template/newsletter/analytics readiness, full Playwright coverage and all WordPress staging/audit/media/reconciliation dry-run gates before the final release inspector.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint11Verify
```

## Sprint 12 - Editorial content health

Status: `IMPLEMENTED`, owner-run verification pending.

- Added the protected `/admin/content-health` desk and navigation entry. It is read-only and never changes publication state.
- Audits only currently public articles and excludes drafts, review items, scheduled/future posts and archived content.
- Reports missing featured media, category assignment, excerpt, SEO title and SEO description, with aggregate counts and direct editor links for the 100 most recent affected articles.
- Added pure issue-classification unit contracts and an unauthenticated browser boundary for the new route.
- Added `Sprint12Verify`, inheriting the complete Sprint 11 release, migration, performance, delivery and browser verification gates.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint12Verify
```

## Sprint 12A - Author attribution and deterministic SEO repair

Status: `IMPLEMENTED`, owner dry run and apply approval pending.

- Added a transaction-safe, idempotent repair workflow for missing post authors, excerpts, SEO titles and SEO descriptions. Existing editorial metadata is never overwritten.
- Missing authors are assigned to a non-login author record named `Δώρα Ιωακειμίδου`; the record is created only during the explicit apply operation when absent.
- Generated metadata follows deterministic Yoast-style constraints: clean content-derived summaries, SEO titles capped at 60 characters, descriptions capped at 155 characters, and an inferred title keyphrase present in both generated SEO fields where usable source text exists.
- The workflow reports deterministic checks that still need human review rather than claiming a Yoast score. No external AI/API requests are made.
- Added unit coverage for legacy HTML cleanup, sentence-aware truncation, preservation of existing metadata and focus-keyphrase placement.

Dry run:

```powershell
npm run content:repair:inspect
```

Apply only after reviewing the dry run:

```powershell
npm run content:repair:apply
```

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint12AVerify
```

## Sprint 12B - Visual archive management and Greek article wizard

Status: `IMPLEMENTED`, owner-run verification pending.

- Rebuilt `/admin/articles/{year}` as a 3-column editorial card archive on desktop/laptop and a persistent 2-column grid on smaller screens. Cards retain their image, status, author, title and excerpt while adopting the public-site rounded hover treatment.
- Replaced the text edit action with a labelled pencil icon and added an owner/editor-only trash control above each image. Deletion requires native confirmation, runs inside a transaction, removes dependent taxonomy/revision/analytics rows, preserves shared media files, records an audit event and retains imported source records as excluded so they cannot be silently re-imported.
- Added server-side 50-item archive pagination with bounded page parsing and crawlable URL state. A compact URL-backed archive toolbar searches title, slug and excerpt across the full year, then sorts the complete result set by newest, oldest, A–Ω or Ω–Α without losing the filter during pagination.
- Adapted the Grecian Spices wizard architecture to the existing Greek article editor for both creation and editing: template, basics, structured content, publication/media/SEO settings and final review. Editing now starts with a visual template chooser and only saves from the review step; existing Server Actions, validation, media search, block editor and browser draft recovery remain authoritative.
- Added an idempotent, draft-only 27ο Golden Cup fixture generator covering every article template. Each Greek fixture includes the 3–5 January 2027 Planet FC brief, 32 academies, template-specific structured content, taxonomy, SEO fields and direct editor/design-preview links. All seven use the mobile Golden Cup poster as their featured cover and select their secondary/body media exclusively from `/images/2026/01`; missing local files are registered in the media library only during the explicit apply command. The verification runner executes only its read-only dry run.
- Dedicated Golden Cup demo slugs can be rendered at `/posts/demo-27o-golden-cup-2027-*` while remaining drafts. They are explicitly `noindex`, omitted from feeds/search/analytics, and do not widen public access to ordinary drafts. The archive eye action still uses the authenticated admin preview for all other unpublished content.
- Added permission and archive-pagination unit contracts. Authors cannot delete posts.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint12BVerify
```

Optional demo draft creation after reviewing the dry-run output:

```powershell
npm run demo:golden-cup:inspect
npm run demo:golden-cup:apply
```

## Sprint 12C - Active article-template governance

Status: `IMPLEMENTED`, owner-run verification and explicit demo cleanup apply pending.

- The authoring surface now exposes five active templates: Longform, Gallery, Interview, Cinematic and Sidebar. Matchday and Chess are retired from new-article selection, editing choices and the public template-preview navigation.
- Matchday and Chess remain persisted schema values and registered renderers strictly for backward compatibility. This avoids destructive MySQL enum surgery and guarantees that an older record still renders until an editor deliberately moves it to an active template.
- Existing articles on a retired template show a clear legacy notice in the wizard. Their current value is preserved until an editor explicitly selects an active replacement; ordinary saves do not silently rewrite layout choices.
- Golden Cup fixtures now cover only the five active templates. Their template suffixes remain isolated demo identifiers; normal article slugs continue to be generated from the Greek title and never receive a template suffix.
- The dry run reports the exact generated Matchday/Chess demo slugs eligible for removal. Only the explicit apply command deletes those protected fixtures and their dependent taxonomy, revision and analytics rows; media files and shared media records are preserved. A title/source collision aborts the transaction.
- Added active/legacy template unit contracts and updated browser coverage to exercise only author-selectable templates. `Sprint12CVerify` inherits every Sprint 12B gate and performs only the fixture dry run.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint12CVerify
```

After reviewing `willRemoveRetiredDemos`, explicitly refresh the five active fixtures and remove the two retired generated demos with:

```powershell
npm run demo:golden-cup:apply
```

## Sprint 13 - Safe article revision restoration

Status: `IMPLEMENTED`, owner-run verification pending.

- Added an explicit restore control to the article revision history for owners and editors. Authors can continue editing their own articles but cannot see or invoke revision restoration.
- Every restore is scoped to a revision belonging to the current article and validates the stored snapshot with the same article contract used by the editor. Missing or malformed media references abort the operation.
- Restoration is fully transactional and reversible: the current article is first saved as a checkpoint, the selected historical snapshot is applied, and the restored result is recorded as another revision. Any failure rolls back the complete operation.
- Content blocks, templates, publication state, category, tags, featured/secondary media and SEO fields are restored together. Revision restoration deliberately preserves the current public slug; explicit slug changes are handled separately by Sprint 14 redirect management.
- Successful restores create an audit event, refresh admin/public caches and show clear editor feedback. The verification runner never restores content and performs only read-only/unit/browser checks.

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint13Verify
```

## Sprint 14 - Permanent article redirects and safe slug editing

Status: `IMPLEMENTED`, owner migration and verification pending.

- Added a dedicated `post_redirects` registry and bounded migration utility. Migration is explicit, restricted to `next_acadimies`, prints no personal data and is not performed by verification.
- Published article slugs can now be edited safely. The update transaction reserves the former slug as a permanent redirect, updates the article and revision, and records the slug change in the audit event together.
- Public `/posts/{slug}` requests resolve an exact historical slug only when its destination article is currently published and due, then issue a framework-level permanent redirect to the current canonical post URL. Draft, archived, scheduled and missing destinations remain unavailable.
- Redirect chains and loops are avoided by mapping every historical slug directly to the article's current slug. Returning an article to one of its own former slugs safely releases that historical entry; slugs owned by another post or redirect are rejected.
- New manual and automatically generated slugs also respect the redirect registry, preventing an old inbound URL from being silently captured by an unrelated article.
- The article wizard explains the redirect behavior and shows the latest historical URLs. Redirects are removed explicitly during article deletion because the schema intentionally avoids fragile cross-table foreign keys on the existing local MySQL baseline.
- Fixed the Sprint 13 React 19 restore control by binding the revision number into its Server Action instead of combining `name` with a function-valued `formAction`.

One-time schema migration:

```powershell
npm run redirects:migrate
```

Owner verification after migration:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint14Verify
```

## Sprint 15 - Scheduled editorial publishing

Status: `IMPLEMENTED`, owner-run verification pending.

- Added a Greece-local scheduling control to the article wizard for owners and editors. The selected `datetime-local` value is converted explicitly with the `Europe/Athens` timezone, including daylight-saving changes, and must be in the future.
- Scheduled articles use the existing `scheduled` publication state and remain unavailable from public post routes, search, feeds, related stories and homepage queries until they are promoted. Authors cannot select this privileged state.
- Added a bounded, idempotent publisher with a default batch size of 25 and a hard maximum of 100. Its dry run is read-only; the apply command publishes only due rows, locks each candidate transactionally, clears its schedule, creates a revision and records an audit event.
- The admin year archive now filters by publication state. Scheduled articles are grouped by their planned publication year and display the planned date/time in Greece-local format.
- Verification runs the complete Sprint 14 safety suite and only the scheduled-publisher dry run. It never publishes an article or configures an operating-system/deployment scheduler.
- Public caches retain their existing bounded revalidation policy. A production scheduler can invoke the apply command at the desired cadence after deployment infrastructure is selected.

Read-only queue inspection:

```powershell
npm run articles:scheduled:inspect
```

Explicitly publish due scheduled articles:

```powershell
npm run articles:scheduled:publish
```

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint15Verify
```

## Sprint 16 - Protected scheduled-publication automation

Status: `IMPLEMENTED`, owner secret configuration and verification pending.

- Extracted scheduled publication into one authoritative service shared by the owner CLI and the internal HTTP endpoint. Both paths use the same bounded candidate query, revision validation, row lock, state transition and audit record.
- Added `POST /api/internal/publish-scheduled` for deployment schedulers. It requires a dedicated 32+ character server-only bearer secret and compares a SHA-256 digest with Node's timing-safe primitive. Missing configuration returns `503`; invalid credentials return `401`; responses are never cached.
- Overlapping invocations are idempotent: every candidate is rechecked while holding a transactional `FOR UPDATE` lock, and only a row still marked `scheduled` and already due can be promoted.
- Successful endpoint publications immediately invalidate the post, category, latest/homepage and global publication cache tags. The CLI remains an explicit operational fallback and reports that it cannot invalidate the cache of a separate running Next.js process.
- The endpoint returns counts only. It never returns article titles, slugs, database identifiers, secrets or personal data.
- Added unit coverage for secret requirements, exact bearer authorization and batch bounds. Verification inherits all Sprint 15 gates, checks endpoint configuration without calling it and never publishes content.

Required server-only environment value:

```dotenv
SCHEDULED_PUBLISH_SECRET=replace-with-a-unique-random-value-of-at-least-32-characters
```

Read-only scheduler readiness:

```powershell
npm run articles:scheduler:inspect
```

Owner verification after configuring the secret:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint16Verify
```

## Sprint 17 - Observable and recoverable publication queue

Status: `IMPLEMENTED`, owner-run verification pending.

- Added an owner/editor-only `/admin/publication-queue` workspace showing upcoming, due and actionable failed scheduled articles. Dates are rendered in `Europe/Athens`, and the navigation link is hidden from roles without publication permission.
- Added the latest ten scheduler-run summaries with checked, published and failed counts. Operational records reuse the existing audit ledger, so this sprint requires no schema migration or duplicate queue table.
- A malformed scheduled article no longer stops the remaining batch. Its transaction rolls back, a content-free failure event is attempted, processing continues, and the final scheduler-run summary records aggregate counts.
- Failure indicators automatically clear after an editor updates or reschedules the article. Historical audit records remain intact.
- Added a confirmed cancellation control. Cancellation locks the scheduled row, moves it back to draft, clears the schedule, creates a revision and records the actor in the audit ledger. Rescheduling returns the editor to the existing article wizard.
- Added read-only queue inspection and unit coverage for upcoming, due and post-edit failure states. Verification inherits every Sprint 16 gate and never invokes publication or cancellation.

Read-only queue inspection:

```powershell
npm run articles:queue:inspect
```

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint17Verify
```

## Sprint 18 - Editorial syndication and News SEO

Status: `IMPLEMENTED`, owner-run verification pending.

- Added a standards-based Greek RSS 2.0 feed at `/feed.xml` with stable absolute article/image URLs, publication dates, authors, categories and escaped editorial summaries.
- Added a dedicated Google News sitemap at `/news-sitemap.xml`. It includes at most 1,000 articles from the latest 48 hours and supplies publication, language, title, date and featured-image data.
- Both outputs share one cached repository boundary and contain only published, due, non-demo articles with an available local featured image. Drafts, review items, scheduled/future posts, archived content and protected demo fixtures remain excluded.
- Added explicit feed and News cache tags. Article publication, editing and the protected scheduled publisher invalidate these outputs immediately through the existing publication revalidation flow.
- Advertised the RSS feed through root metadata and added the News sitemap alongside the full sitemap in `robots.txt`.
- Extended existing `NewsArticle` JSON-LD with the real article category and safe canonical URL while retaining the established author, dates, publisher and image data.
- Added XML escaping, absolute-URL and 48-hour-window unit contracts, plus browser contracts for the two public XML routes. The read-only inspection prints counts only and never submits URLs to a search engine.

Read-only syndication inspection:

```powershell
npm run syndication:inspect
```

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint18Verify
```

## Sprint 19 - Public author authority and article archives

Status: `IMPLEMENTED`, owner-run verification pending.

- Upgraded the existing Δώρα Ιωακειμίδου biography into a canonical author archive backed by the real editorial `users` identity. The public profile catalog is explicitly allow-listed, so an admin, owner or other staff account cannot become publicly discoverable by accident.
- The archive presents biography, verified Facebook profile and bounded 12-story pagination. It contains only published, due, non-demo articles and never exposes email addresses, roles, login names or private editorial states.
- Article bylines now link to the canonical author page when the article belongs to a registered public profile. Other bylines remain plain text instead of generating empty or unsafe profile routes.
- `NewsArticle` JSON-LD now connects eligible articles to the same canonical author URL. The profile publishes matching `Person` structured data with the Acadimies organization relationship and approved social identity.
- Added responsive three-column desktop and two-column mobile story grids using the established shaped-card system, canonical pagination metadata, unit contracts for the public allow-list and browser coverage for biography, structured data, archive stories and article backlinking.
- Added a read-only readiness inspector that reports only route availability and aggregate published counts. It performs no database writes and prints no personal data.

Read-only author inspection:

```powershell
npm run authors:inspect
```

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint19Verify
```

## Sprint 20 - Public topic archives and editorial internal linking

Status: `IMPLEMENTED`, owner-run verification pending.

- Added crawlable `/topic/{slug}` archives backed by the existing editorial tags and post-tag relationships. Each page presents twelve newest stories using the established shaped-card system, with a three-column desktop and two-column mobile layout.
- Topic visibility is server-authoritative: only tags attached to published, due, non-demo articles resolve publicly. Empty tags and tags attached only to draft, review, scheduled, archived, future or protected demo content return not found.
- Published article headers expose their assigned topics as compact, non-clickable text tags. The same approved tag names still populate `NewsArticle.keywords`; topic archives remain available through their canonical URLs and sitemap entries without turning article tags into buttons.
- Added canonical page-one and paginated metadata, crawlable previous/next links and bounded pagination. Public topic landing pages are included in the main sitemap only when they contain eligible content.
- Added unit contracts for page parsing and canonical URLs, plus browser coverage that follows a real article topic into its archive. Existing publication visibility and author-authority contracts remain inherited.
- Added a read-only aggregate topic inspector. It prints counts only, performs no database writes and does not expose article titles or tag names.

Read-only topic inspection:

```powershell
npm run topics:inspect
```

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint20Verify
```

## Sprint 21 - Safe newsletter double-opt-in delivery

Status: `IMPLEMENTED`, owner-run verification pending.

- Completed the missing operational link in the existing consent lifecycle: pending `double_opt_in` outbox records can now be delivered through the established SMTP transport. Campaign outbox records are explicitly excluded and this sprint cannot send a newsletter campaign.
- Added bounded processing with a default batch of 20 and hard maximum of 50, a database advisory lock preventing overlapping workers, a three-attempt ceiling and generic stored failures that never persist credentials, tokens or recipient addresses in diagnostic text.
- Confirmation payloads are schema-validated before delivery. Invalid and expired requests are suppressed without sending; valid messages contain HTTPS confirmation and unsubscribe links, plain-text and HTML alternatives, and no tracking pixel.
- Delivery output is count-only and never prints subscriber emails or tokens. The ordinary command is a read-only dry run; SMTP delivery requires the separate explicit apply command.
- The homepage now presents accessible confirmed, unsubscribed and invalid/expired outcomes after the existing public routes redirect back to the newsletter section. Unknown query values are ignored and no token is reflected into page content.
- Added unit contracts for safe origins, URL construction and outcome copy, plus browser contracts for the three privacy-safe public states. Verification inherits Sprint 20 and runs only the confirmation dry run.

Read-only delivery inspection:

```powershell
npm run newsletter:confirmations:inspect
```

Explicit bounded delivery after verification and SMTP review:

```powershell
npm run newsletter:confirmations:deliver
```

Owner verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint21Verify
```

## Sprint 22 - AI-assisted article JSON authoring

### Scope

- New article creation keeps the existing button entry point and also appears as a first-class admin navigation item.
- The article editor can download a JSON template for the selected article template. The JSON is designed for a separate AI writing agent to fill core post fields, SEO, taxonomy IDs and the structured `contentDocument`.
- The editor can upload a filled JSON file and apply it to the form without saving to the database until the editor reviews and submits the article.
- Images stay in the same media picker workflow: choose from the library or upload a new JPG, PNG or WEBP. Admin uploads are authenticated, registered in `media_assets`, stored under `public/images/admin/...`, and capped at 300KB server-side.
- JSON files reference media IDs; they never embed image binaries or bypass alt text/media validation.

### Verification

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint22Verify
```

## Sprint 23 - AI article import review guardrails

### Scope

- Uploaded article JSON is validated and staged for review before it can change the editor form.
- The review panel lists the supported fields that will change and surfaces warnings for short titles, invalid slugs, missing currently loaded media IDs and permission-downgraded publication states.
- The editor can copy a ready-to-use AI prompt for the selected article template, including the current JSON skeleton and the media-ID rules.
- The media picker can copy the selected image details, including media ID, URL, label, alt text and dimensions, so another AI agent can reference exact media records without guessing.
- Malformed JSON and invalid `contentDocument` payloads are rejected in the editor and never submitted to the server.
- Verification inherits Sprint 22 and tightens the admin media upload protection contract.

### Verification

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint23Verify
```
