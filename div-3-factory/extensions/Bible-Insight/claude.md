# Bible Insight — Project Identity
## FHG Brand | 864zeros LLC
**Version:** 1.0.0
**Created:** 2026-02-16
**Vulture Score:** 9.2 / 10 — Hard Tier 1
**Status:** Approved for build (after Thaw ships first revenue)

---

## What This Is

Bible Insight is a Chrome side panel extension for Bible study, sermon note-taking, and theological research. It is NOT built from scratch — it is a vertical re-skin of **JCz WebInsight** (v2.1.0, Manifest V3), an existing, fully functional AI-powered web research extension.

WebInsight already provides: content capture (5 modes), dual AI tagging (local TensorFlow.js + cloud Gemini), tag-based organization (IndexedDB relational model), key points generation, PDF report generation, project export, Google Drive backup, and a Chrome side panel architecture.

Bible Insight layers Bible-specific intelligence on top of this proven engine.

---

## Brand Identity

**Brand Pillar:** FHG (For His Glory)
**Audience:** Christian men engaged in Bible study, sermon note-taking, and theological research
**Palette:** Charcoal (#2D2D2D) primary, Bronze (#A67C52) accent
**Tone:** Reverent, masculine, purposeful — "Rest. Create. For His Glory."

### Brand Firewall (NON-NEGOTIABLE)
- Bible Insight is an FHG product. It must NEVER reference OIA, 864zeros, or WebInsight in any user-facing surface
- Separate Chrome Web Store listing under FHG publisher identity
- Separate social handles, separate support email, separate privacy policy
- The WebInsight engine is internal infrastructure only — invisible to consumers
- OIA and FHG audiences must never cross-contaminate

---

## Base Platform: JCz WebInsight

### What WebInsight Already Provides (Zero Build Effort)

These features exist, are functional, and carry over directly:

**Content Capture Engine (5 modes):**
- Save Page — extracts visible text, metadata (OpenGraph, Twitter cards, JSON-LD), links, authorship, publish dates, site structure
- Save Selection — highlighted text only, with source URL and context
- Save as PDF — full-page PDF capture via Chrome DevTools Protocol
- Capture Visible — screenshot of the current viewport
- Capture Area — draw-to-clip rectangle for specific regions (sermon slides, diagrams, infographics)

**AI-Powered Tagging (dual-mode):**
- Local path: keyword-based TensorFlow.js model (~25 MB), generates embeddings, suggests tags via cosine similarity
- Cloud path: Google Gemini 1.5 for richer analysis including image description, diagram/chart interpretation, layout analysis
- User chooses: "local-first," "cloud-first," or "ask each time"
- Privacy-first architecture — local mode means data never leaves device

**Tag-Based Organization:**
- IndexedDB with three stores: `contentItems`, `tags`, `contentTags` (relational junction table)
- Clickable tag filter list in side panel
- Tag embedding regeneration on demand

**Key Points Generation:**
- Select a tag → aggregates all text items → sends to Gemini → returns structured summary
- Results displayed in panel and saved as `generated_analysis` item in database

**PDF Report Generation:**
- Styled HTML reports with: overview, key-points summary, tag analysis, per-item sections with content + AI analysis + screenshots
- Converted to PDF via Chrome DevTools Protocol debugger API

**Project Export:**
- Export all items for a given tag as single JSON file
- Designed for feeding into external AI tools

**Data Management:**
- Full import/export of entire IndexedDB as JSON backup
- Auto-backup scheduling: daily, weekly, monthly
- Google Drive integration for cloud storage (OAuth configured)

**Settings & Customization:**
- Gemini API key management
- AI mode preference
- Theme/appearance
- Report generation defaults (cloud assist, auto key-points, figure captions, tag normalization, risks section, markdown export, token/cost caps)

**Data Viewer:**
- Debug page (`data_viewer.html`) showing raw IndexedDB across all three stores
- Per-store JSON export

**Chrome Side Panel Architecture:**
- Persistent, always-visible panel alongside any webpage
- Does not vanish when user clicks elsewhere (unlike popup extensions)
- Side-by-side with Bible text, sermon video, or any web content

---

## Competitive Landscape

### Market Size
- Bible software market: $1.6B (2025) → $2.1B (2034), 2.95% CAGR
- YouVersion: 800M downloads, 12M daily active users
- Bible Gateway: 150M+ monthly views

### Key Competitors & Their Weaknesses

| Competitor | Strength | Friction Point (Our Opening) |
|---|---|---|
| **YouVersion** | 800M downloads, dominant | Notes are "cumbersome," no export, no color highlight sorting, no meaningful note browsing |
| **Olive Tree** | 4.6+ stars, beloved | Limited annotation, no AI features |
| **Logos** | 6M+ users, deep theology | Enterprise/seminary pricing, complex UI |
| **Spirit Notes** | Church notes specialist | No AI, limited organization, data loss complaints |
| **Bible Notes App** | Sermon recording + notes | Recordings crash, "all notes GONE," surprise subscriptions |
| **Pencil Bible** | Apple Pencil annotation | Annotations shift between devices, iPad-only |
| **BibleGateway** | Massive web traffic | Post-update users lost years of annotations |

### Our Differentiators
1. **Persistent side panel** — always visible alongside any webpage (no context-switching)
2. **Dual AI (local-first privacy)** — "Your Bible study notes never leave your device"
3. **YouTube sermon transcript extraction** with timestamped notes (no competitor does this)
4. **Auto verse detection + cross-referencing** powered by AI embeddings
5. **Key points synthesis** — "Summarize everything I've saved about grace"

---

## Feature Bricks (Reusable Across 864zeros Products)

| Brick ID | Name | Purpose | Reusable In |
|---|---|---|---|
| **TR-06** | YouTube Transcript Engine | Detect YouTube video → extract captions with timestamps → clean/format | Research tools, meeting notes, educational apps, content analysis |
| **TR-07** | Bible Verse Detection Engine | Regex + NLP to detect all Bible reference formats → auto-link via API.Bible (1,500+ translations) | Any FHG product, devotional apps, church management tools |

---

## Legal Boundaries

| Approach | Legal Status | Decision |
|---|---|---|
| YouTube transcript extraction (public captions) | Clean — proven precedent, dozens of extensions do this | **BUILD** |
| YouTube audio recording | Violates YouTube ToS + DMCA risk | **DO NOT BUILD** |
| Microphone recording (live sermons via Web Speech API) | Clean — user records own environment | **Phase 2** |
| Bible text (KJV, ASV, WEB) | Public domain — no licensing cost | **USE FREELY** |
| Bible text (ESV, NIV, NLT) | Copyrighted — requires API.Bible for access | **USE VIA API ONLY** |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              BIBLE INSIGHT (FHG SKIN)                │
│  FHG visual theme, theological tag vocabulary,       │
│  verse detection, cross-references, devotional mode  │
├─────────────────────────────────────────────────────┤
│           YOUTUBE INTEGRATION LAYER                  │
│  Video detection, transcript extraction (TR-06),     │
│  player sync, timestamped notes, transcript nav      │
├─────────────────────────────────────────────────────┤
│           BIBLE INTELLIGENCE LAYER                   │
│  Verse detection (TR-07), API.Bible linking,         │
│  cross-reference engine, theological AI prompts      │
├─────────────────────────────────────────────────────┤
│              WEBINSIGHT ENGINE (CORE)                 │
│  Content capture (5 modes), dual AI tagging,         │
│  IndexedDB storage, key points, PDF reports,         │
│  project export, Google Drive backup, settings       │
└─────────────────────────────────────────────────────┘
```

---

## Monetization (Planned)

- **Free:** Core capture + tagging + 3 AI summaries/day
- **Pro ($4.99/mo or $29.99/yr):** Unlimited AI, cross-references, PDF reports, sermon study documents, Google Drive backup
- **Strip-Mining:** TR-06 and TR-07 bricks sold separately as B2B code ($200-$1,500 each)

---

## Success Metrics (First 30 Days Post-Launch)

| Metric | Target |
|---|---|
| Chrome Web Store installs | 500 |
| Reviews | 50 |
| Rating | 4.0+ stars |
| Free → Pro conversion | 5% |
| MRR | $250 |

---

*This is a 864zeros LLC product under the FHG brand pillar.*
*The Operator owns this build.*
