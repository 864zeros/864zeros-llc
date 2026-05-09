# Technical Build Prompt: Mobile Application (Android & iOS)

**Project:** {{PROJECT_NAME}}

---
### **Agent's First Action**

**You must start by asking the user the following question *exactly* as written:**

*"Do we have a feature brick catalog I should use?"*

-   **If the user provides a catalog (e.g., `registry.json`):** You must prioritize using these existing "Build Blocks" for all relevant features.
-   **If the user answers "No" or "Not yet":** You must proceed with the build, but every new feature you create must be designed as a self-contained, reusable "Build Block." This means it must be modular, have a single responsibility, and adhere to the standard 864z service protocol (JSON in, JSON out) as defined in `docs/864z-vulture-to-block-build-pattern.md`.

---
### **1. High-Level Objective**

Build a **cross-platform mobile application for Android & iOS** that solves the following core problem: **{{CORE_PROBLEM_SOLVED}}**.

The core solution is: **{{CORE_SOLUTION}}**.

Refer to `README.md` in this directory for the full strategic context, market analysis, and GTM strategy.

---
### **2. Architecture & Data Storage**

Define the application architecture and data storage strategy. Assume a local-first approach using a mobile-friendly database.

*(Example for a simple notes app)*
-   **Framework:** React Native (or Flutter, based on user preference).
-   **Local Database:** SQLite or Realm for on-device persistence.
-   **Backend Sync (Optional, for Pro features):** A simple Python/FastAPI backend to sync data between devices.

---
### **3. Data Models / Schema**

Define the local database schema.

*(Example for a simple notes app)*
-   **notes:** `id`, `title`, `content`, `created_at`, `updated_at`, `is_synced`
-   **settings:** `key`, `value`

---
### **4. UI/UX Flow & Core Screens**

Implement the user interface. Adhere strictly to the `oia-design-system` principles.

1.  **Home Screen:**
    -   The main view after the app launches.
    -   Displays a list of all notes.
    -   Contains a floating action button (FAB) to create a new note.
2.  **Editor Screen:**
    -   Allows the user to create and edit a note.
    -   Includes "Save" and "Delete" actions.
3.  **Settings Screen:**
    -   Provides options for theme, font size, etc.
    -   Handles the Pro subscription upgrade flow (linking to App Store / Google Play in-app purchases).

---
### **5. Build Execution Plan**

Follow a phased build plan similar to our other platforms.

1.  **Scaffold:** Initialize the React Native project, set up navigation, and create placeholder files for all screens. Ensure it runs on both Android and iOS simulators.
2.  **UI Shell:** Build out all screens with placeholder data, styled according to the OIA design system.
3.  **Local Logic:** Implement the local database logic (CRUD operations for notes).
4.  **Integration:** Connect the UI screens to the local database.
5.  **Billing & Sync (Optional):** Integrate with native in-app purchase APIs and build the backend sync functionality.
6.  **Polish & QA:** Refine the UI, add animations, handle permissions, and test on physical devices.
