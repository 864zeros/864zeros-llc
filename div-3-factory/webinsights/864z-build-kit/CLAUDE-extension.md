# 864zeros Build System — Chrome Extension Instructions

> **Scope:** Chrome extension projects only. Load alongside `CLAUDE-base.md`.  
> **Platform:** Manifest V3 (MV3), Panel-first (90% of builds).

---

## Reference Files

Before writing any code, read these:

**Core (in `references/core/`):**
- `oia-design-system.css` — Link in every extension HTML file
- `oia-design-system-full.md` — Token reference + ADHD UX rules
- `lib-core.md` — Shared modules: api-client, redactor, tiers, constants

**Extension-specific (in `references/extension/`):**
- `chrome-extension-standard-2026.md` — Scaffold rules, manifest patterns, service worker rules. **Follow exactly.**
- `lib-extension.md` — Extension modules: db.js (IndexedDB), store.js (chrome.storage), backup.js (Google Drive)

---

## Extension Architecture Rules

### Manifest V3

- `"manifest_version": 3` — always
- `"type": "module"` on service worker — enables ES imports
- `"options_ui"` not `"options_page"` — modern pattern
- `"side_panel"` + `"sidePanel"` permission for panel extensions
- No `"default_popup"` on panel extensions — icon triggers panel via API

### Service Worker

- All listeners at top level — never inside async, callbacks, or setTimeout
- No DOM access — use `offscreen` API if DOM is needed
- No global variable state — use `chrome.storage.local`
- `return true` from `onMessage` when responding asynchronously
- `chrome.alarms` for scheduled work — not setTimeout/setInterval
- Single entry point — one JS file, use `import` to split logic

### Panel Extensions (Required)

This line MUST be in the service worker:

```javascript
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
```

This is API-only. It cannot be set in the manifest.

### State Management

```
chrome.storage.local = single source of truth
  ↕ writes/reads
Service Worker | Panel UI | Content Script
  ↕ listens
chrome.storage.onChanged → UI re-renders
```

### Communication

| Pattern | When |
|---------|------|
| `chrome.runtime.sendMessage` | One-off content script → service worker |
| `chrome.runtime.connect` | Persistent two-way (real-time updates) |
| `chrome.storage.onChanged` | Service worker → UI broadcast |
| `sidePanel.setOptions` | Tab-specific panel content |

Standard envelope: `{ type: 'ACTION_NAME', payload: { } }`

### Content Scripts

- Run in isolated world — share DOM, not JS environment
- Cannot call most `chrome.*` APIs — relay through service worker
- Scope injected CSS carefully — prefix selectors to avoid host page conflicts
- Use narrow `matches` patterns when possible (not `<all_urls>` unless needed)

### Permissions

Principle of least privilege. Only request what the extension uses. See extension standard Section 9 for the full permission reference.

---

## Code Standards (Extension-Specific)

### JavaScript
- ES modules in service worker
- Vanilla JS only for v1 — no frameworks
- Namespace all storage keys with app slug prefix
- Kebab-case file names: `service-worker.js`, `api-client.js`

### HTML
- Link Google Fonts (Nunito) in every HTML file:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet">
  ```
- Link `oia-design-system.css` via relative path from `/lib/`
- Use OIA component classes for all UI elements
- Panel HTML is a single file with view sections toggled by JS — no iframes, no multi-page

### CSS
- App-specific overrides in `sidepanel/styles.css` (or `popup/popup.css`)
- Panel width: 300-400px typically (Chrome controls this)
- Dark mode automatic — no manual toggle needed

---

## Build Phases

Follow the phase files in `phases/extension/` sequentially:

| Phase | File | Gate |
|-------|------|------|
| 1. Scaffold | `phase-1-scaffold.md` | Extension loads in Chrome without errors |
| 2. UI Shell | `phase-2-ui-shell.md` | All views render with OIA styling, dark mode works |
| 3. Features | `phase-3-feature.md` | Each feature works end-to-end (repeated per feature) |
| 4. Polish | `phase-4-polish.md` | Animations, errors, tiers, accessibility |
| 5. QA & Test | `phase-5-qa-test.md` | All tests pass, manual QA checklist complete |

**Never skip a phase. Never skip a checkpoint.**

---

## Output Format

When building, output one file at a time:

```
FILE: path/to/file.js
```
```javascript
// file contents
```

After each phase:

```
CHECKPOINT: [phase name]
VERIFY: [what to test]
STATUS: [ready for next phase / blocked on X]
```
