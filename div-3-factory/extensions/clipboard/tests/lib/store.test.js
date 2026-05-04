import { describe, test, expect, beforeEach, vi } from 'vitest';
import { getState, setState, removeState, onStateChange, getSettings, updateSettings } from '../../lib/store.js';

describe('store (chrome.storage.local wrapper)', () => {
  beforeEach(async () => {
    await chrome.storage.local.clear();
  });

  test('setState and getState round-trip', async () => {
    await setState('theme', 'dark');
    const value = await getState('theme');
    expect(value).toBe('dark');
  });

  test('getState returns null for missing key', async () => {
    const value = await getState('nonexistent');
    expect(value).toBeNull();
  });

  test('keys are namespaced with app slug', async () => {
    await setState('mykey', 'myvalue');
    // Verify the raw chrome.storage.local has the prefixed key
    const raw = await chrome.storage.local.get(null);
    const keys = Object.keys(raw);
    const hasNamespaced = keys.some(k => k.includes('mykey') && k.startsWith('clipboard_'));
    expect(hasNamespaced).toBe(true);
  });

  test('removeState deletes the value', async () => {
    await setState('temp', 'value');
    await removeState('temp');
    const value = await getState('temp');
    expect(value).toBeNull();
  });

  test('onStateChange fires callback on update', async () => {
    const callback = vi.fn();
    const unsubscribe = onStateChange('watched', callback);

    await setState('watched', 'new-value');

    // Give the listener a tick to fire
    await new Promise(r => setTimeout(r, 10));
    expect(callback).toHaveBeenCalledWith('new-value', undefined);

    unsubscribe();
  });

  test('onStateChange unsubscribe stops callbacks', async () => {
    const callback = vi.fn();
    const unsubscribe = onStateChange('key', callback);

    // Unsubscribe before setting
    unsubscribe();
    await setState('key', 'value');

    await new Promise(r => setTimeout(r, 10));
    expect(callback).not.toHaveBeenCalled();
  });

  test('getSettings returns empty object when not set', async () => {
    const settings = await getSettings();
    expect(settings).toEqual({});
  });

  test('updateSettings merges partial settings', async () => {
    await updateSettings({ defaultCapture: 'selection' });
    await updateSettings({ autoTag: true });

    const settings = await getSettings();
    expect(settings.defaultCapture).toBe('selection');
    expect(settings.autoTag).toBe(true);
  });

  test('updateSettings overwrites existing keys', async () => {
    await updateSettings({ defaultCapture: 'selection' });
    await updateSettings({ defaultCapture: 'page' });

    const settings = await getSettings();
    expect(settings.defaultCapture).toBe('page');
  });
});
