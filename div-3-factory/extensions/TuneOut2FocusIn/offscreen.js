// ============================================================
// OFFSCREEN DOCUMENT — Audio Playback Engine
// This document owns the <audio> element and handles playback.
// Communicates with service worker via chrome.runtime messages.
// ============================================================

const audioPlayer = document.getElementById('audioPlayer');

// Audio source map
const AUDIO_SOURCES = {
  white_noise: 'audio/white-noise.mp3',
  gray_noise: 'audio/gray-noise.mp3',
  brown_noise: 'audio/brown-noise.mp3',
  rain: 'audio/rain.mp3'
};

// Sound display names for logging
const SOUND_NAMES = {
  white_noise: 'White Noise',
  gray_noise: 'Gray Noise',
  brown_noise: 'Brown Noise',
  rain: 'Rain'
};

// --- Message Handler ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only handle messages targeted at offscreen
  if (message.target !== 'offscreen') {
    return false;
  }

  const { type, payload } = message;

  switch (type) {
    case 'PLAY_SOUND':
      playSound(payload.soundType, payload.volume);
      sendResponse({ success: true });
      return false;

    case 'STOP_SOUND':
      stopSound();
      sendResponse({ success: true });
      return false;

    case 'SET_VOLUME':
      setVolume(payload.volume);
      sendResponse({ success: true });
      return false;

    default:
      return false;
  }
});

// --- Playback Functions ---
function playSound(soundType, volume = 50) {
  const source = AUDIO_SOURCES[soundType];

  if (!source) {
    console.error('[offscreen] Unknown sound type:', soundType);
    return;
  }

  // Stop current playback if any
  audioPlayer.pause();

  // Set volume (0-1 range)
  audioPlayer.volume = volume / 100;

  // Set new source and play
  audioPlayer.src = source;
  audioPlayer.loop = true;

  audioPlayer.play()
    .then(() => {
      console.log('[offscreen] Playing:', SOUND_NAMES[soundType], 'at volume', volume + '%');
      // Notify service worker that playback started
      chrome.runtime.sendMessage({ type: 'PLAYBACK_STARTED' });
    })
    .catch((error) => {
      console.error('[offscreen] Play error:', error);
    });
}

function setVolume(volume) {
  audioPlayer.volume = volume / 100;
  console.log('[offscreen] Volume set to', volume + '%');
}

function stopSound() {
  audioPlayer.pause();
  audioPlayer.src = '';
  console.log('[offscreen] Sound stopped');

  // Notify service worker that playback stopped
  chrome.runtime.sendMessage({ type: 'PLAYBACK_STOPPED' });
}

// --- Error Handling ---
audioPlayer.addEventListener('error', (e) => {
  console.error('[offscreen] Audio error:', e);
  chrome.runtime.sendMessage({ type: 'PLAYBACK_STOPPED' });
});

console.log('[offscreen] Audio engine ready');
