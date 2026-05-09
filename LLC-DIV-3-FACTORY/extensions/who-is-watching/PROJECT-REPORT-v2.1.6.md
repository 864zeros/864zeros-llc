# Who Is Watching v2.1.6
## Final Project Report

**Release Date:** March 2026
**Version:** 2.1.6 FINAL
**Publisher:** 864zeros
**Platform:** Chrome Extension (Manifest V3)

---

## Executive Summary

**Who Is Watching** is a privacy intelligence extension that reveals, documents, and audits the hidden tracking ecosystem on any website. Unlike traditional ad blockers that simply block requests, Who Is Watching provides **transparency and evidence** — showing users exactly what data is being collected, by whom, and how identities are being stitched across platforms.

### The Ghostery Gap

Traditional privacy tools (Ghostery, uBlock Origin, Privacy Badger) focus on **blocking** but fail to provide:
- Evidence of what was blocked vs. what leaked through
- Identity stitching visualization (how trackers connect your profiles)
- First-party proxy detection (CNAME cloaking)
- Compliance audit reports for enterprise/legal teams
- Real-time behavioral detection of tracking patterns

**Who Is Watching closes this gap** by combining monitoring, detection, blocking verification, and professional reporting.

---

## Product Taglines

### Primary
> **"See what they see. Know what they know."**

### Secondary Options
- "Privacy isn't just blocking — it's knowing."
- "The tracking report card for every website."
- "Your browsing, their surveillance, your evidence."
- "From invisible tracking to visible truth."
- "Don't just block trackers. Expose them."

### Technical/Enterprise
- "Privacy compliance auditing for the modern web."
- "GDPR evidence collection, automated."
- "The forensic tool for digital privacy."

---

## Core Features

### 1. Timeline View (Default)
Real-time chronological feed of all tracking activity:
- Vendor detections (script-based and behavioral)
- Network requests to tracking domains
- Cookie operations (set, read, delete)
- Identity token captures
- Consent violations
- Fingerprinting attempts

**Filter options:** All | Vendors | Identity | Network | Violations

### 2. Vendor Intelligence
Expandable cards for each detected tracker showing:
- Detection method (script signature, behavioral pattern, network beacon)
- Confidence score (0-100%)
- Associated cookies with values
- Network requests made
- Behavioral signals observed

**Supported Vendors (20+):**
| Category | Vendors |
|----------|---------|
| Analytics | Adobe, Google Analytics, Mixpanel, Amplitude, Heap, Segment, Hotjar |
| Advertising | Facebook/Meta, Google Ads, LinkedIn, Twitter/X |
| Intent Data | 6sense, Demandbase, Bombora |
| Marketing | Marketo, HubSpot |
| Consent | TrustArc, OneTrust, Cookiebot |
| Performance | Akamai mPulse, Microsoft Clarity |

### 3. Identity Graph
Interactive D3.js force-directed visualization showing:
- Identity tokens (GA_CID, ECID, SEGMENT_ANON, etc.)
- Cross-vendor links (identity stitching)
- Token sources (cookie, network request, JavaScript global)

**Zoom controls:** +/- buttons and scroll wheel
**Node colors:** Vendor-specific (Adobe=red, Google=mustard, Facebook=blue)

### 4. Audit Mode (Ghostery Gap Closer)
**The differentiator.** Proves whether blocking actually works.

**Workflow:**
1. Select vendors to block from detected + common trackers list
2. Click "Start Audit" — injects declarativeNetRequest blocking rules
3. Browse normally — extension counts attempted/blocked/leaked requests
4. Click "Stop Audit" — generates compliance report

**Metrics:**
- **Attempted:** Total tracking requests observed
- **Blocked:** Requests successfully blocked by rules
- **Leaked:** Requests that bypassed blocking (first-party proxies, CNAME cloaking)
- **Block Rate:** (Blocked / Attempted) × 100%
- **Compliance Status:** COMPLIANT (≥95%), PARTIAL (70-94%), NON_COMPLIANT (<70%)

**First-Party Proxy Detection:**
Detects CNAME-cloaked tracking via subdomain patterns:
- `smetrics.*` → Adobe Analytics
- `metrics.*`, `collect.*`, `tracking.*` → Generic tracking
- Path-based detection: `/b/ss/` = Adobe, `/ccm/collect` = Google

### 5. Data Layer Inspector
Live view of:
- `window.dataLayer` (Google Tag Manager)
- `window.digitalData` (W3C Customer Experience Digital Data)
- `window.utag_data` (Tealium)
- Push events in real-time

### 6. Control Panel
Manual intervention tools:
- Spoof ECID (Adobe Experience Cloud ID)
- Block Alloy (Adobe Web SDK)
- Fake consent state
- Snapshot data layers
- Clear network log

### 7. Session Reports
Export comprehensive tracking reports:
- **HTML Format:** Styled, printable, OIA Design System
- **Markdown Format:** Text-based, version control friendly
- **JSON Format:** Machine-readable for automation

**Report Sections:**
1. Executive Summary (stats, key findings)
2. Full Timeline (chronological event log)
3. Identity Graph Snapshot (nodes and links table)
4. Vendor Deep Dive (per-vendor breakdown)

---

## Technical Architecture

### Extension Structure

```
who-is-watching/
├── manifest.json           # MV3 manifest
├── background.js           # Service worker (message routing, audit listeners)
├── content/
│   ├── detector.js         # Script signature detection
│   ├── bridge.js           # Content ↔ Background messaging
│   └── injector.js         # Hook script injection
├── injected/
│   └── hook.js             # Page context monitoring (XHR, fetch, cookies)
├── sidepanel/
│   ├── index.html          # Side panel UI
│   ├── main.js             # UI controller (1900+ lines)
│   └── styles.css          # OIA Design System styles
├── lib/
│   ├── db.js               # IndexedDB persistence
│   ├── d3.v7.min.js        # D3.js for identity graph
│   ├── batch-renderer.js   # High-performance timeline rendering
│   ├── report-generator.js # HTML/Markdown report generation
│   ├── audit-controller.js # Audit mode blocking logic
│   └── audit-report-generator.js # Audit report generation
└── _locales/en/messages.json
```

### Permissions

```json
{
  "permissions": [
    "sidePanel",           // Side panel UI
    "tabs",                // Tab URL access
    "activeTab",           // Active tab scripting
    "scripting",           // Content script injection
    "storage",             // IndexedDB/chrome.storage
    "webRequest",          // Request observation
    "declarativeNetRequest",        // Rule-based blocking
    "declarativeNetRequestFeedback" // Block confirmation events
  ],
  "host_permissions": ["<all_urls>"]
}
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PAGE CONTEXT                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ XHR/Fetch│    │ Cookies  │    │ Globals  │    │ Scripts  │      │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘      │
│       └───────────────┴───────────────┴───────────────┘            │
│                              │                                      │
│                        hook.js (injected)                           │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ postMessage
┌──────────────────────────────┼──────────────────────────────────────┐
│                        CONTENT SCRIPTS                              │
│                        bridge.js → detector.js                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ chrome.runtime.sendMessage
┌──────────────────────────────┼──────────────────────────────────────┐
│                        SERVICE WORKER                               │
│  background.js                                                      │
│  ├── Message routing                                                │
│  ├── Identity extraction (network/cookies)                          │
│  ├── onRuleMatchedDebug (audit blocked)                            │
│  ├── onBeforeRequest (audit attempted)                             │
│  └── onCompleted (audit leak check)                                │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ chrome.runtime.sendMessage
┌──────────────────────────────┼──────────────────────────────────────┐
│                         SIDE PANEL                                  │
│  main.js                                                            │
│  ├── State management                                               │
│  ├── IndexedDB persistence (db.js)                                 │
│  ├── Timeline rendering (batch-renderer.js)                        │
│  ├── Identity graph (D3.js)                                        │
│  ├── Audit mode UI                                                 │
│  └── Report export                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### IndexedDB Schema

```javascript
// Sessions store
{
  id: auto,
  domain: "example.com",
  startUrl: "https://example.com/page",
  startTime: timestamp,
  lastActivity: timestamp,
  eventCount: number
}

// Events store
{
  id: auto,
  sessionId: number,
  timestamp: timestamp,
  type: "vendor_detected" | "network_request" | "identity_detected" | ...,
  category: "vendor" | "identity" | "network" | "violation",
  ...eventData
}

// Identities store
{
  id: auto,
  sessionId: number,
  type: "GA_CID" | "ECID" | "SEGMENT_ANON" | ...,
  value: string,
  source: "cookie" | "network_request" | "javascript",
  vendor: string,
  timestamp: timestamp
}

// Links store (identity stitching)
{
  id: auto,
  sessionId: number,
  source: identityId,
  target: identityId,
  reason: "same_request" | "same_cookie" | "same_vendor",
  timestamp: timestamp
}
```

### Vendor Detection Methods

| Method | Description | Confidence |
|--------|-------------|------------|
| Script Signature | URL pattern matching (e.g., `googletagmanager.com/gtm.js`) | 100% |
| Behavioral | Network patterns, cookie operations, function calls | 60-95% |
| Cookie Analysis | Known tracking cookie names (`_ga`, `AMCV_`, `_fbp`) | 90% |
| Global Variables | `window.ga`, `window.alloy`, `window._satellite` | 95% |
| First-Party Proxy | Subdomain patterns + path analysis | 70-85% |

### Audit Mode Technical Details

**Rule Injection:**
```javascript
// declarativeNetRequest rule format
{
  id: 1000 + (vendorIndex * 100) + domainIndex,
  priority: 1,
  action: { type: 'block' },
  condition: {
    urlFilter: '||domain.com',
    resourceTypes: ['script', 'xmlhttprequest', 'image', 'sub_frame', 'ping', 'other']
  }
}
```

**Counting Mechanism:**
1. `onBeforeRequest` → Count ALL tracking requests (attempted)
2. `onRuleMatchedDebug` → Confirm blocked requests
3. `onCompleted` → Detect requests that bypassed blocking (leaks)

**First-Party Proxy Patterns:**
```javascript
const FIRST_PARTY_PROXY_PATTERNS = [
  /^smetrics\./i,   // smetrics.company.com → Adobe
  /^metrics\./i,    // metrics.company.com
  /^collect\./i,    // collect.company.com
  /^tracking\./i,   // tracking.company.com
  /^pixel\./i,      // pixel.company.com
  /^t\./i,          // t.company.com
  /^s\./i,          // s.company.com
];
```

---

## Privacy Policy

### Data Collection

**Who Is Watching does NOT:**
- Send any browsing data to external servers
- Collect personally identifiable information
- Share data with third parties
- Use analytics or tracking on itself
- Require account creation or login

**Who Is Watching DOES:**
- Store session data locally in IndexedDB (browser storage)
- Process network requests locally to identify trackers
- Generate reports that remain on your device until you export them

### Data Storage

All data is stored locally using:
- **IndexedDB:** Session history, events, identities, links
- **chrome.storage.local:** User preferences and settings

**Data Retention:**
- Sessions persist until manually cleared by the user
- "Clear All Data" and "Clear Session" options available in Settings
- Uninstalling the extension removes all stored data

### Permissions Justification

| Permission | Why It's Needed |
|------------|-----------------|
| `sidePanel` | Display the monitoring interface |
| `tabs` | Read current tab URL for session management |
| `activeTab` | Inject detection scripts into the current page |
| `scripting` | Execute content scripts for tracking detection |
| `storage` | Save session data and user preferences locally |
| `webRequest` | Observe network requests for tracker identification |
| `declarativeNetRequest` | Block tracking requests during audit mode |
| `declarativeNetRequestFeedback` | Confirm when blocking rules are applied |
| `<all_urls>` | Monitor tracking on any website you visit |

### User Rights

You have the right to:
- View all data stored by the extension (visible in the UI)
- Export your data (HTML/Markdown/JSON reports)
- Delete all data at any time (Settings → Clear All Data)
- Uninstall the extension and remove all associated data

---

## Terms of Service

### Acceptance
By installing and using Who Is Watching, you agree to these terms.

### License Grant
Who Is Watching is provided under the MIT License (see Licensing section). You may use, copy, modify, and distribute the software subject to license terms.

### Disclaimer of Warranties
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. The accuracy of tracker detection depends on known signatures and may not capture all tracking activity.

### Limitation of Liability
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY arising from the use of this software.

### Acceptable Use
You agree NOT to:
- Use the extension to circumvent security measures maliciously
- Reverse engineer the extension for malicious purposes
- Redistribute modified versions without proper attribution
- Use the extension in violation of applicable laws

### Changes to Terms
We may update these terms. Continued use after changes constitutes acceptance.

---

## Licensing

### MIT License

```
MIT License

Copyright (c) 2026 864zeros

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Third-Party Libraries

| Library | License | Usage |
|---------|---------|-------|
| D3.js v7 | ISC License | Identity graph visualization |

---

## Pricing Model

### Free Tier (Default)
**Price:** $0
**Features:**
- Full timeline monitoring
- Vendor detection (all 20+ vendors)
- Identity graph visualization
- Data layer inspection
- Control panel tools
- Session persistence
- Basic HTML/Markdown export

### Pro Tier (Future)
**Price:** $4.99/month or $49/year
**Additional Features:**
- Audit Mode (blocking verification)
- Compliance reports (PDF export)
- Extended session history (90 days)
- Cross-browser sync
- Priority support
- Enterprise vendor signatures
- Custom rule creation

### Enterprise Tier (Future)
**Price:** Contact for pricing
**Additional Features:**
- Team management dashboard
- Centralized policy enforcement
- API access for automation
- Custom integrations (SIEM, GRC)
- Dedicated support
- On-premise deployment option
- Compliance certifications (SOC 2, GDPR)

### Current Release (v2.1.6)
**All features are FREE** during the initial release period. Pro/Enterprise tiers will be introduced in a future version with grandfathering for early adopters.

---

## Chrome Web Store Listing

### Name
**Who Is Watching** — Privacy Intelligence & Audit Tool

### Short Description (132 chars max)
See every tracker, cookie, and identity token on any website. Audit your privacy protection with evidence-based compliance reports.

### Detailed Description

**Who Is Watching** reveals the hidden tracking ecosystem on every website you visit. Unlike simple ad blockers, it provides complete transparency into what data is being collected, by whom, and how your identity is being stitched across platforms.

**KEY FEATURES:**

📊 **Real-Time Timeline**
Watch tracking activity unfold in real-time. See every vendor detection, network beacon, cookie operation, and identity capture as it happens.

🔍 **20+ Vendor Detection**
Identifies major trackers including Adobe, Google Analytics, Facebook Pixel, 6sense, Marketo, HubSpot, LinkedIn, Microsoft Clarity, and more.

🕸️ **Identity Graph**
Interactive visualization showing how trackers connect your identity tokens across platforms. See the stitching in action.

🛡️ **Audit Mode**
The Ghostery Gap closer. Prove whether your blocking actually works. Select trackers to block, browse normally, then see what leaked through.

📋 **Compliance Reports**
Export professional HTML/Markdown reports documenting all tracking activity. Perfect for privacy audits, legal compliance, and research.

🔬 **First-Party Proxy Detection**
Detects CNAME cloaking and server-side tracking proxies that bypass traditional blockers.

**PRIVACY-FIRST:**
- All data stays on your device
- No external servers or accounts
- No tracking of any kind
- Open source (MIT License)

**WHO IT'S FOR:**
- Privacy-conscious individuals
- Web developers auditing their own sites
- Compliance officers verifying GDPR/CCPA
- Security researchers
- Digital marketers understanding the landscape

**TECHNICAL:**
- Manifest V3 compliant
- IndexedDB persistence
- D3.js identity visualization
- declarativeNetRequest blocking
- Zero remote dependencies

See what they see. Know what they know.

### Category
Privacy & Security

### Tags
privacy, tracking, analytics, GDPR, compliance, audit, cookies, fingerprinting, identity, surveillance

---

## Version History

### v2.1.6 (Current)
- **Fix:** Accurate request counting via `onBeforeRequest`
- **Add:** Attempted/Blocked/Leaked stats in audit UI
- **Add:** Google Ads, Demandbase, Bombora vendors
- **Add:** Expanded vendor domain coverage

### v2.1.5
- **Fix:** First-party proxy detection (CNAME cloaking)
- **Add:** `FIRST_PARTY_PROXY_PATTERNS` for subdomain detection
- **Add:** Path-based vendor identification (`/b/ss/` = Adobe)
- **Add:** Akamai mPulse vendor

### v2.1.4
- **Fix:** False positive leak detection (`t.co` matching `chatgpt.com`)
- **Add:** Proper hostname matching with `hostMatchesDomain()`
- **Add:** TrustArc vendor

### v2.1.3
- **Fix:** `onRuleMatchedDebug` listener in service worker
- **Fix:** Session end timestamp null issue
- **Add:** `webRequest` permission for leak detection

### v2.1.2
- **Fix:** `urlFilter` invalid value error
- **Fix:** Negative session duration bug
- **Change:** Vendor patterns from glob to clean domain format

### v2.1.0
- **Add:** Audit Mode (complete implementation)
- **Add:** `declarativeNetRequest` blocking rules
- **Add:** Audit report generator (HTML/JSON)
- **Add:** Mode toggle (Monitor/Audit)
- **Add:** Tracker checklist with detected + common vendors

### v2.0.0
- **Architecture:** Timeline-first redesign
- **Add:** IndexedDB persistence
- **Add:** Batch renderer for high-activity sites
- **Add:** Identity graph with D3.js
- **Add:** Session report export (HTML/Markdown)
- **Fix:** Vendor deduplication (normalization)
- **Fix:** Self-referential identity links

---

## Support & Contact

**GitHub Issues:** https://github.com/864zeros/who-is-watching/issues
**Email:** support@864zeros.com
**Website:** https://864zeros.com/who-is-watching

---

## Acknowledgments

Built with:
- [D3.js](https://d3js.org/) — Data visualization
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) — Platform
- OIA Design System — Visual design language

Inspired by the need for transparency in an increasingly surveilled web.

---

**Document Version:** 1.0
**Last Updated:** March 2026
**Author:** 864zeros Engineering

*"Privacy isn't just blocking — it's knowing."*
