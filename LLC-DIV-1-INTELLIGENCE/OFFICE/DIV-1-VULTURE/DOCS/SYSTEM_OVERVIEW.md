# VULTURE NEST: SYSTEM OVERVIEW

**Classification:** 864zeros Internal
**Version:** 1.0.0
**Last Updated:** 2026-03-19

---

## EXECUTIVE SUMMARY

The Vulture Nest is a **sovereign research engine** designed to identify, validate, and document "SaaS Hostages"—users trapped in overpriced, lock-in-heavy software products. Through systematic sentiment analysis, pricing scans, and technical friction audits, the engine produces **Strike Quest** documents that determine whether a rescue product is worth building.

The system is **standalone**. It has no dependencies on the Factory (DIV-3) or Studio (DIV-4). Its sole purpose is to answer one question:

> **"Should we build a rescue product for these users?"**

---

## THE MISSION

864zeros operates on a simple thesis:

1. **SaaS companies hold users hostage** through subscription ransoms and export friction.
2. **Local-first alternatives** can liberate these users at a fraction of the cost.
3. **Speed matters.** The first credible rescue product captures the migration wave.

The Vulture Nest identifies which hostages are worth rescuing by applying **The Math of the Kill**—a quantitative framework that filters opportunity from noise.

---

## THE FOUR PILLARS

Every Strike Quest document is built on four analytical pillars. A quest is incomplete if any pillar is missing.

### PILLAR 1: THE RANSOM

> *"What is the pricing pain? How are users held hostage?"*

The Ransom analysis examines how a SaaS product extracts value from its users:

| Signal | Description |
|--------|-------------|
| **Pricing Model** | Subscription, per-seat, freemium, or one-time |
| **Price Range** | Actual dollar amounts extracted |
| **Free Tier Limits** | What users can't do without paying |
| **Enterprise Wall** | Requires sales call = opacity = ransom |
| **Price Increase History** | Pattern of raising prices on captive users |

**Ransom Severity** is scored 1-10. A severity of **7+** indicates active user frustration.

---

### PILLAR 2: THE FRICTION

> *"How are users locked in? What are the migration barriers?"*

The Friction analysis examines how difficult it is to leave:

| Signal | Description |
|--------|-------------|
| **Export Formats** | What data formats are available (CSV, JSON, etc.) |
| **Export Limitations** | Rate limits, incomplete exports, hidden fields |
| **API Restrictions** | Throttling, paywalls, deprecated endpoints |
| **Lock-in Mechanisms** | Proprietary formats, ecosystem dependencies |
| **Migration Complexity** | Trivial, Moderate, Difficult, or Nightmare |

**Data Portability Score** is 1-10 (higher = more portable). A score of **3 or below** indicates significant lock-in.

---

### PILLAR 3: THE MATH OF THE KILL

> *"Does the opportunity pass the 8.64 threshold?"*

This is the quantitative gate. No exceptions.

#### The 864z Score

The Vulture Score is calculated from three Z-factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Z-Convergence** | 0.45 | Signal strength across independent sources |
| **Z-Velocity** | 0.35 | Recency and urgency of pain signals |
| **Z-Scarcity** | 0.20 | Absence of modern alternatives |

**Formula:**

```
Base Score = (Z-Convergence × 0.45 + Z-Velocity × 0.35 + Z-Scarcity × 0.20) × 10
Exit Multiplier = 1.5x if Rule of 40 ≥ 40%, else 1.0x
Vulture Score = Base Score × Exit Multiplier
```

#### The 8.64 Threshold

**8.64 is the Go/No-Go gate.**

- **Score ≥ 8.64:** Strike Qualified. Proceed to Blueprint.
- **Score < 8.64:** Below Threshold. Archive or re-validate later.

The threshold is not arbitrary. It represents the minimum signal density required to justify the opportunity cost of building a rescue product.

#### Rule of 40 Analysis

The Rule of 40 is a SaaS health metric:

```
Rule of 40 = Growth% + Margin%
```

- **≥ 40%:** Exit multiplier = **1.5x** (healthy market, faster exit)
- **< 40%:** Exit multiplier = **1.0x** (standard valuation)

#### Market Sizing (TAM/SAM/SOM)

| Tier | Calculation |
|------|-------------|
| **TAM** (Total Addressable Market) | Estimated traffic × 5 |
| **SAM** (Serviceable Addressable Market) | TAM × 30% |
| **SOM** (Serviceable Obtainable Market) | SAM × 5% (Year 1) |

#### The Sacred Number: $141,312

The target exit valuation is **$141,312**. This is the benchmark for micro-SaaS acquisitions on platforms like Acquire.com. The engine calculates months-to-exit based on:

```
Monthly Recurring Revenue (MRR) = SOM × 2% conversion × Price Point
Target Annual Revenue = $141,312 ÷ 4x multiple = $35,328
Target MRR = $2,944
Months to Exit = Time to reach Target MRR at 10% monthly growth
```

---

### PILLAR 4: THE TECHNICAL RESCUE BLUEPRINT

> *"How do we build the alternative?"*

The Blueprint defines the rescue product architecture:

| Element | Standard Approach |
|---------|-------------------|
| **Codename** | `{Target}Rescue` |
| **Architecture** | Chrome Extension MV3 (local-first) |
| **Storage** | IndexedDB (zero cloud dependency) |
| **Offline-First** | Yes (works without internet) |

#### Rescue Capabilities (Standard)

1. Import from target product (full data migration)
2. Local-first storage (no cloud required)
3. Export to multiple formats (JSON, CSV, Markdown)
4. Zero-knowledge architecture

#### Delta Features (Differentiators)

| Feature | Priority | Description |
|---------|----------|-------------|
| **One-Click Migration** | P0 | Guided import wizard for refugees |
| **Offline-First** | P0 | Works without internet |
| **Data Portability** | P1 | Export anytime, no restrictions |

---

## T-SHIRT SIZING

Build complexity is gated by T-shirt sizes. **L-size builds are avoided.**

| Size | Max Hours | Max Complexity | Description |
|------|-----------|----------------|-------------|
| **XS** | 24 | 2 | Single-script / Automation |
| **S** | 96 | 4 | Basic UI + API logic |
| **M** | 336 | 7 | Frontend + Database + Auth |
| **L** | 720 | 10 | Multi-platform / Agentic AI (**AVOID**) |

**Rule:** If a rescue product requires L-size complexity, it is disqualified regardless of Vulture Score.

---

## STRIKE QUALIFICATION CRITERIA

A target is **Strike Qualified** only if ALL conditions are met:

| Criterion | Requirement |
|-----------|-------------|
| **Vulture Score** | ≥ 8.64 |
| **T-Shirt Size** | XS, S, or M (not L) |
| **Competitors** | ≤ 3 modern alternatives |

If any criterion fails, the strike is either archived (Hangar Policy) or rejected.

---

## THE HANGAR POLICY

Not all qualified strikes are executed immediately. The **Hangar** is an archive for:

1. **Qualified but Shelved:** Score ≥ 8.64, but resources unavailable.
2. **Seasonal Opportunities:** Time-sensitive launches (e.g., tax season tools).
3. **Re-validation Pending:** Promising signals, insufficient data.

### Hangar Entry Criteria

- Vulture Score between **7.0 and 8.64** (near-threshold)
- L-size complexity but high signal density
- Market timing requires delayed launch

### Hangar Review Cadence

Hangar contents are reviewed monthly. Strikes are either:

- **Promoted:** New data justifies strike execution
- **Archived:** Opportunity window closed
- **Merged:** Combined with related strike targets

---

## OUTPUT ARTIFACTS

Every Strike Quest produces two artifacts:

| File | Format | Purpose |
|------|--------|---------|
| `VN-{YEAR}-Q{NNN}.json` | JSON | Machine-readable data for pipeline integration |
| `VN-{YEAR}-Q{NNN}.md` | Markdown | Human-readable Strike Quest document |

### Quest ID Convention

```
VN-2026-Q001
│  │     │
│  │     └── Quest sequence number (zero-padded)
│  └──────── Year
└─────────── Vulture Nest prefix
```

---

## OPERATIONAL PRINCIPLES

### 1. Research Only

The Quest Engine does not build products. It identifies opportunities. The Factory (DIV-3) builds. The Studio (DIV-4) markets.

### 2. No Hallucinations

All analysis is derived from live web searches. If signals don't exist, the quest reflects that reality.

### 3. Speed Over Perfection

A Strike Quest should be generated in **under 5 minutes**. Deep research can follow for qualified strikes.

### 4. The Data Speaks

Human intuition is input. The math is output. If the score is below 8.64, the answer is no.

---

## GLOSSARY

| Term | Definition |
|------|------------|
| **SaaS Hostage** | User trapped by pricing or lock-in in a software product |
| **Strike Quest** | Complete research document for a rescue opportunity |
| **Vulture Score** | Composite metric (0-15) measuring rescue viability |
| **The Ransom** | Analysis of pricing pain and extraction tactics |
| **The Friction** | Analysis of lock-in mechanisms and migration barriers |
| **Math of the Kill** | Quantitative validation framework |
| **Blueprint** | Technical architecture for rescue product |
| **Hangar** | Archive for qualified-but-shelved opportunities |
| **864z** | The scoring system threshold (8.64) |

---

*Document Version: 1.0.0*
*Generated by: Vulture Nest Documentation System*
*Classification: 864zeros Internal*
