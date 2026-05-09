# [864F] ClipBoard

> **Compliance (Phase 1, 2026-05-08):**
> - **RULE-001** (Command & Control Standard): 🟡 partial — sidepanel header has [864F] prefix; options page has standardized brand-footer added alongside existing 5-section structure. Full 3-section restructure deferred to Phase 2 (would consolidate existing General/AI/Plan/Data/Fuel sections — needs UX decisions before disrupting shipping users).
> - **RULE-002** (SW Download Pattern): ✅ **already compliant pre-rule** — `background/service-worker.js:890` uses `data:application/pdf;base64,…` for PDF downloads. ClipBoard's PDF generator is the original birthplace of this pattern that became BRK-DL-001.
> - **RULE-003** (Selection & Curation UI): ❌ NOT YET — clip queue lacks tristate select-all + bulk actions. **Deferred to Phase 2.**
> - **RULE-004** (Interactive Record Accordion): ❌ NOT YET — clip-card uses its own inline-text-expand button (`clip-card__expand`), not BRK-UI-004. **Deferred to Phase 2** (sidepanel/main.js is 2,555 LOC; safe migration requires dedicated sprint).
> 
> **Pillar:** 864-Flux (Kinetic Bridges) · Slate & Graphite palette
> **Sign-off authority:** Office Architect (`864z-OA`) per RULE-000

---

# ClipBoard

**Local-first web clipper. Capture anything. Keep it. Own it.**

A Chrome side-panel extension for capturing text, pages, screenshots, and PDFs from any website — stored locally on your device, optionally synced to your own Google Drive, optionally enhanced with AI.

864zeros LLC | Manifest V3 | Pro tier $3.99/mo or pay-once via ExtensionPay

---

## The Hook (Marketing)

### The Friction
Web clippers today force a choice you shouldn't have to make. Pocket sells your reading data. Evernote raises prices and gutters the free tier. Notion keeps your snippets in their cloud, on their schema, with their export tax. Every "save this" moment ships your interest graph to someone's marketing team.

ClipBoard is the rescue product. It is the **local-first clipper**:

- **Privacy-first local storage** — IndexedDB keeps every clip on your device. No vendor account required to use the core product. Your interests never leave your laptop.
- **Capture any source, any format** — selected text, full page text/HTML, full-page PDF, visible-area screenshot, marquee-area screenshot. Five capture modes, one keystroke each.
- **AI when you want it, never when you don't** — summarize, auto-tag, image analysis, ask-my-clips. Routed through a 864zeros proxy worker so your API key never leaves the worker. Toggle off entirely at any time.
- **Your Drive, your control** — optional Google Drive sync uses the `drive.appdata` scope (a hidden app folder you own). Five rolling backups. No 864zeros server in the path.
- **PII redaction before AI** — addresses, emails, SSNs, credit cards, IPs, phone numbers stripped automatically before any cloud round-trip. Restorable on the way back.

### Who This Is For
- Researchers tired of Pocket selling their behavior
- Writers and analysts who want their clip library to outlive any one SaaS
- Privacy-conscious knowledge workers who refuse cloud-only tools
- ADHD users who need frictionless capture before the thought escapes

### Migration Hook
If `agent-markdown-converter` ships (Strike 011), ClipBoard inherits **"Export to Obsidian / Capacities / any vault"** for free. Your clips become a portable Markdown library. The clipper that helps you leave any other clipper.

---

## The Commercial Gate (Sales)

### GTM Status
**Engineering:** Production-ready. 14 of 14 bricks shipped. Real OAuth client ID provisioned. ExtPay wrapper integrated.

**Outstanding before Chrome Web Store launch:**
- ExtensionPay account registration + Stripe activation (currently extpayId placeholder)
- Privacy policy + Terms of Service URLs (referenced in `pricing.js`, need real URLs)
- Marketing assets: 5 store screenshots, promo tile (440×280), demo video
- Final `manifest.json` icons (placeholders need replacement)
- Beta tester sign-off on production payment flow with Stripe test mode

### T-Shirt Size
**M** — multi-mode capture + AI integration + payment infrastructure + Drive OAuth. Substantial assembly, not a single-purpose tool.

### Tier Structure (per `config/pricing.js`)

| Tier | Price | What It Unlocks |
|---|---|---|
| **Free** | $0 | Text capture, page capture, marquee capture, local export, 10 free AI credits, IndexedDB storage |
| **Starter** | $1.99/mo | Screenshot capture, PDF capture, AI summarize (basic) |
| **Pro** | $3.99/mo | AI auto-tag, AI vision, bulk operations, Google Drive sync |
| **Power** | $5.99/mo | Synthesize-clips, Ask-clips, research-report, unlimited AI |
| **Lifetime** | $150 one-time | All Power features, forever |

Brick mapping (Core = Free, Premium = paid):

| Brick | Tier |
|---|---|
| `agent-dom-scraper` | **Core** |
| `agent-pdf-generator` | Starter |
| `agent-anonymizer-pii` | **Core** (always on for AI calls) |
| `agent-ai-summarize` | Starter (1 credit/call) |
| `agent-ai-autotag` | Pro (1 credit/call) |
| `agent-ai-vision` | Pro (2 credits/call) |
| `agent-ai-chat` | Power |
| `agent-drive-sync` | Pro |
| `agent-local-backup` | **Core** |
| `agent-credit-ledger` | infrastructure |
| `agent-feature-gate-tiers` | infrastructure |

### Revenue model
- Recurring (~$2-6/mo) via ExtensionPay → Stripe
- One-time lifetime ($150) for users who refuse subscription on principle
- Credit packs for AI-heavy users beyond included monthly budget
- Total transaction fee: ~8% (5% ExtPay + 2.9% Stripe + $0.30)

---

## Technical Blueprint (Tech)

### Brick Registry

| Brick ID | Category | Input → Process → Output | Complexity | Source |
|---|---|---|---|---|
| `agent-dom-scraper` | Capture | Active tab DOM → message handlers (GET_SELECTION/GET_PAGE_CONTENT) → `{text, url, title}` | XS | `scripts/content.js` |
| `agent-pdf-generator` | Capture | `{tabId, preset}` → Chrome DevTools Protocol Page.printToPDF → `{pdfDataUrl, filename}` | S | `lib/pdf-generator.js` |
| `agent-anonymizer-pii` | Analysis | `text` → regex strip (EMAIL/PHONE/SSN/CC/IP/ADDRESS) → `{redactedText, redactions[]}` (reversible) | S | `lib/redactor.js` |
| `agent-ai-summarize` | Analysis | `{text, maxLength}` → Cloudflare Worker proxy → `{summary, model}` | XS | `lib/ai/ai-client.js` |
| `agent-ai-autotag` | Analysis | `{text, existingTags}` → proxy → `{tags[], model}` | XS | `lib/ai/ai-client.js` |
| `agent-ai-vision` | Analysis | `{imageBase64, prompt}` → proxy (Gemini Vision) → `{description, model}` | XS | `lib/ai/ai-client.js` |
| `agent-ai-chat` | Analysis | `{messages[], context}` → proxy → `{response, model}` | XS | `lib/ai/ai-client.js` |
| `agent-drive-sync` | Export | `{data, filename, appSlug}` + OAuth → Drive API v3 (drive.appdata scope) → `{success, fileId, syncedAt}` | M | `lib/google-drive/drive-client.js` |
| `agent-local-backup` | Export | `exportLocal()` → IndexedDB dump → `.json` download / `importLocal(file)` → IndexedDB merge | S | `lib/backup.js` |
| `agent-indexeddb-store` | Infra | Standard CRUD + exportAll/importAll | S | `lib/db.js` |
| `agent-chrome-storage-store` | Infra | `{key, value}` → chrome.storage.local + reactive listeners | XS | `lib/store.js` |
| `agent-feature-gate-tiers` | Infra | `{feature}` → tier check → `{allowed, requiredTier, currentTier}` | S | `lib/tiers.js`, `lib/payments/tiers.js` |
| `agent-payment-extpay` | Infra | `{planId}` → ExtPay → `{user, paid, plan}` | S | `lib/payments/extpay-wrapper.js` |
| `agent-credit-ledger` | Infra | `{feature, costCredits}` → balance check → `{ok, remaining, history}` | S | `lib/credits.js`, `lib/payments/credits.js` |

### Architecture
```
┌──────────────────────────────────────────────────────────────┐
│  Chrome Side Panel (sidepanel/main.js)                       │
│  Capture buttons → message → service worker                  │
├──────────────────────────────────────────────────────────────┤
│  Service Worker (background/service-worker.js)               │
│  Routes capture → content script → storage → AI proxy → UI   │
├──────────────────────────────────────────────────────────────┤
│  Content Script (scripts/content.js)                         │
│  GET_SELECTION / GET_PAGE_CONTENT / marquee overlay          │
├──────────────────────────────────────────────────────────────┤
│  Storage Layer:                                              │
│    IndexedDB (lib/db.js) ← clips, tags, AI results           │
│    chrome.storage.local (lib/store.js) ← settings, prefs     │
└──────────────────────────────────────────────────────────────┘
                            ▲
                            │
                  ┌─────────┴─────────┐
                  │  Optional cloud:  │
                  │  Google Drive     │
                  │  (drive.appdata)  │
                  │  AI proxy worker  │
                  │  (864zeros CF)    │
                  └───────────────────┘
```

### Installation (development)

```bash
# 1. Install dependencies
cd C:\dev\864zeros-llc\LLC-DIV-3-FACTORY\extensions\clipboard
npm install

# 2. Run tests
npm test

# 3. Load in Chrome
#    chrome://extensions → Developer mode → Load unpacked → select this directory
```

### AI Configuration

ClipBoard does not store any AI keys client-side. All AI calls route through the 864zeros Cloudflare Worker proxy at `clipboard-864z.864zeros.workers.dev`. The worker holds Gemini and/or Claude credentials server-side.

To run a private AI worker (advanced):
```javascript
// lib/ai/ai-client.js
const WORKER_URL = 'https://your-worker.your-account.workers.dev';
```
Endpoints required by `ai-client.js`:
- `POST /ai/summarize` — `{text, maxLength}` → `{summary, model}`
- `POST /ai/auto-tag` — `{text, existingTags}` → `{tags, model}`
- `POST /ai/vision` — `{imageBase64, prompt}` → `{description, model}`
- `POST /ai/chat` — `{messages, context}` → `{response, model}`

For local development (`USE_DEV_WORKER = true`), point to `http://localhost:8787` running `wrangler dev`.

### Google Drive Configuration

OAuth client ID already provisioned in `manifest.json`:
```
100480155220-om7fq5o98vj4h46c94bulvac41s1jj0t.apps.googleusercontent.com
```
Scopes: `https://www.googleapis.com/auth/drive.appdata` + `email`. Drive folder is hidden (appdata-scoped); user does not see clipboard files in their visible Drive.

### Permissions Used

| Permission | Why |
|---|---|
| `storage`, `unlimitedStorage` | IndexedDB clip library + settings |
| `activeTab`, `scripting` | Inject capture content script on demand |
| `contextMenus` | Right-click "Save selection to ClipBoard" |
| `debugger` | PDF generation via Chrome DevTools Protocol |
| `downloads` | Local backup `.json` export trigger |
| `identity` | Google Drive OAuth flow |
| `alarms` | Auto-sync schedule (Pro tier) |
| `management` | Detect other 864zeros extensions for cross-promo |

### Build Status
Phase 1-7 complete per build-kit phase model. Phase 8 (production launch) blocked on the GTM checklist in §2 above.

---

*864zeros LLC — Organize Your Internal Architecture.*
*ClipBoard is part of the OIA series. Local-first. Privacy-first. Yours-first.*
