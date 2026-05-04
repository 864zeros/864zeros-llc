# 864zeros Build System — Chrome Extension Instructions v2.0

> **Scope:** Chrome extension projects only. Load alongside `CLAUDE-base.md`.
> **Platform:** Manifest V3 (MV3), Panel-first (90% of builds).
> **Updated:** 2026-03 — Vulture Strike patterns, security-hardened architecture.

---

## Vulture Strike Philosophy

### The 80/20 Build

Every extension targets a **stagnant SaaS product** where users are frustrated by:
- Pricing walls on basic features
- Cloud dependency / privacy concerns
- Feature bloat / complexity creep
- Abandoned development

We build the **20% of features that solve 80% of user pain**, with these constraints:

| Constraint | Implementation |
|------------|----------------|
| **Local-First** | All data encrypted on device. No cloud required. |
| **Zero-Knowledge** | Master password never stored. Unrecoverable by design. |
| **No Network (default)** | Service worker makes ZERO external calls unless explicitly approved |
| **Migration Path** | Import from competitor formats on day one |
| **Aha Moment** | Show user what they're escaping (audit, savings, comparison) |

### Strike Types

| Type | Target | Example |
|------|--------|---------|
| **Rescue** | Users fleeing paid SaaS | PassVault (Dashlane rescue) |
| **Sunset** | Users of abandoned products | ReadVault (Pocket rescue) |
| **Liberation** | Users trapped by vendor lock-in | DataVault (Notion export) |

---

## Reference Files

Before writing any code, read these:

**Core (in `references/core/`):**
- `oia-design-system.css` — Base design tokens
- `aether-ui.css` — Security-hardened dark theme variant
- `lib-core.md` — Shared modules: api-client, redactor, tiers, constants

**Extension-specific (in `references/extension/`):**
- `chrome-extension-standard-2026.md` — Scaffold rules, manifest patterns
- `lib-extension.md` — Extension modules: db.js, store.js, backup.js

**Security Bricks (in `lib/`):**
- `crypto-vault.js` (BRK-CRYPTO-001) — AES-256-GCM + PBKDF2 encryption
- `password-parser.js` (BRK-PWD-001) — Multi-format import with audit
- `breach-checker.js` (BRK-BREACH-001) — HIBP k-Anonymity checking

---

## Extension Architecture Rules

### Manifest V3 (Hardened)

```json
{
  "manifest_version": 3,
  "background": {
    "service_worker": "background/service-worker.js"
  }
}
```

**Critical:** Do NOT use `"type": "module"` in manifest background section. Inline constants in service worker to avoid ES import registration errors.

### Service Worker (Zero-Network Default)

```javascript
// SECURITY CONSTRAINT: NO NETWORK CALLS
// Service worker handles extension lifecycle only.
// All sensitive operations happen in sidepanel/content scripts.

// Inline constants (no ES module imports)
const MESSAGE_TYPES = {
  VAULT_UNLOCK: 'VAULT_UNLOCK',
  VAULT_LOCK: 'VAULT_LOCK',
  VAULT_STATUS: 'VAULT_STATUS'
};
```

**Rules:**
- All listeners at top level — never inside async/callbacks
- No DOM access — use `offscreen` API if needed
- No global variable state — use `chrome.storage.local`
- `return true` from `onMessage` for async responses
- `chrome.alarms` for scheduled work — never setTimeout/setInterval

### Panel Extensions (Required)

```javascript
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
```

### Encryption Architecture (BRK-CRYPTO-001)

```
Master Password (user input, never stored)
    ↓
PBKDF2 (600,000 iterations, random salt)
    ↓
AES-256-GCM Key (session only, cleared on lock)
    ↓
Encrypted Vault (IndexedDB, base64 ciphertext)
```

**Key Rules:**
- Salt stored in localStorage (not secret)
- Derived key held in memory only during session
- Auto-lock after 15 minutes idle (configurable)
- Recovery PDF with encrypted backup + instructions

### State Management

```
chrome.storage.local = encrypted vault reference
IndexedDB = encrypted ciphertext blobs
Session memory = decrypted key (cleared on lock)
  ↕
chrome.storage.onChanged → UI re-renders
```

### Permissions (Minimal)

```json
{
  "permissions": [
    "storage",
    "unlimitedStorage",
    "sidePanel",
    "contextMenus",
    "alarms"
  ],
  "optional_permissions": [
    "clipboardWrite"
  ],
  "host_permissions": []
}
```

**Add host_permissions ONLY for:**
- HIBP breach check: `"https://api.pwnedpasswords.com/*"`
- Specific site integrations (document in brief)

---

## Security Patterns

### Import/Migration Flow

Every Strike extension MUST support import on first use:

```javascript
// 1. Parse competitor export
const vault = parsePasswordExport(content, filename);

// 2. Run security audit (the "aha!" moment)
const auditSummary = vault.runSecurityAudit();

// 3. Check for breaches (if applicable)
const breachSummary = await breachChecker.auditVault(vault.entries);

// 4. Show Migration Audit UI
showAuditReport({
  source: vault.metadata.source,
  totalImported: vault.metadata.totalImported,
  auditSummary,
  breachSummary,
  savings: calculateSavings(vault.metadata.source)
});
```

### The "Aha Moment" UI

After import, immediately show:
1. **Security Score** (0-100)
2. **Problem Count** (weak, reused, breached)
3. **Savings** ("$60/year vs [Competitor] Premium")
4. **Trust Badge** ("Your passwords never leave your device")

### Recovery PDF Generation

```javascript
// Generate printable recovery document
const recoveryHTML = generateRecoveryPDF({
  vaultId: vault.id,
  createdAt: new Date().toISOString(),
  encryptedBackup: encryptedBase64,
  qrCode: generateQRCode(encryptedBase64)
});
```

---

## Code Standards

### JavaScript
- **NO ES imports in service-worker.js** — inline or use IIFE bundles
- ES modules OK in sidepanel/content scripts
- Vanilla JS only for v1 — no frameworks
- Namespace all storage keys with app slug prefix
- Kebab-case file names: `service-worker.js`, `crypto-vault.js`

### HTML
- Link security theme CSS:
  ```html
  <link rel="stylesheet" href="../lib/aether-ui.css">
  ```
- Use semantic HTML5 elements
- Panel HTML is single file with view sections toggled by JS

### CSS (Security Theme)
- Dark background: `#0a0a0f` to `#1a1a24`
- Accent: Security green `#00d084`
- Danger: `#ff4757`
- Warning: `#ffa502`
- No pure black/white
- `prefers-reduced-motion` respected

---

## Build Phases

| Phase | File | Gate |
|-------|------|------|
| 1. Scaffold | `phase-1-scaffold.md` | Extension loads without errors |
| 2. Security | `phase-2-security.md` | Crypto vault works, master password flow complete |
| 3. Migration | `phase-3-migration.md` | Import from competitor format works |
| 4. UI Shell | `phase-4-ui-shell.md` | All views render with security theme |
| 5. Features | `phase-5-feature.md` | Each feature works end-to-end |
| 6. Polish | `phase-6-polish.md` | Animations, errors, accessibility |
| 7. Proof | `phase-7-proof.md` | Tests pass, manual QA complete |

**Never skip a phase. Security phases (2-3) are mandatory for Strike extensions.**

---

## Output Format

When building, output one file at a time:

```
FILE: path/to/file.js
```
```javascript
// file contents
```

After each phase:

```
CHECKPOINT: [phase name]
VERIFY: [what to test]
STATUS: [ready for next phase / blocked on X]
```

---

## Quick Reference: Strike Extension Checklist

- [ ] Zero network calls in service worker (except approved APIs)
- [ ] Master password never stored (PBKDF2 derived key only)
- [ ] AES-256-GCM encryption for all vault data
- [ ] Import from competitor format on day one
- [ ] Migration Audit UI with "aha moment"
- [ ] Savings calculation displayed
- [ ] Recovery PDF generation
- [ ] Auto-lock after idle timeout
- [ ] Security-hardened dark theme
- [ ] Minimal permissions (document each one)
