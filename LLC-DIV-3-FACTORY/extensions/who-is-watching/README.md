# Who Is Watching

**See exactly who is tracking you on every page. Block them in one click.**

A Chrome side-panel extension that detects, classifies, and blocks third-party trackers, fingerprinters, and analytics on every page you visit.

864zeros LLC | Manifest V3 | v2.1.6

---

## The Hook (Marketing)

### The Friction
Open any news site, any e-commerce checkout, any "free" SaaS dashboard. Your browser is silently making 30, 50, 100+ background requests to companies you've never heard of: ad networks, behavioral profilers, fingerprinters, session recorders, cross-site identity brokers.

uBlock Origin blocks ads. Privacy Badger learns over time. But neither tells you, in plain language, **exactly who is on this page right now and what category of surveillance they represent.**

Who Is Watching is the rescue product:

- **Real-time tracker detection** — see every third-party connection as it happens, classified by category (analytics, ads, fingerprinting, session replay, social, CDN).
- **Plain-language classification** — instead of "doubleclick.net 47 requests", you see "Google Ads — behavioral profile builder — 47 events".
- **One-click block** — block any tracker (or category) site-wide or per-domain. Uses Chrome's `declarativeNetRequest` for performance.
- **Page-level dossier** — for each site you visit, a summary: "12 trackers, 3 fingerprinters, 1 session recorder. 7 are sharing your IP with brokers."
- **No cloud** — detection runs entirely in your browser. The dossier of "who is on every page you visit" stays local. (Ironically, many privacy tools phone home; this one doesn't.)

### Who This Is For
- Privacy-conscious users tired of vague "blocked X requests" counters
- Journalists and activists who need to understand surveillance posture before logging in
- Developers and security researchers auditing third-party scripts
- Anyone who wants to *see* the surveillance economy, not just feel it

### Migration Hook
Who Is Watching is also a migration target for users leaving Privacy Badger or DuckDuckGo's tracker blocker. Both products are good at *blocking* but bad at *showing*. WIW shows. The export function ("here's the dossier of who I encountered today") opens migration paths to other tools.

---

## The Commercial Gate (Sales)

### GTM Status
**Engineering:** Production-ready. v2.1.6 (mature codebase, ~14k LOC). `declarativeNetRequest` rules + content-script injection + bridge architecture.

**Outstanding before Chrome Web Store launch:**
- Privacy policy — counterintuitively, users will demand to see exactly what WIW logs about its own behavior
- Marketing copy emphasizing "see, then block" (vs Privacy Badger's "block, then see")
- Comparison page: WIW vs uBlock Origin vs Privacy Badger
- Outreach to privacy-focused press (PrivacyTools.io, EFF, r/privacy)

### T-Shirt Size
**L** — large, mature codebase. ~14k LOC. Multiple content scripts (detector, bridge, injector). Hooked-page injection. Sophisticated declarativeNetRequest rule generation.

### Tier Structure (current)

| Tier | Price | What It Unlocks |
|---|---|---|
| **Free** | $0 | Core detection, classification, one-click block, full dossier per site |

Future Premium considerations (NOT in v1.x):
- Cross-device sync of block lists
- Weekly tracker-trend reports ("Here's what changed in your surveillance footprint this week")
- Enterprise team-wide policy ("Block all session-replay vendors company-wide")

### Revenue Model (planned)
- v1: free, audience-building
- v2: optional Pro tier for sync + reports + enterprise
- B2B: surveillance-audit consulting (custom dossiers for orgs)

---

## Technical Blueprint (Tech)

### Brick Registry

| Brick ID | Category | Input → Process → Output | Complexity | Source |
|---|---|---|---|---|
| `agent-tracker-detector` | Capture | Page load events + network requests → classify by domain/category → live event stream | L | `content/detector.js`, `injected/hook.js` |
| `agent-page-context-bridge` | Capture | Detector events → service worker via `chrome.runtime.sendMessage` | S | `content/bridge.js` |
| `agent-tracker-classifier` | Analysis | Domain → category lookup (analytics/ads/fingerprint/session/social/CDN) → human-readable label | S | `background.js` (classification tables) |
| `agent-block-rule-builder` | Export | Domain or category → declarativeNetRequest rule → installed | M | `background.js` (rule injection) |
| `agent-dossier-store` | Infra | Per-site events → chrome.storage indexed by hostname | S | `background.js` |
| `agent-page-injector` | Capture | Inject `injected/hook.js` to monitor `fetch`/`XHR`/`navigator.sendBeacon` | S | `content/injector.js` + `web_accessible_resources` |

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Page (any URL)                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  injected/hook.js (in MAIN world)                      │  │
│  │  Monkey-patches fetch / XMLHttpRequest / sendBeacon    │  │
│  │  Reports outgoing requests via window.postMessage      │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  content/detector.js (isolated world)                  │  │
│  │  Listens for hook messages + DOM script tag analysis   │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  content/bridge.js                                     │  │
│  │  Forwards events to service worker                     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  background.js (service worker)                              │
│  - Classifies each event by domain                           │
│  - Updates per-site dossier in chrome.storage                │
│  - Manages declarativeNetRequest rules for blocking          │
│  - Pushes live updates to side panel                         │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  sidepanel/index.html                                        │
│  - Live tracker list for current tab                         │
│  - One-click block                                           │
│  - Per-site dossier history                                  │
└──────────────────────────────────────────────────────────────┘
```

### Installation (development)

```bash
cd C:\dev\864zeros-llc\LLC-DIV-3-FACTORY\extensions\who-is-watching
# Vanilla JS, no npm install needed for runtime

# Load in Chrome:
# chrome://extensions → Developer mode → Load unpacked → select this directory
```

### AI Configuration
**Who Is Watching does not call any AI.** All classification is rule-based. Domain → category mappings are bundled in the extension. Zero API costs, zero proxy needed.

This is by design — a privacy tool that calls a remote AI for classification would itself be a tracker.

### Permissions Used

| Permission | Why |
|---|---|
| `tabs`, `activeTab`, `scripting` | Inject detector into every page |
| `storage` | Per-site dossier history |
| `webRequest`, `declarativeNetRequest`, `declarativeNetRequestFeedback` | Block trackers; observe blocking effectiveness |
| `sidePanel` | Live tracker view |
| `<all_urls>` (host_permissions) | Required — must inspect every page |

### Why `declarativeNetRequest` instead of `webRequest`-blocking
Chrome's MV3 deprecates `webRequest`-blocking in favor of `declarativeNetRequest`. WIW uses both:
- `webRequest` (read-only) for live observation
- `declarativeNetRequest` for actual blocking

This is the same architecture uBlock Origin uses for MV3 compatibility. Performance is high; rules are processed natively in C++ inside Chrome's networking stack.

### Hooked Page Injection
The `injected/hook.js` script runs in the page's MAIN world (not the isolated content-script world). This is the only way to monkey-patch `fetch` / `XMLHttpRequest` / `sendBeacon`. The hook reports requests via `window.postMessage` to `content/bridge.js`, which forwards to the service worker.

This is the same technique used by EditThisCookie, Web Scraper, and Postman's interceptor.

### Build Status
v2.1.6 is the current shipped version. Codebase is mature. Main outstanding work is GTM-side, not engineering.

---

*864zeros LLC — Organize Your Internal Architecture.*
*Who Is Watching: see the surveillance you're already paying for.*
