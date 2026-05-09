# BUILD MANIFEST: PassVault (864z-2026-004)
## Dashlane Rescue - Zero-Knowledge Password Vault

**Strike ID:** 864z-2026-004
**Codename:** PassVault / Dashlane-Rescue
**Status:** BUILD_IN_PROGRESS
**Priority:** CRITICAL (Day 1 Launch - Dashlane pricing news trending)
**Initiated:** 2026-03-17

---

## Architecture Overview

```
+------------------------------------------------------------------+
|                        PASSVAULT ARCHITECTURE                      |
|                      (Zero-Knowledge Design)                       |
+------------------------------------------------------------------+
|                                                                    |
|  [User's Browser - 100% Client-Side]                              |
|  +--------------------------------------------------------------+ |
|  |                                                              | |
|  |  +------------------+    +-----------------------------+     | |
|  |  | Master Password  |--->| PBKDF2 Key Derivation       |     | |
|  |  | (Never Stored)   |    | (600,000 iterations)        |     | |
|  |  +------------------+    +-----------------------------+     | |
|  |                                    |                         | |
|  |                                    v                         | |
|  |  +------------------+    +-----------------------------+     | |
|  |  | Import Engine    |    | AES-256-GCM Encryption      |     | |
|  |  | (BRK-PWD-001)    |    | (Web Crypto API)            |     | |
|  |  +------------------+    +-----------------------------+     | |
|  |          |                         |                         | |
|  |          v                         v                         | |
|  |  +------------------+    +-----------------------------+     | |
|  |  | Migration Audit  |    | Encrypted IndexedDB         |     | |
|  |  | (Vault Health)   |    | (Local Storage Only)        |     | |
|  |  +------------------+    +-----------------------------+     | |
|  |                                                              | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  [External - Optional, Privacy-Preserving]                        |
|  +--------------------------------------------------------------+ |
|  |  HIBP k-Anonymity Check (SHA-1 prefix only, no full hash)   | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

---

## Security Constraints

### HARD REQUIREMENTS (Non-Negotiable)

| Constraint | Implementation |
|------------|----------------|
| Zero Server Dependency | No backend. All data stays in browser. |
| No Network in Core | `fetch()` and `XMLHttpRequest` BANNED in `background/` and core `lib/` except HIBP check |
| Master Password Never Stored | Only derived key held in memory, cleared on lock |
| Unrecoverable by Design | Lost password = lost data. Recovery PDF is only backup. |
| Web Crypto API Only | No custom crypto. Browser-native AES-256-GCM + PBKDF2 |

### Allowed Network Calls

| Endpoint | Purpose | Privacy Model |
|----------|---------|---------------|
| `api.pwnedpasswords.com/range/{prefix}` | Breach check | k-Anonymity (5-char SHA-1 prefix only) |

---

## Build Composition

### 80% Reusable Bricks

| Brick ID | Name | Injection Point |
|----------|------|-----------------|
| BRK-CRYPTO-001 | Web_Crypto_Vault | `lib/crypto-vault.js` |
| BRK-PWD-001 | Password_Rescue_Parser | `lib/password-parser.js` |
| BRK-DB-001 | IndexedDB_Core | `lib/vault-storage.js` |
| BRK-PRI-005 | Data_Redactor | `lib/privacy-guard.js` |

### 20% Delta (Custom Development)

| Component | Description | File |
|-----------|-------------|------|
| Master Password Flow | PBKDF2 setup with salt storage | `onboarding/master-password.js` |
| Recovery PDF Generator | Printable emergency access document | `lib/recovery-pdf.js` |
| Migration Audit UI | Vault Health Report visualization | `sidepanel/audit-report.js` |
| Security Theme | Dark mode, high-contrast greens | `assets/security-theme.css` |
| HIBP Integration | k-Anonymity breach checker | `lib/breach-checker.js` |

---

## File Structure

```
864z-2026-004-passvault/
├── manifest.json                 # Chrome MV3 manifest
├── BUILD_MANIFEST.md             # This file
│
├── background/
│   └── service-worker.js         # Extension lifecycle (NO NETWORK)
│
├── sidepanel/
│   ├── index.html                # Main UI entry
│   ├── app.js                    # Sidepanel controller
│   ├── audit-report.js           # Migration Audit UI [DELTA]
│   └── components/
│       ├── vault-list.js         # Password list view
│       ├── password-entry.js     # Single entry component
│       └── health-score.js       # Visual security score
│
├── onboarding/
│   ├── index.html                # First-run setup
│   ├── master-password.js        # Password setup flow [DELTA]
│   └── recovery-pdf.js           # PDF generator [DELTA]
│
├── options/
│   ├── options.html              # Settings page
│   └── options.js                # Settings controller
│
├── lib/
│   ├── crypto-vault.js           # BRK-CRYPTO-001 (injected)
│   ├── password-parser.js        # BRK-PWD-001 (injected)
│   ├── vault-storage.js          # BRK-DB-001 (adapted)
│   ├── breach-checker.js         # HIBP k-Anonymity [DELTA]
│   └── constants.js              # App constants
│
├── assets/
│   ├── security-theme.css        # Dark security theme [DELTA]
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
│
└── _locales/
    └── en/
        └── messages.json         # i18n strings
```

---

## The "Aha!" Moment: Migration Audit

### Trigger Point
User completes Dashlane/LastPass import successfully.

### Vault Health Report Display

```
+------------------------------------------------------------------+
|                                                                    |
|  VAULT HEALTH REPORT                                               |
|  Imported from: Dashlane (247 passwords)                          |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  SECURITY SCORE                                                    |
|                                                                    |
|       [============================------]  72/100                |
|                                                                    |
|  "Good start, but there's room to improve"                        |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  CRITICAL ISSUES FOUND                                             |
|                                                                    |
|  [!] 12 COMPROMISED passwords                                     |
|      Found in known data breaches                                  |
|      > amazon.com, netflix.com, linkedin.com...                   |
|                                                                    |
|  [!] 31 REUSED passwords                                          |
|      Same password on multiple sites                               |
|      > Worst offender: 1 password used on 8 sites!                |
|                                                                    |
|  [!] 18 WEAK passwords                                            |
|      Too short or easy to guess                                    |
|      > facebook.com, twitter.com, reddit.com...                   |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  ESTIMATED VALUE SAVED                                             |
|                                                                    |
|     $60/year   vs Dashlane Premium                                |
|    $180        over 3 years                                       |
|                                                                    |
|  "Your passwords are now free. Forever."                          |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  [Fix Weak Passwords]  [Generate Strong Passwords]  [Done]        |
|                                                                    |
+------------------------------------------------------------------+
```

---

## Master Password Flow

### Setup (First Run)

```
Step 1: Create Master Password
+------------------------------------------------------------------+
|                                                                    |
|  CREATE YOUR MASTER PASSWORD                                       |
|                                                                    |
|  This is the ONLY password you need to remember.                  |
|  We cannot recover it if you forget it.                           |
|                                                                    |
|  +----------------------------------------------------+           |
|  |                                                    |           |
|  +----------------------------------------------------+           |
|                                                                    |
|  Strength: [=================-----]  Strong                       |
|                                                                    |
|  +----------------------------------------------------+           |
|  | Confirm password                                  |           |
|  +----------------------------------------------------+           |
|                                                                    |
|  [x] I understand: If I lose this password, my data              |
|      cannot be recovered. There is no "forgot password."          |
|                                                                    |
|  [Create Vault]                                                   |
|                                                                    |
+------------------------------------------------------------------+

Step 2: Recovery PDF
+------------------------------------------------------------------+
|                                                                    |
|  EMERGENCY RECOVERY DOCUMENT                                       |
|                                                                    |
|  Download and print this document. Store it somewhere safe        |
|  (not on your computer). This is your ONLY backup option.         |
|                                                                    |
|  +----------------------------------------------------+           |
|  |                                                    |           |
|  |  [PDF Preview]                                    |           |
|  |                                                    |           |
|  |  PASSVAULT RECOVERY KEY                           |           |
|  |  Created: 2026-03-17                              |           |
|  |                                                    |           |
|  |  Salt: a3f2...8c91                                |           |
|  |  Vault ID: vault_xk92m                            |           |
|  |                                                    |           |
|  |  [QR Code for Salt]                               |           |
|  |                                                    |           |
|  +----------------------------------------------------+           |
|                                                                    |
|  [Download PDF]  [Print]  [I've Saved It - Continue]              |
|                                                                    |
+------------------------------------------------------------------+
```

---

## UI/UX: Security-Hardened Theme

### Design Tokens (OIA Security Variant)

```css
:root {
  /* Background - Deep dark */
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-elevated: #1a1a24;
  --bg-hover: #22222e;

  /* Text - High contrast */
  --text-primary: #f0f0f5;
  --text-secondary: #a0a0b0;
  --text-muted: #606070;

  /* Accent - Security green */
  --accent-primary: #00d084;
  --accent-hover: #00f09a;
  --accent-muted: #00805050;

  /* Status colors */
  --status-secure: #00d084;
  --status-warning: #f0c020;
  --status-danger: #f04040;
  --status-info: #4080f0;

  /* Borders - Subtle */
  --border-color: #2a2a3a;
  --border-focus: #00d084;

  /* Shadows - Minimal */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.5);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.5);

  /* Typography */
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-sans: 'Inter', -apple-system, sans-serif;
}
```

### Tone of Copy

| Type | Example |
|------|---------|
| Trust-building | "Your passwords never leave your device." |
| Direct/Honest | "We cannot recover your master password." |
| Value-focused | "Dashlane charges $60/year. PassVault is free forever." |
| Action-oriented | "Fix weak passwords now." |

---

## Permissions (Minimal)

```json
{
  "permissions": [
    "storage",        // IndexedDB for encrypted vault
    "sidePanel",      // Main UI
    "contextMenus",   // Right-click "Save password"
    "alarms"          // Auto-lock timer
  ],
  "optional_permissions": [
    "clipboardWrite"  // Copy password to clipboard
  ],
  "host_permissions": [
    "https://api.pwnedpasswords.com/*"  // HIBP k-anonymity only
  ]
}
```

---

## Build Checklist

### Phase 1: Core (Today)
- [x] Directory structure initialized
- [x] BUILD_MANIFEST.md created
- [ ] manifest.json (MV3)
- [ ] lib/constants.js
- [ ] lib/crypto-vault.js (inject BRK-CRYPTO-001)
- [ ] lib/password-parser.js (inject BRK-PWD-001)
- [ ] lib/breach-checker.js (HIBP k-anonymity)

### Phase 2: Onboarding (Today)
- [ ] onboarding/index.html
- [ ] onboarding/master-password.js
- [ ] lib/recovery-pdf.js

### Phase 3: Import & Audit (Today)
- [ ] sidepanel/index.html
- [ ] sidepanel/app.js
- [ ] sidepanel/audit-report.js

### Phase 4: Polish (Tomorrow)
- [ ] assets/security-theme.css
- [ ] _locales/en/messages.json
- [ ] options/options.html

---

## Launch Criteria

| Requirement | Status |
|-------------|--------|
| Zero network calls in core | PENDING |
| Master password PBKDF2 flow | PENDING |
| Recovery PDF generation | PENDING |
| Dashlane CSV/JSON import | READY (BRK-PWD-001) |
| LastPass CSV import | READY (BRK-PWD-001) |
| Migration Audit UI | PENDING |
| Breach check (HIBP) | PENDING |
| Security theme applied | PENDING |

---

## Revenue Model

| Tier | Price | Features |
|------|-------|----------|
| Free Forever | $0 | Unlimited passwords, import/export, security audit |
| Pro (Lifetime) | $29 | Browser autofill, TOTP 2FA, breach monitoring |
| Family | $49 | 5 vaults, shared folders |

---

*Build Manifest generated by 864zeros Builder*
*Strike: 864z-2026-004 | Priority: CRITICAL*
