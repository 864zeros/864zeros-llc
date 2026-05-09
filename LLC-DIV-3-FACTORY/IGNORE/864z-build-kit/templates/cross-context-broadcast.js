// ============================================================
// CROSS-CONTEXT BROADCAST SCAFFOLD
// Template for communication between extension contexts.
// Handles messaging between: sidepanel, options, popup, service worker
// ============================================================
//
// EXTENSION CONTEXTS:
// - Service Worker (background): Central hub, always running
// - Sidepanel: Main UI, may or may not be open
// - Options Page: Settings UI, opened on demand
// - Popup: Quick actions, opened on demand
// - Content Script: Runs in web pages
//
// COMMUNICATION PATTERNS:
// 1. Request/Response: One context asks, another answers
// 2. Broadcast: One context notifies all others
// 3. Tab-specific: Message to/from specific tab's content script
//
// ============================================================


// ============================================================
// STEP 1: Define Message Types (lib/constants.js)
// ============================================================

export const MESSAGE_TYPES = {
  // --- Requests (expect response) ---
  GET_CLIPS: 'GET_CLIPS',
  GET_TAGS: 'GET_TAGS',
  CHECK_FEATURE_ACCESS: 'CHECK_FEATURE_ACCESS',

  // --- Commands (action, may or may not need response) ---
  CAPTURE_SELECTION: 'CAPTURE_SELECTION',
  DELETE_CLIP: 'DELETE_CLIP',
  UPDATE_CLIP: 'UPDATE_CLIP',

  // --- Broadcasts (notify all contexts) ---
  CLIP_ADDED: 'CLIP_ADDED',
  CLIP_DELETED: 'CLIP_DELETED',
  CLIP_UPDATED: 'CLIP_UPDATED',
  DATA_IMPORTED: 'DATA_IMPORTED',
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',
  TIER_CHANGED: 'TIER_CHANGED',
};


// ============================================================
// STEP 2: Service Worker — Message Handler & Broadcaster
// ============================================================

// background/service-worker.js

// --- Central Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  const handleMessage = async () => {
    switch (type) {
      // Handle request/response messages
      case MESSAGE_TYPES.GET_CLIPS:
        return handleGetClips(payload);

      // Handle commands that trigger broadcasts
      case MESSAGE_TYPES.DELETE_CLIP:
        const result = await handleDeleteClip(payload);
        if (result.success) {
          broadcast(MESSAGE_TYPES.CLIP_DELETED, { clipId: payload.clipId });
        }
        return result;

      // Handle incoming broadcasts and relay to other contexts
      case MESSAGE_TYPES.DATA_IMPORTED:
        broadcast(MESSAGE_TYPES.DATA_IMPORTED, payload);
        return { success: true };

      default:
        return { success: false, error: 'Unknown message type' };
    }
  };

  handleMessage()
    .then(sendResponse)
    .catch(error => sendResponse({ success: false, error: error.message }));

  return true; // Keep channel open for async
});

// --- Broadcast Helper ---
function broadcast(type, payload = {}) {
  // Send to all extension contexts (sidepanel, popup, options)
  // This will NOT go back to the service worker itself
  try {
    chrome.runtime.sendMessage({ type, payload }).catch(() => {
      // Ignore errors if no receivers are open
    });
  } catch (e) {
    // Ignore
  }
}

// --- Broadcast to Specific Tab's Content Script ---
async function broadcastToTab(tabId, type, payload = {}) {
  try {
    await chrome.tabs.sendMessage(tabId, { type, payload });
  } catch (e) {
    // Tab might not have content script injected
  }
}

// --- Broadcast to All Tabs ---
async function broadcastToAllTabs(type, payload = {}) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type, payload });
    } catch (e) {
      // Skip tabs without content scripts
    }
  }
}


// ============================================================
// STEP 3: Sidepanel — Listener
// ============================================================

// sidepanel/main.js

import { MESSAGE_TYPES } from '../lib/constants.js';

// --- Listen for Broadcasts ---
chrome.runtime.onMessage.addListener((message) => {
  const { type, payload } = message;

  switch (type) {
    case 'CLIP_ADDED':
      // Refresh clips list
      if (currentView === 'clips') {
        loadClips();
      }
      // Maybe trigger auto-tag
      if (payload?.clipType === 'text') {
        triggerAutoTag(payload.id);
      }
      break;

    case MESSAGE_TYPES.CLIP_DELETED:
      // Remove from local state and UI
      clips = clips.filter(c => c.id !== payload.clipId);
      renderClips();
      break;

    case MESSAGE_TYPES.CLIP_UPDATED:
      // Update local state
      const index = clips.findIndex(c => c.id === payload.clipId);
      if (index >= 0) {
        clips[index] = { ...clips[index], ...payload.updates };
        renderClips();
      }
      break;

    case MESSAGE_TYPES.DATA_IMPORTED:
      // Full refresh after import
      loadClips();
      loadTags();
      break;

    case MESSAGE_TYPES.SETTINGS_CHANGED:
      // Reload settings-dependent UI
      applySettings(payload);
      break;

    case MESSAGE_TYPES.TIER_CHANGED:
      // Update tier-dependent UI
      currentTier = payload.tier;
      updateTierUI();
      break;
  }
});


// ============================================================
// STEP 4: Options Page — Sender
// ============================================================

// options/options.js

import { MESSAGE_TYPES } from '../lib/constants.js';

// After importing data, notify other contexts
importFile.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    await ensureDB();
    const result = await importLocal(file);

    if (result.success) {
      showFeedback('Data imported successfully');

      // Notify service worker to broadcast
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.DATA_IMPORTED
      });
    }
  } catch (error) {
    showFeedback(error.error || 'Import failed', 'error');
  }
});

// After changing a setting that affects other contexts
async function saveSetting(key, value) {
  await updateSettings({ [key]: value });

  // Notify other contexts
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.SETTINGS_CHANGED,
    payload: { [key]: value }
  });
}


// ============================================================
// STEP 5: Content Script — Two-Way Communication
// ============================================================

// content/content-script.js

// --- Listen for Messages from Extension ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {
    case 'GET_SELECTION':
      // Return currently selected text
      const selection = window.getSelection()?.toString() || '';
      sendResponse({ success: true, selection });
      break;

    case 'HIGHLIGHT_ELEMENT':
      // Highlight a specific element
      highlightElement(payload.selector);
      sendResponse({ success: true });
      break;

    case 'INJECT_UI':
      // Inject floating UI into page
      injectCaptureUI();
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true; // Keep channel open
});

// --- Send Message to Extension ---
function notifyExtension(type, payload) {
  chrome.runtime.sendMessage({ type, payload })
    .then(response => {
      if (response.success) {
        console.log('Extension notified:', type);
      }
    })
    .catch(error => {
      console.error('Failed to notify extension:', error);
    });
}

// Example: User completed a selection
function onSelectionComplete(rect) {
  notifyExtension('MARQUEE_SELECTION_COMPLETE', { rect });
}


// ============================================================
// STEP 6: Storage-Based Communication (Alternative)
// ============================================================

// For settings that need to sync across contexts,
// use chrome.storage.onChanged instead of messages

// In any context:
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  // Check for specific keys
  if ('clipboard_settings' in changes) {
    const newSettings = changes.clipboard_settings.newValue;
    applySettings(newSettings);
  }

  if ('clipboard_tier' in changes) {
    const newTier = changes.clipboard_tier.newValue;
    updateTierUI(newTier);
  }
});

// Benefits of storage-based communication:
// - Automatic sync across all contexts
// - Persisted (survives restarts)
// - No need to manage message routing
//
// Downsides:
// - Slight delay compared to direct messaging
// - Only works for data stored in chrome.storage
// - Can't send transient notifications


// ============================================================
// COMMON PATTERNS
// ============================================================

// --- Pattern: Request with Timeout ---
async function requestWithTimeout(type, payload, timeoutMs = 5000) {
  return Promise.race([
    chrome.runtime.sendMessage({ type, payload }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
}

// --- Pattern: Retry on Failure ---
async function requestWithRetry(type, payload, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await chrome.runtime.sendMessage({ type, payload });
      if (response.success) return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
    }
  }
}

// --- Pattern: Fire and Forget ---
function fireAndForget(type, payload) {
  chrome.runtime.sendMessage({ type, payload }).catch(() => {
    // Intentionally ignore errors
  });
}

// --- Pattern: Wait for Context to be Ready ---
async function waitForServiceWorker(maxWaitMs = 5000) {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'PING' });
      if (response?.success) return true;
    } catch (e) {
      // Service worker not ready yet
    }
    await new Promise(r => setTimeout(r, 100));
  }

  throw new Error('Service worker not available');
}


// ============================================================
// DEBUGGING
// ============================================================

// Add to service worker for debugging:
case 'PING':
  return { success: true, timestamp: Date.now() };

case 'DEBUG_STATE':
  return {
    success: true,
    state: {
      dbReady,
      // Add other state variables
    }
  };

// Console commands for testing:
// chrome.runtime.sendMessage({ type: 'PING' }, console.log);
// chrome.runtime.sendMessage({ type: 'DEBUG_STATE' }, console.log);


// ============================================================
// FLOW DIAGRAMS
// ============================================================

/*
REQUEST/RESPONSE FLOW:
┌──────────┐    sendMessage()    ┌────────────────┐
│ Sidepanel│ ──────────────────► │ Service Worker │
│          │ ◄────────────────── │                │
└──────────┘    sendResponse()   └────────────────┘


BROADCAST FLOW (e.g., CLIP_ADDED):
                                  ┌──────────┐
                             ┌──► │ Sidepanel│
┌────────────────┐           │    └──────────┘
│ Service Worker │ ──────────┤
│   broadcast()  │           │    ┌──────────┐
└────────────────┘           └──► │ Options  │
                                  └──────────┘


IMPORT FLOW:
┌─────────┐  sendMessage()  ┌────────────────┐  broadcast()  ┌──────────┐
│ Options │ ──────────────► │ Service Worker │ ────────────► │ Sidepanel│
└─────────┘ DATA_IMPORTED   └────────────────┘ DATA_IMPORTED └──────────┘
                                                               loadClips()
                                                               loadTags()


CONTENT SCRIPT FLOW:
┌─────────────┐  sendMessage()  ┌────────────────┐  broadcast()  ┌──────────┐
│Content Script│ ─────────────► │ Service Worker │ ────────────► │ Sidepanel│
└─────────────┘ MARQUEE_COMPLETE└────────────────┘  CLIP_ADDED   └──────────┘
                                      │
                                      ▼
                              [Capture, Crop, Save]
*/


// ============================================================
// TESTING CHECKLIST
// ============================================================
//
// [ ] Message from sidepanel reaches service worker
// [ ] Service worker response reaches sidepanel
// [ ] Broadcast from service worker reaches all open contexts
// [ ] Options page changes notify sidepanel
// [ ] Import in options refreshes sidepanel
// [ ] Content script messages reach service worker
// [ ] Service worker can message content script
// [ ] Storage changes sync across contexts
// [ ] Error handling for closed/unavailable contexts
//
