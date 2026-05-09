# [864F] MigrationPilot — Web to Obsidian

> **Compliance:** RULE-001 ✓ · RULE-002 ✓ · RULE-003 ✓ · **RULE-004 ✓** (record list migrated to BRK-UI-004 accordion-record-v1, 2026-05-08)
> **Pillar:** 864-Flux (Kinetic Bridges) · Slate & Graphite palette
> **Sign-off authority:** Office Architect (`864z-OA`) per RULE-000

---

# MigrationPilot — Web to Obsidian

**Built for people with ADHD by someone with ADHD. Capture from any page, liberate to Markdown. Your vault, your control.**

A Chrome MV3 extension. Marquee-select any region of any page → save locally → liberate as `.md` files into your Obsidian / Capacities / Logseq vault. No cloud, no account, no subscription.

864zeros LLC | OIA pillar | Strike 011 | v0.1.0 (alpha)

---

## The Hook (Marketing)

### The Friction
Web Highlights, Glasp, Liner, Pocket — every web-clipper today imposes the same tax:
1. Sign up for an account
2. Save your highlights inside their cloud, in their schema
3. Pay to keep them, or lose them when you leave

**MigrationPilot is the bridge that doesn't exist.** Capture once locally, liberate to Markdown anywhere. Open this extension is the *last* migration step you take, because the data starts and stays yours.

### Who This Is For
- Obsidian / Capacities / Logseq users who refuse to pay a third party to hold their reading list
- Web Highlights / Glasp / Liner refugees who want their existing highlights out
- ADHD knowledge workers who want frictionless capture before the thought escapes
- Privacy-conscious users tired of vendor cloud lock-in for their own clips

### The Workflow
1. Browse any page.
2. **Either**: select text + right-click → "864zeros: Save selection"
   **Or**: click the extension icon to open the side panel → "Drag-select region" → drag a box on the page
   **Or**: click "Save this page" in the side panel for a full-page text capture
3. Captures stack up locally (IndexedDB, never leaves your device)
4. When ready, click **Liberate to Markdown** in the side panel (or right-click → "864zeros: Liberate to Markdown") → `.md` files download to your computer with full YAML frontmatter
5. Drop them into your vault folder. Done.

---

## The Commercial Gate (Sales)

### GTM Status
**Engineering:** Alpha v0.1.0. Scaffold complete. 5/5 essential bricks integrated. Self-test on the markdown-converter passes 5/5.

**Outstanding before Chrome Web Store launch:**
- Real icons (currently a generator HTML — operator runs once to produce PNGs)
- Manual end-to-end test: load unpacked → capture → liberate → confirm `.md` files land in `~/Downloads/migration-pilot/` with valid frontmatter
- Privacy policy (trivial — literally nothing leaves device)
- Marketing assets: store screenshots showing capture → liberate flow, demo GIF
- Reddit launch sequence: r/ObsidianMD, r/PKMS, r/zettelkasten, r/Logseq, r/Capacities

### T-Shirt Size
**S** — focused single-purpose tool. ~600 LOC across content/background/popup/lib. The complexity is in the marquee selection logic and the markdown-converter brick (already built and tested).

### Tier Structure
**Free Edition** for v1.0. The product is a migration utility — the value comes from the bridge being free, not from feature gating.

| Tier | Price | What It Unlocks |
|---|---|---|
| **Free** | $0 forever | Marquee capture, full-page capture, selection capture, IndexedDB storage, Markdown export, frontmatter spec, batch + combined export |

Future Premium considerations (NOT in v1):
- Optional Google Drive sync via `agent-drive-sync` (Pro)
- Direct File System Access API → write into vault folder without manual download (`agent-fs-vault-writer`, currently `missing_bricks` in registry)
- AI-augmented auto-tagging via `agent-local-ai-keywords` (free-tier-friendly)

### Revenue Model
- **v1**: Free, OSS recommended. Audience-building product per the MigrationPilot pre-flight OR (`OR-2026-05-07-MIGRATION-PILOT.md`).
- **v2 (if traction)**: B2B audience-build → cross-promo for clipboard, Bible-Insight, OIA series.
- **Strategic value**: own the migration-tool category (per Strike 011 OR analysis — this niche has 1 real direct competitor, Glasp).

---

## Technical Blueprint (Tech)

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│  sidepanel/index.html (opens on toolbar click)             │
│  - Marquee button → message → service worker               │
│  - Capture page button → message → SW → inject scraper     │
│  - Liberate button → message → SW → markdown-converter →   │
│    chrome.downloads.download(per .md file)                 │
│  - Right-click context menu also triggers Save & Liberate  │
└────────────────────────────────────────────────────────────┘
                            ▲
                            │ chrome.runtime.sendMessage
                            ▼
┌────────────────────────────────────────────────────────────┐
│  background/service-worker.js (ES module)                  │
│  - chrome.contextMenus: "Save selection" handler           │
│  - Routes CAPTURE_FROM_CONTENT, CAPTURE_PAGE_TEXT,         │
│    START_MARQUEE, LIBERATE_TO_MARKDOWN messages            │
│  - Imports lib/db.js + lib/markdown-converter.js           │
│  - chrome.action.setBadgeText: live capture counter        │
└────────────────────────────────────────────────────────────┘
                            ▲
                            │ chrome.tabs.sendMessage
                            ▼
┌────────────────────────────────────────────────────────────┐
│  content/marquee.js (plain script, every page)             │
│  - Listens for START_MARQUEE                               │
│  - Renders fullscreen overlay + drag-rectangle             │
│  - extractTextWithinRect(): finds elements that intersect  │
│    the marquee, gathers visible text                       │
│  - Sends CAPTURE_FROM_CONTENT to service worker            │
│  - ESC key cancels overlay                                 │
└────────────────────────────────────────────────────────────┘
                            ▲
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│  IndexedDB ('migration-pilot' database, 'captures' store)  │
│  Each capture: {id, title, content, source_url,            │
│                 timestamp, tags, note, captureMode}        │
└────────────────────────────────────────────────────────────┘
```

### Brick Registry Integration

This extension imports 5 essential bricks from `LLC-DIV-3-FACTORY/shared/bricks/` (registered in `864zeros-ISD/ISD-DIV-0-CORE/BRICK_REGISTRY.json`):

| Brick | How It's Used | Where |
|---|---|---|
| `agent-dom-scraper` | `extractSelectionInPage()` and `scrapePageInPage()` injected functions in service worker | `background/service-worker.js` |
| `agent-marquee-capture` (text variant) | Fullscreen overlay + drag rectangle + `extractTextWithinRect()` | `content/marquee.js` |
| `agent-indexeddb-store` | IndexedDB wrapper with the standard CRUD interface | `lib/db.js` |
| `agent-local-backup` (pattern) | JSON dump pattern reused for the LIBERATE flow (one .md file per capture, or combined) | `background/service-worker.js` (the `LIBERATE_TO_MARKDOWN` handler) |
| `agent-markdown-converter` | ESM port of the canonical CommonJS brick. Converts `{content, title, source_url, timestamp, tags, note}` → `{filename, markdown}` | `lib/markdown-converter.js` |

**Note on the markdown-converter:**
- Canonical source: `LLC-DIV-3-FACTORY/shared/bricks/agent-markdown-converter.js` (CommonJS, Node-CLI-runnable, 5/5 self-test pass)
- This extension's port: `lib/markdown-converter.js` (ESM for browser/MV3 use)
- When updating logic, update **both files**.

### File Layout

```
migration-pilot/
├── manifest.json                    # MV3 manifest, side-panel pattern
├── README.md                        # this file
├── _locales/en/messages.json        # i18n strings
├── background/
│   └── service-worker.js            # ESM, message router, IndexedDB, downloads
├── content/
│   └── marquee.js                   # plain script, drag-select overlay
├── sidepanel/
│   ├── index.html                   # main panel UI (Nunito + OIA design system)
│   ├── main.js                      # ESM, panel controller
│   └── styles.css                   # panel-specific layout (extends OIA tokens)
├── lib/
│   ├── db.js                        # IndexedDB wrapper
│   ├── markdown-converter.js        # ESM port of the canonical brick
│   └── oia-design-system.css        # workspace design system (copied verbatim)
└── icons/
    ├── generate-icons.html          # operator opens once → save 3 PNGs into icons/
    ├── icon16.png                   # (TODO — generate via the HTML)
    ├── icon48.png                   # (TODO)
    └── icon128.png                  # (TODO)
```

### Installation (developer mode)

```
1. Open chrome://extensions
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select: C:\dev\864zeros-llc\LLC-DIV-3-FACTORY\extensions\migration-pilot
5. (First-time only) Open icons/generate-icons.html in a tab,
   right-click each canvas → save as icon16.png / icon48.png / icon128.png
   into the icons/ folder. Reload the extension.
6. Pin the MigrationPilot icon to the Chrome toolbar.
```

### Manual smoke test (3-step end-to-end)

```
1. Visit any article (https://example.com or any blog post)
2. Click the MigrationPilot toolbar icon — side panel opens.
   Click "Save this page" → badge counter shows "1"
3. Click "Liberate to Markdown" in the panel
   (or right-click the page → "864zeros: Liberate to Markdown")
   → A .md file downloads to ~/Downloads/migration-pilot/
   → Open the file: confirm YAML frontmatter + body content
```

### AI Configuration
**MigrationPilot does not call any AI.** Pure migration utility. Zero API costs, no AI proxy needed.

This is by design — the migration tool that requires you to sign up for an LLM is no longer a pure migration tool.

### Permissions Used

| Permission | Why |
|---|---|
| `sidePanel` | Required — extension UI is a side panel per workspace standard |
| `storage`, `unlimitedStorage` | IndexedDB capture archive (potentially many years of clips) |
| `activeTab`, `scripting` | Inject `extractSelectionInPage` / `scrapePageInPage` into the active tab when explicitly invoked |
| `contextMenus` | Right-click menu items: "Save selection" and "Liberate to Markdown" |
| `downloads` | Trigger `.md` file download on Liberate |
| `<all_urls>` (host_permissions) | Required — content script must be available on any page where capture happens |

### What This Extension Does NOT Do (by design)

- ❌ Phone home, send analytics, send error reports
- ❌ Read your browsing history beyond the active tab during capture
- ❌ Modify pages you visit (until you explicitly invoke marquee mode)
- ❌ Sync to any cloud unless you explicitly opt in to Drive sync (Pro, future)
- ❌ Charge you anything

---

## Strike 011 Status

**Pre-flight scarcity:** PASSED (1 real direct competitor — Glasp). See `OR-2026-05-07-MIGRATION-PILOT.md`.
**5 essential bricks:** ALL READY. agent-markdown-converter built and registered 2026-05-07.
**Engineering scaffold:** COMPLETE (this directory).
**Outstanding:** manual end-to-end test, real icons, marketing assets, store listing prep.

The Migration/Liberation thesis is no longer theoretical. The bridge exists.

---

*864zeros LLC — OIA pillar. Built for people with ADHD by someone with ADHD.*
*MigrationPilot: capture once, own forever, export anywhere.*
