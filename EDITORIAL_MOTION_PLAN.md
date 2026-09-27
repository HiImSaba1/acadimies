# Acadimies editorial motion and article-template plan

Status: `PROPOSED FOR REVIEW` — this document does not authorize implementation.

## Fixed editorial boundary

Acadimies is a standard newspaper-style blog about football-academy news in
Greece and abroad, coaching, parents' behaviour, child psychology, education,
wellbeing, and responsible youth development. It is not an academy directory,
academy-profile product, live-score service, match centre, betting experience,
player database, scouting platform, or statistical dashboard. International
reporting exists to bring useful ideas and perspective to Greek youth football,
not to rank or catalogue academies.

## Product direction

Create a cleaner, image-led digital newspaper for Greek youth sport. Motion must
support editorial hierarchy rather than behave like a decorative intro. The
Paper Tiger references provide interaction and pacing inspiration only; the
Acadimies typography, colors, navigation, information architecture, copy, and
component composition remain original.

## Resolved hydration warning

The reported mismatch is caused by `cz-shortcut-listen="true"` being added to
`<body>` by a browser extension after the server response. It is not emitted by
the Acadimies layout. We will confirm this in extension-free Playwright and will
not hide genuine React hydration problems with a global
`suppressHydrationWarning`.

## Motion contract

### Route transition

- Internal public navigation reveals the incoming page from bottom to top.
- The incoming page itself is the transition surface: no colored curtain,
  loader panel, or artificial background is placed above it.
- Initial state: incoming route clipped at the bottom (`inset(100% 0 0 0)`) and
  translated slightly downward.
- Final state: full incoming route (`inset(0 0 0 0)`) at its natural position.
- Duration target: 0.85–1.05 seconds with a smooth `power4.inOut` curve.
- Navigation, focus restoration, browser back/forward, hash links, modified
  clicks, external links, downloads, and failed navigation must remain correct.
- The transition must coordinate with Lenis and kill/rebuild ScrollTriggers only
  after the new route is committed.
- Reduced motion: immediate route replacement with no clip or translation.
- Admin routes use a fast functional transition and never inherit the public
  cinematic transition.

### Reusable split-text reveal

- Provide one accessible `AnimatedHeadline` primitive for page headings, article
  titles, hero-slide titles, cards, and major section headings.
- Preserve a single semantic text node for assistive technology; generated
  letters/words/lines are presentation-only.
- Support `letters`, `words`, and `lines` modes. Lines are preferred for long
  Greek headlines; letters are reserved for short display titles.
- Entrance combines masked vertical movement, opacity from approximately 0.15,
  and a subtle rotation (roughly 2–4 degrees), with restrained staggering.
- SplitText instances are reverted during cleanup and re-created after font load,
  container resize, locale change, or route transition.
- No layout shift: the unsplit server text establishes final dimensions before
  enhancement.
- Reduced motion shows final text immediately.

### Image reveal and parallax

- Images reveal with `clip-path` rather than scale-only effects.
- Parallax moves the image inside an overflow-hidden frame, not the layout box.
- Use `will-change` only while animating and clear it on completion.
- ScrollTrigger uses `invalidateOnRefresh: true`; every timeline and trigger is
  scoped and cleaned up.
- Next/Image dimensions, responsive `sizes`, focal point, alt text, and LCP
  priority remain database-driven.

## Proposed sprint sequence

### Sprint 08A — Motion infrastructure and route transitions

Deliverables:

- Public `RouteTransitionProvider` compatible with the Next.js App Router.
- Incoming-page bottom-to-top clip reveal with no transition overlay color.
- Central GSAP registration and motion-preference utilities.
- Reusable `AnimatedHeadline`, `ClipReveal`, and `ParallaxMedia` primitives.
- Lenis/ScrollTrigger lifecycle coordination across route changes.
- Remove animation duplication from existing homepage components.

Acceptance tests:

- Internal link reveals the actual destination page from bottom to top.
- Destination is usable after back/forward navigation and rapid repeated clicks.
- No hydration warning in clean Chrome/Playwright.
- No duplicate SplitText wrappers or orphaned ScrollTriggers after ten routes.
- Reduced-motion profile has no clip, stagger, rotation, autoplay, or parallax.
- Keyboard focus moves to the destination main heading.

### Sprint 08B — Latest-five editorial hero slider

Deliverables:

- Database query for the five latest published posts only; drafts and future
  posts are excluded.
- Hero constrained to a maximum of `70vh`, with a stable mobile minimum height.
- Image-led slider with masked line-title reveals and restrained metadata motion.
- Direction-aware image parallax between slides.
- Previous/next controls, pagination, keyboard operation, touch drag, and visible
  current-slide state.
- Optional autoplay (7–8 seconds), paused on hover, focus, drag, hidden tab, and
  reduced motion.
- Empty, one-post, and missing-image states that do not fabricate content.

Engineering reference:

- Reuse the lifecycle and interaction lessons from Santra Kimono's
  `TestimonialStack`: scoped GSAP, SplitText cleanup, pointer capture, drag
  threshold, timer pause/resume, and project-specific reduced-motion tests.
- Do not copy its testimonial data, styling, identity, or provisional copy.

Acceptance tests:

- Exactly the newest five eligible database posts appear in deterministic order.
- One slide exposes one semantic `h1`; inactive titles are not announced as the
  active heading.
- Controls work by keyboard and touch without horizontal page overflow.
- Autoplay never fights a user interaction.
- Hero stays at or below 70vh at desktop test sizes.

### Sprint 08C — Clean editorial homepage and animated story cards

Deliverables:

- Simplify the homepage into a strong newspaper rhythm: latest-five hero,
  editorial lead grid, category rails, latest reporting, interviews/gallery,
  and newsletter/footer zones.
- Story cards reveal media with clip-path on entry.
- Hover/focus adds a dark animated overlay; title lines enter through masks with
  small opacity and rotation changes.
- The underlying card title remains semantic and accessible when the animated
  overlay is presentation-only.
- Touch devices receive a persistent readable title treatment, not a hover-only
  experience.
- Homepage records come from publication repositories and persisted template,
  category, media, and article data.

Acceptance tests:

- Every card remains understandable without JavaScript, hover, or animation.
- Focus produces the same information as pointer hover.
- Overlay never reduces title contrast below WCAG AA.
- Cards do not animate off-screen or cause cumulative layout shift.
- Published database visibility rules remain unchanged.

### Sprint 08D — `clean_editorial` article template

Purpose: a restrained standard news/blog article inspired by the hierarchy of
the supplied Paper Tiger post, but designed as an Acadimies newspaper page.

Structure:

- Category eyebrow.
- Animated oversized article title.
- Author, publication/update date, reading time, and sharing controls.
- Dominant featured image with optional parallax.
- Narrow, highly readable body column with headings, quotes, images, captions,
  score blocks, and Q&A blocks.
- Related-post grid and category continuation.

Database/admin changes:

- Add `clean_editorial` to the persisted article-template contract.
- Select it from the existing admin article editor.
- Continue using the structured article JSON document, author, featured media,
  taxonomy, dates, SEO, and revision tables.

Acceptance tests:

- Route is canonical `/posts/[slug]`; IDs remain internal and legacy redirects
  resolve to the slug route.
- Server metadata, Open Graph data, Article JSON-LD, canonical URL, and publication
  dates come from the persisted post.
- Typography remains readable at 320px and wide desktop sizes.
- Title animation does not duplicate the heading for screen readers.

### Sprint 08E — `cinematic_feature` article template

Purpose: a visual feature/recap template for posts with strong photography.

Structure:

- Maximum-impact hero with database featured image, dark accessible overlay,
  parallax media, and animated word/line title.
- Editorial standfirst and metadata remain readable over all approved imagery.
- Alternating image/text and text/image sections (“chess” rhythm).
- Standard paragraph, heading, quote, score, Q&A, and full-width media blocks.
- Gallery blocks reveal images with clip-path and open into an accessible
  lightbox.
- Related stories return the reader to the newspaper hierarchy.

Database/admin changes:

- Add `cinematic_feature` to the persisted template enum.
- Extend structured content with a validated alternating-feature section and
  gallery block referencing `media_assets` IDs—not arbitrary client URLs.
- Admin controls hero overlay strength, focal point, layout direction, captions,
  and gallery order.

Acceptance tests:

- Missing hero/gallery assets fall back safely without broken layout.
- Alternation is visual only; DOM reading order remains logical.
- Gallery is keyboard operable, labelled, and reduced-motion safe.
- Parallax cannot obscure content or produce overflow.

### Sprint 08F — Editorial curtain footer

Purpose: finish every public page with a memorable newspaper-scale closing
section inspired by the Paper Tiger composition and the proven Sabaweb reveal
lifecycle, while retaining an original Acadimies identity.

Structure:

- Oversized closing statement or Acadimies wordmark occupying the primary visual
  field rather than a conventional compact footer.
- Clear rows below for publication navigation, editorial sections, useful links,
  social channels, contact, newsletter, legal pages, and copyright.
- A strong upper call-to-action appropriate to the publication, such as following
  academy news or submitting a story; final Greek copy requires approval.
- Footer content remains semantic server-rendered HTML and all destinations remain
  usable before animation initializes.
- Link groups will be driven by typed site configuration; category links may come
  from MySQL but legal/contact essentials retain safe static fallbacks.

Motion:

- The footer enters as a bottom-to-top curtain using its own content surface,
  starting at `clip-path: inset(100% 0 0 0)` and revealing to the full footer.
- The large statement follows with masked lines or letters; navigation and contact
  groups rise with short, restrained staggered opacity transitions.
- Use the Sabaweb implementation lessons: scoped `useGSAP`, a single ScrollTrigger
  timeline, `power4.inOut` reveal, temporary `will-change`, and timeline cleanup.
- Improve on the reference by using `invalidateOnRefresh: true`, explicitly
  restoring final styles when reduced motion is requested, and avoiding a
  client-generated year that could differ from server HTML.
- The footer curtain is independent of the route-transition curtain so the two
  timelines cannot overlap or leave the page clipped.

Acceptance tests:

- Footer is fully visible and navigable with JavaScript disabled and in reduced
  motion mode.
- Reveal runs once when the footer reaches the viewport and finishes with cleared
  `will-change` styles.
- All link groups have accessible navigation labels and visible keyboard focus.
- Oversized text never creates horizontal overflow from 320px through wide desktop.
- Footer content, newsletter behavior, and category links have truthful empty and
  unavailable states.
- Route navigation from a footer link cannot leave either route or footer clipped.

### Sprint 08G — Database activation and editorial integration

Deliverables:

- Generate and review the Drizzle migration for the current MySQL schema,
  including users, posts, revisions, audit events, media, taxonomy, and template
  enum additions.
- Provide an owner-run prepare action that targets only `next_acadimies`, checks
  the database name, applies migrations, and records artifacts without printing
  credentials.
- Provide a secure first-owner bootstrap that reads the password without placing
  it in command history or logs and stores only an Argon2 hash.
- Connect the public homepage and `/posts/[slug]` routes to published database
  records with explicit empty states.
- Add admin preview links for both new templates.

Safety gate:

- No migration, owner creation, seed, import, or publication occurs as part of a
  verification action. Prepare/apply remains a separate owner-run command.

### Sprint 09 — WordPress staging and media-aware review

- Preserve the existing quarantine-first import plan.
- Stage posts/pages/media metadata idempotently, map legacy content to the six
  templates, review in admin, and promote only approved records.
- Transfer and validate image binaries separately; never hotlink silently.
- Reconcile totals against the 6,183 inspected WXR items and retain source IDs,
  checksums, errors, and legacy redirects.

## Test matrix for every motion sprint

- Desktop Chrome, mobile Chrome, and reduced-motion projects.
- Hydration/console error assertion in a clean browser profile.
- Semantic heading, keyboard, focus, contrast, overflow, and touch contracts.
- GSAP cleanup and stable wrapper-count assertions after navigation.
- Database visibility and deterministic ordering unit tests.
- No animation-timing screenshot assertions; test stable DOM states and explicit
  motion contracts.
- Each sprint ends with one owner-run `SprintXXVerify` action and UTF-8 result and
  failure artifacts. We review its complete output before the next sprint.

## Decisions requested before implementation

1. Approve the two new persisted template keys: `clean_editorial` and
   `cinematic_feature`.
2. Confirm that the latest-five hero replaces the current lead story area rather
   than appearing above it.
3. Confirm whether hero autoplay should be enabled by default on desktop; the
   recommendation is enabled with strict pause rules and disabled for reduced
   motion.
4. Confirm the proposed order: motion foundation, hero, homepage cards, clean
   article, cinematic article, editorial curtain footer, database activation,
   then WordPress staging.
