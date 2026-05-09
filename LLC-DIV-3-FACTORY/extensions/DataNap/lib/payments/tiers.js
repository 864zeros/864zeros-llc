/**
 * Tiers — TabVault Payment System
 *
 * Feature gating based on user's purchased tier.
 */

import { PRICING_CONFIG } from '../../config/pricing.js';
import { getCurrentTier } from './extpay-wrapper.js';

// Standard tier hierarchy
const TIER_LEVELS = {
  free: 0,
  starter: 1,
  pro: 2,
  power: 3
};

/**
 * Check if current tier meets minimum requirement.
 * @param {string} minimumTier - Required tier name
 * @returns {Promise<boolean>}
 */
export async function requiresTier(minimumTier) {
  const currentTier = await getCurrentTier();
  const currentLevel = TIER_LEVELS[currentTier] ?? 0;
  const requiredLevel = TIER_LEVELS[minimumTier] ?? 0;
  return currentLevel >= requiredLevel;
}

/**
 * Check if a specific feature is available at current tier.
 * @param {string} featureName - Feature key from pricing.js
 * @returns {Promise<boolean>}
 */
export async function canAccessFeature(featureName) {
  const requiredTier = PRICING_CONFIG.features[featureName];

  if (!requiredTier) {
    console.warn(`[tiers] Unknown feature: ${featureName}`);
    return false;
  }

  return requiresTier(requiredTier);
}

/**
 * Get the tier required for a feature.
 * @param {string} featureName - Feature key
 * @returns {string} Tier name
 */
export function getFeatureTier(featureName) {
  return PRICING_CONFIG.features[featureName] ?? 'pro';
}

/**
 * Get all features available at a specific tier.
 * @param {string} tier - Tier name
 * @returns {string[]} Array of feature names
 */
export function getFeaturesForTier(tier) {
  const tierLevel = TIER_LEVELS[tier] ?? 0;

  return Object.entries(PRICING_CONFIG.features)
    .filter(([_, requiredTier]) => TIER_LEVELS[requiredTier] <= tierLevel)
    .map(([featureName]) => featureName);
}

/**
 * Get tier configuration.
 * @param {string} tier - Tier name
 * @returns {object} { level, price, planId }
 */
export function getTierConfig(tier) {
  return PRICING_CONFIG.tiers[tier] ?? PRICING_CONFIG.tiers.free;
}

/**
 * Get price for a tier.
 * @param {string} tier - Tier name
 * @returns {number} Price in dollars
 */
export function getTierPrice(tier) {
  return PRICING_CONFIG.tiers[tier]?.price ?? 0;
}

/**
 * Get all tiers with their configs.
 * @returns {object}
 */
export function getAllTiers() {
  return { ...PRICING_CONFIG.tiers };
}

/**
 * Get tier level (0-3).
 * @param {string} tier - Tier name
 * @returns {number}
 */
export function getTierLevel(tier) {
  return TIER_LEVELS[tier] ?? 0;
}

/**
 * Get the next tier up from current.
 * @param {string} currentTier
 * @returns {string|null} Next tier or null if at max
 */
export function getNextTier(currentTier) {
  const tierOrder = ['free', 'pro'];  // TabVault only has 2 tiers
  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex === -1 || currentIndex >= tierOrder.length - 1) {
    return null;
  }

  return tierOrder[currentIndex + 1];
}
