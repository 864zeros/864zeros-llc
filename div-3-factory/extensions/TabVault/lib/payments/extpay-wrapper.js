/**
 * ExtensionPay Wrapper — TabVault
 *
 * Wraps ExtPay.js with our tier system.
 *
 * Setup:
 *   1. Register at extensionpay.com with ID: tabvault-864z
 *   2. Download ExtPay.js and add to extension
 *   3. Call initPayments() in service worker
 */

import { PRICING_CONFIG } from '../../config/pricing.js';

let extpay = null;
let cachedUser = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

// Storage key for tier (fallback when ExtPay not configured)
const TIER_STORAGE_KEY = 'tabvault_user_tier';

/**
 * Initialize ExtensionPay. Call once in service worker.
 * @returns {object|null} ExtPay instance or null if not available
 */
export function initPayments() {
  if (extpay) return extpay;

  // ExtPay must be loaded via importScripts or bundled
  if (typeof ExtPay === 'undefined') {
    console.log('[payments] ExtPay not loaded. Running in free mode.');
    return null;
  }

  try {
    extpay = ExtPay(PRICING_CONFIG.extpayId);
    extpay.startBackground();

    // Listen for payment events
    extpay.onPaid.addListener((user) => {
      cachedUser = user;
      cacheTime = Date.now();
      // Broadcast tier change to all extension contexts
      chrome.runtime.sendMessage({ type: 'TIER_CHANGED', tier: mapUserToTier(user) });
    });

    return extpay;
  } catch (error) {
    console.error('[payments] ExtPay init error:', error);
    return null;
  }
}

/**
 * Get ExtPay user object (cached for performance).
 * @param {boolean} forceRefresh - Bypass cache
 * @returns {Promise<object|null>} User object
 */
export async function getUser(forceRefresh = false) {
  if (!extpay) {
    return null;
  }

  // Return cached if fresh
  if (!forceRefresh && cachedUser && (Date.now() - cacheTime < CACHE_TTL)) {
    return cachedUser;
  }

  try {
    cachedUser = await extpay.getUser();
    cacheTime = Date.now();
    return cachedUser;
  } catch (error) {
    console.error('[payments] getUser error:', error);
    return null;
  }
}

/**
 * Map ExtensionPay user to our tier system.
 * @param {object} user - ExtPay user object
 * @returns {string} Tier name
 */
function mapUserToTier(user) {
  if (!user || !user.paid) return 'free';

  const planId = user.plan?.nickname;
  if (!planId) return 'free';

  // Find tier by planId
  for (const [tierName, tierConfig] of Object.entries(PRICING_CONFIG.tiers)) {
    if (tierConfig.planId === planId) {
      return tierName;
    }
  }

  // If plan exists but not mapped, assume pro
  console.warn(`[payments] Unknown plan: ${planId}, defaulting to pro`);
  return 'pro';
}

/**
 * Get current tier name.
 * @returns {Promise<string>} 'free' | 'pro'
 */
export async function getCurrentTier() {
  // If ExtPay is available, use it
  if (extpay) {
    const user = await getUser();
    return mapUserToTier(user);
  }

  // Fallback: check storage (for dev/testing)
  try {
    const result = await chrome.storage.local.get(TIER_STORAGE_KEY);
    return result[TIER_STORAGE_KEY] || 'free';
  } catch {
    return 'free';
  }
}

/**
 * Check if user has paid status.
 * @returns {Promise<boolean>}
 */
export async function isPaid() {
  const user = await getUser();
  return user?.paid ?? false;
}

/**
 * Open payment page.
 * @param {string|null} tier - Specific tier to purchase, or null for options
 */
export function openUpgrade(tier = null) {
  if (!extpay) {
    // ExtPay not configured - show coming soon message
    console.log('[payments] ExtPay not configured. Upgrade not available.');
    return false;
  }

  if (tier && PRICING_CONFIG.tiers[tier]) {
    const planId = PRICING_CONFIG.tiers[tier].planId;
    extpay.openPaymentPage(planId);
  } else {
    extpay.openPaymentPage();
  }
  return true;
}

/**
 * Open donation/one-time payment page.
 * @param {string} donationId - Donation key from pricing config (e.g., 'coffee')
 */
export function openDonation(donationId = 'coffee') {
  if (!extpay) {
    console.log('[payments] ExtPay not configured.');
    return false;
  }

  const donation = PRICING_CONFIG.donations?.[donationId];
  if (donation?.planId) {
    extpay.openPaymentPage(donation.planId);
  } else {
    console.warn(`[payments] Unknown donation: ${donationId}`);
    extpay.openPaymentPage();
  }
  return true;
}

/**
 * Open login page for returning users.
 */
export function openLogin() {
  if (!extpay) return false;
  extpay.openLoginPage();
  return true;
}

/**
 * Register callback for payment events.
 * @param {function} callback - Called with user object on payment
 */
export function onPaid(callback) {
  if (!extpay) return;
  extpay.onPaid.addListener(callback);
}

/**
 * Force refresh user data from ExtensionPay.
 */
export async function refreshUser() {
  return getUser(true);
}

/**
 * Set tier manually (for dev/testing only).
 * @param {string} tier - Tier name
 */
export async function setTierForTesting(tier) {
  await chrome.storage.local.set({ [TIER_STORAGE_KEY]: tier });
  console.log(`[payments] Test tier set to: ${tier}`);
}
