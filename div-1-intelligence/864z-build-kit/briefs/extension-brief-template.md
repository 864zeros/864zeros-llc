# App Brief — [__APP_NAME__]

> Fill out this template completely before starting any build phase.
> This file is the single source of truth for what gets built.

---

## 1. Identity

| Field | Value |
|-------|-------|
| App Name | __APP_NAME__ |
| App Slug | __APP_SLUG__ (kebab-case, used in code and storage keys) |
| Description | __APP_DESCRIPTION__ (max 132 characters) |
| Brand | `864zeros` / `OIA` (determines copy voice and store listing tone) |
| Template | `panel` / `popup` |
| Version | 1.0.0 |

---

## 2. Permissions

List only what this extension needs. Reference Section 9 of the extension standard.

| Permission | Reason |
|------------|--------|
| `sidePanel` | Panel extension (remove if popup) |
| `storage` | State persistence and settings |
| _add rows as needed_ | |

**Host permissions** (if any):

```json
"host_permissions": [
]
```

---

## 3. Screens / Views

List every view the user sees in the panel. These become the sections built in Phase 2.

| View ID | View Name | Purpose | Nav Icon/Label |
|---------|-----------|---------|----------------|
| | | | |
| | | | |
| | | | |

**Options page sections:**
- General settings
- Your Plan (tier display + upgrade)
- Data (export / import / Google Drive sync)
- Fuel the Build (coffee/tip button)

---

## 4. Features (Priority Order)

Build in this exact order during Phase 3. One feature per cycle.

| # | Feature Name | Description | View | Tier | /lib/ Modules |
|---|-------------|-------------|------|------|---------------|
| 1 | | | | free | |
| 2 | | | | free | |
| 3 | | | | starter | |
| 4 | | | | pro | |
| _add rows_ | | | | | |

---

## 5. Data Model

### IndexedDB Schema

Define every object store this extension needs. Extend the base schema from `lib-spec.md`.

**Store: `__STORE_NAME__`**

```javascript
{
  keyPath: 'id',
  indexes: [
    { name: 'by-___', field: '___', unique: false }
  ]
}
```

**Record shape:**

```javascript
{
  id: '',            // crypto.randomUUID()
  createdAt: '',     // ISO string
  // add fields
}
```

_(Repeat for each additional store)_

---

## 6. AI Integration

| Field | Value |
|-------|-------|
| Default Provider | `gemini` / `claude` |
| Default Model | _model string_ |
| PPI Redaction | `required` (always) |
| No-Log API Tier | `required` / `preferred` |

### AI Call Points

List every place the extension calls AI:

| Trigger | Input | Instruction | Expected Output | Tier |
|---------|-------|-------------|-----------------|------|
| | | | | |
| | | | | |

---

## 7. Content Script Behavior

Does this extension need a content script?

| Field | Value |
|-------|-------|
| Needed | `yes` / `no` |
| Match Pattern | `<all_urls>` / specific patterns |
| Actions | What it does on the host page |
| Injects CSS | `yes` / `no` — what it styles on the page |

---

## 8. Monetization

### Tier Structure

| Tier | Price | What Unlocks |
|------|-------|-------------|
| Free | $0 | |
| Starter | $____ | |
| Pro | $____ | |
| Power | $____ | |

### Feature-to-Tier Mapping

```javascript
FEATURE_TIERS = {
  '___': 'free',
  '___': 'starter',
  '___': 'pro',
  '___': 'power'
};
```

### Fuel the Build

| Field | Value |
|-------|-------|
| Coffee button | Options page + _anywhere else?_ |
| Payment link | Stripe link (add when created) |

---

## 9. Chrome Web Store Listing

| Field | Value |
|-------|-------|
| Category | _Productivity / Developer Tools / etc_ |
| Tagline | _One sentence, punchy_ |
| Key Selling Points | 1. ___ 2. ___ 3. ___ |
| Privacy Highlight | "No ads. No tracking. Your data stays yours." |

---

## 10. Testing Notes

### Critical Paths to Test

List the 3-5 most important user flows that must work perfectly:

| # | Flow Description | Touches |
|---|-----------------|---------|
| 1 | | content script → service worker → IndexedDB → panel |
| 2 | | |
| 3 | | |

### Known Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| | |

### AI Test Scenarios

| Input with PPI | Expected Redaction | AI Instruction |
|----------------|-------------------|----------------|
| | | |

---

## 11. Future Lego Bricks

What features or modules from this extension could be reused in future 864zeros products?

| Module / Feature | Reuse Potential |
|-----------------|-----------------|
| | |
| | |

---

_Brief completed by: _______________  
_Date: _______________  
_Ready for build: [ ] Yes  [ ] Needs review_
