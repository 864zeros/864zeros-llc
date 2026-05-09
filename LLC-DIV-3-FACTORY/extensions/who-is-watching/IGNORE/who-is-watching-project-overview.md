```markdown

https://www.kimi.com/chat/19cd5565-1dd2-835e-8000-090ddb132d22



\# Who Is Watching



Chrome DevTools extension exposing analytics vendors, identity resolution, and consent violations. Zero build step. Vanilla JS.



\## What It Does

\- \*\*Detects\*\*: Adobe (Alloy, Analytics, Target, Launch), Google (gtag, GTM, GA4), Marketo (Munchkin), 6sense, Bombora, TrustArc, OneTrust, Cookiebot

\- \*\*Shows\*\*: Live data collection, identity graph visualization (ECID/CUID stitching), network beacons, consent state correlation

\- \*\*Controls\*\*: Spoof identities, block requests, fake consent states, inject XDM payloads



\## File Structure

```

who-is-watching/

├── manifest.json          # Extension config

├── background.js          # Message router between content and panel

├── content/               # Content scripts (isolated world)

│   ├── detector.js        # Detect vendors and data layers

│   ├── injector.js        # Inject hook.js into page context

│   └── bridge.js          # Relay messages from page to extension

├── panel/                 # DevTools panel UI

│   ├── devtools.html      # DevTools extension entry

│   ├── devtools.js        # Create "Who Is Watching" panel

│   ├── panel.html         # UI markup

│   ├── panel.js           # UI logic + D3 visualization

│   └── panel.css          # Styles

├── injected/              # Scripts running in page context

│   └── hook.js            # Intercept globals, network, identity

└── icons/                 # Extension icons

&nbsp;   ├── icon16.png

&nbsp;   ├── icon48.png

&nbsp;   └── icon128.png

```



\## Core Features



| Feature | Implementation |

|---------|---------------|

| Vendor Detection | Scan `window` objects, script `src` attributes, network patterns |

| Data Layer Inspection | Read `digitalData`, `dataLayer`, `\_6senseData` objects |

| Identity Graph | D3.js force-directed graph showing ECID, CUID, email, CRM ID nodes and stitch relationships |

| Network Interception | Override `fetch()` and `XMLHttpRequest` to capture Adobe Edge, 6sense, GA4 beacons |

| DOM Injection | Content script injects `hook.js` via `web\_accessible\_resources` |

| Consent Monitoring | Watch `Optanon`, `trustarc`, `Cookiebot` objects and correlate with tracking events |

| Identity Spoofing | Override `visitor.getMarketingCloudVisitorID()`, fake ECIDs/CUIDs |

| Request Blocking | Nullify `window.alloy`, intercept fetch to block specific endpoints |



\## Architecture



```

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐

│   DevTools      │────▶│  background.js   │◀────│  content/       │

│   Panel (UI)    │     │  (message router)│     │  detector.js    │

└─────────────────┘     └──────────────────┘     │  bridge.js      │

&nbsp;        ▲                      │                │  injector.js    │

&nbsp;        │                      ▼                └─────────────────┘

&nbsp;        │               ┌──────────────────┐              │

&nbsp;        └───────────────│   injected/      │◀─────────────┘

&nbsp;                        │   hook.js        │

&nbsp;                        │   (page context) │

&nbsp;                        └──────────────────┘

&nbsp;                                 │

&nbsp;                        ┌────────┴─────────┐

&nbsp;                        ▼                  ▼

&nbsp;                  ┌──────────┐      ┌──────────┐

&nbsp;                  │  Page    │      │  Vendor  │

&nbsp;                  │  Globals │      │  Scripts │

&nbsp;                  └──────────┘      └──────────┘

```



\## Load \& Run



1\. Download/unzip extension folder

2\. Chrome → Extensions → Developer mode ON

3\. Load unpacked → Select `who-is-watching` folder

4\. Open DevTools on any page → "Who Is Watching" panel appears



No build step. No npm install. Edit files, reload extension, see changes immediately.



\## Adding Features



Add detection for new vendor:

```javascript

// content/detector.js

if (window.newVendor) vendors.push({name: 'New Vendor', type: 'intent'});

```



Add injection capability:

```javascript

// injected/hook.js

window.newOverride = function() { /\* ... \*/ };

emit('NEW\_EVENT', payload);

```



Add UI tab:

```html

<!-- panel/panel.html -->

<button class="tab-btn" data-tab="newtab">New Tab</button>

<section id="newtab" class="tab">...</section>

```



\## Roadmap



\- \[ ] XDM payload prettification and validation

\- \[ ] AJO journey step visualization

\- \[ ] Real-time edge segmentation qualification

\- \[ ] Export compliance violation reports

\- \[ ] Team workspace sharing (enterprise)

\- \[ ] Firefox/Safari port



\## License



MIT

```

