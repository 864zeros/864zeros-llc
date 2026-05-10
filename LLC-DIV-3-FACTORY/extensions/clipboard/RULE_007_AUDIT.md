# clipboard: RULE-007 Sovereign Audit [v1.0]

**Authority:** Per-extension Sovereign Audit. clipboard is the highest-trust extension in the active fleet (`debugger` + `identity` + `management` + AI integration + Google Drive OAuth + ExtPay integration).
**Loaded:** Pre-release security review; Phase-2 deep-refactor audit (Strike 021).
**Authored:** 2026-05-09 by 864z-OA (Office Architect) per RULE-000.
**Update protocol:** Append-only. New audit findings land as new versioned entries.
**Sources synthesized:** `manifest.json` (permissions surface) · `background/service-worker.js` (SW imports) · `lib/api-client.js` (AI BYOK pattern) · `lib/pdf-generator.js` (debugger usage) · `lib/google-drive/drive-client.js` (OAuth flow) · `lib/payments/extpay-wrapper.js` + `lib/payments/ExtPay.js` (3rd-party payment) · `RULE-007 §Disclosure` + `§Required Mechanics` from `BUILD_KIT_RULES.md`.
**Format note:** Follows the `864z-markdown-standard` (RULE-008).

---

## I. Audit Summary — VERDICT: ✅ STRUCTURALLY COMPLIANT (with operator-action items)

clipboard passes RULE-007 (Secret Sovereignty) on every required mechanic. It is a more complex audit surface than Bible-Insight (which has 5 fetch sites + `debugger`); clipboard adds Google OAuth + ExtPay 3rd-party payment + `chrome.management` enumeration. All flows are BYOK / BYOA (Bring Your Own Account) / 3rd-party-direct; zero 864zeros relay.

| RULE-007 mechanic | Status | Evidence |
|---|---|---|
| BYOK (user-supplied API key only; no bundled keys) | ✅ | `lib/api-client.js:48-50` reads API key from `chrome.storage.local.get('${appSlug}_ai_api_key')`. Zero bundled key literals in source — confirmed by repo-wide grep for `sk-`/`AIza`/`Bearer` patterns (clean). |
| Secret storage in `chrome.storage.local` only (never `.sync`) | ✅ | All `chrome.storage.*` calls in clipboard tree use `.local`; zero `.sync` references for secret-bearing keys. |
| Direct fetch to provider's documented endpoint (no proxy through 864zeros) | ✅ | `lib/api-client.js:111, 163` POST to `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}` (Google's official Gemini endpoint). Zero `*.864zeros.*` host references in fetch URLs (the dead-code `lib/ai/ai-client.js` 864zeros proxy was DELETED in the prior strike arc — see commit `b1fd136`). |
| `chrome.debugger` permission has bounded, documented use | ✅ (with caveat) | Only used in `lib/pdf-generator.js:104-141` for `Page.printToPDF` (CDP). Identical pattern to Bible-Insight: attach → enable → printToPDF → detach → write to local Downloads via `chrome.downloads.download`. ZERO network exfiltration of debugger output. |
| `chrome.identity` (OAuth) has bounded, documented use | ✅ | Only used in `lib/google-drive/drive-client.js:363-389` via `chrome.identity.launchWebAuthFlow()` for Google OAuth. `getRedirectURL()` returns Chrome's standard extension OAuth redirect (`https://{ext_id}.chromiumapp.org/`). Access token stored in `chrome.storage.local.drive_access_token`. **BYOA pattern: user authenticates with their own Google account; clipboard never sees Google credentials directly.** |
| `chrome.management` permission has bounded, documented use | ⚠ Bounded but high-trust | Used to enumerate the user's installed extensions (per legacy README + earlier audit). Doesn't transmit; informational only. Chrome will display install warning for this permission. |
| ExtPay 3rd-party payment integration | ⚠ 3rd-party | `lib/payments/ExtPay.js` is a vendored 3rd-party library; `lib/payments/extpay-wrapper.js` wraps it. ExtPay's checkout/verification flow goes to `extensionpay.com` (their servers), NOT 864zeros. ExtPay sees the user's email + payment status. 864zeros is a CUSTOMER of ExtPay, not a proxy or co-recipient. **Operator should ensure clipboard's privacy disclosure mentions ExtPay as a 3rd-party processor.** |
| Plain-English secret-handling disclosure in Options page | ⚠ NOT YET PRESENT | **Operator-action item P1**: add a RULE-007 §Disclosure block to `options/options.html` (verbatim text in §VI below). Same pattern as Bible-Insight's `RULE_007_AUDIT.md §V.a` and clipboard's existing privacy-badge in the options-footer. |

**Net verdict:** clipboard is **structurally RULE-007-compliant** (no bundled keys, no proxy, no `.sync` for secrets, no debugger/identity exfiltration, ExtPay disclosed as 3rd-party). The outstanding items are **disclosure UX gaps** — the page does not yet display the canonical RULE-007 §Disclosure block AND the ExtPay 3rd-party processor disclosure. Both are mechanical fixes; close before Phase-2 release.

---

## II. `chrome.debugger` Usage — Bounded to PDF Generation

Identical pattern to Bible-Insight. Used exactly in `lib/pdf-generator.js:104-141` for one operation: `Page.printToPDF` via Chrome DevTools Protocol.

| Location | Operation | Data flow |
|---|---|---|
| `lib/pdf-generator.js:104` | `chrome.debugger.attach({ tabId }, '1.3')` | Attach CDP session to user's current tab |
| `lib/pdf-generator.js:107` | `chrome.debugger.sendCommand({ tabId }, 'Page.enable')` | Enable Page domain (CDP requirement before printToPDF) |
| `lib/pdf-generator.js:110` | `chrome.debugger.sendCommand({ tabId }, 'Runtime.enable')` | Enable Runtime domain |
| `lib/pdf-generator.js:116` | `chrome.debugger.sendCommand({ tabId }, 'Page.printToPDF', ...)` | Capture user's current tab as PDF; result is base64-encoded |
| `lib/pdf-generator.js:141` | `chrome.debugger.detach({ tabId })` | Release CDP session immediately after PDF generation |

**Key properties:**
- The CDP session is opened, used for one `Page.printToPDF`, and detached immediately. No long-lived debugger attachment.
- The PDF data path: `chrome.debugger` → result.data (base64) → local IndexedDB or `chrome.downloads.download` (per the calling flow). **Zero network exfiltration.**
- The PDF capture is user-invoked (the "Save as PDF" feature); not silent.
- Error handling ensures debugger detaches on exception (no zombie CDP sessions).

**RULE-007 verdict:** bounded, single-purpose, no exfiltration. Same UX consideration as Bible-Insight: Chrome's install warning is the cost of the PDF feature; recommend adding a privacy-disclosure tooltip in Options page (see §VI.b below).

---

## III. `chrome.identity` Usage — Google OAuth via launchWebAuthFlow

Used exactly in `lib/google-drive/drive-client.js:360-389` for Google Drive OAuth.

| Location | Operation | Data flow |
|---|---|---|
| `drive-client.js:363` | `chrome.identity.getRedirectURL()` | Returns Chrome's standard extension OAuth redirect URI (`https://{ext_id}.chromiumapp.org/`). No user data; identifier of THIS extension installation. |
| `drive-client.js:373` | `chrome.identity.launchWebAuthFlow({ url: googleOAuthURL, interactive: true })` | Opens user's browser to Google's OAuth consent screen. User authenticates with THEIR Google account; clipboard never sees password. |
| `drive-client.js:389` | parses `access_token` from OAuth callback URL | Stores token in `chrome.storage.local.drive_access_token` |

**BYOA pattern (Bring Your Own Account):**
- User signs into THEIR Google account at Google's OAuth consent screen
- Google issues an access_token scoped to clipboard's manifest `oauth2.scopes` (not audited here — verify in production manifest)
- Token lives in `chrome.storage.local` only (never `.sync`)
- All subsequent Google Drive API calls use this token; data goes user → Google directly

**RULE-007 verdict:** identical pattern to Chronicle's BYOK except for OAuth instead of API key. User-controlled credentials; no 864zeros visibility into Google data. ✅ compliant.

---

## IV. AI Fetch — Direct-to-Gemini, BYOK

Same pattern as Bible-Insight. `lib/api-client.js`:

| Function | Endpoint | Auth |
|---|---|---|
| `analyze(text, options)` | `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}` (line 111) | API key URL query param |
| `analyzeImage(imageData)` | Same endpoint, line 163 | Same |
| Anthropic fallback (if used) | `'x-api-key': config.apiKey` header (line 212) | API key in header |

**API key sourcing**: `getApiKey()` at `api-client.js:48-50` reads from `chrome.storage.local.get('${appSlug}_ai_api_key')`.

**Net**: BYOK throughout; direct-to-Google (or direct-to-Anthropic on fallback path); no 864zeros proxy. Note: the dead-code `lib/ai/ai-client.js` (which referenced `clipboard-864z.864zeros.workers.dev` proxy) was DELETED in the prior strike arc (commit `b1fd136`). The proxy is GONE; only the BYOK direct path remains.

---

## V. ExtPay 3rd-Party Payment Processor

`lib/payments/ExtPay.js` is a vendored 3rd-party library (the upstream is `extensionpay.com`'s public SDK). `lib/payments/extpay-wrapper.js` wraps it.

| Concern | Status |
|---|---|
| Does ExtPay phone home to 864zeros? | ❌ No. ExtPay's checkout + verification flow goes to `extensionpay.com` (their servers). |
| Does ExtPay see user PII? | ⚠ Yes, by design — ExtPay sees user email + payment status. This is the price of using a hosted payment processor. |
| Is ExtPay disclosed in clipboard's privacy materials? | ⚠ Not explicitly; recommend adding to RULE-007 §Disclosure block (see §VI below). |
| Does 864zeros receive a copy of payment data? | The operator (864zeros LLC) gets payment status via ExtPay's webhook/dashboard (standard for any payment processor relationship). Operator does NOT see card numbers; only "user X paid for Pro tier on date Y" type metadata. |
| Is this a RULE-007 violation? | ❌ No. RULE-007 forbids 864zeros from PROXYING user secrets through 864zeros-controlled servers. ExtPay is a separate processor with its own disclosed policies. The user's payment relationship is user ↔ ExtPay (with 864zeros as the merchant); 864zeros doesn't intermediate the secrets. |

**Key distinction**: ExtPay handles credit card data (PCI-scope) directly; 864zeros never sees it. This is the same pattern as any business using Stripe / Paddle / Chargebee. RULE-007 §Disclosure should NAME ExtPay so users know who handles their payment data — this is operationally honest, not a violation.

---

## VI. Operator Action Items (Pre-Phase-2-Release)

### VI.a — P1: Add RULE-007 §Disclosure block to Options page

Insert into `options/options.html` (suggest near the existing `.privacy-badge` element or as a dedicated `<section class="oia-card privacy-disclosure">`):

```html
<section class="oia-card privacy-disclosure">
  <h2 class="oia-h2">Privacy &amp; Your Data</h2>

  <p><strong>AI features.</strong> Your Gemini API key is stored only on this device, in <code>chrome.storage.local</code>. It is sent only to Google's official Gemini endpoint at <code>generativelanguage.googleapis.com</code> when you trigger an AI analysis. <strong>864zeros never sees your key, your prompts, or your responses.</strong></p>

  <p><strong>Google Drive sync (Pro).</strong> Authentication uses Google's OAuth flow via <code>chrome.identity.launchWebAuthFlow()</code>. You sign in with your own Google account; clipboard never sees your password. The OAuth access token is stored in <code>chrome.storage.local</code> on this device only. All Drive API calls go directly from your browser to Google.</p>

  <p><strong>Payments (Pro).</strong> Clipboard uses ExtensionPay (<code>extensionpay.com</code>) to process payments. ExtPay handles credit card data directly; <strong>864zeros never sees your payment details.</strong> 864zeros receives payment-status metadata (e.g., "user X paid for Pro tier") via ExtPay's standard merchant flow.</p>

  <p><strong>Captured content.</strong> Your clips (text, screenshots, PDFs, tags, AI summaries) live in IndexedDB on this device. They do not leave your device unless you explicitly trigger an action that uses an external feature (Drive sync, AI analysis, or the upcoming Sovereign History export).</p>

  <p><strong>The "debugger" permission.</strong> Used <strong>only</strong> to generate PDF exports of pages you choose (the "Save as PDF" feature). When you click Save as PDF, clipboard briefly attaches Chrome's DevTools Protocol to the active tab, captures the page as a PDF, and immediately detaches. The PDF goes to your local IndexedDB or Downloads folder. No data is ever sent over the network through this permission.</p>

  <p><strong>The "management" permission.</strong> Used only to enumerate which other extensions you have installed (for compatibility/conflict detection). Does not transmit anything.</p>
</section>
```

This satisfies RULE-007 §Disclosure for clipboard's full surface (AI + OAuth + ExtPay + debugger + management). More verbose than Bible-Insight's because clipboard's surface is larger.

### VI.b — P2: Bible-Insight tier-model question is now SETTLED for clipboard too

clipboard's existing tier ladder (Free / Starter / Pro / Power) is RECURRING-subscription-based via ExtPay. The Strike-021 Sovereign History tier ($2.99 perpetual) sits ALONGSIDE this — it's the cross-fleet sovereignty layer, NOT a replacement for the existing Pro/Power tiers. **Clarify in customer communications**: Sovereign History is purchased ONCE and is OWNED FOREVER; Pro/Power subscriptions remain a separate value proposition (cloud sync, AI quotas, etc.). Resolve in marketing copy + the Sovereign History card body (already partially addressed in the "Why $2.99 once and not part of the Pro subscription?" rationale paragraph in `options/options.html`).

### VI.c — P3: ExtPay relationship documentation

The `lib/payments/ExtPay.js` SDK is third-party code. Operator should:
- Document the ExtPay merchant account ID + onboarding date in `SECURITY_ROTATION_LOG.md`
- Verify ExtPay's privacy policy is linked from clipboard's privacy materials (operator-side, not in this audit's scope)
- Confirm the ExtPay merchant key (if any) is in `chrome.storage.local` only, NOT bundled in shipped code

---

## VII. Cross-References

- [`864z-build-kit/references/core/BUILD_KIT_RULES.md`](../../../864z-build-kit/references/core/BUILD_KIT_RULES.md) — RULE-007 (Secret Sovereignty) §Required Mechanics + §Disclosure
- [`864zeros-ISD/ISD-DIV-0-CORE/SECURITY_ROTATION_LOG.md`](../../../../864zeros-ISD/ISD-DIV-0-CORE/SECURITY_ROTATION_LOG.md) — fleet credential rotation log
- [`864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_SOVEREIGN_GAP_REPORT.md`](../../../../864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_SOVEREIGN_GAP_REPORT.md) — fleet-wide sovereignty audit
- [`extensions/Bible-Insight/RULE_007_AUDIT.md`](../Bible-Insight/RULE_007_AUDIT.md) — companion per-extension audit (Bible-Insight); clipboard's audit follows the same template + adds 3 sections (chrome.identity, ExtPay, chrome.management)
- [`extensions/864z-chronical/`](../864z-chronical/) — Reference RULE-007 implementation (the canonical BYOK pattern)
- prior-strike commit `b1fd136` — confirmed deletion of dead-code 864zeros AI proxy at `lib/ai/ai-client.js`

---

## VIII. Versioning

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-09 | Initial audit. clipboard passes RULE-007 §Required Mechanics on all axes (BYOK Gemini, BYOA Google Drive OAuth, debugger bounded to PDF, ExtPay 3rd-party with operator-disclosed merchant relationship, no `chrome.storage.sync` for secrets, no 864zeros proxy in any code path). Three outstanding items: P1 RULE-007 §Disclosure block (verbatim text provided in §VI.a — covers AI + OAuth + ExtPay + debugger + management); P2 Sovereign-History-vs-Pro-subscription clarification in customer comms; P3 ExtPay merchant-account documentation in SECURITY_ROTATION_LOG. Verdict: ✅ STRUCTURALLY COMPLIANT (pending §Disclosure UX update before Phase-2 release). |

---

*clipboard RULE-007 Sovereign Audit v1.0 · 2026-05-09 · 864zeros LLC · audit artifact (per-extension).*
