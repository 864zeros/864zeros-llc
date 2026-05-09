/**
 * Chronicle Service Worker
 * Simple message routing, no ports
 */

import * as db from './lib/db.js';


// Initialize DB on load
db.openDB().then(() => {
}).catch(err => {
  console.error('[Chronicle SW] Database failed to open:', err);
});

// Open side panel on icon click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .then(() => )
  .catch(err => console.error('[Chronicle SW] Side panel setup failed:', err));

// Message handler - all communication via sendMessage
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  handleMessage(message, sender)
    .then(response => {
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
      return await recordEntry(msg.entry, msg.exchanges);

    case 'GET_ENTRIES':
      const entries = await db.getEntries(msg.options);
      return { entries };

    case 'GET_ENTRY':
      return await db.getEntry(msg.id);

    case 'DELETE_ENTRY':
      await db.deleteEntry(msg.id);
      return { success: true };

    case 'UPDATE_ENTRY':
      await db.updateEntry(msg.id, msg.updates);
      return { success: true };

    case 'SEARCH':
      return { entries: await db.searchEntries(msg.query) };

    case 'CLEAR_ALL':
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
  await db.saveEntry(entry, exchanges);

  // Notify side panel of new entry (fire and forget)
  chrome.runtime.sendMessage({
    type: 'ENTRY_RECORDED',
    entry: entry
  }).catch(() => {
    // Side panel might not be open, that's fine
  });

  return { success: true, id: entry.id };
}

