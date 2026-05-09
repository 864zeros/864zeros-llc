/**
 * Chronicle Service Worker
 * Simple message routing, no ports
 */

import * as db from './lib/db.js';

console.log('[Chronicle SW] Service worker starting...');

// Initialize DB on load
db.openDB().then(() => {
  console.log('[Chronicle SW] Database opened successfully');
}).catch(err => {
  console.error('[Chronicle SW] Database failed to open:', err);
});

// Open side panel on icon click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .then(() => console.log('[Chronicle SW] Side panel behavior set'))
  .catch(err => console.error('[Chronicle SW] Side panel setup failed:', err));

// Message handler - all communication via sendMessage
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Chronicle SW] Message received:', message.type, message);

  handleMessage(message, sender)
    .then(response => {
      console.log('[Chronicle SW] Responding to', message.type, ':', response);
      sendResponse(response);
    })
    .catch(err => {
      console.error('[Chronicle SW] Error handling', message.type, ':', err);
      sendResponse({ error: err.message });
    });

  return true; // Keep channel open for async response
});

async function handleMessage(msg, sender) {
  switch (msg.type) {
    case 'RECORD_ENTRY':
      console.log('[Chronicle SW] Recording entry:', msg.entry?.id);
      return await recordEntry(msg.entry, msg.exchanges);

    case 'GET_ENTRIES':
      console.log('[Chronicle SW] Getting entries...');
      const entries = await db.getEntries(msg.options);
      console.log('[Chronicle SW] Found', entries.length, 'entries');
      return { entries };

    case 'GET_ENTRY':
      console.log('[Chronicle SW] Getting entry:', msg.id);
      return await db.getEntry(msg.id);

    case 'DELETE_ENTRY':
      console.log('[Chronicle SW] Deleting entry:', msg.id);
      await db.deleteEntry(msg.id);
      return { success: true };

    case 'UPDATE_ENTRY':
      console.log('[Chronicle SW] Updating entry:', msg.id);
      await db.updateEntry(msg.id, msg.updates);
      return { success: true };

    case 'SEARCH':
      return { entries: await db.searchEntries(msg.query) };

    case 'CLEAR_ALL':
      console.log('[Chronicle SW] Clearing all data');
      await db.clearAll();
      return { success: true };

    case 'PING':
      return { pong: true };

    default:
      console.warn('[Chronicle SW] Unknown message type:', msg.type);
      return { error: 'Unknown message type' };
  }
}

async function recordEntry(entry, exchanges) {
  console.log('[Chronicle SW] Saving entry with', exchanges?.length, 'exchanges');
  await db.saveEntry(entry, exchanges);
  console.log('[Chronicle SW] Entry saved:', entry.id);

  // Notify side panel of new entry (fire and forget)
  chrome.runtime.sendMessage({
    type: 'ENTRY_RECORDED',
    entry: entry
  }).catch(() => {
    // Side panel might not be open, that's fine
  });

  return { success: true, id: entry.id };
}

console.log('[Chronicle SW] Service worker loaded');
