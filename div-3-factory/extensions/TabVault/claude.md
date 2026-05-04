\*\*\*



\### `claude.md`



```markdown

\# 🦅 TabVault Extension: Autonomous Build Specification (864z KISS)



\## 1. Project Overview \& Philosophy

\*   \*\*Project Name:\*\* TabVault (Chrome Extension)

\*   \*\*Goal:\*\* A high-reliability, low-resource replacement for OneTab, focusing on data safety and memory efficiency.

\*   \*\*Target Incumbent:\*\* OneTab (Exploiting 'Trust Gap', 'Sync Gap', 'Context Gap').

\*   \*\*Development Philosophy (KISS):\*\* Keep It Simple, Stupid. Focus exclusively on persistent tab storage and native memory discarding. Use Vanilla JS, HTML, and CSS.

\*   \*\*Architecture:\*\* Manifest V3, Modular Side Panel (UI), Service Worker (Central Logic).

\*   \*\*T-Shirt Size / Complexity:\*\* M / 4/10



\## 2. Core Technical Specifications



\### 2.1 Manifest V3 (`manifest.json`)

The manifest must declare V3 compatibility and request all necessary permissions for data persistence and tab management.



```json

{

&nbsp; "manifest\_version": 3,

&nbsp; "name": "TabVault (864z)",

&nbsp; "version": "1.0",

&nbsp; "description": "Deep Sleep for your tabs: Securely vaults tab data and kills background processes.",

&nbsp; "action": {

&nbsp;   "default\_title": "TabVault Quick Actions"

&nbsp; },

&nbsp; "side\_panel": {

&nbsp;   "default\_path": "sidepanel.html"

&nbsp; },

&nbsp; "background": {

&nbsp;   "service\_worker": "background.js"

&nbsp; },

&nbsp; "permissions": \[

&nbsp;   "tabs",

&nbsp;   "storage",

&nbsp;   "scripting",

&nbsp;   "sidePanel" 

&nbsp; ],

&nbsp; "options\_ui": {

&nbsp;   "page": "options.html",

&nbsp;   "open\_in\_tab": false

&nbsp; }

}

2.2 Vault Persistence Engine (vault\_engine.js)



This module handles all data mirroring and retrieval. It must adhere to the V2 schema for reliability.

Technology: IndexedDB (Version 2 Schema)

Function: Mirror tab metadata (URL, Title, Favicon, WindowID, ScrollPosition) in real-time.

Methods Required:

initVault(): Opens/initializes the IndexedDB with the V2 schema.

mirrorTab(tabId, tabData): Stores/updates a single tab's metadata.

getVaultContents(): Retrieves all stored tab data.

deleteTab(tabId): Removes a tab entry from the vault.

2.3 Service Worker (background.js)



The central logic hub. It orchestrates the 'Deep Sleep' and persistence features.

Primary Functions:

Tab State Mirroring: Listen for

chrome.tabs.onUpdated

&nbsp;events to mirror the current tab's state to the IndexedDB vault (via

vault\_engine.js

&nbsp;).

Native Deep Sleep Implementation:

Implement a timer or interval logic to track the inactivity of all open tabs.

For any tab inactive for >20 minutes, execute the native tab discarding API:

chrome.tabs.discard(tabId)

&nbsp;. This keeps the tab visible but reduces RAM usage by ~95%.

Setup Side Panel: Listen for the Service Worker lifecycle events to correctly set up the side panel.

2.4 User Interface (Side Panel \& Options)



The UI must be split into a quick-action Side Panel and a more detailed Options page.

Side Panel (sidepanel.html / sidepanel.js):

Focus: Quick tab capture and viewing of the vault's state.

Options Page (options.html / options.js):

Focus: Detailed management, settings, and the required 'OneTab Bridge'.

Core Feature: Implement the OneTab Bridge Utility to import legacy OneTab text exports directly into the TabVault's IndexedDB engine.



