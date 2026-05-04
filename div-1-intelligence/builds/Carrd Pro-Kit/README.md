# 🦅 "Carrd Pro-Kit" - Unofficial Feature Enhancement Suite - Vulture Dossier

- **Vulture Grade:** 9.0/10
- **The Gap:** Users love Carrd for its simplicity in creating one-page sites but are deeply frustrated by the lack of native blogging, advanced e-commerce (shopping carts), and robust SEO capabilities. They are forced to use complex workarounds or migrate to more expensive, complicated platforms like Webflow or Squarespace once they need to scale.
- **Target Audience:** The ~33,000 (1% of 3.3M+) Carrd users who have outgrown the platform's single-page limitations but do not want the complexity of a full-scale website builder.

---
## Financial Vetting

- **Monetization Model:** Tiered Subscription (e.g., Free for 3 blog posts/products, Pro for unlimited content at $12/mo).
- **Total Addressable Market (TAM):** 3,300,000+ sites built on Carrd.
- **Serviceable Addressable Market (SAM):** 33,000+ users (a conservative 1% of TAM experiencing the primary pain points).
- **Projected Subscribers (Year 1):** 165 (a 0.5% capture rate of the SAM).
- **Forecasted MMR:** **$1,980/mo** (165 subscribers @ $12/mo).
- **Forecasted Annual Revenue:** **$23,760/yr**.
- **Projected Monthly Profit:** **~$1,930/mo** (after ~$50/mo in estimated hosting/API costs).

---
## Build & Technical Specification

- **Build Brick:** A "headless" CMS and feature extender for Carrd. Users manage content in our UI, and we provide a JavaScript snippet to embed a full blog or store into their Carrd site.
- **Build Brick Size:** [Size: M]
- **Platform:** Micro-SaaS Web App
- **Tech Stack & Costs:**
    - **Stack:** Python/FastAPI backend, SQLite or Postgres database, Vanilla JS or a lightweight frontend framework (e.g., Svelte).
    - **Est. Costs:** ~$20-50/mo for a basic server (e.g., DigitalOcean Droplet or Vercel/Heroku hobby tier), plus transactional costs for Stripe.
- **Core Feature Set (MVP):**
    - User authentication (Google/email).
    - A simple, markdown-based editor for writing blog posts.
    - A simple product manager (name, price, image, description).
    - Automatic generation of a single `<script>` tag for users to paste into a Carrd "Embed" element.
    - A backend that serves the blog/store content to be rendered by the script.

---
## Go-to-Market (GTM) & Distribution

- **Proposed Name & Handle:** Name: PowerUp Carrd, Handle: @powerupcarrd
- **Distribution Channels:** Direct website, targeted content marketing (blogs, videos), and community engagement in no-code forums and Reddit (r/Carrd).
- **Initial GTM Angle:** "Your Carrd site just grew up. Add a full blog or store in 60 seconds." This message directly targets the primary pain point of scaling.

---
## Supporting Evidence & Build Plan

- **Evidence:** User reviews and comparisons (autoposting.ai, themarketingagency.ca, websiteplanet.com) repeatedly highlight Carrd's lack of blogging, e-commerce, and multi-page SEO as its primary limitations. The existence of a large market for more complex alternatives (Wix, Squarespace, Webflow) validates the need for these features.

### Detailed Build Plan
- **Step 1 (Backend - Day 1-3):** Set up FastAPI server, configure database (SQLite), implement user auth, create CRUD API endpoints for posts/products.
- **Step 2 (Frontend - Day 4-6):** Create a simple dashboard UI for content management, build the markdown editor, and display the unique `<script>` tag.
- **Step 3 (Embeddable Script - Day 7-9):** Write the core JS to fetch data from our API and dynamically render the blog/store inside a Carrd "Embed" element.
- **Step 4 (Deployment & Payments - Day 10-12):** Deploy to a cloud provider, integrate Stripe for subscriptions, and perform final testing.