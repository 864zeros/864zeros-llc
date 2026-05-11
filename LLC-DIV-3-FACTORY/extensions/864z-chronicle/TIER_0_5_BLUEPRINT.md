# Chronicle: Tier-0.5 Blueprint — Options Page with Grayed-Out Vault Section [v1.0]

**Authority:** 864z-OA (Office Architect) per RULE-000.
**Loaded:** Engineering blueprint — review by Operator + DIV-4-STUDIO before scaffolding.
**Authored:** 2026-05-09 by 864z-OA per RULE-000.
**Update protocol:** Append revisions; supersession marked. This is an *engineering blueprint*, not a strike commit — it specifies the target Options page structure, the Tier-0.5 paywall UX, and the grayed-out Vault preview row. Implementation is gated on Operator approval.
**Sources synthesized:** [`extensions/clipboard/options/options.html`](../clipboard/options/options.html) (existing tier-display pattern, lines 105-140) · [`864z-build-kit/references/core/BUILD_KIT_RULES.md`](../../../864z-build-kit/references/core/BUILD_KIT_RULES.md) (RULE-001 §2 Subscription & Tiers mandate; RULE-005, RULE-006 v1.1, RULE-007) · [`SOVEREIGN_LINK_PROPOSAL.md`](./SOVEREIGN_LINK_PROPOSAL.md) (companion proposal — Tier-0.5 unlocks the Markdown-vault export).
**Format note:** Follows the `864z-markdown-standard` (RULE-008).

---

## I. Tier Architecture Recap

Chronicle's monetization model — three tiers; all privacy-equal per RULE-007.

| Tier | Price | Unlocks | Founding-100 wedge alignment |
|---|---|---|---|
| **Free** | $0 | Capture conversations from Gemini / Claude / ChatGPT / Copilot. Per-entry Markdown export. Per-message Markdown export. Full-database JSON export. Search. Star. Filter. | Lay user, occasional captures, tries the tool with no payment friction. |
| **Tier-0.5: Vault** | $2.99 (one-time, perpetual) | **Markdown-vault-folder export** (one `.md` per conversation in `chronicle/{scribe}/{date}-{title}.md` Obsidian-friendly hierarchy). Bulk export by date range / by scribe / by tag / by star. Auto-export on schedule (weekly/monthly). | The vault-native power user — pastors, seminarians, knowledge workers who already use Obsidian/Logseq and resent re-typing AI-conversation output. The Founding-100 demographic. |
| **Pro** *(future)* | TBD | Cross-device sync via user-controlled cloud (Google Drive / iCloud / WebDAV — BYO), conversation diffing, vault deduplication, semantic search via local embeddings. | Carryover from clipboard's tier ladder; FUTURE strike — out of scope for this blueprint. |

**Why "Tier-0.5":** the gap between Free ($0) and a hypothetical Pro ($4.99/mo) tier is too wide for a single-purpose tool. A one-time $2.99 perpetual unlock is the ADHD-friendly micro-tier — it removes the recurring-bill anxiety, validates willingness to pay, and bridges to a full Pro tier later for users who hit the next limit. Per `CLAUDE-base.md` monetization framework.

---

## II. Options Page — Section Structure (RULE-001 Compliant)

Chronicle currently has NO `options_ui` page (per `TECH_STACK_AUDIT.md` §IV.a). This blueprint specifies its first one.

The Options page MUST contain the three RULE-001 mandatory sections in this order: How to Use → Subscription & Tiers → Data Management. This blueprint adds two recommended-but-not-mandatory sections: General Settings (top) and Fuel the Build (bottom), matching the convention used by `migration-pilot` and `scripture-scout`.

```
┌────────────────────────────────────────────────────────────────┐
│  HERO BAND                                                     │
│  [icon] [OIA] Chronicle                                        │
│         Capture every AI conversation. Keep it forever.       │
│  ┌─────── Pitch (1-2 sentences) ──────────────────────────┐    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘

┌─── §1 General Settings ─── [optional but recommended] ─────┐
│ Theme: [ Auto ▾ ]   (*) [Dopamine-Friendly UI definition]  │
│ Capture from: [✓] Gemini  [✓] Claude  [✓] ChatGPT  [✓] Copilot │
└────────────────────────────────────────────────────────────┘

┌─── §2 How to Use ─── [RULE-001 mandatory] ────────────────┐
│ 1. Open the side panel — Click the [OIA] Chronicle icon.   │
│ 2. Have an AI conversation — Chronicle records it silently.│
│ 3. Liberate your vault — Tap ⬇ in the panel header to      │
│    export everything as JSON to your Downloads folder.     │
│ 4. (Tier-0.5) Vault export — One Markdown file per         │
│    conversation, ready to drop into Obsidian / Logseq.     │
└────────────────────────────────────────────────────────────┘

┌─── §3 Subscription & Tiers ─── [RULE-001 mandatory] ──────┐
│                                                            │
│  Your Plan:    ●  Free                                     │
│  ───────────────────────────────────────────────────       │
│  ✓ Conversation capture from 4 AI providers                │
│  ✓ Per-entry Markdown export                               │
│  ✓ Full-vault JSON export                                  │
│  ✓ Search · Star · Filter                                  │
│  ✓ Local-first storage; never leaves your device           │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │  ⌖ TIER-0.5: VAULT      $2.99 once · perpetual unlock │ │
│ │ ────────────────────────────────────────────────────── │ │
│ │  ⊘ Markdown-vault-folder export                        │ │
│ │     (chronicle/{scribe}/{date}-{title}.md, Obsidian-   │ │
│ │      friendly hierarchy)                               │ │
│ │  ⊘ Bulk export by date range / scribe / tag / star    │ │
│ │  ⊘ Auto-export on schedule (weekly / monthly)         │ │
│ │  ⊘ All future Tier-0.5 features at no additional cost │ │
│ │                                                        │ │
│ │   [  Unlock Vault — $2.99  ]                           │ │
│ └────────────────────────────────────────────────────────┘ │
│                              ^                             │
│             [GRAYED-OUT — see §III for visual spec]        │
│                                                            │
│  Pro tier (cross-device sync, semantic search):  Coming soon. │
└────────────────────────────────────────────────────────────┘

┌─── §4 Data Management ─── [RULE-001 mandatory] ───────────┐
│                                                            │
│  Total: N entries · M messages · ~K MB local storage       │
│                                                            │
│  [  Liberate Vault as JSON  ]   ← Free tier, primary       │
│  [  Liberate Vault as Markdown  ]   ← TIER-0.5 LOCKED ⊘    │
│                                                            │
│  ────────────────────────────────────────────────────      │
│                                                            │
│  Destructive zone:                                         │
│  [  Clear all captures  ] ← uses RULE-005 two-tap confirm  │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌─── §5 Fuel the Build ─── [optional] ──────────────────────┐
│  Love Chronicle? Help fund the next feature.               │
│  [  Buy us a coffee  ]                                     │
└────────────────────────────────────────────────────────────┘

┌─── Standard 4-line brand footer (per GTM_MANIFEST §6) ────┐
│  [OIA] Chronicle v1.0.0 | 864-Flux | 864zeros LLC          │
│  🔒 No ads. No tracking. Your data stays yours.            │
│  Terms of Use · Privacy Policy                             │
│  © 2026 864zeros LLC. All rights reserved.                 │
└────────────────────────────────────────────────────────────┘
```

---

## III. The Grayed-Out Vault Section — Visual & Interaction Spec

The Tier-0.5 unlock card is the focal point of the Subscription & Tiers section. Its visual treatment must communicate "available but locked" without feeling like an upgrade nag (per CLAUDE-base.md voice rules + the Brand Manifesto's "always simple" commitment).

### III.a — Visual treatment (CSS specification)

```css
.tier-card {
  background: var(--oia-card-bg);
  border: 1px solid var(--oia-slate-border);
  border-radius: var(--oia-radius-md);
  padding: var(--oia-space-md);
  margin-top: var(--oia-space-md);
}

.tier-card--locked {
  /* Grayed-out treatment for the locked Tier-0.5 row */
  opacity: 0.60;                                  /* Soft lock */
  background: var(--oia-slate-bg);                /* Tinted slate, not flat gray */
  border-color: var(--oia-slate-border);
  cursor: default;
  position: relative;
}

.tier-card--locked .tier-feature::before {
  content: "⊘";                                   /* Locked-feature glyph */
  color: var(--oia-slate-light);
  margin-right: var(--oia-space-xs);
  font-weight: var(--oia-weight-bold);
}

.tier-card--locked .tier-card__cta {
  /* The unlock button stays at full opacity even though the card is dim */
  opacity: 1;
  background: var(--oia-sage);                    /* Sage primary — the ONE high-saturation element */
  color: var(--oia-text-on-sage);
  font-weight: var(--oia-weight-semibold);
  margin-top: var(--oia-space-md);
}

.tier-card--locked .tier-card__price {
  /* Price tag also stays sharp — the $ value is the buy-decision anchor */
  opacity: 1;
  font-weight: var(--oia-weight-semibold);
  color: var(--oia-text-primary);
}

.tier-card--locked::after {
  /* Subtle "LOCKED" watermark in the upper-right corner */
  content: "LOCKED";
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--oia-slate-light);
  font-weight: var(--oia-weight-bold);
  opacity: 0.75;
}
```

**Design rationale:**
- **`opacity: 0.60`** is enough to communicate "not active" without rendering text illegible. WCAG AA contrast still met for the body copy.
- **CTA + price stay at full opacity.** The user must be able to read the value and click the action. Dimming those defeats the purpose of the card.
- **`⊘` glyph (U+2298 Circled Division Slash)** is unambiguous as "blocked/locked" and reads correctly even at 12 px. Avoids the lock-emoji which already lives in the footer (lock = privacy, ⊘ = locked-feature; semantic discipline).
- **Sage CTA on slate-tinted background** maintains the Brand Firewall (RULE-006) — Sage is OIA's identity color. The locked card is still recognizably an OIA surface.
- **"LOCKED" watermark** is small enough to scan-skip but caught on inspection — answers the "why isn't this working?" question before the user has to ask.

### III.b — Interaction states

| User action | Behavior |
|---|---|
| Hover the locked card | Subtle `opacity: 0.70` lift; cursor stays `default` (not `pointer` — only the CTA is clickable) |
| Hover the locked feature bullet | Tooltip: *"Available with Tier-0.5: Vault unlock ($2.99 once)"* |
| Click anywhere in the card body (not the CTA) | No-op (card body is non-interactive when locked) |
| Click the **Unlock Vault — $2.99** CTA | Triggers ExtPay (or equivalent) checkout flow → on success, fires `chrome.storage.local.set({ tier: 'vault' })` → re-renders Options page with tier-card unlocked + Markdown export buttons enabled |
| Card after unlock | `.tier-card--locked` class removed; `⊘` glyphs become `✓`; `LOCKED` watermark gone; body opacity restored |

---

## IV. Free-Tier vs Tier-0.5 — Capability Matrix

| Capability | Free | Tier-0.5: Vault |
|---|---|---|
| Capture conversations (Gemini / Claude / ChatGPT / Copilot) | ✓ | ✓ |
| Per-entry Markdown download (in-card icon) | ✓ | ✓ |
| Per-message Markdown download (in detail view) | ✓ | ✓ |
| Full-vault JSON export | ✓ | ✓ |
| Search · Star · Filter | ✓ | ✓ |
| Local-first storage; never leaves device | ✓ | ✓ (RULE-007 identical at every tier) |
| **Markdown-vault-folder export** (`chronicle/{scribe}/{date}-{title}.md`) | ⊘ | ✓ |
| **Bulk export by date range / scribe / tag / starred** | ⊘ | ✓ |
| **Auto-export on schedule** (weekly / monthly) | ⊘ | ✓ |
| **All future Tier-0.5 features** | ⊘ | ✓ (perpetual; no recurring charge) |

**The Free tier is genuinely useful** — it provides full sovereignty (single-button JSON export = entire vault). Tier-0.5 monetizes *workflow polish*, not *baseline access*. This aligns with CLAUDE-base.md monetization principle: never charge for the privacy floor; charge for the workflow ceiling.

---

## V. Why $2.99 Once (Not $X/mo)

| Pricing model | Friction | Recurring revenue | ADHD compatibility | Founding-100 fit |
|---|---|---|---|---|
| $4.99/mo subscription | HIGH (recurring-bill anxiety) | Yes | LOW | Forces "is this worth it forever?" decision; many will churn |
| $24/yr annual | MEDIUM | Yes (annual lift) | MEDIUM | Better — but annual decision still hard for occasional capture |
| **$2.99 once perpetual** ✅ | **LOW** | No | **HIGH** | Validates willingness to pay without recurring-bill commitment; trivially affordable; "set it and forget it" |
| $9.99 once perpetual | MEDIUM | No | MEDIUM | Higher conversion friction; same operational reality |

**The $2.99 perpetual model:**
- Removes recurring-bill anxiety (a known ADHD friction point — per OIA pillar doctrine)
- Validates willingness to pay (price-discriminates against pure free-tier users)
- Bridges to a hypothetical Pro tier later for users who hit the next ceiling
- Aligns with the Brand Manifesto's "always simple" commitment (one decision, done)
- Per `CLAUDE-base.md`: products serve users, not the other way around — perpetual unlock favors the user, recurring favors the seller

The unit economics work because Tier-0.5 features are *write once, run forever* — no per-user infrastructure cost, no ongoing API spend (RULE-007 forbids 864zeros-paid backend services anyway). Marginal cost per Tier-0.5 customer ≈ $0.

---

## VI. Implementation Hooks (Concrete File Changes)

| File | New / Modified | Purpose |
|---|---|---|
| `extensions/864z-chronicle/options/options.html` | NEW | The page itself; structure per §II of this blueprint |
| `extensions/864z-chronicle/options/options.css` | NEW | Tier-card styles + grayed-out spec per §III.a |
| `extensions/864z-chronicle/options/options.js` | NEW | Tier state read from `chrome.storage.local.tier`; render gating; ExtPay (or equivalent) checkout wiring |
| `extensions/864z-chronicle/manifest.json` | MODIFIED | Add `options_ui: { page: "options/options.html", open_in_tab: true }`; update `name` to `[OIA] Chronicle` per RULE-006 v1.1 (or via `_locales/en/messages.json` `extName.message` if `name` is `__MSG_extName__`) |
| `extensions/864z-chronicle/sidepanel/panel.html` | MODIFIED | Replace settings-cog handler to open the new Options tab via `chrome.runtime.openOptionsPage()` (canonical RULE-001 pattern); add brand-prefix pill `[OIA]` to header |
| `extensions/864z-chronicle/sidepanel/panel.js` | MODIFIED | Migrate `clearAllData()` from `confirm()` to BRK-UI-003 two-tap (RULE-005); remove the inline settings view; add the Sovereign Link header button per `SOVEREIGN_LINK_PROPOSAL.md` §III.a |
| `extensions/864z-chronicle/_locales/en/messages.json` | NEW or MODIFIED | `extName.message: "[OIA] Chronicle"` per RULE-006 v1.1 |
| `extensions/864z-chronicle/lib/tier.js` | NEW | Tiny helper module exporting `getTier()`, `setTier()`, `isVaultUnlocked()` for consistent tier checks across panel.js + options.js |

**Total estimated scope:** ~10-12h focused work (matches the Strike 013 charter outline in `SOVEREIGN_LINK_PROPOSAL.md` §VI).

---

## VII. Open Questions for Operator Review

1. **Payment processor.** Clipboard already integrates ExtPay (per its `permissions: ["identity"]` and the `agent-payment-extpay` brick in registry). Should Chronicle inherit ExtPay, or is there a leaner alternative for a $2.99 one-time tier (Stripe Payment Links + custom verification flow)?
2. **Tier verification mechanic.** Once unlocked, is the tier flag stored only locally (`chrome.storage.local.tier = 'vault'` — trustworthy on the user's device but trivially flippable), or is there a server-side verification step? RULE-007 forbids proxying user data through 864zeros, but a verification *receipt* check (one-shot, no PII) may be acceptable. Operator decision.
3. **Auto-export schedule.** "Weekly / monthly" is the proposal. Some users may want "after every N captures" or "on uninstall attempt" (Chrome doesn't expose an uninstall hook directly — but we can prompt on `chrome.runtime.onSuspend`). Defer to UX iteration with Founding-100 cohort feedback.
4. **Bundling Sovereign Link with Tier-0.5 strike.** This blueprint and the Sovereign Link Proposal are companion docs but technically separable. Recommendation: bundle into one Strike 013 charter — same surface, same review pass, same compliance migration window. Operator decides scope at charter time.
5. **Founding-100 cohort overlap.** ScriptureScout's Founding 100 is FHG-pillar; Chronicle is OIA-pillar. Should Chronicle's Tier-0.5 launch use a separate cohort, or run as a public beta from day 1 (since it's not a trust-gated faith-vocation tool)? GTM decision; defer to DIV-4-STUDIO.

---

## VIII. Cross-References

- [`SOVEREIGN_LINK_PROPOSAL.md`](./SOVEREIGN_LINK_PROPOSAL.md) — companion proposal; this blueprint extends it with the paywall + UI design.
- [`864z-build-kit/references/core/BUILD_KIT_RULES.md`](../../../864z-build-kit/references/core/BUILD_KIT_RULES.md) — RULE-001 (Options structure), RULE-005 (two-tap), RULE-006 v1.1 (brand-prefix + extName), RULE-007 (Secret Sovereignty — Chronicle remains compliant: no secrets, BYOK not applicable, no 864zeros proxy even for tier verification).
- [`extensions/clipboard/options/options.html`](../clipboard/options/options.html) — the existing tier-display pattern (lines 105-140 — `tier-display`, `tier-badge`, `tier-features`, `feature-list`, `feature-list__item`, `feature-list__tier`, `upgrade-btn`); reuse the CSS class vocabulary for consistency across the OIA + 864-Flux portfolios.
- [`864zeros-llc/GTM_MANIFEST.md`](../../../GTM_MANIFEST.md) §3 (Dopamine-Friendly UI definition — invoked by the Theme tooltip), §6 (Standardized footer — verbatim 4-line stamp), §7 (per-pillar palette — Chronicle uses Slate & Sage / OIA tokens).
- [`864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_PILLAR_STRATEGY.md`](../../../../864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_PILLAR_STRATEGY.md) §III.a — OIA pillar doctrine ("dopamine-friendly UI minimizes Executive Function tax"); the $2.99 perpetual unlock is the pillar-aligned monetization choice.
- [`864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_TECH_STACK_AUDIT.md`](../../../../864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_TECH_STACK_AUDIT.md) §IV.a — confirms Chronicle's RULE-001 violation (no `options_ui` currently); this blueprint closes the gap.

---

## IX. Versioning

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-09 | Initial. Tier-0.5 architecture (Free / Tier-0.5: Vault $2.99 perpetual / Pro future). Options page section structure (RULE-001 compliant + 2 optional sections). Grayed-out tier card visual & interaction spec (CSS + states). Free vs Tier-0.5 capability matrix. Pricing-model rationale ($2.99 once vs alternatives). Concrete file change inventory. 5 open questions for Operator review. |

---

*Chronicle Tier-0.5 Blueprint v1.0 · 2026-05-09 · 864zeros LLC · DIV-3-FACTORY engineering blueprint.*
