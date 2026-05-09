/**
 * oia.focus.note - Storage Wrapper
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
 * Remove a value from storage
 */
export async function removeState(key) {
  const fullKey = `${APP_SLUG}_${key}`;
  await chrome.storage.local.remove(fullKey);
}

/**
 * Get all notes from storage
 */
export async function getNotes() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.notes);
  return result[STORAGE_KEYS.notes] || [];
}

/**
 * Save notes to storage
 */
export async function saveNotes(notes) {
  await chrome.storage.local.set({ [STORAGE_KEYS.notes]: notes });
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
 * Filter expired notes (older than CONFIG.noteExpirationHours)
 */
export function filterExpiredNotes(notes) {
  const expirationMs = CONFIG.noteExpirationHours * 60 * 60 * 1000;
  const cutoff = Date.now() - expirationMs;
  return notes.filter(note => note.timestamp > cutoff);
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
