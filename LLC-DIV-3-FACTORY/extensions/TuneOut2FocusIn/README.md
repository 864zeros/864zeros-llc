# TuneOut2FocusIn

**One click. Predictable sound. Distractions masked. Focus restored.**

A Chrome extension that plays loopable background noise (white / pink / brown / gentle rain) to mask environmental distractions. Built for ADHD adults who lose focus to unpredictable noise.

OIA (Organize your Internal Architecture) | Series: oia.focus | *a 864zeros LLC product*
Manifest V3 | v1.0

---

## The Hook (Marketing)

### The Friction
ADHD focus is fragile. A door slamming, a coworker laughing, a delivery truck — any unexpected sound hijacks attention. Predictable, consistent background noise masks unpredictable interruptions.

Coffee shops work for many ADHDers because of this exact mechanism. Noise apps exist (Noisli, A Soft Murmur, myNoise) but they're either:
- Tabs that close when you accidentally hit Cmd+W
- Apps you forget to launch
- Web players that throttle in background tabs
- Bundled with features you don't want (timers, mixers, sleep trackers)

TuneOut2FocusIn is the rescue product:

- **One-click toggle.** Start. Stop. That's the entire UI.
- **Four sounds.** White, pink, brown, gentle rain. No mixer, no layering.
- **Plays in the background.** Even when the popup is closed, even when you switch tabs. Audio runs in a chrome.offscreen document, the only reliable way in MV3.
- **No volume slider.** Use system volume. ADHD users don't need another knob to adjust five times an hour.
- **Zero-cost.** Self-contained MP3s, no streaming, no subscription, no account.

### Who This Is For
- ADHD adults who need consistent background noise to focus
- Knowledge workers in noisy open offices or shared apartments
- Anyone who has tabs of YouTube rain videos perpetually open

### Brand
OIA series. Tagline: *"Built for people with ADHD by someone with ADHD."*

---

## The Commercial Gate (Sales)

### GTM Status
**Engineering:** Build spec finalized in `CLAUDE.md`. Architecture uses chrome.offscreen document for audio (MV3-correct).

**Outstanding before Chrome Web Store launch:**
- 4 high-quality, seamless-loop MP3s (~2-5 second loops; royalty-free / CC0)
- Icon set
- Marketing copy emphasizing background-persistence (vs YouTube tab tricks)
- Comparison page: TuneOut2FocusIn vs Noisli vs myNoise

### T-Shirt Size
**XS-S** — minimal codebase. Service worker (message router) + offscreen audio document + popup UI. ~2.6k LOC including audio assets.

### Tier Structure
**Free Edition** for v1.0.

| Tier | Price | What It Unlocks |
|---|---|---|
| **Free** | $0 forever | All 4 sounds, persistent playback, state persistence |

Future Premium considerations (NOT in v1):
- 8D audio processing (Pro)
- Custom sound uploads (Pro)
- Sound mixing / layering (Pro)
- Binaural beats (Pro)
- Cross-extension integration with Time2Focus (Pro bundle)

### Revenue Model
- **v1**: Free. Audience-build.
- **v2 (if validated)**: Pro tier with 8D audio, custom uploads, mixing.
- **B2B hedge**: Source code Gumroad listing ($200-500). The "play looped audio reliably in MV3" infrastructure is itself worth $$ to other extension builders.

---

## Technical Blueprint (Tech)

### Brick Registry

| Brick ID | Category | Input → Process → Output | Complexity | Source |
|---|---|---|---|---|
| `agent-noise-toggle` | Capture | Click event → `chrome.runtime.sendMessage({action: 'toggle_playback'})` | XS | `popup.js` |
| `agent-sound-selector` | Capture | Click on sound button → `chrome.runtime.sendMessage({action: 'change_sound', soundKey})` | XS | `popup.js` |
| `agent-audio-engine` | Infra | Receive message → call offscreen document play/stop/change → update state | S | `background.js` + `offscreen.js` |
| `agent-offscreen-audio` | Infra | `<audio>` element with `loop=true` in offscreen HTML; receives commands via `chrome.runtime.onMessage` | S | `offscreen.html` + `offscreen.js` |
| `agent-state-persist` | Infra | Persist `currentSoundType` + `isPlaying` to chrome.storage.local; restore on extension startup | XS | `background.js` |
| `agent-status-display` | Capture | Read state → render label ("Playing: White Noise" / "Sound Off") | XS | `popup.js` |

### Architecture

```
┌─────────────────────────────────────┐
│  popup.html                         │
│  ┌─────────────────────────────┐    │
│  │   [Start Sound] / [Stop]    │    │  ← single toggle
│  └─────────────────────────────┘    │
│  [White] [Pink] [Brown] [Rain]      │  ← 4 sound options
│  Status: Playing: White Noise        │
└─────────────────────────────────────┘
            │ chrome.runtime.sendMessage
            ▼
┌─────────────────────────────────────┐
│  background.js (service worker)     │
│  - Receives toggle / change_sound   │
│  - Manages state in chrome.storage  │
│  - Sends play/stop to offscreen doc │
└─────────────────────────────────────┘
            │ chrome.runtime.sendMessage
            ▼
┌─────────────────────────────────────┐
│  offscreen.html / offscreen.js      │
│  <audio src="audio/white_noise.mp3" │
│         loop=true>                  │
│  Receives play/stop/change-source   │
│  commands. Holds the actual audio   │
│  element. Survives service worker   │
│  suspension because offscreen docs  │
│  have their own lifetime.           │
└─────────────────────────────────────┘
```

### Installation (development)

```bash
cd C:\dev\864zeros-llc\LLC-DIV-3-FACTORY\extensions\TuneOut2FocusIn
# Vanilla JS, no dependencies

# Load in Chrome:
# chrome://extensions → Developer mode → Load unpacked → select this directory
```

### AI Configuration
**TuneOut2FocusIn does not call any AI.** Pure client-side audio playback. Zero API cost.

### Permissions Used

| Permission | Why |
|---|---|
| `storage` | Remember last sound + playing state |
| `sidePanel` | Panel UI (note: build spec uses popup; manifest may use side_panel for newer revisions) |
| `offscreen` | The only reliable way to play audio in MV3 service worker context |

### MV3 Audio Playback Note
Manifest V3 service workers cannot directly play audio via `new Audio()`. The audio element must live in a context with a DOM. Options:
- **Offscreen Document (used here)** — `chrome.offscreen.createDocument()` creates a hidden DOM context. The offscreen document holds the `<audio>` element. The service worker sends play/stop/change messages.
- **Popup-initiated** — works but audio dies when popup closes. Not viable for "persistent background noise" thesis.

TuneOut2FocusIn uses Offscreen. This is also why the extension's source code has B2B value — many extension builders need this pattern and don't know about it.

### Audio Assets
4 short, seamless loops. Each 2-5 seconds. Each <1MB. CC0 / royalty-free sourcing required (Freesound.org good source). Files:
- `audio/white_noise.mp3`
- `audio/pink_noise.mp3`
- `audio/brown_noise.mp3`
- `audio/gentle_rain.mp3`

### Build Status
Stage 1 "Shovel" in the Reverse-Build Assembly Line.

---

*OIA — Organize Your Internal Architecture. A 864zeros LLC product.*
*TuneOut2FocusIn: predictable sound, predictable focus.*
