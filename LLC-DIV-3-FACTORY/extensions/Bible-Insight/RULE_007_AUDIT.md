# Bible-Insight: RULE-007 Sovereign Audit [v1.0]

**Authority:** Per-extension Sovereign Audit gating the FHG Founding-100 trust contract.
**Loaded:** Pre-release security review; Founding-100 cohort gate.
**Authored:** 2026-05-09 by 864z-OA (Office Architect) per RULE-000.
**Update protocol:** Append-only. New audit findings land as new versioned entries.
**Sources synthesized:** `extensions/Bible-Insight/manifest.json` · `js/background.js` (chrome.debugger usage) · `js/lib/api.js` (Gemini AI fetch flow) · `js/lib/constants.js` (API endpoints) · `js/content.js` (YouTube transcript fetch) · `lib/transparency-tier.css` (transparency baseline) · `RULE-007 §Disclosure` + `§Required Mechanics` from `BUILD_KIT_RULES.md`.
**Format note:** Follows the `864z-markdown-standard` (RULE-008).

---

## I. Audit Summary — VERDICT: ✅ COMPLIANT (with one operator-action item)

Bible-Insight passes RULE-007 (Secret Sovereignty) on every required mechanic:

| RULE-007 mechanic | Status | Evidence |
|---|---|---|
| BYOK (user-supplied API key only; no bundled keys) | ✅ | `getApiKey()` reads from `chrome.storage.local[`${APP_SLUG}_settings`].apiKey` (`js/lib/api.js:186-189`). Zero bundled keys in source — confirmed via grep for `sk-` / `AIza` / `Bearer` literals. |
| Secret storage in `chrome.storage.local` only (never `.sync`) | ✅ | All 4 `chrome.storage.local.get` / `.set` calls in `js/lib/api.js` use `.local`; zero `.sync` references in entire `Bible-Insight/` tree. |
| Direct fetch to provider's documented endpoint (no proxy through 864zeros) | ✅ | `API_ENDPOINTS.GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'` (`js/lib/constants.js:191`). All 5 AI fetch sites in `api.js` POST directly to this Google-owned host. Zero `*.864zeros.*` host references in fetch URLs. |
| No 864zeros server in any code path that handles secrets | ✅ | Network audit (programmatic + manual) found zero non-Google, non-YouTube, non-API.Bible hosts in fetch URLs. |
| `chrome.debugger` permission has bounded, documented use | ✅ (with caveat) | Only used in `js/background.js:347-369, 413` for `Page.printToPDF` CDP call. PDF data goes to `chrome.downloads.download` with `data:application/pdf;base64,...` URL → user's local Downloads folder. ZERO network exfiltration of debugger output. |
| Plain-English secret-handling disclosure in Options page | ⚠ NOT YET PRESENT | **Operator-action item P1**: add the canonical RULE-007 §Disclosure block to `html/options.html` Settings/Privacy section. See §V below for verbatim text to inject. |

**Net verdict:** Bible-Insight is **structurally RULE-007-compliant** (no bundled keys, no proxy, no `.sync` for secrets, no debugger exfiltration). The one outstanding item is a **disclosure UX gap** — the page does not yet display the plain-English "your key stays local; we never see it" line that RULE-007 §Disclosure mandates. Mechanical fix; closes in <30 min before public release.

---

## II. `chrome.debugger` Usage — Bounded to PDF Generation

The `debugger` permission appears in `manifest.json` permissions array, which causes Chrome to display an aggressive install warning ("can read and change all your data on websites"). It is used **exactly once** in source, for one purpose:

| Location | Operation | Data flow |
|---|---|---|
| `js/background.js:347` | `chrome.debugger.getTargets()` | Read-only target enumeration |
| `js/background.js:354` | `chrome.debugger.attach({ tabId }, '1.3')` | Attach CDP session to user's current tab |
| `js/background.js:356-367` | `chrome.debugger.sendCommand(... 'Page.printToPDF', ...)` | Capture the user's current tab as PDF (the "Save as PDF" feature; user-invoked) |
| `js/background.js:369` | `chrome.debugger.detach({ tabId })` | Release the CDP session immediately after PDF generation |
| `js/background.js:383-387` | `chrome.downloads.download({ url: pdfDataUrl, ... })` | Save PDF to user's local Downloads folder via base64 data URL |

**Key properties:**
- The CDP session is opened, used for ONE `Page.printToPDF` call, and detached immediately. No long-lived debugger attachment.
- The PDF data path: `chrome.debugger` → `result.data` (base64) → `data:application/pdf;base64,...` URL → `chrome.downloads.download` → user's filesystem. **Zero network exfiltration.**
- The PDF capture is user-invoked (the "Save as PDF" UI button); not silent or automatic.
- Error handling at `js/background.js:411-417` ensures the debugger detaches even on exception (no zombie CDP sessions).

**RULE-007 verdict:** The `debugger` permission is bounded, single-purpose, and does not exfiltrate captured content. Chrome's install warning is a UX cost the operator has chosen to pay for the PDF feature; consider a privacy-disclosure tooltip in the Options page explaining this (see §V.b below).

---

## III. AI Fetch Calls — Direct-to-Gemini, BYOK, No PII Leakage

Bible-Insight makes 5 distinct AI fetch sites, all to the same Google-owned endpoint. Each is wrapped in `fetchWithRetry()` (`js/lib/api.js:163-180`) which adds exponential backoff but does not change the destination URL.

| Function | Purpose | Payload sent to Gemini | Auth |
|---|---|---|---|
| `analyzeText(text, analysisType)` (`api.js:206-276`) | Generate AI analysis (key-points / themes / cross-refs / verse context) of user-selected text | User text (truncated at 10000 chars) + AI prompt selected by `analysisType` | API key via URL query param `?key=${apiKey}` |
| `analyzeImage(imageData)` (`api.js:283-352`) | Gemini Vision analysis of user's screenshot | base64-encoded image inline + standard description prompt | Same |
| `lookupVerse(reference, translation)` (`api.js:394-485`) | Get verse text for a reference (e.g. "John 3:16" / "KJV") | Verse reference + short prompt asking Gemini to quote it | Same |
| `getCrossRefs(reference)` (`api.js:493-568`) | Get 3-5 related verse references | Verse reference + short cross-ref prompt | Same |
| `detectVersesWithAI(text)` (`api.js:626-729`) | Detect Bible verses present in arbitrary user text | User text (truncated at 10000 chars) + verse-detection prompt + JSON-output instruction | Same |

**RULE-007 PII analysis:**
- **All payloads originate from user content** (selected text, captured image, verse reference) chosen by the user via explicit UI interactions.
- **All payloads are sent to Google's official Gemini endpoint** via the user's own API key. 864zeros has zero visibility, zero proxying, zero logging.
- **The user controls the data plane**: their Gemini account, their billing, their data-retention settings with Google. 864zeros is not a party to the data exchange.
- **No PII auto-extraction**: Bible-Insight does not collect, derive, or attach name/email/identifier metadata to any payload. The text it sends is the text the user selected.
- **Token tracking** (`api.js:18-44`) is in-memory only (resets on SW restart), never exfiltrated.

**Privacy note from CLAUDE.md** (project identity doc): *"Privacy note: Only redacted/user-approved content is sent to APIs."* This is documented intent. No code-level PII redaction is performed inside `api.js` — the user's selection is sent verbatim. **This is acceptable under RULE-007** because the user explicitly chose what to send (via selection UI) AND the destination is the user's own paid Gemini account.

---

## IV. Other Fetch Calls — Public YouTube, Not RULE-007 Surfaces

| Call site | URL | Auth | RULE-007 surface? |
|---|---|---|---|
| `js/content.js:382` | `${baseUrl}&fmt=json3` (YouTube transcript) | None — public endpoint | ❌ No (no secrets, no user-content payload) |
| `js/content.js:426` | `baseUrl` (YouTube transcript XML fallback) | None — public endpoint | ❌ No |

These hit YouTube's public timedtext API directly from the user's browser. No secrets transit. Not RULE-007 surfaces.

---

## V. Operator Action Items (Pre-Public-Release)

### V.a — P1: Add RULE-007 §Disclosure block to Options page

Insert into `html/options.html` Settings/Privacy section (or as a dedicated `<section class="oia-card">` near the API-key input):

```html
<section class="oia-card privacy-disclosure">
  <h2 class="oia-h2">Privacy &amp; Your API Key</h2>
  <p>Your Gemini API key is stored only on this device, in <code>chrome.storage.local</code>. It is sent only to Google's official Gemini endpoint at <code>generativelanguage.googleapis.com</code> when you trigger an AI analysis. <strong>864zeros never sees your key, your prompts, or your responses.</strong></p>
  <p>Your captured content (highlights, screenshots, PDFs) lives in IndexedDB on this device. It does not leave your device unless you click an action that explicitly uses the Gemini AI features.</p>
</section>
```

This satisfies RULE-007 §Disclosure: *"Options page Privacy/Data section MUST contain plain-English text..."*

### V.b — P2: Add `debugger` permission disclosure tooltip

Per RULE-007 §Disclosure best practice, explain what the high-trust `debugger` permission is used for. Add to the same Privacy section:

```html
<details class="permission-disclosure">
  <summary>Why does Bible Insight need the "debugger" permission?</summary>
  <p>The <code>debugger</code> permission is used <strong>only</strong> to generate PDF exports of pages you choose (the "Save as PDF" feature). When you click Save as PDF, Bible Insight briefly attaches Chrome's DevTools Protocol to the active tab, captures the page as a PDF, and immediately detaches. The PDF goes to your local Downloads folder. No data is ever sent over the network through this permission.</p>
</details>
```

### V.c — P3: Tier-0.5 monetization model decision

Bible-Insight's `CLAUDE.md` describes a `$4.99/mo or $29.99/yr` recurring tier ("Pro"). Chronicle's Tier-0.5 uses a **$2.99 perpetual unlock** model. Pre-public-release, the operator must decide which tier model Bible-Insight actually ships:

- **Option A**: Bible-Insight follows Chronicle's $2.99 perpetual model (matches fleet pattern; aligns with FHG sovereignty messaging)
- **Option B**: Bible-Insight keeps its existing $4.99/mo or $29.99/yr recurring model (matches CLAUDE.md spec; recurring revenue)
- **Option C**: Bible-Insight offers BOTH a $2.99 perpetual "Vault" tier AND a $4.99/mo "Pro" tier (more complex; might be worth it given Bible-Insight's larger feature surface)

This is a GTM/marketing decision, not a RULE-007 decision — but it should be settled before payment integration begins. Outside the scope of this audit.

---

## VI. Cross-References

- [`864z-build-kit/references/core/BUILD_KIT_RULES.md`](../../../864z-build-kit/references/core/BUILD_KIT_RULES.md) — RULE-007 (Secret Sovereignty) §Required Mechanics + §Disclosure (the rules being audited against)
- [`864zeros-ISD/ISD-DIV-0-CORE/SECURITY_ROTATION_LOG.md`](../../../../864zeros-ISD/ISD-DIV-0-CORE/SECURITY_ROTATION_LOG.md) — fleet credential rotation log (Bible-Insight's own RULE-007 posture is now part of the operator's SECURITY_ROTATION_LOG attestation)
- [`864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_SOVEREIGN_GAP_REPORT.md`](../../../../864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_SOVEREIGN_GAP_REPORT.md) — fleet-wide sovereignty audit; this doc deepens the per-extension lens for Bible-Insight specifically
- [`864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_FACTORY_MANIFEST.md`](../../../../864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_FACTORY_MANIFEST.md) — Tier-0.5 readiness ladder (Bible-Insight's promotion to Rung 3 alongside this audit)
- [`extensions/864z-chronical/`](../864z-chronical/) — Reference RULE-007 implementation (the canonical BYOK + dev-override + DEV_NOTES pattern)

---

## VII. Versioning

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-09 | Initial audit. Bible-Insight passes RULE-007 §Required Mechanics on all axes (BYOK, local-only storage, direct-to-provider fetch, bounded debugger usage, no PII auto-extraction). One outstanding item: §Disclosure block not yet present in Options page. Three operator-action items published (P1 disclosure, P2 debugger tooltip, P3 tier-model decision). Verdict: ✅ COMPLIANT (structural); pending §Disclosure UX update before public release. |

---

*Bible-Insight RULE-007 Sovereign Audit v1.0 · 2026-05-09 · 864zeros LLC · audit artifact (per-extension).*
