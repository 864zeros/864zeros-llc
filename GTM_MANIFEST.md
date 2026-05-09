# 864zeros GTM Manifest

**Authority:** Cross-cutting brand and go-to-market doctrine. Every customer-facing surface — extensions, web apps, marketing sites, store listings, support docs, social presence — inherits these definitions.
**Established:** 2026-05-08
**Authoring authority:** Systems Architect (864zeros LLC)
**Update protocol:** Append revisions with timestamps. Prior versions preserved for legal / diff trail. Changes propagate to all surfaces within one shipping cycle.

---

## 1. The Parent Manifesto

> Most complex problems have simple solutions. Most ADHD applications try to solve a complex mind with complexity. We strive to focus on core challenges and BRIDGE THE GAP simply. Focusing on one challenge at a time. Always simple, always yours, and always private.

**Application:**
- This is the company-wide thesis. Every product, feature, and copy decision must be answerable to it.
- The phrase **BRIDGE THE GAP** is the operational verb. Products are bridges, not destinations.
- **One challenge at a time** — the architectural commitment that informs every UI: one primary action per screen, no feature bloat, no consolidation pressure.
- **Always simple, always yours, always private** — the immutable triad. Loss of any of the three breaks the contract.

---

## 2. The [864F] Flux Identifier

**Slogan:**
> We fill the gaps that the others can't or won't. Making software friendly again. The kinetic bridge for your digital workspace.

**Identifier prefix:** `[864F]`

**Application:**
- Prepended to every product display name in customer-facing surfaces:
  - Side-panel header: `[864F] MigrationPilot`
  - Options page hero: `[864F] MigrationPilot`
  - Chrome Web Store listing title
  - Marketing-site product cards
  - Footer line 1 references the brand: `... | 864-Flux | 864zeros LLC`
- The slogan body is for marketing surfaces, not embedded in product chrome (avoids ad-feel inside the tool).
- **Flux** connotes movement, change, kinetic energy — counterpoint to the inertia of the bloated suites our products replace.

---

## 3. Dopamine-Friendly UI

**Definition:**
> *Dopamine-Friendly UI: Designed to minimize 'Executive Function' tax. We use high-contrast focal points, eliminate distracting animations, and provide immediate visual feedback for single-task completion. By addressing one core challenge at a time, we help maintain the flow state without the 'Decision Fatigue' common in complex suites.

**Application:**
- This is the **operational definition** of the ADHD-friendly UX rules in `CLAUDE-base.md`.
- Surface as a tooltip / info-popover on the Theme Selector (or equivalent) in every product's Options page.
- Concrete commitments embedded in the definition:
  - **High-contrast focal points** — primary action visually dominant; secondary actions de-emphasized.
  - **Eliminate distracting animations** — `prefers-reduced-motion` always honored; no decorative motion.
  - **Immediate visual feedback** — every interaction confirms within ~150 ms (toast, state change, badge update).
  - **Single-task completion** — one primary action per screen; no nested modal dialogs.
  - **Address one core challenge** — products are single-purpose tools, not suites.

---

## 4. The Architect's Hook

> Built for people with ADHD by someone with ADHD. Scientifically proven to work for me. So, we're sharing with you.

**Application:**
- About / Bio sections.
- Marketing landing-page sub-hero.
- Long-form footer of options pages (compact variant).
- Press / outreach short-bio.

The intentional informality (*"scientifically proven to work for me"*) is the credibility move — it short-circuits the parasocial-influencer fakeness of "this will change your life" copy.

---

## 5. Legal & Brand Identity

| Field | Value |
|---|---|
| Entity | 864zeros LLC |
| Current year | 2026 |
| Terms of Use URL | https://864zeros.com/terms |
| Privacy Policy URL | https://864zeros.com/privacy |
| Brand identifier prefix | `[864F]` |
| Brand mark in footer | `864-Flux` |
| Pillar tags | OIA (ADHD-specific) · FHG / For His Grace (Faith/Heritage Pillar) · 864zeros (general-audience) |

All customer-facing surfaces link the legal URLs verbatim. Domain registration, ToS drafting, and Privacy Policy publication are tracked separately and are NOT a precondition for shipping markup that points at the URLs.

---

## 6. Standardized Footer (every customer-facing surface)

Four lines, exact structure:

```
{ProductName} v{Version} | 864-Flux | 864zeros LLC
[Lock Icon] No ads. No tracking. Your data stays yours.
Terms of Use • Privacy Policy
© {Year} 864zeros LLC. All rights reserved.
```

**HTML reference (production):**
```html
<footer class="brand-footer">
  <p class="brand-footer__line brand-footer__product">
    {ProductName} v{Version} | 864-Flux | 864zeros LLC
  </p>
  <p class="brand-footer__line brand-footer__privacy">
    <svg class="brand-footer__lock" width="12" height="12" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
    No ads. No tracking. Your data stays yours.
  </p>
  <p class="brand-footer__line brand-footer__legal">
    <a href="https://864zeros.com/terms">Terms of Use</a>
    <span aria-hidden="true">•</span>
    <a href="https://864zeros.com/privacy">Privacy Policy</a>
  </p>
  <p class="brand-footer__line brand-footer__copyright">
    © 2026 864zeros LLC. All rights reserved.
  </p>
</footer>
```

The lock icon is **inline SVG** with `currentColor` stroke — survives offline, no external image fetch, scales with surrounding text.

---

## 7. The Slate & Sage Aesthetic

**Codified 2026-05-08.** Slate-grey accents elevate the Sage core palette without replacing it. Result: warm sage personality + cool slate professionalism.

| Token | Light value | Dark value | Use |
|---|---|---|---|
| `--oia-sage` | `#8BA888` | `#96B893` | Primary actions, brand accents, selected states |
| `--oia-slate` | `#475569` | `#94A3B8` | Structural lines, secondary headings, code/metadata |
| `--oia-slate-dark` | `#334155` | `#64748B` | Deep slate accents (rare) |
| `--oia-slate-light` | `#64748B` | `#CBD5E1` | Slate hover / secondary tones |
| `--oia-slate-bg` | `#F1F5F9` | `#1E293B` | Subtle slate-tinted backgrounds (code blocks, callouts) |
| `--oia-slate-border` | `rgba(71, 85, 105, 0.15)` | `rgba(148, 163, 184, 0.18)` | Subtle dividers in settings / footer surfaces |

**Application rules:**
- **Sage stays the lead** — buttons, brand badges, selected items, primary action color.
- **Slate handles structure** — section dividers, footer top borders, code-block backgrounds, settings card borders (the *professional finish* lane).
- **Cream / warm white stays the canvas** — page background, card surfaces.
- **Never substitute** — slate does not replace sage anywhere. It adjoins.

The token additions are **non-breaking**. Existing usages of `--oia-sage`, `--oia-bg`, `--oia-text-*`, etc., are unchanged.

### Per-Pillar Palette Summary

Each 864zeros pillar carries a distinct palette + hook. The Brand Firewall (per [`ROLES/OFFICE_ARCHITECT.md`](ROLES/OFFICE_ARCHITECT.md) §II) is a hard partition — palettes never bleed across pillars.

| Pillar | Palette | Primary Hex | Hook |
|---|---|---|---|
| **OIA** (Organize Internal Architecture) | Slate & Sage | sage `#8BA888` · slate `#475569` | "Built for ADHD by ADHD." |
| **864-Flux** (Kinetic Bridges) | Slate & Graphite | graphite `#374151` · slate `#475569` | "Making software friendly again." |
| **FHG** (For His Grace) | Charcoal & Bronze | charcoal `#2D2D2D` · bronze `#A67C52` | "Heritage-first technology. Preserving what matters most." |

When a new product is scaffolded, its local `oia-design-system.css` swaps token values to the pillar palette without renaming token identifiers (so component CSS stays portable across pillars). Reference implementations: MigrationPilot (OIA) and ScriptureScout (FHG).

---

## 8. Theme Selector Note (per-extension override)

The OIA design system defaults to **automatic** dark/light via `prefers-color-scheme`. As of 2026-05-08, individual extensions **may** add a manual Theme Selector (Auto / Light / Dark) in their Options page when justified by a meaningful user need (e.g., user with system-set dark mode who prefers light at night, or vice-versa).

When implemented, the selector writes to `chrome.storage.local.theme` and applies via `:root[data-theme="..."]` overrides defined in `oia-design-system.css`. The Dopamine-Friendly UI definition (Section 3) **must** be available as an info-tooltip beside the selector — this is where the brand commitment becomes inspectable.

**Default if no selector is shipped:** auto (system preference). Per `CLAUDE-base.md`, that remains valid and recommended for minimum-viable extensions.

---

## 9. Cross-References

- [`[864z-OA] ROLES/OFFICE_ARCHITECT.md`](ROLES/OFFICE_ARCHITECT.md) — Decision Authority & Product Ecosystem Governance
- [`864z-build-kit/CLAUDE-base.md`](864z-build-kit/CLAUDE-base.md) — universal voice, copy rules, monetization framework
- [`864z-build-kit/references/core/BUILD_KIT_RULES.md`](864z-build-kit/references/core/BUILD_KIT_RULES.md) — RULE-000 governance + RULE-001 / RULE-002 / RULE-003 compliance gates
- [`864z-build-kit/references/core/oia-design-system.css`](864z-build-kit/references/core/oia-design-system.css) — design tokens (now includes Slate set, 2026-05-08)
- [`LLC-DIV-3-FACTORY/CLAUDE-INTEGRITY.md`](LLC-DIV-3-FACTORY/CLAUDE-INTEGRITY.md) — process honesty rules
- `../864zeros-ISD/ISD-DIV-5-EVOLUTION/BACKLOG.md` — strike charters & extraction protocol
- `../864zeros-ISD/ISD-DIV-0-CORE/BRICK_REGISTRY.json` — reusable component inventory

---

## 10. Versioning

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-08 | Initial. Manifesto, Flux Slogan, Dopamine-Friendly UI definition, Architect's Hook, Legal identity, Standardized Footer, Slate & Sage aesthetic, Theme Selector note — all codified. Reference implementation: MigrationPilot (Strike 011). |
| 1.1 | 2026-05-08 | Strike 012 finalization. Added §7 Per-Pillar Palette Summary (Slate & Sage + Slate & Graphite + Charcoal & Bronze). §9 cross-ref to `ROLES/OFFICE_ARCHITECT.md` ([864z-OA]). RULE-000 governance noted. |

---

*GTM Manifest v1.1 · 2026-05-08 · 864zeros LLC*
