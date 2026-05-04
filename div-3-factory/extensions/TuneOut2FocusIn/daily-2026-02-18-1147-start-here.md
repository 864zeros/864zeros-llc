# Tune Out 2 Focus In — Daily Start Here

**Date:** 2026-02-18 11:47
**Status:** PAUSED — Waiting for commerce brick

---

## Current State

Fully functional MVP with UI polish complete. Ready for commerce integration.

### Working Features
- **4 Sound Types:** White Noise, Gray Noise, Brown Noise, Rain
- **One-Click Toggle:** Start/Stop playback
- **Volume Control:** In-panel slider (0-100%)
- **SVG Sound Icons:** Unique waveform icons per sound type
- **Playing Animation:** Pulsing status indicator
- **Settings Page:** Full options with hero, slogans, science section
- **$1.99 Unlock Card:** UI ready, button stubbed
- **Buy Coffee Button:** UI ready, button stubbed
- **Legal Pages:** Terms of Use + Privacy Policy
- **OIA Design System:** Full styling with auto dark mode
- **Accessibility:** aria-labels on interactive elements

---

## Blocked On

**Commerce Brick** — Need ExtensionPay or similar integration to wire up:
- `#unlock-btn` — One-time $1.99 purchase
- `#fuel-btn` — Buy us a coffee (tip jar)

---

## File Structure

```
TuneOut2FocusIn/
├── manifest.json
├── _locales/en/messages.json
├── assets/
│   ├── icon16.png          ← placeholder (replace before publish)
│   ├── icon48.png
│   └── icon128.png
├── audio/
│   ├── white-noise.mp3
│   ├── gray-noise.mp3
│   ├── brown-noise.mp3
│   └── rain.mp3
├── background/
│   └── service-worker.js
├── offscreen.html
├── offscreen.js
├── sidepanel/
│   ├── index.html
│   ├── main.js
│   └── styles.css
├── options/
│   ├── options.html
│   ├── options.css
│   └── options.js
├── legal/
│   ├── terms.html
│   └── privacy.html
└── lib/
    └── oia-design-system.css
```

---

## When Commerce Brick is Ready

1. Wire `#unlock-btn` to ExtensionPay one-time purchase ($1.99)
2. Wire `#fuel-btn` to ExtensionPay tip/donation
3. Add unlock status check to options.js
4. Update `#unlock-status` text based on purchase state
5. Test purchase flow end-to-end

---

## Remaining Before Publish

- [ ] Commerce integration (blocked)
- [ ] Replace placeholder icons with real OIA-branded icons
- [ ] Final QA pass
- [ ] Chrome Web Store screenshots
- [ ] Store listing copy

---

**Status: PAUSED until commerce brick ready.**
