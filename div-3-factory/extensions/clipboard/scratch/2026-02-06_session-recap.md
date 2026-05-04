# ClipBoard Session Recap
**Date:** 2026-02-06
**Project:** 864zeros / ClipBoard Extension

---

## Project Context

ClipBoard is a Chrome extension for capturing, organizing, and synthesizing web content. It's part of the 864zeros product suite.

**Directory:** `C:\Users\I820965\dev\864zeros\extensions\clipboard`

### Tier System
- **Free:** Text capture, page capture, tags, search, local export/import
- **Starter ($1.99):** Screenshots, AI summary
- **Pro ($3.99):** Marquee capture, AI auto-tag, AI vision, bulk ops, Google Drive sync
- **Power ($5.99):** InsightForge synthesis features

### Credit System
- Initial: 10 free credits on install
- Costs: ai-summary (1), ai-auto-tag (1), ai-vision (2), quick-summary (3), research-dossier (5), ask-clips (2)
- Packs: 20/$1.99, 50/$3.99, 100/$6.99

---

## What Was Built This Session

### InsightForge Template System

Implemented a template-based synthesis system allowing users to choose report types:

1. **Quick Summary (3 credits)**
   - Concise output: themes, insights, connections, summary
   - Fast, digestible overview

2. **Research Dossier (5 credits)**
   - Full analysis: executive summary, major themes, key findings, analytical insights, cross-source connections, open questions, conclusion
   - Includes source materials with thumbnails
   - Includes all tags from synthesized clips
   - Source captions with URL + capture date

### Key Implementation Details

**Template Selector Flow:**
- User clicks Synthesize → Template modal appears
- Shows credit cost for each template
- Validates credit balance before proceeding
- Stored in `lastSynthesisTemplate` for PDF/clipboard export

**Files Modified:**
```
sidepanel/main.js        - Template selector, dual render functions, PDF/clipboard awareness
sidepanel/styles.css     - Template modal, source cards, image wrappers, tag styles
sidepanel/index.html     - Template selector modal markup
background/service-worker.js - Template-based AI prompts, sources array, tags gathering
lib/constants.js         - Template credit costs (quick-summary: 3, research-dossier: 5)
```

**Key Functions:**
- `showTemplateSelector()` - Displays template choice modal
- `performSynthesis(template, cost)` - Executes synthesis with chosen template
- `showSynthesisResults(synthesis, newBalance, clipCount, template)` - Renders results
- `renderQuickSummary(synthesis, dateStr)` - Quick Summary HTML
- `renderResearchDossier(synthesis, dateStr)` - Research Dossier HTML
- `downloadSynthesisPDF()` - Template-aware PDF generation
- `synthesisToText(synthesis)` - Template-aware clipboard text

### Bugs Fixed
- Orphaned code after `renderResearchDossier` function (duplicate event handlers)
- PDF download always used Quick Summary format regardless of template
- Copy-to-clipboard always used Quick Summary format
- Inconsistent image sizing in PDF (now fixed height with object-fit: cover)

### Debug Helpers
Console commands available via `cb.*`:
```javascript
cb.status()       // Full status
cb.credits()      // Credit balance
cb.tier()         // Current tier
cb.setTier('power') // Set tier
cb.setCredits(100)  // Set credits
cb.tokens()       // LLM token usage + cost
cb.storage()      // IndexedDB usage
cb.synthesis()    // Inspect last synthesis response (NEW)
cb.help()         // Show all commands
```

---

## Architecture Notes

### Synthesis Data Flow
1. User selects clips → clicks Synthesize
2. `showTemplateSelector()` displays modal
3. User picks template → `performSynthesis(template, cost)`
4. Message sent to service worker: `SYNTHESIZE_CLIPS` with `{ clipIds, template }`
5. Service worker:
   - Checks credits via `canAfford(template)`
   - Fetches clips from IndexedDB
   - Builds AI prompt based on template type
   - Calls Gemini API via `analyze()`
   - For research-dossier: attaches `sources` array and `tags` array
   - Deducts credits
   - Returns synthesis object
6. `showSynthesisResults()` renders based on template
7. PDF/clipboard exports check `lastSynthesisTemplate` for correct format

### Synthesis Response Shape
```javascript
// Quick Summary
{ themes: [], insights: [], connections: [], summary: '' }

// Research Dossier
{
  executive_summary: '',
  themes: [],
  key_findings: [],
  insights: [],
  connections: [],
  questions: [],
  summary: '',  // Used as conclusion
  sources: [{ id, type, title, url, content, thumbnail, createdAt }],
  tags: [{ id, name, color }]
}
```

---

## Pricing Model Reference

**LLM Costs (Gemini Flash):**
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens
- Typical synthesis: ~2000 input, ~500 output = $0.0006

**Markup:** 400:1 ratio, 99.7% gross margin

---

## Future Work (Not Started)
- Fine-tune Research Dossier styling
- Visual Map template (8 credits) - relationship diagrams
- Stripe integration for credit packs
- Google Drive sync (Pro tier)
- Ask Clips conversational feature (2 credits)

---

## Quick Start for Next Session

```javascript
// In extension console:
cb.setTier('power')
cb.setCredits(20)
// Select 2+ clips, click Synthesize, test both templates
cb.synthesis() // Inspect last result
```

**Test Checklist:**
- [ ] Quick Summary renders correctly
- [ ] Research Dossier shows all sections
- [ ] Images display with source captions
- [ ] Tags appear at bottom
- [ ] PDF downloads correct format
- [ ] Copy to clipboard works
- [ ] Credits deducted properly
