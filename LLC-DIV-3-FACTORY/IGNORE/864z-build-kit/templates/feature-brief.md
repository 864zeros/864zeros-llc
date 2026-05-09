# Feature Brief: [FEATURE_NAME]

> Use this template to define a new feature before implementation.
> Replace all `[PLACEHOLDERS]` with actual values.

---

## Overview

| Field | Value |
|-------|-------|
| Feature ID | `[feature-id]` (kebab-case, used in FEATURE_TIERS) |
| Display Name | [Human Readable Name] |
| Required Tier | `free` / `starter` / `pro` / `power` |
| Complexity | Low / Medium / High |
| Dependencies | [List any features this depends on] |

## Description

[2-3 sentences explaining what this feature does and why users want it]

## User Story

As a [user type], I want to [action] so that [benefit].

---

## Monetization Strategy

> Select ONE primary monetization model for this feature.

| Model | Select | Details |
|-------|--------|---------|
| **Tier-Based** | [ ] | Feature unlocks at specific tier (free/starter/pro/power) |
| **Credit-Based** | [ ] | Pay-per-use, deduct credits on each action |
| **Subscription** | [ ] | Recurring payment for ongoing access |

### If Tier-Based:
- Required Tier: `[tier]`
- Upgrade Price: `$[X.XX]/month`

### If Credit-Based:
- Credits per action: `[X]` credits
- Credit pack pricing:
  - 50 credits: `$[X.XX]`
  - 200 credits: `$[X.XX]`
  - 500 credits: `$[X.XX]`
- Free credits on signup: `[X]`

### If Subscription:
- Monthly price: `$[X.XX]/month`
- Annual price: `$[X.XX]/year` (saves X%)
- Trial period: `[X] days`
- Grace period after expiry: `[X] days`

---

## Technical Specification

### Message Types

Add to `lib/constants.js`:

```js
// In MESSAGE_TYPES object
[MESSAGE_TYPE_NAME]: '[MESSAGE_TYPE_NAME]',
```

### Feature Tier

Add to `lib/constants.js`:

```js
// In FEATURE_TIERS object
'[feature-id]': '[tier]',
```

### Data Model Changes

**New fields on existing stores:**
```js
// clips store
{
  // existing fields...
  [newField]: [type], // [description]
}
```

**New stores (if any):**
```js
// Add to DB_SCHEMA in constants.js
[store_name]: {
  keyPath: 'id',
  indexes: [
    { name: 'by-[field]', field: '[field]', unique: false }
  ]
}
```

### Service Worker Handler

```js
case MESSAGE_TYPES.[MESSAGE_TYPE_NAME]:
  return handle[FeatureName](payload);
```

Handler signature:
```js
async function handle[FeatureName](payload) {
  // 1. Check tier access (if gated)
  // 2. Validate payload
  // 3. Perform operation
  // 4. Return result
}
```

### UI Components

| Component | Location | Description |
|-----------|----------|-------------|
| [Component 1] | sidepanel/index.html | [What it does] |
| [Component 2] | sidepanel/styles.css | [Styling needed] |

### API Integration (if applicable)

- Provider: [Gemini / OpenAI / etc.]
- Endpoint: [API endpoint]
- Rate limits: [Any limits to consider]
- PPI handling: [What data needs redaction]

---

## UI/UX Specification

### Entry Point

[How does the user access this feature? Button, menu item, automatic?]

### Flow

1. User [action]
2. System [response]
3. User sees [result]
4. [Continue flow...]

### States

| State | UI Behavior |
|-------|-------------|
| Loading | [Show spinner / skeleton / etc.] |
| Success | [Show result / toast / etc.] |
| Error | [Show error message / retry option] |
| Tier Locked | [Show upgrade prompt] |

### Empty State

- Icon: [SVG description]
- Headline: "[Empty state headline]"
- Subtext: "[Helpful guidance text]"

---

## Upgrade Prompt (if tier-gated)

```js
{
  featureName: '[Display Name]',
  featureDescription: '[What user gets with upgrade]',
  requiredTier: '[tier]',
  price: '$[X.XX]'
}
```

---

## Testing Checklist

- [ ] Feature works when tier requirement is met
- [ ] Upgrade prompt shows when tier requirement is NOT met
- [ ] Loading state displays correctly
- [ ] Success state displays correctly
- [ ] Error handling works (network error, invalid data, etc.)
- [ ] Empty state displays when applicable
- [ ] Responsive at different panel widths
- [ ] Keyboard accessible
- [ ] No console errors

---

## Implementation Order

1. [ ] Add constants (MESSAGE_TYPE, FEATURE_TIER)
2. [ ] Add service worker handler
3. [ ] Add UI components (HTML)
4. [ ] Add styles (CSS)
5. [ ] Wire up JS event handlers
6. [ ] Add tier gating check
7. [ ] Test all states
8. [ ] Disable debug logging

---

## Notes

[Any additional context, edge cases, or considerations]
