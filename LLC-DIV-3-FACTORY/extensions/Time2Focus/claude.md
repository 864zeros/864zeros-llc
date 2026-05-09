# CLAUDE.MD — Time2Focus Side Panel Extension

## Project Identity

**Name:** Time2Focus
**Type:** Chrome Side Panel Extension (Manifest V3, `chrome.sidePanel` API)
**Brand:** OIA (Organize your Internal Architecture)
**Series:** oia.focus
**Tagline:** "Built for people with ADHD by someone with ADHD"
**Target:** ADHD adults who lose track of time and forget what they were working on
**Core Message:** Set a time. Name your focus. When the timer ends, you remember what matters.

**Inspiration:** Physical ADHD cube timers — flip-to-start Pomodoro cubes with preset intervals. We're putting that simplicity in the browser side panel. Always visible. Always reminding you what you're doing. Zero friction.

**Why Side Panel (not popup):** The side panel persists alongside browsing. It stays open across tab switches. An ADHD user doesn't have to remember to reopen anything — the timer and their focus topic are always right there. This is the entire point.

---

## What This File Is

Build specification for Time2Focus — an ultra-simple focus timer side panel extension. OIA Design System and 864zeros Build Kit are already established. This document covers **what to build**. No ambiguity.

---

## Architecture

```
follow build kit for PANEL extensions

```
FOLLOW oia design system 


**Manifest structure (key parts):**
```json
{
  "manifest_version": 3,
  "name": "Time2Focus",
  "description": "Built for people with ADHD by someone with ADHD. Set a time. Name your focus. Stay on track.",
  "version": "1.0",
  "permissions": ["sidePanel", "storage", "alarms", "notifications", "offscreen"],
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "action": {
    "default_title": "Open Time2Focus"
  },
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

**background.js must include on install:**
```js
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
```
Clicking the extension icon opens the side panel — not a popup.

**Storage:** `chrome.storage.local`
**Stored Keys:**

| Key | Type | Purpose |
|---|---|---|
| `selectedMinutes` | number | Last chosen timer duration |
| `focusTopic` | string | What the user is focused on |
| `alertSound` | string | Selected alert sound key (e.g., `"chime"`) |
| `flashColor` | string | Selected flash color hex (e.g., `"#717D71"`) |
| `timerState` | string | `"idle"` / `"running"` / `"done"` |
| `endTime` | number | Timestamp (ms) when timer expires — survives panel/browser restart |
| `notificationsEnabled` | boolean | Whether to fire OS notification on completion |

**Communication:** `chrome.runtime.sendMessage` / `chrome.runtime.onMessage` between sidepanel.js ↔ background.js.

---

## Features to Build

### FEAT-01: Preset Timer Buttons

**Location:** Center of side panel. The primary interaction. The whole point.

Four large, tap-friendly buttons — one tap starts the timer:

| Button | Minutes | Label |
|---|---|---|
| 1 | 5 | `5` |
| 2 | 10 | `10` |
| 3 | 25 | `25` |
| 4 | 50 | `50` |

**Behavior:**
- Tap a button → timer starts immediately for that duration.
- Active button gets a visual selected state (OIA accent color).
- Only one timer runs at a time. Tapping a different button while running resets and starts the new duration.
- Buttons are large, square, with the number as the only content. No labels like "minutes" — just the number. Zero reading required.
- Arranged in a 2×2 grid. Side panel width is ~320px default — 2×2 grid fits perfectly.

---

### FEAT-02: Focus Topic Input

**Location:** Above the timer buttons. First thing the user sees in the side panel.

- Label text: `"You are focused on:"`
- Single `<input type="text">` field. ID: `focusTopicInput`.
- Placeholder: `"what matters right now"`
- Persists across sessions via `chrome.storage.local`.
- When timer is running, this text stays visible and prominent — it is the anchor that reminds the user what they're doing. Because the side panel stays open, this is always in peripheral vision.
- User can edit the topic at any time, even while timer is running. Changes save immediately.
- No character limit, but visually truncate with ellipsis on overflow.
- **This is the ADHD feature.** The timer isn't special. Knowing what to refocus on after a distraction — that's the value. The side panel makes it persistent.

---

### FEAT-03: Countdown Display

**Location:** Between focus topic and timer buttons when running. Shows `--:--` when idle.

- Shows remaining time in `MM:SS` format.
- Large, readable font — scannable at a glance from peripheral vision.
- Updates every second while timer is running.
- When timer hits `00:00` → triggers alert sequence (FEAT-05).
- When idle: display shows `--:--`.

**Timer persistence:** Timer runs via `chrome.alarms` API in background.js — NOT `setInterval`. This survives side panel open/close, tab switches, and service worker suspension. On side panel (re)open, calculate remaining time from `endTime - Date.now()` and resume the visual countdown.

**Side panel advantage:** Unlike a popup (which closes and loses state), the side panel stays open. The countdown is always visible. The user glances right and sees "14:22 — You are focused on: finish the proposal." That's the product.

---

### FEAT-04: Cancel / Reset

**Location:** Small, subtle element below countdown. Only visible when timer is running.

- Label: `"Cancel"` or a simple ✕ icon.
- Tapping cancels the active timer.
- Resets `timerState` to `"idle"`.
- Clears the alarm via `chrome.alarms.clear()`.
- Does NOT clear the focus topic — user might want to restart on the same task.

---

### FEAT-05: Timer Complete — Alert Sequence

When countdown reaches `00:00`, three things fire:

**A) Soft Sound Alert**
- Plays the user's selected alert sound (see FEAT-06).
- Plays once, not looping. Short and gentle — no jarring alarms.
- Uses offscreen document for audio playback (MV3 service workers can't play audio directly).
- Create offscreen doc via `chrome.offscreen.createDocument()`, send play message.

**B) Side Panel Flash**
- The entire side panel background slowly pulses the user's selected color (see FEAT-07).
- Animation: gentle fade in/out. Not a strobe — a slow, breathing glow.
- CSS animation: color overlay with `opacity` oscillating between 0.1 and 0.4, ~2 second cycle.
- Flash continues until the user interacts (taps anywhere or starts a new timer).
- Because the side panel is persistent and visible, this gentle flash catches peripheral attention without being aggressive.

**C) OS Notification (if enabled)**
- Fires `chrome.notifications.create()` with:
  - Title: `"Time2Focus"`
  - Message: `"Time's up! You were focused on: {focusTopic}"`
- Only fires if `notificationsEnabled === true`.
- Notification serves as backup for when user has scrolled and side panel is out of direct view.

**State after alert:** `timerState = "done"`. Side panel shows the focus topic prominently with the flashing background. Any interaction (tap a timer button, click panel) clears the flash and returns to `"idle"`.

---

### FEAT-06: Alert Sound Selection

**Location:** Bottom of side panel, collapsible settings section. Tap ⚙️ icon to reveal.

Four soft sound options:

| Sound | Key | Description |
|---|---|---|
| Chime | `chime` | Single soft chime tone |
| Singing Bowl | `bowl` | Resonant bowl strike, fades out |
| Raindrop | `raindrop` | Single water drop plop |
| Soft Bell | `soft_bell` | Muted bell, warm tone |

**Behavior:**
- Tapping a sound option plays a short preview.
- Selection persists to `chrome.storage.local`.
- Default: `chime`.
- All sounds: 2-5 seconds, gentle, non-startling. ADHD users often have sensory sensitivity.
- Source: royalty-free / CC0. No licensing issues.

---

### FEAT-07: Flash Color Selection

**Location:** Same settings section (behind ⚙️).

Five color swatches the user taps to select:

| Color | Hex | Name |
|---|---|---|
| Sage | `#717D71` | OIA brand color (default) |
| Coral | `#E07A5F` | OIA accent |
| Sky | `#81B4D8` | Calm blue |
| Lavender | `#B8A9C9` | Soft purple |
| Warm | `#F2CC8F` | Gentle gold |

**Behavior:**
- Tap a swatch → selected state (ring/border indicator).
- Selection persists to `chrome.storage.local`.
- Default: Sage.
- Selected color drives the panel flash animation on timer completion.

---

### FEAT-08: Notification Toggle

**Location:** Same settings section (behind ⚙️).

- Simple toggle switch. Label: `"Notify me"`
- On/off for OS-level `chrome.notifications`.
- Default: `true` (on).
- Persists to storage.

---

## Side Panel Layout (Top to Bottom)

```
┌─────────────────────────────────┐
│  "You are focused on:"         │
│  [ what matters right now    ] │
│                                 │
│           24:38                │  ← countdown (large, centered)
│                                 │
│    ┌──────┐  ┌──────┐          │
│    │  5   │  │  10  │          │  ← timer buttons (2×2 grid)
│    └──────┘  └──────┘          │
│    ┌──────┐  ┌──────┐          │
│    │  25  │  │  50  │          │
│    └──────┘  └──────┘          │
│                                 │
│          cancel                │  ← only when running
│                                 │
│                                 │
│                                 │  ← remaining panel space
│                                 │     (empty, clean, no clutter)
│                                 │
│                           ⚙️   │  ← settings toggle (bottom-right)
│  ┌─ settings (collapsed) ────┐ │
│  │ Sound: ○ ● ○ ○           │ │
│  │ Color: ● ○ ○ ○ ○         │ │
│  │ Notify: [on]              │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

The side panel is vertically long and ~320px wide (Chrome-controlled). Content sits at the top. Empty space below is intentional — no clutter, no distraction. Focus topic and countdown are always visible without scrolling.

---

## Initialization Flow

**background.js on install:**
```
1. chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
2. Set default storage values if none exist
3. Register chrome.alarms.onAlarm listener for timer completion
```

**background.js alarm listener:**
```
1. chrome.alarms.onAlarm → check alarm name matches timer
2. Set timerState = "done" in storage
3. Create offscreen document → play alert sound
4. Fire OS notification (if enabled)
5. Send message to sidepanel.js to start flash animation
```

**sidepanel.js on load (every time side panel opens/reopens):**
```
1. Read all stored values from chrome.storage.local
2. Populate focusTopic input
3. Check timerState:
   - "idle": show --:-- , no flash
   - "running": calculate remaining from endTime, start countdown display
   - "done": show flash animation, show focus topic prominently
4. Highlight the active timer button (if running)
5. Load settings (sound, color, notification toggle)
6. Attach all event listeners
```

**sidepanel.js countdown loop (when running):**
```
1. setInterval every 1000ms
2. remaining = endTime - Date.now()
3. If remaining <= 0: clear interval, trigger local "done" UI
4. Else: update MM:SS display
```

Note: `setInterval` in sidepanel.js is fine for the visual countdown — the actual timer completion is handled by `chrome.alarms` in background.js which is reliable even if the side panel UI isn't active.

---

## Element ID Reference

| Element | ID |
|---|---|
| Focus topic input | `focusTopicInput` |
| Countdown display | `countdownDisplay` |
| Timer button 5 min | `btnTimer5` |
| Timer button 10 min | `btnTimer10` |
| Timer button 25 min | `btnTimer25` |
| Timer button 50 min | `btnTimer50` |
| Cancel button | `btnCancel` |
| Settings toggle | `btnSettings` |
| Settings panel | `settingsPanel` |
| Sound option: chime | `sndChime` |
| Sound option: bowl | `sndBowl` |
| Sound option: raindrop | `sndRaindrop` |
| Sound option: soft bell | `sndSoftBell` |
| Color swatch: sage | `clrSage` |
| Color swatch: coral | `clrCoral` |
| Color swatch: sky | `clrSky` |
| Color swatch: lavender | `clrLavender` |
| Color swatch: warm | `clrWarm` |
| Notification toggle | `toggleNotify` |
| Flash overlay | `flashOverlay` |

---

## Constraints

| Rule | Detail |
|---|---|
| Extension type | Side Panel (`chrome.sidePanel` API) — NOT a popup |
| Panel persistence | Stays open across tab switches — this is the core UX |
| Timer engine | `chrome.alarms` API in background.js (survives service worker suspension) |
| Audio playback | Offscreen document (MV3 service workers can't play audio) |
| Panel width | ~320px default (Chrome-controlled, not settable by extension) |
| No volume control | User adjusts via system volume |
| One timer at a time | Starting a new timer cancels any running timer |
| Manifest V3 | Service worker, sidePanel API (Chrome 114+) |
| Permissions | `sidePanel`, `storage`, `alarms`, `notifications`, `offscreen` |
| No external dependencies | Vanilla JS only. No frameworks. |
| Flash animation | CSS `@keyframes` only — no JS animation loops for the glow |

---

## Out of Scope for v1.0

- Custom timer durations (only presets: 5, 10, 25, 50)
- Multiple simultaneous timers
- Task history / session logging
- Pomodoro cycle automation (work → break → work)
- Integration with TuneOut2FocusIn or Signal2Noise
- Analytics or usage tracking
- Cross-device sync
- Badge countdown on extension icon (consider for v2)

---

## Build Notes

- **Shovel** (Stage 1) in the Reverse-Build Assembly Line.
- No backend. No API calls. Pure client-side.
- Side panel is the differentiator — most timer extensions are popups that close. This one stays.
- Alert sounds: short (2-5 sec), gentle, royalty-free (CC0 preferred).
- Flash animation: CSS `@keyframes` on an absolutely-positioned overlay div. No JS animation needed.
- `chrome.alarms` minimum granularity in MV3 is 1 minute for repeating alarms, but a single one-shot alarm can be set to a specific time via `when` parameter (ms timestamp). Use `chrome.alarms.create("focusTimer", { when: endTime })`.
- Test with side panel open AND closed — timer must complete and notify in both cases.
- If v1.0 validates retention, evaluate adding session history, Pomodoro cycles, and integration with other oia.focus extensions.
- B2B hedge: extension source packageable for Gumroad sale ($200–$500).
