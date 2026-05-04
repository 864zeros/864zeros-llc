// ============================================================
// SERVICE WORKER — Time2Focus
// Registers all listeners at TOP LEVEL (MV3 requirement).
// ============================================================

// --- Panel Behavior ---
// Opens the side panel when the user clicks the toolbar icon.
// REQUIRED: This cannot be set in the manifest — only via API.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[Time2Focus] Panel behavior error:', error));

// --- Storage Keys ---
const STORAGE_KEYS = {
  selectedMinutes: 'time2focus_selectedMinutes',
  focusTopic: 'time2focus_focusTopic',
  alertSound: 'time2focus_alertSound',
  flashColor: 'time2focus_flashColor',
  timerState: 'time2focus_timerState',
  endTime: 'time2focus_endTime',
  notificationsEnabled: 'time2focus_notificationsEnabled'
};

// --- Default Values ---
const DEFAULTS = {
  selectedMinutes: 25,
  focusTopic: '',
  alertSound: 'chime',
  flashColor: '#717D71',
  timerState: 'idle',
  endTime: null,
  notificationsEnabled: true
};

// --- Install / Update ---
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    // Initialize default state on first install
    chrome.storage.local.set({
      [STORAGE_KEYS.selectedMinutes]: DEFAULTS.selectedMinutes,
      [STORAGE_KEYS.focusTopic]: DEFAULTS.focusTopic,
      [STORAGE_KEYS.alertSound]: DEFAULTS.alertSound,
      [STORAGE_KEYS.flashColor]: DEFAULTS.flashColor,
      [STORAGE_KEYS.timerState]: DEFAULTS.timerState,
      [STORAGE_KEYS.endTime]: DEFAULTS.endTime,
      [STORAGE_KEYS.notificationsEnabled]: DEFAULTS.notificationsEnabled
    });
    console.log('[Time2Focus] Extension installed. Default state set.');
  }
  if (reason === 'update') {
    console.log('[Time2Focus] Extension updated.');
  }
});

// --- Alarm Listener ---
// Handles timer completion
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'focusTimer') {
    console.log('[Time2Focus] Timer complete!');

    // Update state to done
    await chrome.storage.local.set({
      [STORAGE_KEYS.timerState]: 'done'
    });

    // Get current settings
    const data = await chrome.storage.local.get([
      STORAGE_KEYS.focusTopic,
      STORAGE_KEYS.alertSound,
      STORAGE_KEYS.notificationsEnabled
    ]);

    // Play sound via offscreen document
    try {
      await playAlertSound(data[STORAGE_KEYS.alertSound] || 'chime');
    } catch (error) {
      console.error('[Time2Focus] Error playing sound:', error);
    }

    // Fire notification if enabled
    if (data[STORAGE_KEYS.notificationsEnabled]) {
      const focusTopic = data[STORAGE_KEYS.focusTopic] || 'your task';
      chrome.notifications.create('timerComplete', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Time2Focus',
        message: `Time's up! You were focused on: ${focusTopic}`,
        priority: 2
      });
    }

    // Notify side panel to start flash animation
    chrome.runtime.sendMessage({ type: 'TIMER_COMPLETE' }).catch(() => {
      // Panel might not be open, that's okay
    });
  }
});

// --- Message Relay ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {
    case 'START_TIMER':
      handleStartTimer(payload, sendResponse);
      return true;

    case 'CANCEL_TIMER':
      handleCancelTimer(sendResponse);
      return true;

    case 'PLAY_SOUND_PREVIEW':
      playAlertSound(payload.sound).then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
      return true;

    default:
      return false;
  }
});

// --- Handlers ---
async function handleStartTimer(payload, sendResponse) {
  try {
    const { minutes } = payload;
    const endTime = Date.now() + (minutes * 60 * 1000);

    // Clear any existing timer
    await chrome.alarms.clear('focusTimer');

    // Create new alarm
    await chrome.alarms.create('focusTimer', { when: endTime });

    // Update storage
    await chrome.storage.local.set({
      [STORAGE_KEYS.timerState]: 'running',
      [STORAGE_KEYS.endTime]: endTime,
      [STORAGE_KEYS.selectedMinutes]: minutes
    });

    console.log(`[Time2Focus] Timer started for ${minutes} minutes`);
    sendResponse({ success: true, endTime });
  } catch (error) {
    console.error('[Time2Focus] Error starting timer:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCancelTimer(sendResponse) {
  try {
    await chrome.alarms.clear('focusTimer');
    await chrome.storage.local.set({
      [STORAGE_KEYS.timerState]: 'idle',
      [STORAGE_KEYS.endTime]: null
    });
    console.log('[Time2Focus] Timer cancelled');
    sendResponse({ success: true });
  } catch (error) {
    console.error('[Time2Focus] Error cancelling timer:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// --- Offscreen Document for Audio ---
let creatingOffscreen;

async function setupOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (creatingOffscreen) {
    await creatingOffscreen;
  } else {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: 'offscreen/offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Play timer completion alert sound'
    });
    await creatingOffscreen;
    creatingOffscreen = null;
  }
}

async function playAlertSound(soundKey) {
  await setupOffscreenDocument();
  await chrome.runtime.sendMessage({
    type: 'PLAY_SOUND',
    target: 'offscreen',
    payload: { sound: soundKey }
  });
}
