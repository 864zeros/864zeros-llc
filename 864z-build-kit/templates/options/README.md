# Canonical Options Page Template (RULE-001)

**Authority:** [`864z-build-kit/references/core/BUILD_KIT_RULES.md`](../../references/core/BUILD_KIT_RULES.md) → **RULE-001: Command & Control Standard**
**Effective:** 2026-05-08
**Reference implementation:** `LLC-DIV-3-FACTORY/extensions/migration-pilot/options/`
**Supersedes:** v1 Options Page Template (preserved at `_legacy-v1/`)

---

## What This Is

The **single mandatory pattern** for every 864zeros extension's Options page. Every extension must:

1. Ship `options/options.html`, `options/main.js`, `options/styles.css` (this folder, copy-pasted + genericized)
2. Wire `manifest.json → options_ui` to `options/options.html` with `open_in_tab: true`
3. Trigger via the canonical Cog header (`templates/sidepanel/header-component.js`)
4. Include all three RULE-001 sections in the prescribed order

---

## The Three Mandatory Sections (RULE-001)

| # | Section | Owns | Cannot live elsewhere |
|---|---|---|---|
| 1 | **How to Use** | User instructions, capture flows, escape hatches | Other surfaces may *repeat*, but Options is source of truth |
| 2 | **Subscription & Tiers** | Current tier, upgrade path, tipping | Inline upgrade nags in side panel are FORBIDDEN |
| 3 | **Data Management** | Destructive actions (Clear DB, Reset, Export-all) | Destructive controls outside Options are FORBIDDEN |

Why these three, why this home → see RULE-001 commentary in `BUILD_KIT_RULES.md`.

---

## Files

```
templates/options/
├── options.html          # Page structure with all 3 mandatory sections
├── main.js               # ESM controller — count display + Clear-all (two-tap confirm)
├── styles.css            # Extends OIA tokens (do NOT redefine tokens here)
├── README.md             # This file
└── _legacy-v1/           # Preserved v1 6-section scaffold (do not use for new builds)
    ├── options.html
    ├── options.css
    └── README.md
```

---

## Placeholders to Replace

Find-and-replace these tokens during scaffold-out. None are optional except where noted.

### Hero
| Placeholder | Replace With |
|---|---|
| `__APP_NAME__` | Extension name (e.g., `MigrationPilot`) |
| `__TAGLINE__` | One-liner — *optional, may be removed if absent* |
| `__PITCH_SENTENCE__` | 1-2 sentences explaining the core value |
| `__VERSION__` | Semantic version matching `manifest.json` |
| `__PILLAR__` | OIA \| general \| security \| etc. |

### How to Use (Section 1)
| Placeholder | Replace With |
|---|---|
| `__INSTRUCTION_1_TITLE__` ... `__INSTRUCTION_4_TITLE__` | Step titles |
| `__INSTRUCTION_1_BODY__` ... `__INSTRUCTION_4_BODY__` | Step bodies |
| `__HOWTO_FOOTNOTE__` | Closing tip / privacy note |

(Add or remove `<li>` items as needed; 3–6 steps recommended.)

### Subscription & Tiers (Section 2)
| Placeholder | Replace With |
|---|---|
| `__CURRENT_TIER__` | `Free` / `Pro` / etc. (computed at render time if applicable) |
| `__TIER_PROMISE__` | Privacy-equals-at-every-tier statement (per `CLAUDE-base.md`) |
| `__FREE_TIER_FEATURE_*__` | What's free |
| `__PRO_PRICE__` / `__PRO_FEATURE_*__` | Pro tier copy (or leave `(coming)`) |
| `__POWER_PRICE__` / `__POWER_FEATURE_*__` | Power tier copy |
| `__FUEL_BUILD_COPY__` | Tipping ask copy |

### Data Management (Section 3)
| Placeholder | Replace With |
|---|---|
| `__DATA_STAT_LABEL__` | "Captures stored locally" / "Clips stored locally" / etc. |
| `__DATA_LOCATION_NOTE__` | Where the data lives statement |
| `__DATA_NOUN__` | `captures` / `clips` / `notes` — used in button text and toast |

### Footer
| Placeholder | Replace With |
|---|---|
| `__BRAND_LINE_1__` | Brand line (e.g., `"Built for people with ADHD by someone with ADHD."`) |
| `__STRIKE_ID__` | Strike ID (e.g., `Strike 011`) |

---

## DB Module Contract (`main.js` import requirement)

`main.js` imports two functions from `../lib/db.js`:

```javascript
import { countAll, clearAll } from '../lib/db.js';
```

If your DB module names them differently (e.g., MigrationPilot uses `countCaptures` and `clearAll`), rename in your fork. The contract is:

| Function | Signature | Purpose |
|---|---|---|
| `countAll` (or domain alias) | `() => Promise<number>` | Total record count for the data-stat display |
| `clearAll` | `() => Promise<void>` | Wipe all records — used by Clear-all destructive action |

Per RULE-001, the destructive `clearAll` MUST live behind the two-tap confirm pattern (already wired in `main.js`).

---

## Broadcast Contract

`main.js` listens for and emits these runtime messages:

| Message | Direction | Purpose |
|---|---|---|
| `CAPTURE_ADDED` | inbound (from SW) | Refreshes count display |
| `CAPTURE_REMOVED` | inbound (from sidepanel) | Refreshes count display |
| `CAPTURES_CLEARED` | outbound (after Clear-all) | Tells sidepanel to re-render its empty state |

Rename per domain (e.g., `CLIPS_*`, `NOTES_*`) but keep the three-state pattern.

---

## Compliance Checklist (RULE-001)

Before shipping any extension, verify:

- [ ] `manifest.json → options_ui.page === "options/options.html"`
- [ ] `manifest.json → options_ui.open_in_tab === true`
- [ ] `options/options.html` links `../lib/oia-design-system.css`
- [ ] All `__PLACEHOLDER__` tokens replaced
- [ ] All three sections present in the prescribed order
- [ ] At least one destructive control in Section 3 (Clear DB, Reset, etc.)
- [ ] Side-panel header uses `mountPanelHeader()` from `templates/sidepanel/header-component.js`
- [ ] No `alert()` / `confirm()` / "Are you sure?" copy anywhere (per `CLAUDE-base.md`)
- [ ] No destructive controls in `sidepanel/`, `popup/`, or `content/`
- [ ] No upgrade nags / inline tier modals in `sidepanel/`, `popup/`, or `content/`
- [ ] `prefers-color-scheme: dark` looks correct (the OIA design system handles automatically)

---

## Why The v1 Template Was Superseded

The v1 template (preserved at `_legacy-v1/`) mandated **six** sections: Hero, General, Your Plan, Data, Fuel-the-Build, Footer. Field experience (Strikes 005–011) found:

- **General settings cards bloat the page** with knobs most users never touch — surfaces flagged "Are you sure I should care about this?"
- **Hero + Footer are infrastructure, not sections** — they belong but don't demand top-billing in the spec
- **Fuel-the-Build is owned by Tiers**, not separate — separating reduced perceived value of Free
- **The real value of Options is the three jobs nothing else can do**: teach, sell, and let users delete

RULE-001 collapses to those three. v1 is preserved for reference — and for legacy extensions still on the v1 spec — but new builds use this canonical scaffold.

---

*Template version: 2.0.0 (RULE-001 canonical) · 2026-05-08*
