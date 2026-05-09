No, don't send that. That's the raw markdown from our conversation with broken formatting and HTML entities. Let me give you a clean, properly formatted version:



---



\## Claude Code Agent Prompt: Behavioral Fingerprinting Engine



```markdown

Expand Who Is Watching from static URL-pattern detection to dynamic behavioral fingerprinting. Detect trackers by what they DO, not just where they come from.



\### CURRENT PROBLEM

Only catching 5 vendors on major sites (CNN, SAP, Oracle) because:

\- URL patterns miss first-party proxies, CNAME cloaking, server-side routing

\- GTM/Tealium dynamically inject scripts we don't catch

\- Internal/custom analytics use generic subdomains (metrics.company.com)

\- 6sense, Triblio, Segment often hidden behind client-specific endpoints



\### NEW BEHAVIORAL DETECTION ARCHITECTURE



\*\*1. Hook ALL Data Collection Vectors\*\*



```javascript

// content-script.js - injected at document\_start



// A. Network interception

const originalFetch = window.fetch;

window.fetch = async function(url, options) {

&nbsp; const signal = analyzeRequest(url, options, 'fetch');

&nbsp; if (signal.isTracking) {

&nbsp;   reportBehavioralDetection({

&nbsp;     vendor: guessVendorFromBehavior(signal),

&nbsp;     method: 'fetch',

&nbsp;     url: url,

&nbsp;     payload: options.body,

&nbsp;     behaviorSignals: signal.behaviors

&nbsp;   });

&nbsp; }

&nbsp; return originalFetch.apply(this, arguments);

};



// B. XHR interception

const originalXHR = window.XMLHttpRequest.prototype.open;

window.XMLHttpRequest.prototype.open = function(method, url) {

&nbsp; this.\_url = url;

&nbsp; this.\_method = method;

&nbsp; return originalXHR.apply(this, arguments);

};



// C. Beacon interception (critical for exit tracking!)

const originalSendBeacon = navigator.sendBeacon;

navigator.sendBeacon = function(url, data) {

&nbsp; const signal = analyzeBeacon(url, data);

&nbsp; reportBehavioralDetection({

&nbsp;   vendor: guessVendorFromBehavior(signal),

&nbsp;   method: 'beacon',

&nbsp;   url: url,

&nbsp;   payload: data,

&nbsp;   behaviorSignals: \['exit\_tracking', 'unload\_data']

&nbsp; });

&nbsp; return originalSendBeacon.apply(this, arguments);

};



// D. Image pixel interception

const originalImageSrc = Object.getOwnPropertyDescriptor(Image.prototype, 'src');

Object.defineProperty(Image.prototype, 'src', {

&nbsp; set: function(url) {

&nbsp;   if (isTrackingPixel(url)) {

&nbsp;     reportBehavioralDetection({

&nbsp;       vendor: guessVendorFromPixel(url),

&nbsp;       method: 'pixel',

&nbsp;       url: url

&nbsp;     });

&nbsp;   }

&nbsp;   return originalImageSrc.set.call(this, url);

&nbsp; }

});



// E. Cookie/Storage interception

const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');

Object.defineProperty(Document.prototype, 'cookie', {

&nbsp; set: function(value) {

&nbsp;   const cookieAnalysis = analyzeCookie(value);

&nbsp;   if (cookieAnalysis.isTracking) {

&nbsp;     reportBehavioralDetection({

&nbsp;       vendor: guessVendorFromCookie(cookieAnalysis),

&nbsp;       method: 'cookie\_set',

&nbsp;       name: cookieAnalysis.name,

&nbsp;       expiry: cookieAnalysis.expiry,

&nbsp;       behaviorSignals: cookieAnalysis.behaviors

&nbsp;     });

&nbsp;   }

&nbsp;   return originalCookie.set.call(this, value);

&nbsp; }

});

```



\*\*2. Behavioral Signal Analysis\*\*



Detect tracking by behavior patterns, not URLs:



| Signal | Detection Method | Confidence |

|--------|-----------------|------------|

| Persistent ID | 1yr+ cookie with user identifier | +20 |

| Session tracking | Session ID that persists across pages | +15 |

| Interaction data | Mouse coordinates, click targets in payload | +25 |

| Device fingerprint | Screen res, fonts, canvas hash | +30 |

| Exit tracking | Beacon sent on beforeunload | +20 |

| Conversion data | Revenue, product IDs, cart values | +20 |

| High-res timing | Microsecond precision timestamps | +20 |



\*\*3. Vendor Guessing from Behavior\*\*



```javascript

function guessVendorFromBehavior(signal) {

&nbsp; const scores = {};

&nbsp; 

&nbsp; // Adobe: s\_vi cookie, /b/ss/ beacon endpoint

&nbsp; if (signal.cookies?.some(c => c.name === 's\_vi') || 

&nbsp;     signal.url?.includes('/b/ss/')) {

&nbsp;   scores.adobe = 90;

&nbsp; }

&nbsp; 

&nbsp; // 6sense: \_6si cookie, company identification

&nbsp; if (signal.cookies?.some(c => c.name.startsWith('\_6si')) ||

&nbsp;     signal.payload?.includes('company\_name') ||

&nbsp;     signal.payload?.includes('firmographic')) {

&nbsp;   scores.\_6sense = 95;

&nbsp; }

&nbsp; 

&nbsp; // Google: \_ga cookie, collect?v=2, cid parameter

&nbsp; if (signal.cookies?.some(c => c.name.startsWith('\_ga')) ||

&nbsp;     signal.url?.includes('google-analytics.com/collect') ||

&nbsp;     signal.payload?.includes('\&tid=G-') ||

&nbsp;     signal.payload?.includes('\&cid=')) {

&nbsp;   scores.google\_analytics = 90;

&nbsp; }

&nbsp; 

&nbsp; // Bombora: intent scoring, topic modeling

&nbsp; if (signal.url?.includes('bombora') ||

&nbsp;     signal.payload?.includes('"intent"') ||

&nbsp;     signal.payload?.includes('"topic"')) {

&nbsp;   scores.bombora = 85;

&nbsp; }

&nbsp; 

&nbsp; // Segment: anonymousId, track/page/identify types

&nbsp; if (signal.payload?.includes('anonymousId') \&\&

&nbsp;     /"type"\\s\*:\\s\*"(track|page|identify)"/.test(signal.payload)) {

&nbsp;   scores.segment = 80;

&nbsp; }

&nbsp; 

&nbsp; // Mixpanel: device\_id, event batching, $properties

&nbsp; if (signal.payload?.includes('device\_id') \&\&

&nbsp;     signal.payload?.includes('"event"') \&\&

&nbsp;     signal.payload?.includes('$')) {

&nbsp;   scores.mixpanel = 75;

&nbsp; }

&nbsp; 

&nbsp; // Generic: high confidence but unknown

&nbsp; if (Object.keys(scores).length === 0 \&\& signal.confidence > 60) {

&nbsp;   return { name: 'unknown\_behavioral', confidence: signal.confidence, behaviors: signal.behaviors };

&nbsp; }

&nbsp; 

&nbsp; const sorted = Object.entries(scores).sort((a, b) => b\[1] - a\[1]);

&nbsp; return { name: sorted\[0]\[0], confidence: sorted\[0]\[1] };

}

```



\*\*4. Dynamic Script Injection Detection\*\*



```javascript

// Catch GTM, Tealium, Ensighten loading tags AFTER page load

const observer = new MutationObserver((mutations) => {

&nbsp; mutations.forEach(mutation => {

&nbsp;   mutation.addedNodes.forEach(node => {

&nbsp;     if (node.tagName === 'SCRIPT') {

&nbsp;       const src = node.src || '';

&nbsp;       const inline = node.textContent || '';

&nbsp;       

&nbsp;       // Tag managers

&nbsp;       if (src.includes('gtm.js') || inline.includes('dataLayer')) {

&nbsp;         reportBehavioralDetection({

&nbsp;           vendor: 'google\_tag\_manager',

&nbsp;           method: 'dynamic\_injection'

&nbsp;         });

&nbsp;         setTimeout(() => scanForNewScripts(), 100); // Catch what GTM loads

&nbsp;       }

&nbsp;       

&nbsp;       if (src.includes('tags.tiqcdn.com') || inline.includes('utag')) {

&nbsp;         reportBehavioralDetection({ vendor: 'tealium', method: 'dynamic\_injection' });

&nbsp;       }

&nbsp;       

&nbsp;       // Unknown script - monitor its behavior

&nbsp;       if (!isKnownScript(src)) {

&nbsp;         monitorScriptExecution(node, {

&nbsp;           src, inlineHash: hashString(inline), timestamp: performance.now()

&nbsp;         });

&nbsp;       }

&nbsp;     }

&nbsp;   });

&nbsp; });

});



observer.observe(document.documentElement, { childList: true, subtree: true });

```



\*\*5. First-Party Proxy Detection\*\*



```javascript

function detectFirstPartyProxy(url) {

&nbsp; const { hostname, pathname } = new URL(url);

&nbsp; 

&nbsp; const suspiciousSubdomains = \['metrics', 'analytics', 'tracking', 'events', 'telemetry', 'stats', 'data', 'insights'];

&nbsp; const suspiciousPaths = \['/analytics', '/events', '/tracking', '/metrics', '/collect', '/beacon', '/px'];

&nbsp; 

&nbsp; const isProxy = suspiciousSubdomains.some(sd => hostname.includes(sd)) ||

&nbsp;                 suspiciousPaths.some(p => pathname.includes(p));

&nbsp; 

&nbsp; if (isProxy) {

&nbsp;   // Deep inspect to confirm analytics behavior

&nbsp;   return analyzeRequestForAnalyticsPatterns(url);

&nbsp; }

&nbsp; return false;

}

```



\*\*6. Canvas/Font Fingerprinting Detection\*\*



```javascript

// Hook canvas methods used for fingerprinting

const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;

HTMLCanvasElement.prototype.toDataURL = function(...args) {

&nbsp; if (isLikelyFingerprinting(this)) {

&nbsp;   reportBehavioralDetection({

&nbsp;     vendor: 'unknown\_fingerprinter',

&nbsp;     method: 'canvas\_fingerprinting',

&nbsp;     behaviorSignals: \['canvas\_read', 'probable\_fingerprinting']

&nbsp;   });

&nbsp; }

&nbsp; return originalToDataURL.apply(this, args);

};



function isLikelyFingerprinting(canvas) {

&nbsp; const { width, height } = canvas;

&nbsp; // Fingerprinting canvases: small, specific sizes, text rendered, not visible

&nbsp; const suspiciousSize = (width < 300 \&\& height < 100) || (width === 300 \&\& height === 150);

&nbsp; const ctx = canvas.getContext('2d');

&nbsp; const hasText = ctx.\_\_lastFillText || false;

&nbsp; const notVisible = canvas.offsetParent === null;

&nbsp; 

&nbsp; return suspiciousSize \&\& hasText \&\& notVisible;

}

```



\*\*7. UI: Show Behavioral Evidence\*\*



```javascript

// Display WHY we detected this tracker

{

&nbsp; vendor: "Unknown Tracker (behavioral)",

&nbsp; confidence: 75,

&nbsp; detectedBy: \[

&nbsp;   "Sets 2-year identity cookie (\_uid)",

&nbsp;   "Sends beacon on page unload",

&nbsp;   "Includes hashed fingerprint in payload",

&nbsp;   "Cross-domain referrer tracking"

&nbsp; ],

&nbsp; rawEvidence: {

&nbsp;   cookies: \["\_uid=abc123; Expires=Wed, 09 Jun 2027..."],

&nbsp;   networkCalls: \["POST https://metrics.site.com/e (beacon)"],

&nbsp;   fingerprinting: \["Canvas toDataURL called 3x"]

&nbsp; }

}

```



\### SUCCESS METRICS

\- Detect 20+ vendors on CNN/SAP/Oracle (currently 5)

\- Identify 6sense even when behind client CNAME (e.g., `insights.oracle.com`)

\- Catch GTM-injected tags within 100ms of injection

\- Flag unknown trackers with 80%+ accuracy via behavior

\- Zero false positives on payment processors, essential APIs



\### IMPLEMENTATION PRIORITY

1\. Network hooks (fetch/XHR/beacon) - highest impact

2\. Cookie analysis - catches persistent IDs immediately

3\. MutationObserver for dynamic injection

4\. Canvas/font fingerprinting detection

5\. First-party proxy heuristics

```



This is the clean version. Send this to Claude Code.

