import { describe, test, expect, beforeEach } from 'vitest';
import { getBalance, setBalance, addCredits, deduct, canAfford, getCost } from '../../lib/credits.js';

describe('credits', () => {
  beforeEach(async () => {
    await chrome.storage.local.clear();
  });

  test('defaults to initial credits', async () => {
    const credits = await getBalance();
    expect(credits).toBe(10); // CREDIT_CONFIG.initialCredits
  });

  test('setBalance sets exact amount', async () => {
    await setBalance(100);
    expect(await getBalance()).toBe(100);
  });

  test('addCredits increases balance', async () => {
    await setBalance(0);
    await addCredits(100, 'test');
    expect(await getBalance()).toBe(100);
  });

  test('addCredits accumulates', async () => {
    await setBalance(0);
    await addCredits(50, 'test');
    await addCredits(30, 'test');
    expect(await getBalance()).toBe(80);
  });

  test('deduct decreases balance', async () => {
    await setBalance(100);
    const result = await deduct('ai-summary');
    expect(result.success).toBe(true);
    expect(await getBalance()).toBeLessThan(100);
  });

  test('deduct fails with insufficient credits', async () => {
    await setBalance(0);
    const result = await deduct('ai-summary');
    expect(result.success).toBe(false);
    expect(result.error).toBe('insufficient_credits');
  });

  test('canAfford returns true when sufficient', async () => {
    await setBalance(100);
    const { canAfford: affordable } = await canAfford('ai-summary');
    expect(affordable).toBe(true);
  });

  test('canAfford returns false when insufficient', async () => {
    await setBalance(0);
    const { canAfford: affordable } = await canAfford('ai-summary');
    expect(affordable).toBe(false);
  });

  test('getCost returns correct costs', () => {
    expect(getCost('ai-summary')).toBe(1);
    expect(getCost('ai-vision')).toBe(2);
    expect(getCost('quick-summary')).toBe(3);
    expect(getCost('research-dossier')).toBe(5);
  });

  test('getCost returns 0 for unknown action', () => {
    expect(getCost('nonexistent')).toBe(0);
  });
});
