# Options Page Standardization Review
**Date:** 2026-03-16
**Purpose:** GTM readiness audit for all 864zeros Chrome extensions
**Author:** Claude (Opus 4.5)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total extensions reviewed | 11 |
| Extensions with options pages | 6 |
| Extensions missing options pages | 5 |
| Active pricing/monetization | 1 (ClipBoard) |
| Pricing UI exists but not wired | 2 (TuneOut, TabVault) |
| No pricing at all | 8 |

**GTM Risk Level: HIGH** — 5 extensions cannot be configured, pricing inconsistent across portfolio.

---

## Part 1: Extensions WITH Options Pages

### 1.1 ClipBoard (`clipboard/options/options.html`)

**Status:** Most complete, production-ready

**Structure:**
```
Hero Section
├── Icon + Title + Tagline
├── Pitch paragraph
└── Collapsible "How to use" (<details>)

General Settings Card
├── Default capture type (dropdown)
└── Auto-suggest tags (toggle)

AI Settings Card
├── AI Provider (dropdown: Gemini/Claude)
├── API Key input with save button
└── API Key status indicator

Your Plan Card
├── Tier badge (Free/Starter/Pro/Power)
├── Tier description
├── Feature upgrade list
└── "Upgrade your plan" button

Data Card
├── Export my data button
├── Import data button
└── Google Drive sync section (Pro only)

Fuel the Build Card
├── Copy about supporting development
└── "Buy us a coffee" button

Footer
├── Privacy badge (lock icon + "No ads. No tracking.")
├── Terms of Use link
├── Privacy Policy link
├── Copyright
└── Version
```

**Pricing Model:** 4-tier subscription via ExtPay
- Free: Text/page capture, tags, search, local export
- Starter: + Screenshots, AI summaries, auto-tagging
- Pro: + Marquee capture, AI vision, Google Drive sync
- Power: + InsightForge export, priority features

**Technical:**
- Uses `lib/tiers.js` for tier management
- Uses `lib/payments/extpay-wrapper.js` for payments
- Uses `lib/google-drive/` for Drive integration
- ES6 modules throughout

---

### 1.2 TabVault (`TabVault/options/options.html`)

**Status:** Full featured, pricing not active

**Structure:**
```
Header (title only, no icon)

General Settings Card
├── Pitch box (full description)
├── How It Works (detailed instructions)
│   ├── Vault Tab instructions
│   ├── Sleep Tab instructions
│   └── Auto Deep Sleep instructions
├── Deep Sleep toggle
└── Inactivity threshold input (minutes)

Your Plan Card
├── Tier badge (Free)
├── Tier description
├── "Coming soon" Pro features
└── Disabled "Upgrades coming soon" button

Google Drive Backup Card (Pro badge)
├── Description
└── Drive section container

Data Card
├── Export my data button
├── Import data button
├── OneTab Import section
│   ├── Description
│   ├── Textarea for paste
│   └── Import button
└── Vault Management
    ├── Vaulted tabs count
    └── Clear All button

Fuel the Build Card
├── Copy
└── "Buy us a coffee" button

Footer
├── Privacy badge
├── Terms/Privacy links
├── Copyright
└── Version
```

**Pricing Model:** Free + Pro "coming soon"
- Free: Unlimited vaulting, sessions, scroll memory, Deep Sleep, local backup
- Pro (planned): Google Drive sync, scheduled vaulting, cross-device

**Technical:**
- OneTab bridge import feature (unique)
- IndexedDB storage
- Google Drive UI ready but gated behind tier

---

### 1.3 Signal2Noise (`Signal2Noise/options/options.html`)

**Status:** NEARLY EMPTY — needs complete rebuild

**Structure:**
```
Header (title only)

About Section
├── 2 paragraphs about the extension

Data Section
├── 1 paragraph about local storage

Version (footer)
```

**Pricing Model:** NONE

**Issues:**
- No hero section
- No actual settings
- No pricing/tier UI
- No export/import
- No Fuel the Build
- No Terms/Privacy links
- Inline `<style>` instead of CSS file
- No footer structure

**Action Required:** Complete rebuild using standard template

---

### 1.4 TuneOut2FocusIn (`TuneOut2FocusIn/options/options.html`)

**Status:** Good structure, payment not wired

**Structure:**
```
Hero Section
├── Icon + Title + Tagline "(864z)"
├── Pitch
└── ADHD slogans

Default Sound Card
├── Description
└── 4 radio buttons (white, gray, brown, rain)

Default Volume Card
├── Description
├── Range slider
└── Percentage display

Unlock Full Version Card
├── $1.99 price display
├── "one time, forever" label
├── 4 feature bullets
├── "Unlock Now — $1.99" button
└── Status text

The Science Card (unique)
├── 4 research studies
│   ├── White Noise and ADHD (Söderlund 2007)
│   ├── Stochastic Resonance Theory
│   ├── Brown Noise for Deep Focus
│   └── Nature Sounds and Stress
└── Full citations

Fuel the Build Card
├── Copy
└── "Buy us a coffee" button

Footer
├── Privacy badge
├── Terms/Privacy links
├── Copyright
└── Version

Save Status Toast (hidden)
```

**Pricing Model:** One-time $1.99 unlock
- Free: Limited features
- Unlocked: All 4 sounds, remember selection, auto-resume

**Technical:**
- Payment button exists but not wired to payment processor
- "Not yet unlocked" status text suggests tier check planned
- Save status toast for feedback
- Science section adds credibility (good pattern)

---

### 1.5 Time2Focus (`Time2Focus/options/options.html`)

**Status:** Informational page, NOT a settings page

**Structure:**
```
Hero Section
├── Icon + Title + Tagline
├── Pitch
└── Subpitch quote

Why It Works Card
├── Intro paragraph
└── 4 feature items with icons
    ├── Always Visible
    ├── Time Boxing
    ├── Focus Anchor
    └── Gentle Alerts

The Science Card
├── Intro paragraph
└── 4 study items with badges
    ├── Time Blindness (Barkley 1997)
    ├── Pomodoro Technique (Cirillo 2006)
    ├── Working Memory (Klingberg 2009)
    └── Implementation Intentions (Gollwitzer 1999)

How to Use Card
└── 6-step ordered list

About OIA Card
├── Brand description
└── 3 values with icons

Footer
├── Privacy badge
├── Copyright
└── Version
```

**Pricing Model:** NONE

**Issues:**
- No actual settings to configure
- No pricing/tier UI
- No export/import (timer doesn't store data)
- No Terms/Privacy links
- Purely informational — more of an "About" page

**Action Required:**
- Decide if settings are needed (alert sound, flash color are in panel itself)
- Add pricing if monetizing
- Add Terms/Privacy links

---

### 1.6 Bible-Insight (`Bible-Insight/html/options.html`)

**Status:** Most complex, different brand (FHG)

**Structure:**
```
Header
├── Title
└── Subtitle "Rest. Create. For His Glory."

API Configuration Section
├── Google Gemini API Key input
├── Help text with link
├── API.Bible Key input (optional)
└── Help text with link

Bible Translation Section
├── Default Translation dropdown (6 options)
├── Help text about public domain vs API
└── Auto-detect verses checkbox

AI Preferences Section
├── AI Mode dropdown (ask/local-first/cloud-first)
├── Help text
├── Cross-Reference Source dropdown
└── Help text

Data Management Section
├── Help text
├── Export/Import backup buttons
├── Storage usage bar
└── Storage detail text

Study Report Defaults Section
├── Strip Navigation checkbox
├── Cloud Assist checkbox
├── Auto-generate Key Points checkbox
├── Include Verses Referenced checkbox
├── Include Theological Themes checkbox
└── Export Research Markdown checkbox

Appearance Section
├── Theme dropdown (System/Light/Dark)
└── Help text

Advanced Section
├── Pause Extension toggle
├── Pause status indicator
├── View Database link
├── Help text
├── Token usage display
└── Reset Counter button

Actions
├── Save Settings button
└── Status message

Footer
├── Version + Brand + Company
└── Privacy Policy link
```

**Pricing Model:** None in UI (CLAUDE.md shows planned Free/Pro $4.99/mo or $29.99/yr)

**Technical:**
- Uses `fhg-theme.css` (separate brand, not OIA)
- Most configurable options page
- Manual "Save Settings" button (others auto-save)
- Storage usage visualization (unique)
- Token usage tracking (unique)
- Pause extension feature (unique)

**Brand Firewall:** FHG brand, must NOT reference OIA or 864zeros

---

## Part 2: Extensions WITHOUT Options Pages

These extensions have NO `options_ui` entry in manifest.json:

| Extension | manifest.json | Options Page | Settings in Panel |
|-----------|---------------|--------------|-------------------|
| oia-focus-note | No `options_ui` | None | Unknown |
| oia-focus-timer | No `options_ui` | None | Sound/color in panel |
| oia-focus-wall | No `options_ui` | None | Unknown |
| oia.focus.sound | No `options_ui` | None | Sound selection in panel |
| oia.focus.signal | No `options_ui` | None | Ratio selection in panel |

**Impact:**
- Users cannot access settings via Chrome's extension menu gear icon
- No upgrade path if monetizing
- No way to show Terms/Privacy/About information
- No data export capability

---

## Part 3: Commonalities Analysis

### Consistent Elements (Good)

| Element | ClipBoard | TabVault | Signal2Noise | TuneOut | Time2Focus | Bible-Insight |
|---------|-----------|----------|--------------|---------|------------|---------------|
| Nunito font | Yes | Yes | Yes | Yes | Yes | Yes + Lora |
| oia-design-system.css | Yes | Yes | Yes | Yes | Yes | No (fhg-theme) |
| Privacy badge | Yes | Yes | No | Yes | Yes | No |
| Version in footer | Yes | Yes | Yes | Yes | Yes | Yes |
| Copyright | Yes | Yes | No | Yes | Yes | Yes |

### Inconsistent Elements (Gaps)

| Element | Present | Missing |
|---------|---------|---------|
| Hero with icon | ClipBoard, TuneOut, Time2Focus | TabVault, Signal2Noise, Bible |
| Terms/Privacy links | ClipBoard, TabVault, TuneOut | Signal2Noise, Time2Focus, Bible |
| Fuel the Build | ClipBoard, TabVault, TuneOut | Signal2Noise, Time2Focus, Bible |
| Export/Import | ClipBoard, TabVault, Bible | Signal2Noise, TuneOut, Time2Focus |
| Settings (actual) | ClipBoard, TabVault, TuneOut, Bible | Signal2Noise, Time2Focus |
| Pricing UI | ClipBoard, TabVault, TuneOut | Signal2Noise, Time2Focus, Bible |

---

## Part 4: Pricing Model Summary

### Current State

| Extension | Model | Implementation | Revenue |
|-----------|-------|----------------|---------|
| ClipBoard | 4-tier sub | ExtPay integrated | Active |
| TabVault | Freemium | UI only, not wired | None |
| Signal2Noise | None | N/A | None |
| TuneOut2FocusIn | $1.99 one-time | UI only, not wired | None |
| Time2Focus | None | N/A | None |
| Bible-Insight | Freemium (planned) | Not built | None |
| oia-focus-note | None | No options page | None |
| oia-focus-timer | None | No options page | None |
| oia-focus-wall | None | No options page | None |
| oia.focus.sound | None | No options page | None |
| oia.focus.signal | None | No options page | None |

### Recommended Pricing Strategy

| Tier | Extensions | Model | Price |
|------|------------|-------|-------|
| **Premium Products** | ClipBoard, TabVault, Bible-Insight | Subscription | $2.99-4.99/mo |
| **Mid-Tier Products** | TuneOut2FocusIn, oia.focus.sound | One-time | $1.99 |
| **Free Utilities** | Time2Focus, oia-focus-note, oia-focus-timer, oia-focus-wall, oia.focus.signal, Signal2Noise | Free | $0 |

### Revenue Potential (if above strategy)
- Premium (3 × $3.99/mo × 100 users) = $1,197/mo
- Mid-Tier (2 × $1.99 × 500 users) = $1,990 one-time
- Free: Funnel to premium products

---

## Part 5: Standard Options Page Template

Based on analysis, the standard template should include:

```
options.html
├── Hero Section (mandatory)
│   ├── Icon (48px)
│   ├── Title (h1)
│   ├── Tagline
│   ├── Pitch (1-2 sentences)
│   └── How to Use (collapsible, optional)
│
├── Settings Section(s) (if applicable)
│   └── App-specific settings
│
├── Your Plan Section (mandatory if monetizing)
│   ├── Current tier badge
│   ├── Tier description
│   ├── Upgrade benefits list
│   └── Upgrade/Unlock button
│
├── Data Section (mandatory if app stores data)
│   ├── Export button
│   ├── Import button
│   └── Google Drive sync (Pro only)
│
├── Fuel the Build Section (optional)
│   ├── Support copy
│   └── Donation button
│
├── Footer (mandatory)
│   ├── Privacy badge
│   ├── Terms of Use link
│   ├── Privacy Policy link
│   ├── Copyright
│   └── Version
│
└── options.js (ES6 module)
    ├── Import from lib/store.js
    ├── Import from lib/tiers.js
    ├── Settings handlers
    └── Feedback toast function
```

---

## Part 6: Action Items

### Immediate (Pre-GTM)

1. **Decide pricing model** for each extension
2. **Create standard options.html template** in 864z-build-kit
3. **Add options pages** to 5 oia-focus extensions
4. **Rebuild Signal2Noise options page** from scratch
5. **Add Terms/Privacy links** to Time2Focus, Signal2Noise, Bible-Insight
6. **Wire payment integration** for TuneOut2FocusIn

### Post-GTM

7. **Wire TabVault Pro tier** when ready
8. **Build Bible-Insight pricing** per CLAUDE.md spec
9. **Add Google Drive sync** to more extensions
10. **Unify donation flow** across all extensions

---

## Part 7: File Structure for Template

```
864z-build-kit/
├── templates/
│   └── options-page/
│       ├── options.html      # Standard HTML template
│       ├── options.css       # Standard CSS (extends OIA)
│       ├── options.js        # Standard JS skeleton
│       └── README.md         # Usage instructions
│
├── references/
│   └── extension/
│       └── options-page-spec.md   # This document (reference)
```

---

## Appendix A: CSS Classes Used

### OIA Design System Classes
- `.oia-screen` — Container
- `.oia-card` — Card wrapper
- `.oia-h1`, `.oia-h2` — Headings
- `.oia-body`, `.oia-body-sm` — Body text
- `.oia-caption` — Small text
- `.oia-tagline` — Brand tagline
- `.oia-btn`, `.oia-btn-primary`, `.oia-btn-secondary` — Buttons
- `.oia-input` — Form inputs
- `.oia-checkbox` — Checkboxes
- `.oia-mb-sm`, `.oia-mb-md`, `.oia-mb-lg` — Margin bottom
- `.oia-mt-sm`, `.oia-mt-md`, `.oia-mt-lg` — Margin top

### Options-Specific Classes (to standardize)
- `.options-container` — Page wrapper
- `.options-hero` — Hero section
- `.options-hero__brand` — Icon + title row
- `.options-hero__icon` — App icon
- `.options-hero__pitch` — Pitch text
- `.options-howto` — How to use section
- `.options-footer` — Footer
- `.options-footer__links` — Terms/Privacy links
- `.options-footer__copyright` — Copyright line
- `.setting-row` — Individual setting
- `.setting-info` — Label + description
- `.setting-select`, `.setting-input` — Form controls
- `.tier-badge` — Plan badge
- `.tier-features` — Feature list
- `.feature-list`, `.feature-list__item` — Upgrade features
- `.fuel-card` — Donation section
- `.privacy-badge` — Lock icon + text

---

## Appendix B: Element IDs (Standard)

| Purpose | ID |
|---------|-----|
| Upgrade button | `upgrade-btn` |
| Export button | `export-btn` |
| Import button | `import-btn` |
| Import file input | `import-file` |
| Fuel/Donate button | `fuel-btn` |
| Current tier badge | `current-tier-badge` |
| Tier description | `tier-description` |
| Drive section | `drive-section` |
| API key input | `api-key` |
| API key save | `api-key-save` |
| API key status | `api-key-status` |

---

*End of Review*
