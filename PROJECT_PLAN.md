# Acadimies implementation plan

## Goal

Rebuild Acadimies as a fast, accessible digital sports newspaper while
preserving legitimate historical WordPress content and isolating compromised or
irrelevant legacy records.

## Delivery principles

1. Greek-first editorial readability before decorative animation.
2. Server-rendered publication pages with small interactive islands.
3. Draft-safe admin operations and explicit publication transitions.
4. Closed, typed template registries rather than executable database content.
5. Dry-run, checksum, quarantine, review, and reconciliation before promotion.
6. Owner-run commands with inspectable UTF-8 verification artifacts.

## Content model

New articles use structured JSON editorial blocks. Sanitized HTML is retained
for legacy fidelity and progressively converted where useful. Revisions are
immutable snapshots. Publication state is server-authoritative.

## Performance budget

- Keep publication routes Server Component first.
- Use `next/image` derivatives with explicit dimensions and responsible LCP
  priority.
- Load GSAP, Lenis, Motion, carousel, and lightbox code only on routes that need
  them.
- Avoid concurrent ownership of the same animated property.
- Respect reduced motion and avoid permanent `will-change` declarations.

## Migration reconciliation

For every source record, the final migration must assign exactly one outcome:

`promoted + quarantined + intentionally excluded + failed = discovered`

Every failed record must include a reason; every promoted record must retain its
WordPress ID, source URL, source checksum, and redirect decision.
