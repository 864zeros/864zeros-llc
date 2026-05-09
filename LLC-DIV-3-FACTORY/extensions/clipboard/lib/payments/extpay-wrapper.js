/**
 * ExtensionPay Wrapper — ClipBoard
 *
 * Wraps ExtPay.js with our tier system.
 */

import { PRICING_CONFIG } from '../../config/pricing.js';
import ExtPay from './ExtPay.js';

let extpay = null;
let cachedUser = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Initialize ExtensionPay. Call once in service worker.
 * @returns {object} ExtPay instance
 */
export function initPayments() {
  if (extpay) return extpay;

  // DEV_MODE: Set to true to bypass ExtPay during development
  // Set to false once Stripe is connected
  const DEV_MODE = false;

  if (DEV_MODE) {
    console.log('[payments] DEV_MODE: ExtPay disabled, all features unlocked');
    extpay = { _devMode: true };
    return extpay;
  }

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
}

/**
 * Get ExtPay user object (cached for performance).
 * @param {boolean} forceRefresh - Bypass cache
 * @returns {Promise<object>} User object
 */
export async function getUser(forceRefresh = false) {
  if (!extpay) {
    console.error('[payments] Call initPayments() first');
    return null;
  }

  // DEV_MODE: Return mock paid user
  if (extpay._devMode) {
    return {
      paid: true,
      paidAt: new Date().toISOString(),
      email: 'dev@864zeros.com',
      plan: { nickname: 'power-monthly' },
      subscriptionStatus: 'active'
    };
  }

  // Return cached if fresh
  if (!forceRefresh && cachedUser && (Date.now() - cacheTime < CACHE_TTL)) {
    return cachedUser;
  }

  cachedUser = await extpay.getUser();
  cacheTime = Date.now();
  return cachedUser;
}

/**
 * Map ExtensionPay user to our tier system.
 * @param {object} user - ExtPay user object
 * @returns {string} Tier name
 */
function mapUserToTier(user) {
  if (!user.paid) return 'free';

  const planId = user.plan?.nickname;
  if (!planId) return 'free';

  // Find tier by planId
  for (const [tierName, tierConfig] of Object.entries(PRICING_CONFIG.tiers)) {
    if (tierConfig.planId === planId) {
      return tierName;
    }
  }

  // If plan exists but not mapped, assume highest tier
  console.warn(`[payments] Unknown plan: ${planId}, defaulting to power`);
  return 'power';
}

/**
 * Get current tier name.
 * @returns {Promise<string>} 'free' | 'starter' | 'pro' | 'power'
 */
export async function getCurrentTier() {
  const user = await getUser();
  if (!user) return 'free';
  return mapUserToTier(user);
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
 * Get subscription status.
 * @returns {Promise<string|null>} 'active' | 'past_due' | 'canceled' | null
 */
export async function getSubscriptionStatus() {
  const user = await getUser();
  return user?.subscriptionStatus ?? null;
}

/**
 * Open payment page.
 * @param {string|null} tier - Specific tier to purchase, or null for options
 */
export function openUpgrade(tier = null) {
  if (!extpay) {
    console.error('[payments] Call initPayments() first');
    return;
  }

  // DEV_MODE: Show alert instead of opening payment
  if (extpay._devMode) {
    console.log('[payments] DEV_MODE: Would open upgrade page for tier:', tier || 'default');
    alert(`DEV MODE: Payment disabled.\n\nWould upgrade to: ${tier || 'plan selection'}\n\nConnect Stripe in ExtensionPay to enable.`);
    return;
  }

  if (tier && PRICING_CONFIG.tiers[tier]) {
    const planId = PRICING_CONFIG.tiers[tier].planId;
    extpay.openPaymentPage(planId);
  } else {
    extpay.openPaymentPage();
  }
}

/**
 * Open donation/one-time payment page.
 * @param {string} donationId - Donation key from pricing config (e.g., 'coffee')
 */
export function openDonation(donationId = 'coffee') {
  if (!extpay) {
    console.error('[payments] Call initPayments() first');
    return;
  }

  // DEV_MODE: Show alert instead of opening payment
  if (extpay._devMode) {
    const donation = PRICING_CONFIG.donations?.[donationId];
    console.log('[payments] DEV_MODE: Would open donation page for:', donationId);
    alert(`DEV MODE: Payment disabled.\n\nWould process: ${donation?.label || donationId} ($${donation?.price || '?'})\n\nConnect Stripe in ExtensionPay to enable.`);
    return;
  }

  const donation = PRICING_CONFIG.donations?.[donationId];
  if (donation?.planId) {
    extpay.openPaymentPage(donation.planId);
  } else {
    console.warn(`[payments] Unknown donation: ${donationId}`);
    extpay.openPaymentPage();
  }
}

/**
 * Open login page for returning users.
 */
export function openLogin() {
  if (!extpay) return;
  extpay.openLoginPage();
}

/**
 * Open free trial page.
 * @param {string} displayText - e.g., "7-day"
 */
export function openTrial(displayText = '') {
  if (!extpay) return;
  extpay.openTrialPage(displayText);
}

/**
 * Get available plans from ExtensionPay.
 * @returns {Promise<array>}
 */
export async function getPlans() {
  if (!extpay) return [];
  return extpay.getPlans();
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
 * Register callback for trial start events.
 * @param {function} callback - Called with user object on trial start
 */
export function onTrialStarted(callback) {
  if (!extpay) return;
  extpay.onTrialStarted.addListener(callback);
}

/**
 * Force refresh user data from ExtensionPay.
 */
export async function refreshUser() {
  return getUser(true);
}
