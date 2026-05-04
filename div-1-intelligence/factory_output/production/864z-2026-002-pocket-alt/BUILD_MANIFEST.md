# 864z Build Manifest: Pocket Alternative
**Strike ID:** 864z-2026-002
**Status:** Build Initialized
**Date:** 2026-03-17

---

## I. REGISTRY AUDIT

### Required Bricks from Strike Package:

| Brick ID | Name | Status | Path | Available |
|----------|------|--------|------|-----------|
| BRK-DB-001 | Persistence_Vault (IndexedDB_Core) | Production-Ready | lib/db.js | YES |
| BRK-MIG-002 | Migration_Engine (Text_Parser_Base) | Beta | lib/backup.js | PARTIAL |
| BRK-UI-003 | Clean_Slate (OIA Design System) | Production-Ready | lib/oia-design-system.css | YES |

### Missing Bricks (Marked for Delta Generation):

| Brick ID | Name | Reason |
|----------|------|--------|
| BRK-MIG-004 | Pocket_Parser | No "Read-it-Later" format parser exists |
| - | Privacy_Shield | Offline-first moat requires custom implementation |

---

## II. 80% BOILERPLATE (From Registry)

### From lib-core.md:
- `api-client.js` - AI provider abstraction (for future AI features)
- `redactor.js` - PPI stripping (privacy requirement)
- `tiers.js` - Payment tier verification
- `constants.js` - App configuration

### From lib-extension.md:
- `db.js` - IndexedDB wrapper (BRK-DB-001)
- `store.js` - chrome.storage.local wrapper
- `backup.js` - Export/import pipeline (BRK-MIG-002 base)

### From templates:
- `oia-design-system.css` - UI framework (BRK-UI-003)
- Phase 1 scaffold structure

---

## III. 20% DELTA (Custom Development)

### Delta Feature 1: Pocket Rescue Importer
**Gap:** Users frustrated with Pocket export limitations
**Solution:** Parse Pocket's HTML and JSON export formats

```
Input formats to support:
1. Pocket HTML Export (ril_export.html)
   - Nested <ul> structure with <a> links
   - Attributes: href, time_added, tags

2. Pocket API JSON (if user has developer access)
   - Array of items with url, title, excerpt, tags, time_added
```

### Delta Feature 2: Offline-First Moat
**Gap:** Privacy concerns with Pocket (Mozilla data collection)
**Solution:** All content stored in IndexedDB BEFORE any cloud option

```
Architecture:
1. Capture → IndexedDB immediately (no network)
2. User explicitly enables sync → then cloud (opt-in)
3. Default: 100% local, zero network calls
4. AI features: redact PPI before any API call
```

### Delta Feature 3: Smart Export
**Gap:** Users want to migrate away from Pocket easily
**Solution:** Universal export to multiple formats

```
Export formats:
1. JSON (standard backup)
2. HTML (browser bookmarks compatible)
3. CSV (spreadsheet analysis)
4. Markdown (Obsidian/Notion compatible)
```

---

## IV. 8.64 SCORE VERIFICATION

### From Strike Package:
- **Vulture Score:** 9.32/10
- **Rule of 40:** 100% (Growth 20% + Margin 80%)
- **Target MRR:** $2,500
- **Months to Exit:** 10

### Tech Stack Impact Assessment:

| Factor | Impact | Score Effect |
|--------|--------|--------------|
| IndexedDB (local-first) | Reduces hosting costs → Higher margin | +Positive |
| No cloud dependency | Lower infrastructure → Higher margin | +Positive |
| Chrome Extension | Free distribution via Web Store | +Positive |
| Optional cloud sync | Tiered pricing opportunity | +Positive |

### Verification Result:
```
Rule of 40 Maintainable: YES
- Growth projection: 20% (viral via "Powered by" + rescue migration)
- Margin projection: 80% (solo dev, minimal infra, extension model)
- Combined: 100% > 40% threshold

8.64 Score Intact: YES
- Tech stack does not negatively impact any Z-factors
- Privacy moat may IMPROVE scarcity score (differentiation)
```

**PROCEED WITH BUILD: APPROVED**

---

## V. FILE STRUCTURE

```
864z-2026-002-pocket-alt/
├── BUILD_MANIFEST.md          # This file
├── manifest.json              # Chrome extension manifest (MV3)
├── _locales/
│   └── en/
│       └── messages.json      # i18n strings
├── assets/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── background/
│   └── service-worker.js      # Extension service worker
├── sidepanel/
│   ├── index.html             # Main UI
│   ├── main.js                # Panel logic
│   └── styles.css             # Custom styles
├── scripts/
│   ├── content.js             # Page content script
│   └── injector.css           # Injected styles
├── lib/
│   ├── db.js                  # [BRK-DB-001] IndexedDB wrapper
│   ├── store.js               # State management
│   ├── backup.js              # [BRK-MIG-002] Export/import base
│   ├── pocket-parser.js       # [DELTA] Pocket format parser
│   ├── api-client.js          # AI provider abstraction
│   ├── redactor.js            # PPI stripping
│   ├── tiers.js               # Payment tiers
│   ├── constants.js           # App config
│   └── oia-design-system.css  # [BRK-UI-003] UI framework
├── options/
│   ├── options.html
│   └── options.js
└── rescue/
    ├── rescue.html            # [DELTA] Pocket import wizard
    └── rescue.js              # [DELTA] Import logic
```

---

## VI. NEXT ACTIONS

1. [ ] Create directory structure
2. [ ] Inject 80% boilerplate from lib modules
3. [ ] Implement pocket-parser.js (Delta)
4. [ ] Implement rescue wizard UI (Delta)
5. [ ] Test with real Pocket export file
6. [ ] Chrome Web Store submission prep
