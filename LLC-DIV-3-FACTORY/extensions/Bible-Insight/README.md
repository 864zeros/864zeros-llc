# Bible Insight

**Your Bible study, captured locally. AI-assisted. For His Glory.**

A Chrome side-panel extension for Bible study, sermon note-taking, and theological research. Built on the WebInsight engine. Local-first. Privacy-respecting.

FHG (For His Glory) — *a 864zeros LLC product*
Manifest V3 | Vulture Score: 9.2/10 (Hard Tier 1) | Status: Approved for build (post-revenue gate)

---

## The Hook (Marketing)

### The Friction
Bible software in 2026 is fractured between three failure modes:

- **YouVersion** has 800M downloads but its notes are "cumbersome," uneditable in bulk, and there's no way to export your years of highlights. Your annotations are theirs.
- **Logos** is the gold standard for serious theology, but pricing starts at seminary-tier.
- **Spirit Notes / Bible Notes App** users routinely report data loss — entire years of sermon notes vanishing after app updates.

Bible Insight is the rescue product:

- **Persistent side panel** — your study notes sit beside any Bible website, sermon video, or theological article. No context-switching. Always visible.
- **Dual AI (local-first)** — choose local TensorFlow.js for privacy, or Gemini cloud for richer analysis. "Your Bible study notes never leave your device" is a real claim, not marketing.
- **YouTube sermon transcript extraction** — paste a sermon URL, get clean timestamped transcripts. No competitor does this. Take notes synced to the speaker's words.
- **Auto verse detection** — references like "John 3:16" or "Rom 8:28-30" are automatically detected, linked to API.Bible (1,500+ translations), and indexed for cross-reference.
- **Key points synthesis** — "summarize everything I've saved about grace" → AI consolidates your tag-grouped highlights into a coherent essay.
- **Export everything** — full IndexedDB to JSON, structured PDF reports, Google Drive backup. Your work is yours.

### Who This Is For
- Pastors preparing weekly sermons
- Bible study group leaders compiling reference material
- Seminary students managing research across articles, lectures, and texts
- Lay Christians who want a serious study tool without seminary pricing

### Brand Note
Bible Insight is an FHG (For His Glory) product. **It does not reference 864zeros, OIA, or WebInsight in any user-facing surface.** The WebInsight engine is internal infrastructure — invisible to consumers. Separate Chrome Web Store listing under FHG publisher identity.

---

## The Commercial Gate (Sales)

### GTM Status
**Engineering:** Vertical re-skin of WebInsight v2.1 (proven engine). Brand-firewalled from OIA/864zeros. **Status: Approved for build, gated behind first-revenue milestone of another product (currently waiting on Thaw to ship).**

**Outstanding before Chrome Web Store launch:**
- API.Bible API key + integration testing (verse linking depends on this)
- TR-06 YouTube Transcript Engine integration tested across YouTube layout updates
- TR-07 Bible Verse Detection Engine — regex/NLP coverage of all common reference formats
- FHG branding pass (Charcoal #2D2D2D + Bronze #A67C52, Reverent/Masculine tone)
- Privacy policy explicitly carving out Bible study data from any general 864zeros policy
- Marketing site at FHG domain (separate from 864zeros.com)
- Beta cohort: 50 sermon-noting pastors

### T-Shirt Size
**M-L** — built on WebInsight base, but Bible-specific intelligence layer (verse detection, API.Bible linking, YouTube transcript) is non-trivial. Estimate 80-120 hours from current state to v1 launch.

### Tier Structure (planned)

| Tier | Price | What It Unlocks |
|---|---|---|
| **Free** | $0 | Core capture + tagging + 3 AI summaries/day |
| **Pro** | $4.99/mo or $29.99/yr | Unlimited AI, cross-references, PDF reports, sermon study documents, Google Drive backup |

Strip-mining option: TR-06 (YouTube Transcript Engine) and TR-07 (Bible Verse Detection Engine) sold separately as B2B code licenses ($200-$1,500 each). Other Christian-tech builders can license the IP.

### Revenue Model
- **Direct subscription**: $4.99/mo with strong conversion expected from the seminary-student cohort (priced below Logos)
- **B2B brick licensing**: TR-06 / TR-07 modules to other Christian-tech apps
- **30-day target** (post-launch): 500 installs, 50 reviews, 4.0+ star rating, 5% free→Pro conversion, $250 MRR

### Competitive Posture

| Competitor | Their Strength | Our Opening |
|---|---|---|
| YouVersion | 800M downloads | Notes cumbersome; no export; no color highlight sorting |
| Olive Tree | Beloved, 4.6+ stars | No AI features |
| Logos | Deep theology | Seminary-tier pricing |
| Spirit Notes | Church notes | Recent data-loss complaints |
| BibleGateway | Massive web traffic | Users report losing years of annotations after updates |

---

## Technical Blueprint (Tech)

### Brick Registry

| Brick ID | Category | Input → Process → Output | Complexity | Source |
|---|---|---|---|---|
| `agent-content-capture-5mode` | Capture | Trigger (selection/visible/area/PDF/page) → DOM extraction → IndexedDB save | M | inherited from WebInsight `js/content.js` + `background.js` |
| `agent-page-metadata` | Capture | Document → OpenGraph + Twitter + JSON-LD + author/publisher → metadata object | XS | `js/lib/metadata.js` |
| `agent-pdf-generator` | Capture | `{tabId, preset}` → Chrome DevTools Protocol → PDF blob | S | `js/lib/pdf-generator.js` |
| **`TR-06`** `agent-youtube-transcript` | Capture | YouTube video URL → caption track extraction → cleaned timestamped transcript | M | NEW for Bible Insight (also reusable in B2B) |
| **`TR-07`** `agent-bible-verse-detector` | Analysis | Text content → regex+NLP for all reference formats → API.Bible link generation | M | NEW for Bible Insight (also reusable in B2B) |
| `agent-local-ai-keywords` | Analysis | Text → TensorFlow.js embeddings → suggested tags | S | `js/lib/local-ai.js` |
| `agent-ai-gemini-bridge` | Analysis | Text/image → Gemini Pro/Vision → structured JSON | S | inherited from WebInsight |
| `agent-anonymizer-pii` | Analysis | text → strip PII → safe-for-AI text | S | adapted from clipboard `lib/redactor.js` |
| `agent-keypoints-synthesis` | Analysis | Tag → aggregate all linked text items → Gemini → structured key-points summary | M | inherited from WebInsight `handleGetKeyPoints` |
| `agent-pdf-report-builder` | Export | Tag selection → styled HTML (overview + summary + per-item) → PDF via CDP | M | inherited from WebInsight |
| `agent-json-report-export` | Export | Tag → LLM-friendly JSON shape `{title, sections, content, images}` | S | inherited from WebInsight |
| `agent-drive-sync` | Export | Full IndexedDB JSON → Drive appdata folder | M | inherited from clipboard `lib/google-drive/drive-client.js` |
| `agent-indexeddb-store` | Infra | 3-store schema: contentItems / tags / contentTags (junction) | S | inherited from WebInsight `js/lib/db.js` |

**B2B-Sellable Bricks:** TR-06 (YouTube Transcript Engine) and TR-07 (Bible Verse Detection Engine) are explicitly designed for resale to other Christian-tech builders. Documented contracts, MIT-or-similar license, single-purpose APIs.

### Architecture

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

### Installation (development)

```bash
cd C:\dev\864zeros-llc\LLC-DIV-3-FACTORY\extensions\Bible-Insight
# No npm install needed — vanilla JS

# Load in Chrome:
# chrome://extensions → Developer mode → Load unpacked → select this directory
```

### AI Configuration

**Local AI (default for free tier):**
- TensorFlow.js model (~25MB) bundled with extension
- Runs entirely in service worker / offscreen document
- No API keys, no API costs, no network round-trip
- Limitation: keyword/embedding-based; cannot describe images or do complex reasoning

**Cloud AI (Pro tier):**
- Gemini 1.5 Pro / Gemini Vision via Google AI API
- User-supplied API key, stored in `chrome.storage.local`
- Endpoints (configurable): `analyzeTextWithGemini`, `analyzeImageWithGemini`, `handleGetKeyPoints`
- Privacy: PII redacted before transmission via `agent-anonymizer-pii`

**API.Bible (always required for verse linking):**
- Free tier: 5,000 requests/month
- Required for: TR-07 verse detection → live verse text retrieval
- Sign up at scripture.api.bible

### Permissions Used

| Permission | Why |
|---|---|
| `activeTab`, `scripting`, `tabs` | Inject content capture across any URL |
| `storage`, `unlimitedStorage` | IndexedDB for study notes (potentially many years' worth) |
| `contextMenus` | Right-click "Save to Bible Insight" |
| `sidePanel` | Persistent panel beside any page |
| `alarms` | Auto-backup scheduling |
| `debugger` | PDF generation via Chrome DevTools Protocol |
| `downloads` | Local export trigger |
| `<all_urls>` | Capture from any Bible website, sermon video page, theological article |

### Legal Boundaries

| Approach | Status |
|---|---|
| YouTube transcript extraction (public captions) | ✓ Clean — proven precedent |
| YouTube audio recording | ✗ DO NOT BUILD (DMCA risk) |
| Microphone recording (live sermons via Web Speech API) | Phase 2 |
| KJV / ASV / WEB Bible text | ✓ Public domain |
| ESV / NIV / NLT Bible text | Use via API.Bible only (copyrighted) |

---

*FHG (For His Glory). A 864zeros LLC product.*
*Bible Insight: rest, create, study — for His Glory.*
