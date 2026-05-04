# Payment Brick — 864zeros

Reusable payment system for all 864zeros extensions using ExtensionPay + Stripe.

**Naming convention**: ExtensionPay extension IDs use `{app-slug}-864z` format.

---

## Quick Start

### 1. Install ExtPay

```bash
npm install extpay --save
```

### 2. Copy Files

```bash
# Copy the OFFICIAL ExtPay.js (not a custom version!)
cp node_modules/extpay/sample-extension-mv3/ExtPay.js your-extension/lib/payments/

# Copy payment brick files
cp templates/payments/extpay-wrapper.js your-extension/lib/payments/
cp templates/payments/tiers.js your-extension/lib/payments/
cp templates/payments/credits.js your-extension/lib/payments/
cp templates/config/pricing.js your-extension/config/
```

### 3. Add ES Module Export to ExtPay.js

Add this line to the END of `lib/payments/ExtPay.js`:

```javascript
export default ExtPay;
```

### 3. Configure `config/pricing.js`

```javascript
export const PRICING_CONFIG = {
  appSlug: 'your-app',
  extpayId: 'your-app-864z',  // From extensionpay.com

  tiers: {
    free:    { level: 0, price: 0,    planId: null },
    starter: { level: 1, price: 1.99, planId: 'starter-monthly' },
    pro:     { level: 2, price: 3.99, planId: 'pro-monthly' },
    power:   { level: 3, price: 5.99, planId: 'power-monthly' }
  },

  features: {
    'your-free-feature': 'free',
    'your-paid-feature': 'starter',
    'your-pro-feature': 'pro',
    'your-power-feature': 'power'
  },

  credits: {
    enabled: true,  // or false if no AI
    initialFree: 10,
    costs: { 'ai-feature': 2 },
    packs: [...]
  }
};
```

### 5. Generate Fixed Extension Key

Chrome assigns random IDs to unpacked extensions. For consistent testing:

```bash
# 1. Pack extension to generate .pem file
# Go to chrome://extensions → Pack extension → Select folder → Pack
# This creates {extension}.pem in parent folder

# 2. Convert .pem to manifest key
node -e "const crypto = require('crypto'); const fs = require('fs'); const pem = fs.readFileSync('extension.pem', 'utf8'); const key = crypto.createPublicKey(pem); console.log(key.export({type: 'spki', format: 'der'}).toString('base64'));"
```

### 6. Update `manifest.json`

```json
{
  "key": "MIIBIjANBgkqh...[your generated key]...",
  "permissions": ["storage"],
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "content_scripts": [{
    "matches": ["https://extensionpay.com/*"],
    "js": ["lib/payments/ExtPay.js"],
    "run_at": "document_start"
  }]
}
```

### 7. Initialize in Service Worker

```javascript
import { initPayments } from './lib/payments/extpay-wrapper.js';
import { initCredits } from './lib/payments/credits.js';

// Initialize at TOP LEVEL (required for MV3)
initPayments();

// On install - initialize credits
chrome.runtime.onInstalled.addListener(() => {
  initCredits();
});
```

### 8. Initialize in Options Page (and other contexts)

Each context needs to initialize ExtPay:

```javascript
import { initPayments, openUpgrade } from './lib/payments/extpay-wrapper.js';

// Initialize for this context
initPayments();
```

### 6. Gate Features

```javascript
import { canAccessFeature } from './lib/payments/tiers.js';
import { canAfford, deduct } from './lib/payments/credits.js';

async function handleAISummary() {
  // Check tier
  if (!await canAccessFeature('ai-summary')) {
    return { error: 'upgrade', tier: 'starter' };
  }

  // Check credits
  if (!await canAfford('ai-summary')) {
    return { error: 'credits' };
  }

  // Do the work
  const result = await generateSummary();

  // Deduct credits on success
  await deduct('ai-summary');

  return result;
}
```

### 7. Trigger Upgrade

```javascript
import { openUpgrade } from './lib/payments/extpay-wrapper.js';

// When user clicks "Upgrade"
upgradeButton.addEventListener('click', () => {
  openUpgrade('pro');  // or openUpgrade() for all options
});
```

---

## Files

```
lib/payments/
├── extpay-wrapper.js   # ExtensionPay integration
├── tiers.js            # Feature gating by tier
├── credits.js          # Usage-based credit system
└── ExtPay.js           # ExtPay library (npm install or copy)

config/
└── pricing.js          # YOUR CONFIGURATION (customize this)
```

---

## API Reference

### extpay-wrapper.js

| Function | Description |
|----------|-------------|
| `initPayments()` | Initialize ExtPay. Call once in service worker. |
| `getUser()` | Get ExtPay user object (cached). |
| `getCurrentTier()` | Get tier name: 'free' \| 'starter' \| 'pro' \| 'power' |
| `isPaid()` | Check if user has any paid plan. |
| `openUpgrade(tier?)` | Open payment page, optionally for specific tier. |
| `openLogin()` | Open login page for returning users. |
| `openTrial(text?)` | Start free trial flow. |
| `onPaid(callback)` | Register callback for payment events. |

### tiers.js

| Function | Description |
|----------|-------------|
| `canAccessFeature(name)` | Check if current tier can use feature. |
| `requiresTier(tier)` | Check if current tier >= specified tier. |
| `getFeatureTier(name)` | Get minimum tier for a feature. |
| `getFeaturesForTier(tier)` | Get all features available at tier. |
| `getUnlockedFeatures(from, to)` | Get features unlocked by upgrading. |
| `getTierPrice(tier)` | Get price for a tier. |
| `getNextTier(current)` | Get next tier up. |

### credits.js

| Function | Description |
|----------|-------------|
| `initCredits()` | Initialize credits on install. |
| `getBalance()` | Get current credit balance. |
| `getCost(feature)` | Get credit cost for a feature. |
| `canAfford(feature)` | Check if user can afford feature. |
| `deduct(feature, note?)` | Deduct credits for usage. |
| `addCredits(amount, source)` | Add credits (after purchase). |
| `getHistory(limit?)` | Get credit transaction history. |
| `getCreditPacks()` | Get available packs for purchase. |

---

## Standard Tier Structure

All 864zeros extensions use the same tier hierarchy:

| Tier | Level | Typical Price | Purpose |
|------|-------|---------------|---------|
| **Free** | 0 | $0 | Core functionality, build user base |
| **Starter** | 1 | $1.99/mo | "Worth paying for" — first upgrade |
| **Pro** | 2 | $3.99/mo | Full features, cloud sync, bulk ops |
| **Power** | 3 | $5.99/mo | Everything + advanced AI, synthesis |

---

## ExtensionPay Setup

### 1. Create Account
Go to [extensionpay.com](https://extensionpay.com) and sign up.

### 2. Register Extension
- Enter extension name
- Set pricing (matches your `pricing.js`)
- Get your `extension-id`

### 3. Create Plans
In ExtensionPay dashboard, create plans matching your `planId` values:
- `starter-monthly` — $1.99/month
- `pro-monthly` — $3.99/month
- `power-monthly` — $5.99/month

### 4. Connect Stripe
Link your 864zeros Stripe account to receive payments.

---

## Testing

ExtensionPay has test mode for local development:

1. Load unpacked extension in Chrome
2. Click **Upgrade** button
3. Select a plan
4. Enter your **ExtensionPay developer password** (your account password)
5. Payment simulates without real charge
6. Extension detects paid status

**Test cards** (for live Stripe testing):
| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |

Test mode requires developer password to prevent abuse. Published extensions don't require it.

---

## Credit Packs

If your app uses AI, credit packs provide additional revenue:

```javascript
credits: {
  packs: [
    { id: 'pack-20', credits: 20, price: 1.99 },
    { id: 'pack-50', credits: 50, price: 3.99, popular: true },
    { id: 'pack-100', credits: 100, price: 6.99 }
  ]
}
```

Credit purchases go through ExtensionPay as one-time payments.

---

## Troubleshooting

### "500 from api_key endpoint" or "Not found"

**Cause**: Using custom ExtPay.js with wrong API endpoint.

**Fix**: Use official ExtPay.js from `node_modules/extpay/sample-extension-mv3/ExtPay.js`

### "API key required"

**Cause**: ExtensionPay doesn't recognize Chrome extension ID.

**Fix**: Generate fixed key from .pem file, add to manifest.json, reload extension.

### "[payments] Call initPayments() first"

**Cause**: Each context needs its own `initPayments()` call.

**Fix**: Add `initPayments()` at top of service worker AND options page.

### DEV_MODE bypass

For development without ExtensionPay, set in `extpay-wrapper.js`:

```javascript
const DEV_MODE = true;  // Unlocks all features, shows alerts instead of payments
```

---

## Checklist

Before shipping:

- [ ] ExtensionPay account created
- [ ] Extension registered as `{app-slug}-864z`
- [ ] Stripe account connected and activated
- [ ] Plans created: `starter-monthly`, `pro-monthly`, `power-monthly`, `coffee`
- [ ] Official ExtPay.js copied from npm package
- [ ] `export default ExtPay;` added to ExtPay.js
- [ ] Fixed key generated and added to manifest.json
- [ ] `pricing.js` configured with your features
- [ ] Manifest has `storage` permission
- [ ] Manifest has ExtensionPay content script
- [ ] `initPayments()` called in service worker (top level)
- [ ] `initPayments()` called in options page
- [ ] `initCredits()` called on install (if using credits)
- [ ] DEV_MODE set to `false`
- [ ] Test payment flow with developer password
- [ ] Feature gates working (tested each tier)
- [ ] Upgrade and donation buttons work

---

## Fees

| Service | Fee |
|---------|-----|
| ExtensionPay | 5% per transaction |
| Stripe | ~2.9% + $0.30 |
| **Total** | ~8% per transaction |

No monthly fees. No backend costs.

---

*Template version: 1.0.0*
