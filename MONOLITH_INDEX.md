# 864zeros Monolith — Index

**Purpose:** A "Yellow Pages" of the active systems inside `C:\dev\864zeros-llc`. AETHER agents should read this file first to discover what tools exist before building or duplicating capability.

**Maintainer:** 864zeros LLC / Jeff Conn (Cresco, PA Always-On node)
**Last synced:** 2026-05-05

---

## Quick Locator

| System | Division | Role | Primary Doc |
|---|---|---|---|
| **aether-pulse-x** | LLC-DIV-3-FACTORY | GTM engine — drafts X replies for human review | `LLC-DIV-3-FACTORY/aether-pulse-x/README.md` |
| **vulture-nest** | LLC-DIV-1-INTELLIGENCE | Opportunity scout — finds SaaS rescue targets | `LLC-DIV-1-INTELLIGENCE/CLAUDE.md` |
| **864z-build-kit** | (root) | Build standards + reusable bricks for all products | `864z-build-kit/README.md` |

Cross-cutting: Telegram bot `@JC_zbot` is the heartbeat to Jeff for all three. Apify is the shared scraping substrate. Anthropic Claude is the shared LLM.

---

## 1. aether-pulse-x — Social Engagement Engine

**Location:** `LLC-DIV-3-FACTORY/aether-pulse-x/`
**Version:** V1.1 (production-functional as of 2026-05-05)

### Purpose
Monitor X (Twitter) for high-engagement posts about AI agents and frameworks, score them for AETHER relevance using Claude, draft contextual replies in Jeff's voice, and deliver drafts to Telegram for manual review and posting. **Hard constraint: never auto-posts.** Proven 18% CTR benchmark on the 2026-03-26 @Suryanshti777 reply.

### Stack
- Python 3.11
- `apify-client`, `anthropic`, `python-telegram-bot`, `python-dotenv` (4 deps total — no frameworks, no vector DB)
- SQLite for engagement log + dedup
- Railway deployment via `Procfile` + `nixpacks.toml`

### Inputs
- **Monitor mode:** Apify Tweet Scraper V2 results across 10 keyword queries (≥50 likes, English, no retweets)
- **Snapshot mode:** local image file (`.png`/`.jpg`/`.gif`/`.webp`) of a paper or post screenshot
- **URL mode:** any arXiv / Zenodo / blog URL
- **Bot mode:** Telegram commands (`/scan`, `/status`, `/url`, `/help`)

### Outputs
- Telegram message (HTML formatted) to Jeff: original post, score+tier, gap-identified reasoning, drafted reply, X-adjusted char count, follow reminder
- SQLite rows in `data/engagement_log.db`
- `data/replied_posts.json` dedup registry
- DAI Pulse JSON to stdout for downstream agents

### Pipeline
```
Apify (scrape X)
  → scorer.py (Claude semantic analysis, 6 intent tiers T1–T6, threshold 0.65)
    → drafter.py (Claude reply generator, ≥1 power word, ≤280 X-adjusted chars)
      → notifier.py (async Telegram delivery)
        → Jeff posts manually
```

### Entry Points
```bash
python pulse_x.py                    # Monitor mode
python pulse_x.py --snapshot img.png # Image analysis
python pulse_x.py --url <link>       # URL analysis
python bot.py                         # Persistent Railway worker
```

### Key Files
| File | Role |
|---|---|
| `pulse_x.py` | Async orchestrator — three CLI modes |
| `scorer.py` | Claude semantic scorer (T1–T6) + recency bonus |
| `drafter.py` | Claude draft generator + X-char math + power-word verification |
| `notifier.py` | Async Telegram delivery (`@JC_zbot`) |
| `scraper.py` | Apify Tweet Scraper V2 adapter (read-only) |
| `logger.py` | SQLite log + dedup registry |
| `snapshot.py` | Image / URL analysis |
| `bot.py` | Telegram bot for Railway |
| `config.py` | Keywords, proof points, power words, taglines, thresholds |
| `capsule/` | AETHER capsule files (manifest, persona, kb, kg) |

### Operational Constraints
- Max 3 drafts per day
- Score threshold: `0.65`
- Recency: ≤6h +0.15, ≤24h +0.10, ≤48h 0, >48h −0.20
- Power words required (programmatically verified): `self-healing, self-educating, self-verifying, portable, verified, intrinsic, capsule, grounded`
- Never mention SAP or any employer

---

## 2. vulture-nest — Opportunity Discovery System

**Location:** `LLC-DIV-1-INTELLIGENCE/` (Python source at root level + structured subfolders)
**Primary doc:** `LLC-DIV-1-INTELLIGENCE/CLAUDE.md` (full spec — no `README.md` exists; this file is canonical)

### Purpose
Autonomous market intelligence for SaaS re-disruption ("unbundling"). Finds **carcasses** (stagnant incumbents), collects **blood in the water** (community pain signals), validates against the **8.64 financial gate**, and generates **Strike Dossiers** for the build factory. Single thesis: SaaS holds users hostage; local-first alternatives liberate them; speed wins.

**Core philosophy:** *NO FALSE OPTIMISM.* Every lead terminates unless score ≥ 8.64.

### Stack
- Python 3
- `apify-client`, `python-dotenv`
- External APIs: Apify (Google Search, Reddit, web crawling, residential proxies — "Stealthfox" protocol), Algolia (HN search)
- Scrape targets: Reddit, Hacker News, G2, Capterra, TrustRadius, Twitter/X, Product Hunt
- Output: JSON (strike packages) + Markdown (catalog `Vulture_Nest.md`)

### Inputs
- Target name (e.g. `"Knak"`, `"OneTab"`, `"1Password"`)
- Optional category filter (`"chrome extension"`, etc.)
- Tunable thresholds: max competitors (default 3), Rule-of-40 growth/margin minimums

### Outputs
- `strikes/{strike_id}.json` — full Strike Package with architecture, GTM, financials
- Entries appended to `Vulture_Nest.md` (living catalog of qualified opportunities)
- `scan_results/` — leaderboards from full-cycle scans
- For passing strikes: a complete Strike Dossier handed off to `864zeros_engine/builds/{strike-id}/`

### Five-Stage Funnel
```
1. DISCOVERY      — Isenberg Scan (lament threads) + Carcass Scan (stagnant apps)
2. PATTERN        — Growth Stack, Tech Stack, Anti-Patterns from Indie Hackers/Failory
3. VALIDATION     — Rule of 40, Exit Multiplier χ, final 864z score (≥ 8.64 gate)
4. DOSSIER        — GTM rescue scripts, target MRR, projected exit valuation
5. TECH BRIEF     — Translates dossier to platform-specific build_prompt.md
```

### Sacred Constants
```
TARGET_EXIT_VALUATION = $141,312   (micro-SaaS exit benchmark)
TARGET_MRR            = $2,944
RULE_OF_40_THRESHOLD  = 40
SCORE_THRESHOLD       = 8.64
SCARCITY_THRESHOLD    = 3 (max competitors)
```

### Verdict States
- `STRIKE` — Score ≥ 8.64, build authorized
- `HANGAR` — Score 7.0–8.63, shelved for monthly re-review
- `REJECT` — Score < 7.0, archived

### Entry Points
```bash
python app.py                          # Full discovery + validation cycle
python app.py --target "OneTab"        # Targeted deep-dive
python app.py --max 3 --growth 20      # Custom params + dry-run
python run_scan.py                     # Full-cycle scan with leaderboard
python quest_engine_v2.py --target "1Password" --mode quick
python validator.py                    # 3-case test harness
```

### Key Files
| File | Role |
|---|---|
| `app.py` | Pipeline orchestrator (CLI) |
| `agents.py` | `V_Trendspotter`, `V_Scout`, `V_Analyst` |
| `discovery_engine.py` | Cynical scraper — carcasses + pain signals |
| `validator.py` | 8.64 gatekeeper — `LeadCandidate → StrikePackage` |
| `tool_wrapper.py` | Apify wrapper with Stealthfox stealth protocol |
| `quest_engine.py` / `quest_engine_v2.py` | Strike Quest doc generators |
| `scrapers/` | Per-platform adapters (twitter, reddit, hn, g2) |
| `enrichment/` | V2 pipeline — engagement, authority, velocity, migration, crisis |
| `Vulture_Nest.md` | Living catalog of qualified strikes |
| `OFFICE/` | Org structure — DIV-1, DIV-3, DIV-4, HALLWAY, DASHBOARD |

### Active Strikes (as catalogued)
| Strike ID | Product | Replaces | Status |
|---|---|---|---|
| 864z-2026-002 | ReadVault | Pocket | DEPLOYED |
| 864z-2026-003 | ReadFlow / InstaRescue | Instapaper | BUILD_IN_PROGRESS |
| 864z-2026-004 | PassVault | Dashlane / 1Password | STRIKE_INITIATED |

> **Note:** vulture-nest contains its own embedded `864z-build-kit/` and `864zeros_engine/builds/`. The root-level `864z-build-kit/` (entry #3 below) is the canonical build-kit.

---

## 3. 864z-build-kit — Build Standards & Brick Library

**Location:** `864z-build-kit/` (root level)
**Version:** 2.0

### Purpose
The "gold-standard" source of truth for every product 864zeros ships. One brief + one CLI session = one shippable product. Separates **universal rules** (apply everywhere) from **platform rules** (Chrome extension today, web/mobile planned). Used by Claude Code and Gemini CLI.

### Stack
- Markdown (specs, briefs, phases, agent instructions)
- CSS (`oia-design-system.css`, `aether-ui.css` — the live design system)
- Vanilla JavaScript ES modules (shared bricks: `api-client.js`, `redactor.js`, `tiers.js`, `constants.js`)
- Python utility (`lib/python/vulture_tools.py` — Stealthfox scraper)

### Inputs
- A completed brief from `briefs/extension-brief-template.md` (identity, permissions, screens, features, data model, AI integration, monetization)
- Agent instruction files auto-loaded per session: `CLAUDE-base.md` + `CLAUDE-extension.md` (or `GEMINI-*` variants)

### Outputs
- A shippable Chrome extension under `LLC-DIV-3-FACTORY/extensions/{slug}/`
- Phase-gated build artifacts: scaffold → UI shell → features → polish → QA recap
- All extensions inherit `aether-ui.css` design system, the four shared `/lib/` modules, and tier-based monetization

### Five Build Phases (Non-Skippable)
| Phase | Target Time | Gate |
|---|---|---|
| 1. Scaffold | 10–15 min | Loads in Chrome with no errors |
| 2. UI Shell | 30–45 min | All views render, OIA styling, dark mode works |
| 3. Feature Loop | per feature | Each feature works end-to-end before next |
| 4. Polish | varies | Production-quality finish, zero console errors |
| 5. QA / Test | varies | Full checklist passes, BUILD_MANIFEST.md updated |

### Shared `/lib/` Modules (Used By Every Product)
| Module | Purpose |
|---|---|
| `api-client.js` | Multi-provider AI abstraction (Gemini ↔ Claude swap without product changes) |
| `redactor.js` | PII stripping before any AI API call (privacy baseline) |
| `tiers.js` | Feature tier verification + gating |
| `constants.js` | App slug, storage keys, message types, tier definitions |
| `python/vulture_tools.py` | Apify Stealthfox scraper with residential proxy rotation |

Extension-only modules (per `lib-extension.md`): `db.js` (IndexedDB), `store.js` (chrome.storage), `backup.js` (Drive sync).

### Non-Negotiable Principles (CLAUDE-base.md)
- **KISS** — smallest working version; one feature at a time
- **Privacy First** — local storage default, PII redacted before any AI call, no telemetry
- **No Ads. Ever.** — revenue is one-time tier purchases + optional tipping
- **ADHD-Friendly UX** — one primary action per screen, no streaks, no guilt copy, 48px+ targets
- **Modular / Lego Brick** — shared code in `/lib/`, never duplicated
- **All extensions are side-panel** — no popup, no DevTools (see `CLAUDE-INTEGRITY.md`)

### Key Directories
| Path | Role |
|---|---|
| `CLAUDE-base.md` / `GEMINI-base.md` | Universal agent rules, auto-loaded per session |
| `CLAUDE-extension.md` / `GEMINI-extension.md` | Chrome extension overlay |
| `references/core/` | Design system + lib spec (applies to all products) |
| `references/extension/` | MV3 standard + lib-extension spec |
| `briefs/` | Brief templates |
| `phases/extension/` | Phase 1–5 instruction files |
| `lib/` | Shared brick implementations |

### Brand & Pricing Constants
```javascript
PRICING = { FREE: 0, PRO: 12, LIFETIME: 150 }   // USD
BRAND_COLORS = {
  PRIMARY:   '#00d084',   // Trust Green
  SECONDARY: '#0a0a0f',   // Deep Black
  ACCENT:    '#00f09a',   // Bright Green
}
```
Font: Nunito (system fallback). Never pure black/white. 8px spacing base. Dark mode auto via `prefers-color-scheme`. WCAG AA minimum.

---

## Cross-System Notes for AETHER Agents

- **Sync rule:** Edit shared `/lib/` modules in `864z-build-kit/`, then propagate outward to consumers. Never duplicate-and-modify in-place.
- **Division boundary:** Code in div-3, strategy in div-4, theory in div-1. Vulture-nest currently lives in div-1 because its output is research; the products it spawns get built in div-3.
- **Telegram is the heartbeat:** All three systems converge on `@JC_zbot` for human-in-the-loop notifications.
- **Anthropic + Apify are shared substrates:** Both pulse-x and vulture-nest scrape via Apify and reason via Claude. New agents should reuse `vulture_tools.py` for scraping and the `api-client.js` pattern for LLM calls.
- **No auto-execution:** pulse-x never auto-posts, vulture-nest never auto-builds. The HALLWAY gate (vulture-nest) and Telegram review (pulse-x) require Jeff's signature.
