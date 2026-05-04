# Who Is Watching

> **"See what they see. Know what they know."**

A Chrome extension that reveals, documents, and audits the hidden tracking ecosystem on any website. Unlike traditional ad blockers that simply block, Who Is Watching provides **transparency and evidence**.

![Version](https://img.shields.io/badge/version-2.1.6-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![License](https://img.shields.io/badge/license-MIT-brightgreen)

---

## Features

### Timeline View
Real-time chronological feed of all tracking activity:
- Vendor detections (script-based and behavioral)
- Network requests to tracking domains
- Cookie operations
- Identity token captures
- Fingerprinting attempts

**Filters:** All | Vendors | Identity | Network | Violations

### Vendor Intelligence
Expandable cards for each detected tracker showing:
- Detection method and confidence score
- Associated cookies with values
- Network requests made
- Behavioral signals observed

**20+ Vendors Supported:**
| Category | Vendors |
|----------|---------|
| Analytics | Adobe, Google Analytics, Mixpanel, Amplitude, Heap, Segment, Hotjar |
| Advertising | Facebook/Meta, Google Ads, LinkedIn, Twitter/X |
| Intent Data | 6sense, Demandbase, Bombora |
| Marketing | Marketo, HubSpot |
| Consent | TrustArc, OneTrust, Cookiebot |
| Performance | Akamai mPulse, Microsoft Clarity |

### Identity Graph
Interactive D3.js force-directed visualization showing:
- Identity tokens (GA_CID, ECID, SEGMENT_ANON, etc.)
- Cross-vendor identity stitching links
- Token sources (cookie, network, JavaScript)

### Audit Mode
**The Ghostery Gap closer.** Proves whether blocking actually works.

1. Select vendors to block from detected list
2. Start Audit → injects declarativeNetRequest rules
3. Browse normally → counts attempted/blocked/leaked
4. Stop Audit → generates compliance report

**Metrics:**
- **Attempted:** Total tracking requests observed
- **Blocked:** Successfully blocked by rules
- **Leaked:** Bypassed blocking (first-party proxies, CNAME cloaking)
- **Block Rate:** Compliance percentage

### Session Reports
Export comprehensive tracking reports:
- **HTML:** Styled, printable, dark theme
- **Markdown:** Text-based, version control friendly

---

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation (Developer Mode)
1. Clone or download this repository
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `who-is-watching` folder
6. Click the extension icon to open the side panel

---

## Project Structure

```
who-is-watching/
├── manifest.json           # MV3 manifest
├── background.js           # Service worker
├── content/
│   ├── detector.js         # Script signature detection
│   ├── bridge.js           # Content ↔ Background messaging
│   └── injector.js         # Hook script injection
├── injected/
│   └── hook.js             # Page context monitoring
├── sidepanel/
│   ├── index.html          # Side panel UI
│   ├── main.js             # UI controller
│   └── styles.css          # OIA Design System
├── lib/
│   ├── db.js               # IndexedDB persistence
│   ├── d3.v7.min.js        # Identity graph visualization
│   ├── batch-renderer.js   # High-performance rendering
│   ├── report-generator.js # HTML/Markdown reports
│   ├── audit-controller.js # Audit mode logic
│   └── audit-report-generator.js
└── icons/
```

---

## Privacy

**Who Is Watching does NOT:**
- Send any browsing data to external servers
- Collect personally identifiable information
- Share data with third parties
- Require account creation

**Who Is Watching DOES:**
- Store session data locally in IndexedDB
- Process network requests locally
- Generate reports that stay on your device

All data is stored locally and deleted when you uninstall.

---

## Permissions

| Permission | Why It's Needed |
|------------|-----------------|
| `sidePanel` | Display the monitoring interface |
| `tabs` | Read current tab URL for session management |
| `activeTab` | Inject detection scripts |
| `scripting` | Execute content scripts |
| `storage` | Save session data locally |
| `webRequest` | Observe network requests |
| `declarativeNetRequest` | Block trackers during audit |
| `declarativeNetRequestFeedback` | Confirm blocking |
| `<all_urls>` | Monitor tracking on any website |

---

## Development

### Requirements
- Chrome 88+ (Manifest V3 support)
- No build process required (vanilla JS)

### Local Development
1. Make changes to source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Reload the target page

### Testing
Visit high-tracking sites like:
- cnn.com (50+ trackers)
- sap.com (Adobe + 6sense)
- oracle.com (extensive first-party tracking)

---

## Version History

### v2.1.6 (Current)
- Accurate request counting via `onBeforeRequest`
- Attempted/Blocked/Leaked stats in audit UI
- Google Ads, Demandbase, Bombora vendors
- Expanded vendor domain coverage

### v2.1.5
- First-party proxy detection (CNAME cloaking)
- Path-based vendor identification

### v2.1.4
- Fixed false positive leak detection
- Proper hostname matching

### v2.1.0
- Complete Audit Mode implementation
- declarativeNetRequest blocking

### v2.0.0
- Timeline-first architecture
- IndexedDB persistence
- Identity graph visualization
- Session report export

---

## License

MIT License - See [LICENSE](LICENSE) for details.

```
Copyright (c) 2026 864zeros

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## Support

- **Issues:** [GitHub Issues](https://github.com/864zeros/who-is-watching/issues)
- **Email:** support@864zeros.com

---

**864zeros** — *Privacy isn't just blocking — it's knowing.*
