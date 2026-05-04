# Phase 1 — Scaffold

**Goal:** A loadable Chrome extension with correct directory structure, valid manifest, and working service worker. No features. No UI beyond a placeholder. Just a skeleton that Chrome accepts.

**Time estimate:** 10-15 minutes

---

## Inputs Required

Before starting this phase, confirm you have read:

- [ ] The **app brief** from `briefs/` for this specific extension
- [ ] `references/chrome-extension-standard-2026.md` for directory structure and manifest patterns
- [ ] `references/lib-spec.md` for the `/lib/` module list

---

## Steps

### 1.1 Create Directory Structure

Use the **Panel Extension** structure from the extension standard (Template A) unless the brief specifies Popup (Template B).

Replace `__APP_SLUG__` with the slug from the app brief.

```
__APP_SLUG__/
├── manifest.json
├── _locales/en/messages.json
├── assets/
│   ├── icon16.png          ← placeholder (see 1.3)
│   ├── icon48.png
│   └── icon128.png
├── background/
│   └── service-worker.js
├── sidepanel/
│   ├── index.html
│   ├── main.js
│   └── styles.css
├── scripts/
│   ├── content.js
│   └── injector.css
├── lib/
│   ├── db.js
│   ├── api-client.js
│   ├── store.js
│   ├── redactor.js
│   ├── tiers.js
│   ├── backup.js
│   └── constants.js
└── options/
    ├── options.html
    └── options.js
```

### 1.2 Create manifest.json

Pull values from the app brief:

- `name` → `"__MSG_appName__"` (uses i18n)
- `description` → `"__MSG_appDescription__"`
- `permissions` → from the brief's permissions list
- `host_permissions` → from the brief (if any)

Follow the manifest template in the extension standard exactly. Use `options_ui` (not `options_page`).

### 1.3 Create Placeholder Icons

Generate minimal valid PNGs so the extension loads. The developer replaces these later.

```bash
for size in 16 48 128; do
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
```

### 1.4 Create _locales/en/messages.json

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

Replace `__APP_NAME__` and `__APP_DESCRIPTION__` with values from the brief.

### 1.5 Create Service Worker

Use the boilerplate from the extension standard (Section 3.3 for Panel, Section 4.3 for Popup).

**For Panel extensions, this line is REQUIRED:**

```javascript
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
```

Add the `onInstalled` listener to initialize default state using constants from `/lib/constants.js`.

### 1.6 Create Panel HTML (Placeholder)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>__APP_NAME__</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../lib/oia-design-system.css">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="oia-screen">
    <h1 class="oia-h1">__APP_NAME__</h1>
    <p class="oia-body">Extension loaded successfully.</p>
  </div>
  <script type="module" src="main.js"></script>
</body>
</html>
```

### 1.7 Create Stub Files

Every file in the structure must exist, even if empty. Create minimal stubs:

- `sidepanel/main.js` → `console.log('Panel loaded.');`
- `sidepanel/styles.css` → `/* App-specific overrides */`
- `scripts/content.js` → `console.log('Content script loaded.');`
- `scripts/injector.css` → `/* Injected page styles */`
- `options/options.html` → Basic HTML skeleton with OIA CSS linked
- `options/options.js` → `console.log('Options loaded.');`
- `/lib/` modules → Export stubs matching the signatures in `lib-spec.md`

### 1.8 Copy OIA Design System CSS

Copy `references/oia-design-system.css` into the extension's `lib/` directory so it can be linked from HTML files via relative path.

---

## Checkpoint

```
CHECKPOINT: Phase 1 — Scaffold
VERIFY:
  1. Open chrome://extensions in Chrome
  2. Enable "Developer mode"
  3. Click "Load unpacked" → select the __APP_SLUG__/ directory
  4. Extension loads without errors (no red error badge)
  5. Click the extension icon → side panel opens
  6. Side panel shows "__APP_NAME__" heading and "Extension loaded successfully."
  7. Open DevTools on the panel (right-click → Inspect) → no console errors
STATUS: [ready for Phase 2 / blocked on ___]
```

**Do not proceed to Phase 2 until all 7 checks pass.**
