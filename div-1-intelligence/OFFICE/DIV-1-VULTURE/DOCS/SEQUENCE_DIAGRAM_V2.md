# VULTURE NEST: SEQUENCE DIAGRAMS

**Created:** 2026-03-26 12:45 UTC
**Purpose:** Visualize system flow for Quest Engine V2 implementation

---

## 1. CURRENT ARCHITECTURE (V1)

### 1.1 High-Level System Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            VULTURE-NEST (Monorepo)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         RESEARCH LAYER                               │   │
│  │                                                                      │   │
│  │   quest_engine.py ◄──────► tool_wrapper.py ◄──────► Apify API       │   │
│  │         │                                                            │   │
│  │         │                 discovery_engine.py                        │   │
│  │         │                         │                                  │   │
│  │         ▼                         ▼                                  │   │
│  │   ┌─────────────────────────────────────────┐                       │   │
│  │   │  OFFICE/DIV-1-VULTURE/quests/           │                       │   │
│  │   │  - VN-2026-Q001.json (Knak)             │                       │   │
│  │   │  - VN-2026-Q004.json (Instapaper)       │                       │   │
│  │   │  - VN-2026-Q005.json (1Password)        │                       │   │
│  │   └─────────────────────────────────────────┘                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    │ STRIKE verdict                         │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         BUILD LAYER                                  │   │
│  │                                                                      │   │
│  │   864z-build-kit/              OFFICE/DIV-3-FACTORY/projects/       │   │
│  │   ├── lib/                     └── 864z-2026-004-passvault/         │   │
│  │   │   ├── 864z-core.js             (working copy)                   │   │
│  │   │   ├── aether-ui.css                                             │   │
│  │   │   └── BRK-*.js                                                  │   │
│  │   └── templates/                                                     │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    │ Build complete                         │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       PRODUCTION LAYER                               │   │
│  │                                                                      │   │
│  │   864zeros_engine/                                                   │   │
│  │   ├── MASTER_REGISTRY.json                                          │   │
│  │   └── builds/                                                        │   │
│  │       ├── 864z-2026-004-passvault/  ◄── Production ready            │   │
│  │       └── 864z-2026-005-readflow/   ◄── Production ready            │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    │ Package & ship                         │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          GTM LAYER                                   │   │
│  │                                                                      │   │
│  │   GTM/                          OFFICE/DIV-4-STUDIO/drafts/         │   │
│  │   └── readflow/                 └── marketing assets                │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. QUEST ENGINE V1 SEQUENCE (Current)

### 2.1 Research Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌───────────┐
│  Human   │     │ Quest Engine │     │ToolWrapper  │     │ Apify API │
└────┬─────┘     └──────┬───────┘     └──────┬──────┘     └─────┬─────┘
     │                  │                    │                  │
     │ python quest_engine.py --target "X"   │                  │
     │─────────────────►│                    │                  │
     │                  │                    │                  │
     │                  │ Phase 1: RANSOM    │                  │
     │                  │ google_web_search()│                  │
     │                  │───────────────────►│                  │
     │                  │                    │ HTTP POST        │
     │                  │                    │─────────────────►│
     │                  │                    │                  │
     │                  │                    │◄─────────────────│
     │                  │◄───────────────────│ search results   │
     │                  │                    │                  │
     │                  │ Phase 2: FRICTION  │                  │
     │                  │───────────────────►│                  │
     │                  │                    │─────────────────►│
     │                  │◄───────────────────│◄─────────────────│
     │                  │                    │                  │
     │                  │ Phase 3: PAIN      │                  │
     │                  │ (Reddit, G2)       │                  │
     │                  │───────────────────►│                  │
     │                  │                    │─────────────────►│
     │                  │◄───────────────────│◄─────────────────│
     │                  │                    │                  │
     │                  │ Phase 4: COMPETITORS                  │
     │                  │───────────────────►│                  │
     │                  │                    │─────────────────►│
     │                  │◄───────────────────│◄─────────────────│
     │                  │                    │                  │
     │                  │                    │                  │
     │                  │ LOCAL CALCULATIONS │                  │
     │                  │ ┌────────────────┐ │                  │
     │                  │ │ Z-Convergence  │ │                  │
     │                  │ │ Z-Velocity     │ │                  │
     │                  │ │ Z-Scarcity     │ │                  │
     │                  │ │ 864z Score     │ │                  │
     │                  │ │ Verdict        │ │                  │
     │                  │ └────────────────┘ │                  │
     │                  │                    │                  │
     │                  │ WRITE OUTPUTS      │                  │
     │                  │ ┌────────────────────────────────┐    │
     │                  │ │ OFFICE/DIV-1-VULTURE/quests/   │    │
     │                  │ │ ├── VN-2026-QXXX.json          │    │
     │                  │ │ └── VN-2026-QXXX.md            │    │
     │                  │ └────────────────────────────────┘    │
     │                  │                    │                  │
     │◄─────────────────│                    │                  │
     │ STRIKE/HANGAR/REJECT                  │                  │
     │                  │                    │                  │
```

### 2.2 V1 Weaknesses (Why V2 Needed)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     V1 SEARCH FLOW (WEAK)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Query: "{target}" pricing expensive                                   │
│              │                                                          │
│              ▼                                                          │
│   ┌─────────────────┐                                                   │
│   │   Apify/Google  │  ─────►  Raw text results                        │
│   └─────────────────┘                                                   │
│              │                                                          │
│              ▼                                                          │
│   ┌─────────────────┐                                                   │
│   │ Keyword Match   │  "pricing", "expensive", "$"                     │
│   │ (Naive)         │                                                   │
│   └─────────────────┘                                                   │
│              │                                                          │
│              ▼                                                          │
│   ┌─────────────────┐                                                   │
│   │ Count Signals   │  ─────►  severity = len(signals)                 │
│   │ (Unweighted)    │          NO engagement data                       │
│   └─────────────────┘          NO author authority                      │
│              │                 NO velocity detection                    │
│              ▼                 NO migration intent                      │
│   ┌─────────────────┐                                                   │
│   │ Hardcoded       │  stagnation_months = 18  (FAKE!)                 │
│   │ Values          │                                                   │
│   └─────────────────┘                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. QUEST ENGINE V2 SEQUENCE (Proposed)

### 3.1 Multi-Platform Scraper Architecture

```
┌──────────┐     ┌──────────────┐     ┌─────────────────────────────────────┐
│  Human   │     │Quest Engine  │     │         PLATFORM SCRAPERS           │
│          │     │    V2        │     │                                     │
└────┬─────┘     └──────┬───────┘     │  ┌─────────┐  ┌─────────┐          │
     │                  │             │  │Twitter  │  │ Reddit  │          │
     │                  │             │  │ Scraper │  │ Scraper │          │
     │                  │             │  └────┬────┘  └────┬────┘          │
     │                  │             │       │            │               │
     │                  │             │  ┌────┴────┐  ┌────┴────┐          │
     │                  │             │  │   HN    │  │   G2    │          │
     │                  │             │  │ Scraper │  │ Scraper │          │
     │                  │             │  └────┬────┘  └────┬────┘          │
     │                  │             │       │            │               │
     │                  │             │  ┌────┴────┐  ┌────┴────┐          │
     │                  │             │  │Capterra │  │  PH     │          │
     │                  │             │  │ Scraper │  │ Scraper │          │
     │                  │             │  └─────────┘  └─────────┘          │
     │                  │             └─────────────────────────────────────┘
     │                  │                           │
     │ --target "X"     │                           │
     │─────────────────►│                           │
     │                  │                           │
     │                  │  PARALLEL SCRAPE          │
     │                  │──────────────────────────►│
     │                  │                           │
     │                  │                    ┌──────┴──────┐
     │                  │                    │ Raw Signals │
     │                  │                    │ + Metadata  │
     │                  │                    │ - timestamp │
     │                  │                    │ - likes     │
     │                  │                    │ - retweets  │
     │                  │                    │ - author    │
     │                  │                    │ - followers │
     │                  │                    └──────┬──────┘
     │                  │                           │
     │                  │◄──────────────────────────│
     │                  │                           │
     │                  │  ENRICHMENT PIPELINE      │
     │                  │  ┌───────────────────────────────────────────┐
     │                  │  │                                           │
     │                  │  │  1. Engagement Multiplier                 │
     │                  │  │     tweet.likes >= 1000 → 10x             │
     │                  │  │                                           │
     │                  │  │  2. Author Authority                      │
     │                  │  │     followers >= 10k → 3x                 │
     │                  │  │                                           │
     │                  │  │  3. Severity Classification               │
     │                  │  │     "data breach" → CRITICAL              │
     │                  │  │     "switching to" → HIGH                 │
     │                  │  │                                           │
     │                  │  │  4. Migration Intent Detection            │
     │                  │  │     "looking for alternative" → flag      │
     │                  │  │                                           │
     │                  │  │  5. Crisis Event Detection                │
     │                  │  │     "price hike" → 1.3x multiplier        │
     │                  │  │                                           │
     │                  │  │  6. Velocity Spike Analysis               │
     │                  │  │     30d_count / baseline → spike_ratio    │
     │                  │  │                                           │
     │                  │  └───────────────────────────────────────────┘
     │                  │                           │
     │                  │  V2 SCORING               │
     │                  │  ┌───────────────────────────────────────────┐
     │                  │  │                                           │
     │                  │  │  Z-Convergence (35%)  ← weighted signals  │
     │                  │  │  Z-Velocity (25%)     ← real spike data   │
     │                  │  │  Z-Scarcity (15%)     ← threat scoring    │
     │                  │  │  Z-Migration (25%)    ← NEW!              │
     │                  │  │                                           │
     │                  │  │  crisis_mult = 1.3 if crisis detected     │
     │                  │  │  exit_mult = 1.5 if Rule of 40 >= 40%     │
     │                  │  │                                           │
     │                  │  │  FINAL = base × exit_mult × crisis_mult   │
     │                  │  │                                           │
     │                  │  └───────────────────────────────────────────┘
     │                  │                           │
     │◄─────────────────│                           │
     │  Enhanced Verdict│                           │
     │  + confidence %  │                           │
```

### 3.2 V2 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          V2 DATA PIPELINE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TARGET: "1Password"                                                        │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    QUERY GENERATOR                                   │   │
│  │                                                                      │   │
│  │  Twitter:  "1Password" (expensive OR "price hike") since:2026-01-01 │   │
│  │  Reddit:   site:reddit.com "1Password" switching                    │   │
│  │  HN:       site:news.ycombinator.com "1Password" alternative        │   │
│  │  G2:       site:g2.com "1Password" cons                             │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PARALLEL SCRAPER                                  │   │
│  │                                                                      │   │
│  │   Twitter ─────► 45 tweets with engagement data                     │   │
│  │   Reddit ──────► 67 posts/comments with scores                      │   │
│  │   HN ──────────► 12 items with points                               │   │
│  │   G2 ──────────► 32 reviews with ratings                            │   │
│  │                                                                      │   │
│  │   TOTAL RAW: 156 signals                                            │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SIGNAL ENRICHMENT                                 │   │
│  │                                                                      │   │
│  │   For each signal:                                                   │   │
│  │   ┌─────────────────────────────────────────────────────────────┐   │   │
│  │   │ {                                                            │   │   │
│  │   │   "content": "1Password doubled their price...",            │   │   │
│  │   │   "platform": "twitter",                                    │   │   │
│  │   │   "timestamp": "2026-03-15T10:30:00Z",                      │   │   │
│  │   │   "engagement": {"likes": 234, "retweets": 56},             │   │   │
│  │   │   "author": {"followers": 12500, "verified": false},        │   │   │
│  │   │   "severity": "HIGH",                                       │   │   │
│  │   │   "is_migration_intent": true,                              │   │   │
│  │   │   "engagement_multiplier": 3.0,                             │   │   │
│  │   │   "author_authority": 1.5,                                  │   │   │
│  │   │   "weighted_score": 13.5                                    │   │   │
│  │   │ }                                                            │   │   │
│  │   └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │   TOTAL WEIGHTED: 423.5 (vs 156 raw)                                │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    VELOCITY ANALYSIS                                 │   │
│  │                                                                      │   │
│  │   24h:  12 signals                                                  │   │
│  │   7d:   45 signals                                                  │   │
│  │   30d:  89 signals                                                  │   │
│  │   90d:  134 signals                                                 │   │
│  │                                                                      │   │
│  │   Baseline (per 30d): 23 signals                                    │   │
│  │   Current 30d: 89 signals                                           │   │
│  │   SPIKE RATIO: 3.87x  ◄─────── ABNORMAL ACTIVITY DETECTED           │   │
│  │                                                                      │   │
│  │   Trigger: Price hike announced 2026-03-10                          │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    V2 SCORING                                        │   │
│  │                                                                      │   │
│  │   Z-Convergence:  0.78  (weighted signals / 500)                    │   │
│  │   Z-Velocity:     0.82  (spike detected)                            │   │
│  │   Z-Scarcity:     0.65  (2 funded competitors)                      │   │
│  │   Z-Migration:    0.72  (28 explicit intent signals)                │   │
│  │                                                                      │   │
│  │   Base Score = (0.78×0.35 + 0.82×0.25 + 0.65×0.15 + 0.72×0.25) × 10 │   │
│  │              = 7.42                                                  │   │
│  │                                                                      │   │
│  │   Exit Multiplier: 1.5x (Rule of 40 = 110%)                         │   │
│  │   Crisis Multiplier: 1.3x (price_hike detected)                     │   │
│  │                                                                      │   │
│  │   FINAL SCORE = 7.42 × 1.5 × 1.3 = 14.47                            │   │
│  │                                                                      │   │
│  │   Effective Threshold: 7.5 (lowered due to high migration)          │   │
│  │                                                                      │   │
│  │   VERDICT: ███ STRIKE ███ (confidence: 89%)                         │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. BUILD PIPELINE SEQUENCE

### 4.1 Post-STRIKE Build Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Quest    │     │  DIV-3       │     │ Build Kit    │     │ 864zeros     │
│ Engine   │     │  FACTORY     │     │              │     │ Engine       │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
     │                  │                    │                    │
     │ STRIKE: 1Password│                    │                    │
     │ Score: 14.47     │                    │                    │
     │─────────────────►│                    │                    │
     │                  │                    │                    │
     │                  │ Create project dir │                    │
     │                  │ OFFICE/DIV-3-FACTORY/projects/864z-2026-006/
     │                  │                    │                    │
     │                  │ Copy templates     │                    │
     │                  │───────────────────►│                    │
     │                  │                    │                    │
     │                  │◄───────────────────│                    │
     │                  │ manifest.json      │                    │
     │                  │ options.html       │                    │
     │                  │                    │                    │
     │                  │ Copy bricks        │                    │
     │                  │───────────────────►│                    │
     │                  │                    │                    │
     │                  │◄───────────────────│                    │
     │                  │ 864z-core.js       │                    │
     │                  │ aether-ui.css      │                    │
     │                  │ BRK-PRICING-001.js │                    │
     │                  │                    │                    │
     │                  │                    │                    │
     │                  │ BUILD CUSTOM LOGIC │                    │
     │                  │ (manual or LLM)    │                    │
     │                  │ - parser.js        │                    │
     │                  │ - crypto.js        │                    │
     │                  │ - app.js           │                    │
     │                  │                    │                    │
     │                  │                    │                    │
     │                  │ TEST & VALIDATE    │                    │
     │                  │                    │                    │
     │                  │                    │                    │
     │                  │ PROMOTE TO PRODUCTION                   │
     │                  │────────────────────────────────────────►│
     │                  │                    │                    │
     │                  │                    │  Update MASTER_REGISTRY
     │                  │                    │  Copy to builds/   │
     │                  │                    │  Create .zip       │
     │                  │                    │                    │
     │                  │◄────────────────────────────────────────│
     │                  │                    │                    │
```

---

## 5. COMPLETE SYSTEM SEQUENCE

### 5.1 End-to-End: Idea → Shipped Product

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌────────┐│
│   │  IDEA   │───►│RESEARCH │───►│  BUILD  │───►│   GTM   │───►│ SHIP   ││
│   │         │    │         │    │         │    │         │    │        ││
│   │"Users   │    │Quest    │    │DIV-3    │    │DIV-4    │    │Chrome  ││
│   │hate X"  │    │Engine   │    │Factory  │    │Studio   │    │Store   ││
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘    └────────┘│
│        │              │              │              │              │     │
│        │              │              │              │              │     │
│        ▼              ▼              ▼              ▼              ▼     │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌────────┐│
│   │ Target  │    │ Quest   │    │Extension│    │Marketing│    │ Live   ││
│   │ Name    │    │ JSON/MD │    │ Source  │    │ Assets  │    │Product ││
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘    └────────┘│
│                       │                                                  │
│                       │                                                  │
│              ┌────────┴────────┐                                        │
│              │                 │                                        │
│              ▼                 ▼                                        │
│         ┌─────────┐       ┌─────────┐                                   │
│         │ STRIKE  │       │ REJECT  │                                   │
│         │ (build) │       │ (stop)  │                                   │
│         └─────────┘       └─────────┘                                   │
│                                                                          │
└───────────────────────────────────────────────────────────────────────────┘

LOCATIONS:

IDEA        → Human input
RESEARCH    → vulture-nest/quest_engine.py
              → OFFICE/DIV-1-VULTURE/quests/
BUILD       → vulture-nest/OFFICE/DIV-3-FACTORY/projects/
              → vulture-nest/864z-build-kit/
GTM         → vulture-nest/GTM/
              → vulture-nest/OFFICE/DIV-4-STUDIO/drafts/
SHIP        → vulture-nest/864zeros_engine/builds/
              → Chrome Web Store
```

---

## 6. V2 IMPLEMENTATION SEQUENCE

### 6.1 Phase-by-Phase Build Plan

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    V2 IMPLEMENTATION PHASES                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHASE 1: SCRAPER INFRASTRUCTURE                                       │
│  ─────────────────────────────────                                      │
│  Location: vulture-nest/scrapers/                                       │
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │ scrapers/       │                                                    │
│  │ ├── __init__.py │                                                    │
│  │ ├── base.py     │  ← Abstract scraper class                         │
│  │ ├── twitter.py  │  ← Twitter/X API v2                               │
│  │ ├── reddit.py   │  ← Reddit API / Pushshift                         │
│  │ ├── hn.py       │  ← HN Algolia API                                 │
│  │ ├── g2.py       │  ← G2 scraper                                     │
│  │ └── manager.py  │  ← Parallel execution                             │
│  └─────────────────┘                                                    │
│                                                                         │
│  PHASE 2: ENRICHMENT PIPELINE                                          │
│  ────────────────────────────                                           │
│  Location: vulture-nest/enrichment/                                     │
│                                                                         │
│  ┌─────────────────────┐                                                │
│  │ enrichment/         │                                                │
│  │ ├── __init__.py     │                                                │
│  │ ├── engagement.py   │  ← Multiplier calculations                    │
│  │ ├── authority.py    │  ← Author scoring                             │
│  │ ├── severity.py     │  ← Pattern classification                     │
│  │ ├── migration.py    │  ← Intent detection                           │
│  │ ├── crisis.py       │  ← Event detection                            │
│  │ └── velocity.py     │  ← Spike analysis                             │
│  └─────────────────────┘                                                │
│                                                                         │
│  PHASE 3: V2 SCORING ENGINE                                            │
│  ──────────────────────────                                             │
│  Location: vulture-nest/quest_engine_v2.py                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ quest_engine_v2.py                                               │   │
│  │                                                                  │   │
│  │ - QuestEngineV2 class                                           │   │
│  │ - calculate_z_convergence_v2()                                  │   │
│  │ - calculate_z_velocity_v2()                                     │   │
│  │ - calculate_z_scarcity_v2()                                     │   │
│  │ - calculate_z_migration()        ← NEW                          │   │
│  │ - calculate_864z_score_v2()                                     │   │
│  │ - determine_verdict_v2()                                        │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  PHASE 4: INTEGRATION                                                   │
│  ────────────────────                                                   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ quest_engine.py                                                  │   │
│  │                                                                  │   │
│  │ # Add V2 mode flag                                              │   │
│  │ parser.add_argument("--v2", action="store_true")                │   │
│  │                                                                  │   │
│  │ if args.v2:                                                     │   │
│  │     from quest_engine_v2 import QuestEngineV2                   │   │
│  │     engine = QuestEngineV2()                                    │   │
│  │ else:                                                           │   │
│  │     engine = QuestEngine()  # V1 fallback                       │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. FILE LOCATION SUMMARY

```
vulture-nest/
│
├── quest_engine.py              ← V1 (current)
├── quest_engine_v2.py           ← V2 (to build)
│
├── scrapers/                    ← NEW: Platform scrapers
│   ├── twitter.py
│   ├── reddit.py
│   ├── hn.py
│   └── ...
│
├── enrichment/                  ← NEW: Signal processing
│   ├── engagement.py
│   ├── authority.py
│   ├── migration.py
│   └── ...
│
├── OFFICE/
│   ├── DIV-1-VULTURE/quests/    ← Quest outputs (both V1 & V2)
│   ├── DIV-3-FACTORY/projects/  ← Active builds
│   └── DIV-4-STUDIO/drafts/     ← Marketing
│
├── 864zeros_engine/
│   └── builds/                  ← Production extensions
│
└── 864z-build-kit/
    └── lib/                     ← Reusable bricks
```

---

**Document Created:** 2026-03-26T12:45:00Z
**Purpose:** Visual guide for V2 implementation
**Status:** READY FOR IMPLEMENTATION

---
