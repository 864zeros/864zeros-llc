# Technical Build Prompt: Chrome Extension

**Project:** {{PROJECT_NAME}}

---
### **Agent's First Action**

**You must start by asking the user the following question *exactly* as written:**

*"Do we have a feature brick catalog I should use?"*

-   **If the user provides a catalog (e.g., `registry.json`):** You must prioritize using these existing "Build Blocks" for all relevant features.
-   **If the user answers "No" or "Not yet":** You must proceed with the build, but every new feature you create must be designed as a self-contained, reusable "Build Block." This means it must be modular, have a single responsibility, and adhere to the standard 864z service protocol (JSON in, JSON out) as defined in `docs/864z-vulture-to-block-build-pattern.md`.

---
### **1. High-Level Objective**

Build a **Chrome Extension** that solves the following core problem: **{{CORE_PROBLEM_SOLVED}}**.

The core solution is: **{{CORE_SOLUTION}}**.

Refer to `README.md` in this directory for the full strategic context, market analysis, and GTM strategy.

---
### **2. Data Storage & Architecture**

Define the data storage strategy. Prioritize `chrome.storage.local` or IndexedDB for local-first persistence.

*(Example for a tab manager)*
-   **IndexedDB:**
    -   **`tab_vault` store:** `id`, `url`, `title`, `timestamp`, `isDiscarded`
    -   **`settings` store:** `key`, `value` (e.g., `{ key: 'theme', value: 'dark' }`)
-   **`chrome.storage.sync`:** (Optional, for Pro features)
    -   Used to sync a small amount of critical data across devices.

---
### **3. Core Components & Logic**

Implement the core files and logic for the extension.

*(Example for a tab manager)*
-   **`manifest.json`:**
    -   `permissions`: "tabs", "storage", "unlimitedStorage"
    -   `action`: "popup.html"
    -   `background`: "background.js"
-   **`background.js` (Service Worker):**
    -   Handles browser events (e.g., `onStartup`, `onMessage`).
    -   Contains the core logic for tab discarding and management.
-   **`popup.js`:**
    -   Manages the user interface in the popup window.
    -   Reads data from storage and displays it.
    -   Sends messages to the background script to perform actions.

---
### **4. Frontend UI/UX Flow**

Implement the user interface. Adhere strictly to the `oia-design-system.css`.

1.  **Popup View (`popup.html`):**
    -   The main interface when the user clicks the extension icon.
    -   Displays the list of vaulted tabs.
    -   Contains the primary action button (e.g., "Vault Current Tab").
2.  **Options Page (`options.html`):**
    -   Accessible via right-click > Options.
    -   Allows users to configure settings (e.g., theme, sync options).
    -   Handles the Pro subscription upgrade flow if applicable.
3.  **Side Panel (`sidepanel.html`):** (Optional, for Manifest V3)
    -   Provides a persistent UI in the browser's side panel for more complex interactions.

---
### **5. Build Execution Plan**

Follow the `phases/extension/` build plan. Pay close attention to the `864z-build-kit-guide.md` for universal rules.

1.  **Scaffold:** Create the `manifest.json` and all required HTML/JS/CSS files. Ensure it loads correctly in Chrome.
2.  **UI Shell:** Build out the `popup.html` and `options.html` with placeholder data, styled with the OIA design system.
3.  **Core Logic:** Implement the background script logic and data storage functions.
4.  **Integration:** Connect the UI to the background script and storage.
5.  **Polish & QA:** Refine the UI, add error handling, and test thoroughly across different websites.
