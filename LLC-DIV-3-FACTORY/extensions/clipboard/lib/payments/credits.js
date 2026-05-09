/**
 * Credits — ClipBoard Payment System
 *
 * Usage-based credit system for AI features.
 */

import { PRICING_CONFIG } from '../../config/pricing.js';

const STORAGE_KEY_CREDITS = `${PRICING_CONFIG.appSlug}_credits`;
const STORAGE_KEY_HISTORY = `${PRICING_CONFIG.appSlug}_credit_history`;

/**
 * Initialize credits for new users.
 * Call once on extension install.
 */
export async function initCredits() {
  if (!PRICING_CONFIG.credits?.enabled) return;

  const result = await chrome.storage.local.get(STORAGE_KEY_CREDITS);

  // Only set initial credits if never set before
  if (result[STORAGE_KEY_CREDITS] === undefined) {
    const initialCredits = PRICING_CONFIG.credits.initialFree ?? 0;
    await chrome.storage.local.set({
      [STORAGE_KEY_CREDITS]: initialCredits,
      [STORAGE_KEY_HISTORY]: [{
        type: 'initial',
        amount: initialCredits,
        timestamp: Date.now(),
        note: 'Welcome credits'
      }]
    });
  }
}

/**
 * Get current credit balance.
 * @returns {Promise<number>}
 */
export async function getBalance() {
  if (!PRICING_CONFIG.credits?.enabled) return Infinity;

  const result = await chrome.storage.local.get(STORAGE_KEY_CREDITS);
  return result[STORAGE_KEY_CREDITS] ?? 0;
}

/**
 * Get credit cost for a feature.
 * @param {string} featureName - Feature key
 * @returns {number} Cost in credits
 */
export function getCost(featureName) {
  if (!PRICING_CONFIG.credits?.enabled) return 0;
  return PRICING_CONFIG.credits.costs[featureName] ?? 1;
}

/**
 * Check if user can afford a feature.
 * @param {string} featureName - Feature key
 * @returns {Promise<boolean>}
 */
export async function canAfford(featureName) {
  const balance = await getBalance();
  const cost = getCost(featureName);
  return balance >= cost;
}

/**
 * Deduct credits for feature usage.
 * @param {string} featureName - Feature key
 * @param {string} note - Optional note for history
 * @returns {Promise<{success: boolean, remaining: number, error?: string}>}
 */
export async function deduct(featureName, note = '') {
  if (!PRICING_CONFIG.credits?.enabled) {
    return { success: true, remaining: Infinity };
  }

  const cost = getCost(featureName);
  const balance = await getBalance();

  if (balance < cost) {
    return {
      success: false,
      remaining: balance,
      error: `Not enough credits. Need ${cost}, have ${balance}.`
    };
  }

  const newBalance = balance - cost;

  // Update balance and history
  const historyResult = await chrome.storage.local.get(STORAGE_KEY_HISTORY);
  const history = historyResult[STORAGE_KEY_HISTORY] ?? [];

  history.push({
    type: 'deduct',
    feature: featureName,
    amount: -cost,
    timestamp: Date.now(),
    note: note || featureName
  });

  // Keep last 100 history entries
  const trimmedHistory = history.slice(-100);

  await chrome.storage.local.set({
    [STORAGE_KEY_CREDITS]: newBalance,
    [STORAGE_KEY_HISTORY]: trimmedHistory
  });

  return { success: true, remaining: newBalance };
}

/**
 * Add credits (after purchase or promo).
 * @param {number} amount - Credits to add
 * @param {string} source - e.g., 'purchase', 'promo', 'refund'
 * @param {string} note - Optional note
 * @returns {Promise<number>} New balance
 */
export async function addCredits(amount, source = 'purchase', note = '') {
  if (!PRICING_CONFIG.credits?.enabled) return Infinity;

  const balance = await getBalance();
  const newBalance = balance + amount;

  const historyResult = await chrome.storage.local.get(STORAGE_KEY_HISTORY);
  const history = historyResult[STORAGE_KEY_HISTORY] ?? [];

  history.push({
    type: 'add',
    source,
    amount: amount,
    timestamp: Date.now(),
    note: note || `+${amount} credits`
  });

  const trimmedHistory = history.slice(-100);

  await chrome.storage.local.set({
    [STORAGE_KEY_CREDITS]: newBalance,
    [STORAGE_KEY_HISTORY]: trimmedHistory
  });

  return newBalance;
}

/**
 * Get credit history.
 * @param {number} limit - Max entries to return
 * @returns {Promise<array>}
 */
export async function getHistory(limit = 50) {
  const result = await chrome.storage.local.get(STORAGE_KEY_HISTORY);
  const history = result[STORAGE_KEY_HISTORY] ?? [];
  return history.slice(-limit).reverse();
}

/**
 * Get available credit packs for purchase.
 * @returns {array} Pack definitions from config
 */
export function getCreditPacks() {
  if (!PRICING_CONFIG.credits?.enabled) return [];
  return PRICING_CONFIG.credits.packs ?? [];
}

/**
 * Get the popular/recommended credit pack.
 * @returns {object|null}
 */
export function getRecommendedPack() {
  const packs = getCreditPacks();
  return packs.find(p => p.popular) ?? packs[1] ?? packs[0] ?? null;
}

/**
 * Check if credits system is enabled.
 * @returns {boolean}
 */
export function isCreditsEnabled() {
  return PRICING_CONFIG.credits?.enabled ?? false;
}
