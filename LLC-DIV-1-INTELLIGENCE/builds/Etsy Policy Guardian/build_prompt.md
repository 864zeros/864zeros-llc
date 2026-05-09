# Technical Build Prompt: Web Application (Micro-SaaS)

**Project:** Etsy Policy Guardian

---
### **Agent's First Action**

**You must start by asking the user the following question *exactly* as written:**

*"Do we have a feature brick catalog I should use?"*

-   **If the user provides a catalog (e.g., `registry.json`):** You must prioritize using these existing "Build Blocks" for all relevant features.
-   **If the user answers "No" or "Not yet":** You must proceed with the build, but every new feature you create must be designed as a self-contained, reusable "Build Block." This means it must be modular, have a single responsibility, and adhere to the standard 864z service protocol (JSON in, JSON out) as defined in `docs/864z-vulture-to-block-build-pattern.md`.

---
### **1. High-Level Objective**

Build a **Micro-SaaS Web Application** that solves the following core problem: **Eliminate the fear of Etsy account suspension by proactively identifying policy violations in listings.**

The core solution is: **An automated tool to scan Etsy listings against current policies, flag potential issues, suggest remediations, and generate basic appeal templates.**

Refer to `README.md` in this directory for the full strategic context, market analysis, and GTM strategy.

---
### **2. Database Schema**

Define and create the necessary database models and tables using **PostgreSQL**.

-   **users:**
    -   `id` (PK, UUID)
    -   `email` (VARCHAR, UNIQUE, NOT NULL)
    -   `password_hash` (VARCHAR, NOT NULL)
    -   `stripe_customer_id` (VARCHAR, UNIQUE)
    -   `etsy_oauth_token` (VARCHAR, ENCRYPTED)
    -   `created_at` (TIMESTAMP, DEFAULT NOW())
-   **subscriptions:**
    -   `id` (PK, UUID)
    -   `user_id` (FK to users.id)
    -   `stripe_subscription_id` (VARCHAR, UNIQUE)
    -   `status` (VARCHAR, ENUM('active', 'canceled', 'trialing'))
    -   `tier` (VARCHAR, ENUM('free', 'pro'))
-   **listings:**
    -   `id` (PK, UUID)
    -   `user_id` (FK to users.id)
    -   `etsy_listing_id` (BIGINT, UNIQUE)
    -   `title` (TEXT)
    -   `description` (TEXT)
    -   `last_scanned` (TIMESTAMP)
    -   `compliance_score` (INTEGER)
-   **issues:**
    -   `id` (PK, UUID)
    -   `listing_id` (FK to listings.id)
    -   `policy_id` (FK to policies.id)
    -   `snippet` (TEXT, the flagged text)
    -   `suggestion` (TEXT)
    -   `status` (VARCHAR, ENUM('new', 'resolved'))
-   **policies:**
    -   `id` (PK, UUID)
    -   `name` (VARCHAR, e.g., "Medical Claims")
    -   `description` (TEXT)
    -   `keywords` (TEXT ARRAY, keywords that trigger this policy)

---
### **3. API Endpoint Contract**

Define and implement the backend API using **Python/FastAPI**.

-   **Authentication:**
    -   `POST /api/auth/register`: { email, password } -> { token }
    -   `POST /api/auth/login`: { email, password } -> { token }
    -   `GET /api/auth/etsy/redirect`: Redirects user to Etsy for OAuth.
    -   `GET /api/auth/etsy/callback`: Handles the OAuth callback from Etsy.
-   **Core Logic:**
    -   `GET /api/listings`: -> { "listings": [...] }
    -   `GET /api/listings/{listing_id}`: -> { "listing": {...}, "issues": [...] }
    -   `POST /api/scan`: Triggers an async background job to scan all of user's listings. -> { "status": "scan_started" }
-   **Billing (Stripe Webhooks):**
    -   `POST /api/webhooks/stripe`: Receives Stripe events to update subscription status.

---
### **4. Frontend UI/UX Flow**

Implement the frontend user interface using **Next.js**. Adhere strictly to the `oia-design-system.css`.

1.  **Login/Signup Pages:**
    -   Standard forms for email/password.
    -   A prominent "Connect with Etsy" button to initiate the OAuth flow.
2.  **Dashboard (`/`):**
    -   The main view after login.
    -   Displays a table of the user's Etsy listings with columns: `Title`, `Last Scanned`, `Compliance Score`.
    -   A primary "Start Compliance Scan" button.
    -   Shows a "Syncing..." state while the backend fetches listings.
3.  **Listing Detail View (`/listings/{id}`):**
    -   Displays the listing title and description.
    -   Shows a list of identified `Issues`, highlighting the problematic `snippet` and providing a `suggestion`.
4.  **Settings (`/settings`):**
    -   Allows users to manage their subscription (e.g., "Upgrade to Pro" button that triggers Stripe Checkout).
    -   Displays user account information.

---
### **5. Build Execution Plan**

Follow the `phases/web/` build plan. Pay close attention to the `864z-build-kit-guide.md` for universal rules.

1.  **Scaffold:** Set up the monorepo structure (backend, frontend), install dependencies, and configure the PostgreSQL database.
2.  **Backend (API & DB):** Implement the full API contract and database schema.
3.  **Frontend (UI Shell):** Build out all the UI views with placeholder data.
4.  **Integration:** Connect the frontend to the backend API, including the full Etsy OAuth flow.
5.  **Billing:** Integrate Stripe for subscriptions.
6.  **Core Feature:** Implement the async scanning logic and the AI-powered issue detection.
7.  **Polish & QA:** Refine the UI, add error handling, and write necessary tests.
