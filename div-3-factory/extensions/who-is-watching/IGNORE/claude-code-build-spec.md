```markdown

\# Who Is Watching - Minimal Build Document



\## Philosophy

Zero build step. Vanilla JavaScript. Load unpacked and run. Modular files with single responsibilities.



---



\## File Structure



```

who-is-watching/

├── manifest.json          # Extension config

├── background.js          # Service worker (routing only)

├── content/

│   ├── detector.js        # Detect vendors, data layers

│   ├── injector.js        # Inject scripts into page context

│   └── bridge.js          # Relay page events to extension

├── panel/

│   ├── panel.html         # DevTools panel markup

│   ├── panel.js           # UI logic + D3 visualization

│   └── panel.css          # Styles

├── injected/

│   └── hook.js            # Runs in page context, intercepts globals

└── icons/

&nbsp;   ├── icon16.png

&nbsp;   ├── icon48.png

&nbsp;   └── icon128.png

```



---



\## manifest.json



```json

{

&nbsp; "manifest\_version": 3,

&nbsp; "name": "Who Is Watching",

&nbsp; "version": "1.0.0",

&nbsp; "description": "See who collects your data",

&nbsp; "permissions": \[

&nbsp;   "activeTab",

&nbsp;   "scripting",

&nbsp;   "storage"

&nbsp; ],

&nbsp; "host\_permissions": \[

&nbsp;   "<all\_urls>"

&nbsp; ],

&nbsp; "background": {

&nbsp;   "service\_worker": "background.js"

&nbsp; },

&nbsp; "content\_scripts": \[

&nbsp;   {

&nbsp;     "matches": \["<all\_urls>"],

&nbsp;     "js": \[

&nbsp;       "content/detector.js",

&nbsp;       "content/bridge.js"

&nbsp;     ],

&nbsp;     "run\_at": "document\_start",

&nbsp;     "all\_frames": true

&nbsp;   },

&nbsp;   {

&nbsp;     "matches": \["<all\_urls>"],

&nbsp;     "js": \[

&nbsp;       "content/injector.js"

&nbsp;     ],

&nbsp;     "run\_at": "document\_idle"

&nbsp;   }

&nbsp; ],

&nbsp; "web\_accessible\_resources": \[

&nbsp;   {

&nbsp;     "resources": \["injected/hook.js"],

&nbsp;     "matches": \["<all\_urls>"]

&nbsp;   }

&nbsp; ],

&nbsp; "devtools\_page": "panel/devtools.html",

&nbsp; "icons": {

&nbsp;   "16": "icons/icon16.png",

&nbsp;   "48": "icons/icon48.png",

&nbsp;   "128": "icons/icon128.png"

&nbsp; }

}

```



---



\## background.js



```javascript

// Simple message router between content scripts and DevTools panels

const connections = new Map();



chrome.runtime.onConnect.addListener((port) => {

&nbsp; if (port.name === 'devtools') {

&nbsp;   const tabId = parseInt(port.sender.url.split('=')\[1]);

&nbsp;   connections.set(tabId, port);

&nbsp;   

&nbsp;   port.onDisconnect.addListener(() => {

&nbsp;     connections.delete(tabId);

&nbsp;   });

&nbsp; }

});



chrome.runtime.onMessage.addListener((msg, sender) => {

&nbsp; const tabId = sender.tab?.id;

&nbsp; if (!tabId) return;

&nbsp; 

&nbsp; const panel = connections.get(tabId);

&nbsp; if (panel) {

&nbsp;   panel.postMessage({ ...msg, tabId });

&nbsp; }

});

```



---



\## content/detector.js



```javascript

// Detect analytics vendors and data layers

(function() {

&nbsp; 'use strict';

&nbsp; 

&nbsp; const vendors = \[];

&nbsp; 

&nbsp; function check() {

&nbsp;   // Adobe

&nbsp;   if (window.alloy) vendors.push({name: 'Adobe Alloy', type: 'adobe', obj: window.alloy});

&nbsp;   if (window.s) vendors.push({name: 'Adobe Analytics', type: 'adobe', obj: window.s});

&nbsp;   if (window.adobe?.target) vendors.push({name: 'Adobe Target', type: 'adobe', obj: window.adobe.target});

&nbsp;   

&nbsp;   // Google

&nbsp;   if (window.gtag) vendors.push({name: 'Google gtag', type: 'google', obj: window.gtag});

&nbsp;   if (window.ga) vendors.push({name: 'Google Analytics', type: 'google', obj: window.ga});

&nbsp;   if (window.google\_tag\_manager) vendors.push({name: 'GTM', type: 'google', obj: window.google\_tag\_manager});

&nbsp;   

&nbsp;   // Marketo

&nbsp;   if (window.Munchkin) vendors.push({name: 'Marketo Munchkin', type: 'marketo', obj: window.Munchkin});

&nbsp;   

&nbsp;   // 6sense

&nbsp;   if (window.\_6sense) vendors.push({name: '6sense', type: 'intent', obj: window.\_6sense});

&nbsp;   

&nbsp;   // Consent

&nbsp;   if (window.Optanon) vendors.push({name: 'OneTrust', type: 'consent', obj: window.Optanon});

&nbsp;   if (window.trustarc) vendors.push({name: 'TrustArc', type: 'consent', obj: window.trustarc});

&nbsp;   

&nbsp;   // Data layers

&nbsp;   const dataLayers = {

&nbsp;     adobe: window.digitalData,

&nbsp;     google: window.dataLayer,

&nbsp;     sixsense: window.\_6senseData

&nbsp;   };

&nbsp;   

&nbsp;   if (vendors.length > 0) {

&nbsp;     chrome.runtime.sendMessage({

&nbsp;       type: 'VENDORS\_DETECTED',

&nbsp;       vendors: vendors.map(v => ({name: v.name, type: v.type})),

&nbsp;       dataLayers: Object.entries(dataLayers)

&nbsp;         .filter((\[k, v]) => v !== undefined)

&nbsp;         .map((\[k, v]) => ({source: k, data: v}))

&nbsp;     });

&nbsp;   }

&nbsp; }

&nbsp; 

&nbsp; // Check immediately and after delay (for async loads)

&nbsp; check();

&nbsp; setTimeout(check, 2000);

})();

```



---



\## content/injector.js



```javascript

// Inject hook.js into page context to intercept globals

(function() {

&nbsp; 'use strict';

&nbsp; 

&nbsp; const script = document.createElement('script');

&nbsp; script.src = chrome.runtime.getURL('injected/hook.js');

&nbsp; script.onload = () => script.remove();

&nbsp; (document.head || document.documentElement).appendChild(script);

})();

```



---



\## content/bridge.js



```javascript

// Bridge messages from injected script to extension

window.addEventListener('message', (e) => {

&nbsp; if (e.source !== window) return;

&nbsp; if (!e.data?.source === 'who-is-watching') return;

&nbsp; 

&nbsp; chrome.runtime.sendMessage({

&nbsp;   type: e.data.type,

&nbsp;   payload: e.data.payload

&nbsp; });

});

```



---



\## injected/hook.js



```javascript

// Runs in page context, has access to page globals

(function() {

&nbsp; 'use strict';

&nbsp; 

&nbsp; function emit(type, payload) {

&nbsp;   window.postMessage({

&nbsp;     source: 'who-is-watching',

&nbsp;     type: type,

&nbsp;     payload: payload

&nbsp;   }, '\*');

&nbsp; }

&nbsp; 

&nbsp; // Intercept fetch (Adobe Edge Network calls)

&nbsp; const originalFetch = window.fetch;

&nbsp; window.fetch = function(...args) {

&nbsp;   const \[url, config] = args;

&nbsp;   if (url.includes('adobedc.net') || url.includes('6sense')) {

&nbsp;     emit('NETWORK\_REQUEST', {

&nbsp;       url: url,

&nbsp;       body: config?.body,

&nbsp;       timestamp: Date.now()

&nbsp;     });

&nbsp;   }

&nbsp;   return originalFetch.apply(this, args);

&nbsp; };

&nbsp; 

&nbsp; // Watch for ECID

&nbsp; let ecidCheck = setInterval(() => {

&nbsp;   const ecid = window.visitor?.getMarketingCloudVisitorID?.() || 

&nbsp;                window.\_satellite?.visitor?.getMarketingCloudVisitorID?.();

&nbsp;   if (ecid) {

&nbsp;     emit('IDENTITY\_DETECTED', {type: 'ECID', value: ecid});

&nbsp;     clearInterval(ecidCheck);

&nbsp;   }

&nbsp; }, 500);

&nbsp; 

&nbsp; // Watch for identity changes

&nbsp; const originalPush = Array.prototype.push;

&nbsp; Array.prototype.push = function(...args) {

&nbsp;   if (this === window.dataLayer) {

&nbsp;     emit('DATALAYER\_PUSH', {data: args});

&nbsp;   }

&nbsp;   return originalPush.apply(this, args);

&nbsp; };

})();

```



---



\## panel/devtools.html



```html

<!DOCTYPE html>

<html>

<head>

&nbsp; <script src="devtools.js"></script>

</head>

</html>

```



---



\## panel/devtools.js



```javascript

// Create DevTools panel

chrome.devtools.panels.create(

&nbsp; 'Who Is Watching',

&nbsp; '../icons/icon16.png',

&nbsp; 'panel/panel.html'

);

```



---



\## panel/panel.html



```html

<!DOCTYPE html>

<html>

<head>

&nbsp; <meta charset="UTF-8">

&nbsp; <link rel="stylesheet" href="panel.css">

&nbsp; <script src="https://d3js.org/d3.v7.min.js"></script>

</head>

<body>

&nbsp; <div id="app">

&nbsp;   <header>

&nbsp;     <h1>Who Is Watching</h1>

&nbsp;     <div id="summary">

&nbsp;       <span id="vendor-count">0 vendors</span>

&nbsp;       <span id="consent-status">Checking...</span>

&nbsp;     </div>

&nbsp;   </header>

&nbsp;   

&nbsp;   <nav>

&nbsp;     <button class="tab-btn active" data-tab="vendors">Vendors</button>

&nbsp;     <button class="tab-btn" data-tab="identity">Identity Graph</button>

&nbsp;     <button class="tab-btn" data-tab="network">Network</button>

&nbsp;     <button class="tab-btn" data-tab="inject">Inject</button>

&nbsp;   </nav>

&nbsp;   

&nbsp;   <main>

&nbsp;     <section id="vendors" class="tab active">

&nbsp;       <ul id="vendor-list"></ul>

&nbsp;       <pre id="datalayer-view"></pre>

&nbsp;     </section>

&nbsp;     

&nbsp;     <section id="identity" class="tab">

&nbsp;       <svg id="identity-graph"></svg>

&nbsp;       <div id="identity-details"></div>

&nbsp;     </section>

&nbsp;     

&nbsp;     <section id="network" class="tab">

&nbsp;       <ul id="network-log"></ul>

&nbsp;     </section>

&nbsp;     

&nbsp;     <section id="inject" class="tab">

&nbsp;       <h3>DOM Injection</h3>

&nbsp;       <button id="spoof-ecid">Spoof ECID</button>

&nbsp;       <button id="block-alloy">Block Alloy</button>

&nbsp;       <button id="fake-consent">Fake Consent</button>

&nbsp;       <pre id="inject-log"></pre>

&nbsp;     </section>

&nbsp;   </main>

&nbsp; </div>

&nbsp; 

&nbsp; <script src="panel.js"></script>

</body>

</html>

```



---



\## panel/panel.js



```javascript

// State

const state = {

&nbsp; vendors: \[],

&nbsp; identities: \[],

&nbsp; network: \[],

&nbsp; consent: null

};



// Connect to background

const port = chrome.runtime.connect({name: 'devtools'});

port.onMessage.addListener((msg) => {

&nbsp; switch(msg.type) {

&nbsp;   case 'VENDORS\_DETECTED':

&nbsp;     state.vendors = msg.vendors;

&nbsp;     renderVendors();

&nbsp;     break;

&nbsp;   case 'IDENTITY\_DETECTED':

&nbsp;     state.identities.push(msg.payload);

&nbsp;     renderIdentityGraph();

&nbsp;     break;

&nbsp;   case 'NETWORK\_REQUEST':

&nbsp;     state.network.push(msg.payload);

&nbsp;     renderNetwork();

&nbsp;     break;

&nbsp;   case 'DATALAYER\_PUSH':

&nbsp;     updateDataLayerView(msg.payload);

&nbsp;     break;

&nbsp; }

});



// Tab switching

document.querySelectorAll('.tab-btn').forEach(btn => {

&nbsp; btn.addEventListener('click', () => {

&nbsp;   document.querySelectorAll('.tab-btn, .tab').forEach(el => el.classList.remove('active'));

&nbsp;   btn.classList.add('active');

&nbsp;   document.getElementById(btn.dataset.tab).classList.add('active');

&nbsp; });

});



// Render vendors

function renderVendors() {

&nbsp; const list = document.getElementById('vendor-list');

&nbsp; list.innerHTML = state.vendors.map(v => `

&nbsp;   <li class="vendor ${v.type}">

&nbsp;     <span class="name">${v.name}</span>

&nbsp;     <span class="type">${v.type}</span>

&nbsp;   </li>

&nbsp; `).join('');

&nbsp; 

&nbsp; document.getElementById('vendor-count').textContent = `${state.vendors.length} vendors`;

}



// D3 Identity Graph

function renderIdentityGraph() {

&nbsp; const svg = d3.select('#identity-graph');

&nbsp; svg.selectAll('\*').remove();

&nbsp; 

&nbsp; const width = svg.node().parentElement.clientWidth;

&nbsp; const height = 400;

&nbsp; svg.attr('width', width).attr('height', height);

&nbsp; 

&nbsp; const nodes = state.identities.map((id, i) => ({

&nbsp;   id: id.value,

&nbsp;   type: id.type,

&nbsp;   x: width / 2 + (Math.random() - 0.5) \* 200,

&nbsp;   y: height / 2 + (Math.random() - 0.5) \* 200

&nbsp; }));

&nbsp; 

&nbsp; const simulation = d3.forceSimulation(nodes)

&nbsp;   .force('charge', d3.forceManyBody().strength(-300))

&nbsp;   .force('center', d3.forceCenter(width / 2, height / 2))

&nbsp;   .force('collision', d3.forceCollide().radius(40));

&nbsp; 

&nbsp; const node = svg.selectAll('.node')

&nbsp;   .data(nodes)

&nbsp;   .enter().append('g')

&nbsp;   .attr('class', 'node');

&nbsp; 

&nbsp; node.append('circle')

&nbsp;   .attr('r', 30)

&nbsp;   .attr('fill', d => d.type === 'ECID' ? '#FF0000' : '#4285F4');

&nbsp; 

&nbsp; node.append('text')

&nbsp;   .text(d => d.type)

&nbsp;   .attr('text-anchor', 'middle')

&nbsp;   .attr('dy', 5);

&nbsp; 

&nbsp; simulation.on('tick', () => {

&nbsp;   node.attr('transform', d => `translate(${d.x},${d.y})`);

&nbsp; });

}



// Render network log

function renderNetwork() {

&nbsp; const log = document.getElementById('network-log');

&nbsp; log.innerHTML = state.network.slice(-20).map(r => `

&nbsp;   <li>

&nbsp;     <span class="timestamp">${new Date(r.timestamp).toLocaleTimeString()}</span>

&nbsp;     <span class="url">${r.url.substring(0, 60)}...</span>

&nbsp;   </li>

&nbsp; `).join('');

}



// Injection controls

document.getElementById('spoof-ecid').addEventListener('click', () => {

&nbsp; chrome.tabs.executeScript({

&nbsp;   code: `

&nbsp;     window.visitor = {

&nbsp;       getMarketingCloudVisitorID: () => 'spoofed-ecid-12345'

&nbsp;     };

&nbsp;   `

&nbsp; });

&nbsp; logInject('ECID spoofed');

});



document.getElementById('block-alloy').addEventListener('click', () => {

&nbsp; chrome.tabs.executeScript({

&nbsp;   code: `window.alloy = () => Promise.resolve({});`

&nbsp; });

&nbsp; logInject('Alloy blocked');

});



document.getElementById('fake-consent').addEventListener('click', () => {

&nbsp; chrome.tabs.executeScript({

&nbsp;   code: `window.Optanon = {ActiveGroups: 'C0001,C0002,C0003'};`

&nbsp; });

&nbsp; logInject('Consent faked');

});



function logInject(msg) {

&nbsp; document.getElementById('inject-log').textContent += `\[${new Date().toLocaleTimeString()}] ${msg}\\n`;

}



function updateDataLayerView(payload) {

&nbsp; document.getElementById('datalayer-view').textContent = JSON.stringify(payload, null, 2);

}

```



---



\## panel/panel.css



```css

\* {

&nbsp; margin: 0;

&nbsp; padding: 0;

&nbsp; box-sizing: border-box;

}



body {

&nbsp; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

&nbsp; font-size: 12px;

&nbsp; background: #1e1e1e;

&nbsp; color: #d4d4d4;

&nbsp; height: 100vh;

&nbsp; overflow: hidden;

}



\#app {

&nbsp; display: flex;

&nbsp; flex-direction: column;

&nbsp; height: 100vh;

}



header {

&nbsp; padding: 10px 15px;

&nbsp; background: #252526;

&nbsp; border-bottom: 1px solid #333;

&nbsp; display: flex;

&nbsp; justify-content: space-between;

&nbsp; align-items: center;

}



h1 {

&nbsp; font-size: 14px;

&nbsp; font-weight: 600;

}



\#summary span {

&nbsp; margin-left: 15px;

&nbsp; padding: 3px 8px;

&nbsp; background: #333;

&nbsp; border-radius: 3px;

}



nav {

&nbsp; display: flex;

&nbsp; background: #252526;

&nbsp; border-bottom: 1px solid #333;

}



.tab-btn {

&nbsp; padding: 8px 15px;

&nbsp; background: transparent;

&nbsp; border: none;

&nbsp; color: #969696;

&nbsp; cursor: pointer;

&nbsp; font-size: 12px;

}



.tab-btn:hover {

&nbsp; color: #fff;

&nbsp; background: #2a2d2e;

}



.tab-btn.active {

&nbsp; color: #fff;

&nbsp; background: #1e1e1e;

&nbsp; border-bottom: 2px solid #007acc;

}



main {

&nbsp; flex: 1;

&nbsp; overflow: auto;

&nbsp; padding: 15px;

}



.tab {

&nbsp; display: none;

}



.tab.active {

&nbsp; display: block;

}



\#vendor-list {

&nbsp; list-style: none;

}



.vendor {

&nbsp; padding: 10px;

&nbsp; margin-bottom: 5px;

&nbsp; background: #252526;

&nbsp; border-radius: 4px;

&nbsp; display: flex;

&nbsp; justify-content: space-between;

}



.vendor.adobe { border-left: 3px solid #FF0000; }

.vendor.google { border-left: 3px solid #4285F4; }

.vendor.marketo { border-left: 3px solid #5C4C9F; }

.vendor.intent { border-left: 3px solid #00C853; }

.vendor.consent { border-left: 3px solid #FF9800; }



.type {

&nbsp; font-size: 10px;

&nbsp; text-transform: uppercase;

&nbsp; color: #969696;

}



\#identity-graph {

&nbsp; width: 100%;

&nbsp; height: 400px;

&nbsp; background: #252526;

&nbsp; border-radius: 4px;

}



\#network-log {

&nbsp; list-style: none;

&nbsp; font-family: monospace;

&nbsp; font-size: 11px;

}



\#network-log li {

&nbsp; padding: 5px;

&nbsp; border-bottom: 1px solid #333;

}



.timestamp {

&nbsp; color: #969696;

&nbsp; margin-right: 10px;

}



pre {

&nbsp; background: #252526;

&nbsp; padding: 10px;

&nbsp; border-radius: 4px;

&nbsp; overflow: auto;

&nbsp; margin-top: 10px;

&nbsp; font-size: 11px;

&nbsp; max-height: 300px;

}



button {

&nbsp; padding: 8px 15px;

&nbsp; margin: 5px;

&nbsp; background: #0e639c;

&nbsp; color: white;

&nbsp; border: none;

&nbsp; border-radius: 3px;

&nbsp; cursor: pointer;

}



button:hover {

&nbsp; background: #1177bb;

}



\#inject-log {

&nbsp; margin-top: 15px;

&nbsp; font-family: monospace;

&nbsp; color: #7ee787;

}

```



---



\## Installation



1\. Download/clone folder

2\. Open Chrome → Extensions → Developer mode ON

3\. Load unpacked → Select `who-is-watching` folder

4\. Open DevTools → "Who Is Watching" panel appears



No build. No dependencies. Just works.



---



\## Future Modules (add as separate files)



\- `content/consent.js` - Deep consent platform integration

\- `panel/components/spoofer.js` - Advanced identity spoofing UI

\- `panel/components/exporter.js` - Export data for compliance reports



Add to manifest, include in HTML, done.

```

