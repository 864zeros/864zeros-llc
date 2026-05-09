# 864zeros Factory Inventory

> Generated: 2026-03-18 | Version: 1.1.0 | Total Extensions: 17

---

## Architecture Overview

```
864zeros Extension Factory
==========================

WAREHOUSE (Stable Library)              PRODUCTION FLOOR (Active Projects)
C:\Users\I820965\dev\864zeros\          C:\Users\I820965\dev\vulture-nest\
extensions\                             864zeros_engine\builds\
------------------------------          ----------------------------------
13 Harvestable Sources                  4 Active Vulture Strikes
Proven, stable components               Current development builds
DO NOT MODIFY - HARVEST ONLY            ACTIVE DEVELOPMENT ZONE
```

---

## WAREHOUSE: Harvestable Sources

> **Location:** `C:\Users\I820965\dev\864zeros\extensions\`
> **Purpose:** Proven, stable components ready for harvest. DO NOT modify these directly.

| ID | Name | Purpose | Brand | Status | Key Harvestables |
|----|------|---------|-------|--------|------------------|
| bible-insight | Bible Insight | Bible Study | FHG | Stable | verse-detector.js, YouTube transcript |
| clipboard | ClipBoard | Clipboard Manager | OIA | Stable | google-drive/, pdf-generator.js, ExtPay |
| tabvault | TabVault | Tab Manager | OIA | Stable | Tab mirroring, OneTab import |
| signal2noise | Signal2Noise | Task Prioritization | OIA | Stable | Signal pill UI, Accordion list |
| tuneout2focusin | TuneOut2FocusIn | Background Noise | OIA | Stable | Offscreen audio pattern |
| time2focus | Time2Focus | Focus Timer | OIA | Stable | chrome.alarms, Panel flash |
| 864z-chronical | Chronicle | AI Conversation History | 864z | Stable | AI scraping patterns, db.js |
| who-is-watching | Who Is Watching | Tracker Detector | OIA | Stable | detector.js, JS API hooking |
| oia-focus-note | OIA Focus Note | Note Taking | OIA | Minimal | - |
| oia-focus-timer | OIA Focus Timer | Timer | OIA | Minimal | - |
| oia-focus-wall | OIA Focus Wall | Wallpaper | OIA | Minimal | - |
| oia-focus-sound | OIA Focus Sound | Sound Player | OIA | Minimal | Audio resource pattern |
| oia-focus-signal | OIA Focus Signal | Notifications | OIA | Minimal | - |

---

## PRODUCTION FLOOR: Active Projects

> **Location:** `C:\Users\I820965\dev\vulture-nest\864zeros_engine\builds\`
> **Purpose:** Current Vulture Strike builds under active development.

| Strike | Name | Purpose | Status | Issues |
|--------|------|---------|--------|--------|
| 864z-2026-002 | ReadVault (Pocket Alt) | Reader | Active | Best Reader UI source |
| 864z-2026-003 | InstaRescue | Data Rescue | Scaffold | Library only |
| 864z-2026-004 | PassVault | Password Manager | Active | Ready for testing |
| 864z-2026-005 | ReadFlow | Reader / Kobo Sync | Active | **UI inherited from PassVault - needs Reader icons** |

---

## Harvestable Bricks by Category

### PARSERS (Data Import)

| Brick | Zone | Source | Formats |
|-------|------|--------|---------|
| `verse-detector.js` | Warehouse | Bible Insight | Bible references |
| `password-parser.js` | Production | PassVault | Dashlane, LastPass, 1Password, CSV |
| `instapaper-parser.js` | Production | ReadFlow | Instapaper CSV |
| `pocket-parser.js` | Production | Pocket Alt | Pocket export |
| `deep-parser.js` | Production | InstaRescue | Generic CSV |

### EXPORTERS (Data Export)

| Brick | Zone | Source | Output Format |
|-------|------|--------|---------------|
| `pdf-generator.js` | Warehouse | ClipBoard | PDF |
| `epub-builder.js` | Production | ReadFlow | ePub |
| `recovery-pdf.js` | Production | PassVault | PDF |
| `qr-generator.js` | Production | ReadFlow | QR Code SVG |

### SECURITY

| Brick | Zone | Source | Features |
|-------|------|--------|----------|
| `detector.js` | Warehouse | Who Is Watching | Tracker detection |
| `redactor.js` | Warehouse | ClipBoard | Content redaction |
| `crypto-vault.js` | Production | PassVault | AES-GCM encryption |
| `breach-checker.js` | Production | PassVault | HaveIBeenPwned API |

### STORAGE & SYNC

| Brick | Zone | Source | Features |
|-------|------|--------|----------|
| `db.js` | Both | Multiple | IndexedDB wrapper |
| `backup.js` | Warehouse | ClipBoard | Export/Import |
| `google-drive/` | Warehouse | ClipBoard | Cloud sync, OAuth2 |

### UI SYSTEMS

| Brick | Zone | Source | Features |
|-------|------|--------|----------|
| `oia-design-system.css` | Warehouse | Multiple | Dark theme, Typography |
| `aether-ui.css` | Production | ReadFlow | Brand footer, Modals |
| `BRK-PRICING-001.js` | Production | Build Kit | Pricing modal controller |
| `864z-core.js` | Production | Build Kit | Brand constants |

### AUDIO

| Brick | Zone | Source | Features |
|-------|------|--------|----------|
| Offscreen audio | Warehouse | TuneOut2FocusIn | MV3 background playback |
| Alert sounds | Warehouse | Time2Focus | Chime, bowl, bell |

---

## Harvest Guide

### Reader UI (For ReadFlow Fix)

**Recommended Source:** `864z-2026-002-pocket-alt` (Production Floor)

```
Path: vulture-nest\864zeros_engine\builds\864z-2026-002-pocket-alt\sidepanel\
```

| Component | File | Description |
|-----------|------|-------------|
| Article Card | main.js | Favicon + title + domain + reading time |
| Article List | main.js | Scrollable list with folder badges |
| Empty State | index.html | Book icon + "Your reading list is empty" |
| Search Bar | index.html | Input with search icon |

### Security UI (PassVault pattern)

**Recommended Source:** `864z-2026-004-passvault` (Production Floor)

```
Path: vulture-nest\864zeros_engine\builds\864z-2026-004-passvault\sidepanel\
```

| Component | Description |
|-----------|-------------|
| Password Card | Site favicon + username + strength indicator |
| Audit Modal | Statistics grid + breakdown + savings banner |
| Import Modal | Dropzone + source selection |
| Lock Overlay | Full-screen lock with unlock form |

### Cloud Sync

**Recommended Source:** `clipboard` (Warehouse)

```
Path: 864zeros\extensions\clipboard\lib\google-drive\
```

| Component | Description |
|-----------|-------------|
| OAuth2 Auth | Google identity flow |
| Drive API | appdata folder sync |
| Sync Status | UI indicators |

### Payments

**Recommended Source:** `clipboard` (Warehouse)

```
Path: 864zeros\extensions\clipboard\lib\payments\
```

| Component | Description |
|-----------|-------------|
| ExtPay.js | ExtensionPay integration |
| tiers.js | Tier management |

---

## Priority Action: ReadFlow UI Fix

ReadFlow currently has PassVault UI DNA (vault icons, lock metaphors). To fix:

### Harvest from Pocket Alt (Production Floor):
1. **Article Card UI** - `sidepanel/main.js`
2. **Empty State** - `sidepanel/index.html` (book icon, not vault)
3. **Header Logo** - Book/article icon, not lock

### Replace in ReadFlow:
1. Lock icon in header → Book icon
2. "Vault" terminology → "Library" terminology
3. Shield icons → Article/page icons

---

## File Paths Quick Reference

### Warehouse (864zeros\extensions\)
```
Bible-Insight/js/lib/verse-detector.js
clipboard/lib/google-drive/
clipboard/lib/pdf-generator.js
clipboard/lib/backup.js
clipboard/lib/oia-design-system.css
clipboard/lib/payments/ExtPay.js
who-is-watching/content/detector.js
Time2Focus/offscreen/
TuneOut2FocusIn/offscreen/
864z-chronical/lib/db.js
```

### Production Floor (vulture-nest\864zeros_engine\builds\)
```
864z-2026-002-pocket-alt/lib/pocket-parser.js
864z-2026-002-pocket-alt/sidepanel/  ← READER UI SOURCE
864z-2026-003-instarescue/lib/deep-parser.js
864z-2026-004-passvault/lib/password-parser.js
864z-2026-004-passvault/lib/crypto-vault.js
864z-2026-004-passvault/lib/breach-checker.js
864z-2026-004-passvault/lib/recovery-pdf.js
864z-2026-005-readflow/lib/instapaper-parser.js
864z-2026-005-readflow/lib/epub-builder.js
864z-2026-005-readflow/lib/qr-generator.js
```

### Build Kit (vulture-nest\864z-build-kit\)
```
lib/864z-core.js
lib/BRK-PRICING-001.js
lib/aether-ui.css
scripts/strike-bridge.js
```

---

*Last updated: 2026-03-18*
*Maintained by: 864zeros Build System*
