// store.js - State Management [BRK-CORE]
// 864zeros Build Kit - chrome.storage.local wrapper

import { APP_SLUG, STORAGE_KEYS, DEFAULT_SETTINGS } from './constants.js';

/**
 * Get a value from storage (auto-prefixed with APP_SLUG).
 */
export async function getState(key) {
  const prefixedKey = `${APP_SLUG}_${key}`;
  return new Promise((resolve) => {
    chrome.storage.local.get(prefixedKey, (result) => {
      resolve(result[prefixedKey]);
    });
  });
}

/**
 * Set a value in storage (auto-prefixed with APP_SLUG).
 */
export async function setState(key, value) {
  const prefixedKey = `${APP_SLUG}_${key}`;
  return new Promise((resolve) => {
    chrome.storage.local.set({ [prefixedKey]: value }, resolve);
  });
}

/**
 * Remove a value from storage.
 */
export async function removeState(key) {
  const prefixedKey = `${APP_SLUG}_${key}`;
  return new Promise((resolve) => {
    chrome.storage.local.remove(prefixedKey, resolve);
  });
}

/**
 * Listen for changes to a specific key.
 * Returns an unsubscribe function.
 */
export function onStateChange(key, callback) {
  const prefixedKey = `${APP_SLUG}_${key}`;

  const listener = (changes, areaName) => {
    if (areaName === 'local' && changes[prefixedKey]) {
      callback(changes[prefixedKey].newValue, changes[prefixedKey].oldValue);
    }
  };

  chrome.storage.onChanged.addListener(listener);

  // Return unsubscribe function
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

/**
 * Get the full settings object.
 */
export async function getSettings() {
  const settings = await getState('settings');
  return { ...DEFAULT_SETTINGS, ...settings };
}

/**
 * Merge partial settings into existing settings.
 */
export async function updateSettings(partial) {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await setState('settings', updated);
  return updated;
}

/**
 * Initialize default settings if not set.
 */
export async function initializeSettings() {
  const existing = await getState('settings');
  if (!existing) {
    await setState('settings', DEFAULT_SETTINGS);
    console.log('[store.js] Default settings initialized');
  }
}

/**
 * Check if this is first run.
 */
export async function isFirstRun() {
  const initialized = await getState('initialized');
  return !initialized;
}

/**
 * Mark as initialized (call after first-run setup).
 */
export async function markInitialized() {
  await setState('initialized', new Date().toISOString());
}
