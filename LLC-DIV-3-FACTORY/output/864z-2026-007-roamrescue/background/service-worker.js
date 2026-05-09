// service-worker.js - RoamRescue Background Service Worker
// 864z-2026-007
//
// SECURITY CONSTRAINT: NO NETWORK CALLS
// This service worker handles extension lifecycle only.
// All vault operations happen in the sidepanel/content scripts.

// Inline constants (no ES module imports for service worker compatibility)
const MESSAGE_TYPES = {
  VAULT_UNLOCK: 'VAULT_UNLOCK',
  VAULT_LOCK: 'VAULT_LOCK',
  VAULT_STATUS: 'VAULT_STATUS'
};

/**
 * Extension Lifecycle
 */

// On install - open onboarding
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[RoamRescue] Extension installed:', details.reason);

  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('onboarding/index.html')
    });
  }

  setupContextMenus();
  setupAutoLockAlarm();
});

// On startup
chrome.runtime.onStartup.addListener(() => {
  console.log('[RoamRescue] Extension started');
  setupAutoLockAlarm();
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
      id: 'open-vault',
      title: 'Open RoamRescue',
      contexts: ['all']
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-vault') {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

/**
 * Auto-Lock Timer
 */

function setupAutoLockAlarm() {
  chrome.alarms.clear('auto-lock');
  chrome.alarms.create('auto-lock', { periodInMinutes: 15 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'auto-lock') {
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.VAULT_LOCK,
      source: 'auto-lock'
    }).catch(() => {});
  }
});

/**
 * Message Handling
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[RoamRescue] Message received:', message.type);

  switch (message.type) {
    case MESSAGE_TYPES.VAULT_STATUS:
      sendResponse({ locked: true });
      break;

    case MESSAGE_TYPES.VAULT_LOCK:
      broadcastMessage({ type: MESSAGE_TYPES.VAULT_LOCK });
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
  console.log('[RoamRescue] Command:', command);

  switch (command) {
    case 'lock-vault':
      chrome.runtime.sendMessage({ type: MESSAGE_TYPES.VAULT_LOCK });
      break;

    case 'open-vault':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.sidePanel.open({ tabId: tabs[0].id });
        }
      });
      break;
  }
});

console.log('[RoamRescue] Service worker initialized');
