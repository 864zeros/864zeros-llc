// ============================================================
// SIDE PANEL — UI Logic
// Handles user interactions and reflects state from storage.
// ============================================================

// --- Element References ---
const toggleBtn = document.getElementById('toggleBtn');
const statusDisplay = document.getElementById('statusDisplay');
const statusIndicator = document.getElementById('statusIndicator');
const soundButtons = document.querySelectorAll('.sound-btn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const openSettingsBtn = document.getElementById('openSettings');

// --- Sound Display Names ---
const SOUND_NAMES = {
  white_noise: 'White Noise',
  gray_noise: 'Gray Noise',
  brown_noise: 'Brown Noise',
  rain: 'Rain'
};

// --- Storage Keys ---
const STORAGE_KEYS = {
  currentSoundType: 'tuneout_currentSoundType',
  isPlaying: 'tuneout_isPlaying',
  volume: 'tuneout_volume'
};

// --- Initialize ---
async function init() {
  // Get current state
  const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });

  if (response.success) {
    updateUI(response.state);
  }

  // Attach event listeners
  toggleBtn.addEventListener('click', handleToggle);

  soundButtons.forEach((btn) => {
    btn.addEventListener('click', () => handleSoundSelect(btn.dataset.sound));
  });

  // Volume slider
  volumeSlider.addEventListener('input', handleVolumeChange);

  // Settings button
  openSettingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// --- Event Handlers ---
async function handleToggle() {
  toggleBtn.disabled = true;

  const response = await chrome.runtime.sendMessage({ type: 'TOGGLE_PLAYBACK' });

  if (!response.success) {
    console.error('Toggle failed:', response.error);
  }

  toggleBtn.disabled = false;
}

async function handleSoundSelect(soundType) {
  // Disable all sound buttons briefly
  soundButtons.forEach((btn) => (btn.disabled = true));

  const response = await chrome.runtime.sendMessage({
    type: 'CHANGE_SOUND',
    payload: { soundType }
  });

  if (!response.success) {
    console.error('Change sound failed:', response.error);
  }

  // Re-enable buttons
  soundButtons.forEach((btn) => (btn.disabled = false));
}

async function handleVolumeChange() {
  const volume = parseInt(volumeSlider.value, 10);
  volumeValue.textContent = `${volume}%`;

  await chrome.runtime.sendMessage({
    type: 'SET_VOLUME',
    payload: { volume }
  });
}

// --- UI Updates ---
function updateUI(state) {
  const { currentSoundType, isPlaying, volume } = state;

  // Update toggle button
  toggleBtn.textContent = isPlaying ? 'Stop Sound' : 'Start Sound';
  toggleBtn.classList.toggle('is-playing', isPlaying);

  // Update sound button active states
  soundButtons.forEach((btn) => {
    const isActive = btn.dataset.sound === currentSoundType;
    btn.classList.toggle('is-active', isActive);
  });

  // Update status display and indicator
  if (isPlaying) {
    statusDisplay.textContent = `Playing: ${SOUND_NAMES[currentSoundType]}`;
    statusDisplay.classList.add('is-playing');
    statusIndicator.classList.add('is-playing');
  } else {
    statusDisplay.textContent = 'Sound Off';
    statusDisplay.classList.remove('is-playing');
    statusIndicator.classList.remove('is-playing');
  }

  // Update volume slider
  if (volume !== undefined) {
    volumeSlider.value = volume;
    volumeValue.textContent = `${volume}%`;
  }
}

// --- Storage Listener ---
// React to state changes from any source
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  // Build updated state from changes
  const updatedState = {};
  let hasRelevantChanges = false;

  if (changes[STORAGE_KEYS.currentSoundType]) {
    updatedState.currentSoundType = changes[STORAGE_KEYS.currentSoundType].newValue;
    hasRelevantChanges = true;
  }

  if (changes[STORAGE_KEYS.isPlaying]) {
    updatedState.isPlaying = changes[STORAGE_KEYS.isPlaying].newValue;
    hasRelevantChanges = true;
  }

  if (changes[STORAGE_KEYS.volume]) {
    updatedState.volume = changes[STORAGE_KEYS.volume].newValue;
    hasRelevantChanges = true;
  }

  if (hasRelevantChanges) {
    // Get full state and update
    chrome.storage.local.get([
      STORAGE_KEYS.currentSoundType,
      STORAGE_KEYS.isPlaying,
      STORAGE_KEYS.volume
    ]).then((state) => {
      updateUI({
        currentSoundType: state[STORAGE_KEYS.currentSoundType] || 'white_noise',
        isPlaying: state[STORAGE_KEYS.isPlaying] || false,
        volume: state[STORAGE_KEYS.volume] ?? 50
      });
    });
  }
});

// --- Start ---
init();

console.log('[sidepanel] Panel loaded.');
