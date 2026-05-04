# TabVault - Project Overview

> A high-reliability Chrome extension for tab management and memory optimization.
> Designed as a replacement for OneTab with better data safety and native memory efficiency.

---

## Quick Summary

TabVault allows users to "vault" open browser tabs into persistent storage, freeing up memory while preserving all tab context. It uses Chrome's native tab discarding API to reduce RAM usage by ~95% for inactive tabs.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Platform | Chrome Extension (Manifest V3) |
| Language | Vanilla JavaScript |
| UI | HTML + CSS |
| Storage | IndexedDB (V2 Schema) |
| Architecture | Service Worker + Side Panel |

---

## Project Structure

```
TabVault/
├── manifest.json        # Extension manifest (MV3)
├── background.js        # Service worker - central logic hub
├── vault_engine.js      # IndexedDB persistence layer
├── sidepanel.html       # Side panel UI markup
├── sidepanel.js         # Side panel logic
├── options.html         # Settings/management page
├── options.js           # Options page logic
├── CLAUDE.md            # Build specification (dev reference)
└── tabVault-overview.md # This file
```

---

## Core Features

### 1. Tab Vaulting
- Save open tabs to IndexedDB storage
- Preserves: URL, Title, Favicon, Window ID, Scroll Position
- Tabs can be restored individually or in bulk

### 2. Deep Sleep (Auto-Discard)
- Monitors tab inactivity
- Tabs inactive for 20+ minutes are auto-discarded via `chrome.tabs.discard()`
- Discarded tabs remain visible but release ~95% of their RAM
- Requires `chrome.alarms` API for timer persistence in service worker

### 3. Real-Time Mirroring
- Listens to `chrome.tabs.onUpdated` events
- Continuously mirrors tab state to IndexedDB
- Ensures data safety even on crash/unexpected closure

### 4. OneTab Bridge
- Import utility in Options page
- Parses OneTab text export format
- Migrates legacy data into TabVault's IndexedDB

---

## Permissions Required

| Permission | Purpose |
|------------|---------|
| `tabs` | Access tab URLs, titles, and manage tabs |
| `storage` | Chrome storage API (settings) |
| `scripting` | Inject scripts for scroll position capture |
| `sidePanel` | Enable side panel UI |
| `alarms` | Persistent timers for inactivity tracking (needs to be added) |

---

## Key APIs Used

```javascript
// Tab management
chrome.tabs.query()
chrome.tabs.discard(tabId)
chrome.tabs.onUpdated.addListener()
chrome.tabs.onRemoved.addListener()

// Side panel
chrome.sidePanel.setOptions()

// Timers (service worker safe)
chrome.alarms.create()
chrome.alarms.onAlarm.addListener()

// Storage
indexedDB.open()
```

---

## IndexedDB Schema (V2)

```javascript
// Database: "TabVaultDB"
// Object Store: "tabs"
{
  tabId: number,        // Primary key
  url: string,
  title: string,
  favicon: string,      // URL to favicon
  windowId: number,
  scrollPosition: number,
  vaultedAt: timestamp,
  lastAccessed: timestamp
}
```

---

## UI Components

### Side Panel (`sidepanel.html`)
- Quick-access interface
- View vaulted tabs
- One-click vault/restore actions
- Lightweight and fast

### Options Page (`options.html`)
- Full tab management view
- Settings configuration
- OneTab import utility
- Export/backup functionality

---

## Development Notes

### Why Replace OneTab?
| Gap | TabVault Solution |
|-----|-------------------|
| **Trust Gap** | Real-time IndexedDB mirroring prevents data loss |
| **Sync Gap** | Reliable persistence layer |
| **Context Gap** | Preserves scroll position, window context |

### Technical Considerations
1. **Service Worker Limitations**: Cannot use `setInterval`/`setTimeout` for long timers - must use `chrome.alarms`
2. **Scroll Position**: Requires content script injection to capture `window.scrollY`
3. **Favicon Reliability**: Consider caching favicons as blobs for offline access
4. **Error Recovery**: Implement fallback for IndexedDB failures

---

## Status / TODOs

- [ ] Define complete IndexedDB schema with indexes
- [ ] Add `alarms` permission to manifest
- [ ] Create content script for scroll position capture
- [ ] Implement OneTab text parser
- [ ] Design error handling/recovery strategy
- [ ] Add tab grouping/session organization
- [ ] Build export/backup feature

---

## Getting Started (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `TabVault` project folder
5. The extension icon will appear in the toolbar

---

## References

- [Chrome Extensions MV3 Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [chrome.tabs.discard()](https://developer.chrome.com/docs/extensions/reference/tabs/#method-discard)
- [Side Panel API](https://developer.chrome.com/docs/extensions/reference/sidePanel/)

---

*Last updated: 2026-02-16*
