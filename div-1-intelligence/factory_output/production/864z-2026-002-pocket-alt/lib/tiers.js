// tiers.js - Tier System [BRK-OPT-003: Tiered_Unlock]
// 864zeros Build Kit - Pay-Once Unlock System
//
// FREE TIER (Default):
// - Unlimited offline article storage
// - Full Pocket import
// - Export to JSON/HTML/CSV/Markdown
// - All core features
//
// PAID TIER (Optional - $9 one-time):
// - Cloud sync across devices
// - Advanced search filters
// - Priority support
// - Future premium features
//
// PHILOSOPHY: Core functionality is always free and offline-first.
// Payment unlocks convenience features, never gates essential use.

import { getState, setState } from './store.js';

// ===== TIER DEFINITIONS =====

export const TIERS = {
  FREE: 'free',
  PAID: 'paid'
};

export const TIER_FEATURES = {
  [TIERS.FREE]: {
    name: 'Free',
    description: 'Full offline functionality',
    features: [
      'Unlimited article storage',
      'Pocket import',
      'Export (JSON, HTML, CSV, MD)',
      'Context menu saving',
      'Keyboard shortcuts',
      'Full-text search',
      'Tags & favorites'
    ],
    limits: {
      articles: Infinity,
      exports: Infinity,
      imports: Infinity
    }
  },
  [TIERS.PAID]: {
    name: 'Pro',
    price: 9,
    description: 'Cloud sync & premium features',
    features: [
      'Everything in Free',
      'Cloud sync across devices',
      'Advanced search filters',
      'Reading statistics',
      'Priority support',
      'Early access to new features'
    ],
    limits: {
      articles: Infinity,
      exports: Infinity,
      imports: Infinity,
      syncDevices: 5
    }
  }
};

// ===== TIER MANAGEMENT =====

/**
 * Get current user tier.
 */
export async function getCurrentTier() {
  const tier = await getState('tier');
  return tier || TIERS.FREE;
}

/**
 * Check if user has paid tier.
 */
export async function isPaidTier() {
  const tier = await getCurrentTier();
  return tier === TIERS.PAID;
}

/**
 * Check if a specific feature is available.
 */
export async function hasFeature(featureName) {
  const tier = await getCurrentTier();

  // All features available in free tier for core functionality
  const freeFeatures = [
    'storage',
    'import',
    'export',
    'search',
    'tags',
    'favorites',
    'keyboard_shortcuts'
  ];

  if (freeFeatures.includes(featureName)) {
    return true;
  }

  // Premium features require paid tier
  const paidFeatures = [
    'cloud_sync',
    'advanced_search',
    'statistics',
    'priority_support'
  ];

  if (paidFeatures.includes(featureName)) {
    return tier === TIERS.PAID;
  }

  // Default to available
  return true;
}

/**
 * Upgrade to paid tier.
 * In production, this would verify payment.
 */
export async function upgradeToPaid(licenseKey) {
  // Validate license key format
  if (!isValidLicenseKey(licenseKey)) {
    throw new Error('Invalid license key format');
  }

  // In production: Verify license with server
  // For now: Just check format and store
  const verified = await verifyLicense(licenseKey);

  if (verified) {
    await setState('tier', TIERS.PAID);
    await setState('licenseKey', licenseKey);
    await setState('upgradeDate', new Date().toISOString());

    console.log('[tiers.js] Upgraded to paid tier');
    return true;
  }

  return false;
}

/**
 * Downgrade to free tier (for testing/admin).
 */
export async function downgradeToFree() {
  await setState('tier', TIERS.FREE);
  await setState('licenseKey', null);

  console.log('[tiers.js] Downgraded to free tier');
}

// ===== LICENSE VALIDATION =====

/**
 * Check license key format.
 * Format: RV-XXXX-XXXX-XXXX-XXXX
 */
function isValidLicenseKey(key) {
  if (!key || typeof key !== 'string') return false;

  const pattern = /^RV-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(key.toUpperCase());
}

/**
 * Verify license key.
 * In production: This would call a verification endpoint.
 * For offline-first: We can use cryptographic verification.
 */
async function verifyLicense(key) {
  // PLACEHOLDER: In production, implement proper verification
  // Options:
  // 1. Server verification (requires network)
  // 2. Cryptographic signature verification (offline-capable)
  // 3. Gumroad/LemonSqueezy webhook integration

  // For now: Accept any valid format for testing
  return isValidLicenseKey(key);
}

/**
 * Get tier information for UI display.
 */
export async function getTierInfo() {
  const tier = await getCurrentTier();
  const upgradeDate = await getState('upgradeDate');

  return {
    tier,
    tierInfo: TIER_FEATURES[tier],
    isPaid: tier === TIERS.PAID,
    upgradeDate
  };
}
