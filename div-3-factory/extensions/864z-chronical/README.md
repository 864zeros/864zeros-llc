# Chronicle

> Your complete AI conversation history. Automatically captured, instantly searchable.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue)](https://chrome.google.com/webstore)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](./LICENSE)

Chronicle is a Chrome extension by **864zeros LLC** that automatically records your AI conversations from Claude, Gemini, and ChatGPT into a searchable, local archive. Never lose an insight again.

---

## Features

- **Automatic Recording** — Captures conversations as they happen, no manual export needed
- **Universal Search** — Full-text search across all your AI conversations
- **Local-First** — Your data stays on your device (IndexedDB), with optional cloud sync
- **Multi-Platform** — Works with Claude.ai, Google Gemini, and ChatGPT
- **Side Panel Interface** — Persistent sidebar for quick access without leaving your workflow
- **JSON & Markdown Export** — Export conversations for Notion, Obsidian, or your knowledge base
- **Tiered Access** — Free Apprentice tier (30 days / 500 entries) and paid Scribe tier (unlimited + cloud sync)

---

## Installation

### From Chrome Web Store

*(Coming soon)*

### Manual Installation (Developer Mode)

1. Download the latest release from [Releases](../../releases)
2. Unzip the file
3. Open Chrome and navigate to `chrome://extensions`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked"
6. Select the `dist/` folder
7. Click the Chronicle icon or press `Cmd+Shift+Y` (Mac) / `Ctrl+Shift+Y` (Windows)

---

## Usage

### Recording Conversations

Chronicle works automatically. Visit Claude.ai, Gemini, or ChatGPT and conversations are recorded in real time via platform-specific DOM scrapers (Scribes).

- **Red pulse indicator** — Currently recording this conversation
- **Entries** — Saved to your local chronicle instantly

### Searching Your Chronicle

Open the side panel (`Cmd+Shift+Y`) and type in the search box. Chronicle searches:
- Conversation titles
- Message content (full-text indexed)
- Code blocks and citations

### Organizing Entries

- **Star** important conversations for quick access
- **Filter** by platform (Claude, Gemini) or starred entries
- **Delete** entries you no longer need

### Exporting

Click the export button to download your chronicle as:
- **JSON** — Structured data for backup or migration
- **Markdown** — Ready for Notion, Obsidian, or GitHub

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Claude.ai     │     │  Google Gemini   │     │    ChatGPT      │
│   Scribe        │────>│   Chronicle      │<────│   (coming)      │
│                 │     │   Side Panel     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────┬───────────┘───────────────────────┘
                     v
            ┌─────────────────┐
            │  The Archive    │
            │  (IndexedDB)    │
            │  - Entries      │
            │  - Exchanges    │
            │  - Search Index │
            └─────────────────┘
```

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Scribes** | Platform-specific DOM recorders | `src/scribes/` |
| **The Archive** | IndexedDB database layer | `src/archive/database.ts` |
| **The Keeper** | Service worker — message routing, alarms, sync | `src/keeper.ts` |
| **The Scribe** | Content script — platform detection, recording | `src/scribe.ts` |
| **Side Panel** | User interface — search, filter, detail, export | `sidepanel.html` + `src/sidepanel.ts` |

### Tech Stack

- **TypeScript** — Strict mode, full type coverage
- **Vite + CRXJS** — Modern Chrome extension build pipeline
- **IndexedDB** via [idb](https://github.com/jakearchibald/idb) — Local-first storage
- **Chrome Manifest V3** — Side panel API, service workers, content scripts

---

## Development

### Prerequisites

- Node.js 18+
- Chrome or Edge browser

### Setup

```bash
git clone https://github.com/jeff0926/864z-chronical.git
cd 864z-chronical

npm install

# Development server with hot reload
npm run dev

# Production build
npm run build
# Output in dist/, ready for Chrome
```

### Project Structure

```
chronicle/
├── src/
│   ├── scribes/
│   │   ├── claude.ts        # Claude.ai DOM scraper
│   │   ├── gemini.ts        # Google Gemini DOM scraper
│   │   └── index.ts         # Scribe registry
│   ├── archive/
│   │   └── database.ts      # IndexedDB storage (TheArchive)
│   ├── types.ts             # Shared TypeScript interfaces
│   ├── keeper.ts            # Service worker (The Keeper)
│   ├── scribe.ts            # Content script (The Scribe)
│   └── sidepanel.ts         # Side panel UI controller
├── sidepanel.html           # Side panel markup
├── sidepanel.css            # Dark theme styles
├── icons/                   # Extension icons (16, 48, 128px)
├── manifest.json            # Chrome Manifest V3
├── vite.config.ts           # CRXJS + Vite build config
├── tsconfig.json            # TypeScript config
└── package.json
```

### Adding a New Scribe

1. Create `src/scribes/[platform].ts`
2. Implement the `ScribeAdapter` interface from `src/types.ts`:
   ```typescript
   export const PlatformScribe: ScribeAdapter = {
     name: 'platform',
     domains: ['platform.ai'],
     recognizes(url) { /* ... */ },
     identifySource() { /* ... */ },
     readTitle() { /* ... */ },
     readModel() { /* ... */ },
     recordExchanges() { /* ... */ },
     watch(callback) { /* ... */ }
   };
   ```
3. Register in `src/scribes/index.ts`
4. Add host permission to `manifest.json`

---

## Privacy & Security

Chronicle is designed with privacy as a core principle:

- **Local-first** — All data stored in browser IndexedDB by default
- **No telemetry** — We don't track usage or conversations
- **No external calls** — Unless you enable cloud sync (Scribe tier)
- **Minimal permissions** — Only requests access to supported AI platform domains

### Data Storage

| Tier | Storage | Retention | Sync |
|------|---------|-----------|------|
| **Apprentice** (Free) | Local (IndexedDB) | 30 days / 500 entries | None |
| **Scribe** (Paid) | Local + Cloud | Unlimited | Encrypted cloud backup |

---

## Roadmap

### v1.0 (Current)
- [x] Claude.ai recording
- [x] Google Gemini recording
- [x] Full-text search with IndexedDB indexing
- [x] JSON/Markdown export
- [x] Side panel interface with dark theme
- [x] Star/delete entries
- [x] Platform filtering
- [x] Apprentice tier limits (30 days / 500 entries)

### v1.1 (Next)
- [ ] ChatGPT support
- [ ] Tags and folders
- [ ] Conversation annotations
- [ ] Keyboard shortcuts

### v1.2
- [ ] Semantic search (embeddings)
- [ ] Conversation insights/stats
- [ ] Notion/Obsidian direct sync
- [ ] Mobile companion app

### Future
- [ ] Team workspaces
- [ ] API access
- [ ] Custom scribes (user-defined selectors)
- [ ] Vault (encrypted cloud sync)

---

## License

Copyright (c) 2024-2026 864zeros LLC. All rights reserved.

This software is proprietary and confidential. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Built with [CRXJS](https://crxjs.dev/) for modern Chrome extension development
- IndexedDB powered by [idb](https://github.com/jakearchibald/idb)
