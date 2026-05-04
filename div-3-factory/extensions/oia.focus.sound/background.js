/**
 * oia.focus.sound - Background Service Worker
 * Handles extension lifecycle and initialization
 */

import { STORAGE_KEYS, CONFIG } from './lib/constants.js';
import { initializeDefaults, saveIsPlaying, getSettings } from './lib/store.js';

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Enable side panel on install
chrome.runtime.onInstalled.addListener(async () => {
  chrome.sidePanel.setOptions({
    path: 'panel.html',
    enabled: true
  });
  await performMaintenance();
});

// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
  await performMaintenance();
});

async function performMaintenance() {
  try {
    const settings = await getSettings();

    // Initialize defaults if needed
    if (!settings.currentSound) {
      await initializeDefaults();
    }

    // Ensure sound is stopped on startup (avoid unexpected audio)
    if (settings.isPlaying) {
      await saveIsPlaying(false);
    }

    console.log('oia.focus.sound maintenance completed');
  } catch (error) {
    console.error('Error during maintenance:', error);
  }
}
