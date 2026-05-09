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

## RULE-005: Two-Tap Destructive Confirmation

**Effective:** 2026-05-08
**Status:** ACTIVE
**Originating Strike:** Post-Strike-012 launch polish (formal promotion of BRK-UI-003 from informal RULE-001 §3 sub-clause to first-class rule)
**Authoring authority:** Office Architect (per RULE-000)
**Canonical brick:** [`templates/bricks/two-tap-arm-pattern.js`](../../templates/bricks/two-tap-arm-pattern.js) (BRK-UI-003)

### Statement

Any UI control that destroys user data MUST require **two discrete taps** with a **4-second arm window**. The native browser primitives `window.alert()`, `window.confirm()`, `window.prompt()`, and any "Are you sure?" modal pattern are **forbidden**.

### Why

- **Anti-shame UX** (per `CLAUDE-base.md`) — destructive operations are a normal part of curation, not a moral failing requiring interrogation.
- **ADHD-aligned focus** — confirmation lives inline at the point of action; no context switch to a dismissable modal.
- **Compounds RULE-001 §3 + RULE-003** — destructive controls live in Options (RULE-001 §3) and wrap in two-tap confirm (this rule); selective destructive actions (RULE-003) inherit the same pattern when scope is non-trivial.
- **Visual state change does the cognitive work** — the user sees the button transition (label + color), so the confirmation is unambiguous without a verbal challenge.

### Required Mechanics

| Requirement | Specification |
|---|---|
| **Tap 1** | Button enters armed state: label changes (e.g., "Clear all captures" → "Tap again to confirm"), `dataset.armed="true"`, an `armClass` (typically `.is-armed`) is added, optional `armedHint` text appears |
| **Tap 2 (within 4s)** | Commits the destructive action, calls `onConfirm()`, then disarms |
| **Outside-click** | Cancels the arm silently — no toast, no log noise |
| **Timeout (>4s)** | Cancels the arm silently; button returns to default label |
| **Forbidden** | `window.alert()`, `window.confirm()`, `window.prompt()`, custom modal `<dialog>` confirmations, "Type DELETE to confirm" friction patterns |
| **Visual arm state** | MUST include both a label change AND a color/border shift so colorblind and label-skimming users both perceive the state |

### Implementation

```javascript
import { armDestructiveButton } from '../lib/bricks/two-tap-arm-pattern.js';

armDestructiveButton({
  button: document.querySelector('#clear-all-captures'),
  onConfirm: async () => {
    await wipeAllCaptures();
    toast('All captures cleared');
  },
  defaultLabel: 'Clear all captures',
  armedLabel: 'Tap again to confirm',
  defaultHint: 'Removes every saved capture from this device',
  armedHint: 'This cannot be undone — tap again within 4 seconds',
  timeoutMs: 4000,
});
```

### Compliance Verification

```
[ ] grep -rE '\b(alert|confirm|prompt)\(' src/ → returns no results (or only in comments)
[ ] grep -r '<dialog' src/ → no destructive-confirmation use of <dialog>
[ ] Every destructive control in options/ wired through armDestructiveButton or equivalent two-tap controller
[ ] Visual arm state confirmed: label change + color/border shift both present
[ ] Timeout (>4s) cancels silently — no toast, no error log
[ ] Outside-click cancels silently
```

### Reference Implementations

- `LLC-DIV-3-FACTORY/extensions/scripture-scout/options/main.js` — Clear-all-captures destructive control
- `LLC-DIV-3-FACTORY/extensions/migration-pilot/options/main.js` — Reset-to-defaults destructive control
- `LLC-DIV-3-FACTORY/extensions/clipboard/options/main.js` — clipboard's data-management actions (Phase 2 migration target)

### Relationship to RULE-001

RULE-001 §3 requires destructive controls to **live** in the Options page. RULE-005 governs **how** those controls confirm. Both rules apply simultaneously to every destructive action. RULE-001 §3's informal reference to "the canonical pattern is two-tap confirm with no `alert()`" is hereby promoted to this dedicated rule.

---

## RULE-006: Brand-Prefix Pill on Surface Titles AND in Extension Names

**Effective:** 2026-05-08 (v1.0); amended 2026-05-09 (v1.1 — extended scope to `manifest.json.name` + `_locales/{lang}/messages.json` `extName.message`)
**Status:** ACTIVE
**Originating Strike:** Post-Strike-012 launch polish (formalized after Clipboard Phase 1 surface-tag adoption proved cross-pillar viability)
**Amended in:** Strike-012 Final Cleanup Strike (2026-05-09) — extended from rendered surfaces only to ALSO include the chrome-toolbar tooltip / Web Store listing title (the `name` field).
**Authoring authority:** Office Architect (per RULE-000)

### Statement

Every side-panel header, every Options page heading, AND every extension `name` value **MUST** display a pillar-tinted "brand-prefix" pill (rendered surfaces) or pillar-tag string (the `name` field) **before** the product name. Allowed prefixes: `[OIA]`, `[864F]`, `[FHG]`. Inline plaintext (e.g., `OIA: TabVault`), omission, or any other prefix string is non-compliant. The pillar tag is now visible to the user in **three** places: their toolbar tooltip, their open side panel, and (when they open Options) the Options page heading. The Brand Firewall is therefore detectable at first-install before the user even clicks the icon.

### Why

- **Cross-surface brand firewall** (per `GTM_MANIFEST.md` §7) — the three pillars must be visually distinct at a glance across every shipped surface.
- **DOM-level enforcement** — the prefix lives in HTML, not in copy; styling drift is detectable via DOM inspection rather than visual review.
- **Recognizability across artifacts** — Chrome Web Store screenshots, support tickets, social-media demos, and marketing material all immediately convey which pillar a product serves without operator narration.
- **Compounds RULE-001** — the Options page heading inherits the prefix; no surface escapes the firewall.

### Required Mechanics

| Requirement | Specification |
|---|---|
| **HTML pattern** | `<h1 class="surface-title"><span class="brand-prefix brand-prefix--fhg">[FHG]</span> ScriptureScout</h1>` |
| **CSS class** | `.brand-prefix` styled as a UI-pill (radius-full, padding-x small) with a per-pillar modifier (`--oia`, `--flux`, `--fhg`) |
| **Pillar token mapping** | OIA → `var(--oia-sage)`; 864-Flux → `var(--oia-graphite)` (#374151); FHG → `var(--oia-bronze)` (#A67C52) |
| **Foreground contrast** | Charcoal/Slate text on the bronze/graphite/sage chip — verified WCAG AA against background |
| **Surfaces required (rendered)** | `sidepanel/index.html` `<header>` AND `options/options.html` page heading — both as pillar-tinted `<span class="brand-prefix brand-prefix--{pillar}">[XXX]</span>` |
| **Names required (string-form, v1.1)** | `manifest.json.name` value MUST contain the bracketed pillar tag at the start, OR — when `name` is `__MSG_extName__` — the `extName.message` in `_locales/{default_locale}/messages.json` MUST contain the bracketed pillar tag at the start. The pillar tag in the name field is rendered as plaintext by Chrome (no styled pill possible at this surface), but the bracket convention preserves the firewall semantics. |
| **Surfaces NOT required** | content scripts, background SW UI surfaces (none should exist), `manifest.json` `description` (handled separately by per-pillar copy guidelines), `manifest.json` `short_name` (free-form, used by Chrome only when `name` is too long) |
| **Forbidden** | inline-text prefix (e.g., "FHG: ScriptureScout"), emoji prefix, ASCII brackets baked into the title without `.brand-prefix` styling |

### Implementation

The pill is a copy-paste DOM idiom; no brick is needed.

```html
<!-- sidepanel/index.html -->
<header class="panel-header">
  <h1>
    <span class="brand-prefix brand-prefix--fhg">[FHG]</span>
    ScriptureScout
  </h1>
  <p class="tagline">Heritage-first technology. Preserving what matters most.</p>
</header>

<!-- options/options.html -->
<h1 class="oia-h1">
  <span class="brand-prefix brand-prefix--fhg">[FHG]</span>
  ScriptureScout — Settings
</h1>
```

```css
/* lib/oia-design-system.css (canonical) */
.brand-prefix {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--oia-radius-full);
  font-size: 0.85em;
  font-weight: var(--oia-weight-bold);
  letter-spacing: 0.5px;
}
.brand-prefix--oia  { background: var(--oia-sage);     color: var(--oia-text-on-sage); }
.brand-prefix--flux { background: var(--oia-graphite); color: var(--oia-text-on-graphite); }
.brand-prefix--fhg  { background: var(--oia-bronze);   color: var(--oia-text-on-bronze); }
```

### Compliance Verification

```
[ ] sidepanel/index.html <header> contains <span class="brand-prefix brand-prefix--{pillar}">[XXX]</span>
[ ] options/options.html top-level heading contains the same prefix span
[ ] CSS modifier class matches the extension's actual pillar (no FHG extension shipping --flux pill, etc.)
[ ] Inline plaintext brand prefix audited and removed (every match of /\[OIA\]|\[864F\]|\[FHG\]/ in rendered surfaces must be inside a .brand-prefix span)
[ ] WCAG AA contrast verified (manual or via axe-DevTools) for the chosen fg/bg combo
[ ] manifest.json.name starts with [OIA] / [864F] / [FHG] OR is "__MSG_extName__" with the corresponding extName.message in _locales/{default_locale}/messages.json starting with the bracketed tag (v1.1)
[ ] Repo-wide grep for /^"name":\s*"(?!\[(?:OIA|864F|FHG)\]|__MSG_extName__)/ in manifest.json files → no matches (v1.1)
```

### Reference Implementations

- **FHG**: `extensions/scripture-scout/sidepanel/index.html`, `extensions/scripture-scout/options/options.html`, `extensions/scripture-scout/_locales/en/messages.json` (`extName: "[FHG] ScriptureScout"` — currently the only fully v1.1-compliant extension)
- **864-Flux**: `extensions/clipboard/sidepanel/index.html` (Phase 1 launch polish), `extensions/migration-pilot/` — both need `extName` updated for v1.1 compliance
- **OIA**: `extensions/TabVault/sidepanel/index.html` — `extName` update needed for v1.1 compliance

### Out of Scope

- RULE-006 does NOT govern the product name *itself* (per-extension naming after the bracketed tag is delegated to Strike charter + 864z-TW).
- RULE-006 does NOT mandate a prefix on third-party surfaces (marketing site `<title>`, app-store metadata outside the manifest) — those follow GTM_MANIFEST per-pillar copy rules.
- RULE-006 does NOT prevent additional secondary tags (e.g., a "BETA" pill alongside the brand prefix).
- RULE-006 v1.1 does NOT require `short_name` to carry the prefix (Chrome falls back to `name` when `short_name` is absent, so the prefix flows through automatically).

### v1.1 Amendment Note (2026-05-09)

The original v1.0 Out-of-Scope clause stated: *"RULE-006 does NOT govern the product name itself."* That clause was scoped to the *human-readable name following* the bracketed tag — not to the bracketed tag itself, which v1.1 makes explicit by codifying that the pillar tag MUST appear at the start of the `name` field. Pre-v1.1 extensions whose `extName` lacks the bracketed tag are now in **violation** and require remediation per the Compliance Migration backlog. As of the amendment date, only `scripture-scout` is v1.1-compliant in `extName`; the remaining 14 extensions are non-compliant on this dimension.

---

## RULE-007: Secret Sovereignty

**Effective:** 2026-05-08
**Status:** ACTIVE
**Originating Strike:** Post-Strike-012 launch polish (formalized to gate the FHG / Founding-100 trust contract before Bible Insight or any AI-paired product ships)
**Authoring authority:** Office Architect (per RULE-000)

### Statement

Any user secret — API key, OAuth token, refresh token, passphrase, encryption key, sync credential — **MUST** live exclusively on the user's device, in `chrome.storage.local` (or platform-equivalent local storage). 864zeros code **MUST NEVER**:

1. Bundle a 864zeros-owned API key, service-account token, or shared secret into shipped extension code.
2. Proxy user secrets through any 864zeros-controlled server (telemetry endpoint, analytics gateway, AI inference gateway, sync service, or any other 864zeros-hosted infrastructure).
3. Transmit a user secret to any host other than the user-chosen provider's documented endpoint.
4. Log a secret value to console output, persisted analytics, error reports, or chrome.runtime stack traces.

**BYOK (Bring Your Own Key)** is the only sanctioned credential model for any extension that integrates a third-party paid service (LLM provider, cloud sync, payment processor, premium API, etc.).

### Why

- **Founding-100-grade trust gate** — vault-class users (the FHG cohort especially) cannot be asked to liberate their data into our orbit while we quietly broker their LLM bills or aggregate their study patterns.
- **Offline-first ethos** (per `CLAUDE-base.md`) — extensions must continue to function for the user's core flows when 864zeros infrastructure is offline, throttled, or sunset.
- **Liability isolation** — 864zeros never sees a user secret; if a user's machine is compromised, the blast radius does not extend to 864zeros infrastructure or other users' data.
- **Compounds RULE-001 §2** — the Options page Subscription & Tiers section must therefore reflect "you bring your own provider key" rather than disguising a metered 864zeros-proxy as a "Pro" tier.
- **Brand-firewall coherence** — undermining secret sovereignty on any one extension would corrode trust across all three pillars.

### Required Mechanics

| Requirement | Specification |
|---|---|
| **Storage namespace** | `chrome.storage.local` ONLY for secrets. `chrome.storage.sync` is **forbidden** for credentials (Google relays sync data through their cloud — leaks the secret across devices via a third party). |
| **Input UI** | API key field in Options page; `<input type="password">` masked by default with an explicit reveal toggle. |
| **Network destination** | Direct fetch from extension to provider's documented endpoint. ZERO requests to `*.864zeros.*` hosts when secrets are in play. |
| **Error reporting** | If errors are reported anywhere (Sentry, console, in-product error log), secrets MUST be redacted before the report is composed — not after. |
| **Telemetry exemption** | Anonymous usage analytics permitted IF AND ONLY IF: zero secrets transmitted, zero user-content payloads, explicit Options-page opt-in (default off), endpoint visibly disclosed in Privacy section. |
| **Disclosure** | Options page Privacy/Data section MUST contain plain-English text: "Your [provider] API key is stored only on this device and is sent only to [provider's documented endpoint URL]. 864zeros never sees this key." |
| **Bundled-secret audit** | Before each release, repo-wide grep for likely bundled secrets (see Compliance Verification below); release blocked on any positive hit. |

### Implementation

```javascript
// options/main.js — BYOK input handler
document.querySelector('#save-api-key').addEventListener('click', async () => {
  const key = document.querySelector('#api-key-input').value.trim();
  if (!key) return;
  // chrome.storage.local — NEVER .sync for secrets
  await chrome.storage.local.set({ provider_api_key: key });
  toast('Key saved locally — only sent to your chosen provider.');
});

// background/service-worker.js — direct provider call, never proxied
async function callProvider(prompt) {
  const { provider_api_key } = await chrome.storage.local.get('provider_api_key');
  if (!provider_api_key) throw new Error('No API key set — open Options to add one');
  return fetch('https://api.provider-of-user-choice.com/v1/...', {
    headers: { Authorization: `Bearer ${provider_api_key}` },
    body: JSON.stringify({ prompt }),
    method: 'POST',
  });
  // NOTE: zero requests to *.864zeros.* in this code path.
}
```

### Compliance Verification

```
[ ] Repo-wide grep for likely bundled secret literals (sk-... / AKIA... / ghp_... / Bearer constants) → no positive hits in shipped code
[ ] grep -r "storage.sync" src/ → no secret-related .sync writes
[ ] git log -p history scan for the same patterns → no historical leaks (run before any public-repo flip)
[ ] Service worker DevTools → Network tab during full smoke test with API key set → ZERO non-chrome:// requests to 864zeros-owned hosts
[ ] Options page Privacy/Data section contains plain-English secret-handling disclosure
[ ] Release pipeline blocked on any failed audit above
[ ] If telemetry enabled: explicitly opt-in, default off, disclosure visible
```

### Out of Scope

- RULE-007 does NOT forbid 864zeros from operating analytics services — provided they are anonymous, opt-in, secret-free, and content-free.
- RULE-007 does NOT forbid bundling keys for 864zeros-owned services that have NO per-user authentication (e.g., a public RSS feed key, a fonts CDN key without per-user quota). It applies specifically to credentials that authenticate a per-user paid relationship.
- RULE-007 does NOT forbid a future 864zeros-operated paid service. If such a service ships, it MUST use OAuth or per-user keys minted at signup, NEVER a shared secret bundled into extensions.

### Reference Implementations

- `LLC-DIV-3-FACTORY/extensions/clipboard/options/main.js` — BYOK API key flow for AI providers (canonical example; already compliant pre-rule).
- Bible Insight (FHG, planned) — MUST adopt this rule from day 1 of strike charter.
- Any future "Pro tier" feature that touches a third-party paid service — gated on RULE-007 compliance audit before release.

---

## RULE-008: Semantic Markdown Standard (`864z-markdown-standard`)

**Effective:** 2026-05-09
**Status:** ACTIVE
**Originating Strike:** Strike-012 Final Cleanup Strike (codifies a standard that had been informally inferred and applied across the 6 cross-repo Division READMEs and the 3 DIV-6 Master Documents in the days prior)
**Authoring authority:** Office Architect (per RULE-000)
**Canonical brick:** None — RULE-008 is a documentation contract, not a code primitive.

### Statement

Every authored Markdown document under `864zeros-ISD/`, `864zeros-llc/` (excluding generated build artifacts), or any DIV-6-targeted ingestion path **MUST** follow the `864z-markdown-standard` structure:

1. **Metadata header block** at the top — Authority, Loaded, Authored (with role + RULE-000 citation), Update protocol, Sources synthesized (when applicable), Format note (when applicable).
2. **Roman-numeral atomic body** (`## I.`, `## II.`, ...) — terse, NotebookLM-friendly atomic facts; tables for cross-cutting comparisons; no walls-of-text.
3. **Cross-references section** (`## {N}. Cross-References`) — every cited document linked with relative path.
4. **Versioning table** (`## {N+1}. Versioning`) — single-row-per-version provenance, append-only.
5. **Closing identification line** in italics — `*{Doc title} v{X.Y} · {YYYY-MM-DD} · 864zeros LLC · {division or purpose}.*`

### Why

- **NotebookLM / RAG ingestion determinism** — uniform structure means agents extract authority + dates + cross-refs reliably across documents.
- **Diff-friendly evolution** — append-only versioning + structural rigidity means semantic changes are visible in diff, not buried in formatting churn.
- **Authority traceability** — every document carries its author role + the rule under which it was authored; ingestion-side agents can compute trust with no out-of-band metadata.
- **Cross-document compounding** — atomic Roman-numeral sections enable `{doc} §X` citation discipline (already used informally across BUILD_KIT_RULES, OFFICE_ARCHITECT, GTM_MANIFEST, the 3 Master Documents).
- **Eliminates the "inferred standard" escape valve** — prior to this rule, 3 master documents and 6 READMEs cited the standard as "inferred — pending Office Architect codification." That escape valve is now closed.

### Required Mechanics

| Section | Format | Notes |
|---|---|---|
| **H1 title** | `# {Title} [v{X.Y}]` | Version in brackets so `grep '^# .*\\[v'` finds every governed doc |
| **Authority line** | `**Authority:** {who owns this doc + who reads it}` | First line of metadata block |
| **Loaded line** | `**Loaded:** {humans · agents · always · on-demand}` | Second line — explicit ingestion target |
| **Authored line** | `**Authored:** {YYYY-MM-DD} by {role} per RULE-000` | Always cite RULE-000 — every authored doc is a governed artifact |
| **Update protocol line** | `**Update protocol:** {append-only \| versioned \| supersession-by-RULE-XXX}` | Most documents append-only |
| **Sources synthesized** (optional) | `**Sources synthesized:** [{name}]({path}) · [{name}]({path}) · ...` | Required for synthesis docs (PILLAR_STRATEGY, TECH_STACK_AUDIT, ROADMAP) |
| **Format note** (optional, transitional) | `**Format note:** Follows the 864z-markdown-standard (RULE-008).` | Replaces the prior "inferred — pending codification" disclaimer |
| **Body sections** | `## I. {title}`, `## II. {title}`, ... | Roman numerals; sequential; no skipping |
| **Sub-sections** | `### I.a — {title}`, `### I.b — {title}`, ... | Letter suffix with em-dash separator |
| **Tables** | GFM tables for cross-cutting comparisons | Preferred over prose lists when ≥3 dimensions or ≥4 rows |
| **Code blocks** | Always include language hint (` ```javascript `, ` ```html `, ` ```css `, ` ```bash `) | Improves syntax highlighting + RAG signal |
| **Cross-references section** | Last-but-two | Bullet list with relative path links |
| **Versioning section** | Last-but-one | GFM table with `Version \| Date \| Changes` columns |
| **Closing identification line** | Last line | Italic; `*{Title} v{X.Y} · {YYYY-MM-DD} · 864zeros LLC · {context}.*` |

### Implementation

A new doc starts from this skeleton:

```markdown
# {Document Title} [v1.0]

**Authority:** {who owns + who reads}
**Loaded:** {ingestion target}
**Authored:** {YYYY-MM-DD} by {role} per RULE-000.
**Update protocol:** Append-only revisions with timestamps; supersession marked, never deleted.
**Sources synthesized:** [{src}]({path}) · ...
**Format note:** Follows the 864z-markdown-standard (RULE-008).

---

## I. {First atomic section}

{terse body}

---

## II. {Second atomic section}

{terse body — use a table when ≥3 dimensions of comparison are in play}

---

## {N}. Cross-References

- [{src}]({path}) — {one-line why}
- ...

---

## {N+1}. Versioning

| Version | Date | Changes |
|---|---|---|
| 1.0 | {YYYY-MM-DD} | Initial. {one-line summary of what's covered} |

---

*{Document Title} v1.0 · {YYYY-MM-DD} · 864zeros LLC · {context}.*
```

### Compliance Verification

```
[ ] First line matches /^# .* \[v\d+\.\d+\]$/
[ ] Metadata block contains Authority + Loaded + Authored + Update protocol lines (in any order, but all four present)
[ ] Authored line cites a role AND "per RULE-000"
[ ] Body sections numbered with Roman numerals (## I, ## II, ## III, ...)
[ ] Cross-References section present near end
[ ] Versioning section present at end with at least one row
[ ] Last line is italic, contains version + date + "864zeros LLC"
[ ] No body paragraph exceeds ~6 lines (atomic discipline; break into sub-sections instead)
[ ] All cross-doc links use relative paths (no absolute filesystem paths)
[ ] Code blocks (if any) include language hints
```

### Reference Implementations

- [`864z-build-kit/references/core/BUILD_KIT_RULES.md`](./BUILD_KIT_RULES.md) — the canonical metadata header pattern (this document itself); body uses `## RULE-XXX:` numbering rather than Roman numerals (acceptable variant for rule-codification documents — see Out of Scope §a)
- [`864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_PILLAR_STRATEGY.md`](../../../864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_PILLAR_STRATEGY.md) — canonical synthesis-doc example
- [`864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_TECH_STACK_AUDIT.md`](../../../864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_TECH_STACK_AUDIT.md) — canonical audit-doc example with class taxonomy + compliance matrix
- [`864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_2026_ROADMAP.md`](../../../864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_2026_ROADMAP.md) — canonical strategic-synthesis example
- [`864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_MASTER_CONTEXT.md`](../../../864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_MASTER_CONTEXT.md) — canonical terse-RAG example (acceptable variant: shorter than the full skeleton when content is genuinely atomic)
- 6 cross-repo Division READMEs (DIV-0 through DIV-6) — canonical 5-line atomic variant

### Out of Scope (Explicit)

a. **Rule-codification documents** (BUILD_KIT_RULES.md style) MAY use `## RULE-XXX:` section numbering instead of Roman numerals — the rule ID is more useful as the section anchor than the Roman numeral would be. All other RULE-008 mechanics still apply.
b. **Atomic 5-line READMEs** are an acceptable terse variant. They retain the H1 + Authority/Source-of-Truth/Governing-rules pattern but skip the Roman-numeral body. Used for division README placeholders that point at the actual source-of-truth file.
c. **Generated artifacts** (e.g., auto-built reports from `report_generator.py`, the strike outcome ledger) are exempt — they follow their generator's output format, not RULE-008.
d. **External-facing copy** (Web Store listings, marketing site copy, support docs) is governed by GTM_MANIFEST and `CLAUDE-base.md` voice rules, not RULE-008.
e. **Code comments and docstrings** are exempt — RULE-008 governs authored documents, not in-code documentation.

### Compliance Migration

The following pre-existing documents are RULE-008-compliant by construction (formatted to match the inferred standard before codification):
- The 3 DIV-6 Master Documents (PILLAR_STRATEGY · TECH_STACK_AUDIT · 2026_ROADMAP)
- The 6 cross-repo Division READMEs
- `BUILD_KIT_RULES.md` (this document)
- `864zeros-llc/GTM_MANIFEST.md`
- `864zeros-llc/ROLES/OFFICE_ARCHITECT.md`
- `864zeros-ISD/ISD-DIV-5-EVOLUTION/STRIKE_012_COMPLETE_SESSION.md`
- `864zeros-ISD/ISD-DIV-5-EVOLUTION/reports/OR_STRIKE_012_PREFLIGHT.md`

The "Format note" line in pre-codification documents may now be updated from `Follows the inferred 864z-markdown-standard (pending codification)` → `Follows the 864z-markdown-standard (RULE-008)` at the next routine touch on each document. No emergency back-patch is required — the rule applies prospectively to all NEW authored documents.

---

*Append future rules below. Rule numbers are sequential; rule IDs are immutable.*
