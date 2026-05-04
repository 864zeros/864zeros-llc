// ============================================================
// STORE.JS — chrome.storage.local Wrapper
// State management with auto-namespacing and reactive listeners.
// ============================================================

import { APP_SLUG, STORAGE_KEYS } from './constants.js';

/**
 * Get a value from storage. Key is auto-prefixed with APP_SLUG.
 * @param {string} key - Storage key (without prefix)
 * @returns {Promise<any>}
 */
export async function getState(key) {
  const prefixedKey = `${APP_SLUG}_${key}`;
  const result = await chrome.storage.local.get(prefixedKey);
  return result[prefixedKey] ?? null;
}

/**
 * Set a value in storage. Key is auto-prefixed with APP_SLUG.
 * @param {string} key - Storage key (without prefix)
 * @param {any} value - Value to store
 */
export async function setState(key, value) {
  const prefixedKey = `${APP_SLUG}_${key}`;
  await chrome.storage.local.set({ [prefixedKey]: value });
}

/**
 * Remove a value from storage.
 * @param {string} key - Storage key (without prefix)
 */
export async function removeState(key) {
  const prefixedKey = `${APP_SLUG}_${key}`;
  await chrome.storage.local.remove(prefixedKey);
}

/**
 * Listen for changes to a specific key.
 * @param {string} key - Storage key (without prefix)
 * @param {function} callback - Callback(newValue, oldValue)
 * @returns {function} - Unsubscribe function
 */
export function onStateChange(key, callback) {
  const prefixedKey = `${APP_SLUG}_${key}`;

  const listener = (changes, area) => {
    if (area !== 'local') return;
    if (prefixedKey in changes) {
      const { newValue, oldValue } = changes[prefixedKey];
      callback(newValue, oldValue);
    }
  };

  chrome.storage.onChanged.addListener(listener);

  // Return unsubscribe function
  return () => chrome.storage.onChanged.removeListener(listener);
}

/**
 * Get the full settings object.
 * @returns {Promise<object>}
 */
export async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.settings);
  return result[STORAGE_KEYS.settings] ?? {};
}

/**
 * Merge partial settings into existing settings.
 * @param {object} partial - Partial settings to merge
 */
export async function updateSettings(partial) {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: updated });
}
