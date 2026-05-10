/**
 * Tier State Helper (864zeros canonical)
 *
 * Canonical: 864z-build-kit/references/core/tier.js
 * Per-extension copy: extensions/{ext}/lib/tier.js
 *
 * Tier model:
 *   'free'  — default; baseline features
 *   'vault' — Tier-0.5 unlocked; adds Sovereign Link backup + extras
 *
 * Compliance:
 *   - RULE-007: tier flag stored in chrome.storage.local ONLY (no .sync)
 *   - RULE-001 §2: tier disclosure is Options-page concern; this module
 *     provides the read/write primitive that Options + Sidepanel both
 *     consume
 *
 * Reference impl: extensions/864z-chronical/lib/tier.js (Strike 013)
 *
 * Update protocol (canonical): edit this file, then re-sync per-extension
 * lib/tier.js copies in the next compliance migration sprint.
 */

const TIER_KEY = 'tier';

export const TIER_FREE = 'free';
export const TIER_VAULT = 'vault';

export async function getTier() {
  const result = await chrome.storage.local.get(TIER_KEY);
  return result[TIER_KEY] || TIER_FREE;
}

export async function setTier(tier) {
  if (tier !== TIER_FREE && tier !== TIER_VAULT) {
    throw new Error('Invalid tier: ' + tier);
  }
  await chrome.storage.local.set({ [TIER_KEY]: tier });
  return tier;
}

export async function isVaultUnlocked() {
  return (await getTier()) === TIER_VAULT;
}
