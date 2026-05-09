# CLAUDE.MD — TuneOut2FocusIn Chrome Extension

## Project Identity

**Name:** TuneOut2FocusIn
**Type:** Chrome Extension (Manifest V3, Panel)
**Brand:** OIA (Organize your Internal Architecture)
**Series:** oia.focus
**Tagline:** "Built for people with ADHD by someone with ADHD"
**Target:** ADHD adults who lose focus to unpredictable environmental noise
**Core Message:** One click. Predictable sound. Distractions masked. Focus restored.

---

## What This File Is

Build specification for TuneOut2FocusIn — a background noise generator Chrome Extension. OIA Design System and 864zeros Build Kit are already established. This document covers **what to build**. No ambiguity.

---

## Architecture

```
tuneout2focusin/
├── manifest.json       # MV3, action.default_popup = popup.html
├── background.js       # Service worker — owns all audio playback
├── popup.html          # Panel UI
├── popup.js            # UI logic, messaging to/from background.js
├── popup.css           # OIA Design System tokens
└── audio/              # Loopable audio files (or placeholder URLs)
    ├── white_noise.mp3
    ├── pink_noise.mp3
    ├── brown_noise.mp3
    └── gentle_rain.mp3
```

**Storage:** `chrome.storage.local`
**Stored Keys:**

| Key | Type | Purpose |
|---|---|---|
| `currentSoundType` | string | Last selected sound (e.g., `"white_noise"`) |
| `isPlaying` | boolean | Whether sound was active when popup last closed |

**Communication:** `chrome.runtime.sendMessage` / `chrome.runtime.onMessage` between popup.js ↔ background.js.

---

## Features to Build

### FEAT-01: One-Click Toggle

**Location:** Prominent button in popup panel.

- Single button toggles sound on/off.
- Label switches: `"Start Sound"` ↔ `"Stop Sound"` based on current state.
- On click: sends `toggle_playback` message to background.js.
- On popup open: reads current state from storage and reflects it immediately.

---

### FEAT-02: Sound Type Selection

**Location:** Below toggle button in popup panel.

Four sound options, each a button:

| Sound | Key | Description |
|---|---|---|
| White Noise | `white_noise` | All frequencies, consistent static |
| Pink Noise | `pink_noise` | Softer, low-frequency emphasis |
| Brown Noise | `brown_noise` | Deep rumble, heavy low-frequency |
| Gentle Rain | `gentle_rain` | Natural ambient, predictable pattern |

**Behavior:**
- Click any sound button → sends `change_sound` message to background.js with the sound key.
- Background.js stops current sound, switches source, starts playback immediately.
- Selected sound visually indicated (active state on button).
- Selection persisted to `chrome.storage.local` as `currentSoundType`.

---

### FEAT-03: Status Display

**Location:** Below sound selection buttons.

- Small text element showing current state.
- When playing: `"Playing: White Noise"` (or whichever is active).
- When stopped: `"Sound Off"`.
- Updated via messages from background.js whenever state changes.

---

### FEAT-04: Background Audio Playback (background.js)

This is the engine. All audio lives in the service worker, NOT the popup.

**Audio source map:**
```
{
  "white_noise": "audio/white_noise.mp3",
  "pink_noise": "audio/pink_noise.mp3",
  "brown_noise": "audio/brown_noise.mp3",
  "gentle_rain": "audio/gentle_rain.mp3"
}
```

**Play function:**
1. Set `Audio.src` to the mapped URL.
2. Set `Audio.loop = true`.
3. Call `Audio.play()`.
4. Update `isPlaying = true` and `currentSoundType` in storage.
5. Send state update message to popup.js.

**Stop function:**
1. Call `Audio.pause()`.
2. Reset `Audio.src`.
3. Update `isPlaying = false` in storage.
4. Send state update message to popup.js.

**Message handling:**

| Message | Action |
|---|---|
| `toggle_playback` | If playing → stop. If stopped → play last selected sound. |
| `change_sound` | Stop current → update `currentSoundType` → play new sound. |

**Persistence:** Sound continues playing across tab navigation and popup close. Only stops on explicit user action, browser close, or system sleep.

---

### FEAT-05: State Persistence

- On popup open: read `currentSoundType` and `isPlaying` from storage.
- Restore UI to match — correct sound button highlighted, toggle label correct, status text accurate.
- On sound selection or toggle: write state to storage immediately.
- Default on first install: `currentSoundType = "white_noise"`, `isPlaying = false`.

---

## Initialization Flow

**popup.js on load:**
```
1. Read currentSoundType and isPlaying from chrome.storage.local
2. Set toggle button label ("Start Sound" or "Stop Sound")
3. Highlight the active sound type button
4. Update status display text
5. Attach click listeners: toggle button, all 4 sound buttons
```

**background.js on install/startup:**
```
1. Read currentSoundType and isPlaying from chrome.storage.local
2. If isPlaying was true, resume playback of currentSoundType
3. Listen for messages from popup.js
```

---

## Constraints

| Rule | Detail |
|---|---|
| No volume control | User adjusts via system volume. Zero UI clutter. |
| No playback controls | No pause/rewind/skip. It's on or it's off. |
| No custom uploads | v1.0 ships with 4 preset sounds only. |
| No sound mixing | One sound at a time. No layering. |
| No external APIs | Fully self-contained. No network calls. |
| Audio looping | Seamless, gapless loops. No audible seam on repeat. |
| Low resource usage | Minimal CPU/memory. Audio only, no visual animations. |
| Manifest V3 | Service worker (background.js), not persistent background page. |
| Permissions | `storage`, `offscreen` (if needed for audio in MV3 service worker) |

---

## MV3 Audio Playback Note

Manifest V3 service workers cannot directly play audio via `new Audio()`. Two approaches:

**Option A — Offscreen Document (recommended):**
- Create an offscreen document with `chrome.offscreen.createDocument()`.
- The offscreen document holds the `<audio>` element and handles playback.
- background.js sends messages to the offscreen document to play/stop/change.

**Option B — Popup-initiated with persistent tab:**
- Less reliable. Audio dies when popup closes unless offscreen is used.

**Build with Option A.** Add `offscreen` permission to manifest. Create `offscreen.html` and `offscreen.js` to own the audio element.

Updated architecture if using offscreen:
```
tuneout2focusin/
├── manifest.json
├── background.js        # Message router, state manager
├── offscreen.html       # Minimal HTML with <audio> element
├── offscreen.js         # Audio playback logic
├── popup.html           # Panel UI
├── popup.js             # UI logic
├── popup.css            # OIA Design System tokens
└── audio/
    ├── white_noise.mp3
    ├── pink_noise.mp3
    ├── brown_noise.mp3
    └── gentle_rain.mp3
```

---

## Element ID Reference

| Element | ID |
|---|---|
| Toggle button | `toggleBtn` |
| White noise button | `btnWhiteNoise` |
| Pink noise button | `btnPinkNoise` |
| Brown noise button | `btnBrownNoise` |
| Gentle rain button | `btnGentleRain` |
| Status text | `statusDisplay` |

---

## Out of Scope for v1.0

- 8D audio processing (future enhancement)
- Custom sound uploads
- Sound mixing / layering
- Volume slider
- Timer or auto-stop
- Analytics or tracking
- Cross-device sync
- Visual ambient effects

---

## Build Notes

- **Shovel** (Stage 1) in the Reverse-Build Assembly Line.
- No backend. No API calls. Pure client-side.
- Audio files must be short, high-quality, seamless loops. Source royalty-free.
- If v1.0 validates retention, evaluate adding binaural beats, focus timers, and 8D processing in v2.
- B2B hedge: extension source packagable for Gumroad sale ($200–$500).
- Manifest description: "TuneOut2FocusIn — Built for people with ADHD by someone with ADHD. One click to mask distractions and lock in focus."
