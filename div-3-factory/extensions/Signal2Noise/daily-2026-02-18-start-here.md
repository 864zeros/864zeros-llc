# Signal2Noise — Daily Start Here
**Date:** 2026-02-18
**Status:** Phase 5 — Ready for Testing

---

## What Was Built

Complete Signal2Noise Chrome extension with all 9 features implemented:

| Feature | Description | Status |
|---------|-------------|--------|
| FEAT-01 | Signal Pill Display (2-4 marked signals at top) | ✅ Done |
| FEAT-02 | Ratio Selector (80/70/60 radio buttons) | ✅ Done |
| FEAT-03 | Daily Signal Input (textarea) | ✅ Done |
| FEAT-04 | Save Signal (max 10 enforced) | ✅ Done |
| FEAT-05 | Accordion Signal List (collapsible cards) | ✅ Done |
| FEAT-06 | Delete Signal (X button) | ✅ Done |
| FEAT-07 | Mark as Signal (priority toggle) | ✅ Done |
| FEAT-08 | Copy All Signals (clipboard) | ✅ Done |
| FEAT-09 | Download Signals (.txt file) | ✅ Done |

---

## File Structure

```
Signal2Noise/
├── manifest.json              # MV3 manifest with sidePanel
├── _locales/en/messages.json  # i18n strings
├── assets/
│   ├── icon16.png             # Sage-colored placeholder icons
│   ├── icon48.png
│   └── icon128.png
├── background/
│   └── service-worker.js      # Panel behavior + state init
├── sidepanel/
│   ├── index.html             # Full UI structure
│   ├── main.js                # All feature logic
│   └── styles.css             # OIA Design System styling
├── lib/
│   ├── oia-design-system.css  # Full design system
│   ├── constants.js           # Storage keys, limits
│   └── store.js               # Reactive storage wrapper
└── options/
    ├── options.html           # About/settings page
    └── options.js
```

---

## Next Steps

### 1. Load and Test Extension
```
1. Open chrome://extensions
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select: C:\Users\I820965\dev\864zeros\extensions\Signal2Noise
5. Click toolbar icon → panel opens
```

### 2. Test Checklist
- [ ] Extension loads without console errors
- [ ] Ratio selector persists selection
- [ ] Save signal works (test with 10+ to verify limit)
- [ ] Accordion expand/collapse works
- [ ] Delete removes signal
- [ ] Mark as Signal updates pill display
- [ ] Pill shows when 2-4 signals marked, hides otherwise
- [ ] Copy All copies to clipboard
- [ ] Download creates .txt file
- [ ] Settings cog opens options page
- [ ] Dark mode auto-applies based on system preference

### 3. After Testing
- Replace placeholder icons with real branded icons
- Consider adding Ctrl+Enter hint in UI
- Review toast messages for ADHD-friendly copy

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `sidepanel/main.js` | All feature logic — start here for bugs |
| `lib/constants.js` | Storage keys and limits (MAX_SIGNALS=10) |
| `sidepanel/styles.css` | Panel-specific styling |
| `CLAUDE.md` | Original feature spec |

---

## Build Kit References Used

- `864z-build-kit/CLAUDE-base.md` — Core principles
- `864z-build-kit/CLAUDE-extension.md` — Extension rules
- `864z-build-kit/references/core/oia-design-system.css` — Styling
- `864z-build-kit/references/extension/chrome-extension-standard-2026.md` — Scaffold

---

*Extension is feature-complete. Ready for QA testing.*
