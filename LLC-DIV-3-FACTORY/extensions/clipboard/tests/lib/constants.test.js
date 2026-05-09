import { describe, test, expect } from 'vitest';
import { APP_SLUG, STORAGE_KEYS, TIERS, FEATURE_TIERS, CREDIT_CONFIG, DB_NAME } from '../../lib/constants.js';

describe('constants', () => {
  test('APP_SLUG is set (not placeholder)', () => {
    expect(APP_SLUG).toBeTruthy();
    expect(APP_SLUG).not.toBe('__APP_SLUG__');
    expect(APP_SLUG).toBe('clipboard');
  });

  test('storage keys are namespaced with slug', () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      expect(key.startsWith(APP_SLUG)).toBe(true);
    });
  });

  test('tier levels are ordered correctly', () => {
    expect(TIERS.free.level).toBeLessThan(TIERS.starter.level);
    expect(TIERS.starter.level).toBeLessThan(TIERS.pro.level);
    expect(TIERS.pro.level).toBeLessThan(TIERS.power.level);
  });

  test('all tier prices meet minimum floor', () => {
    expect(TIERS.free.price).toBe(0);
    expect(TIERS.starter.price).toBeGreaterThanOrEqual(1.99);
    expect(TIERS.pro.price).toBeGreaterThanOrEqual(3.99);
    expect(TIERS.power.price).toBeGreaterThanOrEqual(5.99);
  });

  test('all features have valid tier assignments', () => {
    const validTiers = Object.keys(TIERS);
    Object.values(FEATURE_TIERS).forEach(tier => {
      expect(validTiers).toContain(tier);
    });
  });

  test('credit costs are defined for AI actions', () => {
    expect(CREDIT_CONFIG.costs['ai-summary']).toBeGreaterThan(0);
    expect(CREDIT_CONFIG.costs['ai-vision']).toBeGreaterThan(0);
    expect(CREDIT_CONFIG.costs['quick-summary']).toBeGreaterThan(0);
    expect(CREDIT_CONFIG.costs['research-dossier']).toBeGreaterThan(0);
  });

  test('credit packs are properly structured', () => {
    CREDIT_CONFIG.packs.forEach(pack => {
      expect(pack.id).toBeTruthy();
      expect(pack.credits).toBeGreaterThan(0);
      expect(pack.price).toBeGreaterThan(0);
      expect(pack.label).toBeTruthy();
    });
  });

  test('DB_NAME is set', () => {
    expect(DB_NAME).toBeTruthy();
    expect(DB_NAME).toContain('clipboard');
  });
});
