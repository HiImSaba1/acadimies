# Acadimies architecture

## Product boundary

Acadimies is a Greek-first digital newspaper for youth sports academies. The
public publication, editorial admin, and migration review tools share one
Next.js App Router application but have separate authorization and caching
boundaries.

## Runtime

- Next.js App Router with Server Components by default.
- TypeScript strict mode.
- MySQL database `next_acadimies`, administered locally through phpMyAdmin.
- Drizzle ORM with the `mysql2` driver.
- Server Actions for authenticated editorial mutations.
- Cache tags and explicit revalidation after publish/unpublish operations.
- Client Components only for browser-only interaction and animation.

## Editorial templates

Header and article templates use closed TypeScript registries. Database rows
store stable enum keys, never component paths or executable code. Resolution
order is article override, category default, then site default.

Header keys:

1. `minimal_editorial`
2. `classic_broadsheet`
3. `neon_sports`
4. `split_ticker`
5. `mega_menu_grid`

Article keys:

1. `longform`
2. `matchday`
3. `gallery`
4. `interview`

## Design and motion ownership

- The publication uses a Greek-first editorial serif/sans hierarchy, a warm
  paper surface, strong ink rules, and restrained sports accents.
- Lenis owns wheel-scroll smoothing and is not created for reduced-motion
  visitors.
- GSAP with ScrollTrigger owns scroll-linked reveals. Triggers are scoped and
  reverted, use `invalidateOnRefresh`, and add `will-change` only while active.
- Motion owns page presence and later admin layout transitions.
- CSS owns hover, focus, the news ticker, and all reduced-motion fallbacks.
- No element may have the same transform or opacity property concurrently owned
  by GSAP and Motion.

## Migration boundary

`WordPress.2026-09-14.xml` is an immutable source artifact. Inspection is
read-only and produces a safe report. Later sprints will stage complete records
in `legacy_import_*` tables. No imported row becomes a public post without an
explicit reviewer decision and transactional promotion.

The WXR file contains attachment metadata and remote URLs, not image binaries.
Media transfer therefore requires a separate fetch, checksum, validation,
storage, and reconciliation phase.

## Security rules

- Database credentials live only in ignored environment files.
- `DATABASE_URL` must target `next_acadimies`.
- Admin authorization is enforced in server-side mutation functions.
- Draft, review, quarantined, and scheduled content is never returned by public
  repository functions.
- Legacy HTML is sanitized before preview or persistence.
- Imports are repeatable through source and record SHA-256 checksums.
- Migration failures retain provenance and never silently discard content.

## Verification boundary

The owner runs executable project commands. Codex implements code and reviews
the resulting artifacts. A sprint is complete only after its current
`artifacts/verification/*-results.txt` and `*-failures.txt` files show a fresh
pass from the final code state.
