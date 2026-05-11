# Chronicle: Developer Notes

**Audience:** 864zeros internal — Operator + Office Architect.
**Purpose:** Document non-production-user-facing mechanisms in Chronicle so they remain auditable.

---

## I. Developer Tier Override (URL-gated)

The Options page exposes a **Developer Override** panel when, and only when, the URL contains `?dev=1`:

```
chrome-extension://{your-extension-id}/options/options.html?dev=1
```

When the panel is visible, two buttons let you flip `chrome.storage.local.tier` between `'vault'` and `'free'` without going through the production stub `Unlock Vault — $2.99` button or any future payment integration.

### Why this exists

- During development and QA, it is useful to flip between Free and Tier-0.5 tier states without manually opening DevTools and running storage commands.
- The production stub `Unlock Vault — $2.99` button (in the Subscription & Tiers section) requires a two-tap arm and intentionally announces itself as a stub. That friction is correct for the customer-facing surface but unhelpful when an operator is testing tier states repeatedly.
- The override panel is **gated by the URL flag**. It is not gated by a localStorage value, by a magic header, by a click sequence, by a keyboard shortcut, by a build constant, or by any other hidden signal. The URL is the sole gate.

### Why this is NOT a hidden backdoor

| Property | This URL flag | A hidden backdoor |
|---|---|---|
| Panel visible in HTML source? | ✅ Yes (`#dev-override-panel` in `options/options.html`) | ❌ Hidden / obfuscated |
| Documented? | ✅ This file | ❌ Undocumented by definition |
| Discoverable by code review? | ✅ Trivially (`?dev=1` query check in `options/options.js → initDevOverride`) | ❌ Hidden behind magic strings |
| Activation surface | ✅ Single URL parameter, no other inputs | ❌ Often a localStorage flag, magic header, or click sequence |
| Auditability | ✅ Operator + Office Architect attestation | ❌ Plausibly deniable |
| Compatible with RULE-001 §2 (auditable tier disclosure) | ✅ Yes | ❌ No |
| Compatible with RULE-007 §Disclosure | ✅ Yes | ❌ No |
| Compatible with Chrome Web Store deceptive-functionality policy | ✅ Yes | ❌ No |

The distinction is not the *mechanism*, it is the *honesty*. A documented URL flag that does what it says, in plain source, is a developer tool. An undocumented localStorage bypass with a magic value would be a deceptive monetization-bypass shipped to customers.

### How to use

1. Open the Options page normally (toolbar icon → Settings cog).
2. Add `?dev=1` to the URL bar and press Enter.
3. Scroll to the bottom; the yellow-bordered DEVELOPER OVERRIDE panel appears just above the standardized brand-footer.
4. Click **Force tier: vault** or **Force tier: free**. The page rerenders the tier UI immediately.

### Removal protocol

If the override needs to be removed for any release, delete the panel block in `options/options.html` (search for `#dev-override-panel`), the `initDevOverride()` function in `options/options.js`, and the `.dev-override*` styles in `options/options.css`. The deletion is bounded to the same file set that introduces it; no other production code paths depend on the override.

---

## II. Stubbed Payment Path (Production Surface)

The customer-facing **Unlock Vault — $2.99** button in the Subscription & Tiers section currently flips `chrome.storage.local.tier = 'vault'` directly with no checkout. This is a development stub explicitly marked in source (`options/options.js → onUnlockVault`) with a comment block explaining the deferred integration.

The button uses the RULE-005 two-tap arm pattern + a temporary label change to "Stub-unlock (no payment) — tap again to confirm" so that **any operator who clicks the button cannot mistake it for a real payment flow**. This is a deliberate friction signal, not an oversight.

**Operator MUST replace this stub with the chosen payment processor (ExtPay or equivalent) before any public release.** Per `TIER_0_5_BLUEPRINT.md` §VII.1.

---

## III. Console Logging Discipline

As of 2026-05-09, Chronicle's production source files (`sidepanel/panel.js`, `service-worker.js`, `content-script.js`, `options/options.js`) have **all `console.log` / `console.debug` / `console.info` calls stripped**. `console.error` calls are preserved on genuine error paths. `console.warn` is preserved (1 instance in the service worker).

Future debug logging should use `console.error` for actual errors only. For development-time tracing, prefer `chrome://extensions` → Inspect views → Sources tab breakpoints over scattered `console.log` statements.

---

*Chronicle DEV_NOTES v1.0 · 2026-05-09 · 864zeros LLC · internal-only operator notes.*
