// ============================================================
// OPTIONS PAGE — Settings Logic
// Handles user preferences and persists to chrome.storage.local
// ============================================================

// --- Storage Keys ---
const STORAGE_KEYS = {
  currentSoundType: 'tuneout_currentSoundType',
  volume: 'tuneout_volume'
};

// --- Element References ---
const soundRadios = document.querySelectorAll('input[name="defaultSound"]');
const volumeSlider = document.getElementById('defaultVolume');
const volumeDisplay = document.getElementById('volumeDisplay');
const saveStatus = document.getElementById('saveStatus');

// --- Initialize ---
async function init() {
  // Load current settings
  const state = await chrome.storage.local.get([
    STORAGE_KEYS.currentSoundType,
    STORAGE_KEYS.volume
  ]);

  // Set default sound radio
  const currentSound = state[STORAGE_KEYS.currentSoundType] || 'white_noise';
  const radioToCheck = document.querySelector(`input[value="${currentSound}"]`);
  if (radioToCheck) {
    radioToCheck.checked = true;
  }

  // Set volume slider
  const currentVolume = state[STORAGE_KEYS.volume] ?? 50;
  volumeSlider.value = currentVolume;
  volumeDisplay.textContent = `${currentVolume}%`;

  // Attach event listeners
  soundRadios.forEach((radio) => {
    radio.addEventListener('change', handleSoundChange);
  });

  volumeSlider.addEventListener('input', handleVolumeChange);
}

// --- Event Handlers ---
async function handleSoundChange(event) {
  const selectedSound = event.target.value;

  await chrome.storage.local.set({
    [STORAGE_KEYS.currentSoundType]: selectedSound
  });

  showSaveStatus();
}

async function handleVolumeChange() {
  const volume = parseInt(volumeSlider.value, 10);
  volumeDisplay.textContent = `${volume}%`;

  await chrome.storage.local.set({
    [STORAGE_KEYS.volume]: volume
  });

  // Also update live playback if playing
  chrome.runtime.sendMessage({
    type: 'SET_VOLUME',
    payload: { volume }
  }).catch(() => {
    // Extension context may not be ready
  });

  showSaveStatus();
}

// --- UI Helpers ---
let saveTimeout = null;

function showSaveStatus() {
  // Clear any existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Show the toast
  saveStatus.classList.add('is-visible');

  // Hide after 2 seconds
  saveTimeout = setTimeout(() => {
    saveStatus.classList.remove('is-visible');
  }, 2000);
}

// --- Start ---
init();

console.log('[options] Options page loaded.');
