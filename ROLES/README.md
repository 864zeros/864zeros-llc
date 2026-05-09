# 864zeros LLC — Roles Index

The 864zeros operating model runs on a small set of named roles. Each role has a defined mandate, decision authority, and deliverable contract. The same person may carry multiple roles in a session; the role headers signal *which authority is being exercised*.

This index lists active and stub roles. Each detailed profile lives in its own file in this directory.

**Established:** 2026-05-08 · post-Strike 012 finalization

---

## Active Roles

### `864z-OA` — Office Architect
**File:** [`OFFICE_ARCHITECT.md`](OFFICE_ARCHITECT.md) · **Status:** ACTIVE (lead)

The Office Architect orchestrates the 864zeros assembly line — three-pillar brand firewall (OIA / 864-Flux / FHG), build-kit rule governance, GTM gate, and pillar-specific reverence (notably FHG's sovereign-research clause for theological data). Sign-off authority on brick promotions, rule codification, palette evolutions, strike charters, and compliance audits. See profile §VI for full sign-off boundaries.

---

## Stub Roles (defined here, profiles pending)

The following roles are referenced in build-kit rules and `OFFICE_ARCHITECT.md` §VI but do not yet have full profiles. Each will get its own file when the role's mandate is exercised at sufficient scale to warrant codification.

### `864z-SE` — Systems Engineer
**File:** *(stub — not yet drafted)* · **Status:** ROLE STUB

The Systems Engineer executes per-strike implementation decisions: scaffolding extensions, fixing defects (e.g., MV3 service-worker quirks like the RULE-002 Base64 download path), wiring features end-to-end, and writing the validation harnesses (e.g., `tests/profile-validator.js` for ScriptureScout). Operates under Office Architect sign-off for cross-cutting concerns; autonomous within a single strike's scope. Delivered the Strike 011 / 012 implementation work.

### `864z-LA` — Lead Assembler
**File:** *(stub — not yet drafted)* · **Status:** ROLE STUB

The Lead Assembler integrates ready bricks into a shippable extension scaffold — composing manifest, side panel, options, content scripts, and lib modules from the build-kit canonical sources into a `ready-to-load unpacked` developer-mode artifact. Distinct from the Systems Engineer in that the Assembler does not write new logic; they connect existing bricks per the strike's Lead Assembler directive (e.g., Strike 011's MigrationPilot scaffold).

### `864z-TW` — Technical Writer
**File:** *(stub — not yet drafted)* · **Status:** ROLE STUB

The Technical Writer produces and maintains the documentation surfaces that support strikes and operations: extension `README.md` files (Hook / Commercial Gate / Technical Blueprint pattern), `BACKLOG.md` charters, `SYSTEM_STRIKE_LOG.md` entries, brick READMEs, and the GTM Build Report mandated by `OFFICE_ARCHITECT.md` §IV. Voice rules are codified in `CLAUDE-base.md` (no shame, no streaks, no "Are you sure?", per-pillar tone).

---

## Future Roles (placeholder)

Additional roles may be codified as the operating model scales (e.g., Compliance Auditor, Brand Steward, Customer Liaison, Deployment Engineer). Each gets a new file in this directory + a row in this index when its mandate first matters.

---

## Cross-References

- [`../GTM_MANIFEST.md`](../GTM_MANIFEST.md) — brand canon, pillar palettes, standardized footer
- [`../864z-build-kit/references/core/BUILD_KIT_RULES.md`](../864z-build-kit/references/core/BUILD_KIT_RULES.md) — RULE-000 (governance, gates Office Architect sign-off)
- [`../LLC-DIV-3-FACTORY/CLAUDE-INTEGRITY.md`](../LLC-DIV-3-FACTORY/CLAUDE-INTEGRITY.md) — process honesty rules

---

*ROLES index v1.0 · 2026-05-08 · 864zeros LLC*
