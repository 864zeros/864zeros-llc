# Project SYZYGY [v0.1.0 — Strike 001]

**Authority:** Cross-platform Bone-vs-Skin architecture for 864zeros products. Single core-engine.js drives both Chrome extensions (`/ext`) and Google Workspace Add-ons (`/addon`).
**Loaded:** On any work that touches platform-agnostic logic — Trust Vault crypto, theme state, billing checks, Drive Vault directory listing.
**Authored:** 2026-05-11 by 864z-OA (Office Architect) per RULE-000 (SYZYGY Strike 001).
**Update protocol:** Versioning row at §V per release. Bone (lib/) is the source of truth; skins (ext/, addon/) MUST consume via the public Engine API only.
**Format note:** Follows the `864z-markdown-standard` (RULE-008).

---

## I. Architectural Mandate

> **Bone = Logic. Skin = UI.** The Bone is platform-agnostic and lives in `lib/core-engine.js`. Skins translate Bone state to platform UI primitives (Chrome DOM vs Workspace Card Service).

### I.a — Directory Layout

```
LLC-DIV-4-SYZYGY/
├── lib/
│   └── core-engine.js          # Bone — UMD-style; runtime-detects Chrome vs Apps Script
├── ext/                        # Skin (Chrome) — DOM/React; loads core-engine as classic script
│   └── README.md
├── addon/                      # Skin (Workspace) — CardService; core-engine pasted in as .gs sibling
│   ├── Code.gs                 # Entry: onHomepage(), handleOpenVault(), …
│   └── appsscript.json         # Apps Script manifest (oauthScopes + addOns config)
└── README.md                   # ← you are here
```

### I.b — Runtime Detection (single source of truth)

`core-engine.js` self-detects at load time:

| Test | Outcome |
|---|---|
| `typeof PropertiesService !== 'undefined'` | Workspace Apps Script (V8 runtime) |
| `typeof chrome !== 'undefined' && chrome.storage` | Chrome extension page (options/panel/popup/SW) |
| neither | Tests / node — defensive in-memory fallback |

---

## II. Core Engine Modules (v0.1.0)

| Module | Purpose | Notes |
|---|---|---|
| **Storage** | `storageSet / storageGet / storageRemove` | 8KB-chunked under Workspace's 9KB-per-key `PropertiesService` ceiling; chunks indexed via `${key}__chunks` meta + `${key}__${i}` segments. |
| **Theme** | `getTheme / setTheme / cycleTheme` | 3-state `'dark' / 'light' / 'system'`; storage key `'864z_user_theme'`. Compatible with Strike-033 Chrome theme-engine. |
| **Billing** | `getBillingTier / setBillingTier / isVaultUnlocked` | Abstract interface: `'free' / 'vault' / 'power'`. Chrome integrates with ExtPay (Strikes 024-027); Workspace will integrate with Marketplace billing (future). |
| **Crypto** | `encryptVault / decryptVault` | AES-GCM via Web Crypto (`window.crypto.subtle`); PBKDF2-SHA256 100k iterations key derivation; salt+IV bundled per blob (v1 format). **Chrome-only at runtime** — Apps Script has no Web Crypto; addon-side reads/writes opaque ciphertext but does not decrypt. |
| **Drive Vault** | `driveListDirectory / driveFolderBreadcrumbs` | Stateless: caller passes `accessToken`; engine returns `{files, nextPageToken}` and crumb arrays. Uses `httpGet` abstraction (UrlFetchApp in Workspace, fetch in Chrome). Ported from `[864F]` clipboard's `drive-client.js`. |
| **HTTP** | `httpGet` | Abstracts `fetch` (Chrome) vs `UrlFetchApp.fetch` (Apps Script). Sync-shape Promise return either way. |

---

## III. 9KB Rule (Workspace Chunking)

`PropertiesService.setProperty(key, value)` enforces a ~9KB byte limit per VALUE. SYZYGY's storage wrapper chunks any serialized payload exceeding 8KB:

```
payload > 8KB  →  meta key  ${key}__chunks  = "N"
                  data keys ${key}__0, ${key}__1, …, ${key}__(N-1)
                  base key  ${key} deleted (cleanup)

payload <= 8KB →  base key  ${key} = serialized
                  prior chunk keys deleted (cleanup-on-shrink)
```

Reads check `${key}__chunks` first; if present, reassembles by index; else falls back to base key.

---

## IV. Cross-References

- [`lib/core-engine.js`](./lib/core-engine.js) — the Bone.
- [`addon/Code.gs`](./addon/Code.gs) — Workspace Add-on entry.
- [`../LLC-DIV-3-FACTORY/extensions/clipboard/lib/google-drive/drive-client.js`](../LLC-DIV-3-FACTORY/extensions/clipboard/lib/google-drive/drive-client.js) — `[864F]` prototype source for the ported Drive Vault module.
- [`../864z-build-kit/references/core/theme-engine.js`](../864z-build-kit/references/core/theme-engine.js) — Strike-033 Chrome theme engine (SYZYGY's theme module is compatible with this storage key).
- [`../864z-build-kit/references/core/trust-vault.js`](../864z-build-kit/references/core/trust-vault.js) — Strike-028 Chrome Trust Vault library (SYZYGY's crypto module supersedes by adding real AES-GCM encryption).
- [`../864z-build-kit/references/legal/trust-vault-terms.md`](../864z-build-kit/references/legal/trust-vault-terms.md) — Strike-030 operator-verbatim Custody Notice + Disclaimer (governs SYZYGY's encrypted vault claims).
- [`../../864zeros-ISD/ISD-DIV-5-EVOLUTION/reports/SYSTEM_STRIKE_LOG.md`](../../864zeros-ISD/ISD-DIV-5-EVOLUTION/reports/SYSTEM_STRIKE_LOG.md) — SYZYGY strike entries.

---

## V. Versioning

| Version | Date | Changes |
|---|---|---|
| 0.1.0 | 2026-05-11 | Initial (SYZYGY Strike 001). Bone-vs-Skin scaffold; UMD-style `core-engine.js` with 6 modules (storage / theme / billing / crypto / drive vault / http). 8KB chunking under the 9KB Workspace PropertiesService ceiling. AES-GCM via Web Crypto (Chrome-only). Drive Vault ported stateless from `[864F]` clipboard. Apps Script `Code.gs` entry with `onHomepage()` + `handleOpenVault()` cards in Obsidian/Sage palette. |

---

*Project SYZYGY v0.1.0 · 2026-05-11 · 864zeros LLC · LLC-DIV-4-SYZYGY.*
