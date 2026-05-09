# Bible Insight — Build Specification
## Everything Needed to Ship This Extension
**Version:** 1.0.0
**Created:** 2026-02-16
**Base:** JCz WebInsight v2.1.0 (Manifest V3, Chrome Side Panel)
**Estimated Build:** 18-22 days total | MVP critical path ~10 days

---

## Build Philosophy

This is a **re-skin and extend** operation, NOT a ground-up build. WebInsight is the engine. Bible Insight is the vertical skin. The rule: **do not modify core WebInsight functionality unless absolutely necessary.** Layer new features on top. Keep the engine clean for future verticals (legal research, medical research, student research, ADHD research via OIA).

---

## PHASE 0: Pre-Build Setup (Day 0)

### 0.1 Fork & Rebrand Repository
- [ ] Fork/copy WebInsight codebase into new `bible-insight` repo
- [ ] Remove all "JCz WebInsight" branding from user-facing surfaces
- [ ] Update `manifest.json`: name, description, version (1.0.0), icons
- [ ] Set new extension ID for Chrome Web Store

### 0.2 FHG Brand Assets
- [ ] Create extension icon set (16px, 32px, 48px, 128px) — FHG charcoal/bronze, Bible-inspired motif
- [ ] Create Chrome Web Store promotional images (440x280, 920x680, 1400x560)
- [ ] Draft Chrome Web Store description and screenshots
- [ ] Set up FHG publisher account (separate from OIA)

### 0.3 API Keys & Services
- [ ] Register for API.Bible developer account (free, 1,500+ translations)
- [ ] Verify existing Gemini API key works or provision new one for FHG
- [ ] Set up Google Drive OAuth credentials under FHG identity

---

## PHASE 1: FHG Visual Theme (Days 1-2)

### What Changes
The entire UI gets the FHG skin. WebInsight's existing theme/appearance system should support this without structural changes.

### 1.1 Color System
```css
/* FHG Palette */
--fhg-charcoal: #2D2D2D;        /* Primary text, headers */
--fhg-bronze: #A67C52;           /* Accent, buttons, links */
--fhg-bronze-light: #F0E6D8;    /* Subtle backgrounds */
--fhg-cream: #FDFCF8;           /* Page background */
--fhg-warm-white: #F8F6F1;      /* Card backgrounds */
--fhg-taupe: #D4CFC8;           /* Borders, dividers */
--fhg-sage: #717D71;            /* Secondary accent (subtle) */
--fhg-error: #C94C4C;           /* Errors, warnings */
--fhg-success: #5B8C5A;         /* Success states */
```

### 1.2 Typography
- Primary font: Nunito (consistent with OIA design system for internal consistency, but FHG-branded in presentation)
- If a more distinctive faith feel is needed: consider Lora (serif) for headings with Nunito for body

### 1.3 UI Elements to Reskin
- [ ] Side panel header (logo, title → "Bible Insight")
- [ ] Side panel navigation/tabs
- [ ] Tag chips and filter pills
- [ ] Capture mode buttons
- [ ] Settings/options page
- [ ] PDF report template header, footer, and accent colors
- [ ] Data viewer page (low priority — debug tool)
- [ ] All alert/toast/notification styles

### 1.4 PDF Report Template
- [ ] Rename from "JC WebInsight Research Report" to "Bible Insight Study Report"
- [ ] Replace accent colors with FHG charcoal/bronze
- [ ] Add report sections specific to Bible study: "Verses Referenced," "Theological Themes," "Personal Reflections"
- [ ] Keep existing report structure (overview, key-points, tag analysis, per-item sections)

---

## PHASE 2: Feature Brick TR-07 — Bible Verse Detection Engine (Days 3-4)

### Purpose
Detect Bible verse references in any text body and return structured verse objects. This is a standalone, reusable module.

### 2.1 Reference Format Detection (Regex + NLP)

Must handle ALL common formats:

```
Standard:          John 3:16, Romans 8:28, 1 Corinthians 13:4-7
Abbreviated:       Jn 3:16, Rom 8:28, 1 Cor 13:4-7
Range:             Genesis 1:1-3, Ps 23:1-6
Multi-verse:       Matt 5:3,5,7 or Matt 5:3-7,9
Multi-chapter:     John 3:16-4:2
Book only:         Psalm 23, Genesis 1
With "verse/v":    John 3 v16, John 3 verse 16
Parenthetical:     (John 3:16), (see Rom 8:28)
Inline:            "...as it says in Romans 8:28..."
```

### 2.2 Book Name Mapping

Full canonical names + all common abbreviations for all 66 books:
```javascript
const BOOK_MAP = {
  "genesis": { id: "GEN", abbrevs: ["gen", "ge", "gn"] },
  "exodus": { id: "EXO", abbrevs: ["exo", "exod", "ex"] },
  "leviticus": { id: "LEV", abbrevs: ["lev", "le", "lv"] },
  // ... all 66 books with standard API.Bible IDs
  "revelation": { id: "REV", abbrevs: ["rev", "re", "rv", "apocalypse"] },
};
```

### 2.3 API.Bible Integration

```javascript
// Endpoint: GET /v1/bibles/{bibleId}/verses/{verseId}
// Free API, 1,500+ translations
// Key translations to support at launch:
const DEFAULT_BIBLES = {
  "KJV": "de4e12af7f28f599-02",   // Public domain
  "ASV": "06125adad2d5898a-01",   // Public domain
  "WEB": "9879dbb7cfe39e4d-04",   // Public domain
  "ESV": "...",                    // Licensed (via API only)
  "NIV": "...",                    // Licensed (via API only)
  "NLT": "...",                    // Licensed (via API only)
};
```

### 2.4 Output Structure

```javascript
// detectVerses(text) returns:
[
  {
    reference: "Romans 8:28",
    book: "ROM",
    chapter: 8,
    startVerse: 28,
    endVerse: 28,
    matchedText: "Romans 8:28",      // Original text that was matched
    position: { start: 142, end: 154 }, // Character position in source text
    fullText: null,                     // Populated after API.Bible fetch
    translation: "KJV",
  }
]
```

### 2.5 Integration Points
- Runs on: saved content items (after capture), YouTube transcripts (after extraction), user notes (on save)
- Display: inline verse tooltips (hover to see full text), verse sidebar in study mode
- Storage: detected verses saved as metadata on the parent `contentItem` in IndexedDB

### 2.6 Module Boundary (Brick Rules)
- [ ] Self-contained in `/core/verse-detection/` directory
- [ ] Zero dependencies on Bible Insight UI — pure input/output
- [ ] Exported functions: `detectVerses(text)`, `fetchVerseText(reference, translationId)`, `getBookInfo(bookName)`
- [ ] Own test suite: unit tests for all reference formats
- [ ] README with usage examples for other projects

---

## PHASE 3: Feature Brick TR-06 — YouTube Transcript Engine (Days 5-7)

### Purpose
Detect YouTube video on active tab, extract caption/transcript data with timestamps, clean and format into structured text. Standalone, reusable module.

### 3.1 YouTube Video Detection

```javascript
// Content script: detect YouTube video
function isYouTubeVideo(url) {
  return /youtube\.com\/watch\?v=/.test(url) ||
         /youtu\.be\//.test(url);
}

// Listen for tab URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && isYouTubeVideo(changeInfo.url)) {
    // Trigger transcript UI in side panel
    chrome.runtime.sendMessage({ type: 'youtube_detected', tabId, url: changeInfo.url });
  }
});
```

### 3.2 Transcript Extraction Methods

**Method 1: DOM Scraping (Primary)**
YouTube renders captions in the page. Access via `ytInitialPlayerResponse` or the timedtext endpoint that YouTube's own player uses.

```javascript
// Extract from YouTube's internal player data
// The timedtext URL is embedded in the player response
// Format: https://www.youtube.com/api/timedtext?v={videoId}&lang={lang}
async function extractTranscript(videoId) {
  // 1. Get player page HTML
  // 2. Parse ytInitialPlayerResponse for captionTracks
  // 3. Fetch the timedtext XML/JSON
  // 4. Parse into structured format
}
```

**Method 2: YouTube Data API (Fallback)**
If DOM scraping fails (YouTube changes structure), fall back to the official `captions` endpoint.

```
GET https://www.googleapis.com/youtube/v3/captions?videoId={id}&part=snippet
```
Note: This requires OAuth and has quota limits. Use as fallback only.

### 3.3 Output Structure

```javascript
// extractTranscript(videoId) returns:
{
  videoId: "dQw4w9WgXcQ",
  title: "Pastor Mike: Romans 8 Deep Dive",
  channel: "Grace Community Church",
  duration: 2847,                    // seconds
  language: "en",
  segments: [
    {
      startTime: 0.0,               // seconds
      endTime: 4.2,
      text: "Good morning church.",
      startTimeFormatted: "0:00",    // Human readable
    },
    {
      startTime: 4.2,
      endTime: 9.8,
      text: "Today we're going to look at Romans chapter 8.",
      startTimeFormatted: "0:04",
    },
    // ...
  ],
  fullText: "Good morning church. Today we're going to look at...", // All segments joined
  metadata: {
    uploadDate: "2026-01-15",
    thumbnailUrl: "...",
    viewCount: 1523,
  }
}
```

### 3.4 Transcript Cleaning
- Remove duplicate segments (YouTube sometimes sends overlapping captions)
- Fix common auto-caption errors (lowercase "god" → "God", "bible" → "Bible", common proper nouns)
- Merge segments that are split mid-sentence
- Strip formatting artifacts ([Music], [Applause], etc.) — make configurable

### 3.5 Module Boundary (Brick Rules)
- [ ] Self-contained in `/core/youtube-transcript/` directory
- [ ] Zero dependencies on Bible Insight UI
- [ ] Exported functions: `isYouTubeVideo(url)`, `extractTranscript(videoId)`, `getVideoMetadata(videoId)`
- [ ] Own test suite
- [ ] README with usage examples

---

## PHASE 4: YouTube Integration Layer (Days 8-10)

This phase wires TR-06 into the Bible Insight UI with Bible-specific intelligence.

### 4.1 YouTube Player State Sync

```javascript
// Communicate with YouTube player via postMessage / content script
// Read current playback position
function getCurrentTimestamp(tabId) {
  // Inject content script that reads:
  // document.querySelector('video').currentTime
  // Returns seconds as float
}

// Seek to specific timestamp
function seekTo(tabId, seconds) {
  // Inject: document.querySelector('video').currentTime = seconds;
}
```

### 4.2 Live Note Timestamping
- While YouTube video plays, user types notes in the side panel
- Each note auto-captures current video timestamp on creation
- Notes displayed with clickable timestamp badges: `[12:34]`
- Clicking timestamp sends `seekTo()` command to the YouTube player
- Notes stored as `contentItem` entries in IndexedDB with `timestamp` metadata field

### 4.3 Transcript View in Side Panel
- When YouTube detected: show "Sermon Mode" tab in side panel
- Display full transcript with clickable timestamps
- As video plays, auto-scroll transcript to current position (highlight active segment)
- User can click any transcript segment to jump video to that moment
- Search within transcript

### 4.4 Transcript + Verse Detection Integration
- After transcript extracted, automatically run TR-07 (verse detection) over the full text
- Detected verses highlighted in transcript view with bronze accent
- Clicking a detected verse shows: full passage text (via API.Bible), cross-references, option to save to study library
- "Verses Found" summary panel showing all verses mentioned in the sermon

### 4.5 Video Metadata Extraction
- Adapt WebInsight's existing metadata extraction for YouTube-specific selectors
- Pull: video title, channel name, upload date, description, thumbnail URL, view count
- Auto-generate tags from: channel name, video title keywords, detected Bible books

### 4.6 Sermon Study Document Generator
- One-click output combining:
  1. Video metadata (title, preacher, date, channel)
  2. Full transcript (with timestamps)
  3. User's timestamped notes (interleaved chronologically)
  4. All detected verses (with full text from API.Bible)
  5. AI-generated key points summary
  6. Cross-references and theological theme connections
- Output formats: styled PDF (via existing PDF engine), JSON export, Markdown
- This is the "killer output" no competitor offers

---

## PHASE 5: Theological Intelligence (Days 11-14)

### 5.1 Theological Tag Seed Vocabulary

Pre-built tag library that seeds the AI tagging model:

**Books of the Bible (66 tags):**
Genesis, Exodus, Leviticus, ..., Revelation

**Theological Themes (30+ tags):**
Grace, Faith, Prayer, Salvation, Forgiveness, Redemption, Sanctification, Justification, Atonement, Covenant, Prophecy, Wisdom, Love, Hope, Mercy, Justice, Righteousness, Sin, Repentance, Baptism, Communion, Holy Spirit, Trinity, Kingdom of God, Second Coming, Resurrection, Spiritual Warfare, Discipleship, Worship, Suffering

**Sermon Metadata Tags:**
Sermon Series, Preacher Name (dynamic), Church Name (dynamic), Date, Sunday Service, Wednesday Bible Study, Small Group, Conference, Retreat

### 5.2 Cross-Reference Engine

**Data Source:** Treasury of Scripture Knowledge (public domain, 572,000+ cross-references)
- Download and index as JSON lookup: `{ "ROM.8.28": ["JER.29.11", "GEN.50.20", "PHP.1.6", ...] }`
- When user saves a verse, display top 5-10 cross-references
- "Explore" action: user clicks a cross-reference → fetches full text → option to save

**AI-Enhanced Cross-References:**
- Beyond the static Treasury lookup, use Gemini to suggest thematic connections:
  - "You saved Romans 8:28 and your notes mention struggling with a job loss. Related passages about God's plan in hardship: ..."
- This is the differentiator — personalized, context-aware theological insight

### 5.3 Devotional Mode

A simplified panel view for daily quiet time:
- Shows one saved verse (random from library, or from a reading plan)
- AI-generated reflection prompt: "How does this verse speak to what you're going through?"
- Minimal UI — no research chrome, no capture buttons, just the verse + prompt + journal entry box
- Journal entries saved as `contentItem` entries tagged with "Devotional" + date
- Optional: daily reminder notification via Chrome notifications API

---

## PHASE 6: Data Model Extensions (Woven Throughout)

### 6.1 IndexedDB Schema Additions

The existing three stores (`contentItems`, `tags`, `contentTags`) remain unchanged. Add metadata fields to `contentItems`:

```javascript
// New fields on contentItem for Bible Insight
{
  // ... existing WebInsight fields ...

  // Bible-specific metadata
  detectedVerses: [
    { reference: "Romans 8:28", book: "ROM", chapter: 8, startVerse: 28, endVerse: 28 }
  ],
  verseFullText: { "ROM.8.28.KJV": "And we know that all things..." },

  // YouTube-specific metadata
  youtubeVideoId: "abc123",
  youtubeTimestamp: 742.5,          // seconds — when this note was taken
  youtubeChannel: "Grace Community Church",
  sermonTitle: "Romans 8 Deep Dive",
  sermonDate: "2026-01-15",

  // Content type flag
  contentType: "note" | "verse" | "sermon_transcript" | "sermon_note" | "devotional" | "article" | "screenshot" | "pdf",
}
```

### 6.2 New IndexedDB Store: `crossReferences`

```javascript
// Treasury of Scripture Knowledge lookup
{
  verseId: "ROM.8.28",
  references: ["JER.29.11", "GEN.50.20", "PHP.1.6", "PSA.46.10", ...],
  source: "treasury"    // "treasury" | "ai_generated"
}
```

### 6.3 Backward Compatibility
- All new fields are OPTIONAL additions to existing schema
- WebInsight data imported into Bible Insight should work without migration
- Bible Insight data exported should degrade gracefully if imported back into WebInsight

---

## PHASE 7: Polish & Ship (Days 15-18+)

### 7.1 Settings Page Updates
- [ ] Add Bible translation preference (default: KJV)
- [ ] Add API.Bible API key field (or bundle a shared key with rate limiting)
- [ ] Add verse detection toggle (on/off)
- [ ] Add cross-reference source toggle (Treasury only / Treasury + AI / AI only)
- [ ] Add devotional mode settings (daily reminder time, reading plan)
- [ ] Maintain existing settings: Gemini API key, AI mode, theme, Google Drive, report defaults

### 7.2 Chrome Web Store Listing
- [ ] Extension name: "Bible Insight — AI Bible Study & Sermon Notes"
- [ ] Short description (132 chars): "AI-powered Bible study sidebar. Take sermon notes, auto-detect verses, generate study reports. Your data stays private."
- [ ] Full description with features, screenshots, privacy statement
- [ ] Category: "Productivity" or "Fun" (Chrome Web Store has no "Religion" category)
- [ ] Privacy policy URL (FHG domain)
- [ ] Screenshots: sermon mode, verse detection, study report, devotional mode

### 7.3 Privacy Policy
- Data stays local (IndexedDB) by default
- Optional Google Drive backup (user-initiated)
- Local AI mode: zero data transmission
- Cloud AI mode: content sent to Google Gemini API (disclosed)
- API.Bible calls: only verse references sent, no user notes
- No analytics, no tracking, no ads

### 7.4 Quality Gates (per 864zeros QC standards)
- [ ] All existing WebInsight Jest tests pass with FHG theme
- [ ] TR-06 test suite: transcript extraction for 10+ YouTube videos (sermons, lectures, various languages)
- [ ] TR-07 test suite: verse detection for all 66 books, all reference formats, edge cases
- [ ] Cross-reference accuracy: spot-check 20 verses against Treasury of Scripture Knowledge
- [ ] Manual QA: full user flow (install → capture sermon → take notes → generate report)
- [ ] Chrome Web Store compliance check (Manifest V3, permissions justification)

---

## MVP vs Full Build

### MVP (Ship First — ~10 days)
- FHG visual theme
- TR-07 Bible Verse Detection (regex + API.Bible)
- TR-06 YouTube Transcript Engine
- YouTube detection + transcript view in panel
- Live note timestamping
- Theological tag seed vocabulary
- Rebranded PDF report
- Chrome Web Store listing

### Post-MVP (Days 11-22)
- Cross-reference engine (Treasury of Scripture Knowledge)
- AI-enhanced cross-references (Gemini)
- Devotional mode
- Sermon study document generator (the "killer output")
- Video metadata auto-tagging
- Transcript search
- Auto-scroll transcript sync with video playback

### Phase 2 (Future)
- Microphone recording for live sermons (Web Speech API)
- Reading plans integration
- Multi-device sync (beyond Google Drive backup)
- Community shared notes (shared tags/collections)
- Mobile companion (if extension proves PMF)

---

## File Structure (Expected)

```
bible-insight/
├── manifest.json              # Updated for Bible Insight
├── core/
│   ├── verse-detection/       # TR-07 Feature Brick
│   │   ├── detector.js        # detectVerses(), book mapping
│   │   ├── api-bible.js       # fetchVerseText(), translation mgmt
│   │   ├── book-map.json      # 66 books + abbreviations
│   │   ├── tests/
│   │   └── README.md
│   ├── youtube-transcript/    # TR-06 Feature Brick
│   │   ├── extractor.js       # extractTranscript(), cleaning
│   │   ├── detector.js        # isYouTubeVideo(), tab listeners
│   │   ├── player-sync.js     # getCurrentTimestamp(), seekTo()
│   │   ├── tests/
│   │   └── README.md
│   └── cross-references/
│       ├── treasury.json      # Treasury of Scripture Knowledge data
│       ├── lookup.js           # Static cross-reference lookup
│       └── ai-enhanced.js     # Gemini-powered thematic suggestions
├── features/
│   ├── sermon-mode/           # YouTube integration UI
│   │   ├── transcript-view.js
│   │   ├── timestamped-notes.js
│   │   └── sermon-document.js
│   ├── devotional/
│   │   ├── devotional-mode.js
│   │   └── journal.js
│   └── verse-display/
│       ├── inline-tooltip.js
│       ├── verse-sidebar.js
│       └── verse-summary.js
├── theme/
│   └── fhg-theme.css          # FHG charcoal/bronze overrides
├── assets/
│   ├── icons/                 # 16, 32, 48, 128px
│   └── store-images/          # Chrome Web Store promotional
├── options/                   # Settings page (adapted from WebInsight)
├── sidepanel/                 # Main panel UI (adapted from WebInsight)
├── background.js              # Service worker (adapted)
├── content.js                 # Content scripts (adapted + YouTube)
└── data_viewer.html           # Debug page (carried over)
```

---

## Dependencies

### Existing (from WebInsight)
- TensorFlow.js (~25 MB, for local AI tagging)
- Google Gemini 1.5 API (cloud AI)
- Chrome DevTools Protocol (PDF generation, screenshots)
- IndexedDB (client-side storage)
- Google Drive API (backup)

### New
- API.Bible (free, verse text retrieval)
- Treasury of Scripture Knowledge dataset (public domain, ~5 MB JSON)

### No New Frameworks
Per 864zeros technical standards: Vanilla JS priority. No React, Vue, or Tailwind unless WebInsight already uses them. Keep the `/core` (reusable) and `/features` (specific) split clean.

---

## Build Sequence (Critical Path)

```
Day 0:     Fork repo, setup FHG accounts/keys
Days 1-2:  PHASE 1 — FHG theme (can start immediately)
Days 3-4:  PHASE 2 — TR-07 verse detection (independent, parallel-safe)
Days 5-7:  PHASE 3 — TR-06 YouTube transcript (independent, parallel-safe)
Days 8-10: PHASE 4 — YouTube integration (depends on TR-06)
           ↳ MVP SHIPPABLE AT DAY 10
Days 11-14: PHASE 5 — Theological intelligence (post-MVP enhancement)
Days 15-18: PHASE 7 — Polish, QA, Chrome Web Store submission
```

Phases 1, 2, and 3 can run in parallel. Phase 4 depends on Phase 3. Phase 5 depends on Phase 2. Phase 7 depends on all.

---

*Build spec v1.0.0 — The Operator — 864zeros LLC*
*Do not start build until Thaw ships first revenue.*
