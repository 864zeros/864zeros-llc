🛠 Chrome Extension Architectural Specification (2026)
Standard: Manifest V3 (MV3)

Philosophy: Modular "Single Responsibility" design, State-driven UI, and Service Worker relay.

🏗 Template 1: Panel Extension (Persistent Dashboard)
Use Case: Ideal for tools that require a sidebar companion to remain open while the user navigates between various tabs or sites.

📁 Directory Structure
Plaintext
project-panel-root/
├── manifest.json              # MUST include "sidePanel" & "storage" permissions
├── _locales/en/messages.json  # i18n support
├── assets/                    # Icons (16, 48, 128) & Branding assets
├── background/                # THE BRAINS (Service Worker)
│   └── service_worker.js      # Handles sidePanel behavior & cross-script relay
├── sidepanel/                 # THE UI (Persistent View)
│   ├── index.html             # Main panel skeleton
│   ├── main.js                # UI logic & chrome.storage listeners
│   └── styles.css             # Panel-specific styling
├── scripts/                   # CONTENT SCRIPTS (DOM Interaction)
│   ├── content.js             # Logic for reading/modifying web pages
│   └── injector.css           # Styling for on-page modifications
├── lib/                       # SHARED MODULES (Utilities)
│   ├── api_client.js          # Backend/External API communication
│   └── store.js               # chrome.storage.local wrapper/state management
└── options/                   # CONFIGURATION
    ├── options.html           # User settings page
    └── options.js             # Logic for saving preferences




📄 manifest.json (Generic Panel)
JSON
{
  "manifest_version": 3,
  "name": "__APP_NAME__",
  "version": "1.0.0",
  "description": "__APP_DESCRIPTION__",
  "default_locale": "en",
  "icons": {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  },
  "permissions": [
    "sidePanel",
    "storage"
  ],
  "background": {
    "service_worker": "background/service_worker.js",
    "type": "module"
  },
  "side_panel": {
    "default_path": "sidepanel/index.html"
  },
  "action": {
    "default_title": "Click to open panel"
  },
  "options_page": "options/options.html",
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["scripts/content.js"],
      "css": ["scripts/injector.css"]
    }
  ]
}
🏗 Template 2: Popup Extension (Transient Action)
Use Case: Ideal for lightweight tools focused on quick interactions or one-off actions that do not require a persistent presence.

📁 Directory Structure
Plaintext
project-popup-root/
├── manifest.json              # MUST define "action" with "default_popup"
├── _locales/en/messages.json  # i18n support
├── assets/                    # Icons (16, 48, 128) & UI imagery
├── background/                # THE RELAY (Service Worker)
│   └── background.js          # Handles lifecycle events & background tasks
├── popup/                     # THE UI (Transient View)
│   ├── popup.html             # Compact UI skeleton
│   ├── popup.js               # Event-driven logic (closes on blur)
│   └── popup.css              # Compact styling (max 800x600px)
├── content-scripts/           # CONTENT SCRIPTS (DOM Interaction)
│   ├── content.js             # Page-level logic
│   └── content.css            # Page-level styling
├── lib/                       # SHARED MODULES (Utilities)
│   ├── api.js                 # API fetch wrappers
│   └── storage_helper.js      # State sync between UI and Background
└── options/                   # CONFIGURATION
    ├── options.html           # Settings interface
    └── options.js             # Logic for settings persistence



📄 manifest.json (Generic Popup)
JSON
{
  "manifest_version": 3,
  "name": "__APP_NAME__",
  "version": "1.0.0",
  "description": "__APP_DESCRIPTION__",
  "default_locale": "en",
  "icons": {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  },
  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "__APP_NAME__"
  },
  "permissions": [
    "storage"
  ],
  "background": {
    "service_worker": "background/background.js",
    "type": "module"
  },
  "options_page": "options/options.html",
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-scripts/content.js"],
      "css": ["content-scripts/style.css"]
    }
  ]
}
📜 Core Development Standards
State Management: Always treat chrome.storage.local as the single source of truth. Use chrome.storage.onChanged.addListener in your UI scripts to ensure reactive updates.

Service Worker Lifecycle: Service workers in MV3 are ephemeral. Register all listeners at the top level and avoid relying on long-lived global variables.

Communication: Use chrome.runtime.sendMessage for transient UI-to-Background calls and chrome.runtime.connect for persistent ports.

Permissions: Adhere to the principle of least privilege. Request only the specific permissions and host_permissions your logic requires.