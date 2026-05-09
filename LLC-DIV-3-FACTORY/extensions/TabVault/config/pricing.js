/**
 * Pricing Configuration — TabVault
 *
 * Defines tiers, features, and ExtensionPay integration.
 */

export const PRICING_CONFIG = {
  // ============================================================
  // IDENTITY
  // ============================================================

  appSlug: 'tabvault',

  // ExtensionPay extension ID (register at extensionpay.com)
  extpayId: 'tabvault-864z',

  // ============================================================
  // TIERS
  // ============================================================

  tiers: {
    free: {
      level: 0,
      price: 0,
      planId: null,
      label: 'Free',
      description: 'Full vault + Deep Sleep, local only'
    },
    pro: {
      level: 2,
      price: 2.99,
      planId: 'pro-monthly',
      label: 'Pro',
      description: 'Google Drive sync, cross-device access'
    }
  },

  // ============================================================
  // DONATIONS (FUEL THE BUILD)
  // ============================================================

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
    'vault-tabs': 'free',
    'vault-all': 'free',
    'session-groups': 'free',
    'scroll-memory': 'free',
    'deep-sleep': 'free',
    'auto-deep-sleep': 'free',
    'search': 'free',
    'local-export': 'free',
    'local-import': 'free',
    'onetab-import': 'free',

    // ----- PRO TIER -----
    'google-drive-sync': 'pro',
    'cloud-backup': 'pro',
    'cloud-restore': 'pro',
    'auto-sync': 'pro',
    'cross-device': 'pro'
  },

  // ============================================================
  // CREDITS (DISABLED)
  // ============================================================
  // TabVault doesn't use AI credits

  credits: {
    enabled: false,
    initialFree: 0,
    costs: {},
    packs: []
  },

  // ============================================================
  // UI STRINGS
  // ============================================================

  ui: {
    upgradeTitle: 'Upgrade to Pro',
    upgradeSubtitle: 'Sync your vault across all devices',
    freeTrialDays: 7,
    freeTrialEnabled: false
  }
};
