# 864zeros Factory Inventory

**Generated:** 2026-03-18
**Registry Version:** 1.0.0

---

## Extensions in Production

| Strike ID | Product Name | Target | Status | Vulture Score |
|-----------|-------------|--------|--------|---------------|
| 864z-2026-002 | PocketRescue | Pocket | BUILD_INITIALIZED | 9.32 |
| 864z-2026-003 | InstaRescue | Instapaper | BUILD_INITIATED | 9.38 |
| 864z-2026-004 | PassVault | Dashlane | BUILD_IN_PROGRESS | - |
| 864z-2026-005 | ReadFlow | Instapaper | SCAFFOLD_COMPLETE | - |

---

## Standard Bricks Library

### Core Bricks

| Brick ID | Name | Type | File |
|----------|------|------|------|
| - | 864z-core | Branding | `864z-core.js` |
| BRK-CRYPTO-001 | Web Crypto Vault | Security | `crypto-vault.js` |
| BRK-DB-001 | IndexedDB Core | Persistence | `db.js` |
| BRK-MIG-002 | Migration Engine | Backup | `backup.js` |
| BRK-PRI-005 | Data Redactor | Privacy | `redactor.js` |
| BRK-PAY-004 | Pay Once Unlock | Payments | `tiers.js` |

### Parser Bricks

| Brick ID | Name | Formats Supported |
|----------|------|-------------------|
| BRK-PWD-001 | Password Rescue | Dashlane CSV/JSON, LastPass CSV, 1Password CSV, Bitwarden JSON |
| BRK-MIG-003 | Read-Later Parser | Pocket HTML/JSON, Instapaper CSV/HTML |

### UI Bricks

| Brick ID | Name | Type | File |
|----------|------|------|------|
| BRK-UI-IMPORT-001 | Import Flow | Controller | `BRK-UI-IMPORT-001.js` |
| BRK-PRICING-001 | Pricing Modal | Controller | `BRK-PRICING-001.js` |
| BRK-UI-003 | OIA Design System | CSS | `aether-ui.css` |

---

## Extension Details

### 864z-2026-004-passvault (PassVault)

**Target:** Dashlane
**Priority:** CRITICAL
**Status:** Build in Progress

**UI Components:**
- `sidepanel/` - Main password vault UI
- `options/` - Settings with pricing modal
- `onboarding/` - Master password setup + Recovery PDF

**Logic Bricks Used:**
- BRK-CRYPTO-001 (AES-256-GCM encryption)
- BRK-PWD-001 (Password file parsing)
- BRK-DB-001 (IndexedDB vault storage)
- BRK-PRICING-001 (Upgrade modal)
- 864z-core.js (Corporate branding)

**Delta Components:**
- `breach-checker.js` - HIBP k-Anonymity check
- `recovery-pdf.js` - Emergency recovery document
- `audit-report.js` - Vault health visualization
- `security-theme.css` - Dark security theme

**Key Files:**
```
sidepanel/index.html     # Main UI
sidepanel/app.js         # App controller
lib/crypto-vault.js      # Encryption (BRK-CRYPTO-001)
lib/password-parser.js   # Import parsing (BRK-PWD-001)
onboarding/index.html    # First-run setup
assets/security-theme.css # Dark theme
```

---

### 864z-2026-005-readflow (ReadFlow)

**Target:** Instapaper
**Status:** Scaffold Complete

**UI Components:**
- `sidepanel/` - Article list UI
- `options/` - Settings
- `onboarding/` - Master password setup

**Logic Bricks Used:**
- BRK-CRYPTO-001 (Encrypted storage)
- BRK-PRICING-001 (Upgrade modal)
- 864z-core.js (Corporate branding)

**Delta Components:**
- `instapaper-parser.js` - Instapaper CSV/HTML parser
- `article-fetcher.js` - Article content extraction
- `epub-builder.js` - E-Reader export
- `qr-generator.js` - QR code generation

**Key Files:**
```
sidepanel/index.html       # Main UI
sidepanel/app.js           # App controller
lib/crypto-vault.js        # Encryption
lib/instapaper-parser.js   # Import parsing
lib/aether-ui.css          # Design system
```

---

### 864z-2026-002-pocket-alt (PocketRescue)

**Target:** Pocket
**Status:** Build Initialized
**Vulture Score:** 9.32

**UI Components:**
- `sidepanel/` - Article list UI
- `options/` - Settings
- `rescue/` - Pocket import wizard

**Logic Bricks Used:**
- BRK-DB-001 (IndexedDB storage)
- BRK-MIG-002 (Export/import pipeline)
- BRK-UI-003 (OIA Design System)

**Delta Components:**
- `pocket-parser.js` - Pocket HTML/JSON parser

**Key Files:**
```
sidepanel/index.html        # Main UI
sidepanel/main.js           # App controller
lib/pocket-parser.js        # Pocket import
rescue/rescue.html          # Import wizard
lib/oia-design-system.css   # Design system
```

---

## CSS Frameworks

| Framework | Status | Description |
|-----------|--------|-------------|
| `aether-ui.css` | **Primary** | Full design system with brand components |
| `security-theme.css` | Active | Dark theme for security apps (extends aether-ui) |
| `oia-design-system.css` | Deprecated | Legacy design system |

---

## Build Kit Structure

```
864z-build-kit/
├── lib/
│   ├── 864z-core.js           # Corporate identity
│   ├── BRK-PRICING-001.js     # Pricing modal
│   ├── BRK-UI-IMPORT-001.js   # Import flow
│   └── aether-ui.css          # Design system
├── templates/
│   ├── manifest.json          # MV3 manifest template
│   └── options/
│       └── options.html       # Options page template
├── libs/
│   └── password-rescue/
│       ├── crypto-vault.js    # BRK-CRYPTO-001
│       └── password-parser.js # BRK-PWD-001
└── scripts/
    └── strike-bridge.js       # Build automation
```

---

## Strike Bridge Automation

The `strike-bridge.js` script automatically injects:

1. **Core Bricks** (always included):
   - `864z-core.js` - Corporate identity
   - `BRK-PRICING-001.js` - Pricing modal

2. **UI Bricks** (based on extension type):
   - `BRK-UI-IMPORT-001.js` - For rescue/import extensions
   - `aether-ui.css` - Design system

3. **Templates**:
   - `manifest.json` with author: "864zeros LLC"
   - `options.html` with standard footer

---

## Pricing Tiers (Standard)

| Tier | Price | Description |
|------|-------|-------------|
| Free | $0 | Core features, local storage |
| Pro | $12/month | Sync, automation, priority support |
| Lifetime | $150 once | All Pro features, forever |

---

*864zeros LLC - Organize Your Internal Architecture*
