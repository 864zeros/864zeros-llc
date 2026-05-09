# 864zeros Build-Kit Rules

**Authority:** Global. Every 864zeros extension and SaaS product must comply.
**Loaded:** Always — alongside `CLAUDE-base.md` and platform companion specs.
**Authored:** 2026-05-08 (by the Principal Architect, post-Strike 011 / MigrationPilot).
**Update protocol:** Append-only. Existing rules are never deleted; if superseded, mark `STATUS: SUPERSEDED-BY-RULE-XXX` and leave in place.

This file is the canonical record of *cross-cutting* product constraints. It complements (does not replace) `CLAUDE-base.md` (universal principles), `CLAUDE-extension.md` (platform mechanics), and `CLAUDE-INTEGRITY.md` (process honesty). When a rule here conflicts with a per-extension brief, the rule wins — briefs cannot opt out.

---

## RULE-000: Architectural Governance

**Effective:** 2026-05-08
**Status:** ACTIVE
**Authority:** Office Architect (`864z-OA`) — see [`ROLES/OFFICE_ARCHITECT.md`](../../../ROLES/OFFICE_ARCHITECT.md)

### Statement

All brick promotions and architectural pivots must be signed off per the standards in [`ROLES/OFFICE_ARCHITECT.md`](../../../ROLES/OFFICE_ARCHITECT.md).

### Scope

Sign-off authority of the Office Architect (per OFFICE_ARCHITECT.md §VI):
1. New brick promotion to `864z-build-kit/templates/bricks/`
2. New rule codification in this file (`BUILD_KIT_RULES.md`)
3. Pillar additions or palette evolutions in `GTM_MANIFEST.md`
4. Strike charters before pre-flight scarcity scan
5. Compliance audits (RULE-001 / RULE-002 / RULE-003) before any extension's major-version release

Decisions outside this scope (per-strike implementation choices, copy variations within a pillar's voice) are delegated to the executing role (Systems Engineer, Lead Assembler, Technical Writer).

This rule is meta-procedural — it gates HOW rules below are added, not WHAT they say. Subsequent rules (RULE-001+) carry their own substantive product mandates.

---

## RULE-001: The Command & Control Standard

**Effective:** 2026-05-08
**Status:** ACTIVE
**Originating Strike:** 011 (MigrationPilot)
**Authoring authority:** Principal Architect

### Statement

Every 864zeros extension **must** ship a Cog-triggered Options page (`options_ui`). The Options page is the **mandatory home** for three concerns. It cannot be split across multiple surfaces; it cannot be omitted; it cannot be deferred to "v2".

### Required Mechanics

| Requirement | Specification |
|---|---|
| **Manifest entry** | `"options_ui": { "page": "options/options.html", "open_in_tab": true }` |
| **Directory** | `options/` at extension root, containing `options.html`, `main.js`, `styles.css` |
| **Trigger** | Cog icon in the side-panel header, top-right, calling `chrome.runtime.openOptionsPage()` |
| **Cog component** | Use the canonical `sidepanel/header-component.js` from `864z-build-kit/templates/sidepanel/` |
| **Theme** | Sage-Green / Nunito OIA design tokens via `../lib/oia-design-system.css` (loaded verbatim, not redefined) |
| **Page width** | Open in tab (`open_in_tab: true`); responsive container max-width 720px |

### Mandatory Sections (in this order)

The Options page **must** include all three. Section ordering is fixed.

| # | Section | Owns | Cannot Live Anywhere Else |
|---|---|---|---|
| **1** | **How to Use** | User Instructions — step-by-step onboarding, capture flows, keyboard shortcuts, escape hatches | The side panel, README, marketing site, or chrome-store description **may** repeat the instructions, but the Options page is the source of truth. |
| **2** | **Subscription & Tiers** | Payment Tiering — current tier, available tiers, upgrade CTAs, tipping ("Fuel the Build"), feature-gating disclosures | Inline upgrade nags within the side panel are **forbidden**. Tier displays anywhere else must link to this section. |
| **3** | **Data Management** | Destructive Data Actions — Clear DB, Export-all, Reset to defaults | Destructive actions in the side panel context menu, or popup, or anywhere else are **forbidden**. The Options page is the only legal home for destructive operations. |

### Why These Three, Why This Home

- **Discoverability:** A first-time user opens the side panel and sees a working tool. The Cog is the visible escape hatch to *learn more*, *upgrade*, or *reset* — three concerns the side panel must remain free of.
- **ADHD-aligned UX (per `CLAUDE-base.md`):** One primary action per screen. The side panel does the work; the Options page handles meta-concerns. Mixing them violates "one primary action".
- **Anti-shame copy (per `CLAUDE-base.md`):** Destructive actions in the operational surface (side panel) tempt the user into accidental loss. Forcing them into Options creates friction by design — the *good* kind.
- **Trust contract:** Tier disclosures live in one auditable place. Users who want to know what they're paying for don't hunt for it.

### Implementation Pattern

Follow the canonical scaffold at `864z-build-kit/templates/options/`. Files are generic and contain `__APP_NAME__`-style placeholders. Genericize by find-replace; do not deviate from the structural skeleton.

**Cog header pattern:** Import and call the canonical mount function from `864z-build-kit/templates/sidepanel/header-component.js`:

```javascript
import { mountPanelHeader } from './header-component.js';
mountPanelHeader({
  title: 'YourExtension',
  tagline: 'Optional subtitle',
  mountTarget: document.querySelector('header.panel-header'),
});
```

The mount function attaches the cog click → `chrome.runtime.openOptionsPage()` automatically. Override via `onSettingsClick` if a custom navigation target is required.

### Compliance Verification

A new extension passes RULE-001 when the following **all** evaluate true at build time:

```
[ ] manifest.json has options_ui.page === "options/options.html"
[ ] manifest.json has options_ui.open_in_tab === true
[ ] options/options.html exists and links ../lib/oia-design-system.css
[ ] options/options.html includes a section labelled "How to Use" (or semantic equivalent)
[ ] options/options.html includes a section labelled "Subscription & Tiers" (or "Tiers" / "Plan")
[ ] options/options.html includes a section labelled "Data Management"
[ ] options/options.html has at least one destructive control (Clear DB, Reset, etc.)
[ ] sidepanel/index.html (or equivalent) has a cog button with id="open-options"
[ ] sidepanel main.js calls chrome.runtime.openOptionsPage() on cog click
[ ] No destructive controls live in any sidepanel/, popup/, or content/ surface
[ ] No upgrade-nag inline modals live in any sidepanel/, popup/, or content/ surface
```

### Reference Implementation

`LLC-DIV-3-FACTORY/extensions/migration-pilot/` is the reference implementation as of 2026-05-08. Treat it as the authoritative example when the templates are ambiguous.

### Out of Scope (Explicit)

RULE-001 does **not** mandate:
- Specific tier price points (per-app, per `CLAUDE-base.md` monetization framework)
- Specific Clear-DB UX (the canonical pattern is two-tap confirm with no `alert()`; alternate patterns OK if no `alert()` / `confirm()` per `CLAUDE-base.md`)
- The presence of additional optional sections (extensions may add a "Privacy", "About", or "Keyboard shortcuts" card — these are additive and discretionary)

### Supersession

This rule supersedes the v1 Options Page Template (`864z-build-kit/templates/options/_legacy-v1/`), which mandated 6 sections (Hero, General, Your Plan, Data, Fuel-the-Build, Footer). The v1 template is preserved for reference and historical builds; new builds **must** use the RULE-001 canonical scaffold.

---

## RULE-002: Service Worker Download Pattern

**Effective:** 2026-05-08
**Status:** ACTIVE
**Originating Strike:** 011 (MigrationPilot) — SW-DL-FIX 2026-05-08
**Authoring authority:** Systems Engineer
**Canonical brick:** [`templates/bricks/headless-download-uri.js`](../../templates/bricks/headless-download-uri.js) (BRK-DL-001)

### Statement

Every download initiated from a Manifest V3 service-worker context **must** use a Base64 data URI (or a `TextEncoder` equivalent for large payloads). `URL.createObjectURL(blob)` is **forbidden** inside the service worker.

### Why

`URL.createObjectURL` was unsupported in MV3 service workers pre-Chrome 110, and remains unreliable post-110: blob URLs are scoped to a document context the SW does not own, leading to intermittent silent failures. The download appears to succeed, no file lands. The Base64 data-URI pattern is a self-contained URL the downloads API resolves without any SW-scope blob registry.

### Required Mechanics

| Requirement | Specification |
|---|---|
| **Encoding chain** | `btoa(unescape(encodeURIComponent(content)))` — UTF-8-safe, idiomatic, supported in every Chrome version that runs MV3 |
| **URL form** | `'data:' + mimeType + ';base64,' + encoded` |
| **Download call** | `chrome.downloads.download({ url, filename, conflictAction, saveAs })` |
| **Forbidden** | `new Blob([...]) → URL.createObjectURL(blob)` inside `background/service-worker.js` |
| **Permitted in non-SW contexts** | Sidepanel, options, content scripts may use blob URLs (different document scope) — but consistent use of the brick simplifies cross-context refactoring |

### Implementation

Use the canonical brick:

```javascript
import { downloadAsMarkdown } from '../lib/bricks/headless-download-uri.js';

await downloadAsMarkdown(content, filename, {
  subdirectory: 'my-extension',
  conflictAction: 'uniquify',
});
```

Or the general form for non-Markdown payloads (`downloadAsJson`, `downloadAsDataURI`).

### Compliance Verification

```
[ ] grep -r 'URL.createObjectURL' background/  → returns no results (or only in comments)
[ ] grep -r 'new Blob' background/             → returns no results (or only in comments)
[ ] All chrome.downloads.download calls in SW use data: URIs
[ ] If using the brick: import path is correct and headless-download-uri.js is present in lib/bricks/
```

### Out of Scope

- RULE-002 does not apply to *uploads*. The browser's native upload mechanisms work fine in SW.
- RULE-002 does not apply to *fetched* downloads (where Chrome itself fetches a URL). Only applies when the SW supplies content it generated.
- For payloads exceeding the practical Base64 / data-URI size (~megabytes), consult the brick's docstring on the `TextEncoder` chunked alternative.

---

## RULE-003: Selection & Curation UI

**Effective:** 2026-05-08
**Status:** ACTIVE
**Originating Strike:** 011 (MigrationPilot) — Selective Liberation refactor
**Authoring authority:** Systems Engineer
**Canonical brick:** [`templates/bricks/tristate-checkbox-list.js`](../../templates/bricks/tristate-checkbox-list.js) (BRK-UI-002)

### Statement

Any 864zeros extension that maintains a **queue or list of records** (captures, clips, notes, todos, drafts, downloads, or similar) **must** offer per-record selection via checkboxes plus a master "Select all" tristate, and **must** offer a Selective Export / Selective Action mode rather than all-or-nothing operations.

### Why

- **Avoid destructive accidents:** "Liberate all" and "Clear all" are foot-guns when the user only wants to act on three of fifty records. Force a deliberate selection.
- **Respect curation:** Knowledge workers triage their queues. The default "operate on everything" denies that work.
- **ADHD-aligned UX (per `CLAUDE-base.md`):** "One primary action per screen" → the action is *export the selected*, not *export, then maybe regret*.
- **Compounds with RULE-001 §3:** destructive actions live in Options *for blanket destruction*; selection-scoped destructive actions remain inline because they're context-bound and intentional.

### Required Mechanics

| Requirement | Specification |
|---|---|
| **Per-record checkbox** | Each record card/row has an `<input type="checkbox" class="oia-checkbox">` |
| **Master checkbox** | `id="select-all"` checkbox above the list with tristate (all / some / none → indeterminate / unchecked) |
| **Live counter** | Visible "N selected of M" indicator updating on every change |
| **Selected visual state** | Records with `--selected` class show sage-green border + tinted background (per OIA design system) |
| **Action button state** | Selective-action button disabled when 0 selected; label includes count when N>0 (e.g., "Liberate 3 to Markdown") |
| **No-op blocked** | Action handlers MUST refuse to act on an empty selection — server-side filter, not just disabled-button reliance |
| **Cleanup prompt** | After successful selective destructive-export action, offer inline "Clear selected from list" / "Keep them" — auto-dismiss after ≥8 seconds |

### Where It Does NOT Apply

- Single-record-at-a-time tools (e.g., a "current page screenshot" feature with no queue) → no list, no rule.
- Settings/options UI → governed by RULE-001 §3 instead.
- Read-only dashboards with no destructive or export actions → no rule application.

### Implementation

Use the canonical brick:

```javascript
import { TristateSelection } from '../lib/bricks/tristate-checkbox-list.js';

const sel = new TristateSelection({
  masterCheckbox: document.querySelector('#select-all'),
  itemCheckboxSelector: '.capture-checkbox',
  getItemId: (cb) => Number(cb.closest('[data-id]').dataset.id),
  selectedClassTarget: (cb) => cb.closest('.capture-card'),
  selectedClass: 'capture-card--selected',
  masterLabelEl: document.querySelector('#select-all-text'),
  onChange: (ids) => updateExportButton(ids),
});

// after re-rendering the list:
sel.refresh();
```

### Compliance Verification

```
[ ] List of records → each record has a checkbox
[ ] Master "Select all" checkbox present with tristate behavior
[ ] Selective-action button disabled when 0 selected
[ ] Selective-action handler refuses empty-selection request
[ ] Selected records have visible sage-green-accented state
[ ] Cleanup prompt appears after destructive-export successful action
[ ] grep for 'all-or-nothing' patterns: action functions that operate on `getAllRecords()` instead of `getSelectedRecords()` → fail
```

### Reference Implementation

`LLC-DIV-3-FACTORY/extensions/migration-pilot/sidepanel/main.js` is the reference. The Liberate flow is the canonical example of a selective destructive-export with cleanup prompt.

---

## RULE-004: Interactive Record Accordion

**Effective:** 2026-05-08
**Status:** ACTIVE
**Originating Strike:** 012 (ScriptureScout) — sidepanel accordion refactor
**Authoring authority:** Office Architect (per RULE-000)
**Canonical brick:** [`templates/bricks/accordion-record-v1/`](../../templates/bricks/accordion-record-v1/) (BRK-UI-004)

### Statement

Any extension utilizing a queue-of-records (e.g., captures, notes, logs) **must** implement the Accordion behavior:

- **Header (Metadata)** — always-visible row with title, timestamp, source, and a Bronze chevron that rotates 90° on expand.
- **Body (Expanded Content)** — hidden until the user expands; transitions smoothly via `grid-template-rows`. Contains the full record on a Parchment reading surface.
- **Action Row** — at least one primary action button inside the body so the user can verify content before acting on it.

Support for **Shift+Click multi-expand (Compare Mode)** is **required**. Default behavior is exclusive (one open at a time) for ADHD-friendly focus; Shift+Click temporarily overrides for side-by-side comparison.

### Why

- **ADHD focus:** A flat list of fully-visible records overwhelms. Exclusive expand keeps the panel calm — only the record the user is currently working with is open.
- **Verify-before-action:** The expand-to-read pattern means destructive or high-value actions (Liberate, Export, Send) live INSIDE the expanded body — the user always sees what they're about to act on.
- **Compare without losing state:** Shift+Click multi-expand lets users open two captures side-by-side (e.g., parallel translations) without leaving the panel.
- **Compounds RULE-001 + RULE-003:** Selection checkboxes (RULE-003) live in the header; the expanded body provides the verification surface for selective destructive operations (RULE-001 §3).

### Required Mechanics

| Requirement | Specification |
|---|---|
| **Brick** | `templates/bricks/accordion-record-v1/` (BRK-UI-004) |
| **HTML structure** | `.accordion-record[data-record-id]` → `.accordion-record__header` + `.accordion-record__body-wrapper > .accordion-record__body` |
| **Chevron** | Bronze (`var(--oia-accent)`), rotates 90° on `.accordion-record--expanded` |
| **Body transition** | `grid-template-rows: 0fr → 1fr` with `transition: grid-template-rows 0.3s ease-out` |
| **Reading surface** | Light Parchment background (#F5F5F5 default; override via `--oia-reading-surface`) with deep-brown text and inner shadow |
| **Action row** | At least one button; primary action uses `.accordion-record__action--primary` (Bronze pill) |
| **Default expand mode** | Exclusive (one open at a time) |
| **Shift+Click multi-expand** | REQUIRED |
| **Keyboard a11y** | Header is `role="button" tabindex="0"` with `aria-expanded`/`aria-controls`; Enter and Space toggle |
| **Reduced motion** | `prefers-reduced-motion: reduce` removes transitions (handled by brick CSS) |

### Implementation

```javascript
import { AccordionController, createChevronSVG } from
  '../lib/bricks/accordion-record-v1/index.js';

const accordion = new AccordionController({
  container: document.querySelector('.accordion-list'),
  // exclusive: true (default) — one open at a time
  // shiftMultiExpand: true (default) — REQUIRED per this rule
  onChange: (expandedIds) => persistState(expandedIds),
});

// After re-rendering the list:
accordion.refresh();
```

The brick handles event delegation, ARIA sync, and Shift-key detection. Hosts build the record DOM (per the HTML contract in `accordion-record-v1/usage.md`) and let the brick attach behavior.

### Compliance Verification

```
[ ] Extension queue UI imports accordion-record-v1 brick (or equivalent)
[ ] AccordionController instantiated with shiftMultiExpand: true (or omitted — default)
[ ] Each record element has data-record-id
[ ] Header role="button", tabindex="0", aria-expanded sync verified
[ ] grid-template-rows transition present in CSS
[ ] Chevron has rotation rule for .accordion-record--expanded
[ ] Action row contains a primary action accessible only after expand
[ ] Parchment reading surface (#F5F5F5 or pillar override)
[ ] Inner shadow visually separates body from header
[ ] Manual test: Shift+Click opens multiple records simultaneously
```

### Reference Implementation

`LLC-DIV-3-FACTORY/extensions/scripture-scout/sidepanel/{main.js,styles.css}` is the inline reference (uses `capture-card-*` class names rather than `accordion-record-*`). Source extension may continue with its own class naming; new extensions should use the canonical brick class names so future drop-in upgrades work seamlessly.

---

*Append future rules below. Rule numbers are sequential; rule IDs are immutable.*
