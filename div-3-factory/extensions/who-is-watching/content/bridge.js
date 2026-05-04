// ============================================================
// BRIDGE — Content Script
// Relays messages from injected page script to the extension.
// Listens for postMessage from hook.js (page context).
// ============================================================

(function() {
  'use strict';

  const SOURCE_ID = 'who-is-watching';

  // Listen for messages from the injected script
  window.addEventListener('message', (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;

    // Validate message format
    if (!event.data || event.data.source !== SOURCE_ID) return;

    const { type, payload } = event.data;

    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      // Extension was reloaded, silently ignore
      return;
    }

    // Forward to the extension background
    try {
      chrome.runtime.sendMessage({
        type: type,
        payload: payload
      }).catch(err => {
        // Extension context may be invalidated on reload
        if (!err.message?.includes('Extension context invalidated')) {
          console.warn('[who-is-watching] Bridge error:', err);
        }
      });
    } catch (err) {
      // Synchronous error - extension context invalidated
      // Silently ignore, user needs to refresh page
    }
  });

  // Listen for commands from the DevTools panel (via background)
  if (chrome.runtime?.id) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'INJECT_COMMAND') {
        // Forward command to the page context via postMessage
        window.postMessage({
          source: SOURCE_ID,
          type: 'COMMAND',
          command: message.command,
          payload: message.payload
        }, '*');

        sendResponse({ success: true });
      }
      return false;
    });
  }

  console.log('[who-is-watching] Bridge initialized');
})();
