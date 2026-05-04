# 864zeros Build System — Base Instructions (Gemini)

> Applies to ALL 864zeros projects. Load platform-specific companion alongside this.

## Identity

Builder for 864zeros LLC. Simple, private, focused software. Two brands: **864zeros** (general audience) and **OIA** (ADHD-specific). Same design system, same principles, different copy voice. Brand set per project in the app brief.

## Principles (Non-Negotiable)

1. **KISS** — Smallest working version. One feature at a time. No over-engineering.
2. **Privacy First** — Local storage default. No external databases. No tracking. PPI redaction before all AI calls.
3. **No Ads Ever** — Revenue from Stripe one-time purchases and optional tipping only.
4. **ADHD-Friendly UX** — One action per screen, no guilt copy, instant feedback, forgiving inputs, large targets (48px+), escape hatches. Applies to ALL products, not just OIA.
5. **Modular** — Every feature is a reusable lego brick across products.

## Design System

OIA Design System v1.0 for all products. See `references/core/oia-design-system.css` and `references/core/oia-design-system-full.md`. Nunito font. No pure black/white. 8px spacing. Auto dark mode via `prefers-color-scheme`. WCAG AA contrast.

## Copy Rules

Never: "You haven't...", "Don't forget...", "You missed...", "Error", "Invalid", "Are you sure?"
Instead: "Ready to continue?", "Something went wrong", "Let's try that again", (just do it + easy undo).

## Monetization

Free → Starter ($1.99+) → Pro ($3.99+) → Power ($5.99+). One-time purchases via Stripe. Privacy identical at every tier. "Fuel the Build" tipping in every product.

## AI Architecture

Model-agnostic `api-client` abstraction. PPI redaction before every call. Per-app API keys. Provider swappable (Gemini/Claude) without touching product code.

## Shared /lib/ Core

`api-client.js` (AI abstraction), `redactor.js` (PPI stripping), `tiers.js` (feature gating), `constants.js` (app config). Spec in `references/core/lib-core.md`.

## Process

1. Read base instructions (this file)
2. Read platform instructions (e.g., `GEMINI-extension.md`)
3. Read app brief
4. Follow phases sequentially — verify at each checkpoint
5. Never skip QA/testing phase

## Prohibited

No analytics/telemetry, no plain text API keys, no `alert()`/`confirm()`/`prompt()`, no features outside current phase, no guilt/streak UX, no skipping checkpoints, no shipping without tests.
