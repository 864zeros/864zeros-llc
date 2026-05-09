/**
 * Pricing Configuration — ClipBoard
 *
 * All tier, feature, and credit configuration in one place.
 * The payment brick reads from this file.
 */

export const PRICING_CONFIG = {
  // ============================================================
  // IDENTITY
  // ============================================================

  appSlug: 'clipboard',
  extpayId: 'clipboard-864z',  // Registered at extensionpay.com

  // ============================================================
  // TIERS
  // ============================================================

  tiers: {
    free: {
      level: 0,
      price: 0,
      planId: null,
      label: 'Free',
      description: 'Text and page capture, tags, search, and local export'
    },
    starter: {
      level: 1,
      price: 1.99,
      planId: 'starter-monthly',
      label: 'Starter',
      description: 'Screenshots, PDF capture, AI summaries'
    },
    pro: {
      level: 2,
      price: 3.99,
      planId: 'pro-monthly',
      label: 'Pro',
      description: 'Marquee capture, AI vision, bulk ops, Google Drive sync'
    },
    power: {
      level: 3,
      price: 5.99,
      planId: 'power-monthly',
      label: 'Power',
      description: 'InsightForge synthesis, research reports, priority features'
    }
  },

  // One-time donations (Fuel the Build)
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

  features: {
    // ----- FREE TIER -----
    'text-capture': 'free',
    'page-capture': 'free',
    'tag-management': 'free',
    'search': 'free',
    'local-export': 'free',
    'local-import': 'free',

    // ----- STARTER TIER -----
    'screenshot-capture': 'starter',
    'pdf-capture': 'starter',
    'ai-summary': 'starter',

    // ----- PRO TIER -----
    'ai-auto-tag': 'pro',
    'marquee-capture': 'pro',
    'ai-vision': 'pro',
    'bulk-operations': 'pro',
    'google-drive-sync': 'pro',

    // ----- POWER TIER -----
    'synthesize-clips': 'power',
    'ask-clips': 'power',
    'research-report': 'power'
  },

  // ============================================================
  // CREDITS
  // ============================================================

  credits: {
    enabled: true,
    initialFree: 10,

    costs: {
      // Starter features
      'ai-summary': 1,

      // Pro features
      'ai-auto-tag': 1,
      'ai-vision': 2,

      // Power features (InsightForge)
      'quick-summary': 3,
      'research-dossier': 5,
      'ask-clips': 2
    },

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
        popular: true
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

  ui: {
    upgradeTitle: 'Upgrade ClipBoard',
    upgradeSubtitle: 'Unlock more capture power',
    freeTrialDays: 0,
    freeTrialEnabled: false
  }
};
