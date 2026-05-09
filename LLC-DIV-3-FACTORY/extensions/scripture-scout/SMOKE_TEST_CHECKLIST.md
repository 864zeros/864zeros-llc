# [FHG] ScriptureScout — Operator Smoke Test Checklist

**Companion to:** [`../../864zeros-ISD/ISD-DIV-5-EVOLUTION/reports/OR_STRIKE_012_PREFLIGHT.md`](../../../864zeros-ISD/ISD-DIV-5-EVOLUTION/reports/OR_STRIKE_012_PREFLIGHT.md) §3.1
**Time budget:** **~10 minutes**
**Target:** Each release candidate before sharing with the Founding 100
**Exit:** zero failed steps. Any failure → log defect, fix, re-run from step 0.

---

## How to use

1. Copy this file's checklist (the `- [ ]` lines below) into your notes app or a fresh `.md` doc.
2. Tick boxes as you go.
3. If anything fails: stop, capture a screenshot + the failing browser console output, paste both into `SYSTEM_STRIKE_LOG.md` under a new `2026-05-XX-SCRIPTURESCOUT-SMOKE-FAIL` entry, fix the defect, re-run.

---

## Pre-flight prep (~1 min)

- [ ] **0.0** Operator has Chrome 120+ installed (verify: `chrome://version`)
- [ ] **0.1** Bronze Compass icons generated and saved at `images/icon{16,32,48,128}.png` (run `images/generate-fhg-icons.html` once if not yet)
- [ ] **0.2** `manifest.json` `version` matches the release tag being tested
- [ ] **0.3** Any prior "ScriptureScout" install removed (`chrome://extensions` → Remove)

---

## §A — Manifest Load Gate (~1 min)

- [ ] **A.1** Open `chrome://extensions` → top-right "Developer mode" ON
- [ ] **A.2** Click **Load unpacked** → select `C:\dev\864zeros-llc\LLC-DIV-3-FACTORY\extensions\scripture-scout\`
- [ ] **A.3** Extension card appears with **zero red errors** in the "Errors" pane
  - PASS: load completes; icon visible in extensions list
  - FAIL: any "Could not load manifest" / "Service worker registration failed (Status 15)" / parse errors → capture full error text
- [ ] **A.4** Pin the ScriptureScout icon to the Chrome toolbar
- [ ] **A.5** Click toolbar icon → side panel opens on the right
- [ ] **A.6** Side panel header shows: **`[FHG] ScriptureScout`** (Bronze pill prefix + name) + tagline *"Heritage-first technology. Preserving what matters most."*
- [ ] **A.7** Cog icon visible top-right of side-panel header

---

## §B — Options Page + General Settings (~1 min)

- [ ] **B.1** Click the Cog → Options page opens in a new tab (URL is `chrome-extension://{id}/options/options.html`)
- [ ] **B.2** Page title bar reads `[FHG] ScriptureScout — Settings`
- [ ] **B.3** Scroll down — all 3 RULE-001 mandatory sections present in this order:
  - **General Settings** (Theme Selector + Dopamine-Friendly UI `(*)` info icon)
  - **How to Use** (4 numbered steps)
  - **Subscription & Tiers** (Free + Pro upcoming + Power upcoming + Fuel the Build)
  - **Data Management** (capture count + Clear all captures button)
- [ ] **B.4** Click the `(*)` info icon next to "Theme" → Bronze-bordered popover slides in
- [ ] **B.5** Popover body contains the verbatim Dopamine-Friendly UI definition (starts with *"Designed to minimize 'Executive Function' tax…"*)
- [ ] **B.6** Press Esc OR click outside → popover dismisses
- [ ] **B.7** Footer present: `ScriptureScout v0.1.0 | 864-Flux | 864zeros LLC` + lock icon + Terms/Privacy + © 2026

---

## §C — BibleGateway Capture (~1 min)

- [ ] **C.1** New tab → navigate to `https://www.biblegateway.com/passage/?search=John+3%3A16-17&version=ESV`
- [ ] **C.2** Page loads; verses display normally
- [ ] **C.3** Highlight the text "For God so loved the world…" → right-click → **"864zeros: Save passage"**
- [ ] **C.4** Page-side toast appears (Charcoal bg + Bronze title): **"Scout Success — N verses from BibleGateway"**
- [ ] **C.5** Re-open ScriptureScout side panel → **1 capture visible** in the list

---

## §D — Blue Letter Bible Capture (~1 min)

- [ ] **D.1** New tab → `https://www.blueletterbible.org/kjv/john/3/16`
- [ ] **D.2** Highlight a verse → right-click → "864zeros: Save passage"
- [ ] **D.3** Toast: **"Scout Success — N verses from Blue Letter Bible"**
- [ ] **D.4** Side panel now shows **2 captures total** (BG + BLB)

---

## §E — BibleHub Interlinear (THE KEY EXTRACTION TEST) (~2 min)

This is the most fragile profile and the differentiator. Verify carefully.

- [ ] **E.1** New tab → `https://biblehub.com/interlinear/john/3-16.htm`
- [ ] **E.2** Page loads; interlinear table visible (Strong's, Greek, Translit, English columns)
- [ ] **E.3** Open ScriptureScout side panel → click **"Drag-select region"** button
- [ ] **E.4** Side panel auto-closes; the page now has a Charcoal-tinted overlay with banner reading **"ScriptureScout (Bible Hub · interlinear) — drag to select words. Press ESC to cancel."**
- [ ] **E.5** Drag a rectangle covering 3-5 interlinear table rows
- [ ] **E.6** Bronze 2-px **dashed** border appears around the drag rectangle (not solid)
- [ ] **E.7** Release mouse → page-side toast appears: **"Scout Success — N words from Bible Hub"** (count matches roughly the number of rows you covered)
- [ ] **E.8** Re-open side panel → **3 captures total**, newest one is the BibleHub interlinear

---

## §F — Parchment UI Expansion (Accordion + Reading Surface) (~1 min)

- [ ] **F.1** In the side panel, click the BibleHub capture's header → accordion smoothly expands (~300 ms)
- [ ] **F.2** Bronze chevron rotates 90° (right-pointing → down-pointing)
- [ ] **F.3** Body shows a **light Parchment surface** (`#F5F5F5`) with **deep brown text** — clearly distinct from the Charcoal panel canvas
- [ ] **F.4** The captured interlinear table renders with bordered cells (browser-rendered HTML)
- [ ] **F.5** Action row at bottom of body shows: `View Source` + `Liberate to Vault` + `Remove`
- [ ] **F.6** **Shift+Click** the BibleGateway capture's header → BOTH BibleHub AND BibleGateway captures stay expanded (Compare Mode)
- [ ] **F.7** Click the BLB capture (no Shift) → BibleHub + BLB collapse to make room → only BLB is open (exclusive expand)
- [ ] **F.8** Click `View Source` button on BLB capture → opens the original BLB page in a new tab (verify URL matches)

---

## §G — Liberate to Vault (export pipeline) (~2 min)

- [ ] **G.1** Check the master "Select all" checkbox at top of capture list
- [ ] **G.2** All 3 captures' checkboxes turn checked; bottom Liberate button enables and reads **"Liberate 3 to Markdown"**
- [ ] **G.3** Click **Liberate 3 to Markdown** → button shows "Liberating…"
- [ ] **G.4** Toast: **"Liberated 3 files"**
- [ ] **G.5** Cleanup prompt appears below capture list: *"Liberated 3 files. Clear the 3 selected captures from this list?"*
- [ ] **G.6** 3 `.md` files now present at `~/Downloads/scripture-scout/` (Windows: `C:\Users\{you}\Downloads\scripture-scout\`)
- [ ] **G.7** Open the **BibleHub interlinear** `.md` file in any text editor:
  - YAML frontmatter present at top (between `---` lines)
  - `reference:` field populated
  - `view_source:` field present (mirrors source_url)
  - `profile_host: "biblehub.com"`
  - `capture_mode: "marquee"`
  - Body contains a **GFM table**: `| Greek | Translit | English | Strongs |` followed by rows
- [ ] **G.8** Open the **Blue Letter Bible** `.md` file → frontmatter has `translation: "KJV"` (or whatever was visible)
- [ ] **G.9** Click **"Keep them"** on the cleanup prompt → captures remain in side panel

---

## §H — Cleanup + Settings Roundtrip (~1 min)

- [ ] **H.1** Open Options page → "Data Management" section
- [ ] **H.2** Capture count reads "3"
- [ ] **H.3** Click **Clear all captures** → button changes to "Tap again to confirm" with red pulsing state
- [ ] **H.4** Click again within 4 seconds → toast "All captures cleared"; capture count now reads "0"
- [ ] **H.5** Re-open side panel → empty state visible: *"No captures yet"*
- [ ] **H.6** Toolbar icon badge cleared (no number shown)

---

## §I — Theme Selector (~30 sec)

- [ ] **I.1** Options → General Settings → Theme dropdown shows 3 options: Auto / Light / Dark
- [ ] **I.2** Pick **Light** → page palette shifts to FHG Parchment (cream backgrounds, deep brown text, deeper Bronze accents)
- [ ] **I.3** Re-open side panel → side panel ALSO updates to Light theme (cross-surface sync via `chrome.storage.onChanged`)
- [ ] **I.4** Switch back to **Auto** → returns to system preference

---

## §J — Console hygiene (~30 sec)

- [ ] **J.1** Right-click the side panel → **Inspect** → Console tab
- [ ] **J.2** No red errors (warnings about deprecated browser APIs are acceptable)
- [ ] **J.3** Inspect the service worker (`chrome://extensions` → ScriptureScout → "Inspect views: service worker") → Console: no red errors
- [ ] **J.4** Inspect the service worker → Network tab → during a fresh capture + liberate cycle, verify **ZERO non-`chrome://` network requests** (privacy gate per OR §3.2 Tier 1)

---

## Pass criteria

| Sections | Required to pass |
|---|---|
| §A Manifest Load | All steps PASS |
| §B Options + RULE-001 | All steps PASS |
| §C BibleGateway | All steps PASS |
| §D Blue Letter Bible | All steps PASS |
| §E **BibleHub interlinear** | All steps PASS — this is the differentiator and the most fragile profile |
| §F **Parchment UI + Compare Mode** | All steps PASS — demonstrates RULE-004 + Heritage logic |
| §G Liberate pipeline | All steps PASS — frontmatter integrity is non-negotiable |
| §H Cleanup roundtrip | All steps PASS |
| §I Theme Selector | All steps PASS (cosmetic but verifies cross-surface sync) |
| §J Console hygiene | All steps PASS — privacy gate |

**Total time: 9-10 minutes** for an experienced operator. **Result:** PASS = release candidate ships to Founding 100 cohort. FAIL = fix + re-run.

---

*Operator smoke test v1.0 · 2026-05-08 · expanded from `OR_STRIKE_012_PREFLIGHT.md` §3.1*
