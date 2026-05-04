/**
 * oia.focus.sound - Storage Wrapper
 * Thin wrapper around chrome.storage.local with auto-namespacing
 */

import { APP_SLUG, STORAGE_KEYS, CONFIG, SOUND_TYPES } from './constants.js';

/**
 * Get a value from storage (auto-prefixed with APP_SLUG)
 */
export async function getState(key) {
  const fullKey = `${APP_SLUG}_${key}`;
  const result = await chrome.storage.local.get(fullKey);
  return result[fullKey];
}

/**
 * Set a value in storage (auto-prefixed with APP_SLUG)
 */
export async function setState(key, value) {
  const fullKey = `${APP_SLUG}_${key}`;
  await chrome.storage.local.set({ [fullKey]: value });
}

/**
 * Get current sound type
 */
export async function getCurrentSound() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.currentSound);
  return result[STORAGE_KEYS.currentSound] || CONFIG.defaultSound;
}

/**
 * Save current sound type
 */
export async function saveCurrentSound(soundType) {
  await chrome.storage.local.set({ [STORAGE_KEYS.currentSound]: soundType });
}

/**
 * Get playing state
 */
export async function getIsPlaying() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.isPlaying);
  return result[STORAGE_KEYS.isPlaying] || false;
}

/**
 * Save playing state
 */
export async function saveIsPlaying(isPlaying) {
  await chrome.storage.local.set({ [STORAGE_KEYS.isPlaying]: isPlaying });
}

/**
 * Get all settings
 */
export async function getSettings() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.currentSound,
    STORAGE_KEYS.isPlaying
  ]);

  return {
    currentSound: result[STORAGE_KEYS.currentSound] || CONFIG.defaultSound,
    isPlaying: result[STORAGE_KEYS.isPlaying] || false
  };
}

/**
 * Save all settings
 */
export async function saveSettings(settings) {
  const data = {};

  if (settings.currentSound !== undefined) {
    data[STORAGE_KEYS.currentSound] = settings.currentSound;
  }

  if (settings.isPlaying !== undefined) {
    data[STORAGE_KEYS.isPlaying] = settings.isPlaying;
  }

  if (Object.keys(data).length > 0) {
    await chrome.storage.local.set(data);
  }
}

/**
 * Initialize defaults for fresh install
 */
export async function initializeDefaults() {
  const defaults = {
    [STORAGE_KEYS.currentSound]: CONFIG.defaultSound,
    [STORAGE_KEYS.isPlaying]: false
  };
  await chrome.storage.local.set(defaults);
}

/**
 * Listen for storage changes on a specific key
 * Returns unsubscribe function
 */
export function onStateChange(key, callback) {
  const fullKey = `${APP_SLUG}_${key}`;
  const listener = (changes, area) => {
    if (area === 'local' && fullKey in changes) {
      callback(changes[fullKey].newValue, changes[fullKey].oldValue);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
