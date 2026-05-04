/**
 * Pricing Configuration — 864zeros
 *
 * CUSTOMIZE THIS FILE FOR EACH EXTENSION.
 *
 * This is the ONLY file you edit to configure payments.
 * The payment brick (lib/payments/) reads from this file.
 *
 * Steps:
 *   1. Register your extension at extensionpay.com
 *   2. Set extpayId to your registered extension ID
 *   3. Define features and which tier unlocks each
 *   4. Configure credit costs if using AI features
 */

export const PRICING_CONFIG = {
  // ============================================================
  // IDENTITY
  // ============================================================

  // Your extension's slug (used for storage keys)
  appSlug: '__APP_SLUG__',

  // ExtensionPay extension ID (from extensionpay.com dashboard)
  // Convention: always use {app-slug}-864z suffix
  extpayId: '__APP_SLUG__-864z',

  // ============================================================
  // TIERS
  // ============================================================
  // Standard 864zeros tier structure. Prices can vary per app.
  // planId must match what you create in ExtensionPay dashboard.

  tiers: {
    free: {
      level: 0,
      price: 0,
      planId: null,
      label: 'Free',
      description: 'Basic features, no payment required'
    },
    starter: {
      level: 1,
      price: 1.99,
      planId: 'starter-monthly',
      label: 'Starter',
      description: 'Essential paid features'
    },
    pro: {
      level: 2,
      price: 3.99,
      planId: 'pro-monthly',
      label: 'Pro',
      description: 'Full feature access'
    },
    power: {
      level: 3,
      price: 5.99,
      planId: 'power-monthly',
      label: 'Power',
      description: 'Everything + advanced AI'
    }
  },

  // ============================================================
  // DONATIONS (FUEL THE BUILD)
  // ============================================================
  // One-time payments for supporters. Every extension gets this.
  // planId must match ExtensionPay "Once-Lifetime" plan.

  donations: {
    coffee: {
      price: 3.00,
      planId: 'coffee',
      label: 'Buy us a coffee'
    }
  },

  // ============================================================
  // FEATURES
  // ============================================================
  // Map each feature to the minimum tier required.
  // CUSTOMIZE THIS FOR YOUR EXTENSION.

  features: {
    // ----- FREE TIER -----
    // Core functionality that everyone gets
    'example-free-feature': 'free',
    'basic-search': 'free',
    'local-export': 'free',

    // ----- STARTER TIER -----
    // First paid tier — "worth paying for"
    'example-starter-feature': 'starter',
    'ai-basic': 'starter',

    // ----- PRO TIER -----
    // Power users — sync, advanced AI, bulk ops
    'example-pro-feature': 'pro',
    'cloud-sync': 'pro',
    'ai-advanced': 'pro',
    'bulk-operations': 'pro',

    // ----- POWER TIER -----
    // Highest tier — InsightForge, unlimited AI
    'example-power-feature': 'power',
    'ai-synthesis': 'power',
    'unlimited-ai': 'power'
  },

  // ============================================================
  // CREDITS (OPTIONAL)
  // ============================================================
  // Usage-based system for AI features.
  // Set enabled: false if your app doesn't use credits.

  credits: {
    enabled: true,

    // Free credits on install
    initialFree: 10,

    // Cost per feature (in credits)
    costs: {
      'ai-basic': 1,
      'ai-advanced': 2,
      'ai-synthesis': 5
    },

    // Credit packs for purchase
    packs: [
      {
        id: 'pack-20',
        credits: 20,
        price: 1.99,
        label: '20 credits'
      },
      {
        id: 'pack-50',
        credits: 50,
        price: 3.99,
        label: '50 credits',
        popular: true  // Highlighted in UI
      },
      {
        id: 'pack-100',
        credits: 100,
        price: 6.99,
        label: '100 credits'
      }
    ]
  },

  // ============================================================
  // UI STRINGS
  // ============================================================
  // Customize upgrade prompts per extension.

  ui: {
    upgradeTitle: 'Upgrade Your Plan',
    upgradeSubtitle: 'Unlock more features',
    freeTrialDays: 7,
    freeTrialEnabled: false
  }
};


// ============================================================
// EXAMPLE: ClipBoard Configuration
// ============================================================
// Uncomment and modify for ClipBoard:
/*
export const PRICING_CONFIG = {
  appSlug: 'clipboard',
  extpayId: 'clipboard-864z',

  tiers: {
    free:    { level: 0, price: 0,    planId: null,              label: 'Free' },
    starter: { level: 1, price: 1.99, planId: 'starter-monthly', label: 'Starter' },
    pro:     { level: 2, price: 3.99, planId: 'pro-monthly',     label: 'Pro' },
    power:   { level: 3, price: 5.99, planId: 'power-monthly',   label: 'Power' }
  },

  features: {
    // Free
    'text-capture': 'free',
    'page-capture': 'free',
    'tag-management': 'free',
    'search': 'free',
    'local-export': 'free',

    // Starter
    'screenshot-capture': 'starter',
    'pdf-capture': 'starter',
    'ai-summary': 'starter',

    // Pro
    'ai-auto-tag': 'pro',
    'marquee-capture': 'pro',
    'ai-vision': 'pro',
    'bulk-operations': 'pro',
    'google-drive-sync': 'pro',

    // Power
    'synthesize-clips': 'power',
    'ask-clips': 'power',
    'research-report': 'power'
  },

  credits: {
    enabled: true,
    initialFree: 10,
    costs: {
      'ai-summary': 1,
      'ai-auto-tag': 1,
      'ai-vision': 2,
      'quick-summary': 3,
      'research-dossier': 5
    },
    packs: [
      { id: 'pack-20', credits: 20, price: 1.99, label: '20 credits' },
      { id: 'pack-50', credits: 50, price: 3.99, label: '50 credits', popular: true },
      { id: 'pack-100', credits: 100, price: 6.99, label: '100 credits' }
    ]
  }
};
*/
