# /lib/ Core Modules — Platform-Agnostic

**Version:** 1.0  
**Scope:** Every 864zeros product — extensions, web apps, mobile, SaaS  
**Rule:** Never modify per-project. If you need project-specific logic, wrap these modules.

---

## Modules

```
lib/
├── api-client.js    # AI provider abstraction
├── redactor.js      # PPI stripping before AI calls
├── tiers.js         # Payment tier verification + feature gating
└── constants.js     # App identity, keys, tier definitions
```

---

## api-client.js — AI Provider Abstraction

The extension/app calls `analyze()`. It never calls a specific provider directly. The active provider is set in `constants.js` and can be swapped without touching product code.

### Exports

```javascript
export function configure({ provider, apiKey, model, options })
// Set the active provider. Called once on init.
// provider: 'gemini' | 'claude'
// options: { maxTokens, temperature, systemPrompt }

export async function analyze(content, instruction)
// Send content + instruction to active AI provider.
// Content is auto-redacted via redactor.js before sending.
// Returns: { success: boolean, result: string, usage: { tokens } }

export async function analyzeImage(base64Image, instruction)
// Vision analysis. Returns: { success: boolean, result: string | object }

export async function summarize(contentArray, options?)
// Combine multiple content items and summarize.
// options: { format: 'keypoints' | 'narrative' | 'json', maxLength }

export function getProviderInfo()
// Returns: { provider, model, sessionUsage }
```

### Internal Flow

```
Product calls analyze(content, instruction)
  → redactor.redact(content) strips PPI
  → Format request for active provider's API shape
  → fetch() to provider endpoint
  → Normalize response to standard { success, result, usage }
  → Return to product
```

### Provider API Shapes

**Gemini:**
```javascript
// POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
{
  contents: [{ parts: [{ text: redactedContent + '\n\n' + instruction }] }],
  generationConfig: { maxOutputTokens, temperature }
}
```

**Claude:**
```javascript
// POST https://api.anthropic.com/v1/messages
{
  model: model,
  max_tokens: maxTokens,
  messages: [{ role: 'user', content: redactedContent + '\n\n' + instruction }]
}
```

### Error Handling

All API calls wrapped in try/catch. On failure:
- Network error → `{ success: false, error: 'offline' }`
- Rate limit → `{ success: false, error: 'rate_limited' }`
- Auth error → `{ success: false, error: 'auth_failed' }`
- Unknown → `{ success: false, error: 'unknown', message: error.message }`

Product code checks `success` and displays appropriate user-facing message.

---

## redactor.js — PPI Redaction

Strips personally identifiable information before any AI API call. This module runs automatically inside `api-client.js`. Products don't call it directly unless redacting for display.

### Exports

```javascript
export function redact(text)
// Returns: { redactedText, redactions: [{ type, original, replacement, index }] }

export function restore(text, redactions)
// Re-inserts original values using the redaction map.
```

### Patterns Detected

| Type | Pattern | Replacement |
|------|---------|-------------|
| Email | `*@*.*` | `[EMAIL_REDACTED]` |
| Phone | US/international formats | `[PHONE_REDACTED]` |
| SSN | `###-##-####` | `[SSN_REDACTED]` |
| Credit Card | 13-19 digit sequences | `[CC_REDACTED]` |
| IP Address | IPv4 dotted quad | `[IP_REDACTED]` |
| Street Address | Heuristic (number + street words) | `[ADDRESS_REDACTED]` |

### Implementation Notes

- Regex-based detection with low false-positive tuning
- Processes in < 10ms for typical content (< 10KB)
- Redaction map stored in memory only — never persisted
- If user enables "redact names" in settings, basic NER applies (capitalized word sequences)

---

## tiers.js — Payment Tier Verification

Manages feature gating based on the user's purchased tier. Works with Stripe/ExtensionPay on the payment side.

### Exports

```javascript
export async function getTier()
// Returns: 'free' | 'starter' | 'pro' | 'power'
// Reads from platform-appropriate storage (chrome.storage, localStorage, etc)

export async function setTier(tier)
// Called by payment callback on successful purchase.

export function requiresTier(minimumTier)
// Returns boolean. Compares current tier level against minimum.
// Tier levels: free=0, starter=1, pro=2, power=3

export function getFeatureAccess(featureName)
// Checks FEATURE_TIERS map from constants.js.
// Returns boolean — is this feature available at current tier?

export async function openCheckout(tier)
// Launch Stripe/ExtensionPay checkout for the specified tier.
// Platform-specific implementation (extension vs web).
```

### Tier Comparison Logic

```javascript
const TIER_LEVELS = { free: 0, starter: 1, pro: 2, power: 3 };

function requiresTier(minimum) {
  const current = await getTier();
  return TIER_LEVELS[current] >= TIER_LEVELS[minimum];
}
```

### Upgrade Prompt Pattern

When a gated feature is triggered by a free/lower-tier user:
- Show an OIA-styled card explaining what the feature does
- Single upgrade button
- Copy: "Unlock [feature] with [tier]" — never "You need to pay" or "Upgrade required"
- Dismiss option always available

---

## constants.js — App Configuration

Every product sets these values. They're the identity of the app.

### Exports

```javascript
export const APP_SLUG = '__APP_SLUG__';       // Set per project
export const APP_NAME = '__APP_NAME__';       // Display name
export const APP_BRAND = '864zeros';          // '864zeros' | 'OIA'

export const STORAGE_KEYS = {
  settings: `${APP_SLUG}_settings`,
  tier: `${APP_SLUG}_tier`,
  lastSync: `${APP_SLUG}_last_sync`,
  initialized: `${APP_SLUG}_initialized`
};

export const MESSAGE_TYPES = {
  // Base types — extend per product
  TIER_CHANGED: 'TIER_CHANGED'
};

export const TIERS = {
  free:    { level: 0, price: 0 },
  starter: { level: 1, price: 1.99 },   // Prices set per product
  pro:     { level: 2, price: 3.99 },
  power:   { level: 3, price: 5.99 }
};

export const FEATURE_TIERS = {
  // Defined per product in the app brief
  // 'feature-name': 'tier-name'
};

export const AI_CONFIG = {
  provider: '__DEFAULT_PROVIDER__',      // 'gemini' | 'claude'
  model: '__DEFAULT_MODEL__',
  maxTokens: 1000,
  temperature: 0.7
};
```

---

## Integration Checklist (All Platforms)

When starting any new 864zeros product:

- [ ] Set `APP_SLUG`, `APP_NAME`, `APP_BRAND` in `constants.js`
- [ ] Define `FEATURE_TIERS` per the app brief
- [ ] Set `AI_CONFIG` defaults
- [ ] Wrap all AI calls through `api-client.js` (never call providers directly)
- [ ] Gate paid features with `tiers.js` checks
- [ ] Verify redactor catches PPI in test content before shipping
