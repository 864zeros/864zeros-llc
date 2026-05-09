/**
 * oia.focus.note - Service Worker
 * 864z-build-kit compliant
 */

import { STORAGE_KEYS, CONFIG } from './lib/constants.js';
import { getNotes, saveNotes, getLastCleanup, setLastCleanup, filterExpiredNotes } from './lib/store.js';

// Open side panel on extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Enable side panel on install
chrome.runtime.onInstalled.addListener(async () => {
  chrome.sidePanel.setOptions({
    path: 'panel.html',
    enabled: true
  });
  await cleanupExpiredNotes();
});

// Daily cleanup on browser startup
chrome.runtime.onStartup.addListener(async () => {
  await cleanupExpiredNotes();
});

/**
 * Clean up notes older than CONFIG.noteExpirationHours
 * Only runs once per day to avoid unnecessary storage operations
 */
async function cleanupExpiredNotes() {
  try {
    const today = new Date().toDateString();
    const lastCleanup = await getLastCleanup();

    // Only clean up once per day
    if (lastCleanup === today) {
      return;
    }

    const notes = await getNotes();
    const validNotes = filterExpiredNotes(notes);

    // Save cleaned notes and update cleanup date
    await saveNotes(validNotes);
    await setLastCleanup(today);

    // Log cleanup results (dev only)
    const removed = notes.length - validNotes.length;
    if (removed > 0) {
      console.log(`[oia.focus.note] Cleaned up ${removed} expired note${removed === 1 ? '' : 's'}`);
    }
  } catch (error) {
    console.error('[oia.focus.note] Error during cleanup:', error);
  }
}
