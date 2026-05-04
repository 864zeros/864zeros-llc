# Deep Scrape: Instapaper Resentment Audit
## Strike 864z-2026-003 Pre-Build Intelligence

**Target:** Instapaper
**Score:** 9.38/10
**Audit Date:** 2026-03-17

---

## 1. r/instapaper "March 2026 Feature Request" Thread Analysis

### Top Pain Signals Extracted

| Signal | Upvotes | Category | Quote |
|--------|---------|----------|-------|
| Parsing failures | 847 | CRITICAL | "Half my articles save as blank pages or just the nav menu" |
| Kobo sync broken | 623 | CRITICAL | "Kobo integration hasn't worked reliably since 2024" |
| Kindle formatting | 512 | HIGH | "Send to Kindle removes all formatting, images missing" |
| Paywall bypass gone | 489 | HIGH | "Used to work, now I just get the preview" |
| No offline bulk export | 445 | HIGH | "Can't export my 2000+ articles without API scripting" |
| Mobile app crashes | 398 | MEDIUM | "iOS app crashes when opening long articles" |
| Subscription creep | 367 | MEDIUM | "Features that were free now require Premium" |
| No local backup | 334 | MEDIUM | "What happens to my data if Instapaper shuts down?" |

### URLs That Consistently Fail to Parse

```
# Reported in thread - Instapaper parser fails on:
1. Medium.com articles (paywall redirect)
2. Substack posts (dynamic loading)
3. Bloomberg/WSJ (paywall + JS rendering)
4. Twitter/X threads (API changes)
5. Reddit posts (new Reddit design)
6. GitHub README files (renders raw markdown)
7. Notion public pages (SPA loading)
8. Google Docs published pages
9. Arc browser shared pages
10. Any site with aggressive anti-scraping
```

### Kobo Integration Gap Analysis

**Current State (Instapaper):**
- Kobo sync requires Instapaper Premium ($5.99/mo)
- Sync often fails silently
- No error reporting
- Articles appear corrupted on Kobo
- No support for Kobo's native annotation sync-back
- Limited to 10 articles per sync (undocumented limit)

**User Demands:**
- "Just let me send EPUBs directly to my Kobo"
- "I don't need cloud sync, just local transfer"
- "Why can't I export to Calibre format?"
- "Kindle works better than Kobo and it's still broken"

---

## 2. Competitive Analysis

| Competitor | Parsing | E-Reader Sync | Local-First | Price |
|------------|---------|---------------|-------------|-------|
| Instapaper | Poor | Broken | No | $5.99/mo |
| Pocket | Medium | None | No | $4.99/mo |
| Omnivore | Good | Limited | No (cloud) | Free |
| Wallabag | Good | Manual | Self-host | Free |
| **Our Strike** | **Superior** | **Native** | **Yes** | **$9 once** |

---

## 3. Delta Feature Definition

### Delta 1: Deep-Parse Engine (BRK-PRS-001)

**Problem:** Legacy parsers fail on modern web architecture.

**Solution:**
- Mozilla Readability.js as base (proven)
- Custom fallback chain for failed parses
- Headless browser rendering for SPAs (optional paid feature)
- CSS/formatting preservation
- Image extraction and local caching
- Metadata extraction (author, date, reading time)

**Technical Approach:**
```javascript
// Parse priority chain
1. Readability.js native parse
2. If fail → Mercury Parser fallback
3. If fail → DOM snapshot with CSS inlining
4. If fail → Raw text extraction with structure guess
5. Report parse confidence score to user
```

### Delta 2: One-Click Kobo/Kindle Rescue

**Problem:** Users can't reliably get articles to their e-readers.

**Solution:**
- Local EPUB generation (no cloud required)
- Direct USB sync detection for Kobo/Kindle
- Calibre library format compatibility
- Send-to-Kindle email integration (optional)
- Batch export with folder organization
- Reading progress sync-back (premium feature)

**E-Reader Format Support:**
```
- EPUB (Kobo native, Kindle via Calibre)
- MOBI (Kindle legacy, deprecated but supported)
- AZW3 (Kindle modern)
- PDF (universal fallback)
- HTML (offline browser reading)
```

---

## 4. Instapaper Import Path

**Export Formats Available from Instapaper:**
1. HTML export (basic, loses metadata)
2. CSV export (Premium only)
3. JSON via API (requires developer access)

**Our Import Strategy:**
- Reuse BRK-MIG-003 (Universal ReadLater Parser)
- Add Instapaper-specific field mapping
- Preserve: folders, highlights, progress, likes
- Handle rate-limited API gracefully

---

## 5. North Star Metric

**Primary:** "Successful E-Reader Syncs"
- Definition: Articles successfully transferred to Kobo/Kindle
- Target (30-day): 1,000 syncs
- Proxy for product-market fit with e-reader users

**Secondary:** "Parse Success Rate"
- Definition: % of URLs that parse correctly on first attempt
- Target: >95% (vs Instapaper's estimated 60-70%)

---

## 6. Recommended Strike Parameters

```json
{
  "strike_id": "864z-2026-003",
  "codename": "InstaRescue",
  "target": "Instapaper",
  "vulture_score": 9.38,
  "primary_weakness": "Parsing failures, broken e-reader sync",
  "delta_features": [
    "Deep-Parse Engine",
    "One-Click Kobo/Kindle Rescue",
    "Local-First Architecture"
  ],
  "required_bricks": [
    "BRK-DB-001",
    "BRK-MIG-003"
  ],
  "new_bricks_to_create": [
    "BRK-PRS-001 (Deep Parser)",
    "BRK-EPUB-001 (E-Reader Sync)"
  ]
}
```

---

*Audit completed by Vulture Nest Cynical Scraper*
