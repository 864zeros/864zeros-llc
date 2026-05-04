# 864zeros Build System — Base Instructions

> **Scope:** This file applies to ALL 864zeros projects — extensions, web apps, mobile, SaaS.  
> **Loaded:** Always. Every CLI session starts here.  
> **Platform-specific rules** are in a separate companion file (e.g., `CLAUDE-extension.md`).

---

## Who We Are

You are building for **864zeros LLC**. We make simple, private, focused software. Some products carry the **OIA** brand (ADHD-specific). Others are general-audience tools. All share the same DNA.

## Brand Architecture

| Brand | Audience | Voice |
|-------|----------|-------|
| **864zeros** | Everyone | Clean, professional, approachable. "Simple tools that respect your time." |
| **OIA** | ADHD community | Warm, encouraging, zero-guilt. "Organize your brain, not your life." |

The brand is set per project in the app brief (`brand: 864zeros` or `brand: OIA`). Adjust copy voice accordingly. Design system is the same for both.

---

## Non-Negotiable Principles

### 1. KISS

Ship the smallest working version. One feature at a time. No premature abstraction. No over-engineering. If it works and it's simple, it's done.

### 2. Privacy First

- All user data stored locally by default. No external databases.
- No analytics that phone home. No telemetry. No tracking pixels.
- PPI (Personal Private Information) redacted before every AI API call.
- AI providers configured for no-retention / no-log where available.
- If data leaves the device, the user explicitly opted in (e.g., Google Drive sync).
- Privacy is the baseline, not a premium feature.

### 3. No Ads. Ever.

Revenue comes from one-time tier purchases and optional tipping ("Fuel the Build"). Never advertising. Never selling data. Never sponsored content. This is a brand promise, not a preference.

### 4. ADHD-Friendly UX (For All Products)

Even when the product isn't OIA-branded, these rules apply. What's best for ADHD brains is best for everyone.

| Rule | Rationale |
|------|-----------|
| One primary action per screen | Reduces decision paralysis |
| No streaks or punishment mechanics | Missing a day is not failure |
| No guilt copy | Never shame the user |
| Large touch/click targets (min 48px) | Reduces frustration |
| Instant feedback on every interaction | Confirms the action worked |
| Forgiving inputs | Auto-save, easy undo, no "are you sure?" spam |
| Minimal required fields | Ask for least possible information |
| Progressive disclosure | Hide complexity until needed |
| Clear visual hierarchy | User knows where to look in <1 second |
| Escape hatches | Easy to go back, undo, or start over |

### 5. Modular / Lego Brick Architecture

Every feature you build may end up in a different product later. Build accordingly:

- Separate concerns — UI, logic, data, and API calls in distinct modules
- No hardcoded assumptions about where a module lives
- Shared code goes in `/lib/` — never duplicated, never modified per-project
- If you build a tagging system for App A, it should drop into App B unchanged

---

## Copy Rules

### Never Write

- "You haven't finished..."
- "Don't forget to..."
- "You missed yesterday"
- "Complete your profile"
- "Task failed"
- "Error"
- "Invalid input"
- "Are you sure?"

### Instead Write

- "Ready to continue?"
- "Your tasks are here when you need them"
- (Say nothing about missed days)
- "Add more when you're ready"
- "That didn't work — try again?"
- "Something went wrong"
- "Let's try that again"
- (Just do it, make undo easy)

---

## Design System

All 864zeros products use the **OIA Design System v1.0** regardless of brand.

**Reference files (in `references/core/`):**
- `oia-design-system.css` — CSS implementation for web/extension platforms
- `oia-design-system-full.md` — Complete token reference, component specs, accessibility standards

**Key rules:**
- Font: Nunito (with system fallback stack)
- No pure black (`#000000`) or pure white (`#FFFFFF`) — ever
- 8px spacing base unit
- Dark mode via `prefers-color-scheme` (auto, no manual toggle)
- WCAG AA contrast minimum on all text
- `prefers-reduced-motion` respected (CSS handles automatically)

---

## Monetization Framework

### Tier Model

Every product has the same tier structure. Prices set per product in the app brief.

| Tier | Model | Floor Price |
|------|-------|-------------|
| Free | Always available | $0 |
| Starter | One-time purchase | $1.99 minimum |
| Pro | One-time purchase | $3.99+ |
| Power | One-time purchase | $5.99+ |

Privacy is identical at every tier. Paid tiers unlock features, not privacy.

### Fuel the Build

Every product includes an optional tipping mechanism:
- "Buy us a coffee" button in settings/options
- Future: Build Board where users fund specific features
- Powered by Stripe

### Subscription (Future)

When multiple products are bundled into a suite, subscription pricing applies. Not for individual products in v1.

### Payment Processing

Stripe handles all transactions. Per-app API keys for usage visibility. Users never see or manage API keys or payment infrastructure.

---

## AI Integration

### Model-Agnostic Architecture

Every product calls AI through an abstraction layer (`api-client`). The interface is:

```
Extension calls analyze(content, instruction)
  → redactor strips PPI
  → api-client routes to active provider (Gemini / Claude)
  → Response returns in standard format
```

The provider is swappable without touching product code. Users don't know or care which model runs underneath.

### Per-App API Keys

Each product gets its own API keys for each provider. Full usage visibility, independent kill switches, no shared blast radius.

### Privacy Contract

- Content is PPI-redacted locally before any API call
- AI providers configured for no-retention where available
- Prompts go out, responses come back — no content stored server-side
- The user's raw content in local storage is NEVER sent to any AI provider

---

## Shared /lib/ Core Modules

These modules are platform-agnostic and included in every 864zeros product. Full spec in `references/core/lib-core.md`.

| Module | Purpose |
|--------|---------|
| `api-client.js` | AI provider abstraction — model-agnostic analyze/summarize |
| `redactor.js` | PPI stripping before API calls |
| `tiers.js` | Payment tier verification and feature gating |
| `constants.js` | App slug, storage keys, message types, tier definitions |

Platform-specific modules (storage, backup, etc.) are defined in the platform companion spec.

---

## Build Process

1. **Read the base instructions** (this file) — loaded automatically
2. **Read the platform instructions** (e.g., `CLAUDE-extension.md`) — loaded per project type
3. **Read the app brief** — the specific product being built
4. **Follow phases sequentially** — never skip, verify at each checkpoint
5. **One feature per phase cycle** — test before moving on

---

## What You Never Do

- Add analytics, telemetry, or tracking that sends data externally
- Store API keys in plain text in source files
- Use `alert()`, `confirm()`, or `prompt()` in any UI
- Add features not in the current phase instruction
- Use bullet points or numbered lists in user-facing copy
- Write guilt-based, streak-based, or shame-based UX copy
- Skip a verification checkpoint
- Ship without QA and testing (see Phase 5)
