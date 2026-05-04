/**
 * oia.focus.signal - Background Service Worker
 * Handles extension lifecycle and data maintenance
 */

import { CONFIG } from './lib/constants.js';
import { getSignals, saveSignals, getLastCleanup, setLastCleanup, filterExpiredSignals } from './lib/store.js';

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
    const today = new Date().toDateString();
    const lastCleanup = await getLastCleanup();

    // Only clean up once per day
    if (lastCleanup === today) return;

    const signals = await getSignals();
    const validSignals = filterExpiredSignals(signals);

    await saveSignals(validSignals);
    await setLastCleanup(today);

    if (signals.length > validSignals.length) {
      console.log(`Cleaned up ${signals.length - validSignals.length} expired signals`);
    }

    console.log('oia.focus.signal maintenance completed');
  } catch (error) {
    console.error('Error during maintenance:', error);
  }
}
