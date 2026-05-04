# 864zeros Build System — Chrome Extension Instructions (Gemini)

> Chrome extension projects only. Load alongside `GEMINI-base.md`.

## References

Read before coding:
- `references/core/oia-design-system.css` — Link in every HTML file
- `references/core/oia-design-system-full.md` — Tokens, components, UX rules
- `references/core/lib-core.md` — Shared modules (api-client, redactor, tiers, constants)
- `references/extension/chrome-extension-standard-2026.md` — MV3 scaffold. Follow exactly.
- `references/extension/lib-extension.md` — Extension modules (IndexedDB, chrome.storage, backup)

## Architecture

- Manifest V3. `"type": "module"` on service worker. `"options_ui"` not `"options_page"`.
- Panel extensions: `"side_panel"` + `"sidePanel"` permission. No `"default_popup"`.
- Service worker: all listeners top level. No DOM. No global state. `return true` for async responses.
- Panel must call: `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`
- State: `chrome.storage.local` is source of truth. UI listens via `onChanged`.
- Messages: `{ type: 'ACTION_NAME', payload: { } }` envelope.
- Content scripts: relay through service worker, never write to storage directly.

## Code Standards

- ES modules, vanilla JS (no frameworks v1), kebab-case files.
- Link Nunito font + `oia-design-system.css` in every HTML.
- OIA component classes for all UI. Dark mode automatic.
- Panel: single HTML, views toggled by JS. No iframes.

## Build Phases

`phases/extension/` — follow in order:
1. Scaffold → loads in Chrome
2. UI Shell → renders with OIA styling
3. Features → one at a time, verify each
4. Polish → animations, errors, tiers, accessibility
5. Proof → all tests pass, manual checklist complete, session recap saved

One file at a time. Checkpoint after each phase. Never skip.
