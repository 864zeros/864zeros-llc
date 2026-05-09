// ============================================================
// STORE — chrome.storage.local wrapper with reactive listeners
// ============================================================

import { APP_SLUG } from './constants.js';

/**
 * Get a value from storage
 * @param {string} key - Storage key (already namespaced)
 * @returns {Promise<any>}
 */
export async function getState(key) {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? null;
}

/**
 * Set a value in storage
 * @param {string} key - Storage key (already namespaced)
 * @param {any} value - Value to store
 * @returns {Promise<void>}
 */
export async function setState(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

/**
 * Remove a value from storage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export async function removeState(key) {
  await chrome.storage.local.remove(key);
}

/**
 * Listen for changes to a specific key
 * @param {string} key - Storage key to watch
 * @param {function} callback - Called with (newValue, oldValue)
 * @returns {function} Unsubscribe function
 */
export function onStateChange(key, callback) {
  const listener = (changes, area) => {
    if (area !== 'local') return;
    if (changes[key]) {
      callback(changes[key].newValue, changes[key].oldValue);
    }
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

/**
 * Get multiple values from storage
 * @param {string[]} keys - Array of storage keys
 * @returns {Promise<object>}
 */
export async function getMultiple(keys) {
  return await chrome.storage.local.get(keys);
}
