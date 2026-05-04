# Recon: Dashlane Password Rescue
## Pre-Build Intelligence for BRK-PWD-001

**Target:** Dashlane Password Manager
**Opportunity:** Password Rescue Parser Brick
**Recon Date:** 2026-03-17

---

## 1. Export Format Specifications

### Available Export Formats

| Format | Availability | Data Completeness |
|--------|--------------|-------------------|
| CSV | All users | Logins only, limited fields |
| JSON (DASH format) | All users | Full vault backup |
| Secure Archive | All users | Encrypted, proprietary |

### CSV Export Structure

```csv
# Dashlane CSV Export Fields (Logins)
username,username2,username3,title,password,note,url,category,otpSecret
```

**Field Notes:**
- `username`, `username2`, `username3`: Multiple username fields for complex logins
- `title`: Entry name/label
- `password`: Plaintext password (security concern for users)
- `note`: Free-text notes field
- `url`: Associated website URL
- `category`: Folder/category name
- `otpSecret`: TOTP secret if 2FA is stored

### JSON Export Structure

```json
{
  "AUTHENTIFIANT": [
    {
      "title": "Example Site",
      "email": "user@example.com",
      "login": "username",
      "secondaryLogin": "",
      "password": "********",
      "note": "Notes here",
      "url": "https://example.com",
      "category": "Personal",
      "otpSecret": "",
      "autoLogin": true,
      "subdomainOnly": false,
      "useFixedUrl": false
    }
  ],
  "SECURENOTE": [...],
  "PAYMENTMEAN_CREDITCARD": [...],
  "IDENTITY": [...],
  "ADDRESS": [...],
  "BANKSTATEMENT": [...]
}
```

**JSON Categories:**
- `AUTHENTIFIANT` - Login credentials
- `SECURENOTE` - Secure notes
- `PAYMENTMEAN_CREDITCARD` - Payment cards
- `IDENTITY` - Personal identity info
- `ADDRESS` - Saved addresses
- `BANKSTATEMENT` - Bank account details

---

## 2. Free Tier Limitations & Pain Signals

### Current Free Tier Restrictions

| Limitation | Impact | User Frustration Level |
|------------|--------|------------------------|
| 25 password limit | Severe | CRITICAL |
| Single device only | Severe | CRITICAL |
| No dark web monitoring | Medium | HIGH |
| No VPN access | Low | MEDIUM |
| Limited password sharing | Medium | HIGH |

### Key Pain Signals (Common Complaints)

| Signal | Category | Representative Quote |
|--------|----------|---------------------|
| 25 password limit hit | CRITICAL | "I can't even store half my accounts" |
| Price increase backlash | CRITICAL | "Went from $40/yr to $60/yr overnight" |
| Forced cloud dependency | HIGH | "No offline access, what if Dashlane goes down?" |
| Desktop app discontinued | HIGH | "Browser extension only now, feels less secure" |
| Export anxiety | HIGH | "What format should I export to? Will another app read it?" |
| Sync conflicts | MEDIUM | "Duplicate entries appearing after sync" |
| Mobile autofill failures | MEDIUM | "Works 50% of the time on Android" |

### Historical Context

- **2022:** Desktop app deprecated in favor of web-only
- **2023:** Free tier reduced from unlimited to 50 passwords
- **2024:** Free tier further reduced to 25 passwords
- **2025:** Premium price increased to $60/year
- **Result:** Steady exodus of free/casual users

---

## 3. Migration Paths Users Are Taking

### Primary Destinations

| Destination | Type | Migration Difficulty | User Sentiment |
|-------------|------|---------------------|----------------|
| Bitwarden | Cloud/Self-host | Easy (native import) | Very Positive |
| 1Password | Cloud | Easy (CSV import) | Positive |
| KeePassXC | Local-first | Medium (manual mapping) | Technical users only |
| Apple Keychain | Local + Cloud | Hard (no direct import) | Ecosystem-locked |
| Proton Pass | Cloud | Medium (new, limited import) | Privacy-focused |

### Migration Friction Points

1. **CSV doesn't include all data** - Secure notes, cards, identities require JSON
2. **TOTP migration** - OTP secrets often fail to transfer correctly
3. **Folder structure loss** - Categories don't always map 1:1
4. **Duplicate detection** - No deduplication in export
5. **Password history** - Not included in any export format

---

## 4. Local-First Password Alternative Requirements

### Core Requirements (Must-Have)

```
[ ] Import Dashlane CSV with full field mapping
[ ] Import Dashlane JSON with all data categories
[ ] Local-only encrypted storage (no cloud required)
[ ] Strong encryption (AES-256 or better)
[ ] Export to standard formats (CSV, JSON, KDBX)
[ ] Browser extension for autofill
[ ] TOTP code generation and storage
[ ] Offline-first with optional sync
```

### Enhanced Requirements (Should-Have)

```
[ ] Password strength audit
[ ] Duplicate detection and merge
[ ] Breach checking (local database, not cloud)
[ ] Secure password generator
[ ] Cross-platform (desktop + mobile)
[ ] Biometric unlock support
```

### Differentiators vs Existing Solutions

| Feature | Dashlane | Bitwarden | KeePassXC | Our Opportunity |
|---------|----------|-----------|-----------|-----------------|
| Local-first | No | Optional | Yes | Yes |
| Zero cloud required | No | No | Yes | Yes |
| One-time purchase | No | No (free tier) | Yes (free) | Yes |
| Simple migration | N/A | Good | Complex | Superior |
| No account required | No | No | Yes | Yes |

---

## 5. Recommended Brick: BRK-PWD-001

### Password Rescue Parser

**Purpose:** Universal password manager import/export utility brick

**Scope:**
- Parse Dashlane CSV and JSON exports
- Normalize to standard internal format
- Export to multiple destination formats
- Handle edge cases (duplicates, malformed data, encoding)

### Technical Requirements

```typescript
interface PasswordEntry {
  id: string;
  title: string;
  url: string;
  username: string;
  password: string;
  notes?: string;
  category?: string;
  totpSecret?: string;
  totpAlgorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  totpDigits?: 6 | 8;
  totpPeriod?: number;
  created?: Date;
  modified?: Date;
  customFields?: Record<string, string>;
}

interface PasswordVault {
  entries: PasswordEntry[];
  secureNotes: SecureNote[];
  paymentCards: PaymentCard[];
  identities: Identity[];
  metadata: VaultMetadata;
}
```

### Parser Functions Needed

```typescript
// Core parsing functions
parseDashlaneCSV(csvContent: string): PasswordEntry[]
parseDashlaneJSON(jsonContent: string): PasswordVault

// Validation and normalization
validatePasswordStrength(password: string): StrengthReport
detectDuplicates(entries: PasswordEntry[]): DuplicateGroup[]
normalizeUrls(entries: PasswordEntry[]): PasswordEntry[]

// Export functions
exportToKDBX(vault: PasswordVault): Buffer  // KeePass format
exportToBitwardenJSON(vault: PasswordVault): string
exportToGenericCSV(vault: PasswordVault): string
```

### Edge Cases to Handle

1. **Unicode encoding** - Dashlane exports may have encoding issues
2. **Special characters in passwords** - CSV escaping problems
3. **Multi-line notes** - CSV parsing breaks
4. **Empty fields** - Null vs empty string handling
5. **Duplicate URLs** - Same site, different accounts
6. **TOTP parsing** - otpauth:// URI format variations

---

## 6. Strike Assessment

```json
{
  "brick_id": "BRK-PWD-001",
  "codename": "Password Rescue Parser",
  "primary_target": "Dashlane",
  "secondary_targets": ["LastPass", "1Password", "Bitwarden"],
  "opportunity_score": 8.5,
  "pain_signals": [
    "25 password free limit",
    "Price increases",
    "Cloud-only architecture",
    "Export format confusion"
  ],
  "technical_complexity": "Medium",
  "estimated_effort": "1-2 weeks",
  "reusability": "High (foundation for password vault strike)"
}
```

---

## 7. Next Steps

1. **Validate:** Obtain sample Dashlane exports (CSV + JSON) for testing
2. **Build:** Implement BRK-PWD-001 parser brick
3. **Extend:** Add LastPass and 1Password parsers to same brick
4. **Strike:** Use brick as foundation for local-first password vault

---

*Recon completed by Vulture Nest Intelligence*
