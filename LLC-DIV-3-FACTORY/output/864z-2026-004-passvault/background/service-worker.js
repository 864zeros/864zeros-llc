// service-worker.js - PassVault Background Service Worker
// 864zeros Build: 864z-2026-004
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
  console.log('[PassVault] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // Open onboarding tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('onboarding/index.html')
    });
  }

  // Set up context menus
  setupContextMenus();

  // Set up auto-lock alarm
  setupAutoLockAlarm();
});

// On startup
chrome.runtime.onStartup.addListener(() => {
  console.log('[PassVault] Extension started');
  setupAutoLockAlarm();
});

/**
 * Side Panel Configuration
 */

// Open side panel when toolbar icon clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Enable side panel for all URLs
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

/**
 * Context Menus
 */

function setupContextMenus() {
  // Clear existing menus
  chrome.contextMenus.removeAll(() => {
    // Add "Save password" context menu on password fields
    chrome.contextMenus.create({
      id: 'save-password',
      title: 'Save password to PassVault',
      contexts: ['editable']
    });

    // Add "Generate password" context menu
    chrome.contextMenus.create({
      id: 'generate-password',
      title: 'Generate secure password',
      contexts: ['editable']
    });

    // Add "Open PassVault" context menu
    chrome.contextMenus.create({
      id: 'open-vault',
      title: 'Open PassVault',
      contexts: ['all']
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'save-password':
      // Open side panel for saving
      chrome.sidePanel.open({ tabId: tab.id });
      break;

    case 'generate-password':
      // Generate and inject password
      generateAndInjectPassword(tab.id);
      break;

    case 'open-vault':
      chrome.sidePanel.open({ tabId: tab.id });
      break;
  }
});

/**
 * Password Generation
 */

async function generateAndInjectPassword(tabId) {
  // Generate secure password
  const password = generateSecurePassword(20);

  // Copy to clipboard (requires optional permission)
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (pwd) => {
        navigator.clipboard.writeText(pwd);

        // Show notification
        const toast = document.createElement('div');
        toast.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #00d084;
          color: #000;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: sans-serif;
          font-size: 14px;
          z-index: 999999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        toast.textContent = 'Secure password copied to clipboard!';
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
      },
      args: [password]
    });
  } catch (error) {
    console.error('[PassVault] Failed to inject password:', error);
  }
}

function generateSecurePassword(length = 20) {
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const numbers = '23456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const charset = lowercase + uppercase + numbers + symbols;
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
}

/**
 * Auto-Lock Timer
 */

function setupAutoLockAlarm() {
  // Clear existing alarm
  chrome.alarms.clear('auto-lock');

  // Set up new alarm (default: 15 minutes)
  chrome.alarms.create('auto-lock', {
    periodInMinutes: 15
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'auto-lock') {
    // Notify all extension pages to lock
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.VAULT_LOCK,
      source: 'auto-lock'
    }).catch(() => {
      // No listeners - that's OK
    });
  }
});

/**
 * Message Handling
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[PassVault] Message received:', message.type);

  switch (message.type) {
    case MESSAGE_TYPES.VAULT_STATUS:
      // Return vault status
      sendResponse({ locked: true }); // Actual status managed by sidepanel
      break;

    case MESSAGE_TYPES.VAULT_LOCK:
      // Broadcast lock message to all extension pages
      broadcastMessage({ type: MESSAGE_TYPES.VAULT_LOCK });
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }

  return true; // Keep channel open for async response
});

/**
 * Broadcast message to all extension contexts.
 */
function broadcastMessage(message) {
  // Send to all extension pages
  chrome.runtime.sendMessage(message).catch(() => {});

  // Send to all tabs with content script
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
  console.log('[PassVault] Command:', command);

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

console.log('[PassVault] Service worker initialized');
