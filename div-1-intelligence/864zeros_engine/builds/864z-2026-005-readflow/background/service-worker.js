// service-worker.js - ReadFlow Background Service Worker
// 864z-2026-005
//
// SECURITY CONSTRAINT: NO NETWORK CALLS
// This service worker handles extension lifecycle only.
// All library operations happen in the sidepanel.

// Inline constants (no ES module imports for service worker compatibility)
const MESSAGE_TYPES = {
  LIBRARY_REFRESH: 'LIBRARY_REFRESH',
  ARTICLE_SAVED: 'ARTICLE_SAVED',
  DIGEST_GENERATED: 'DIGEST_GENERATED'
};

/**
 * Extension Lifecycle
 */

// On install - open side panel
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[ReadFlow] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // Open sidepanel on first install
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
  }

  setupContextMenus();
});

// On startup
chrome.runtime.onStartup.addListener(() => {
  console.log('[ReadFlow] Extension started');
});

/**
 * Side Panel Configuration
 */

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

/**
 * Context Menus
 */

function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'open-library',
      title: 'Open ReadFlow Library',
      contexts: ['all']
    });

    chrome.contextMenus.create({
      id: 'save-article',
      title: 'Save to ReadFlow',
      contexts: ['page', 'link']
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-library') {
    chrome.sidePanel.open({ tabId: tab.id });
  } else if (info.menuItemId === 'save-article') {
    // Future: save current page or link to library
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

/**
 * Message Handling
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[ReadFlow] Message received:', message.type);

  switch (message.type) {
    case MESSAGE_TYPES.LIBRARY_REFRESH:
      broadcastMessage({ type: MESSAGE_TYPES.LIBRARY_REFRESH });
      sendResponse({ success: true });
      break;

    case MESSAGE_TYPES.ARTICLE_SAVED:
      broadcastMessage({ type: MESSAGE_TYPES.ARTICLE_SAVED, article: message.article });
      sendResponse({ success: true });
      break;

    case MESSAGE_TYPES.DIGEST_GENERATED:
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }

  return true;
});

function broadcastMessage(message) {
  chrome.runtime.sendMessage(message).catch(() => {});
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {});
    }
  });
}

/**
 * Keyboard Commands
 */

chrome.commands.onCommand.addListener((command) => {
  console.log('[ReadFlow] Command:', command);

  switch (command) {
    case 'generate-digest':
      chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DIGEST_GENERATED });
      break;

    case 'open-library':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.sidePanel.open({ tabId: tabs[0].id });
        }
      });
      break;
  }
});

console.log('[ReadFlow] Service worker initialized');
