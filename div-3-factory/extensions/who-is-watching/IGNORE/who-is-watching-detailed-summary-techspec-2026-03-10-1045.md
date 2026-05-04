# Who Is Watching - Detailed Technical Summary
**Date:** 2026-03-10 10:45
**Version:** 1.0.0 (Behavioral Fingerprinting Engine v2.0)
**Status:** Feature Complete, Untested

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current Detection Architecture](#current-detection-architecture)
3. [Vendor Detection & Organization](#vendor-detection--organization)
4. [Data Collection Itemization](#data-collection-itemization)
5. [UI Structure & Views](#ui-structure--views)
6. [Identity Tab Analysis](#identity-tab-analysis)
7. [Data Flow Architecture](#data-flow-architecture)
8. [Gaps & Opportunities](#gaps--opportunities)

---

## Executive Summary

**What it does:** Chrome extension that exposes analytics vendors, identity resolution, and consent violations on any webpage.

**Core capability:** Detects trackers by BEHAVIOR (what they do) + URL patterns (where requests go).

**Current organization:** Vendors grouped by **category** (analytics, marketing, intent, consent, etc.) - NOT by URL.

---

## Current Detection Architecture

### Two-Layer Detection System

| Layer | File | Context | Detection Method |
|-------|------|---------|------------------|
| **Script Scanning** | `content/detector.js` | Isolated (content script) | DOM scan for `<script src>`, inline scripts, iframes |
| **Behavioral Analysis** | `injected/hook.js` | Page context | Intercepts fetch/XHR/beacon/cookies/canvas |

### Detection Flow

```
Page Load
    │
    ├── detector.js (runs at document_start)
    │   ├── Scans existing <script> tags
    │   ├── Scans inline scripts for GTM/GA4/UA patterns
    │   ├── MutationObserver watches for dynamic injection
    │   └── Sends VENDOR_DETECTED messages
    │
    └── hook.js (injected at document_idle)
        ├── Intercepts ALL network calls (fetch, XHR, beacon, pixels)
        ├── Intercepts cookie writes
        ├── Detects canvas/font fingerprinting
        ├── Analyzes behavioral signals
        ├── Guesses vendor from behavior
        └── Sends BEHAVIORAL_VENDOR_DETECTED, NETWORK_REQUEST, etc.
```

---

## Vendor Detection & Organization

### Current Organization: BY CATEGORY

Vendors are grouped into these categories:

| Category | Examples | Badge Color |
|----------|----------|-------------|
| `analytics` | Google Analytics, Adobe Analytics, Mixpanel, Amplitude, Heap, Hotjar, FullStory, Clarity | Blue |
| `marketing` | Marketo, HubSpot, Pardot, Eloqua | Purple |
| `intent` | 6sense, Bombora, Demandbase, Clearbit, ZoomInfo | Orange |
| `advertising` | Facebook Pixel, LinkedIn Insight, Twitter, Pinterest, TikTok, Bing | Red |
| `consent` | OneTrust, TrustArc, Cookiebot | Green |
| `chat` | Intercom, Drift, Zendesk | Teal |
| `tag_manager` | Google Tag Manager, Tealium iQ, Ensighten | Purple |
| `proxy` | First-party proxy (detected by heuristics) | Orange |
| `unknown` | Behavioral detection, no known vendor | Gray |

### Vendor Data Structure

```javascript
vendor = {
  name: 'Google Analytics 4',    // Human-readable
  key: 'google_ga4',             // Internal identifier
  category: 'analytics',         // Grouping category
  detectionMethod: 'script',     // 'script', 'dynamic', 'inline', 'behavioral'
  source: 'https://...',         // URL that triggered detection
  scripts: [],                   // Array of detected script URLs
  requests: [],                  // Associated network requests
  cookies: [],                   // Cookies set by this vendor
  behavioralSignals: [],         // Detection evidence
  confidence: 90,                // 0-100 detection confidence
  timestamp: Date.now()
}
```

### NOT Currently Organized By URL

The current system does NOT group by URL/domain. A user visiting `example.com` sees:
```
Analytics
  └─ Google Analytics 4
  └─ Adobe Analytics
  └─ Mixpanel

Marketing
  └─ HubSpot

Intent Data
  └─ 6sense
```

NOT:
```
example.com
  └─ Google Analytics 4
  └─ HubSpot

analytics.example.com
  └─ First-party proxy
```

---

## Data Collection Itemization

### 1. SCRIPTS DETECTED (`detector.js`)

**40+ vendor patterns** with matching criteria:

```javascript
// Pattern structure per vendor:
{
  scripts: [/regex patterns.../],  // Match script filenames
  domains: ['domain1.com', ...],   // Match in src URL
  globals: ['windowObject', ...]   // (defined but not actively used for detection)
}
```

**Full Vendor List:**

| Vendor | Script Patterns | Domain Patterns |
|--------|-----------------|-----------------|
| adobe_launch | `/launch-.*\.min\.js/`, `/satellite-.*\.js/` | assets.adobedtm.com, launch.adobe.com |
| adobe_alloy | `/alloy.*\.js/`, `/at\.js/` | edge.adobedc.net, adobedc.net |
| adobe_analytics | `/AppMeasurement.*\.js/`, `/s_code.*\.js/` | omtrdc.net, 2o7.net, demdex.net |
| google_gtm | `/gtm\.js/`, `/gtag\/js/` | googletagmanager.com |
| google_analytics | `/analytics\.js/`, `/ga\.js/` | google-analytics.com |
| google_ga4 | `/gtag/` | analytics.google.com/g/ |
| marketo | `/munchkin.*\.js/` | mktoresp.com, marketo.com |
| hubspot | `/hs-scripts\.com/`, `/hubspot/` | hubspot.com, hs-scripts.com, hsforms.com |
| pardot | `/pardot\.com/` | pardot.com, pi.pardot.com |
| eloqua | `/eloqua/`, `/elqcfg/` | eloqua.com, en25.com |
| sixsense | `/6sense/`, `/6sc\.co/` | 6sense.com, j.6sc.co |
| bombora | `/bombora/`, `/ml314/` | bombora.com, ml314.com |
| demandbase | `/demandbase/` | demandbase.com, tag.demandbase.com |
| clearbit | `/clearbit/` | clearbit.com, x.clearbitjs.com |
| zoominfo | `/zoominfo/` | zoominfo.com, ws.zoominfo.com |
| segment | `/segment/`, `/analytics\.js/` | segment.io, segment.com |
| mixpanel | `/mixpanel/` | mixpanel.com, api.mixpanel.com |
| amplitude | `/amplitude/` | amplitude.com, cdn.amplitude.com |
| heap | `/heap/`, `/heapanalytics/` | heap.io, heapanalytics.com |
| fullstory | `/fullstory/` | fullstory.com, rs.fullstory.com |
| hotjar | `/hotjar/` | hotjar.com, static.hotjar.com |
| clarity | `/clarity/` | clarity.ms |
| logrocket | `/logrocket/` | logrocket.com, cdn.logrocket.io |
| facebook_pixel | `/fbevents\.js/` | connect.facebook.net, facebook.com/tr |
| linkedin_insight | `/snap\.licdn/` | linkedin.com/px, snap.licdn.com |
| twitter_pixel | `/static\.ads-twitter/` | ads.twitter.com, t.co |
| pinterest_tag | `/pintrk/` | ct.pinterest.com |
| tiktok_pixel | `/analytics\.tiktok/` | analytics.tiktok.com |
| bing_ads | `/bat\.bing/` | bat.bing.com |
| onetrust | `/otSDKStub/`, `/optanon/` | onetrust.com, cookielaw.org |
| trustarc | `/trustarc/` | trustarc.com, truste.com |
| cookiebot | `/cookiebot/` | cookiebot.com |
| intercom | `/intercom/` | intercom.io, widget.intercom.io |
| drift | `/drift/`, `/driftt/` | drift.com, js.driftt.com |
| zendesk | `/zendesk/`, `/zdassets/` | zendesk.com, zdassets.com |
| tealium | `/utag\.js/`, `/tealium/` | tags.tiqcdn.com, tealium.com |
| ensighten | `/ensighten/` | ensighten.com, nexus.ensighten.com |

### 2. NETWORK REQUESTS CAPTURED (`hook.js`)

**Interception methods:**

| Method | What's Captured |
|--------|-----------------|
| `fetch()` | URL, body, headers context |
| `XMLHttpRequest` | URL, body, method |
| `navigator.sendBeacon()` | URL, data (marked EXIT_TRACKING) |
| `Image.prototype.src` | Pixel URL (if matches tracking patterns) |

**Tracking pixel detection:**
- Known pixel domains: `facebook.com/tr`, `pixel.facebook`, `bat.bing.com`, `linkedin.com/px`, `t.co`, `ct.pinterest`
- URL heuristics: `/pixel`, `/beacon`, `/t.gif`, `/b.gif`, `/p.gif`, `[?&](w|width|h|height)=1`

### 3. COOKIES INTERCEPTED (`hook.js`)

**Known tracking cookie prefixes:**

| Prefix | Vendor |
|--------|--------|
| `_ga`, `_gid`, `_gat`, `_gcl` | Google Analytics |
| `s_vi`, `s_fid`, `AMCV_`, `mbox` | Adobe |
| `_fbp`, `_fbc` | Facebook |
| `_mkto_trk` | Marketo |
| `__hstc`, `hubspotutk` | HubSpot |
| `_hjid`, `_hjSessionUser` | Hotjar |
| `_6si` | 6sense |
| `li_sugr` | LinkedIn |
| `mp_` | Mixpanel |
| `ajs_` | Segment |
| `_clck`, `_clsk` | Microsoft Clarity |

**Cookie analysis signals:**
- Long expiry (1yr+) → `PERSISTENT_ID` signal
- UUID-like value (32+ hex chars) → "Contains unique identifier"

### 4. BEHAVIORAL SIGNALS ANALYZED (`hook.js`)

| Signal | Weight | Detection Pattern |
|--------|--------|-------------------|
| PERSISTENT_ID | +20 | Cookie expiry > 1 year |
| SESSION_TRACKING | +15 | Session ID persists |
| INTERACTION_DATA | +25 | `mouse|click|scroll|touch|keypress|cursor|coordinates` in payload |
| DEVICE_FINGERPRINT | +30 | `screen|resolution|timezone|language|plugins|webgl|canvas|fonts|userAgent` |
| EXIT_TRACKING | +20 | sendBeacon on unload |
| CONVERSION_DATA | +20 | `revenue|transaction|order|purchase|cart|product|sku|price|currency` |
| HIGH_RES_TIMING | +15 | 13+ digit timestamps in payload |
| CROSS_DOMAIN | +25 | Request hostname != page hostname |
| CANVAS_READ | +30 | toDataURL/getImageData on suspicious canvas |
| FONT_PROBE | +25 | >20 fonts tested via measureText |
| FORM_CAPTURE | +25 | `form|input|field|submit|signup|register` in payload |
| PII_COLLECTION | +30 | `email|phone|address|firstname|lastname|user_email|customer` |

**Threshold:** Total weight >= 20 = "isTracking: true"

### 5. FINGERPRINTING DETECTION

**Canvas fingerprinting criteria:**
- Canvas size < 400x200 OR exactly 300x150 OR 220x30
- `fillText()` was called
- Canvas not visible (display:none, offsetParent null)
- Multiple text renders (>=2 fillText calls)

**Font fingerprinting criteria:**
- >20 different fonts measured via `measureText()`
- >50 total `measureText()` calls

### 6. DATA LAYER MONITORING

**Watched objects:**
- `window.dataLayer` (Google GTM)
- `window.digitalData` (Adobe)
- `window._6senseData` (6sense)
- `window.utag_data` (Tealium)

**Captured events:**
- `DATALAYER_PUSH` - New pushes to dataLayer
- `DATALAYER_DETECTED` - Initial snapshot
- `DATALAYER_SNAPSHOT` - On-demand full capture

### 7. IDENTITY DETECTION

**Identity types extracted:**

| Type | Source | Detection Method |
|------|--------|------------------|
| ECID | Adobe | `Visitor.getInstance().getMarketingCloudVisitorID()` |
| CUID | Adobe | `Visitor.getInstance().getCustomerIDs()` |
| GA_CID | Google | `ga.getAll()[].get('clientId')` |
| USER_ID | dataLayer | `dataLayer[].userId` or `dataLayer[].user_id` |
| SEGMENT_ANON | Segment | `analytics.user().anonymousId()` |
| MIXPANEL_ID | Mixpanel | `mixpanel.get_distinct_id()` |

### 8. CONSENT DETECTION

**Platforms detected:**
- OneTrust: `window.Optanon`, `window.OneTrust`, `OptanonActiveGroups`
- TrustArc: `window.truste`, consent bindMap
- Cookiebot: `window.Cookiebot`, consent object
- TCF/IAB: `window.__tcfapi`, TCData

---

## UI Structure & Views

### Side Panel (`sidepanel/index.html`)

**5 Views via bottom navigation:**

| View | Purpose | State |
|------|---------|-------|
| **Vendors** | List vendors grouped by category, expandable cards | WORKING |
| **Identity** | D3.js force-directed graph of identity nodes | NOT WORKING |
| **Network** | Chronological list of tracking requests | WORKING |
| **Data** | JSON view of data layer activity | WORKING |
| **Inject** | Testing tools (spoof ECID, block Alloy, fake consent) | WORKING |

### Vendor Card Expanded View

When a vendor card is expanded, shows:

1. **Detection Evidence** (behavioral signals, confidence %)
2. **Data Being Captured** (parsed request parameters by category)
3. **Tracking Cookies** (name, value, signals)
4. **Captured Identities** (ECID, GA_CID, etc.)
5. **Raw Network Requests** (collapsed, last 10)
6. **Detected Scripts** (collapsed)

### Captured Data Categories

Request parameters are auto-categorized:

| Category | Example Keys |
|----------|--------------|
| Identifiers | cid, uid, mid, aid, tid, userId, anonymousId, clientId, _ga, ecid |
| Page Data | dl, dt, dp, dh, dr, url, ref, pageName, page, path, title |
| Event Data | t, ec, ea, el, ev, en, event, eventName, events |
| User Data | email, phone, address, firstName, lastName |
| Technical | v, sr, vp, de, sd, ul, je, fl, ua, ts |

---

## Identity Tab Analysis

### Current State: NOT WORKING

**Why the Identity tab shows nothing:**

1. **Timing issue:** `detectIdentities()` runs at 1s, 3s, 10s after page load, but:
   - Adobe Visitor object may not be initialized yet
   - `ga.getAll()` may return empty if GA4 (different API)
   - Global objects depend on script execution order

2. **Detection gaps:**
   - Only checks for specific global objects (`window.Visitor`, `window.ga`, etc.)
   - Modern implementations (GA4, Adobe Web SDK) use different APIs
   - Server-side tracking has no client-side globals to inspect

3. **No behavioral identity extraction:**
   - Network requests contain identity data but it's not being extracted to state.identities
   - Hook.js emits `IDENTITY_DETECTED` only from global inspection, not from request parsing

4. **Graph rendering depends on data:**
   - D3 force graph only renders if `state.identities.length > 0`
   - Shows empty message otherwise

### What SHOULD happen:

```
Identity nodes should be created from:
├── Global object inspection (current)
│   └── ECID, CUID, GA_CID, USER_ID
├── Cookie values (NOT DONE)
│   └── _ga value → GA_CID
│   └── s_vi value → ECID
├── Network request payloads (NOT DONE)
│   └── &cid= → GA_CID
│   └── &mid= → ECID
│   └── anonymousId → SEGMENT_ANON
└── Data layer values (PARTIAL)
    └── userId from dataLayer
```

### Identity Graph Links

Identities are linked when:
- Same `source` (e.g., both from "Adobe Visitor")
- ECID ↔ CUID (Adobe identity stitching)
- ECID ↔ USER_ID (cross-system stitching)

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                            BROWSER TAB                               │
├──────────────────────────────┬──────────────────────────────────────┤
│   ISOLATED WORLD             │   PAGE CONTEXT                       │
│   (content scripts)          │   (injected hook.js)                 │
│                              │                                       │
│   detector.js                │   hook.js                            │
│   ├─ Scans DOM               │   ├─ Intercepts fetch/XHR/beacon    │
│   ├─ MutationObserver        │   ├─ Intercepts cookies             │
│   └─ VENDOR_DETECTED ───────►│   ├─ Detects fingerprinting         │
│                              │   ├─ Analyzes behavioral signals    │
│   bridge.js ◄────────────────│◄──┤─ postMessage                    │
│   └─ Relays to background    │   └─ NETWORK_REQUEST, COOKIE_SET,   │
│                              │       BEHAVIORAL_VENDOR_DETECTED,    │
│                              │       FINGERPRINT_DETECTED, etc.    │
└──────────────────────────────┴──────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│   SERVICE WORKER (background.js)                                     │
│   └─ Routes messages to side panel via chrome.runtime.sendMessage   │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│   SIDE PANEL (sidepanel/main.js)                                     │
│   ├─ State: vendors[], identities[], network[], cookies[],         │
│   │         fingerprints[], dataLayers{}, consent, behavioralSignals│
│   ├─ Renders: vendor cards, identity graph, network log            │
│   └─ Updates: real-time as messages arrive                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Gaps & Opportunities

### Current Gaps

| Gap | Impact | Effort |
|-----|--------|--------|
| **No URL-based grouping** | Can't see "what's on this specific page" at a glance | Medium |
| **Identity tab non-functional** | Core feature not working | Medium |
| **No identity extraction from requests** | Missing majority of identity data | High |
| **No cookie value → identity mapping** | _ga cookie value isn't linked to GA_CID identity | Low |
| **No persistence** | Data lost on panel close/page nav | Medium |
| **No per-URL history** | Can't compare pages or track changes over time | High |
| **No localStorage/sessionStorage tracking** | Some trackers use storage instead of cookies | Low |
| **DevTools panel unused** | `panel/` folder has duplicate, outdated UI | Low |

### Potential UI/Collection Reorganizations

**Option A: URL-First Organization**
```
example.com (current page)
├── Detected Vendors
│   ├── Analytics (3)
│   ├── Marketing (1)
│   └── Intent (1)
├── Identities Found
│   ├── ECID: 12345...
│   └── GA_CID: 67890...
├── Data Sent
│   ├── Page views: 2
│   ├── Events: 5
│   └── PII captured: email
└── Cookies Set (12)
```

**Option B: Session-Based Timeline**
```
Session: 10:30 AM - 10:45 AM
├── Page 1: example.com/home
│   └── [vendor events...]
├── Page 2: example.com/products
│   └── [vendor events...]
└── Page 3: example.com/checkout
    └── [vendor events, PII detected!]
```

**Option C: Vendor-First with URL Drill-Down**
```
Google Analytics 4 (across all pages)
├── Pages tracked: 5
├── Events sent: 23
├── Identities: GA_CID, USER_ID
└── [Expand to see per-page breakdown]
```

### Identity Tab Fixes Needed

1. **Parse identities from network request bodies:**
   ```javascript
   // In handleNetworkRequest or analyzeRequestBehavior:
   if (body.includes('cid=')) {
     emit('IDENTITY_DETECTED', { type: 'GA_CID', value: extractValue(body, 'cid'), source: 'network' });
   }
   ```

2. **Parse identities from cookies:**
   ```javascript
   // In handleCookieSet:
   if (cookie.name === '_ga') {
     const gaCid = parseGaCookie(cookie.value);
     emit('IDENTITY_DETECTED', { type: 'GA_CID', value: gaCid, source: 'cookie' });
   }
   ```

3. **Retry identity detection on user interaction:**
   - Currently only runs on timers
   - Should also run when panel opens or user clicks refresh

4. **Support modern APIs:**
   - GA4: Check `gtag()` calls, not `ga.getAll()`
   - Adobe Web SDK: Check `alloy()` responses

---

## Quick Reference: Message Types

| Message | Source | Data |
|---------|--------|------|
| `VENDOR_DETECTED` | detector.js | name, key, category, detectionMethod, source, scripts[] |
| `BEHAVIORAL_VENDOR_DETECTED` | hook.js | vendor, confidence, signals[], method, url |
| `NETWORK_REQUEST` | hook.js | url, method, body, timestamp, type, behavioralSignals[], confidence |
| `COOKIE_SET` | hook.js | name, value, domain, expiry, isTracking, signals[] |
| `FINGERPRINT_DETECTED` | hook.js | type (canvas/font), method, signals[] |
| `IDENTITY_DETECTED` | hook.js | type, value, source |
| `DATALAYER_PUSH` | hook.js | layer, data[] |
| `DATALAYER_DETECTED` | hook.js | layer, data (JSON) |
| `DATALAYER_SNAPSHOT` | hook.js | layers (all data layers) |
| `CONSENT_DETECTED` | hook.js | platform, state, groups |
| `HOOK_READY` | hook.js | timestamp, version |
| `INJECT_RESULT` | hook.js | command, success, value |

---

## Files Reference

```
who-is-watching/
├── manifest.json              # MV3 extension config
├── background.js              # Service worker, message routing
├── content/
│   ├── detector.js            # Script scanning (430 lines)
│   ├── bridge.js              # postMessage relay (52 lines)
│   └── injector.js            # Injects hook.js (25 lines)
├── injected/
│   └── hook.js                # Behavioral engine (1004 lines)
├── sidepanel/
│   ├── index.html             # Side panel UI (180 lines)
│   ├── main.js                # UI logic (1070 lines)
│   └── styles.css             # Styles (CSS)
├── panel/                     # UNUSED - DevTools panel (legacy)
│   ├── devtools.html
│   ├── devtools.js
│   ├── panel.html
│   ├── panel.js
│   └── panel.css
├── lib/
│   ├── oia-design-system.css  # 864zeros design system
│   └── constants.js           # App constants (51 lines)
├── icons/                     # Extension icons
├── _locales/en/messages.json  # i18n
└── IGNORE/
    └── daily/
        └── 2026-03-10.md      # Session diary
```

---

*End of Technical Summary*
