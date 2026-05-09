// ============================================================
// MESSAGE HANDLER SCAFFOLD
// Template for the service worker message handling pattern.
// Central hub for all extension communication.
// ============================================================
//
// USAGE:
// 1. Use this as reference for the service worker structure
// 2. Add new cases as features are implemented
// 3. Keep handlers as separate async functions
//
// ============================================================


// ============================================================
// SERVICE WORKER STRUCTURE (background/service-worker.js)
// ============================================================

import { MESSAGE_TYPES, DB_NAME, DB_VERSION, DB_SCHEMA, APP_SLUG } from '../lib/constants.js';
import { initDB, get, put, getAll, remove } from '../lib/db.js';
import { getTier, getFeatureAccess } from '../lib/tiers.js';

// --- Debug Mode ---
const DEBUG = false;
function log(...args) {
  if (DEBUG) console.log('[ServiceWorker]', ...args);
}

// --- Initialize Database on Install ---
chrome.runtime.onInstalled.addListener(async (details) => {
  log('Extension installed/updated:', details.reason);

  try {
    await initDB(DB_NAME, DB_VERSION, DB_SCHEMA);
    log('Database initialized');

    // Set defaults on fresh install
    if (details.reason === 'install') {
      await chrome.storage.local.set({
        [`${APP_SLUG}_tier`]: 'free',
        [`${APP_SLUG}_initialized`]: true
      });
      log('Defaults set');
    }
  } catch (error) {
    console.error('Install error:', error);
  }
});

// --- Initialize Database on Startup ---
chrome.runtime.onStartup.addListener(async () => {
  log('Extension started');
  try {
    await initDB(DB_NAME, DB_VERSION, DB_SCHEMA);
    log('Database initialized on startup');
  } catch (error) {
    console.error('Startup error:', error);
  }
});

// --- Ensure DB is ready before handling messages ---
let dbReady = false;
async function ensureDB() {
  if (!dbReady) {
    await initDB(DB_NAME, DB_VERSION, DB_SCHEMA);
    dbReady = true;
  }
}


// ============================================================
// MESSAGE LISTENER
// ============================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;
  log('Received message:', type, payload);

  const handleMessage = async () => {
    await ensureDB();

    switch (type) {
      // ----- Content Capture -----
      case MESSAGE_TYPES.CAPTURE_SELECTION:
        return handleCaptureSelection(payload, sender);

      case MESSAGE_TYPES.CAPTURE_PAGE:
        return handleCapturePage(payload, sender);

      case MESSAGE_TYPES.CAPTURE_SCREENSHOT:
        return handleCaptureScreenshot(payload, sender);

      case MESSAGE_TYPES.CAPTURE_MARQUEE:
        return handleCaptureMarquee(payload, sender);

      // ----- Data Operations -----
      case MESSAGE_TYPES.GET_CLIPS:
        return handleGetClips(payload);

      case MESSAGE_TYPES.DELETE_CLIP:
        return handleDeleteClip(payload);

      case MESSAGE_TYPES.UPDATE_CLIP:
        return handleUpdateClip(payload);

      // ----- Tags -----
      case MESSAGE_TYPES.GET_TAGS:
        return handleGetTags(payload);

      case MESSAGE_TYPES.CREATE_TAG:
        return handleCreateTag(payload);

      case MESSAGE_TYPES.DELETE_TAG:
        return handleDeleteTag(payload);

      case MESSAGE_TYPES.LINK_TAG:
        return handleLinkTag(payload);

      case MESSAGE_TYPES.UNLINK_TAG:
        return handleUnlinkTag(payload);

      // ----- AI Features -----
      case MESSAGE_TYPES.SUMMARIZE_CLIP:
        return handleSummarizeClip(payload);

      case MESSAGE_TYPES.AUTO_TAG_CLIP:
        return handleAutoTagClip(payload);

      case MESSAGE_TYPES.ANALYZE_IMAGE:
        return handleAnalyzeImage(payload);

      // ----- Utility -----
      case 'CHECK_FEATURE_ACCESS':
        return handleCheckFeatureAccess(payload);

      case MESSAGE_TYPES.DATA_IMPORTED:
        // Broadcast to all extension views
        try {
          chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DATA_IMPORTED }).catch(() => {});
        } catch (e) {}
        return { success: true };

      // ----- Default -----
      default:
        log('Unknown message type:', type);
        return { success: false, error: 'Unknown message type' };
    }
  };

  handleMessage()
    .then(sendResponse)
    .catch(error => {
      console.error('Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // Keep channel open for async response
});


// ============================================================
// HANDLER TEMPLATE
// ============================================================

/**
 * Handler function template.
 * @param {object} payload - The message payload
 * @param {object} [sender] - The message sender (for content script messages)
 * @returns {Promise<object>} - Response object with success flag
 */
async function handleFeatureName(payload, sender) {
  log('handleFeatureName called with:', payload);

  try {
    // 1. Validate payload
    if (!payload.requiredField) {
      return { success: false, error: 'Missing required field' };
    }

    // 2. Check tier access (if gated feature)
    const hasAccess = await getFeatureAccess('feature-id');
    if (!hasAccess) {
      return { success: false, error: 'tier_required', requiredTier: 'pro' };
    }

    // 3. Perform the operation
    const result = await someOperation(payload);

    // 4. Optionally notify other parts of extension
    chrome.runtime.sendMessage({
      type: 'SOMETHING_HAPPENED',
      payload: result
    }).catch(() => {});

    // 5. Return success
    return {
      success: true,
      data: result
    };

  } catch (error) {
    log('handleFeatureName error:', error);
    return { success: false, error: error.message };
  }
}


// ============================================================
// COMMON HANDLER PATTERNS
// ============================================================

// --- CRUD: Get All ---
async function handleGetClips(payload) {
  try {
    let clips = await getAll('clips');

    // Optional filtering
    if (payload?.tagId) {
      const clipTags = await getAll('clip_tags');
      const clipIds = clipTags
        .filter(ct => ct.tagId === payload.tagId)
        .map(ct => ct.clipId);
      clips = clips.filter(c => clipIds.includes(c.id));
    }

    if (payload?.starred) {
      clips = clips.filter(c => c.starred);
    }

    // Sort by date (newest first)
    clips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { success: true, clips };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- CRUD: Delete ---
async function handleDeleteClip(payload) {
  try {
    await remove('clips', payload.clipId);

    // Also remove tag associations
    const clipTags = await getAll('clip_tags');
    for (const ct of clipTags) {
      if (ct.clipId === payload.clipId) {
        await remove('clip_tags', ct.id);
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- CRUD: Update ---
async function handleUpdateClip(payload) {
  try {
    const clip = await get('clips', payload.clipId);
    if (!clip) {
      return { success: false, error: 'Clip not found' };
    }

    // Update fields
    Object.assign(clip, payload.updates);
    clip.updatedAt = new Date().toISOString();

    await put('clips', clip);

    return { success: true, clip };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- Feature Access Check ---
async function handleCheckFeatureAccess(payload) {
  try {
    const hasAccess = await getFeatureAccess(payload.feature);
    const tier = await getTier();

    return {
      success: true,
      hasAccess,
      currentTier: tier,
      requiredTier: FEATURE_TIERS[payload.feature] || 'free'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


// ============================================================
// BROADCAST PATTERN
// ============================================================

// When something happens that other parts of the extension need to know about:
function broadcastUpdate(type, payload) {
  try {
    chrome.runtime.sendMessage({ type, payload }).catch(() => {
      // Ignore errors if no receivers (e.g., sidepanel not open)
    });
  } catch (e) {
    // Ignore
  }
}

// Usage:
// broadcastUpdate('CLIP_ADDED', clip);
// broadcastUpdate('DATA_IMPORTED', {});
// broadcastUpdate('SETTINGS_CHANGED', settings);


// ============================================================
// CONTENT SCRIPT INJECTION
// ============================================================

// For features that need to run code in the page context:
async function injectContentScript(tabId, func, args = []) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func,
      args
    });
    return results[0]?.result;
  } catch (error) {
    log('Content script injection error:', error);
    throw error;
  }
}


// ============================================================
// TAB HELPERS
// ============================================================

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getTabInfo(tabId) {
  const tab = await chrome.tabs.get(tabId);
  return {
    title: tab.title || 'Untitled',
    url: tab.url,
    domain: new URL(tab.url).hostname
  };
}


// ============================================================
// ERROR HANDLING
// ============================================================

// Standardized error responses:
const ERRORS = {
  NOT_FOUND: { success: false, error: 'not_found', message: 'Resource not found' },
  TIER_REQUIRED: (tier) => ({ success: false, error: 'tier_required', requiredTier: tier }),
  API_KEY_REQUIRED: { success: false, error: 'api_key_required', message: 'API key not configured' },
  INVALID_PAYLOAD: (field) => ({ success: false, error: 'invalid_payload', message: `Missing: ${field}` }),
  INTERNAL: (msg) => ({ success: false, error: 'internal_error', message: msg }),
};

// Usage:
// if (!clip) return ERRORS.NOT_FOUND;
// if (!hasAccess) return ERRORS.TIER_REQUIRED('pro');
// if (!apiKey) return ERRORS.API_KEY_REQUIRED;


// ============================================================
// TESTING
// ============================================================
//
// Test messages from browser console:
//
// chrome.runtime.sendMessage({ type: 'GET_CLIPS' }, console.log);
//
// chrome.runtime.sendMessage({
//   type: 'CAPTURE_SELECTION',
//   payload: { content: 'Test content', title: 'Test', url: 'https://example.com' }
// }, console.log);
//
// chrome.runtime.sendMessage({
//   type: 'CHECK_FEATURE_ACCESS',
//   payload: { feature: 'ai-summary' }
// }, console.log);
//
