# Payment Setup Guide — 864zeros Extensions

Complete instructions for setting up ExtensionPay + Stripe payments.

---

## Overview

864zeros extensions use **ExtensionPay** (which wraps **Stripe**) for payments:
- **Subscription tiers**: Starter ($1.99/mo), Pro ($3.99/mo), Power ($5.99/mo)
- **One-time donation**: Buy us a coffee ($3.00)
- **Credit packs**: 20/50/100 credits for AI features

**Naming convention**: ExtensionPay extension IDs use `{app-slug}-864z` format.

---

## Step 1: Stripe Account Setup

### 1.1 Create/Access Stripe Account

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Sign in with **864zeros@gmail.com** (or create account)
3. Complete business verification (requires business website/social profile)

### 1.2 Activate Live Mode

1. Complete Stripe's activation checklist
2. Provide business details, website, and bank account
3. Once activated, you can process real payments

### 1.3 Enable Customer Portal

1. Go to **Settings** → **Billing** → **Customer portal**
2. Click **Activate link**
3. Configure portal features:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to view invoice history
4. Click **Save**

---

## Step 2: ExtensionPay Setup

### 2.1 Register Extension

1. Go to [extensionpay.com](https://extensionpay.com)
2. Create account or sign in
3. Click **Register Extension**
4. Enter:
   - **Extension Name**: Your app name (e.g., `ClipBoard`)
   - **Extension ID**: `{app-slug}-864z` (e.g., `clipboard-864z`)
5. Submit

### 2.2 Connect Stripe

1. In ExtensionPay dashboard, click **Connect Stripe**
2. Authorize ExtensionPay to access your Stripe account
3. Complete OAuth flow
4. Verify connection shows "Connected"

### 2.3 Create Payment Plans

Click **Edit extension name or plans** and add:

| Plan ID | Price | Billing |
|---------|-------|---------|
| `starter-monthly` | $1.99 | Monthly |
| `pro-monthly` | $3.99 | Monthly |
| `power-monthly` | $5.99 | Monthly |
| `coffee` | $3.00 | Once-Lifetime |

Click **Save All Changes**.

---

## Step 3: Extension Configuration

### 3.1 Install ExtPay Package

```bash
npm install extpay
```

### 3.2 Copy Official ExtPay.js

**IMPORTANT**: Use the official ExtPay.js, not a custom version.

```bash
cp node_modules/extpay/sample-extension-mv3/ExtPay.js lib/payments/ExtPay.js
```

Then add ES module export to the end of `lib/payments/ExtPay.js`:

```javascript
export default ExtPay;
```

### 3.3 Generate Fixed Extension Key

Chrome assigns random IDs to unpacked extensions. To get a consistent ID:

1. Go to `chrome://extensions`
2. Click **Pack extension**
3. Select your extension folder
4. Leave private key blank → Click **Pack Extension**
5. This creates `{extension-name}.pem` in the parent folder

Convert the .pem to a manifest key:

```bash
node -e "const crypto = require('crypto'); const fs = require('fs'); const pem = fs.readFileSync('path/to/extension.pem', 'utf8'); const key = crypto.createPublicKey(pem); const der = key.export({type: 'spki', format: 'der'}); console.log(der.toString('base64'));"
```

Add the output to `manifest.json`:

```json
{
  "manifest_version": 3,
  "key": "MIIBIjANBgkqh...[your key here]...",
  "name": "Your Extension"
}
```

### 3.4 Configure manifest.json

```json
{
  "permissions": [
    "storage"
  ],
  "content_scripts": [
    {
      "matches": ["https://extensionpay.com/*"],
      "js": ["lib/payments/ExtPay.js"],
      "run_at": "document_start"
    }
  ]
}
```

### 3.5 Configure pricing.js

```javascript
export const PRICING_CONFIG = {
  appSlug: 'clipboard',
  extpayId: 'clipboard-864z',  // Must match ExtensionPay extension ID

  tiers: {
    free:    { level: 0, price: 0,    planId: null },
    starter: { level: 1, price: 1.99, planId: 'starter-monthly' },
    pro:     { level: 2, price: 3.99, planId: 'pro-monthly' },
    power:   { level: 3, price: 5.99, planId: 'power-monthly' }
  },

  donations: {
    coffee: { price: 3.00, planId: 'coffee' }
  }
};
```

### 3.6 Initialize in Service Worker

```javascript
import { initPayments } from '../lib/payments/extpay-wrapper.js';

// Initialize at top level
initPayments();
```

### 3.7 Initialize in Options Page

```javascript
import { initPayments, openUpgrade, openDonation } from '../lib/payments/extpay-wrapper.js';

// Initialize for this context
initPayments();
```

---

## Step 4: Testing

### 4.1 Load Extension

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select your extension folder
4. Note the extension ID (should be consistent due to the key)

### 4.2 Test Payment Flow

1. Open extension options page
2. Click **Upgrade** button
3. Select a plan
4. Enter your **ExtensionPay developer password** (test mode security)
5. Payment simulates without real charge
6. Extension detects paid status

### 4.3 Test Cards (Live Mode)

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0000 0000 3220` | 3D Secure required |

---

## Step 5: Going Live

1. Publish extension to Chrome Web Store
2. Users pay through Stripe (no password prompt)
3. Monitor payments in Stripe Dashboard

---

## Troubleshooting

### "500 from api_key endpoint" or "Not found"

**Cause**: Using custom ExtPay.js with wrong API endpoint.

**Fix**: Use official ExtPay.js from `node_modules/extpay/sample-extension-mv3/ExtPay.js`

### "API key required" when visiting payment page

**Cause**: ExtensionPay doesn't recognize Chrome extension ID.

**Fix**:
1. Generate a fixed key from .pem file
2. Add key to manifest.json
3. Reload extension
4. The Chrome ID will now be consistent

### "[payments] Call initPayments() first"

**Cause**: Each context (service worker, options page) needs to call `initPayments()`.

**Fix**: Add `initPayments()` call at the top of each context that uses payment functions.

### DEV_MODE for Development

If you need to bypass payments during development, set in `extpay-wrapper.js`:

```javascript
const DEV_MODE = true;  // Set to false for production
```

---

## Key Files

| File | Purpose |
|------|---------|
| `config/pricing.js` | Pricing configuration |
| `lib/payments/ExtPay.js` | Official ExtensionPay library |
| `lib/payments/extpay-wrapper.js` | Wrapper with tier logic |
| `lib/payments/tiers.js` | Feature gating |
| `lib/payments/credits.js` | Credit system |

---

## Support

- **ExtensionPay**: [extensionpay.com](https://extensionpay.com)
- **Stripe**: [stripe.com/docs](https://stripe.com/docs)
- **ExtPay GitHub**: [github.com/Glench/ExtPay](https://github.com/Glench/ExtPay)
