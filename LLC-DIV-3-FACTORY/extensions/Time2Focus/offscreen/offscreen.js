// ============================================================
// OFFSCREEN.JS — Audio Playback for Time2Focus
// MV3 service workers can't play audio directly, so we use
// an offscreen document.
// ============================================================

const audioPlayer = document.getElementById('audioPlayer');

// Sound file mapping
const SOUNDS = {
  chime: 'sounds/chime.wav',
  bowl: 'sounds/bowl.wav',
  raindrop: 'sounds/raindrop.wav',
  soft_bell: 'sounds/soft_bell.wav'
};

// Listen for play requests from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PLAY_SOUND' && message.target === 'offscreen') {
    const soundKey = message.payload.sound;
    const soundFile = SOUNDS[soundKey];

    if (soundFile) {
      playSound(soundFile);
    } else {
      console.warn('[Time2Focus Offscreen] Unknown sound:', soundKey);
    }
  }
});

function playSound(file) {
  // Use chrome.runtime.getURL to get the full extension URL
  audioPlayer.src = chrome.runtime.getURL(file);
  audioPlayer.volume = 0.7;

  audioPlayer.play().catch((error) => {
    console.error('[Time2Focus Offscreen] Error playing sound:', error);
  });
}

console.log('[Time2Focus Offscreen] Audio handler ready');
