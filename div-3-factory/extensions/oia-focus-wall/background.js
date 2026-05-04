/**
 * oia.focus.wall - Background Service Worker
 * Handles extension lifecycle and data maintenance
 */

import { STORAGE_KEYS, CONFIG } from './lib/constants.js';
import { getNotes, saveNotes, filterExpiredNotes, getLastCleanup, setLastCleanup, getVersion, setVersion, initializeDefaults } from './lib/store.js';

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

// Data lifecycle management
chrome.runtime.onStartup.addListener(async () => {
  await performMaintenance();
});

async function performMaintenance() {
  try {
    await cleanupExpiredData();
    await checkVersionMigration();
    console.log('oia.focus.wall maintenance completed');
  } catch (error) {
    console.error('Error during maintenance:', error);
  }
}

async function cleanupExpiredData() {
  try {
    const today = new Date().toDateString();
    const lastCleanup = await getLastCleanup();

    // Only clean up once per day
    if (lastCleanup === today) return;

    const notes = await getNotes();
    const validNotes = filterExpiredNotes(notes);

    await saveNotes(validNotes);
    await setLastCleanup(today);

    if (notes.length > validNotes.length) {
      console.log(`Cleaned up ${notes.length - validNotes.length} expired sticky notes`);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

async function checkVersionMigration() {
  try {
    const storedVersion = await getVersion();
    const currentVersion = chrome.runtime.getManifest().version;

    if (!storedVersion) {
      // Fresh install
      await initializeDefaults();
    } else if (storedVersion !== currentVersion) {
      // Version upgrade - migrate data if needed
      await migrateData(storedVersion, currentVersion);
    }

    await setVersion(currentVersion);
  } catch (error) {
    console.error('Error during version check:', error);
  }
}

async function migrateData(fromVersion, toVersion) {
  console.log(`Migrating oia.focus.wall from ${fromVersion} to ${toVersion}`);
  // Future migration logic would go here
}
