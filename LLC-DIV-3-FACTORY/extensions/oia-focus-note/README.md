# oia.focus.note

**Simple note taking for ADHD minds. Capture what you need to remember.**

A Chrome side-panel extension. A brain-dump notepad that's always one click away. No projects. No tags. No formatting. Just text.

OIA (Organize your Internal Architecture) | Series: oia.focus | *a 864zeros LLC product*
Manifest V3 | v1.1.0

---

## The Hook (Marketing)

### The Friction
ADHD adults have 40 things they need to remember by lunch. Notion is too heavy. Apple Notes is fine but it's two windows away. Sticky notes get lost. Drafts is iOS-only. Most note-taking apps assume you want to organize your notes — but ADHD note-taking is *capture first, organize never*.

oia.focus.note is the rescue product:

- **One field. One button.** "What do you need to remember?" → save. That's it.
- **Always-visible side panel.** Not a popup. Not a separate app. Open Chrome → click panel → start typing.
- **No projects, tags, folders, or formatting.** Capture pure text. Move on.
- **Local-first.** chrome.storage.local. Nothing leaves your device.
- **Copy all / download all.** When you're ready to triage, dump the whole thing to clipboard or text file. Process elsewhere.

### Who This Is For
- ADHD adults who need to capture thoughts before they evaporate
- People who use Apple Notes / Stickies / scrap paper as a brain-dump and lose the threads
- Knowledge workers who want a panel-resident scratchpad

### Brand
OIA series. Tagline: *"Built for people with ADHD by someone with ADHD."*
Differentiator vs Signal2Noise: Signal2Noise enforces a max-10 cap and prioritization (signal vs noise). oia.focus.note does NOT cap — it's a raw capture surface.

---

## The Commercial Gate (Sales)

### GTM Status
**Engineering:** Mature. v1.1.0. Side panel UI shipped, locales configured, panel.css present.

**Outstanding before Chrome Web Store launch:**
- Production icons (currently placeholder)
- Marketing copy: lead with the constraint ("one field, one button")
- Comparison page: oia.focus.note vs Apple Notes vs Drafts (the latter two assume you'll organize)
- Privacy policy (trivial — nothing leaves device)

### T-Shirt Size
**XS** — minimal codebase. ~1k LOC. Single panel + chrome.storage backing.

### Tier Structure
**Free Edition** for v1.

| Tier | Price | What It Unlocks |
|---|---|---|
| **Free** | $0 forever | All capture, all export, unlimited notes |

Future Premium considerations (NOT in v1):
- Cross-device sync via `agent-drive-sync` (Pro)
- Markdown export with frontmatter (Pro — would also be a nice migration story to Obsidian)
- Cross-extension integration with Time2Focus / Signal2Noise

### Revenue Model
- **v1**: Free. Audience-build via the OIA series. The product validates the "panel-resident scratchpad" thesis.
- **v2 (if validated)**: oia.focus product bundle pricing
- **B2B hedge**: Source code Gumroad listing ($200-500)

---

## Technical Blueprint (Tech)

### Brick Registry

| Brick ID | Category | Input → Process → Output | Complexity | Source |
|---|---|---|---|---|
| `agent-note-store` | Infra | `{id, text, timestamp}` → array → chrome.storage.local key `notes` | XS | `panel.js` |
| `agent-note-list-render` | Capture | Notes array → vertical list of cards | XS | `panel.js` + `panel.css` |
| `agent-clipboard-export` | Export | All notes → joined text → clipboard | XS | "Copy All" handler |
| `agent-text-download` | Export | All notes → Blob (text/plain) → file download | XS | "Download" handler |

### Architecture

```
┌─────────────────────────────────────────────┐
│  panel.html                                 │
│                                             │
│  "what do you need to remember?"            │
│  ┌─────────────────────────────────────┐    │
│  │  let your thoughts flow...          │    │
│  │  [textarea]                         │    │
│  └─────────────────────────────────────┘    │
│  [save]                                     │
│                                             │
│  [copy all notes] [download notes]          │
│                                             │
│  ▼ List of saved notes                      │
└─────────────────────────────────────────────┘
            │
            ▼
   chrome.storage.local
     └── notes: [{id, text, timestamp}]
```

### Installation (development)

```bash
cd C:\dev\864zeros-llc\LLC-DIV-3-FACTORY\extensions\oia-focus-note
# Vanilla JS, no dependencies

# Load in Chrome:
# chrome://extensions → Developer mode → Load unpacked → select this directory
```

### AI Configuration
**oia.focus.note does not call any AI.** Pure client-side. Zero API cost.

### Permissions Used

| Permission | Why |
|---|---|
| `storage` | Local notes array |
| `sidePanel` | Always-available panel |

### Build Status
Stage 1 "Shovel" in the Reverse-Build Assembly Line.

---

*OIA — Organize Your Internal Architecture. A 864zeros LLC product.*
*oia.focus.note: capture first, organize never (or maybe later).*
