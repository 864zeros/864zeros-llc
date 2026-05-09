# 🦅 "ClipGenius" - The Intelligent Web Clipper - Vulture Dossier

- **Vulture Grade:** 9.3/10
- **The Gap:** Users of the classic Evernote Web Clipper are deeply frustrated with its modern limitations: messy formatting, incomplete captures, slow performance, and poor handling of dynamic web pages. They are forced to use workarounds or migrate, but no single alternative perfectly combines robust clipping with intelligent, clean formatting for modern note-taking apps.
- **Target Audience:** Existing and former Evernote users, as well as Notion, Obsidian, and Bear users who need a powerful, reliable web clipping tool. Estimated at 5-10% of the massive user bases of these platforms.

---
## Financial Vetting

- **Monetization Model:** Freemium. Free tier with limited clips/month and basic formatting. Pro tier at **$5/month** for unlimited clips, AI summarization, auto-tagging, and premium integrations.
- **Total Addressable Market (TAM):** 225M+ (Evernote's last reported user count), plus millions more from Notion, Obsidian, etc.
- **Serviceable Addressable Market (SAM):** ~2.25M+ users (a very conservative 1% of just the Evernote user base experiencing the pain).
- **Projected Subscribers (Year 1):** 3,750 (a 0.16% capture rate of the SAM, assuming strong word-of-mouth).
- **Forecasted MMR:** **$18,750/mo** (3,750 subscribers @ $5/mo).
- **Forecasted Annual Revenue:** **$225,000/yr**.
- **Projected Monthly Profit:** **~$18,500/mo** (after ~$250/mo in serverless function and API costs).

---
## Build & Technical Specification

- **Build Brick:** A Chrome Extension that uses a serverless Python backend with modern parsing libraries (`Trafilatura`) to intelligently extract main page content, uses AI to summarize/tag it, and then sends it to the user's note-taking app via API.
- **Build Brick Size:** [Size: M]
- **Platform:** Chrome Extension with a Serverless Backend (e.g., Google Cloud Functions, AWS Lambda).
- **Tech Stack & Costs:**
    - **Stack:** Vanilla JS (extension), Python/Flask (backend API), `Trafilatura` library for content extraction, OpenAI API for summarization.
    - **Est. Costs:** Pay-as-you-go serverless model. Initial costs are near-zero, scaling with usage. OpenAI API costs are per-clip.
- **Core Feature Set (MVP):**
    - Chrome Extension UI with a single "Clip Clean" button.
    - Oauth integration with Evernote and Notion (initial targets).
    - A serverless function that receives a URL, fetches content, cleans it with `Trafilatura`, and sends it to the user's connected note app.

---
## Go-to-Market (GTM) & Distribution

- **Proposed Name & Handle:** Name: ClipGenius, Handle: @clipgenius
- **Distribution Channels:** Chrome Web Store, Product Hunt launch, content marketing targeting "Evernote alternatives" and "Notion web clipper" keywords.
- **Initial GTM Angle:** "Clip the web without the mess. The web clipper for modern note-takers." This directly targets the primary frustration with the incumbent.

---
## Supporting Evidence & Build Plan

- **Evidence:** High volume of user complaints on Evernote's own forums and Reddit detail "poor formatting," "incomplete captures," and "slow performance." The thriving market for alternatives like Notion Web Clipper and specialized tools like Devonthink confirms the demand for a better solution.

### Detailed Build Plan
- **Step 1 (Backend - Day 1-3):**
    - Set up a serverless function (e.g., on Google Cloud Functions).
    - Write the core Python logic: receive a URL, fetch HTML, process with `Trafilatura`, and format as clean markdown.
    - Implement basic API authentication (e.g., API key).
- **Step 2 (Extension - Day 4-6):**
    - Develop the Chrome Extension `manifest.json` and a simple `popup.html`.
    - Write `popup.js` to get the current tab's URL and send it to the backend API.
    - Implement a settings page for users to enter their API key.
- **Step 3 (Integration & AI - Day 7-10):**
    - Add OAuth flows for Evernote and Notion to the backend.
    - Modify the backend to send the cleaned markdown to the user's connected account.
    - Integrate with OpenAI API to add auto-summarization and tagging as a premium feature.
- **Step 4 (Deployment & Launch - Day 11-14):**
    - Deploy the serverless backend.
    - Publish the extension to the Chrome Web Store.
    - Integrate Stripe for the pro subscription.
