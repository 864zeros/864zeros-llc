// ============================================================
// SIDEPANEL.JS — Time2Focus UI Logic
// ============================================================

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

// --- DOM Elements ---
const elements = {
  focusTopicInput: document.getElementById('focusTopicInput'),
  countdownDisplay: document.getElementById('countdownDisplay'),
  btnCancel: document.getElementById('btnCancel'),
  btnOpenOptions: document.getElementById('btnOpenOptions'),
  flashOverlay: document.getElementById('flashOverlay'),
  toggleNotify: document.getElementById('toggleNotify'),
  timerButtons: document.querySelectorAll('.timer-btn'),
  soundOptions: document.querySelectorAll('.sound-option'),
  colorSwatches: document.querySelectorAll('.color-swatch')
};

// --- State ---
let countdownInterval = null;
let currentState = {
  timerState: 'idle',
  endTime: null,
  selectedMinutes: 25,
  focusTopic: '',
  alertSound: 'chime',
  flashColor: '#717D71',
  notificationsEnabled: true
};

// --- Initialize ---
async function init() {
  console.log('[Time2Focus] Panel loaded');

  // Load state from storage
  await loadState();

  // Render initial UI
  renderUI();

  // Attach event listeners
  attachEventListeners();

  // Start countdown if timer is running
  if (currentState.timerState === 'running' && currentState.endTime) {
    startCountdownDisplay();
  }

  // Show flash if timer is done
  if (currentState.timerState === 'done') {
    startFlashAnimation();
  }
}

// --- Load State from Storage ---
async function loadState() {
  const data = await chrome.storage.local.get(Object.values(STORAGE_KEYS));

  currentState.timerState = data[STORAGE_KEYS.timerState] || 'idle';
  currentState.endTime = data[STORAGE_KEYS.endTime] || null;
  currentState.selectedMinutes = data[STORAGE_KEYS.selectedMinutes] || 25;
  currentState.focusTopic = data[STORAGE_KEYS.focusTopic] || '';
  currentState.alertSound = data[STORAGE_KEYS.alertSound] || 'chime';
  currentState.flashColor = data[STORAGE_KEYS.flashColor] || '#717D71';
  currentState.notificationsEnabled = data[STORAGE_KEYS.notificationsEnabled] !== false;
}

// --- Render UI ---
function renderUI() {
  // Focus topic
  elements.focusTopicInput.value = currentState.focusTopic;

  // Timer buttons - highlight selected
  elements.timerButtons.forEach(btn => {
    const minutes = parseInt(btn.dataset.minutes);
    btn.classList.toggle('active',
      currentState.timerState === 'running' &&
      currentState.selectedMinutes === minutes
    );
  });

  // Cancel button visibility
  elements.btnCancel.style.display =
    currentState.timerState === 'running' ? 'block' : 'none';

  // Countdown display
  if (currentState.timerState === 'idle') {
    elements.countdownDisplay.textContent = '--:--';
  }

  // Sound options
  elements.soundOptions.forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.sound === currentState.alertSound);
  });

  // Color swatches
  elements.colorSwatches.forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.color === currentState.flashColor);
  });

  // Notification toggle
  elements.toggleNotify.checked = currentState.notificationsEnabled;

  // Flash overlay color
  elements.flashOverlay.style.setProperty('--flash-color', currentState.flashColor);
}

// --- Event Listeners ---
function attachEventListeners() {
  // Focus topic input - save on change
  elements.focusTopicInput.addEventListener('input', debounce(async (e) => {
    currentState.focusTopic = e.target.value;
    await chrome.storage.local.set({
      [STORAGE_KEYS.focusTopic]: currentState.focusTopic
    });
  }, 300));

  // Timer buttons
  elements.timerButtons.forEach(btn => {
    btn.addEventListener('click', () => startTimer(parseInt(btn.dataset.minutes)));
  });

  // Cancel button
  elements.btnCancel.addEventListener('click', cancelTimer);

  // Open options page
  elements.btnOpenOptions.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Sound options
  elements.soundOptions.forEach(btn => {
    btn.addEventListener('click', () => selectSound(btn.dataset.sound));
  });

  // Color swatches
  elements.colorSwatches.forEach(btn => {
    btn.addEventListener('click', () => selectColor(btn.dataset.color));
  });

  // Notification toggle
  elements.toggleNotify.addEventListener('change', async (e) => {
    currentState.notificationsEnabled = e.target.checked;
    await chrome.storage.local.set({
      [STORAGE_KEYS.notificationsEnabled]: currentState.notificationsEnabled
    });
  });

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TIMER_COMPLETE') {
      currentState.timerState = 'done';
      stopCountdownDisplay();
      startFlashAnimation();
      renderUI();
    }
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes[STORAGE_KEYS.timerState]) {
      currentState.timerState = changes[STORAGE_KEYS.timerState].newValue;
      renderUI();
    }
  });

  // Click anywhere to clear flash
  document.addEventListener('click', (e) => {
    // Don't clear if clicking settings or options button
    if (e.target.closest('.panel-header__settings')) return;

    if (currentState.timerState === 'done') {
      clearFlashAndReset();
    }
  });
}

// --- Timer Functions ---
async function startTimer(minutes) {
  // Clear any existing flash
  if (currentState.timerState === 'done') {
    stopFlashAnimation();
  }

  const response = await chrome.runtime.sendMessage({
    type: 'START_TIMER',
    payload: { minutes }
  });

  if (response.success) {
    currentState.timerState = 'running';
    currentState.endTime = response.endTime;
    currentState.selectedMinutes = minutes;
    renderUI();
    startCountdownDisplay();
  }
}

async function cancelTimer() {
  const response = await chrome.runtime.sendMessage({ type: 'CANCEL_TIMER' });

  if (response.success) {
    currentState.timerState = 'idle';
    currentState.endTime = null;
    stopCountdownDisplay();
    renderUI();
  }
}

// --- Countdown Display ---
function startCountdownDisplay() {
  stopCountdownDisplay();

  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

function stopCountdownDisplay() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function updateCountdown() {
  if (!currentState.endTime) return;

  const remaining = currentState.endTime - Date.now();

  if (remaining <= 0) {
    elements.countdownDisplay.textContent = '00:00';
    stopCountdownDisplay();
    return;
  }

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  elements.countdownDisplay.textContent =
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// --- Flash Animation ---
function startFlashAnimation() {
  elements.flashOverlay.classList.add('flashing');
}

function stopFlashAnimation() {
  elements.flashOverlay.classList.remove('flashing');
}

async function clearFlashAndReset() {
  stopFlashAnimation();
  currentState.timerState = 'idle';
  await chrome.storage.local.set({
    [STORAGE_KEYS.timerState]: 'idle'
  });
  renderUI();
}

// --- Settings ---
async function selectSound(sound) {
  currentState.alertSound = sound;
  await chrome.storage.local.set({
    [STORAGE_KEYS.alertSound]: sound
  });
  renderUI();

  // Play preview
  chrome.runtime.sendMessage({
    type: 'PLAY_SOUND_PREVIEW',
    payload: { sound }
  });
}

async function selectColor(color) {
  currentState.flashColor = color;
  await chrome.storage.local.set({
    [STORAGE_KEYS.flashColor]: color
  });
  renderUI();
}

// --- Utilities ---
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// --- Start ---
init();
