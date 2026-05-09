# [OIA] TabVault

> **Compliance:** RULE-001 ✓ · RULE-002 (n/a — no SW downloads) · RULE-003 (deferred — selection UI not yet present) · **RULE-004 ✓** (vault list migrated to BRK-UI-004 accordion-record-v1, 2026-05-08)
> **Pillar:** OIA (Organize Internal Architecture) · Slate & Sage palette
> **Sign-off authority:** Office Architect (`864z-OA`) per RULE-000

---

# TabVault

**Deep Sleep for your tabs. OneTab without the data loss.**

A Chrome side-panel extension that vaults tab metadata in real time and aggressively discards background processes — keeping your browser fast without losing your work.

864zeros LLC | Manifest V3 | Strike 864z-2026-002 (DEPLOYED)

---

## The Hook (Marketing)

### The Friction
OneTab has 2.1 million users and three failure modes that hurt:
1. **Data loss on uninstall** — uninstalling OneTab is uninstalling your reading list. There's no easy export, and tab data evaporates.
2. **No sync** — switch laptops, lose your saved tabs.
3. **Memory bloat** — open tabs continue consuming RAM until OneTab grabs them. By then your laptop fan is already screaming.

TabVault is the rescue product:

- **Real-time vault mirroring** — every tab's URL, title, favicon, window context, and scroll position written to IndexedDB on the fly. Uninstall the extension and the data is still there next time you reinstall (Chrome preserves IndexedDB by extension ID).
- **Native deep sleep** — uses Chrome's built-in `tabs.discard()` API on tabs idle >20 minutes. Visible in the tab strip, ~95% reduction in RAM usage. No third-party process management.
- **OneTab Bridge** — import your existing OneTab text export directly. Your tabs come with you.
- **Side panel, not a popup** — your vault is always one click away while you browse. Doesn't vanish when you click elsewhere.

### Who This Is For
- Power users with 100+ tabs across multiple windows
- Researchers who want to suspend tab cohorts without losing them
- Developers tired of OneTab eating their reading queue
- Privacy-conscious users who want local-only tab storage (TabVault never phones home)

### Migration Hook
TabVault is itself a migration utility. The OneTab Bridge utility lets users **leave OneTab today** and bring everything with them. The first cohort of TabVault users will largely be OneTab refugees — Day 1 GTM should target r/OneTab and similar communities.

---

## The Commercial Gate (Sales)

### GTM Status
**Strike ID:** 864z-2026-002
**Status:** DEPLOYED (per Vulture_Nest.md catalog)
**Vulture Score:** 9.32 (validator-confirmed)

**Outstanding for full GTM push:**
- ExtPay account registration (OAuth client ID is `YOUR_CLIENT_ID.apps.googleusercontent.com` placeholder in manifest — needs real value)
- Marketing screenshots (vault view, deep-sleep indicator, OneTab import wizard)
- Privacy policy + ToS URLs
- Reddit/HN launch sequence: "Don't let OneTab take your tabs hostage"

### T-Shirt Size
**M** — IndexedDB schema design + native discard logic + OneTab import bridge + side-panel UI. Substantial assembly.

### Tier Structure (planned)

| Tier | Price | What It Unlocks |
|---|---|---|
| **Free** | $0 | Vault mirroring, native deep sleep, OneTab import, local export, unlimited tabs stored |
| **Pro** | $1.99/mo or $29 lifetime | Cross-device sync (via Drive appdata), tab groups, shareable links, scheduled deep-sleep policies |

Brick mapping (Core = Free, Premium = paid):

| Brick | Tier |
|---|---|
| Vault Persistence Engine (IndexedDB v2 schema) | **Core** |
| Native Deep Sleep (chrome.tabs.discard) | **Core** |
| OneTab Bridge import | **Core** |
| Local export (JSON) | **Core** |
| `agent-drive-sync` | Pro |
| Scheduled deep-sleep policies | Pro |

---

## Technical Blueprint (Tech)

### Brick Registry

| Brick ID | Category | Input → Process → Output | Complexity | Source |
|---|---|---|---|---|
| `agent-vault-engine` | Infra | `chrome.tabs.onUpdated` event → mirror `{tabId, url, title, favicon, windowId, scrollPosition}` to IndexedDB v2 schema | S | `vault_engine.js` |
| `agent-deep-sleep` | Infra | Per-tab idle timer (>20min) → `chrome.tabs.discard(tabId)` | XS | `background.js` |
| `agent-onetab-bridge` | Capture | OneTab `.txt` export → parse line-delimited URLs → batch-insert into vault | S | `options.js` (OneTab import handler) |
| `agent-vault-search` | Analysis | `query: string` → IndexedDB cursor scan → ranked results | XS | `sidepanel.js` |
| `agent-vault-export` | Export | `vaultDump()` → `.json` file → download trigger | XS | sidepanel/options |
| `agent-drive-sync` | Export | `{vaultJSON, filename}` → Google Drive appdata folder → backup | M | (planned, Pro tier) |

### Architecture
```
┌────────────────────────────────────────────────────┐
│  background.js — service worker                   │
│  - Listens chrome.tabs.onUpdated                   │
│  - Mirrors to IndexedDB via vault_engine.js        │
│  - Tracks per-tab idle time                        │
│  - Issues chrome.tabs.discard(tabId) on >20min     │
├────────────────────────────────────────────────────┤
│  vault_engine.js — IndexedDB v2 schema             │
│  - initVault(), mirrorTab(id, data)                │
│  - getVaultContents(), deleteTab(id)               │
├────────────────────────────────────────────────────┤
│  sidepanel.html / sidepanel.js                     │
│  - Always-visible vault list                       │
│  - Quick capture, restore, delete                  │
│  - Search across vault                             │
├────────────────────────────────────────────────────┤
│  options.html / options.js                         │
│  - Detailed settings                               │
│  - OneTab import wizard                            │
│  - Vault export to JSON                            │
└────────────────────────────────────────────────────┘
```

### Installation (development)

```bash
cd C:\dev\864zeros-llc\LLC-DIV-3-FACTORY\extensions\TabVault
# Vanilla JS, no npm needed for runtime

# Load in Chrome:
# chrome://extensions → Developer mode → Load unpacked → select this directory
```

### AI Configuration
**TabVault does not call any AI.** Pure metadata management. Zero AI cost, zero proxy required.

### OAuth Configuration (for Pro Drive sync)
Replace the placeholder OAuth client ID in `manifest.json`:
```json
"oauth2": {
  "client_id": "YOUR_REAL_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["https://www.googleapis.com/auth/drive.appdata", "email"]
}
```
Provision via Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Application type: Chrome extension).

### Permissions Used

| Permission | Why |
|---|---|
| `tabs` | Listen for tab updates, get tab metadata |
| `storage`, `sidePanel` | Settings + always-visible vault UI |
| `scripting`, `alarms` | Per-tab idle tracking |
| `identity` | OAuth flow for Drive sync (Pro) |
| Content script `<all_urls>` | Inject minimal capture script for active page metadata |

### Native Deep Sleep — Why It Matters
`chrome.tabs.discard(tabId)` is Chrome's first-party tab freeze. Unlike third-party "tab suspender" extensions, it:
- Does not change the tab's visible state in the strip
- Resumes instantly when the user returns to the tab
- Costs ~95% less RAM than a fully loaded tab
- Cannot be detected as "suspended" by anti-suspension scripts (because Chrome itself is doing it)

This is the single biggest differentiator vs OneTab. OneTab closes tabs; TabVault keeps them visible but freezes their RAM footprint.

### Build Status
Strike 864z-2026-002 marked DEPLOYED in Vulture_Nest.md. Production extension is shipped. This README documents the v1 production state for DIV-4 STUDIO GTM intake.

---

*864zeros LLC — Organize Your Internal Architecture.*
*TabVault: keep your tabs. Lose the RAM bill.*
