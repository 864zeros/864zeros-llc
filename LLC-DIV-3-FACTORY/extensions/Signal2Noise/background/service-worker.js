// ============================================================
// SERVICE WORKER — Signal2Noise Panel Extension
// Registers all listeners at the TOP LEVEL (MV3 requirement).
// ============================================================

import { APP_SLUG, STORAGE_KEYS } from '../lib/constants.js';

// --- Panel Behavior ---
// Opens the side panel when the user clicks the toolbar icon.
// REQUIRED: This cannot be set in the manifest — only via API.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[service-worker] Panel behavior error:', error));

// --- Install / Update ---
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    // Initialize default state on first install
    chrome.storage.local.set({
      [STORAGE_KEYS.SIGNALS]: [],
      [STORAGE_KEYS.SELECTED_RATIO]: '80',
      [STORAGE_KEYS.INITIALIZED]: true
    });
    console.log('[service-worker] Signal2Noise installed. Default state set.');
  }
  if (reason === 'update') {
    console.log('[service-worker] Signal2Noise updated.');
  }
});

// --- Message Relay ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {
    case 'GET_SIGNALS':
      chrome.storage.local.get(STORAGE_KEYS.SIGNALS, (result) => {
        sendResponse({ success: true, data: result[STORAGE_KEYS.SIGNALS] || [] });
      });
      return true;

    default:
      console.warn('[service-worker] Unknown message type:', type);
      return false;
  }
});
