/**
 * CREDITS.JS — Backward Compatibility Re-export
 *
 * This file re-exports from the new payment brick location.
 * New code should import from '../lib/payments/credits.js' directly.
 */

// Re-export everything from the new location
export {
  initCredits,
  getBalance,
  getCost,
  canAfford,
  deduct,
  addCredits,
  getHistory,
  getCreditPacks,
  getRecommendedPack,
  isCreditsEnabled
} from './payments/credits.js';

// Legacy setBalance - for test compatibility only
export async function setBalance(amount) {
  const { PRICING_CONFIG } = await import('../config/pricing.js');
  const key = `${PRICING_CONFIG.appSlug}_credits`;
  await chrome.storage.local.set({ [key]: amount });
}

// Legacy openPurchase - now handled through ExtensionPay
export async function openPurchase(packId) {
  console.warn('[credits] openPurchase is deprecated. Use ExtensionPay for credit pack purchases.');
  // TODO: Implement credit pack purchases via ExtensionPay
}
