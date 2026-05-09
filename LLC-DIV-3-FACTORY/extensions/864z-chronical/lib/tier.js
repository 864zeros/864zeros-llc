/**
 * Chronicle Tier State Helper
 *
 * Tier model:
 *   'free'  — default; per-entry Markdown export, full-vault JSON export
 *   'vault' — Tier-0.5 unlocked; adds Markdown-vault-folder export, bulk
 *             export by filter, scheduled exports
 *
 * Per RULE-007: tier flag lives in chrome.storage.local ONLY.
 * Per RULE-001 §2: tier disclosure is an Options-page concern; this module
 * provides the read/write primitive that Options + Sidepanel both consume.
 *
 * Strike 013 stub note: setTier() currently flips the local flag with no
 * server verification. Real ExtPay (or equivalent) checkout integration is
 * deferred per TIER_0_5_BLUEPRINT.md §VII.1.
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
