// ============================================================
// STORE — TabVault Chrome Storage Wrapper
// Handles chrome.storage.local operations with namespacing
// ============================================================

import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants.js';

/**
 * Get a value from chrome.storage.local
 * @param {string} key - Storage key
 * @returns {Promise<any>}
 */
export async function getState(key) {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? null;
}

/**
 * Set a value in chrome.storage.local
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {Promise<void>}
 */
export async function setState(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

/**
 * Get multiple values from chrome.storage.local
 * @param {Array<string>} keys - Array of storage keys
 * @returns {Promise<Object>}
 */
export async function getMultiple(keys) {
  return await chrome.storage.local.get(keys);
}

/**
 * Remove a value from chrome.storage.local
 * @param {string} key - Storage key to remove
 * @returns {Promise<void>}
 */
export async function removeState(key) {
  await chrome.storage.local.remove(key);
}

// --- Settings Helpers ---

/**
 * Get TabVault settings
 * @returns {Promise<Object>}
 */
export async function getSettings() {
  const settings = await getState(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...settings };
}

/**
 * Update TabVault settings
 * @param {Object} updates - Partial settings to merge
 * @returns {Promise<void>}
 */
export async function updateSettings(updates) {
  const current = await getSettings();
  await setState(STORAGE_KEYS.SETTINGS, { ...current, ...updates });
}

// --- Tab Activity Helpers (for Deep Sleep) ---

/**
 * Get tab activity map
 * @returns {Promise<Object>}
 */
export async function getTabActivity() {
  const activity = await getState(STORAGE_KEYS.TAB_ACTIVITY);
  return activity || {};
}

/**
 * Update activity timestamp for a tab
 * @param {number} tabId - Tab ID
 * @returns {Promise<void>}
 */
export async function updateTabActivity(tabId) {
  const activity = await getTabActivity();
  activity[tabId] = Date.now();
  await setState(STORAGE_KEYS.TAB_ACTIVITY, activity);
}

/**
 * Remove a tab from activity tracking
 * @param {number} tabId - Tab ID
 * @returns {Promise<void>}
 */
export async function removeTabActivity(tabId) {
  const activity = await getTabActivity();
  delete activity[tabId];
  await setState(STORAGE_KEYS.TAB_ACTIVITY, activity);
}

/**
 * Check if extension is initialized
 * @returns {Promise<boolean>}
 */
export async function isInitialized() {
  const initialized = await getState(STORAGE_KEYS.INITIALIZED);
  return initialized === true;
}

/**
 * Mark extension as initialized
 * @returns {Promise<void>}
 */
export async function setInitialized() {
  await setState(STORAGE_KEYS.INITIALIZED, true);
}
