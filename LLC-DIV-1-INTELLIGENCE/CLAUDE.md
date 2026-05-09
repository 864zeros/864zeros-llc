# Vulture-Nest

Autonomous market intelligence and opportunity discovery system for identifying software re-disruption ("unbundling") opportunities. The system finds "carcasses" (stagnant software incumbents), collects user pain signals ("blood in the water"), validates opportunities against strict financial thresholds, and generates actionable "strike packages" for product development.

**Core philosophy**: NO FALSE OPTIMISM. Every lead is terminated unless it passes the 8.64 threshold.

---

## Description

### What This System Does

864zeros operates on a single thesis: SaaS companies hold users hostage through subscription ransoms and export friction. Local-first alternatives can liberate those users at a fraction of the cost. Speed matters — the first credible rescue product captures the migration wave.

Vulture-Nest is the autonomous intelligence layer that answers one question before any code is written:

> **"Should we build a rescue product for these users?"**

It does this by crawling communities and review sites for user pain signals, scoring those signals against a quantitative financial framework, and — only when the math clears a strict threshold — generating a complete **Strike Dossier** handed off to the build factory.

---

### The Mental Model

The system uses a deliberate predator metaphor throughout:

| Term | Meaning |
|------|---------|
| **Carcass** | A stagnant incumbent product with a large, captive, frustrated user base |
| **Blood in the water** | Community pain signals: complaints, rants, workaround threads, migration requests |
| **Strike** | A validated opportunity that passed the 8.64 gate and is ready to build |
| **Hangar** | Qualified-but-shelved opportunities (score 7.0–8.63, or L-size complexity) |
| **SaaS Hostage** | A user trapped by pricing ransoms or export lock-in in a decaying product |
| **Rescue product** | The local-first alternative built to liberate those users |
| **Strike Package / Dossier** | The complete build handoff: architecture, GTM, financials, migration spec |

---

### The Four Analytical Pillars

Every Strike Quest is built on four pillars. A quest is incomplete if any pillar is missing.

#### Pillar 1 — The Ransom
*"What is the pricing pain? How are users held hostage?"*

Examines how the incumbent extracts value: subscription model, price range, free-tier limitations, enterprise paywalls, and price increase history. **Ransom Severity** is scored 1–10; a score of 7+ indicates active user frustration.

#### Pillar 2 — The Friction
*"How are users locked in? What are the migration barriers?"*

Examines how difficult it is to leave: export formats and their completeness, API restrictions, proprietary data formats, and overall migration complexity (Trivial → Nightmare). **Data Portability Score** 1–10; a score of 3 or below signals significant lock-in.

#### Pillar 3 — The Math of the Kill
*"Does the opportunity pass the 8.64 threshold?"*

The quantitative gate. No exceptions, no intuition overrides. See the Scoring Algorithm section for the full formula.

#### Pillar 4 — The Technical Rescue Blueprint
*"How do we build the alternative?"*

Defines the rescue product architecture: Chrome Extension MV3, IndexedDB local storage, zero cloud dependency, one-click data migration from the target, full export in open formats. Build complexity is T-shirt sized; **L-size builds (720h+) are disqualified regardless of score**.

---

### The Five-Stage Funnel

```
Stage 1: DISCOVERY (The Hunt)
    Isenberg Scan  →  Reddit/Discord laments, workaround spreadsheets
    Carcass Scan   →  App stores / directories for stagnant high-volume apps
    Output: Potential Targets list

Stage 2: PATTERN EXTRACTION (The Blueprint)
    Sources: Indie Hackers, Failory, G2, community threads
    Maps: Growth Stack, Tech Stack, Anti-Patterns to avoid
    Output: Pattern Brief per target

Stage 3: FINANCIAL VALIDATION (The Gate)
    Calculates: Rule of 40, Exit Multiplier χ, final 864z Score
    This is the automated GO / NO-GO decision point
    Output: Validation Scorecard

Stage 4: DOSSIER GENERATION (The Strike Plan)
    Triggered only if score > 8.64
    Consolidates: GTM rescue scripts, target MRR, projected exit valuation
    Output: Vulture Strike Dossier → /builds directory

Stage 5: TECHNICAL BRIEF REFINEMENT (The Hand-off)
    Transforms the strategic dossier into a detailed build_prompt.md
    Enforces Build Block philosophy (registry.json bricks)
    Output: Two-artifact dossier ready for DIV-3 Factory replication
```

---

### Financial Framework

The system is designed around a specific, concrete exit target — not growth at all costs.

```
Target Exit Valuation:  $141,312   (benchmark for micro-SaaS on Acquire.com)
Exit Multiple:          4×
Target Annual Revenue:  $35,328
Target MRR:             $2,944
```

**Market sizing:**
- TAM = Estimated incumbent traffic × 5
- SAM = TAM × 30%
- SOM = SAM × 5% (Year 1)
- MRR = SOM × 2% conversion × price point
- Months to exit = time to reach target MRR at 10% monthly growth

**Rule of 40** (SaaS health gate):
- Growth% + Margin% ≥ 40% → Exit Multiplier = **1.5×**
- Growth% + Margin% < 40% → Exit Multiplier = **1.0×**

---

### Strike Qualification Criteria

All three conditions must be true simultaneously. Any single failure terminates the lead.

| Criterion | Requirement |
|-----------|-------------|
| Vulture Score | ≥ 8.64 |
| Build complexity | XS / S / M only (not L) |
| Competitor count | ≤ 3 modern alternatives |

**Verdict states:**
- `STRIKE` — Score ≥ 8.64, cleared for build
- `HANGAR` — Score 7.0–8.63, shelved for monthly re-review
- `REJECT` — Score < 7.0, archived

---

### Organisational Structure (OFFICE/)

The project is structured as an autonomous virtual business. Claude Code sessions execute as agents; the human acts as approver at the HALLWAY gate.

| Division | Location | Responsibility |
|----------|----------|----------------|
| **DIV-1 VULTURE** | `OFFICE/DIV-1-VULTURE/` | Research & discovery — produces Strike Quests |
| **DIV-3 FACTORY** | `OFFICE/DIV-3-FACTORY/` | Chrome extension development, QA, NIX compliance |
| **DIV-4 STUDIO** | `OFFICE/DIV-4-STUDIO/` | Go-to-market, brand, launch content |
| **HALLWAY** | `OFFICE/HALLWAY/` | Human approval gate between divisions |
| **DASHBOARD** | `OFFICE/DASHBOARD.html` | Real-time status across all divisions |

**Handoff pipeline:** DIV-1 (qualified strike) → DIV-3 (build) → HALLWAY (awaiting human signature) → DIV-4 (GTM) → Publish

**Telegram bot** (`OFFICE/gatekeeper_stub.py`) is architected but not yet activated — fires when a project lands in HALLWAY. Requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in `.env` and the API call to be uncommented.

---

### Operational Principles

1. **Research only in DIV-1.** The Quest Engine identifies; it does not build.
2. **No hallucinations.** All analysis is derived from live web searches. Absent signals = reflected reality.
3. **Speed over perfection.** A Strike Quest should be generated in under 5 minutes.
4. **The data speaks.** Human intuition is input. The math is output. Below 8.64 = no.

---

## Tech Stack

- **Language**: Python 3
- **Dependencies**: `apify-client`, `python-dotenv`
- **External APIs**: Apify (Google Search, Reddit, web crawling, residential proxies), Algolia (HN search)
- **Scraping targets**: Reddit, Hacker News, G2, Capterra, TrustRadius, Twitter/X, Product Hunt
- **Output formats**: JSON (strike packages, scan results), Markdown (reports, catalog)

## Project Structure

```
vulture-nest/
├── app.py                  # Main pipeline orchestrator (CLI entry point)
├── run_scan.py             # Full-cycle scan entry point (uses mock data)
├── agents.py               # V_Trendspotter, V_Scout, V_Analyst agents
├── discovery_engine.py     # Cynical scraper — finds carcasses and pain signals
├── validator.py            # 8.64 Gatekeeper — validates and scores leads
├── tool_wrapper.py         # Apify client wrapper with stealth protocol
├── config.py               # Central config (864z weights, file paths)
├── quest_engine.py         # Strike Quest document generator (V1)
├── quest_engine_v2.py      # Enhanced Quest Engine with V2 scoring + enrichment
├── registry.json           # Build brick registry
│
├── scrapers/               # Multi-platform scraper module
│   ├── base.py             # Signal, Platform, severity patterns, migration/crisis patterns
│   ├── manager.py          # ScraperManager (parallel execution)
│   ├── twitter.py
│   ├── reddit.py
│   ├── hn.py               # Hacker News via Algolia API
│   └── g2.py
│
├── enrichment/             # Signal enrichment pipeline (V2)
│   ├── pipeline.py         # EnrichmentPipeline orchestrator → EnrichmentReport
│   ├── engagement.py       # Engagement multiplier calculations
│   ├── authority.py        # Author authority scoring
│   ├── velocity.py         # Velocity spike detection
│   ├── migration.py        # Migration intent tracking
│   └── crisis.py           # Crisis event detection (breaches, outages, shutdowns)
│
├── Vulture_Nest.md         # Living catalog of all qualified strike opportunities
├── strikes/                # Strike package JSON files
├── scan_results/           # Full scan results and leaderboards
├── _archive/               # Terminated leads archive
├── OFFICE/                 # Organizational hub (divisions, dashboards, reports)
│   ├── DASHBOARD.html
│   ├── DIV-1-VULTURE/      # Research division
│   ├── DIV-3-FACTORY/      # Build factory
│   ├── DIV-4-STUDIO/       # Design/GTM studio
│   └── REPORTS/
├── 864zeros_engine/        # Brick registry + factory inventory
│   ├── MASTER_REGISTRY.json# Extended brick + extension catalog
│   └── FACTORY_INVENTORY.md# What components exist where, harvest guide
│   # NOTE: Strike builds are no longer kept here. Canonical build floor:
│   #       ../LLC-DIV-3-FACTORY/output/864z-2026-XXX-{slug}/
│   # NOTE: Build-kit scaffold (CLAUDE-base.md, references/, phases/, lib/, etc.)
│   #       is canonical at the monolith root: ../864z-build-kit/
├── builds/                 # Legacy / archived build experiments
├── briefs/                 # Research briefs
├── gtm/                    # Go-to-market strategies
├── prompts/                # LLM prompts
└── plannerpress-webapp/    # Next.js webapp experiment (not part of strike pipeline)
```

## Entry Points

```bash
# Full discovery + validation cycle
python app.py

# Targeted deep-dive on a specific incumbent
python app.py --target "OneTab"

# Filter by category
python app.py --categories "chrome extension"

# Custom parameters
python app.py --max 3 --growth 20 --margin 80 --dry-run

# Full-cycle scan (uses simulated data, outputs leaderboard)
python run_scan.py

# Quest research documents
python quest_engine.py --target "Knak" --mode deep
python quest_engine_v2.py --target "1Password" --mode quick

# Validator test harness (3 test cases)
python validator.py
```

## Pipeline Phases

### Phase 1 — Discovery (`discovery_engine.py`, `agents.py`, `tool_wrapper.py`)

`ToolClient` (Apify) → `V_Scout` scrapes Reddit, G2, Capterra, TrustRadius, web search → builds `CarcassProfile` with pain signals, sentiment, competitor count.

`V_Scout` search strategy:
1. Reddit community scan
2. Review sites (G2, Capterra, TrustRadius)
3. General web search for frustrations

Pain points are categorized: SYNC, ORGANIZATION, PERFORMANCE, DATA LOSS, UX, PRICING, GENERAL.

`tool_wrapper.py` implements the "Stealthfox" protocol: random 2–5s pauses, 8s pause every 3rd request, residential proxy rotation.

### Phase 2 — Validation (`validator.py`)

`CarcassProfile.to_lead_candidate()` → `LeadCandidate` → `VultureValidator.validate()` → `ValidationResult` or `StrikePackage`.

**Three gatekeeper checks** (in order — any failure terminates the lead):
1. `scarcity_index ≤ 3` (competitor count)
2. Rule of 40 warning only (growth% + margin% ≥ 40%)
3. Final 864z score ≥ 8.64

### Phase 3 — Output (`app.py`)

Qualified leads → `strikes/{strike_id}.json` + entry appended to `Vulture_Nest.md`.

## Scoring Algorithm (864z)

### V1 Weights
| Factor | Weight | Description |
|--------|--------|-------------|
| Z-Convergence | 0.45 | Signal strength (traffic, stagnation, sentiment, pain count, clarity) |
| Z-Velocity | 0.35 | Recency/urgency (stagnation score, pain boost, sentiment urgency) |
| Z-Scarcity | 0.20 | Market gap (competitors: 0→1.0, 1→0.8, 2→0.6, 3→0.4, 4+→0.0) |

### V2 Weights (quest_engine_v2, enrichment pipeline)
| Factor | Weight | Description |
|--------|--------|-------------|
| Z-Convergence | 0.35 | Signal strength |
| Z-Velocity | 0.25 | Recency/urgency |
| Z-Scarcity | 0.15 | Market gap |
| Z-Migration | 0.25 | Switching intent (NEW) |

**Exit Multiplier**: 1.5× if Rule of 40 ≥ 40%, otherwise 1.0×

**Final Score** = (weighted sum) × 10 × exit_multiplier

**Verdict thresholds**: STRIKE ≥ 8.64 | HANGAR 7.0–8.63 | REJECT < 7.0

### Platform Authority Multipliers (V2)
| Platform | Multiplier |
|----------|-----------|
| Hacker News | 1.5× |
| G2 | 1.3× |
| Twitter | 1.2× |
| Capterra | 1.1× |
| Reddit, Product Hunt | 1.0× |
| LinkedIn | 0.8× |
| Trustpilot | 0.7× |

## Sacred Constants

```python
TARGET_EXIT_VALUATION = 141312   # The magic exit number
RULE_OF_40_THRESHOLD  = 40       # SaaS health metric
SCORE_THRESHOLD       = 8.64     # Gatekeeper threshold
SCARCITY_THRESHOLD    = 3        # Max competitors before discard
```

## Key Data Models

| Class | File | Purpose |
|-------|------|---------|
| `CarcassProfile` | `discovery_engine.py` | Incumbent analysis result |
| `DiscoverySignal` | `discovery_engine.py` | Individual scraped pain signal |
| `LeadCandidate` | `validator.py` | Lead being evaluated |
| `ValidationResult` | `validator.py` | Pass/fail outcome with scores |
| `StrikePackage` | `validator.py` | Handoff contract to builder engine |
| `Signal` | `scrapers/base.py` | Standardized scraped content |
| `EnrichmentReport` | `enrichment/pipeline.py` | z-scores from enrichment pipeline |

## Tracked Incumbents (34 Carcasses)

**Priority targets** (high unbundle potential + local-first viable):
Evernote, LastPass, Grammarly, 1Password, Bitwarden, Dashlane, Roam Research, Todoist, Raindrop.io, Instapaper

**Chrome extensions**: OneTab, Evernote Web Clipper, Honey, AdBlock, Momentum, Web Highlights, Session Buddy, Tab Manager Plus

**Micro-SaaS**: Calendly, Loom, Notion, Airtable, Zapier, Carrd, Gumroad, ConvertKit

**Developer tools**: Postman, Figma, GitHub Copilot

## Qualified Strikes (Vulture_Nest.md)

| Strike ID | Product | Target | Score | Status |
|-----------|---------|--------|-------|--------|
| 864z-2026-002 | ReadVault | Pocket | 9.32 | DEPLOYED ✓ |
| 864z-2026-003 | ReadFlow | Instapaper | 9.38 | BUILD_IN_PROGRESS |
| 864z-2026-004 | PassVault | Dashlane | 9.45 | STRIKE_INITIATED |

## Build System

The build system is the production floor that turns a validated Strike Dossier into a shippable Chrome extension. It is designed for high-velocity, agent-driven development using **composable bricks**, **non-skippable phase gates**, and **standardised agent instructions**.

### Architecture Overview

```
Strike Dossier (DIV-1)
    ↓
Build Brief (864z-build-kit/briefs/)
    ↓
Agent reads CLAUDE-base.md + CLAUDE-extension.md + brief
    ↓
Phase 1 → 2 → 3 (loop) → 4 → 5   [each phase has a gate]
    ↓
../LLC-DIV-3-FACTORY/output/{strike-id}/
    ↓
HALLWAY gate (human signature)
    ↓
DIV-4 Studio → Chrome Web Store
```

### Build Bricks & Registry

Every project inherits **Build Bricks** — reusable, tested components registered in `registry.json` and `864z-build-kit/MASTER_REGISTRY.json`. Projects add ~20% custom logic on top of 80% inherited bricks.

**Brick protocol** — standardised I/O every brick must follow:
```json
// Input
{ "command": "discard_tabs", "payload": { "tabIds": [101, 102], "priority": "low" } }

// Output
{ "status": "success", "data": { "discarded_count": 2, "failed_count": 0, "errors": [] } }
```

**Core registered bricks:**

| Brick ID | Name | Type | Agent Wrapper | Status |
|----------|------|------|---------------|--------|
| BRK-DB-001 | IndexedDB_Core | Persistence Vault | VaultAgent | Production-Ready |
| BRK-MIG-002 | Text_Parser_Base | Migration Engine | RescueAgent | Beta |
| BRK-OPT-003 | Native_Discard_Logic | Performance Brick | EfficiencyAgent | Production-Ready |

**Shared library bricks** (`864z-build-kit/lib/`):

| File | Purpose | Used In |
|------|---------|---------|
| `864z-core.js` | Brand constants (colors, pricing tiers, legal URLs) | Every extension |
| `aether-ui.css` | Primary design system (dark mode, brand components) | Every extension |
| `oia-design-system.css` | **Deprecated** — superseded by `aether-ui.css` | Legacy builds only |
| `BRK-PRICING-001.js` | Standardised pricing modal controller | PassVault, ReadFlow |
| `BRK-UI-IMPORT-001.js` | Standardised import modal controller | PassVault, ReadFlow |

**Harvest inventory** (`864z-build-kit/FACTORY_INVENTORY.md`): 13 proven extensions in `864zeros/extensions/` available to harvest parsers, exporters, security modules, and UI patterns.

### Shared Core Modules (Every Project)

Defined in `864z-build-kit/references/core/lib-core.md`. Never modified per-project.

| Module | Purpose |
|--------|---------|
| `api-client.js` | AI provider abstraction (swap Gemini ↔ Claude without touching product code) |
| `redactor.js` | Strips PII before any AI API call (privacy baseline) |
| `tiers.js` | Feature tier verification + gating |
| `constants.js` | App identity, API keys, tier definitions |

**Extension-only modules** (`lib-extension.md`):

| Module | Purpose |
|--------|---------|
| `db.js` | IndexedDB wrapper with indexes |
| `store.js` | `chrome.storage.local` wrapper + reactive listeners |
| `backup.js` | Export/import pipeline + optional Google Drive sync |

### Agent Instructions

Two files in `864z-build-kit/` are loaded by the agent at the start of every build session:

**`CLAUDE-base.md`** — Universal rules for all projects:
- Non-negotiables: KISS, Privacy First, No Ads, ADHD-Friendly UX, Modular Architecture
- Design system: Nunito font, dark mode, WCAG AA
- Monetisation: Free / Pro $12/mo / Lifetime $150 (never shame, always encouraging copy)
- Brand: 864zeros (company) vs. OIA (product design system)

**`CLAUDE-extension.md`** — Chrome extension specifics:
- MV3 hard rules (no DOM in service worker, all listeners at top level of SW)
- State management: `chrome.storage.local` is the single source of truth
- Communication: `sendMessage` + `chrome.storage.onChanged`
- Code standards: ES modules, vanilla JS, kebab-case files
- `setPanelBehavior` API required for panel extensions

### Build Brief System

Every build starts with a completed brief. No code until the brief is done.

Template: `864z-build-kit/briefs/extension-brief-template.md`

Brief sections:
1. **Identity** — app name, slug, description, brand, template type
2. **Permissions** — required Chrome APIs
3. **Screens/Views** — every UI section
4. **Features** — priority-ordered (drives Phase 3 loop order)
5. **Data Model** — IndexedDB schema
6. **AI Integration** — providers, redaction rules, API calls
7. **Content Script Behavior** — DOM injection requirements
8. **Monetisation** — tier structure, feature-to-tier mapping

### The Five Build Phases

Defined in `864z-build-kit/phases/extension/`. Phases are non-skippable; each has a hard gate.

| Phase | File | Target Time | Gate |
|-------|------|-------------|------|
| 1. Scaffold | `phase-1-scaffold.md` | 10–15 min | Extension loads in Chrome without errors |
| 2. UI Shell | `phase-2-ui-shell.md` | 30–45 min | All views render, OIA styling, dark mode working |
| 3. Feature Loop | `phase-3-feature.md` | Per feature | Each feature works end-to-end (repeated) |
| 4. Polish | `phase-4-polish.md` | Varies | Production-quality UX, no console errors |
| 5. QA/Test | `phase-5-qa-test.md` | Varies | Full checklist passes, `BUILD_MANIFEST.md` updated |

### Active Strike Builds (canonical: `../LLC-DIV-3-FACTORY/output/`)

| Strike ID | Product | Replaces | Key Custom Modules |
|-----------|---------|----------|--------------------|
| 864z-2026-002 | ReadVault | Pocket | `pocket-parser.js` |
| 864z-2026-003 | InstaRescue | Instapaper | `deep-parser.js` (CSV) |
| 864z-2026-004 | PassVault | Dashlane/1Password | `password-parser.js`, `crypto-vault.js`, `breach-checker.js` |
| 864z-2026-005 | ReadFlow | Instapaper | `instapaper-parser.js`, `epub-builder.js`, `qr-generator.js` |

Each build contains:
- `BUILD_MANIFEST.md` — bricks used, custom logic, what's missing, current status
- `manifest.json` — Chrome extension config (MV3)
- `lib/` — project modules + inherited bricks
- `sidepanel/`, `background/`, `options/` — extension contexts

### Build Completion Gate (before HALLWAY)

- [ ] All five phases complete
- [ ] Zero console errors, extension loads without Chrome warnings
- [ ] All views render, dark mode works
- [ ] All features tested end-to-end
- [ ] Import/export verified (where applicable)
- [ ] Tier gating verified (where applicable)
- [ ] No hardcoded secrets, no analytics, no telemetry
- [ ] Icons finalised (not placeholders)
- [ ] `BUILD_MANIFEST.md` updated with final status

### Brand & Pricing Constants

```javascript
PRICING = { FREE: 0, PRO: 12, LIFETIME: 150 }  // USD/month or one-time

BRAND_COLORS = {
  PRIMARY:   '#00d084',  // Trust Green
  SECONDARY: '#0a0a0f',  // Deep Black
  ACCENT:    '#00f09a',  // Bright Green
}
```

### Key Build System Files

| File | Purpose |
|------|---------|
| `registry.json` | Core brick registry |
| `864z-build-kit/MASTER_REGISTRY.json` | Extended brick + extension catalog |
| `864z-build-kit/FACTORY_INVENTORY.md` | What components exist where, harvest guide |
| `864z-build-kit/CLAUDE-base.md` | Universal agent rules |
| `864z-build-kit/CLAUDE-extension.md` | Chrome extension agent rules |
| `864z-build-kit/references/extension/chrome-extension-standard-2026.md` | MV3 architecture spec |
| `864z-build-kit/references/core/864z-vulture-to-block-build-pattern.md` | Modularity philosophy |
| `864z-build-kit/templates/manifest.json` | Manifest scaffold |
| `864z-build-kit/templates/gated-feature.js` | Tier-locking pattern |
| `864z-build-kit/templates/credit-system.js` | Pay-per-use monetisation |
| `OFFICE/DIV-3-FACTORY/MANIFEST.md` | Factory technical standards |

---

## Environment

Requires `.env` with:
```
APIFY_TOKEN=your_token_here
```

## Build Brick Registry (`registry.json`)

| Brick ID | Name | Type |
|----------|------|------|
| BRK-DB-001 | IndexedDB_Core | Persistence Vault |
| BRK-MIG-002 | Text_Parser_Base | Migration Engine |
| BRK-OPT-003 | Native_Discard_Logic | Performance Brick |
