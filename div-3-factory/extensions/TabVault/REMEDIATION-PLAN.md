# TabVault Remediation Plan

> **Goal:** Fix 864zeros compliance issues AND implement missing OneTab-gap features
> **Approach:** Phased, following 864zeros build methodology
> **Priority:** Infrastructure first, then features, then polish

---

## Phase 1: Critical Infrastructure Fixes

**Gate:** Extension loads without errors, Deep Sleep works reliably

### 1.1 Manifest Fixes

**File:** `manifest.json`

| Change | From | To |
|--------|------|-----|
| Version format | `"1.0"` | `"1.0.0"` |
| Options declaration | `"options_page"` | `"options_ui"` with `open_in_tab: true` |
| Add alarms permission | missing | `"alarms"` |

```json
{
  "manifest_version": 3,
  "name": "__MSG_appName__",
  "version": "1.0.0",
  "description": "__MSG_appDescription__",
  "default_locale": "en",
  "icons": {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  },
  "permissions": [
    "sidePanel",
    "storage",
    "tabs",
    "scripting",
    "alarms"
  ],
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "side_panel": {
    "default_path": "sidepanel/index.html"
  },
  "action": {
    "default_title": "Click to open TabVault"
  },
  "options_ui": {
    "page": "options/options.html",
    "open_in_tab": true
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["scripts/content.js"],
      "css": ["scripts/injector.css"]
    }
  ]
}
```

### 1.2 Rename Service Worker

```
background/service_worker.js → background/service-worker.js
```

### 1.3 Fix Service Worker Architecture

**File:** `background/service-worker.js`

**Critical fixes:**
1. Move `setPanelBehavior` to TOP LEVEL (not inside onInstalled)
2. Replace `setInterval` with `chrome.alarms`
3. Remove global `tabActivity` object — use `chrome.storage.local`
4. Remove invalid `chrome.runtime.onActivated` listener

```javascript
// ============================================================
// SERVICE WORKER — TabVault
// All listeners at TOP LEVEL (MV3 requirement)
// ============================================================

import { initVault, mirrorTab, getVaultContents, deleteTab } from '../lib/db.js';

// --- Panel Behavior (TOP LEVEL — REQUIRED) ---
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[service-worker] Panel behavior error:', error));

// --- Alarm for Deep Sleep Check ---
const DEEP_SLEEP_ALARM = 'tabvault_deep_sleep_check';
const INACTIVITY_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes

// Create alarm on install
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.local.set({
      tabvault_initialized: true,
      tabvault_settings: { deepSleepEnabled: true, inactivityMinutes: 20 },
      tabvault_tab_activity: {}
    });
    console.log('[service-worker] TabVault installed.');
  }

  // Create recurring alarm (runs every minute)
  chrome.alarms.create(DEEP_SLEEP_ALARM, { periodInMinutes: 1 });
});

// --- Deep Sleep Alarm Handler ---
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== DEEP_SLEEP_ALARM) return;

  const { tabvault_settings, tabvault_tab_activity } =
    await chrome.storage.local.get(['tabvault_settings', 'tabvault_tab_activity']);

  if (!tabvault_settings?.deepSleepEnabled) return;

  const now = Date.now();
  const threshold = (tabvault_settings.inactivityMinutes || 20) * 60 * 1000;
  const activity = tabvault_tab_activity || {};

  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    if (tab.active || tab.discarded || !tab.id) continue;

    const lastActive = activity[tab.id] || now;
    if (now - lastActive > threshold) {
      try {
        await chrome.tabs.discard(tab.id);
        console.log(`[deep-sleep] Discarded tab ${tab.id}`);
      } catch (err) {
        console.error(`[deep-sleep] Failed to discard tab ${tab.id}:`, err);
      }
    }
  }
});

// --- Tab Activity Tracking (persist to storage) ---
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const { tabvault_tab_activity } =
    await chrome.storage.local.get('tabvault_tab_activity');
  const activity = tabvault_tab_activity || {};
  activity[activeInfo.tabId] = Date.now();
  await chrome.storage.local.set({ tabvault_tab_activity: activity });
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { tabvault_tab_activity } =
    await chrome.storage.local.get('tabvault_tab_activity');
  const activity = tabvault_tab_activity || {};
  delete activity[tabId];
  await chrome.storage.local.set({ tabvault_tab_activity: activity });
});

// --- Initialize IndexedDB ---
initVault()
  .then(() => console.log('[service-worker] IndexedDB initialized.'))
  .catch((err) => console.error('[service-worker] IndexedDB init failed:', err));

// --- Message Relay ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  (async () => {
    try {
      switch (type) {
        case 'TABVAULT_GET_CONTENTS':
          const contents = await getVaultContents();
          sendResponse({ success: true, data: contents });
          break;

        case 'TABVAULT_VAULT_TAB':
          await mirrorTab(payload.tabId, payload.tabData);
          sendResponse({ success: true });
          break;

        case 'TABVAULT_DELETE_TAB':
          await deleteTab(payload.tabId);
          sendResponse({ success: true });
          break;

        case 'TABVAULT_CAPTURE_SCROLL':
          // Relay scroll position from content script
          await mirrorTab(payload.tabId, { scrollPosition: payload.scrollY });
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Keep channel open for async
});
```

### 1.4 Split lib/store.js into Proper Modules

**Rename:** `lib/store.js` → `lib/db.js` (IndexedDB)

**Create new:** `lib/store.js` (chrome.storage.local wrapper)

**Create new:** `lib/constants.js`

```javascript
// lib/constants.js
export const APP_SLUG = 'tabvault';
export const DB_NAME = 'tabvault_db';
export const DB_VERSION = 2;
export const STORE_NAME = 'vaulted_tabs';

export const MESSAGE_TYPES = {
  GET_CONTENTS: 'TABVAULT_GET_CONTENTS',
  VAULT_TAB: 'TABVAULT_VAULT_TAB',
  DELETE_TAB: 'TABVAULT_DELETE_TAB',
  CAPTURE_SCROLL: 'TABVAULT_CAPTURE_SCROLL',
  CLEAR_VAULT: 'TABVAULT_CLEAR_VAULT'
};

export const STORAGE_KEYS = {
  INITIALIZED: 'tabvault_initialized',
  SETTINGS: 'tabvault_settings',
  TAB_ACTIVITY: 'tabvault_tab_activity'
};
```

---

## Phase 2: OIA Design System Integration

**Gate:** All UI renders with Nunito font, OIA components, dark mode works

### 2.1 Update sidepanel/index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TabVault</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../lib/oia-design-system.css">
  <link rel="stylesheet" href="styles.css">
</head>
<body class="oia-screen">
  <header class="oia-mb-md">
    <h1 class="oia-h1">TabVault</h1>
  </header>

  <section class="oia-section">
    <button id="captureCurrentTab" class="oia-btn oia-btn-primary" style="width: 100%;">
      Vault Current Tab
    </button>
  </section>

  <section id="vaultedTabs" class="oia-section">
    <h2 class="oia-h2 oia-mb-sm">Vaulted Tabs</h2>
    <div id="vaultedTabsList"></div>
    <div id="emptyState" class="oia-empty" style="display: none;">
      <p class="oia-empty__headline">Your vault is ready</p>
      <p class="oia-empty__subtext">Click the button above to save your first tab</p>
    </div>
  </section>

  <script type="module" src="main.js"></script>
</body>
</html>
```

### 2.2 Update sidepanel/styles.css

```css
/* TabVault Side Panel — App-specific overrides only */
/* Base styles come from oia-design-system.css */

body {
  padding: var(--oia-space-md);
  min-height: 100vh;
}

/* Vault list item */
.vault-item {
  display: flex;
  align-items: center;
  gap: var(--oia-space-sm);
  padding: var(--oia-space-sm) var(--oia-space-md);
  background-color: var(--oia-bg-card);
  border-radius: var(--oia-radius-md);
  margin-bottom: var(--oia-space-sm);
  transition: background-color var(--oia-duration-fast) var(--oia-ease-default);
}

.vault-item:hover {
  background-color: var(--oia-bg-elevated);
}

.vault-item__favicon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.vault-item__title {
  flex: 1;
  font-size: var(--oia-size-body-sm);
  color: var(--oia-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.vault-item__title:hover {
  color: var(--oia-sage);
}

.vault-item__delete {
  width: var(--oia-touch-min);
  height: var(--oia-touch-min);
  min-width: var(--oia-touch-min);
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--oia-text-muted);
  cursor: pointer;
  border-radius: var(--oia-radius-sm);
  transition: color var(--oia-duration-fast), background-color var(--oia-duration-fast);
}

.vault-item__delete:hover {
  color: var(--oia-error);
  background-color: rgba(212, 132, 122, 0.1);
}

/* Toast notifications */
.vault-toast {
  position: fixed;
  bottom: var(--oia-space-lg);
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}
```

### 2.3 Copy OIA Design System

```
Copy: 864z-build-kit/references/core/oia-design-system.css
  To: extensions/TabVault/lib/oia-design-system.css
```

### 2.4 Update options/options.html (similar pattern)

Apply same OIA treatment: Nunito font, design system CSS, component classes.

---

## Phase 3: Scroll Position Capture (Context Gap Fix)

**Gate:** Scroll position captured and restored correctly

### 3.1 Implement Content Script

**File:** `scripts/content.js`

```javascript
// ============================================================
// CONTENT SCRIPT — TabVault
// Captures scroll position for context preservation
// Runs in isolated world — shares DOM, not JS environment
// ============================================================

// Capture scroll position on request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TABVAULT_GET_SCROLL') {
    sendResponse({
      scrollX: window.scrollX,
      scrollY: window.scrollY
    });
  }
  return false; // Synchronous response
});

// Restore scroll position on request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TABVAULT_RESTORE_SCROLL') {
    window.scrollTo({
      top: message.scrollY || 0,
      left: message.scrollX || 0,
      behavior: 'smooth'
    });
    sendResponse({ success: true });
  }
  return false;
});
```

### 3.2 Update Vault Capture Flow

In `sidepanel/main.js`, before vaulting a tab:

```javascript
async function captureTabWithContext(tab) {
  // Get scroll position from content script
  let scrollPosition = { scrollX: 0, scrollY: 0 };

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'TABVAULT_GET_SCROLL'
    });
    scrollPosition = response;
  } catch (err) {
    // Content script may not be injected (chrome:// pages, etc.)
    console.log('[vault] Could not capture scroll position:', err.message);
  }

  return {
    tabId: tab.id,
    url: tab.url,
    title: tab.title,
    favIconUrl: tab.favIconUrl || '',
    windowId: tab.windowId,
    scrollX: scrollPosition.scrollX,
    scrollY: scrollPosition.scrollY,
    vaultedAt: Date.now()
  };
}
```

### 3.3 Update IndexedDB Schema

**File:** `lib/db.js`

```javascript
// Updated schema with scroll position and timestamps
const schema = {
  tabId: 'number (primary key)',
  url: 'string',
  title: 'string',
  favIconUrl: 'string',
  windowId: 'number',
  scrollX: 'number',
  scrollY: 'number',
  vaultedAt: 'number (timestamp)',
  lastAccessed: 'number (timestamp)'
};
```

---

## Phase 4: Vault Architecture Clarification

**Gate:** Clear distinction between "vaulted" tabs and "active" tabs

### 4.1 Remove Auto-Mirroring of All Tabs

The current `chrome.tabs.onUpdated` listener mirrors EVERY tab update. This is confusing.

**New behavior:**
- Only store tabs when user explicitly clicks "Vault"
- Remove automatic mirroring
- Deep Sleep (discard) is separate from vaulting

### 4.2 Add "Vault and Close" Action

Primary user flow should be:
1. User clicks "Vault Current Tab"
2. Tab data (including scroll position) saved to IndexedDB
3. Tab is closed
4. User can restore later

```javascript
async function vaultAndClose(tabId) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabData = await captureTabWithContext(tab);

  await sendMessageToBackground('TABVAULT_VAULT_TAB', {
    tabId: tabData.tabId,
    tabData
  });

  // Close the tab after vaulting
  await chrome.tabs.remove(tabId);

  showToast('Tab vaulted');
  renderVaultedTabs();
}
```

### 4.3 Add "Vault All Tabs" Action

OneTab's killer feature — vault entire window at once.

```javascript
async function vaultAllTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });

  // Don't vault the extension's own pages
  const vaultableTabs = tabs.filter(t =>
    !t.url.startsWith('chrome://') &&
    !t.url.startsWith('chrome-extension://')
  );

  for (const tab of vaultableTabs) {
    const tabData = await captureTabWithContext(tab);
    await sendMessageToBackground('TABVAULT_VAULT_TAB', {
      tabId: tabData.tabId,
      tabData
    });
  }

  // Close all vaulted tabs
  await chrome.tabs.remove(vaultableTabs.map(t => t.id));

  showToast(`${vaultableTabs.length} tabs vaulted`);
  renderVaultedTabs();
}
```

---

## Phase 5: Export/Backup Functionality

**Gate:** Users can export vault to JSON, import from file

### 5.1 Add Export Feature

**File:** `lib/backup.js`

```javascript
// Export vault contents to JSON file
export async function exportVault() {
  const contents = await getVaultContents();

  const exportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    source: 'TabVault',
    tabs: contents
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const filename = `tabvault-backup-${new Date().toISOString().slice(0,10)}.json`;

  // Trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

// Import vault from JSON file
export async function importVault(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!data.tabs || !Array.isArray(data.tabs)) {
          throw new Error('Invalid backup format');
        }

        let imported = 0;
        for (const tab of data.tabs) {
          await mirrorTab(tab.tabId || `import-${Date.now()}-${imported}`, tab);
          imported++;
        }

        resolve({ imported });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
```

### 5.2 Improve OneTab Bridge Parser

```javascript
// Parse OneTab export format
// Supports: "url | title" and bare URLs
export function parseOneTabExport(text) {
  const lines = text.trim().split('\n');
  const tabs = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Try "url | title" format
    const pipeIndex = trimmed.indexOf(' | ');
    if (pipeIndex > 0) {
      const url = trimmed.slice(0, pipeIndex).trim();
      const title = trimmed.slice(pipeIndex + 3).trim();
      if (isValidUrl(url)) {
        tabs.push({ url, title, vaultedAt: Date.now() });
      }
    } else if (isValidUrl(trimmed)) {
      // Bare URL
      tabs.push({ url: trimmed, title: trimmed, vaultedAt: Date.now() });
    }
  }

  return tabs;
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
```

---

## Phase 6: UX Polish

**Gate:** No browser dialogs, OIA-compliant copy, ADHD-friendly interactions

### 6.1 Remove confirm() and alert()

Replace with inline confirmation UI:

```javascript
// Instead of: confirm('Are you sure?')
// Use inline confirmation component

function showConfirmation(message, onConfirm) {
  const container = document.getElementById('confirmContainer');
  container.innerHTML = `
    <div class="oia-card confirm-dialog oia-animate-slide-up">
      <p class="oia-body">${message}</p>
      <div class="confirm-actions oia-gap-sm" style="display: flex; margin-top: var(--oia-space-md);">
        <button class="oia-btn oia-btn-secondary confirm-cancel" style="flex: 1;">Cancel</button>
        <button class="oia-btn oia-btn-primary confirm-yes" style="flex: 1;">Yes</button>
      </div>
    </div>
  `;
  container.style.display = 'block';

  container.querySelector('.confirm-cancel').onclick = () => {
    container.style.display = 'none';
  };

  container.querySelector('.confirm-yes').onclick = () => {
    container.style.display = 'none';
    onConfirm();
  };
}
```

### 6.2 Add Toast Notifications

```javascript
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `oia-toast oia-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('oia-toast--dismiss');
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}
```

### 6.3 Fix Copy Per CLAUDE-base.md

| Current | Replace With |
|---------|--------------|
| "No tabs in the vault yet." | "Your vault is ready" |
| "Please paste OneTab export data." | "Paste your OneTab data above" |
| "Are you sure you want to clear ALL vaulted tabs?" | (Use inline confirmation, no guilt copy) |
| "All vaulted tabs cleared." | "Vault cleared" (toast) |

---

## File Changes Summary

| Action | Path |
|--------|------|
| **Rename** | `background/service_worker.js` → `background/service-worker.js` |
| **Rewrite** | `background/service-worker.js` (alarms, top-level listeners) |
| **Rewrite** | `manifest.json` |
| **Rename** | `lib/store.js` → `lib/db.js` |
| **Create** | `lib/store.js` (chrome.storage wrapper) |
| **Create** | `lib/constants.js` |
| **Create** | `lib/backup.js` |
| **Copy** | `lib/oia-design-system.css` (from build-kit) |
| **Rewrite** | `sidepanel/index.html` (OIA classes) |
| **Rewrite** | `sidepanel/styles.css` (OIA tokens) |
| **Rewrite** | `sidepanel/main.js` (new vault flow) |
| **Rewrite** | `options/options.html` (OIA classes) |
| **Rewrite** | `options/options.css` (OIA tokens) |
| **Rewrite** | `options/options.js` (remove confirm/alert) |
| **Rewrite** | `scripts/content.js` (scroll capture) |

---

## Verification Checklist

### Phase 1 Complete When:
- [ ] Extension loads in Chrome without errors
- [ ] Deep Sleep alarm fires every minute (check `chrome://extensions` → service worker logs)
- [ ] Tab discarding works after 20 mins inactivity
- [ ] `setPanelBehavior` at top level (panel opens on icon click)

### Phase 2 Complete When:
- [ ] Nunito font renders in side panel
- [ ] Nunito font renders in options page
- [ ] Dark mode works automatically (change system preference)
- [ ] All buttons use `.oia-btn` classes

### Phase 3 Complete When:
- [ ] Scroll position captured when vaulting tab
- [ ] Scroll position restored when opening vaulted tab
- [ ] Works on standard web pages
- [ ] Gracefully fails on chrome:// pages

### Phase 4 Complete When:
- [ ] "Vault Current Tab" saves and closes tab
- [ ] "Vault All Tabs" works for entire window
- [ ] No automatic mirroring of every tab
- [ ] Restore opens tab at correct scroll position

### Phase 5 Complete When:
- [ ] Export downloads JSON file
- [ ] Import restores from JSON file
- [ ] OneTab import parses correctly
- [ ] Error handling for invalid imports

### Phase 6 Complete When:
- [ ] No `confirm()` or `alert()` calls
- [ ] Toast notifications work
- [ ] All copy follows CLAUDE-base.md rules
- [ ] Touch targets minimum 48px

---

## Estimated Scope

| Phase | Files Changed | Complexity |
|-------|---------------|------------|
| Phase 1 | 4 | High (service worker rewrite) |
| Phase 2 | 5 | Medium (styling) |
| Phase 3 | 3 | Medium (content script) |
| Phase 4 | 2 | Medium (logic changes) |
| Phase 5 | 3 | Low (new features) |
| Phase 6 | 3 | Low (UX polish) |

**Total:** ~15 files, mostly rewrites of existing code

---

*Plan created: 2026-02-16*
*Status: Ready for implementation*
