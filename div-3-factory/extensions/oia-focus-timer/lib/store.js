/**
 * oia.focus (timer) - Storage Wrapper
 * Thin wrapper around chrome.storage.local with auto-namespacing
 */

import { APP_SLUG, STORAGE_KEYS, CONFIG, SOUND_OPTIONS } from './constants.js';

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
 * Get all settings
 */
export async function getSettings() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.soundType,
    STORAGE_KEYS.lastFocusText
  ]);

  return {
    soundType: result[STORAGE_KEYS.soundType] || CONFIG.defaultSoundType,
    lastFocusText: result[STORAGE_KEYS.lastFocusText] || ''
  };
}

/**
 * Save settings
 */
export async function saveSettings(settings) {
  const data = {};

  if (settings.soundType !== undefined) {
    data[STORAGE_KEYS.soundType] = settings.soundType;
  }

  if (settings.lastFocusText !== undefined) {
    data[STORAGE_KEYS.lastFocusText] = settings.lastFocusText;
  }

  if (Object.keys(data).length > 0) {
    await chrome.storage.local.set(data);
  }
}

/**
 * Get sound type setting
 */
export async function getSoundType() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.soundType);
  return result[STORAGE_KEYS.soundType] || CONFIG.defaultSoundType;
}

/**
 * Save sound type setting
 */
export async function saveSoundType(soundType) {
  await chrome.storage.local.set({ [STORAGE_KEYS.soundType]: soundType });
}

/**
 * Get last focus text
 */
export async function getLastFocusText() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.lastFocusText);
  return result[STORAGE_KEYS.lastFocusText] || '';
}

/**
 * Save last focus text
 */
export async function saveLastFocusText(text) {
  await chrome.storage.local.set({ [STORAGE_KEYS.lastFocusText]: text });
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
