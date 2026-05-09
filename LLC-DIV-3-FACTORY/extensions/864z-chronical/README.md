# Chronicle

**Your AI conversation history. Automatically captured, instantly searchable.**

A Chrome side-panel extension that quietly archives every conversation you have with Gemini, Claude, ChatGPT, and AI Studio — locally on your device.

864zeros LLC | Manifest V3 | Free Edition

---

## The Hook (Marketing)

### The Friction
You ask ChatGPT a brilliant question on Tuesday. You build on it with Claude on Friday. By the next Wednesday, you can't find either of them. ChatGPT's history search is broken. Claude's history is paginated and unsearchable. Gemini saves nothing across sessions if you toggle history off.

The most valuable thinking you do this year is locked inside three different vendor accounts, in three different schemas, with three different deletion policies. **Your conversations belong to you. They should be searchable like email.**

Chronicle is the rescue product:

- **Auto-capture across vendors** — Gemini, Gemini AI Studio, Claude.ai, ChatGPT (chatgpt.com and chat.openai.com). One extension, all your AI conversations.
- **Local-first storage** — every captured turn lives in `chrome.storage` on your device. Vendors can't delete your record by changing their retention policy.
- **Search like you'd search anything else** — full-text across all four hosts, instant results, no cloud round-trip.
- **Vendor-neutral schema** — same record shape regardless of which AI you used. Cross-host comparison is trivial.
- **Side panel, always available** — you can search past conversations while you're in the middle of a new one. Different prompt? Past response? Both visible.

### Who This Is For
- Engineers using AI for code: "what was that prompt that worked last week?"
- Writers iterating across models: "did Claude or GPT give the better outline?"
- Researchers comparing model outputs across hosts
- Anyone who has ever lost a great AI conversation to vendor history pruning

### Migration Hook
Chronicle is itself a migration utility. Your conversations are captured into a vendor-neutral schema. Export to Markdown / JSON at any time. Move them into your Obsidian vault, your Notion workspace, or wherever your knowledge base lives.

---

## The Commercial Gate (Sales)

### GTM Status
**Engineering:** Production-ready. Manifest finalized with all four major host permissions. Side panel UI shipped. Content script handles all four AI host DOM structures.

**Outstanding before Chrome Web Store launch:**
- Per-host DOM-stability monitoring (Gemini and Claude redesign their UI ~quarterly; Chronicle's content script needs a sentinel test for layout regressions)
- Marketing assets (screenshots demonstrating cross-host search)
- Privacy policy explicitly disclosing what is captured and where it is stored
- Optional: ExtPay integration for premium tier (currently free)

### T-Shirt Size
**S** — focused single-purpose tool. The complexity is in the four content-script DOM-extraction strategies, not the rest of the architecture.

### Tier Structure
**Free Edition** for v1.0 launch. No payment infrastructure, no upsell.

| Tier | Price | What It Unlocks |
|---|---|---|
| **Free** | $0 forever | All hosts, all capture, full search, local export |

Future Premium considerations (NOT in v1):
- Cross-device sync via `agent-drive-sync` (Pro)
- AI summarization of past conversations (Pro)
- Conversation tagging + folder organization (Pro)

### Revenue model (planned)
- v1: free, audience-building. The capture utility is the GTM hook.
- v2 (if traction): freemium with the optional sync + summarize tier
- B2B angle: an enterprise version that captures across an organization's AI usage for compliance audits

---

## Technical Blueprint (Tech)

### Brick Registry

| Brick ID | Category | Input → Process → Output | Complexity | Source |
|---|---|---|---|---|
| `agent-llm-host-detector` | Capture | URL match (5 host patterns) → activate scraper for that host | XS | `manifest.json` content_scripts matches |
| `agent-conversation-scraper` | Capture | DOM observer on AI host page → extract turn `{role, content, timestamp}` → message to service worker | M | `content-script.js` |
| `agent-vendor-neutral-store` | Infra | `{host, conversationId, turns[], model}` → chrome.storage append | S | `service-worker.js` (storage logic) |
| `agent-cross-host-search` | Analysis | `query: string` → fuzzy search across all stored conversations → ranked results | S | `sidepanel/panel.html` + JS |
| `agent-conversation-export` | Export | `{conversationId, format: 'json'|'markdown'}` → file download | XS | sidepanel logic |

### Architecture
```
Each AI host page → content-script.js (DOM observer)
                         │
                         ▼
                   {role, content, timestamp, model, conversationId}
                         │
                         ▼
              service-worker.js (background)
                         │
                         ▼
              chrome.storage.local (vendor-neutral schema)
                         │
                         ▼
              sidepanel/panel.html (search + browse)
```

### Capture Strategy by Host

| Host | DOM Strategy |
|---|---|
| `gemini.google.com` | Mutation observer on conversation thread; extract per-turn `data-message-id` containers |
| `aistudio.google.com` | Same as gemini but different selector (Studio uses different layout) |
| `claude.ai` | Observer on conversation div; extract user/assistant message nodes |
| `chatgpt.com` / `chat.openai.com` | Observer on `[data-testid='conversation-turn-...']` containers |

### Installation (development)

```bash
cd C:\dev\864zeros-llc\LLC-DIV-3-FACTORY\extensions\864z-chronical
# No npm install needed — vanilla JS, zero dependencies

# Load in Chrome:
# chrome://extensions → Developer mode → Load unpacked → select this directory
```

### AI Configuration
**Chronicle does not call any AI.** It only captures conversations the user has with vendor AIs. Zero API costs, zero AI proxy needed.

### Permissions Used

| Permission | Why |
|---|---|
| `storage` | Local conversation archive |
| `sidePanel` | Always-available search UI |
| `host_permissions` (×5) | Inject content script into AI host pages only |

Note: Chronicle does not request `<all_urls>`. It only operates on the explicit AI host list. This is a security/privacy posture choice — the extension cannot read any non-AI page.

### DOM Stability Risks
AI host UIs change frequently. Each content script needs a quarterly review:
- **Gemini**: Google ships UI updates often. Last verified: 2026-Q1.
- **Claude**: Anthropic redesigned chat thread structure in late 2025. Last verified: 2026-Q1.
- **ChatGPT**: OpenAI's chat is reasonably stable but mobile/desktop diverge. Last verified: 2026-Q1.
- **AI Studio**: Lower priority — power users only.

Recommend adding a per-host self-test that captures one round-trip and validates extraction on extension startup. Surface a "Chronicle isn't seeing your messages on $HOST — please file a regression" toast if extraction breaks.

---

*864zeros LLC — Organize Your Internal Architecture.*
*Chronicle: AI conversations as searchable as your email.*
