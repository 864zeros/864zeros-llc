# oia.focus.wall

**Sticky note wall for ADHD minds. Drag & drop your thoughts onto a cork board.**

A Chrome side-panel extension. A spatial sticky-note cork board. Save thoughts, drag them around, see them all at once.

OIA (Organize your Internal Architecture) | Series: oia.focus | *a 864zeros LLC product*
Manifest V3 | v1.1.0

---

## The Hook (Marketing)

### The Friction
Linear lists fight ADHD spatial cognition. Many ADHD minds remember WHERE something is more reliably than WHEN they wrote it. Notion's databases, Apple Notes' chronological lists, even Trello's stiff Kanban columns — they all impose linear or grid structure.

A cork board is the opposite. You pin a thing where it makes sense to YOU. The thing about Project A goes near the thing about the side gig because they're related in *your* head, not because you tagged them. The spatial layout is the index.

oia.focus.wall is the rescue product:

- **Free-form sticky placement.** Drag a sticky anywhere on the wall. Where you put it is meaningful — to you.
- **Always-visible cork board.** Side panel, persistent. Glance and see your spatial map.
- **Local-first.** chrome.storage.local. Your spatial layout never leaves your device.
- **Simple primitives.** Save sticky → drag sticky → edit sticky → delete sticky. No "boards", no "projects", no "tags", no "members". Just stickies on a wall.

### Who This Is For
- ADHD adults whose brain-organization is spatial, not hierarchical
- Visual thinkers who use whiteboards but want a digital equivalent that doesn't require Miro
- People who already use Apple Notes' "freeform" canvas but want it scoped to a single panel

### Brand
OIA series. Tagline: *"Built for people with ADHD by someone with ADHD."*
Distinct from oia.focus.note (linear list) — this product is *spatial*.

---

## The Commercial Gate (Sales)

### GTM Status
**Engineering:** Mature. v1.1.0. Side panel UI shipped with cork-board CSS, drag-drop logic, locales configured.

**Outstanding before Chrome Web Store launch:**
- Production icons
- Marketing copy emphasizing spatial thinking ("your brain remembers where it put things")
- Demo GIF showing drag-drop layout building over time
- Comparison page: oia.focus.wall vs Miro vs Apple Notes freeform vs sticky-note browser tabs

### T-Shirt Size
**S** — drag-drop adds complexity vs linear list. ~1.4k LOC.

### Tier Structure
**Free Edition** for v1.

| Tier | Price | What It Unlocks |
|---|---|---|
| **Free** | $0 forever | Unlimited stickies, drag-drop, edit, delete, export |

Future Premium considerations (NOT in v1):
- Multiple walls / boards (Pro)
- Sticky color customization (Pro)
- Cross-device sync via `agent-drive-sync` (Pro)
- Connection arrows between stickies (Pro)

### Revenue Model
- **v1**: Free. Audience-build via OIA series.
- **v2 (if validated)**: oia.focus bundle pricing
- **B2B hedge**: Source code Gumroad listing ($200-500). The drag-drop sticky-note module is itself reusable.

---

## Technical Blueprint (Tech)

### Brick Registry

| Brick ID | Category | Input → Process → Output | Complexity | Source |
|---|---|---|---|---|
| `agent-sticky-store` | Infra | `{id, text, x, y, color, timestamp}` → array → chrome.storage.local key `stickies` | XS | `panel.js` |
| `agent-drag-drop-engine` | Capture | Mouse/touch events on sticky → update `{x, y}` on every drag → persist to storage on drop | S | `panel.js` (drag handlers) |
| `agent-sticky-render` | Capture | Stickies array → absolute-positioned divs on cork-board container | XS | `panel.js` + `panel.css` |
| `agent-sticky-edit` | Capture | Click sticky → contenteditable → blur → update text in storage | XS | `panel.js` |
| `agent-clipboard-export` | Export | All stickies → joined text → clipboard | XS | export handler |

### Architecture

```
┌─────────────────────────────────────────────┐
│  panel.html                                 │
│                                             │
│  "what do you need to remember?"            │
│  [textarea]                                 │
│  [save sticky]                              │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │     ┌──────┐                        │    │  ← cork board canvas
│  │     │ note │       ┌──────┐         │    │
│  │     └──────┘       │ idea │         │    │
│  │                    └──────┘         │    │
│  │  ┌──────┐                           │    │
│  │  │ todo │                           │    │
│  │  └──────┘                           │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [copy all] [download]                      │
└─────────────────────────────────────────────┘
            │
            ▼
   chrome.storage.local
     └── stickies: [{id, text, x, y, color, timestamp}]
```

### Installation (development)

```bash
cd C:\dev\864zeros-llc\LLC-DIV-3-FACTORY\extensions\oia-focus-wall
# Vanilla JS, no dependencies

# Load in Chrome:
# chrome://extensions → Developer mode → Load unpacked → select this directory
```

### AI Configuration
**oia.focus.wall does not call any AI.** Pure client-side. Zero API cost.

### Permissions Used

| Permission | Why |
|---|---|
| `storage` | Sticky positions + content |
| `sidePanel` | Always-available cork board |

### Build Status
Stage 1 "Shovel" in the Reverse-Build Assembly Line.

---

*OIA — Organize Your Internal Architecture. A 864zeros LLC product.*
*oia.focus.wall: spatial thinking, made digital.*
