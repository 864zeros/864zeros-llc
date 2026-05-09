# Time2Focus

**Set a time. Name your focus. When the timer ends, you remember what matters.**

A Chrome side-panel extension. Always-visible focus timer with a persistent "you are focused on:" anchor. Built for ADHD adults who lose track of time *and* what they were doing.

OIA (Organize your Internal Architecture) | Series: oia.focus | *a 864zeros LLC product*
Manifest V3 | v1.0

---

## The Hook (Marketing)

### The Friction
Pomodoro extensions are a popup that closes when you click anywhere else. ADHD users open them, set 25 minutes, get distracted, lose track of the timer because the popup vanished, and forget what they were trying to focus on in the first place.

Physical ADHD cube timers solve this with sheer presence — flip the cube, the time face is up, you can't unsee it. Time2Focus puts that simplicity in the side panel.

- **Side panel, never a popup** — stays open across tab switches. The countdown is always in your peripheral vision.
- **"You are focused on:" anchor** — the most important field is the topic, not the timer. When you get distracted (you will), glance right: 14:22 — finish the proposal. Refocus.
- **Four presets, large buttons** — 5 / 10 / 25 / 50 minutes. Tap one. Done. No reading "minutes" or other clutter.
- **Gentle alert when time's up** — soft chime + slow color pulse + optional OS notification. Not a strobe. Not a klaxon. ADHD users often have sensory sensitivity.
- **Survives the service worker dying** — `chrome.alarms` API + `endTime` stored, so the timer keeps working even if the panel is closed or Chrome quietly suspends the extension.

### Who This Is For
- ADHD adults who Pomodoro but lose the popup
- Knowledge workers who wander between contexts and forget what they were working on
- Anyone who has bought a physical ADHD timer cube and wants the same simplicity in their browser

### Brand
OIA series. Tagline: *"Built for people with ADHD by someone with ADHD."*
Inspiration: physical flip-to-start ADHD cube timers, brought into the side panel.

---

## The Commercial Gate (Sales)

### GTM Status
**Engineering:** Build spec finalized in `CLAUDE.md`. Vanilla JS, fully client-side.

**Outstanding before Chrome Web Store launch:**
- 4 alert sounds (royalty-free / CC0): chime, singing bowl, raindrop, soft bell
- Icon set (16/48/128)
- Marketing site emphasizing the side-panel-vs-popup distinction
- A/B compare visuals: Time2Focus vs Forest vs Marinara Timer (popup-based) — show the persistence advantage

### T-Shirt Size
**S** — small surface area. Side panel + service worker + offscreen audio document. ~2.5k LOC.

### Tier Structure
**Free Edition** for v1.0.

| Tier | Price | What It Unlocks |
|---|---|---|
| **Free** | $0 forever | All 4 timers, focus topic, 4 sounds, 5 colors, OS notifications |

Future Premium considerations (NOT in v1):
- Custom timer durations (Pro)
- Session history / Pomodoro cycle automation (Pro)
- Cross-extension context with Signal2Noise / TuneOut2FocusIn (Pro bundle)
- Badge countdown on extension icon (free or Pro — TBD)

### Revenue Model
- **v1**: Free. Audience-build via the OIA series.
- **v2 (if validated)**: Cross-extension oia.focus bundle pricing
- **B2B hedge**: Source code Gumroad listing ($200-500)

---

## Technical Blueprint (Tech)

### Brick Registry

| Brick ID | Category | Input → Process → Output | Complexity | Source |
|---|---|---|---|---|
| `agent-timer-engine` | Infra | `{minutes}` → `chrome.alarms.create('focusTimer', {when: endTime})` → fires alert at endTime | S | `background.js` |
| `agent-countdown-display` | Capture | `endTime - Date.now()` per second → `MM:SS` formatted string | XS | `sidepanel.js` |
| `agent-focus-anchor` | Infra | Persistent text input → chrome.storage.local key `focusTopic` | XS | sidepanel UI |
| `agent-alert-sequence` | Export | Timer fired → soft sound (offscreen audio) + slow color pulse (CSS @keyframes) + OS notification (if enabled) | S | `background.js` + `offscreen.js` + sidepanel CSS |
| `agent-state-machine` | Infra | `idle` ↔ `running` ↔ `done` → persisted via `timerState` storage key | XS | shared between background + sidepanel |
| `agent-offscreen-audio` | Infra | MV3 service workers can't play audio → use chrome.offscreen document for `<audio>` playback | S | `offscreen.html` + `offscreen.js` |

### Architecture

```
┌─────────────────────────────────────────────┐
│  sidepanel.html                             │
│  "You are focused on: [_______________]"    │  ← persistent anchor
│           14:22                             │  ← countdown (large)
│   ┌──┐  ┌──┐                                │
│   │ 5│  │10│                                │  ← 2×2 preset grid
│   └──┘  └──┘                                │
│   ┌──┐  ┌──┐                                │
│   │25│  │50│                                │
│   └──┘  └──┘                                │
│           cancel                            │
│                                             │
│                              ⚙              │  ← settings (collapsed)
└─────────────────────────────────────────────┘
            │
            ▼
   chrome.storage.local
     ├── selectedMinutes
     ├── focusTopic
     ├── timerState: idle | running | done
     ├── endTime: Date.now() + duration
     ├── alertSound: chime | bowl | raindrop | soft_bell
     ├── flashColor: #717D71 | …
     └── notificationsEnabled
            │
            ▼
   background.js (service worker)
     ├── chrome.alarms.create('focusTimer', {when: endTime})
     ├── chrome.alarms.onAlarm → trigger alert sequence
     └── chrome.offscreen.createDocument() for audio
```

### Installation (development)

```bash
cd C:\dev\864zeros-llc\LLC-DIV-3-FACTORY\extensions\Time2Focus
# Vanilla JS, no dependencies

# Load in Chrome:
# chrome://extensions → Developer mode → Load unpacked → select this directory
```

### AI Configuration
**Time2Focus does not call any AI.** Pure client-side. Zero API cost.

### Permissions Used

| Permission | Why |
|---|---|
| `sidePanel` | Always-visible panel |
| `storage` | Persistent timer state across panel/browser restarts |
| `alarms` | Reliable timer (survives service worker suspension) |
| `notifications` | OS-level alert when timer completes |
| `offscreen` | Audio playback (MV3 SW can't play audio directly) |

### Why side panel (not popup)
This is the entire product. A popup closes when you click anything else. The countdown disappears. The focus topic disappears. The whole point — *peripheral persistence* — is lost.

The side panel stays open across tab switches. The countdown is always visible. The "you are focused on:" anchor is always glanceable. When the ADHD user wanders, the panel pulls them back.

### Build Status
Stage 1 "Shovel" in the Reverse-Build Assembly Line.

---

*OIA — Organize Your Internal Architecture. A 864zeros LLC product.*
*Time2Focus: set a time. Name your focus. Refocus when you wander.*
