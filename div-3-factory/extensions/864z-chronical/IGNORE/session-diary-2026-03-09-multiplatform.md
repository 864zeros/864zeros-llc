# Chronicle Extension - Session Diary
**Date:** 2026-03-09
**Session Duration:** Extended multi-part session
**Last Updated:** 2026-03-09 (current session end)

---

## Executive Summary

Completed KISS rewrite of Chronicle extension and added multi-platform LLM support. Extension now records conversations from Gemini, Claude, ChatGPT, and Copilot using vanilla JS with no build step.

---

## Session Timeline

### Part 1: KISS Rewrite (Earlier)
- **Problem:** Original extension was built with Vite + CRXJS + TypeScript - overly complex
- **Decision:** Full KISS rewrite with vanilla JS, no build step required
- **Completed:**
  - Removed all TypeScript/Vite build system
  - Created simple manifest.json, service-worker.js, content-script.js
  - Created lib/db.js for IndexedDB wrapper
  - Created sidepanel/panel.html, panel.css, panel.js

### Part 2: Gemini Selectors Fix (Earlier)
- **Problem:** Content script wasn't finding messages - wrong DOM selectors
- **Root Cause:** Original selectors (`[data-message-id]`) were invalid for Gemini
- **Solution:** Researched open source extensions, found correct selectors:
  - User messages: `user-query`, `USER-QUERY`
  - Assistant messages: `model-response`, `MODEL-RESPONSE`
- **Result:** Gemini recording working successfully

### Part 3: OIA Design System Alignment (This Session)
- **Task:** Align with 864zeros OIA design system
- **Completed:**
  - Copied `oia-design-system.css` to `lib/`
  - Updated `panel.html` with OIA classes (`.oia-h1`, `.oia-btn`, `.oia-badge`, etc.)
  - Rewrote `panel.css` to use OIA tokens (`--oia-space-*`, `--oia-bg-*`, etc.)
  - Reduced CSS from 310 lines to ~212 lines

### Part 4: Settings Page (This Session)
- **Task:** Add settings page with cog icon
- **Completed:**
  - Added SVG cog icon button in header top-right
  - Created settings view with:
    - Recording toggles per provider
    - Export All Data button (downloads JSON)
    - Clear All Data button (with confirmation)
    - About section with version
  - Settings persist via `chrome.storage.local`
  - Added `clearAll()` function to db.js

### Part 5: Multi-Platform Support (This Session)
- **Task:** Add Claude, ChatGPT, and Copilot support
- **Research Sources:**
  - Claude: [agarwalvishal/claude-chat-exporter](https://github.com/agarwalvishal/claude-chat-exporter)
  - ChatGPT: [pionxzh/chatgpt-exporter](https://github.com/pionxzh/chatgpt-exporter), [LukasMFR's Gist](https://gist.github.com/LukasMFR/6865ef67aee37a8c677928234072bfbf)
  - Copilot: [RobAMills/copilot-chat-saver](https://github.com/RobAMills/copilot-chat-saver)

- **Completed:**
  - Updated manifest.json with new host permissions
  - Rewrote content-script.js with modular `PLATFORMS` config
  - Added filter tabs for all 4 providers
  - Added settings toggles for each provider
  - Added scribe badge colors per provider
  - Updated AEC document with all platform selectors

---

## Current Project Status

### Working (Verified)
- [x] Gemini conversation recording
- [x] Side panel UI with OIA design system
- [x] Settings page with export/clear functions
- [x] Filter by provider
- [x] Star/unstar entries
- [x] Delete entries
- [x] Search entries

### Implemented But Untested
- [ ] Claude.ai conversation recording
- [ ] ChatGPT conversation recording
- [ ] Copilot conversation recording
- [ ] Per-provider enable/disable settings

### Not Yet Implemented
- [ ] Settings actually controlling content script behavior (settings are saved but content script doesn't check them yet)

---

## Key Files & Their Purpose

```
864z-chronical/
├── manifest.json           # Extension manifest, defines permissions & content scripts
├── service-worker.js       # Background script, handles messages & DB operations
├── content-script.js       # Injected into LLM pages, extracts conversations
├── lib/
│   ├── db.js               # IndexedDB wrapper (openDB, saveEntry, getEntries, etc.)
│   └── oia-design-system.css  # 864zeros design system
├── sidepanel/
│   ├── panel.html          # Side panel UI structure
│   ├── panel.css           # Chronicle-specific styles (OIA overrides)
│   └── panel.js            # Side panel logic (render, settings, export)
├── docs/
│   └── AEC-gemini-selectors.md  # DOM selector documentation for all platforms
└── IGNORE/
    └── [this file]
```

---

## DOM Selectors Summary

| Platform | User Selector | Assistant Selector |
|----------|--------------|-------------------|
| Gemini | `user-query` | `model-response` |
| Claude | Action groups WITHOUT feedback button | Action groups WITH feedback button |
| ChatGPT | `[data-message-author-role="user"]` | `[data-message-author-role="assistant"]` |
| Copilot | Fallback chain (varies by tenant) | Fallback chain (varies by tenant) |

See `docs/AEC-gemini-selectors.md` for full details and validation procedures.

---

## Decisions Made

1. **No build step** - Vanilla JS only, no TypeScript/Vite/bundlers
2. **sendMessage only** - No chrome.runtime.connect() ports (simpler, fewer errors)
3. **Platform detection by hostname** - Single content script handles all platforms
4. **Fallback selectors for Copilot** - DOM varies by tenant, try multiple selectors
5. **OIA design system** - Use 864zeros standard tokens and components
6. **Settings stored in chrome.storage.local** - Not synced across devices

---

## Next Steps (Priority Order)

### Immediate (Next Session)
1. **Test Claude, ChatGPT, Copilot** - Verify selectors work, adjust if needed
2. **Wire up settings to content script** - Content script should check if provider is enabled before recording
3. **Update AEC document status** - Mark platforms as verified once tested

### Future Enhancements
- Export to Markdown format option
- Tag system for organizing entries
- Keyboard shortcuts
- Copy conversation to clipboard
- AI Studio support verification

---

## How to Test

1. Go to `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked" → select `864z-chronical` folder
4. Visit each platform and start a conversation:
   - https://gemini.google.com
   - https://claude.ai
   - https://chatgpt.com
   - https://copilot.microsoft.com
5. Open DevTools (F12) on each page
6. Look for `[Chronicle CS]` logs showing message detection
7. Open side panel (click extension icon)
8. Verify entries appear with correct provider badge

---

## Troubleshooting

### No messages detected
- Check DevTools console for `[Chronicle CS]` logs
- Run validation commands from AEC document
- If selectors return 0, DOM has changed - check reference repos for updates

### Content script not loading
- Verify manifest.json has correct `matches` patterns
- Check `chrome://extensions` for errors
- Try removing and re-adding the extension

### Side panel empty
- Check service worker console (`chrome://extensions` → Inspect views: service worker)
- Look for IndexedDB errors
- Try clearing data and re-recording

---

## Files Modified This Session

1. `sidepanel/panel.html` - OIA classes, settings view, filter tabs
2. `sidepanel/panel.css` - OIA tokens, settings styles, provider colors
3. `sidepanel/panel.js` - Settings functions, provider toggles
4. `service-worker.js` - Added CLEAR_ALL handler
5. `lib/db.js` - Added clearAll() function
6. `manifest.json` - Added Claude, ChatGPT, Copilot hosts
7. `content-script.js` - Complete rewrite for multi-platform
8. `docs/AEC-gemini-selectors.md` - Expanded for all platforms

---

## Context for Future Sessions

- This extension is part of the **864zeros** ecosystem
- Must follow **864z-build-kit** standards (see `CLAUDE-base.md`, `CLAUDE-extension.md`)
- Uses **OIA design system** for consistent styling
- **KISS principle** is paramount - no unnecessary complexity
- DOM selectors are **fragile** - platforms update without notice
- Reference the **AEC document** when selectors break

---

*Delete this file when project is stable and documented elsewhere.*
