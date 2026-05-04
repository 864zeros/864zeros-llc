/**
 * oia.focus.signal - Storage Wrapper
 * Thin wrapper around chrome.storage.local with auto-namespacing
 */

import { APP_SLUG, STORAGE_KEYS, CONFIG } from './constants.js';

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
 * Get all signals
 */
export async function getSignals() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.signals);
  return result[STORAGE_KEYS.signals] || [];
}

/**
 * Save all signals
 */
export async function saveSignals(signals) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.signals]: signals,
    [STORAGE_KEYS.lastUpdated]: Date.now()
  });
}

/**
 * Get selected ratio
 */
export async function getSelectedRatio() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.selectedRatio);
  return result[STORAGE_KEYS.selectedRatio] || CONFIG.defaultRatio;
}

/**
 * Save selected ratio
 */
export async function saveSelectedRatio(ratio) {
  await chrome.storage.local.set({ [STORAGE_KEYS.selectedRatio]: ratio });
}

/**
 * Get last cleanup date
 */
export async function getLastCleanup() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.lastCleanup);
  return result[STORAGE_KEYS.lastCleanup];
}

/**
 * Set last cleanup date
 */
export async function setLastCleanup(date) {
  await chrome.storage.local.set({ [STORAGE_KEYS.lastCleanup]: date });
}

/**
 * Filter out expired signals
 * Marked signals: 30 days
 * Unmarked signals: 7 days
 */
export function filterExpiredSignals(signals) {
  const now = Date.now();
  const unmarkedCutoff = now - (CONFIG.unmarkedExpirationDays * 24 * 60 * 60 * 1000);
  const markedCutoff = now - (CONFIG.markedExpirationDays * 24 * 60 * 60 * 1000);

  return signals.filter(signal => {
    const cutoffDate = signal.isMarked ? markedCutoff : unmarkedCutoff;
    return signal.timestamp > cutoffDate;
  });
}

/**
 * Get all settings
 */
export async function getSettings() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.signals,
    STORAGE_KEYS.selectedRatio
  ]);

  return {
    signals: result[STORAGE_KEYS.signals] || [],
    selectedRatio: result[STORAGE_KEYS.selectedRatio] || CONFIG.defaultRatio
  };
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
