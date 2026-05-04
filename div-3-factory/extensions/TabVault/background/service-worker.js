// ============================================================
// SERVICE WORKER — TabVault
// All listeners registered at TOP LEVEL (MV3 requirement)
// This file is the relay — no UI logic, no persistent state
// ============================================================

import { initVault, vaultTab, getVaultContents, deleteVaultedTab, clearVault, vaultMultipleTabs, deleteGroup } from '../lib/db.js';
import { getSettings, getTabActivity, updateTabActivity, removeTabActivity, setInitialized } from '../lib/store.js';
import { MESSAGE_TYPES, ALARMS, DEFAULT_SETTINGS, STORAGE_KEYS } from '../lib/constants.js';

// --- Notify vault changes (triggers reactive updates in sidepanel/options) ---
async function notifyVaultChanged() {
  await chrome.storage.local.set({
    [STORAGE_KEYS.VAULT_UPDATED]: Date.now()
  });
}

// --- Panel Behavior (TOP LEVEL — REQUIRED) ---
// This MUST be at top level, not inside onInstalled
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[service-worker] Panel behavior error:', error));

// --- Initialize IndexedDB on Service Worker Start ---
initVault()
  .then(() => console.log('[service-worker] IndexedDB initialized.'))
  .catch((err) => console.error('[service-worker] IndexedDB init failed:', err));

// --- Install / Update ---
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    // Set default settings
    await chrome.storage.local.set({
      [STORAGE_KEYS.INITIALIZED]: true,
      [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
      [STORAGE_KEYS.TAB_ACTIVITY]: {}
    });
    console.log('[service-worker] TabVault installed. Defaults set.');
  }

  if (reason === 'update') {
    console.log('[service-worker] TabVault updated.');
  }

  // Create or update the Deep Sleep alarm (runs every minute)
  chrome.alarms.create(ALARMS.DEEP_SLEEP_CHECK, { periodInMinutes: 1 });
  console.log('[service-worker] Deep Sleep alarm created.');
});

// --- Deep Sleep Alarm Handler ---
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARMS.DEEP_SLEEP_CHECK) return;

  try {
    const settings = await getSettings();

    // Check if Deep Sleep is enabled
    if (!settings.deepSleepEnabled) {
      return;
    }

    const activity = await getTabActivity();
    const now = Date.now();
    const thresholdMs = (settings.inactivityMinutes || 20) * 60 * 1000;

    // Get all tabs
    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
      // Skip: active tabs, already discarded, no ID, or special pages
      if (tab.active || tab.discarded || !tab.id) continue;
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) continue;

      const lastActive = activity[tab.id];

      // If no activity record, initialize it
      if (!lastActive) {
        await updateTabActivity(tab.id);
        continue;
      }

      // Check if tab has been inactive long enough
      if (now - lastActive > thresholdMs) {
        try {
          await chrome.tabs.discard(tab.id);
          console.log(`[deep-sleep] Discarded tab ${tab.id}: ${tab.title}`);
        } catch (err) {
          // Tab might have been closed or can't be discarded
          console.log(`[deep-sleep] Could not discard tab ${tab.id}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('[deep-sleep] Alarm handler error:', err);
  }
});

// --- Tab Activity Tracking ---
// Update activity when tab becomes active
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await updateTabActivity(activeInfo.tabId);
});

// Update activity when tab content changes (navigation, refresh)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    await updateTabActivity(tabId);
  }
});

// Clean up activity tracking when tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await removeTabActivity(tabId);
});

// --- Message Relay ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  // Handle messages asynchronously
  (async () => {
    try {
      switch (type) {
        case MESSAGE_TYPES.GET_CONTENTS: {
          const contents = await getVaultContents();
          sendResponse({ success: true, data: contents });
          break;
        }

        case MESSAGE_TYPES.VAULT_TAB: {
          const id = await vaultTab(payload);
          await notifyVaultChanged();
          sendResponse({ success: true, id });
          break;
        }

        case MESSAGE_TYPES.DELETE_TAB: {
          await deleteVaultedTab(payload.id);
          await notifyVaultChanged();
          sendResponse({ success: true });
          break;
        }

        case MESSAGE_TYPES.CLEAR_VAULT: {
          await clearVault();
          await notifyVaultChanged();
          sendResponse({ success: true });
          break;
        }

        case 'TABVAULT_VAULT_MULTIPLE': {
          const groupInfo = payload.groupId ? { groupId: payload.groupId, groupName: payload.groupName } : null;
          const count = await vaultMultipleTabs(payload.tabs, groupInfo);
          await notifyVaultChanged();
          sendResponse({ success: true, count });
          break;
        }

        case 'TABVAULT_DELETE_GROUP': {
          const count = await deleteGroup(payload.groupId);
          await notifyVaultChanged();
          sendResponse({ success: true, count });
          break;
        }

        case 'TABVAULT_GET_SETTINGS': {
          const settings = await getSettings();
          sendResponse({ success: true, data: settings });
          break;
        }

        case 'TABVAULT_UPDATE_SETTINGS': {
          await chrome.storage.local.set({
            [STORAGE_KEYS.SETTINGS]: { ...(await getSettings()), ...payload }
          });
          sendResponse({ success: true });
          break;
        }

        default:
          console.warn('[service-worker] Unknown message type:', type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[service-worker] Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  // Keep message channel open for async response
  return true;
});

// --- Startup ---
console.log('[service-worker] TabVault service worker loaded.');
