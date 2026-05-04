# Vulture Strike Brief — [__STRIKE_ID__]

> **Strike Type:** Rescue | Sunset | Liberation
> **Target SaaS:** [Competitor Name]
> **Build Philosophy:** 80/20 — Ship the 20% that solves 80% of user pain

---

## 1. Strike Identity

| Field | Value |
|-------|-------|
| Strike ID | `864z-YYYY-NNN` |
| App Name | __APP_NAME__ |
| App Slug | __APP_SLUG__ (kebab-case) |
| Target SaaS | __COMPETITOR__ |
| User Pain | __PRIMARY_FRUSTRATION__ |
| Our Angle | __DIFFERENTIATOR__ |

### User Archetype

> "I'm a [TARGET_USER] who is frustrated because [COMPETITOR] [SPECIFIC_PAIN].
> I want [SIMPLE_OUTCOME] without [DEALBREAKER]."

### The Aha Moment

What will make the user say "Holy shit, I should have done this sooner"?

```
After importing from [COMPETITOR]:
- Show: [AUDIT_METRIC]
- Show: [SAVINGS_CALCULATION]
- Show: [TRUST_MESSAGE]
```

---

## 2. Competitor Intelligence

| Metric | Competitor | Our Strike |
|--------|------------|------------|
| Price | $__/year | Free forever |
| Data Location | Cloud | 100% local |
| Password Limit | __ | Unlimited |
| Export | __ | Always available |
| Privacy | __ | Zero-knowledge |

### Known Competitor Frustrations (Reddit/Twitter Signals)

1. __PAIN_POINT_1__
2. __PAIN_POINT_2__
3. __PAIN_POINT_3__

---

## 3. Security Architecture

| Layer | Implementation |
|-------|----------------|
| Encryption | AES-256-GCM (BRK-CRYPTO-001) |
| Key Derivation | PBKDF2, 600k iterations |
| Storage | IndexedDB (encrypted blobs) |
| Network | Zero calls (except: __EXCEPTIONS__) |
| Recovery | Printable PDF with QR |

### Approved Network Calls

| Endpoint | Purpose | Data Sent |
|----------|---------|-----------|
| `api.pwnedpasswords.com` | Breach check | 5-char SHA1 prefix only |
| _add if needed_ | | |

---

## 4. Import/Migration

### Supported Formats

| Source | Format | Parser Module |
|--------|--------|---------------|
| __COMPETITOR_1__ | JSON/CSV | `password-parser.js` |
| __COMPETITOR_2__ | CSV | `password-parser.js` |
| Generic | CSV | `password-parser.js` |

### Migration Audit Metrics

| Metric | Calculation |
|--------|-------------|
| Security Score | `(strong / total) * 100 - (reused * 5) - (weak * 10)` |
| Reused Count | Passwords used on 2+ sites |
| Weak Count | Length < 8 OR common password list |
| Breached Count | HIBP k-anonymity match |
| Savings | `$[COMPETITOR_PRICE]/year` |

---

## 5. Core Features (80/20)

Build ONLY these features. Nothing else until all are complete.

| # | Feature | Description | Brick |
|---|---------|-------------|-------|
| 1 | Master Password Setup | PBKDF2 key derivation, never stored | BRK-CRYPTO-001 |
| 2 | Import from [COMPETITOR] | Parse export, run audit | BRK-PWD-001 |
| 3 | Migration Audit UI | Score, problems, savings | — |
| 4 | Vault View | List entries with search | — |
| 5 | Auto-Lock | Lock after 15min idle | — |
| 6 | Recovery PDF | Printable backup document | — |

### Features Explicitly NOT Built (v1)

- [ ] Cloud sync
- [ ] Browser autofill
- [ ] Sharing
- [ ] Teams/family
- [ ] Mobile app
- [ ] _add others_

---

## 6. Permissions

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
  "host_permissions": [
    "https://api.pwnedpasswords.com/*"
  ]
}
```

**Justification for each:**

| Permission | Why |
|------------|-----|
| `storage` | Settings and vault metadata |
| `unlimitedStorage` | Large encrypted vaults |
| `sidePanel` | Primary UI surface |
| `contextMenus` | Right-click actions |
| `alarms` | Auto-lock timer |
| `clipboardWrite` | Copy passwords (optional) |

---

## 7. UI Structure

### Side Panel Views

| View ID | Name | Purpose |
|---------|------|---------|
| `locked` | Locked | Master password entry |
| `vault` | Vault | Password list + search |
| `entry` | Entry Detail | View/edit single entry |
| `audit` | Audit Report | Post-import analysis |
| `add` | Add Entry | Manual password entry |

### Onboarding Flow

1. Welcome screen (brand, privacy promise)
2. Master password creation (strength meter)
3. Recovery PDF generation
4. Import prompt OR skip to empty vault

---

## 8. Copy Guidelines

### Trust Messaging

| Location | Copy |
|----------|------|
| Footer | "Your passwords never leave your device" |
| Onboarding | "Zero-knowledge. Unrecoverable by design." |
| Savings | "You just saved $[X]/year. Forever." |

### Forbidden Copy

- "Don't forget your password" → "Keep this safe"
- "Error" → "Something went wrong"
- "Invalid" → "Let's try that again"

---

## 9. Testing Checklist

### Security Tests

- [ ] Master password not in storage/logs
- [ ] Encrypted data unreadable without key
- [ ] Auto-lock triggers correctly
- [ ] Recovery PDF generates valid backup

### Import Tests

- [ ] Parse [COMPETITOR] JSON export
- [ ] Parse [COMPETITOR] CSV export
- [ ] Handle malformed input gracefully
- [ ] Audit metrics calculate correctly

### UX Tests

- [ ] Unlock flow < 3 seconds
- [ ] Search filters instantly
- [ ] Copy to clipboard works
- [ ] All views render in dark theme

---

## 10. Launch Checklist

- [ ] Icons generated (16, 32, 48, 128px)
- [ ] Manifest permissions minimal
- [ ] Service worker has zero network calls
- [ ] Import from competitor works
- [ ] Audit report shows savings
- [ ] Recovery PDF generates
- [ ] Extension loads in Chrome without errors
- [ ] All views render correctly
- [ ] Dark theme consistent

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Import Success Rate | > 95% |
| Time to First Import | < 2 minutes |
| Chrome Web Store Rating | > 4.5 stars |
| Uninstall Rate (7-day) | < 15% |

---

_Strike Brief by: _______________
_Date: _______________
_Ready for build: [ ] Yes  [ ] Needs review_
