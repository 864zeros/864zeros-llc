/**
 * TIERS.JS — Backward Compatibility Re-export
 *
 * This file re-exports from the new payment brick location.
 * New code should import from '../lib/payments/tiers.js' directly.
 */

// Re-export everything from the new location
export {
  requiresTier,
  canAccessFeature,
  canAccessFeature as getFeatureAccess, // Legacy alias
  getFeatureTier,
  getFeaturesForTier,
  getUnlockedFeatures,
  getTierConfig,
  getTierConfig as getTierInfo, // Legacy alias
  getTierPrice,
  getAllTiers,
  getTierLevel,
  getNextTier
} from './payments/tiers.js';

export { getCurrentTier as getTier } from './payments/extpay-wrapper.js';

// Legacy setTier - now handled by ExtensionPay
// Keeping for test compatibility
export async function setTier(tier) {
  console.warn('[tiers] setTier is deprecated. Tier is now managed by ExtensionPay.');
  // No-op - tier is managed by ExtensionPay now
}
