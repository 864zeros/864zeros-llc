# 864zeros Bricks — Build-Kit Reusable Patterns

**Authority:** [`BUILD_KIT_RULES.md`](../../references/core/BUILD_KIT_RULES.md)
**Extraction protocol:** [`ISD-DIV-5-EVOLUTION/BACKLOG.md`](../../../../864zeros-ISD/ISD-DIV-5-EVOLUTION/BACKLOG.md)
**Registry source of truth:** [`ISD-DIV-0-CORE/BRICK_REGISTRY.json`](../../../../864zeros-ISD/ISD-DIV-0-CORE/BRICK_REGISTRY.json)

This directory contains **build-kit-level bricks** — small, single-file reusable patterns extracted from production strikes. They are workspace-wide; every 864zeros extension and SaaS product may import them.

> **Distinction from `LLC-DIV-3-FACTORY/shared/bricks/`:** That dir holds *operational* bricks tied to extension domains (markdown conversion, DOM scraping, IndexedDB). This dir holds *cross-cutting* patterns — UI primitives, MV3 platform fixes, destructive-action UX. They complement, not compete.

---

## Brick Index

| Brick | ID | Authority | Purpose |
|---|---|---|---|
| [`headless-download-uri.js`](./headless-download-uri.js) | BRK-DL-001 | RULE-002 | Trigger Chrome downloads from a service worker via Base64 data URI. Avoids broken `URL.createObjectURL` in MV3 SW context. |
| [`tristate-checkbox-list.js`](./tristate-checkbox-list.js) | BRK-UI-002 | RULE-003 | Manage selection state across a record list — master "Select all" tristate + per-item checkboxes + onChange callback. |
| [`two-tap-arm-pattern.js`](./two-tap-arm-pattern.js) | BRK-UI-003 | RULE-001 §3 | Destructive-action confirmation that complies with `CLAUDE-base.md` (no `alert()`, no "Are you sure?"). |
| [`accordion-record-v1/`](./accordion-record-v1/) | BRK-UI-004 | RULE-004 | Interactive Record Accordion — header/body/action-row with grid-template-rows transition + Bronze chevron rotation + Shift+Click multi-expand. **First directory-format brick** (ships JS + CSS + docs). |

---

## Extraction Protocol

These bricks are produced by the **Automated Brick Extraction** protocol, run from `ISD-DIV-5-EVOLUTION/BACKLOG.md`. Logic:

1. **Scan** `SYSTEM_STRIKE_LOG.md` for entries flagged `#BrickCandidate`.
2. **Audit** the source code referenced by each candidate entry — confirm it's reusable, has a clear contract, and isn't tied to extension-specific state.
3. **Extract** to this directory with a generic name (no extension-specific naming).
4. **Document** in this README + the registry.
5. **Codify** the rule it embodies in `BUILD_KIT_RULES.md` if not already.
6. **Log** the harvest in `SYSTEM_STRIKE_LOG.md`.

The protocol seeds itself: the three bricks above were the first batch, harvested from Strike 011 (MigrationPilot) on 2026-05-08.

---

## Usage Conventions

### Import path

Bricks are intended to be **copied** into an extension's local `lib/bricks/` (or equivalent), not symlinked or remotely imported. Reasons:

- MV3 extensions ship as static bundles — no runtime imports across project boundaries.
- Copying gives each extension a known-good snapshot. Future brick updates do not silently mutate shipped extensions.
- The build-kit copy is the **canonical source**; per-extension copies are derivative.

When updating a brick:
1. Update the canonical here.
2. Run a workspace-wide grep for derivatives (`grep -r "BRK-XX-NNN"`).
3. Refresh derivatives intentionally, per extension. Do not assume drift is OK.

### ESM, not CJS

Build-kit bricks ship as ESM (`export`). They drop directly into:
- `extension/background/service-worker.js` (manifest `"type": "module"`)
- `extension/sidepanel/main.js`
- `extension/options/main.js`
- `extension/lib/bricks/<brick-name>.js`

For CJS-style operational bricks (e.g., `agent-markdown-converter`), see `LLC-DIV-3-FACTORY/shared/bricks/`.

### Required CSS

UI bricks document required CSS in their JSDoc header. Hosts append the snippet to their stylesheet — bricks themselves never inject `<style>` tags. This keeps bricks framework-free and CSP-safe.

### Self-containment

Each brick:
- Has zero runtime dependencies on other bricks (you can drop one in without dragging the others).
- Depends only on standard browser/Chrome APIs and OIA design system tokens (defined in `oia-design-system.css`).
- Throws `TypeError` on bad inputs at the API boundary; logs `console.warn` on internal callback failures.
- Does **not** depend on `chrome.storage`, `IndexedDB`, or any extension-specific storage. Hosts wire data to the brick.

---

## Registry Sync

Each brick should be reflected in `ISD-DIV-0-CORE/BRICK_REGISTRY.json`. When you add a brick here, update the registry; when you update a brick's API, bump its registry entry's version. This is currently a manual step — automation queued in BACKLOG.

---

## Compliance Audits (Bricks → Rules → Extensions)

Bricks materialize the abstract rules in `BUILD_KIT_RULES.md`. The chain:

```
BUILD_KIT_RULES.md (rules)
   │
   ├─→ templates/bricks/   (canonical implementations)
   │      │
   │      └─→ extension/lib/bricks/   (per-extension copies)
   │             │
   │             └─→ extension code uses brick (compliance achieved)
```

When auditing an extension for rule compliance, check whether it imports the corresponding brick. Custom-rolled implementations of patterns covered by a brick are a compliance gap unless explicitly justified.

---

*Brick directory v1.0 — seeded 2026-05-08 from Strike 011 harvest.*
