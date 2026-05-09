# Chrome Extension Architectural Standard (2026)

**Version:** 2.0  
**Platform:** Manifest V3 (MV3)  
**Last Verified:** 2026-02-05 against [Chrome Extensions API Reference](https://developer.chrome.com/docs/extensions/reference/api)  
**Purpose:** Scaffold-ready specification for CLI agents (Claude Code, Gemini CLI) and human developers.

---

## How to Use This Document

This standard defines **two extension templates** — Panel and Popup — with shared conventions.

- **Humans:** Read top-to-bottom for architecture decisions and rationale.
- **CLI Agents:** Parse the `Directory Structure`, `manifest.json`, and `Boilerplate` sections to scaffold projects. All placeholder values use the `__PLACEHOLDER__` convention for find-and-replace.
- **Both:** The `Pre-Build Checklist` section at the end must be completed before any code is written.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Pre-Build Checklist (REQUIRED)](#2-pre-build-checklist-required)
3. [Template A — Panel Extension](#3-template-a--panel-extension)
4. [Template B — Popup Extension](#4-template-b--popup-extension)
5. [Shared Conventions](#5-shared-conventions)
6. [Service Worker Rules](#6-service-worker-rules)
7. [State Management](#7-state-management)
8. [Communication Patterns](#8-communication-patterns)
9. [Permissions Policy](#9-permissions-policy)
10. [Icon and Asset Requirements](#10-icon-and-asset-requirements)
11. [Quick Reference Card](#11-quick-reference-card)

---

## 1. Design Philosophy

Three principles drive every decision in this standard:

**Single Responsibility** — Each file has one job. The service worker relays. The UI renders. Content scripts touch the DOM. Shared modules hold utilities. No file crosses lanes.

**State-Driven UI** — `chrome.storage.local` is the single source of truth. UI scripts listen for changes and react. No component holds state that isn't backed by storage.

**Ephemeral Workers** — MV3 service workers shut down when idle. All listeners register at the top level. All state persists to storage. No global variables survive a restart.

---

## 2. Pre-Build Checklist (REQUIRED)

> **Stop.** Do not scaffold or generate code until every item below is resolved.  
> These are the developer's responsibility and cannot be auto-generated.

### 2.1 Extension Identity

| Item | Value | Notes |
|------|-------|-------|
| Extension Name | `__APP_NAME__` | Used in manifest `"name"` and `_locales` |
| Description | `__APP_DESCRIPTION__` | Max 132 characters for Chrome Web Store |
| Version | `1.0.0` | Semver. Increment on every CWS publish |

### 2.2 Icons and Assets (USER TASK — CRITICAL)

Chrome requires specific icon sizes. **These must be created by the developer before the extension will load.**

| File | Size | Format | Used By |
|------|------|--------|---------|
| `assets/icon16.png` | 16×16 px | PNG, transparent bg | Browser toolbar (favicon size) |
| `assets/icon48.png` | 48×48 px | PNG, transparent bg | Extensions management page (`chrome://extensions`) |
| `assets/icon128.png` | 128×128 px | PNG, transparent bg | Chrome Web Store listing, install dialog |

**Rules:**

- All three sizes are **required**. Chrome will error on load if any are missing.
- Files must be **PNG format** — no SVG, no JPEG, no WebP in the manifest `"icons"` field.
- Paths in the manifest are **relative to the manifest.json location** (project root).
- For a polished result, design at 128×128 and scale down. Do not scale up from 16.
- If applying a design system (e.g., OIA Design System), match the brand palette in the icon. The icon is the user's first visual contact with the extension.
- Optional: a `assets/icon32.png` (32×32 px) for Windows high-DPI displays.

**Verification command (after placing files):**

```bash
# Confirm all required icons exist and are valid PNGs
for size in 16 48 128; do
  file="assets/icon${size}.png"
  if [ -f "$file" ]; then
    echo "✅ $file exists ($(file -b $file))"
  else
    echo "❌ MISSING: $file — extension will not load"
  fi
done
```

### 2.3 Permissions Audit

Before scaffolding, list every Chrome API your extension needs and map it to the minimum permission. See [Section 9](#9-permissions-policy) for the full policy.

---

## 3. Template A — Panel Extension

**Use when:** The extension needs a persistent sidebar companion that stays open as users navigate tabs and sites. Think dashboards, annotation tools, knowledge bases.

### 3.1 Directory Structure

```
__APP_SLUG__/
├── manifest.json                # Extension config — see 3.2
├── _locales/                    # Internationalization
│   └── en/
│       └── messages.json        # English strings (required if "default_locale" is set)
├── assets/                      # Icons and branding (USER MUST PROVIDE — see Section 2.2)
│   ├── icon16.png               # 16×16 — toolbar
│   ├── icon48.png               # 48×48 — management page
│   └── icon128.png              # 128×128 — Web Store
├── background/                  # SERVICE WORKER (the relay)
│   └── service-worker.js        # Lifecycle events, sidePanel control, message routing
├── sidepanel/                   # SIDE PANEL UI (persistent view)
│   ├── index.html               # Panel skeleton — loads main.js and styles.css
│   ├── main.js                  # UI logic, chrome.storage listeners, render functions
│   └── styles.css               # Panel-specific styling (or design system import)
├── scripts/                     # CONTENT SCRIPTS (DOM interaction)
│   ├── content.js               # Reads/modifies the active web page
│   └── injector.css             # Styles injected into the host page
├── lib/                         # SHARED MODULES (utilities)
│   ├── api-client.js            # External/backend API communication
│   └── store.js                 # chrome.storage.local wrapper and state helpers
└── options/                     # CONFIGURATION (user settings)
    ├── options.html             # Settings page skeleton
    └── options.js               # Preference persistence logic
```

### 3.2 manifest.json

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
    "storage"
  ],
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "side_panel": {
    "default_path": "sidepanel/index.html"
  },
  "action": {
    "default_title": "Click to open panel"
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

**Key decisions in this manifest:**

| Field | Why |
|-------|-----|
| `"type": "module"` | Enables ES module `import/export` in the service worker. Optional but recommended for clean code organization. |
| `"side_panel.default_path"` | Registers the panel globally (all sites). Use `sidePanel.setOptions()` in the service worker to restrict to specific URLs. |
| `"action"` with no `"default_popup"` | Required so the toolbar icon can trigger `setPanelBehavior({ openPanelOnActionClick: true })`. If you add a popup here, it overrides the panel-open behavior. |
| `"options_ui"` (not `"options_page"`) | Modern pattern. `open_in_tab: true` gives a full-page settings experience. |
| `"default_locale": "en"` | Enables `__MSG_*__` tokens in the manifest. Requires `_locales/en/messages.json`. |

### 3.3 Service Worker Boilerplate

**File:** `background/service-worker.js`

```javascript
// ============================================================
// SERVICE WORKER — Panel Extension
// Registers all listeners at the TOP LEVEL (MV3 requirement).
// This file is the relay. It does NOT hold UI logic or state.
// ============================================================

// --- Panel Behavior ---
// Opens the side panel when the user clicks the toolbar icon.
// REQUIRED: This cannot be set in the manifest — only via API.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[service-worker] Panel behavior error:', error));

// --- Install / Update ---
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    // Initialize default state on first install
    chrome.storage.local.set({
      __APP_SLUG___initialized: true,
      __APP_SLUG___settings: {}
    });
    console.log('[service-worker] Extension installed. Default state set.');
  }
  if (reason === 'update') {
    console.log('[service-worker] Extension updated.');
  }
});

// --- Message Relay ---
// Routes messages from content scripts, side panel, and options page.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {
    case 'CONTENT_TO_BACKGROUND':
      // Handle content script messages
      // Example: relay captured data to storage
      handleContentMessage(payload, sendResponse);
      return true; // Keep channel open for async response

    case 'PANEL_TO_BACKGROUND':
      // Handle side panel requests
      handlePanelMessage(payload, sendResponse);
      return true;

    default:
      console.warn('[service-worker] Unknown message type:', type);
      return false;
  }
});

// --- Handlers ---
async function handleContentMessage(payload, sendResponse) {
  try {
    // Process and store content script data
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handlePanelMessage(payload, sendResponse) {
  try {
    // Process side panel requests
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}
```

### 3.4 _locales/en/messages.json

```json
{
  "appName": {
    "message": "__APP_NAME__",
    "description": "Extension display name"
  },
  "appDescription": {
    "message": "__APP_DESCRIPTION__",
    "description": "Extension description for Chrome Web Store"
  }
}
```

---

## 4. Template B — Popup Extension

**Use when:** The extension performs quick, transient actions — a lookup, a toggle, a one-click tool. The popup closes when focus leaves it.

### 4.1 Directory Structure

```
__APP_SLUG__/
├── manifest.json                # Extension config — see 4.2
├── _locales/                    # Internationalization
│   └── en/
│       └── messages.json        # English strings
├── assets/                      # Icons and branding (USER MUST PROVIDE — see Section 2.2)
│   ├── icon16.png               # 16×16 — toolbar
│   ├── icon48.png               # 48×48 — management page
│   └── icon128.png              # 128×128 — Web Store
├── background/                  # SERVICE WORKER (the relay)
│   └── service-worker.js        # Lifecycle events, background tasks, message routing
├── popup/                       # POPUP UI (transient view)
│   ├── popup.html               # Compact UI skeleton (max ~800×600 rendered)
│   ├── popup.js                 # Event-driven logic (closes on blur)
│   └── popup.css                # Compact styling
├── scripts/                     # CONTENT SCRIPTS (DOM interaction)
│   ├── content.js               # Page-level logic
│   └── injector.css             # Page-level styling
├── lib/                         # SHARED MODULES (utilities)
│   ├── api-client.js            # API fetch wrappers
│   └── store.js                 # chrome.storage.local wrapper and state helpers
└── options/                     # CONFIGURATION (user settings)
    ├── options.html             # Settings interface
    └── options.js               # Preference persistence logic
```

### 4.2 manifest.json

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
  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "__APP_NAME__"
  },
  "permissions": [
    "storage"
  ],
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
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

**Key differences from Panel template:**

| Field | Panel | Popup |
|-------|-------|-------|
| `"action.default_popup"` | Not set (icon opens panel) | Set (icon opens popup) |
| `"side_panel"` | Present | Not present |
| `"sidePanel"` permission | Required | Not needed |

### 4.3 Service Worker Boilerplate

**File:** `background/service-worker.js`

```javascript
// ============================================================
// SERVICE WORKER — Popup Extension
// Registers all listeners at the TOP LEVEL (MV3 requirement).
// This file is the relay. It does NOT hold UI logic or state.
// ============================================================

// --- Install / Update ---
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.local.set({
      __APP_SLUG___initialized: true,
      __APP_SLUG___settings: {}
    });
    console.log('[service-worker] Extension installed. Default state set.');
  }
});

// --- Message Relay ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {
    case 'CONTENT_TO_BACKGROUND':
      handleContentMessage(payload, sendResponse);
      return true;

    case 'POPUP_TO_BACKGROUND':
      handlePopupMessage(payload, sendResponse);
      return true;

    default:
      console.warn('[service-worker] Unknown message type:', type);
      return false;
  }
});

// --- Handlers ---
async function handleContentMessage(payload, sendResponse) {
  try {
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handlePopupMessage(payload, sendResponse) {
  try {
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}
```

---

## 5. Shared Conventions

These apply to **both** templates.

### 5.1 File Naming

| Convention | Example | Why |
|------------|---------|-----|
| Kebab-case for files | `api-client.js`, `service-worker.js` | Consistent, URL-safe, no casing issues across OS |
| Descriptive, not generic | `store.js` not `utils.js` | Every file's purpose is obvious from its name |
| CSS matches its HTML | `popup.css` → `popup.html` | Clear 1:1 relationship |

### 5.2 Message Format

All `chrome.runtime.sendMessage` calls use a standard envelope:

```javascript
// Sending
chrome.runtime.sendMessage({
  type: 'ACTION_NAME',        // UPPER_SNAKE_CASE action identifier
  payload: { /* data */ }     // Structured data object
});

// Receiving (in service worker)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;
  // Route by type
});
```

### 5.3 Storage Key Namespacing

Prefix all storage keys with the app slug to avoid collisions if multiple extensions share storage patterns:

```javascript
// Good
chrome.storage.local.set({ 'myapp_settings': { theme: 'dark' } });

// Bad — generic keys risk collision
chrome.storage.local.set({ 'settings': { theme: 'dark' } });
```

### 5.4 Content Script Isolation

Content scripts run in an **isolated world** — they share the DOM with the host page but NOT the JavaScript environment. This means:

- You **can** read and modify the DOM.
- You **cannot** access the host page's JavaScript variables or functions.
- You **can** communicate with the service worker via `chrome.runtime.sendMessage`.
- Injected CSS (`injector.css`) affects the host page — scope selectors carefully to avoid conflicts.

---

## 6. Service Worker Rules

MV3 service workers are **ephemeral**. They start, do work, and shut down. These rules are non-negotiable:

| Rule | Rationale |
|------|-----------|
| **Register all listeners at the top level** | Listeners inside `async`, callbacks, or `setTimeout` may not survive a restart. Chrome re-runs the top-level code on wake. |
| **Never rely on global variables for state** | Globals are wiped on shutdown. Use `chrome.storage.local` for anything that must persist. |
| **Return `true` from `onMessage` for async** | If your listener calls `sendResponse` asynchronously, you must `return true` to keep the message channel open. |
| **Use `chrome.alarms` for scheduled work** | `setTimeout` and `setInterval` do not survive shutdown. `chrome.alarms` triggers reliably (min 30s in Chrome 120+). |
| **No DOM access** | Service workers have no `document` or `window`. Use the `offscreen` API if you need a hidden DOM context. |
| **Single entry point** | The `"service_worker"` field takes one file. Use `"type": "module"` and `import` to split logic across files. |

---

## 7. State Management

```
┌─────────────────────────────────────────────────────────┐
│                  chrome.storage.local                    │
│                 (Single Source of Truth)                 │
└──────────┬──────────────────┬──────────────────┬────────┘
           │ writes           │ writes           │ writes
    ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │  Service    │    │  Panel /    │    │  Content    │
    │  Worker     │    │  Popup UI   │    │  Script     │
    └─────────────┘    └──────▲──────┘    └─────────────┘
                              │ listens
                    chrome.storage.onChanged
```

**Pattern:** Any script can write to storage. UI scripts listen for changes and re-render. This ensures the UI always reflects the latest state, even if the service worker updated storage in the background.

```javascript
// store.js — Shared storage wrapper
export async function getState(key) {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? null;
}

export async function setState(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

// In UI scripts (main.js or popup.js)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  for (const [key, { newValue }] of Object.entries(changes)) {
    render(key, newValue); // Your UI update function
  }
});
```

---

## 8. Communication Patterns

### 8.1 Transient Messages (fire-and-forget or request/response)

```javascript
// Content script → Service worker
chrome.runtime.sendMessage(
  { type: 'CAPTURE_TEXT', payload: { text: selectedText, url: location.href } },
  (response) => { if (response.success) showConfirmation(); }
);
```

### 8.2 Persistent Connections (long-lived port)

Use when content script and service worker need ongoing two-way communication:

```javascript
// Content script — open port
const port = chrome.runtime.connect({ name: 'content-channel' });
port.postMessage({ type: 'STREAM_START' });
port.onMessage.addListener((msg) => { /* handle responses */ });

// Service worker — listen for port
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'content-channel') {
    port.onMessage.addListener((msg) => { /* handle */ });
  }
});
```

### 8.3 When to Use Which

| Scenario | Pattern |
|----------|---------|
| Content script sends captured data once | `sendMessage` |
| Panel needs real-time DOM updates from content script | `connect` (port) |
| Service worker broadcasts state change | Write to `chrome.storage.local`, UI listens via `onChanged` |
| Tab-specific panel content | `sidePanel.setOptions({ tabId, path })` in service worker |

---

## 9. Permissions Policy

**Principle of Least Privilege.** Request only what the extension actually uses.

| Permission | Grants | Typical Use |
|------------|--------|-------------|
| `storage` | `chrome.storage` API | Almost always needed. State persistence. |
| `sidePanel` | `chrome.sidePanel` API | Panel extensions only. |
| `activeTab` | Temporary access to the active tab on user gesture | Safer alternative to `<all_urls>` host permission. |
| `tabs` | Read tab URLs and metadata | Only if you need tab URL info programmatically. |
| `contextMenus` | Right-click menu items | If extension adds context menu entries. |
| `alarms` | `chrome.alarms` for scheduled tasks | Background polling, periodic sync. |
| `identity` | OAuth2 flows | Google Drive, external API auth. |
| `offscreen` | Hidden DOM document | When service worker needs DOM APIs (e.g., DOMParser). |

**Host permissions** (access to web page content) go in `"host_permissions"`, not `"permissions"`:

```json
"host_permissions": [
  "https://specific-domain.com/*"
]
```

Avoid `"<all_urls>"` in `host_permissions` unless your extension genuinely needs to run on every site. It triggers a broader permission warning during install.

For `content_scripts`, `"matches": ["<all_urls>"]` is acceptable when the content script passively listens (e.g., text selection). If the content script is only needed on specific sites, narrow the match pattern.

---

## 10. Icon and Asset Requirements

> **This section is critical. Missing or malformed icons are the #1 reason extensions fail to load during development.**

### 10.1 Required Icons

| Purpose | File | Dimensions | Notes |
|---------|------|------------|-------|
| Toolbar | `assets/icon16.png` | 16×16 px | Appears next to the address bar |
| Management | `assets/icon48.png` | 48×48 px | Shown on `chrome://extensions` |
| Web Store | `assets/icon128.png` | 128×128 px | Install dialog, CWS listing |

### 10.2 Format Rules

- **PNG only** for manifest `"icons"` entries.
- **Transparent backgrounds** recommended (Chrome toolbar adapts to light/dark themes).
- **No padding baked in** — Chrome adds its own padding in the toolbar. Design edge-to-edge.
- **Square** — all icons must be exactly square.

### 10.3 Optional Assets

| Purpose | File | Notes |
|---------|------|-------|
| Windows HiDPI | `assets/icon32.png` (32×32) | Not required but improves clarity on Windows |
| Promotional | `assets/promo-440x280.png` | Chrome Web Store promotional tile |
| Screenshots | `assets/screenshot-*.png` | CWS listing. 1280×800 or 640×400 |

### 10.4 Design System Integration

If using a design system (e.g., OIA Design System), the icon should:

- Use the brand's primary color palette for recognition.
- Maintain legibility at 16×16 (avoid fine detail at this size).
- Match the extension's personality — warm/friendly for consumer apps, clean/professional for tools.

### 10.5 Placeholder Strategy for CLI Scaffolding

When a CLI agent scaffolds the project before icons exist, create placeholder files to prevent load errors:

```bash
# Generate minimal valid PNGs as placeholders (1×1 transparent)
# Developer MUST replace these before publishing
for size in 16 48 128; do
  convert -size ${size}x${size} xc:transparent assets/icon${size}.png 2>/dev/null || \
  python3 -c "
import struct, zlib
def png(w,h):
    raw=b''.join(b'\x00'+b'\x00\x00\x00\x00'*w for _ in range(h))
    return b'\x89PNG\r\n\x1a\n'+b''.join([
        struct.pack('>I',13)+b'IHDR'+struct.pack('>IIBBBBB',w,h,8,6,0,0,0)+struct.pack('>I',zlib.crc32(b'IHDR'+struct.pack('>IIBBBBB',w,h,8,6,0,0,0))&0xffffffff),
        struct.pack('>I',len(zlib.compress(raw)))+b'IDAT'+zlib.compress(raw)+struct.pack('>I',zlib.crc32(b'IDAT'+zlib.compress(raw))&0xffffffff),
        struct.pack('>I',0)+b'IEND'+struct.pack('>I',zlib.crc32(b'IEND')&0xffffffff)])
open('assets/icon${size}.png','wb').write(png(${size},${size}))
"
done
echo "⚠️  Placeholder icons created. Replace before publishing."
```

---

## 11. Quick Reference Card

### Template Decision

| If the extension needs... | Use |
|---------------------------|-----|
| Persistent sidebar that survives tab navigation | **Panel** (Template A) |
| Quick popup that closes on blur | **Popup** (Template B) |
| Both a sidebar and a popup | Start with **Panel**, add popup via secondary action or context menu |

### Manifest Checklist (Panel)

```
✅ "manifest_version": 3
✅ "permissions": ["sidePanel", "storage"]
✅ "background.service_worker" → single JS file
✅ "background.type": "module" (if using ES imports)
✅ "side_panel.default_path" → panel HTML file
✅ "action.default_title" → label (NO default_popup)
✅ "options_ui.page" → options HTML file
✅ "icons" → all three sizes (16, 48, 128)
✅ service-worker.js calls setPanelBehavior({ openPanelOnActionClick: true })
```

### Manifest Checklist (Popup)

```
✅ "manifest_version": 3
✅ "permissions": ["storage"]
✅ "background.service_worker" → single JS file
✅ "background.type": "module" (if using ES imports)
✅ "action.default_popup" → popup HTML file
✅ "action.default_title" → label
✅ "options_ui.page" → options HTML file
✅ "icons" → all three sizes (16, 48, 128)
```

### File Responsibilities

| File | Owns | Never Does |
|------|------|------------|
| `service-worker.js` | Lifecycle events, message relay, API calls, alarm handlers | DOM access, UI rendering, holding UI state |
| `main.js` / `popup.js` | UI rendering, user interaction, storage listeners | Direct DOM manipulation on host pages, API key storage |
| `content.js` | Host page DOM reading/modification, user gesture capture | UI rendering, direct storage writes (relay through service worker or write to storage) |
| `store.js` | Storage read/write helpers, key namespacing | Business logic, API calls |
| `api-client.js` | External API communication, request formatting | Storage, DOM, UI |

### Common Pitfalls

| Mistake | Fix |
|---------|-----|
| Panel doesn't open on icon click | Add `setPanelBehavior({ openPanelOnActionClick: true })` in service worker — this is API-only, not a manifest setting |
| Extension fails to load | Check that all icon files in `"icons"` actually exist at the specified paths |
| Listeners don't fire after idle | Move all `addListener` calls to the top level of the service worker — never inside async or callbacks |
| State lost between sessions | Use `chrome.storage.local`, not global variables |
| `sendResponse` never arrives | `return true` from the `onMessage` listener when responding asynchronously |
| Content script can't call Chrome APIs | Most `chrome.*` APIs aren't available in content scripts — relay through the service worker via `sendMessage` |
| `options_page` vs `options_ui` | Use `"options_ui"` with `"open_in_tab": true` — it's the modern pattern |

---

*This standard is maintained by 864zeros LLC for use in OIA product development and open CLI-agent scaffolding workflows.*
