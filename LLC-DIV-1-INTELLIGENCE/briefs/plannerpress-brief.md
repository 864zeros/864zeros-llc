# App Brief — PlannerPress

> **Source Dossier:** `builds/PlannerPress/README.md`
> This brief is the single source of truth for the build.

---

## 1. Identity

| Field | Value |
|-------|-------|
| App Name | PlannerPress |
| App Slug | `plannerpress` |
| Description | The Automated Etsy Digital Planner Studio. Go from idea to listing in minutes. |
| Brand | `864zeros` |
| Platform | `Web Application` |
| Version | 1.0.0 |

---

## 2. Screens / Views

This is a web application, not an extension. The primary views are pages within the app.

| View ID | View Name | Purpose |
|---------|-----------|---------|
| `dashboard` | Dashboard | Main view showing user's generated planner packages. |
| `builder` | Planner Builder | Multi-step wizard for creating a new planner. |
| `themes` | Theme Gallery | Browse and select professionally designed themes. |
| `brand` | Brand Kit | Upload and manage brand assets (logo, fonts, colors). |
| `settings` | Settings | Account settings, subscription management, etc. |

---

## 3. Features (Priority Order)

| # | Feature Name | Description | View | Tier |
|---|---|-------------|------|------|
| 1 | **User Authentication** | Standard email/password and social login. | - | All |
| 2 | **Modular Planner Builder** | Select modules (daily, weekly, etc.), themes, and date range. | `builder` | Free |
| 3 | **Programmatic PDF Generation** | Generate a complete, hyperlinked planner PDF from the builder configuration. | `builder` | Free |
| 4 | **Automated Mockup Engine** | Generate a suite of Etsy-ready mockup images from the planner PDF. | `builder` | Free |
| 5 | **AI Listing Assistant** | Generate SEO-optimized titles and descriptions for the Etsy listing. | `builder` | Pro |
| 6 | **Brand Kit** | Upload logo, fonts, and colors to apply to all generated assets. | `brand` | Studio |
| 7 | **Dashboard & Downloads**| View, manage, and download generated planner packages. | `dashboard` | All |
| 8 | **Subscription Management** | User can view, upgrade, or cancel their subscription plan. | `settings` | All |

---

## 4. Data Model

### Database Schema (e.g., PostgreSQL/Supabase)

**Table: `users`**
- `id` (uuid, pk)
- `email` (text, unique)
- `stripe_customer_id` (text, unique)
- `subscription_status` (enum: 'free', 'pro', 'studio', 'canceled')
- `created_at` (timestamp)

**Table: `brand_kits`**
- `id` (uuid, pk)
- `user_id` (uuid, fk to users)
- `name` (text)
- `logo_url` (text)
- `primary_color` (text)
- `secondary_color` (text)
- `font_family` (text)
- `created_at` (timestamp)

**Table: `planner_generations`**
- `id` (uuid, pk)
- `user_id` (uuid, fk to users)
- `config` (jsonb) - The user's selections from the builder
- `pdf_url` (text) - Link to stored PDF
- `mockup_urls` (array of text) - Links to stored mockup images
- `ai_listing_title` (text)
- `ai_listing_description` (text)
- `created_at` (timestamp)

**Table: `themes`**
- `id` (uuid, pk)
- `name` (text)
- `preview_image_url` (text)
- `is_premium` (boolean)
- `config` (jsonb) - Styling information

---

## 5. AI Integration

| Field | Value |
|-------|-------|
| Default Provider | `gemini` |
| Default Model | `gemini-2.0-flash` |
| PPI Redaction | `required` (though user input is minimal) |

### AI Call Points

| Trigger | Input | Instruction | Expected Output | Tier |
|---------|-------|-------------|-----------------|------|
| "Generate Listing" button | Planner theme, style, and target audience | "Generate 5 SEO-optimized Etsy titles and one 3-paragraph Etsy description for a digital planner with the following characteristics: [details]." | JSON with `titles` array and `description` string | Pro |

---

## 6. Monetization

### Tier Structure

| Tier | Price | What Unlocks |
|------|-------|-------------|
| Free | $0 | 1 planner generation per month, basic themes, watermarked mockups. |
| Pro | $29/mo | 10 planner generations per month, premium themes, no watermarks, AI listing assistant. |
| Studio | $49/mo | Unlimited planner generations, upload custom brand kits, access to new monthly themes. |

### Feature-to-Tier Mapping

```javascript
FEATURE_TIERS = {
  'planner-generation': 'free', // with limits
  'premium-themes': 'pro',
  'ai-listing-assistant': 'pro',
  'brand-kit': 'studio'
};
```

---

## 7. Marketing & Go-to-Market

| Field | Value |
|-------|-------|
| Headline | "Your Etsy Digital Planner Factory. Go from Idea to Listing in 5 Minutes." |
| Target Audience | Existing and aspiring Etsy sellers in the digital products niche. |
| Key Selling Points | 1. **Speed:** Create a complete product package in minutes, not days. 2. **Quality:** Professional themes and high-quality mockups. 3. **Automation:** AI-powered listings and automated asset generation. |
| Privacy Highlight | "We don't need your Etsy data. We just give you the files. Your business stays yours." |

---

## 8. Testing Notes

### Critical Paths to Test

| # | Flow Description | Touches |
|---|------------------|---------|
| 1 | User signs up -> builds a free planner -> downloads watermarked package | Auth -> Builder UI -> PDF/Image Generation -> File Download |
| 2 | Pro user builds a planner -> uses AI assistant -> downloads final package | Auth -> Tier Check -> Builder UI -> AI API -> PDF/Image Gen -> Download |
| 3 | Studio user creates a Brand Kit -> applies it in the builder -> generated assets match brand | Auth -> Tier Check -> Brand Kit UI -> DB -> Generation APIs |
| 4 | Free user hits generation limit -> sees upgrade prompt -> upgrades to Pro | Tier Check -> UI -> Stripe Checkout -> Webhook -> User Status Update |

### Known Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Very complex planner config | Generation might take longer; show a progress indicator. Set a reasonable page limit (e.g., 500 pages). |
| Invalid brand assets (e.g., corrupt font file) | Show a clear validation error upon upload. |
| AI returns malformed response | Catch the error and show a "Try again" button with a fallback suggestion. |

---

## 9. Future Lego Bricks

| Module / Feature | Reuse Potential |
|-----------------|-----------------|
| Programmatic PDF Generation Engine | Any future product that needs to generate custom PDFs. |
| Automated Mockup Engine | Can be adapted for any digital product (e.g., ebooks, templates). |
| Brand Kit System | A universal feature for any B2B/Pro-level SaaS tool. |
| Tiered SaaS Subscription Logic | The core of any future subscription-based web app. |

---

_Brief completed by: 864z Scout Agent_
_Date: February 6, 2026_
_Ready for build: [x] Yes [ ] Needs review_
