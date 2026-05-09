# Signal2Noise

**Built for people with ADHD by someone with ADHD.**

A Chrome side-panel extension for managing your daily signals — the 2-4 things that actually matter today — while parking the noise.

OIA (Organize your Internal Architecture) — *a 864zeros LLC product*
Manifest V3 | v1.0.0

---

## The Hook (Marketing)

### The Friction
ADHD task overwhelm has a specific shape. You write down 30 things. You re-prioritize 5 times a day. By 4pm you've forgotten what you decided was urgent at 9am. Notion is too heavy. Todoist hides priorities behind clicks. Sticky notes get lost.

Signal2Noise takes a different shape: **it caps you.**

- **Max 10 active signals** at any time. The cap forces triage.
- **Top of the panel: a Signal Pill** — 2 to 4 *marked-priority* signals, always visible, always at the top.
- **Marked > 4? It silently shows the first 4.** No clutter.
- **No projects, no tags, no nesting** — just text + mark + delete.
- **No cross-device sync, no AI, no cloud.** Just chrome.storage.local. The whole product is one panel that you can read in three seconds.

The product is the constraint. ADHD users don't need more features. They need less.

### Who This Is For
- ADHD adults who feel daily task overwhelm
- People who have tried Notion / Todoist / Things and bounced off the friction
- Anyone whose to-do app is currently a Stickies / Apple Notes / scrap paper hybrid

### Brand
OIA series. Tagline: *"What is today's signal?"* — tune out the noise, focus in on the signal.

---

## The Commercial Gate (Sales)

### GTM Status
**Engineering:** Build spec finalized in `CLAUDE.md`. v1.0 is intentionally minimal. Standalone client-side — no backend, no API.

**Outstanding before Chrome Web Store launch:**
- Production icons (currently placeholder)
- Marketing copy: lead with the cap ("max 10 active") and the pill ("see your priorities at a glance")
- Privacy policy (trivial — literally nothing leaves device)
- B2B Gumroad listing as alternative monetization path

### T-Shirt Size
**XS-S** — pure client-side. Single panel UI. Vanilla JS. ~2k LOC.

### Tier Structure
**Free Edition** for v1.0. The product's value comes from its constraint, not from features.

| Tier | Price | What It Unlocks |
|---|---|---|
| **Free** | $0 forever | Everything: signals, pill, ratio selector, copy, download |

Future Premium considerations (NOT in v1):
- Cloud sync (Pro tier — would compromise the "nothing leaves device" claim, so requires careful framing)
- AI signal suggestions via Claude (Power tier)
- Cross-extension integration (e.g., Time2Focus ↔ Signal2Noise unified focus context)

### Revenue Model
- **v1**: Free. Audience-building product. Validate retention (>30% daily) before any monetization.
- **v2 (if validated)**: Stage 2 "Sidekick" with optional cloud sync + AI suggestions.
- **B2B hedge**: Source code packaged as Gumroad listing ($200-500). Solo developers can re-skin it for their own ADHD-targeted niche.

---

## Technical Blueprint (Tech)

### Brick Registry

| Brick ID | Category | Input → Process → Output | Complexity | Source |
|---|---|---|---|---|
| `agent-signal-store` | Infra | `{id, text, isMarked}` → array of signal objects → chrome.storage.local key `signals` | XS | `sidepanel/index.html` + JS |
| `agent-priority-pill` | Capture | Filter `signals.where(isMarked === true)` → render top 4 → display as horizontal pill segments | XS | sidepanel JS |
| `agent-accordion-list` | Capture | Render all signals → expandable cards with mark/delete actions | S | sidepanel JS |
| `agent-cap-enforcer` | Infra | Validate `signals.length < 10` before insert; alert on violation | XS | save handler |
| `agent-ratio-selector` | Infra | Persist 80/70/60 selection (cosmetic in v1; reserved for AI integration in v2) | XS | sidepanel JS |
| `agent-clipboard-export` | Export | `signals.map(s => s.text).join('\n')` → `navigator.clipboard.writeText` | XS | "Copy All" button handler |
| `agent-text-download` | Export | `signals → Blob (text/plain) → object URL → a[download] click` | XS | "Download" button handler |

### Architecture

```
┌─────────────────────────────────────────────┐
│  sidepanel/index.html                       │
│  ┌─────────────────────────────────────┐    │
│  │  Pill: [signal A] [signal B]        │    │
│  └─────────────────────────────────────┘    │
│  ◯ 80   ◯ 70   ◯ 60                         │
│                                              │
│  "What is today's signal?"                   │
│  ┌─────────────────────────────────────┐    │
│  │  [textarea]                         │    │
│  └─────────────────────────────────────┘    │
│  [Save Signal]                               │
│                                              │
│  [Copy All Signals] [Download Signals]      │
│                                              │
│  ▼ Accordion list (max 10)                  │
│  ▼ Each: header (bold) + delete X           │
│  ▼ Expanded: full text + "Mark as Signal"   │
└─────────────────────────────────────────────┘
            │
            ▼
   chrome.storage.local
     ├── signals: [{id, text, isMarked}]
     └── selectedRatio: "80" | "70" | "60"
```

### Installation (development)

```bash
cd C:\dev\864zeros-llc\LLC-DIV-3-FACTORY\extensions\Signal2Noise
# Vanilla JS, no dependencies

# Load in Chrome:
# chrome://extensions → Developer mode → Load unpacked → select this directory
```

### AI Configuration
**Signal2Noise does not call any AI in v1.0.** Pure client-side. The `selectedRatio` (80/70/60) is stored for future AI integration where it would weight signal-vs-noise classification (e.g., "what should be in my pill given my 80% signal-to-noise ratio target?"), but that's a v2 feature.

### Permissions Used

| Permission | Why |
|---|---|
| `storage` | Local signal array + ratio preference |
| `sidePanel` | Always-visible panel UI |
| `clipboardWrite` | "Copy All" button |

### Constraints (intentional, per CLAUDE.md)

| Rule | Detail |
|---|---|
| Max signals | 10 active at any time (hard cap) |
| Max marked in pill | 4 (silently truncates to first 4) |
| Min displayed in pill | 2 (below 2, pill is empty) |
| Storage | chrome.storage.local only — nothing leaves device |
| Permissions | `storage`, `clipboardWrite` only |
| No external dependencies | Vanilla JS only. No frameworks, no CDN. |

### Build Status
Stage 1 "Shovel" in the Reverse-Build Assembly Line. Validated retention (>30% daily) gates Stage 2 expansion.

---

*OIA — Organize Your Internal Architecture. A 864zeros LLC product.*
*Signal2Noise: tune out the noise. Focus in on the signal.*
