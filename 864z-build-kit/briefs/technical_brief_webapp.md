# Technical Build Prompt: Web Application (Micro-SaaS)

**Project:** {{PROJECT_NAME}}

---
### **Agent's First Action**

**You must start by asking the user the following question *exactly* as written:**

*"Do we have a feature brick catalog I should use?"*

-   **If the user provides a catalog (e.g., `registry.json`):** You must prioritize using these existing "Build Blocks" for all relevant features.
-   **If the user answers "No" or "Not yet":** You must proceed with the build, but every new feature you create must be designed as a self-contained, reusable "Build Block." This means it must be modular, have a single responsibility, and adhere to the standard 864z service protocol (JSON in, JSON out) as defined in `docs/864z-vulture-to-block-build-pattern.md`.

---
### **1. High-Level Objective**

Build a **{{BUILD_TYPE}}** that solves the following core problem: **{{CORE_PROBLEM_SOLVED}}**.

The core solution is: **{{CORE_SOLUTION}}**.

Refer to `README.md` in this directory for the full strategic context, market analysis, and GTM strategy.

---
### **2. Database Schema**

Define and create the necessary database models and tables.

*(Example for a simple SaaS)*
-   **users:** `id`, `email`, `password_hash`, `stripe_customer_id`, `created_at`
-   **subscriptions:** `id`, `user_id`, `stripe_subscription_id`, `status` (`active`, `canceled`), `tier` (`free`, `pro`)
-   **... (add project-specific models here)**

---
### **3. API Endpoint Contract**

Define and implement the backend API. All endpoints must be authenticated and return standardized JSON responses.

*(Example API for a SaaS)*
-   **Authentication:**
    -   `POST /api/auth/register`: { email, password } -> { token }
    -   `POST /api/auth/login`: { email, password } -> { token }
-   **Core Logic:**
    -   `GET /api/data`: -> { "data": [...] }
    -   `POST /api/data`: { "newData": "..." } -> { "status": "success", "id": "..." }
-   **Billing (Stripe Webhooks):**
    -   `POST /api/webhooks/stripe`: Receives Stripe events to update subscription status.

---
### **4. Frontend UI/UX Flow**

Implement the frontend user interface. Adhere strictly to the `oia-design-system.css`.

1.  **Authentication Pages:**
    -   `/login`: A simple login form.
    -   `/signup`: A simple registration form.
2.  **Dashboard (`/`):**
    -   The main view after login.
    -   Displays the core data from the API.
    -   Contains the primary user actions (e.g., "Add New Item", "Scan Listings").
3.  **Settings (`/settings`):**
    -   Allows users to manage their subscription (e.g., "Upgrade to Pro" button that triggers the Stripe Checkout flow).
    -   Displays user account information.

---
### **5. Build Execution Plan**

Follow the `phases/web/` build plan. Pay close attention to the `864z-build-kit-guide.md` for universal rules.

1.  **Scaffold:** Set up the project structure (backend, frontend), install dependencies, and configure the database.
2.  **Backend (API & DB):** Implement the full API contract and database schema.
3.  **Frontend (UI Shell):** Build out all the UI views with placeholder data.
4.  **Integration:** Connect the frontend to the backend API.
5.  **Billing:** Integrate Stripe for subscriptions.
6.  **Polish & QA:** Refine the UI, add error handling, and write necessary tests.
