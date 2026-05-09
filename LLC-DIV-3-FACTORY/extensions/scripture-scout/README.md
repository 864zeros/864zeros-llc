# [FHG] ScriptureScout

**FHG: For His Grace. Heritage-first technology. Preserving what matters most.**

A Chrome MV3 side-panel extension. Scaffolded 2026-05-08 from the MigrationPilot reference impl + the build-kit canonical bricks.

864zeros LLC | FHG (For His Grace) pillar | Strike 012 | v0.1.0 (scaffold)

> **What does FHG stand for?** *For His Grace.* The pillar's name is the dedication: a Heritage-first software practice built in service of the serious student of the Word. The `[FHG]` identifier prefix on every product surface (toolbar title, side-panel header, options page, manifest) is the visible commitment.

---

## Status

- ✅ **Scaffold complete** (extensions/scripture-scout/ — 16 inherited + new manifest, README, selectors stub)
- ✅ **FHG (For His Grace) Brand Firewall applied** — Charcoal & Bronze palette, [FHG] identifier, FHG mission, sibling-pillar branding fully purged
- ✅ **Quality Gate Q4** — `tests/profile-validator.js` validates BibleGateway sanitization, BLB metadata extraction, BibleHub interlinear table integrity. Run with `npm test`.
- ✅ **RULE-001** (Side-Panel + Options) — inherited from MigrationPilot
- ✅ **RULE-002** (Headless Download Pattern) — inherited from MigrationPilot service worker
- ✅ **RULE-003** (Selection & Curation UI) — inherited from MigrationPilot sidepanel
- 🛠 **Extraction Engine** — scaffold-only. `scripts/selectors.js` has 3 stub profiles (BibleGateway, Blue Letter Bible, Bible Hub), all selectors NULL pending Phase 2.
- ⏸ **Pre-flight scarcity scan** — pending (per BACKLOG charter); build is non-committal until the 8.64 scarcity gate passes.

---

## What This Is

ScriptureScout liberates scripture study (highlights, notes, commentary, cross-references) from proprietary Bible-study clouds into a sovereign Markdown vault (Obsidian, Capacities, Logseq, plain folders). Same migration/liberation thesis as MigrationPilot, but in the Faith / Heritage vertical.

**Wedge target:** YouVersion + Blue Letter Bible.
**Wave target:** Logos, Olive Tree, BibleGateway, Bible Hub, Accordance.

---

## Architecture

Inherits the MigrationPilot stack — see [`../migration-pilot/README.md`](../migration-pilot/README.md) for the full architecture diagram. Differences:

| Piece | ScriptureScout flavor |
|---|---|
| **Capture surface** | Same: marquee, full-page, right-click selection. Plus future: site-aware passage extraction via `scripts/selectors.js` profiles. |
| **Frontmatter spec** | Extends `864z-metadata` v1.0 with verse-ref array, cross-refs, lexicon (Strong's), and commentary author/work fields. *Spec extension pending implementation.* |
| **Brand palette** | Charcoal & Bronze (FHG) instead of Sage & Cream (OIA). Local `lib/oia-design-system.css` swaps `--oia-bg`, `--oia-text-*`, `--oia-sage` (now Bronze), `--oia-slate` (now Structural Charcoal). |
| **Identifier** | `[FHG]` prefix on all titles, distinct from the sibling pillar's identifier. |
| **Bio** | "Built for the serious student of the Word." — Faith/Heritage Architect's Bio, separate from sibling-pillar architect copy. |
| **Mission tagline** | "Heritage-first technology. Preserving what matters most." — appears on side panel header tagline + options hero pitch. |

---

## File Layout

```
scripture-scout/
├── manifest.json                    # MV3, FHG-named, side-panel + options_ui
├── README.md                        # this file
├── _locales/en/messages.json        # FHG strings ([FHG] ScriptureScout, FHG mission)
├── background/
│   └── service-worker.js            # ESM, message router, IndexedDB, downloads (RULE-002 pattern)
├── content/
│   └── marquee.js                   # plain script, drag-select overlay
├── sidepanel/
│   ├── index.html                   # main panel UI ([FHG] header, capture flow, RULE-003 selection)
│   ├── main.js                      # ESM, panel controller
│   └── styles.css                   # panel-specific layout (extends FHG-palette tokens)
├── options/
│   ├── options.html                 # General Settings + How to Use + Tiers + Data Mgmt + Architect's Bio + Footer
│   ├── main.js                      # ESM, theme selector + clear-DB + popover
│   └── styles.css                   # FHG palette accents (bronze popover border, brand-prefix)
├── lib/
│   ├── db.js                        # IndexedDB wrapper
│   ├── markdown-converter.js        # ESM port of canonical brick
│   └── oia-design-system.css        # FHG palette swap (Charcoal & Bronze)
├── scripts/
│   └── selectors.js                 # NEW — extraction profiles for biblegateway, blueletterbible, biblehub
└── icons/
    ├── generate-icons.html          # operator runs once → save 3 PNGs
    ├── icon16.png                   # placeholder (1×1 transparent)
    ├── icon48.png                   # placeholder
    └── icon128.png                  # placeholder
```

---

## Outstanding (in priority order)

1. **Pre-flight scarcity scan** — produce `OR-2026-05-XX-SCRIPTURESCOUT.md`. Strike doesn't proceed past scaffold until the 8.64 gate passes.
2. **Extraction Engine (Phase 2)** — fill in `scripts/selectors.js` profiles per real-site DOM inspection.
3. **YouVersion profile** — add to `selectors.js` once ToS legal review confirms scraping the user's own logged-in highlights is permitted.
4. **Citation frontmatter spec** — extend `864z-metadata` v1.0 with verse-refs / cross-refs / lexicon / commentary fields.
5. **Designed icons** — replace 1×1 placeholders with FHG-coherent designs (charcoal + bronze).
6. **Strong's concordance integration** — public-domain dataset, local-first, no API call.

---

## Compliance

| Rule | Status |
|---|---|
| RULE-001 (Command & Control Standard) | ✅ inherited — side panel + options_ui with 3 mandatory sections + General Settings card |
| RULE-002 (SW Download Pattern) | ✅ inherited — Base64 data URI in `runLiberation` |
| RULE-003 (Selection & Curation UI) | ✅ inherited — tristate checkbox list with selective Liberate |
| GTM_MANIFEST §6 (Standardized Footer) | ✅ implemented in both sidepanel and options |
| GTM_MANIFEST §7 (Slate & Sage palette) | ✅ adapted — Slate becomes Structural Charcoal, Sage becomes Bronze (FHG variant) |
| GTM_MANIFEST §8 (Theme Selector) | ✅ inherited — Auto/Light/Dark with FHG Light = Parchment & Bronze, FHG Dark = Charcoal & Bronze |

---

*Built for the serious student of the Word. Designed to bridge the gap between digital reading and a permanent, sovereign study vault. Iterated for precision; preserved for heritage.*

*864zeros LLC · Faith / Heritage pillar · Strike 012*
