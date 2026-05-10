# Chronicle Checkout Blueprint — ExtPay Integration for $2.99 Sovereign Vault Unlock [v1.0]

**Authority:** Engineering blueprint. Specifies HOW to replace Chronicle's Strike-013 stub-unlock CTA with real ExtPay payment integration. Implementation is gated on Operator approval (per RULE-000).
**Loaded:** Pre-implementation review by Operator + Systems Engineer.
**Authored:** 2026-05-09 by 864z-OA (Office Architect) per RULE-000.
**Update protocol:** Append revisions; supersession marked. This is an *engineering blueprint*, not a strike commit — it specifies the integration architecture, the entry points, the failure modes, and the per-extension generalization path. Implementation is a separate strike charter.
**Sources synthesized:** [`extensions/864z-chronical/options/options.js`](./options/options.js) (current stub-unlock onUnlockVault flow + lib/tier.js usage) · [`extensions/clipboard/lib/payments/extpay-wrapper.js`](../clipboard/lib/payments/extpay-wrapper.js) (the existing fleet ExtPay wrapper pattern) · [`extensions/clipboard/lib/payments/ExtPay.js`](../clipboard/lib/payments/ExtPay.js) (vendored 3rd-party ExtPay SDK) · [`extensions/clipboard/RULE_007_AUDIT.md`](../clipboard/RULE_007_AUDIT.md) §V (ExtPay 3rd-party RULE-007 verdict — "ExtPay handles credit card data directly; 864zeros never sees payment details") · [`864z-build-kit/references/core/tier.js`](../../../864z-build-kit/references/core/tier.js) (canonical TIER_FREE/TIER_VAULT state machine) · [`TIER_0_5_BLUEPRINT.md`](./TIER_0_5_BLUEPRINT.md) §VII.1 (the original deferral notation: "real ExtPay checkout integration is deferred").
**Format note:** Follows the `864z-markdown-standard` (RULE-008).

---

## I. Goal

Replace Chronicle's Strike-013 stub-unlock CTA with a real Tier-0.5 payment flow:

| Today (stub) | After this blueprint (real ExtPay) |
|---|---|
| User clicks **Unlock Vault — $2.99**. Two-tap arm fires. Second tap calls `setTier(TIER_VAULT)` directly — no payment. Toast: *"Vault unlocked. (Stub: no payment processed.)"* | User clicks **Unlock Vault — $2.99**. ExtPay's checkout page opens in a new tab. User pays via Stripe (ExtPay's payment processor). On payment success, ExtPay's webhook fires → service-worker `extpay.onPaid()` callback → `setTier(TIER_VAULT)` → tier-card flips to UNLOCKED state in the open Options tab. Toast: *"Vault unlocked. Welcome to Tier-0.5."* |

This is the LAST blocker for Chronicle's public release. Per `Factory Manifest v1.5 §V` it is the only Rung-3 → Rung-4 advance for Chronicle (Chronicle is already on Rung 4 with the stub; this swap promotes it to "Rung 4 with real payment").

---

## II. ExtPay Integration Architecture (Mapping the SDK to Chronicle)

ExtPay (`extensionpay.com`) is the same payment processor the operator already uses for clipboard. The vendored SDK lives at `extensions/clipboard/lib/payments/ExtPay.js`; the wrapper at `extensions/clipboard/lib/payments/extpay-wrapper.js` provides three exports:

```javascript
import { initPayments, getCurrentTier, onPaid } from '../lib/payments/extpay-wrapper.js';
```

| Export | Signature | Purpose |
|---|---|---|
| `initPayments(extensionId)` | `(string) → ExtPay instance` | Bootstraps ExtPay's polling/sync. Called ONCE in the service worker. |
| `getCurrentTier()` | `() → Promise<'free' \| 'paid'>` | Reads ExtPay's payment status. Source of truth for whether the user paid. |
| `onPaid(callback)` | `(fn) → void` | Registers a callback that fires when ExtPay observes a fresh payment (e.g., after the user completes Stripe checkout). |

The `extpay-wrapper.js` design is intentionally minimal — it normalizes ExtPay's tier-status enum to the fleet's `TIER_FREE` / `TIER_VAULT` constants and gives the SW + options page a single import surface.

---

## III. Entry Point Identification — Where Chronicle Hooks In

Three concrete entry points need code, in three files:

### III.a — Entry Point #1: Service Worker bootstrap (chronicle/service-worker.js)

Currently chronicle's `service-worker.js` does not import ExtPay. It needs to call `initPayments()` once at SW load + register `onPaid()` to flip the tier state on payment.

**Insertion location:** top of the file, after the existing `import * as db from './lib/db.js';` import block.

**Code to add:**

```javascript
// Strike 013-followup: real ExtPay checkout integration (replaces Strike 013 stub).
// Per RULE-007 §ExtPay 3rd-party verdict: ExtPay handles card data directly;
// 864zeros never sees payment details; we only receive payment-status metadata.
import { initPayments, onPaid } from './lib/payments/extpay-wrapper.js';
import { setTier, TIER_VAULT } from './lib/tier.js';

const EXTPAY_ID = 'chronicle-864z'; // operator-set; matches the merchant slug
                                     // operator registers at extensionpay.com/dashboard

initPayments(EXTPAY_ID);

onPaid(async (user) => {
  await setTier(TIER_VAULT);
  // Notify any open Options tab(s) so the tier card flips visually
  chrome.runtime.sendMessage({
    type: 'TIER_UNLOCKED',
    tier: TIER_VAULT,
    extpayUserEmail: user?.email || null  // for operator dashboards only
  }).catch(() => { /* no Options tab open; OK */ });
});
```

**Why in the SW:** ExtPay's `onPaid()` callback fires regardless of whether the Options tab is open (the SW is the persistent listener). The Options tab learns about the tier flip via `chrome.runtime.onMessage` (see Entry Point #3 below) OR by re-reading `chrome.storage.local.tier` on next page load (also handled by the existing `lib/options-tier-init.js`).

### III.b — Entry Point #2: Options page Unlock CTA wiring (chronicle/options/options.js)

Currently Chronicle's `options.js` has an `onUnlockVault()` function (Strike 013) that flips the tier flag directly with a two-tap arm. That stub needs to be replaced with: open ExtPay's checkout page.

**File:** `extensions/864z-chronical/options/options.js`

**Function to replace:** `onUnlockVault()` (the existing stub).

**Replacement code:**

```javascript
import { initPayments } from '../lib/payments/extpay-wrapper.js';

// Strike 013-followup: open ExtPay checkout instead of stub-flipping the tier.
async function onUnlockVault() {
  // initPayments() is idempotent — safe to call from both SW and Options page.
  // The SW's instance is what receives onPaid() callbacks; this Options-page
  // instance is just used to invoke openPaymentPage() in a user-gesture context.
  const extpay = initPayments('chronicle-864z');
  try {
    extpay.openPaymentPage();   // ExtPay opens its checkout in a new tab
    // No tier-flip here — that happens on the SW side via onPaid() AFTER
    // the user actually completes payment. Source of truth is ExtPay's
    // server, not this button click.
    toast('Opening checkout… complete payment to unlock the Vault.');
  } catch (err) {
    console.error('[options] Unlock failed:', err);
    toast('Could not open checkout. Try again, or contact support.');
  }
}
```

**Why no two-tap arm here:** ExtPay's checkout flow is itself the "are-you-sure" step (user explicitly clicks Pay $2.99 on Stripe's checkout). Adding a second arm in our UI is redundant friction. The Strike-013 two-tap was correct for the stub (because the stub bypassed payment entirely); for real payment, the checkout page itself is the confirmation gate.

### III.c — Entry Point #3: Options page tier-flip listener (chronicle/options/options.js OR lib/options-tier-init.js)

When ExtPay's `onPaid()` fires in the SW + the SW broadcasts `TIER_UNLOCKED`, any open Options tab should re-render its tier card immediately (rather than waiting for a page reload).

**Two valid placements:**

1. **In chronicle/options/options.js** (chronicle-specific): add a `chrome.runtime.onMessage` listener that calls `renderTierUI()` on `TIER_UNLOCKED`.
2. **In lib/options-tier-init.js** (shared, cross-fleet): add the same listener; benefits ALL extensions when their own ExtPay integrations land.

Recommendation: **add the listener to the shared `lib/options-tier-init.js`** (Strike 022 canonical). One-line addition; benefits the entire fleet's future ExtPay rollouts.

```javascript
// Append to canonical options-tier-init.js after renderTier()/initDevOverride() invocations:
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'TIER_UNLOCKED' || msg?.type === 'TIER_DOWNGRADED') {
    renderTier();
  }
});
```

**Why broadcast even though `chrome.storage.onChanged` exists:** the `chrome.storage.onChanged` API would also notify Options pages of the tier flip — but explicit `runtime.sendMessage` from the SW gives the SW author full control over WHEN the broadcast fires (e.g., only after webhook validation completes; not on every transient storage write). Belt-and-suspenders pattern; both signals can coexist.

---

## IV. Operator Pre-Integration Checklist

Per `clipboard/RULE_007_AUDIT.md §VI.c`, the operator should:

| Item | Owner | Notes |
|---|---|---|
| Register Chronicle as a separate ExtPay merchant (`chronicle-864z` slug) | Operator | Distinct from clipboard's existing merchant slug (avoids cross-contamination of payment data) |
| Configure the $2.99 ONE-TIME (perpetual unlock) product in ExtPay dashboard — NOT a recurring subscription | Operator | Matches Chronicle's Tier-0.5 model (Strike 013 §III TIER_0_5_BLUEPRINT.md) |
| Set Chronicle's privacy policy + terms URLs in ExtPay dashboard | Operator | Required by ExtPay before checkout flow can go live |
| Update `SECURITY_ROTATION_LOG.md` to record the new ExtPay merchant relationship | Operator + 864z-OA | Per RULE-007 §Operational hygiene |
| Update Chronicle's `RULE_007_AUDIT.md` post-integration | 864z-OA | Add §V (ExtPay) parallel to clipboard's audit; verdict expected: structurally compliant since pattern matches clipboard's already-audited integration |
| Update Chronicle's options.html `Privacy & Your Data` section | 864z-TW | Add the ExtPay disclosure paragraph (verbatim from clipboard's §Disclosure block, Strike 022) |

---

## V. Failure Modes + Edge Cases

| Failure | Impact | Mitigation |
|---|---|---|
| User completes payment but `onPaid()` doesn't fire (network glitch, ExtPay polling delay) | Tier stays `free` despite paid status | ExtPay's `getUser()` polls every ~5 min; Chronicle should also call `getCurrentTier()` on Options-page load (already implicit via `lib/options-tier-init.js → renderTier() → getTier()`); add a manual "Refresh tier status" button as escape hatch |
| User pays for Vault on Device A but logs into Device B with same Chrome profile | ExtPay's tier status is per-extension-installation by default; Device B shows free | ExtPay supports cross-device "user-managed" mode; opt in via dashboard. Document trade-off (cross-device requires user account) |
| ExtPay outage | Checkout flow fails; no new unlocks possible (existing unlocks unaffected because tier flag is in chrome.storage.local) | Display "Checkout temporarily unavailable" message in Options page. Existing Vault users unaffected — they stay unlocked. |
| User refunds | ExtPay's `onPaid()` doesn't fire on refund; need to detect tier downgrade | ExtPay supports `onUserUpdated()` callback; wire SW to call `setTier(TIER_FREE)` if `getCurrentTier()` ever flips back to `'free'`. Broadcast `TIER_DOWNGRADED` so Options tab re-renders. |
| Two-tab race: user clicks Unlock in tab A, also opens Options in tab B | Both tabs render free; A opens checkout; B unaware until storage event | Already handled — `chrome.storage.onChanged` AND the new `runtime.onMessage` listener BOTH fire on tier change; tab B re-renders. |
| ExtPay merchant key compromised | Could allow rogue checkout URLs | ExtPay merchant keys are per-extension and revocable. Per RULE-007: rotate immediately + log to `SECURITY_ROTATION_LOG.md`. |

---

## VI. Generalization Path — Replicating Across the Fleet's 11 Other Rung-3 Extensions

After Chronicle ships ExtPay integration, the same pattern applies to the other 11 Rung-3 extensions that will adopt Tier-0.5 payment (per `Factory Manifest v1.5 §V` P2):

1. **Per-extension merchant slug** — each extension gets its own ExtPay merchant (`bibleinsight-864z`, `clipboard-864z`, `datanap-864z`, etc.). Avoids cross-extension payment-data co-mingling.
2. **Per-extension `lib/payments/extpay-wrapper.js`** — copy from clipboard's existing wrapper; one-line change for the merchant slug constant.
3. **Per-extension `lib/payments/ExtPay.js`** — vendored copy from clipboard. Recommend: extract canonical to `864z-build-kit/references/core/payments/ExtPay.js` (the SDK is identical across extensions).
4. **Service-worker entry point** — same `initPayments()` + `onPaid()` pattern as Chronicle (§III.a above).
5. **Options-page CTA replacement** — same Unlock-button → `extpay.openPaymentPage()` swap (§III.b above).
6. **Shared listener** — already in place via `lib/options-tier-init.js` (after Strike 022 + this blueprint's §III.c addition).

**Estimated rollout effort per extension:** ~30 min once Chronicle's pattern proves out. 11 extensions × 30 min = ~5.5h batched. Per `Factory Manifest v1.5 §V` P2 estimate of ~4.5h (close to but slightly higher than the manifest estimate; difference is the per-extension privacy disclosure copy).

---

## VII. Cross-References

- [`extensions/864z-chronical/lib/tier.js`](./lib/tier.js) — canonical TIER_FREE/TIER_VAULT state machine
- [`extensions/864z-chronical/options/options.js`](./options/options.js) — host for the new `onUnlockVault()` (§III.b above)
- [`extensions/864z-chronical/service-worker.js`](./service-worker.js) — host for `initPayments()` + `onPaid()` (§III.a above)
- [`extensions/864z-chronical/TIER_0_5_BLUEPRINT.md`](./TIER_0_5_BLUEPRINT.md) §VII.1 — the original deferral notation
- [`extensions/864z-chronical/SOVEREIGN_LINK_PROPOSAL.md`](./SOVEREIGN_LINK_PROPOSAL.md) — companion design doc
- [`extensions/clipboard/lib/payments/extpay-wrapper.js`](../clipboard/lib/payments/extpay-wrapper.js) — reference wrapper to copy
- [`extensions/clipboard/RULE_007_AUDIT.md`](../clipboard/RULE_007_AUDIT.md) §V — ExtPay 3rd-party RULE-007 verdict (compliant)
- [`864z-build-kit/references/core/tier.js`](../../../864z-build-kit/references/core/tier.js) — fleet canonical
- [`864z-build-kit/references/core/options-tier-init.js`](../../../864z-build-kit/references/core/options-tier-init.js) — fleet canonical (Strike 022 — host for the §III.c shared listener addition)
- [`864zeros-ISD/ISD-DIV-0-CORE/SECURITY_ROTATION_LOG.md`](../../../../864zeros-ISD/ISD-DIV-0-CORE/SECURITY_ROTATION_LOG.md) — destination for the ExtPay merchant relationship attestation

---

## VIII. Versioning

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-09 | Initial blueprint (Strike 022). Identifies 3 entry points (SW initPayments + onPaid; Options page onUnlockVault → openPaymentPage; shared listener for TIER_UNLOCKED broadcast). Maps ExtPay SDK to Chronicle's existing tier state machine. Operator pre-integration checklist (6 items). 6 failure modes + mitigations. Generalization path for the 11 other Rung-3 extensions (~5.5h batched). Implementation gated on Operator approval. |

---

*Chronicle Checkout Blueprint v1.0 · 2026-05-09 · 864zeros LLC · DIV-3-FACTORY engineering blueprint.*
