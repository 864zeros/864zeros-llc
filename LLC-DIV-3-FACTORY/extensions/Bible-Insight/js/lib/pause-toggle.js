/**
 * pause-toggle.js — Reusable Extension Pause Module
 * 864zeros Build Kit
 *
 * Provides a simple pause/resume mechanism for Chrome extensions.
 * When paused, heavy operations (AI calls, content processing, etc.) are skipped.
 *
 * Usage in background.js:
 *   import { isPaused, setPaused, getPauseState, wrapWithPauseCheck } from './lib/pause-toggle.js';
 *
 *   // Check before expensive operations:
 *   if (isPaused()) {
 *     console.log('[background] Skipping operation - extension paused');
 *     return;
 *   }
 *
 *   // Or wrap entire handlers:
 *   const handleAIOperation = wrapWithPauseCheck(async (payload) => {
 *     // This only runs if not paused
 *   });
 *
 * Features:
 * - In-memory state (no persistence - resets on browser restart)
 * - Message handlers for SET_PAUSE_STATE / GET_PAUSE_STATE
 * - Helper to wrap functions with pause check
 * - Console logging for debug visibility
 */

// ============================================================
// STATE (in-memory only - resets on service worker restart)
// ============================================================

let _isPaused = false;

// ============================================================
// CORE API
// ============================================================

/**
 * Check if the extension is currently paused.
 * @returns {boolean}
 */
export function isPaused() {
  return _isPaused;
}

/**
 * Set the pause state.
 * @param {boolean} paused - True to pause, false to resume
 */
export function setPaused(paused) {
  const wasChanged = _isPaused !== paused;
  _isPaused = paused;

  if (wasChanged) {
    console.log(`[pause-toggle] Extension ${paused ? 'PAUSED' : 'RESUMED'}`);
  }

  return { success: true, isPaused: _isPaused };
}

/**
 * Get the current pause state.
 * @returns {{ isPaused: boolean }}
 */
export function getPauseState() {
  return { isPaused: _isPaused };
}

// ============================================================
// WRAPPER UTILITY
// ============================================================

/**
 * Wrap a function to skip execution when paused.
 * Returns a "paused" response instead of executing.
 *
 * @param {Function} fn - The async function to wrap
 * @param {string} [operationName] - Optional name for logging
 * @returns {Function} - Wrapped function
 *
 * @example
 * const handleAnalyze = wrapWithPauseCheck(async (payload) => {
 *   const result = await callAI(payload);
 *   return { success: true, result };
 * }, 'AI Analysis');
 */
export function wrapWithPauseCheck(fn, operationName = 'Operation') {
  return async (...args) => {
    if (_isPaused) {
      console.log(`[pause-toggle] Skipped: ${operationName} (extension paused)`);
      return {
        success: false,
        paused: true,
        error: 'Extension is paused. Resume in Settings to continue.'
      };
    }
    return fn(...args);
  };
}

// ============================================================
// MESSAGE HANDLER INTEGRATION
// ============================================================

/**
 * Standard message types for pause toggle.
 * Add these to your constants.js MSG_TYPES object.
 */
export const PAUSE_MSG_TYPES = {
  SET_PAUSE_STATE: 'SET_PAUSE_STATE',
  GET_PAUSE_STATE: 'GET_PAUSE_STATE'
};

/**
 * Handle pause-related messages in your onMessage listener.
 * Call this from your switch statement.
 *
 * @param {string} type - Message type
 * @param {Object} payload - Message payload
 * @param {Function} sendResponse - Response callback
 * @returns {boolean|null} - Return true if handled (for async), null if not a pause message
 *
 * @example
 * chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
 *   const pauseHandled = handlePauseMessage(message.type, message.payload, sendResponse);
 *   if (pauseHandled !== null) return pauseHandled;
 *   // ... rest of your switch statement
 * });
 */
export function handlePauseMessage(type, payload, sendResponse) {
  switch (type) {
    case PAUSE_MSG_TYPES.SET_PAUSE_STATE:
      const result = setPaused(payload?.paused ?? false);
      sendResponse(result);
      return false; // Synchronous response

    case PAUSE_MSG_TYPES.GET_PAUSE_STATE:
      sendResponse(getPauseState());
      return false; // Synchronous response

    default:
      return null; // Not a pause message
  }
}

// ============================================================
// DOCUMENTATION
// ============================================================

/**
 * INTEGRATION CHECKLIST:
 *
 * 1. constants.js - Add to MSG_TYPES:
 *    SET_PAUSE_STATE: 'SET_PAUSE_STATE',
 *    GET_PAUSE_STATE: 'GET_PAUSE_STATE'
 *
 * 2. background.js - Import and integrate:
 *    import { isPaused, handlePauseMessage, wrapWithPauseCheck } from './lib/pause-toggle.js';
 *
 *    // In onMessage listener, add at top of switch:
 *    const pauseHandled = handlePauseMessage(type, payload, sendResponse);
 *    if (pauseHandled !== null) return pauseHandled;
 *
 *    // Wrap expensive operations:
 *    if (isPaused()) return { success: false, paused: true };
 *
 * 3. options.html - Add toggle UI in Advanced section:
 *    <div class="setting">
 *      <label class="toggle-label">
 *        <span>Pause Extension</span>
 *        <input type="checkbox" id="pauseToggle">
 *        <span class="toggle-slider"></span>
 *      </label>
 *      <p class="help-text">Stops all background processing for this session.</p>
 *    </div>
 *
 * 4. options.js - Wire up toggle:
 *    const pauseToggle = document.getElementById('pauseToggle');
 *    pauseToggle.addEventListener('change', async () => {
 *      await sendMessage('SET_PAUSE_STATE', { paused: pauseToggle.checked });
 *    });
 *    // Load initial state on page load
 *    const state = await sendMessage('GET_PAUSE_STATE', {});
 *    pauseToggle.checked = state.isPaused;
 *
 * 5. panel.js - Show indicator when paused:
 *    const state = await sendMessage('GET_PAUSE_STATE', {});
 *    if (state.isPaused) {
 *      showPausedBanner();
 *    }
 */
