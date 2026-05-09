import { describe, test, expect, beforeEach } from 'vitest';
import { getTier, setTier, requiresTier, getFeatureAccess, getTierInfo } from '../../lib/tiers.js';

describe('tiers', () => {
  beforeEach(async () => {
    // Reset to free tier before each test
    await chrome.storage.local.clear();
  });

  test('defaults to free tier', async () => {
    const tier = await getTier();
    expect(tier).toBe('free');
  });

  test('setTier persists and getTier retrieves', async () => {
    await setTier('pro');
    expect(await getTier()).toBe('pro');
  });

  test('setTier throws on invalid tier', async () => {
    await expect(setTier('invalid')).rejects.toThrow('Invalid tier');
  });

  test('requiresTier returns true when at required tier', async () => {
    await setTier('pro');
    expect(await requiresTier('pro')).toBe(true);
  });

  test('requiresTier returns true when above required tier', async () => {
    await setTier('pro');
    expect(await requiresTier('free')).toBe(true);
    expect(await requiresTier('starter')).toBe(true);
  });

  test('requiresTier returns false when below required tier', async () => {
    await setTier('starter');
    expect(await requiresTier('pro')).toBe(false);
    expect(await requiresTier('power')).toBe(false);
  });

  test('free user cannot access paid features', async () => {
    // 'ai-summary' requires 'starter'
    expect(await getFeatureAccess('ai-summary')).toBe(false);
  });

  test('starter user can access starter features', async () => {
    await setTier('starter');
    expect(await getFeatureAccess('ai-summary')).toBe(true);
    expect(await getFeatureAccess('screenshot-capture')).toBe(true);
  });

  test('starter user cannot access pro features', async () => {
    await setTier('starter');
    expect(await getFeatureAccess('ai-vision')).toBe(false);
  });

  test('pro user can access all up to pro', async () => {
    await setTier('pro');
    expect(await getFeatureAccess('ai-summary')).toBe(true);
    expect(await getFeatureAccess('ai-vision')).toBe(true);
    expect(await getFeatureAccess('marquee-capture')).toBe(true);
  });

  test('free features are always accessible', async () => {
    expect(await getFeatureAccess('text-capture')).toBe(true);
    expect(await getFeatureAccess('search')).toBe(true);
  });

  test('unknown feature returns false', async () => {
    expect(await getFeatureAccess('nonexistent-feature')).toBe(false);
  });

  test('getTierInfo returns correct info', () => {
    const freeInfo = getTierInfo('free');
    expect(freeInfo.level).toBe(0);
    expect(freeInfo.price).toBe(0);

    const proInfo = getTierInfo('pro');
    expect(proInfo.level).toBe(2);
    expect(proInfo.price).toBeGreaterThan(0);
  });

  test('getTierInfo defaults to free for unknown tier', () => {
    const info = getTierInfo('unknown');
    expect(info.level).toBe(0);
    expect(info.price).toBe(0);
  });
});
