# Options Page Template

Standard structure for 864zeros extension options pages.

---

## Required Sections

Every options page **must** include these sections in this order:

| # | Section | Purpose | Required? |
|---|---------|---------|-----------|
| 1 | **Hero** | Pitch + instructions — sell value, teach usage | Yes |
| 2 | **General** | Core settings users might adjust | Yes |
| 3 | **Your Plan** | Current tier, features, upgrade CTA | Yes |
| 4 | **Data** | Export, import, sync options | If app stores data |
| 5 | **Fuel the Build** | Donation/support CTA | Yes |
| 6 | **Footer** | Privacy badge, legal, copyright | Yes |

---

## Section Details

### 1. Hero (Required)

The first thing users see. Combines branding with value proposition and onboarding.

**Must include:**
- App icon + name
- Tagline (one punchy line)
- Pitch sentence (1-2 sentences explaining what the app does)
- Collapsible "How to use" instructions (5 steps max)

**Example:**
```html
<header class="options-hero">
  <div class="options-hero__brand">
    <img src="../icons/icon-48.png" alt="AppName" class="options-hero__icon">
    <div>
      <h1 class="oia-h1">AppName</h1>
      <p class="oia-tagline">Tagline goes here.</p>
    </div>
  </div>
  <p class="oia-body options-hero__pitch">
    One or two sentences explaining the core value.
  </p>
  <details class="options-howto">
    <summary>How to use AppName</summary>
    <ol class="options-howto__steps">...</ol>
  </details>
</header>
```

---

### 2. General (Required)

Core preferences. Keep it minimal — only settings most users care about.

**Guidelines:**
- Use dropdowns for choice settings
- Use toggles for on/off settings
- Include helper text (caption) for each setting
- Max 5-6 settings in General; use additional cards for advanced settings

---

### 3. Your Plan (Required)

Shows current tier and drives upgrades.

**Must include:**
- Current tier badge with visual indicator
- Brief description of what current tier includes
- Feature list showing what each upgrade unlocks
- Single "Upgrade your plan" CTA button

**Standard tiers:**
- Free → Starter → Pro → Power

---

### 4. Data (Conditional)

Include if the app stores user data locally or in the cloud.

**Must include:**
- Statement that data is stored locally
- Export button
- Import button
- Hidden file input for import

**Optional:**
- Cloud sync section (gated by tier)

---

### 5. Fuel the Build (Required)

Donation/support CTA. Builds community engagement and funds development.

**Must include:**
- Friendly ask (not desperate)
- "Buy us a coffee" button

**Example copy:**
> Love [AppName]? Help us build the next feature. Every coffee counts.

---

### 6. Footer (Required)

Privacy assurance and legal compliance.

**Must include (in this order):**

1. **Privacy Badge** — Exact text: "No ads. No tracking. Your data stays yours."
2. **Legal Links** — Terms of Use, Privacy Policy
3. **Copyright** — "© [Year] 864zeros LLC. All rights reserved."
4. **Version** — "[AppName] v[X.X.X]"

---

## Placeholders to Replace

| Placeholder | Replace With |
|-------------|--------------|
| `__APP_NAME__` | Your extension name (e.g., "ClipBoard") |
| `__TAGLINE__` | Short punchy tagline |
| `__PITCH_SENTENCE__` | 1-2 sentence value proposition |
| `__INSTRUCTION_1-5__` | How-to steps |
| `__SETTING_*__` | Setting labels and descriptions |
| `__FREE_TIER_DESCRIPTION__` | What Free includes |
| `__STARTER/PRO/POWER_FEATURES__` | Tier feature lists |
| `__YEAR__` | Current year |
| `__VERSION__` | Semantic version |

---

## Files

```
options/
├── options.html    # Page structure
├── options.css     # Styles (copy as-is)
└── options.js      # Logic (create per extension)
```

---

## Checklist

Before shipping, verify:

- [ ] Hero has icon, tagline, pitch, and how-to
- [ ] General settings are minimal and useful
- [ ] Your Plan shows current tier and upgrade path
- [ ] Data section works (export/import tested)
- [ ] Fuel the Build links to donation page
- [ ] Privacy badge uses exact text
- [ ] Legal links work (Terms, Privacy)
- [ ] Copyright has correct year
- [ ] Version matches manifest.json
- [ ] Dark mode looks good
- [ ] Mobile responsive (480px breakpoint)

---

*Template version: 1.0.0*
