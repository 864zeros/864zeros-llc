# /lib/ Extension Modules — Chrome Extension Platform

**Version:** 1.0  
**Scope:** Chrome extensions only. Supplements `lib-core.md`.  
**Rule:** Never modify per-extension. Wrap if you need extension-specific logic.

---

## Modules

```
lib/
├── db.js              # IndexedDB wrapper — local-first storage
├── store.js           # chrome.storage.local wrapper — state + reactive listeners
└── backup.js          # Export/import + Google Drive sync pipeline
```

These sit alongside the core modules (`api-client.js`, `redactor.js`, `tiers.js`, `constants.js`) in the same `/lib/` directory.

---

## db.js — Local Database (IndexedDB)

The privacy backbone. All captured/created content lives here — never on an external server.

### Why IndexedDB

- Structured storage with indexes (fast queries by tag, date, type)
- No practical size limits (~500MB+ per extension)
- Fully local — no network, no cloud dependency
- Survives browser restarts, tab closes, extension updates
- Per-extension isolation — one extension cannot read another's data

### Exports

```javascript
export async function initDB(dbName, version, schema)
// Initialize or upgrade database. Called once in service worker onInstalled.
// schema = { storeName: { keyPath, indexes: [{ name, field, unique }] } }

export async function put(storeName, record)
// Insert or update. Returns the record key.

export async function get(storeName, key)
// Retrieve single record by key.

export async function getAll(storeName, indexName?, query?)
// Retrieve all records, optionally filtered by index.

export async function remove(storeName, key)
// Delete single record.

export async function query(storeName, indexName, range)
// Query using IDBKeyRange (date ranges, tag lookups, etc).

export async function count(storeName)
// Count total records in a store.

export async function clear(storeName)
// Delete all records. Used for reset/debug.

export async function exportAll()
// Export entire database as JSON. Used by backup.js.

export async function importAll(data)
// Import JSON into database. Merges, does not overwrite.
```

### Base Schema

Extensions extend this. Add stores and indexes per the app brief.

```javascript
const BASE_SCHEMA = {
  content: {
    keyPath: 'id',
    indexes: [
      { name: 'by-created', field: 'createdAt', unique: false },
      { name: 'by-type', field: 'contentType', unique: false },
      { name: 'by-url', field: 'sourceUrl', unique: false }
    ]
  },
  tags: {
    keyPath: 'id',
    indexes: [
      { name: 'by-name', field: 'name', unique: true }
    ]
  },
  content_tags: {
    keyPath: 'id',
    indexes: [
      { name: 'by-content', field: 'contentId', unique: false },
      { name: 'by-tag', field: 'tagId', unique: false }
    ]
  }
};
```

### Error Handling

- `QuotaExceededError` → surface to user: "Storage is full — export and clear some data to make room."
- `VersionError` → schema migration needed. Handle in `onupgradeneeded`.
- All operations return promises — always await + try/catch at call site.

---

## store.js — State Management

Thin wrapper around `chrome.storage.local` with auto-namespacing and reactive listeners.

### Exports

```javascript
export async function getState(key)
// Retrieve a value. Key auto-prefixed with APP_SLUG from constants.js.

export async function setState(key, value)
// Set a value. Key auto-prefixed.

export async function removeState(key)
// Remove a value.

export function onStateChange(key, callback)
// Listen for changes to a specific key.
// callback(newValue, oldValue)
// Uses chrome.storage.onChanged internally.
// Returns unsubscribe function.

export async function getSettings()
// Shorthand: retrieve the full settings object.

export async function updateSettings(partial)
// Shorthand: merge partial into existing settings.
```

### Namespacing

All keys auto-prefixed with `APP_SLUG` from `constants.js`:

```javascript
// Internal: setState('theme', 'dark')
// Stored as: clipboard_theme = 'dark'
```

This prevents collisions if multiple 864zeros extensions are installed.

### Reactive Pattern

```javascript
// In panel UI
import { onStateChange } from '../lib/store.js';

const unsubscribe = onStateChange('captures', (newVal) => {
  renderCaptureList(newVal);
});

// Cleanup when panel closes
window.addEventListener('unload', unsubscribe);
```

---

## backup.js — Backup & Restore

Local export is always free. Google Drive sync is a paid-tier feature.

### Exports

```javascript
export async function exportLocal()
// Export entire IndexedDB as JSON file. Triggers browser download.
// Always available at every tier.

export async function importLocal(file)
// Import JSON file into IndexedDB. Merges with existing data.
// Validates JSON structure before importing.

export async function syncToGoogleDrive(options?)
// Upload database snapshot to user's Google Drive.
// Requires: 'identity' permission + OAuth2.
// Tier gated: Pro and above (enforced internally via tiers.js).

export async function restoreFromGoogleDrive()
// Download and import latest snapshot from Drive.

export async function getLastSyncTimestamp()
// Returns ISO timestamp of last successful Google Drive sync. Null if never.
```

### Google Drive Architecture

- Uses Chrome `identity` API for OAuth2 (user's existing Google account)
- Creates a **hidden app folder** in Drive — no clutter in user's file list
- Snapshots are JSON, encrypted at rest by Google Drive
- Auto-sync available via `chrome.alarms` (default: every 24h, configurable)
- Only available at Pro tier and above — `tiers.js` enforces this
- **864zeros never sees or stores the data** — it flows directly between the browser and the user's Drive

### Local Export Format

```json
{
  "app": "clipboard",
  "version": "1.0.0",
  "exportedAt": "2026-02-05T...",
  "stores": {
    "content": [ ...records ],
    "tags": [ ...records ],
    "content_tags": [ ...records ]
  }
}
```

### Import Validation

Before importing, validate:
- JSON is parseable
- `app` field matches current extension
- `stores` keys match current schema
- Records have required `keyPath` fields

On mismatch: reject with user-friendly message ("This file doesn't match this extension — make sure you're importing the right backup").

---

## Privacy Flow (Complete)

```
User creates/captures content
  → Stored in IndexedDB (local, never leaves browser)

User triggers AI analysis
  → redactor.js strips PPI locally
  → api-client.js sends ONLY redacted content to AI provider
  → Response returns to extension
  → Original content in IndexedDB is NEVER sent

User exports data
  → db.js.exportAll() generates JSON
  → Browser downloads file directly — no server involved

User enables Google Drive sync (Pro tier)
  → backup.js uploads to USER'S Drive via USER'S account
  → 864zeros has zero access to the data

What leaves the browser:
  → Redacted content to AI APIs (no PPI)
  → Database snapshot to user's own Google Drive (user's choice)
  → Nothing else. Ever.
```

---

## Integration Checklist (Extension-Specific)

In addition to the core checklist in `lib-core.md`:

- [ ] Copy entire `/lib/` (core + extension modules) into extension root
- [ ] Call `initDB()` with app-specific schema in service worker `onInstalled`
- [ ] Import `store.js` in panel scripts for reactive state
- [ ] Test local backup export/import works before shipping
- [ ] If Pro tier includes Drive sync: add `identity` permission to manifest
- [ ] Verify IndexedDB data persists across extension reload
- [ ] Verify storage namespacing (install two 864z extensions simultaneously — no key collisions)
