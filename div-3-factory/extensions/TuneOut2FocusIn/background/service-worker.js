// ============================================================
// SERVICE WORKER — TuneOut2FocusIn (Panel Extension)
// Registers all listeners at the TOP LEVEL (MV3 requirement).
// Routes messages between sidepanel and offscreen document.
// ============================================================

// --- Panel Behavior ---
// Opens the side panel when the user clicks the toolbar icon.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[service-worker] Panel behavior error:', error));

// --- Constants ---
const STORAGE_KEYS = {
  currentSoundType: 'tuneout_currentSoundType',
  isPlaying: 'tuneout_isPlaying',
  volume: 'tuneout_volume'
};

const DEFAULT_STATE = {
  currentSoundType: 'white_noise',
  isPlaying: false,
  volume: 50
};

// --- Offscreen Document Management ---
let creatingOffscreen = null;

async function ensureOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');

  // Check if offscreen document already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return; // Already exists
  }

  // Prevent race condition when creating
  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  creatingOffscreen = chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Playing background noise for focus'
  });

  await creatingOffscreen;
  creatingOffscreen = null;
}

// --- Install / Update ---
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    // Initialize default state
    await chrome.storage.local.set({
      [STORAGE_KEYS.currentSoundType]: DEFAULT_STATE.currentSoundType,
      [STORAGE_KEYS.isPlaying]: DEFAULT_STATE.isPlaying,
      [STORAGE_KEYS.volume]: DEFAULT_STATE.volume
    });
    console.log('[service-worker] Extension installed. Default state set.');
  }

  if (reason === 'update') {
    console.log('[service-worker] Extension updated.');
  }
});

// --- Startup: Resume playback if it was playing ---
chrome.runtime.onStartup.addListener(async () => {
  const state = await chrome.storage.local.get([
    STORAGE_KEYS.currentSoundType,
    STORAGE_KEYS.isPlaying,
    STORAGE_KEYS.volume
  ]);

  if (state[STORAGE_KEYS.isPlaying]) {
    await ensureOffscreenDocument();
    chrome.runtime.sendMessage({
      type: 'PLAY_SOUND',
      target: 'offscreen',
      payload: {
        soundType: state[STORAGE_KEYS.currentSoundType],
        volume: state[STORAGE_KEYS.volume] ?? DEFAULT_STATE.volume
      }
    });
  }
});

// --- Message Relay ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {
    case 'TOGGLE_PLAYBACK':
      handleTogglePlayback(sendResponse);
      return true;

    case 'CHANGE_SOUND':
      handleChangeSound(payload, sendResponse);
      return true;

    case 'GET_STATE':
      handleGetState(sendResponse);
      return true;

    case 'SET_VOLUME':
      handleSetVolume(payload, sendResponse);
      return true;

    case 'PLAYBACK_STARTED':
      // Offscreen confirms playback started
      chrome.storage.local.set({ [STORAGE_KEYS.isPlaying]: true });
      return false;

    case 'PLAYBACK_STOPPED':
      // Offscreen confirms playback stopped
      chrome.storage.local.set({ [STORAGE_KEYS.isPlaying]: false });
      return false;

    default:
      return false;
  }
});

// --- Handlers ---
async function handleTogglePlayback(sendResponse) {
  try {
    const state = await chrome.storage.local.get([
      STORAGE_KEYS.currentSoundType,
      STORAGE_KEYS.isPlaying
    ]);

    const isPlaying = state[STORAGE_KEYS.isPlaying];
    const soundType = state[STORAGE_KEYS.currentSoundType] || DEFAULT_STATE.currentSoundType;

    const volume = (await chrome.storage.local.get(STORAGE_KEYS.volume))[STORAGE_KEYS.volume] ?? DEFAULT_STATE.volume;

    if (isPlaying) {
      // Stop playback
      chrome.runtime.sendMessage({
        type: 'STOP_SOUND',
        target: 'offscreen'
      });
    } else {
      // Start playback
      await ensureOffscreenDocument();
      chrome.runtime.sendMessage({
        type: 'PLAY_SOUND',
        target: 'offscreen',
        payload: { soundType, volume }
      });
    }

    sendResponse({ success: true });
  } catch (error) {
    console.error('[service-worker] Toggle error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleChangeSound(payload, sendResponse) {
  try {
    const { soundType } = payload;

    // Update stored sound type
    await chrome.storage.local.set({
      [STORAGE_KEYS.currentSoundType]: soundType
    });

    // If playing, switch to new sound
    const state = await chrome.storage.local.get([STORAGE_KEYS.isPlaying, STORAGE_KEYS.volume]);
    if (state[STORAGE_KEYS.isPlaying]) {
      await ensureOffscreenDocument();
      chrome.runtime.sendMessage({
        type: 'PLAY_SOUND',
        target: 'offscreen',
        payload: {
          soundType,
          volume: state[STORAGE_KEYS.volume] ?? DEFAULT_STATE.volume
        }
      });
    }

    sendResponse({ success: true });
  } catch (error) {
    console.error('[service-worker] Change sound error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetState(sendResponse) {
  try {
    const state = await chrome.storage.local.get([
      STORAGE_KEYS.currentSoundType,
      STORAGE_KEYS.isPlaying,
      STORAGE_KEYS.volume
    ]);

    sendResponse({
      success: true,
      state: {
        currentSoundType: state[STORAGE_KEYS.currentSoundType] || DEFAULT_STATE.currentSoundType,
        isPlaying: state[STORAGE_KEYS.isPlaying] || DEFAULT_STATE.isPlaying,
        volume: state[STORAGE_KEYS.volume] ?? DEFAULT_STATE.volume
      }
    });
  } catch (error) {
    console.error('[service-worker] Get state error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSetVolume(payload, sendResponse) {
  try {
    const { volume } = payload;

    // Save to storage
    await chrome.storage.local.set({
      [STORAGE_KEYS.volume]: volume
    });

    // Send to offscreen if it exists
    chrome.runtime.sendMessage({
      type: 'SET_VOLUME',
      target: 'offscreen',
      payload: { volume }
    }).catch(() => {
      // Offscreen may not exist yet, that's fine
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[service-worker] Set volume error:', error);
    sendResponse({ success: false, error: error.message });
  }
}
