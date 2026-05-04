/**
 * options.js — Bible Insight Options Page
 *
 * Handles:
 * - Settings persistence
 * - API key management
 * - Data backup/restore
 * - Theme selection
 */

import { APP_SLUG, DEFAULT_SETTINGS, MSG_TYPES } from './lib/constants.js';

// ============================================================
// TOKEN USAGE ELEMENTS
// ============================================================

const tokenElements = {
  inputCount: document.getElementById('tokenInputCount'),
  outputCount: document.getElementById('tokenOutputCount'),
  callCount: document.getElementById('tokenCallCount'),
  lastReset: document.getElementById('tokenLastReset'),
  resetBtn: document.getElementById('resetTokenUsageBtn')
};

// ============================================================
// PAUSE TOGGLE ELEMENTS
// ============================================================

const pauseElements = {
  toggle: document.getElementById('pauseToggle'),
  statusIndicator: document.getElementById('pauseStatusIndicator')
};

// ============================================================
// DOM ELEMENTS
// ============================================================

const elements = {
  // API
  apiKey: document.getElementById('apiKey'),
  bibleApiKey: document.getElementById('bibleApiKey'),

  // Bible settings
  bibleTranslation: document.getElementById('bibleTranslation'),
  autoDetectVerses: document.getElementById('autoDetectVerses'),

  // AI preferences
  aiModeSelect: document.getElementById('aiModeSelect'),
  crossRefSource: document.getElementById('crossRefSource'),

  // Backup
  exportBackupBtn: document.getElementById('exportBackupBtn'),
  importBackupBtn: document.getElementById('importBackupBtn'),
  importFileInput: document.getElementById('importFileInput'),
  storageUsageFill: document.getElementById('storageUsageFill'),
  storageUsageLabel: document.getElementById('storageUsageLabel'),
  storageUsageDetail: document.getElementById('storageUsageDetail'),

  // Report defaults
  stripNavigation: document.getElementById('stripNavigation'),
  cloudAssist: document.getElementById('cloudAssist'),
  autoKeyPoints: document.getElementById('autoKeyPoints'),
  includeVerses: document.getElementById('includeVerses'),
  includeThemes: document.getElementById('includeThemes'),
  exportResearchMarkdown: document.getElementById('exportResearchMarkdown'),

  // Appearance
  themeSelect: document.getElementById('themeSelect'),

  // Actions
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  statusMessage: document.getElementById('statusMessage')
};

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[options] Initializing options page...');

  // Load saved settings
  await loadSettings();

  // Update storage usage
  await updateStorageUsage();

  // Load token usage
  await loadTokenUsage();

  // Load pause state
  await loadPauseState();

  // Set up event listeners
  setupEventListeners();

  // Apply theme
  applyTheme();

  console.log('[options] Options page initialized.');
});

// ============================================================
// SETTINGS MANAGEMENT
// ============================================================

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get([`${APP_SLUG}_settings`]);
    const settings = { ...DEFAULT_SETTINGS, ...result[`${APP_SLUG}_settings`] };

    // Populate form fields
    if (elements.apiKey) elements.apiKey.value = settings.apiKey || '';
    if (elements.bibleApiKey) elements.bibleApiKey.value = settings.bibleApiKey || '';
    if (elements.bibleTranslation) elements.bibleTranslation.value = settings.bibleTranslation || 'KJV';
    if (elements.autoDetectVerses) elements.autoDetectVerses.checked = settings.autoDetectVerses !== false;
    if (elements.aiModeSelect) elements.aiModeSelect.value = settings.aiMode || 'ask';
    if (elements.crossRefSource) elements.crossRefSource.value = settings.crossRefSource || 'treasury';
    if (elements.stripNavigation) elements.stripNavigation.checked = settings.stripNavigation || false;
    if (elements.cloudAssist) elements.cloudAssist.checked = settings.cloudAssist || false;
    if (elements.autoKeyPoints) elements.autoKeyPoints.checked = settings.autoKeyPoints || false;
    if (elements.includeVerses) elements.includeVerses.checked = settings.includeVerses !== false;
    if (elements.includeThemes) elements.includeThemes.checked = settings.includeThemes !== false;
    if (elements.exportResearchMarkdown) elements.exportResearchMarkdown.checked = settings.exportResearchMarkdown || false;
    if (elements.themeSelect) elements.themeSelect.value = settings.theme || 'system';

    console.log('[options] Settings loaded.');
  } catch (error) {
    console.error('[options] Error loading settings:', error);
    showStatus('error', 'Failed to load settings');
  }
}

async function saveSettings() {
  try {
    const settings = {
      apiKey: elements.apiKey?.value?.trim() || '',
      bibleApiKey: elements.bibleApiKey?.value?.trim() || '',
      bibleTranslation: elements.bibleTranslation?.value || 'KJV',
      autoDetectVerses: elements.autoDetectVerses?.checked ?? true,
      aiMode: elements.aiModeSelect?.value || 'ask',
      crossRefSource: elements.crossRefSource?.value || 'treasury',
      stripNavigation: elements.stripNavigation?.checked || false,
      cloudAssist: elements.cloudAssist?.checked || false,
      autoKeyPoints: elements.autoKeyPoints?.checked || false,
      includeVerses: elements.includeVerses?.checked ?? true,
      includeThemes: elements.includeThemes?.checked ?? true,
      exportResearchMarkdown: elements.exportResearchMarkdown?.checked || false,
      theme: elements.themeSelect?.value || 'system'
    };

    await chrome.storage.local.set({ [`${APP_SLUG}_settings`]: settings });

    // Apply theme immediately
    applyTheme();

    showStatus('success', 'Settings saved!');
    console.log('[options] Settings saved.');
  } catch (error) {
    console.error('[options] Error saving settings:', error);
    showStatus('error', 'Failed to save settings');
  }
}

// ============================================================
// THEME
// ============================================================

async function applyTheme() {
  const theme = elements.themeSelect?.value || 'system';

  document.body.classList.remove('dark-mode');

  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else if (theme === 'system') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark-mode');
    }
  }
}

// ============================================================
// STORAGE USAGE
// ============================================================

async function updateStorageUsage() {
  try {
    // Get storage estimate
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
      const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(0);
      const percentage = ((estimate.usage / estimate.quota) * 100).toFixed(1);

      if (elements.storageUsageFill) {
        elements.storageUsageFill.style.width = `${Math.min(percentage, 100)}%`;
      }
      if (elements.storageUsageLabel) {
        elements.storageUsageLabel.textContent = `${usedMB} MB used`;
      }
      if (elements.storageUsageDetail) {
        elements.storageUsageDetail.textContent = `${percentage}% of ${quotaMB} MB quota`;
      }
    }
  } catch (error) {
    console.error('[options] Error getting storage usage:', error);
  }
}

// ============================================================
// TOKEN USAGE
// ============================================================

async function loadTokenUsage() {
  try {
    const response = await sendMessage(MSG_TYPES.GET_TOKEN_USAGE, {});
    if (response.success && response.usage) {
      displayTokenUsage(response.usage);
    }
  } catch (error) {
    console.error('[options] Error loading token usage:', error);
  }
}

function displayTokenUsage(usage) {
  if (tokenElements.inputCount) {
    tokenElements.inputCount.textContent = usage.inputTokens.toLocaleString();
  }
  if (tokenElements.outputCount) {
    tokenElements.outputCount.textContent = usage.outputTokens.toLocaleString();
  }
  if (tokenElements.callCount) {
    tokenElements.callCount.textContent = usage.totalCalls.toLocaleString();
  }
  if (tokenElements.lastReset) {
    const resetDate = new Date(usage.lastReset);
    tokenElements.lastReset.textContent = resetDate.toLocaleString();
  }
}

async function resetTokenUsage() {
  try {
    const response = await sendMessage(MSG_TYPES.RESET_TOKEN_USAGE, {});
    if (response.success) {
      showStatus('success', 'Token usage reset');
      await loadTokenUsage();
    }
  } catch (error) {
    console.error('[options] Error resetting token usage:', error);
    showStatus('error', 'Failed to reset token usage');
  }
}

// ============================================================
// PAUSE TOGGLE
// ============================================================

async function loadPauseState() {
  try {
    const response = await sendMessage(MSG_TYPES.GET_PAUSE_STATE, {});
    if (pauseElements.toggle) {
      pauseElements.toggle.checked = response.isPaused || false;
      updatePauseIndicator(response.isPaused || false);
    }
  } catch (error) {
    console.error('[options] Error loading pause state:', error);
  }
}

async function togglePauseState() {
  const isPaused = pauseElements.toggle?.checked || false;

  try {
    const response = await sendMessage(MSG_TYPES.SET_PAUSE_STATE, { paused: isPaused });
    if (response.success) {
      updatePauseIndicator(response.isPaused);
      showStatus('info', response.isPaused ? 'Extension paused' : 'Extension resumed');
    }
  } catch (error) {
    console.error('[options] Error toggling pause state:', error);
    showStatus('error', 'Failed to toggle pause state');
    // Revert toggle on error
    if (pauseElements.toggle) {
      pauseElements.toggle.checked = !isPaused;
    }
  }
}

function updatePauseIndicator(isPaused) {
  if (pauseElements.statusIndicator) {
    pauseElements.statusIndicator.style.display = isPaused ? 'block' : 'none';
  }
}

// ============================================================
// BACKUP / RESTORE
// ============================================================

async function exportBackup() {
  try {
    showStatus('info', 'Exporting backup...');

    const response = await sendMessage(MSG_TYPES.EXPORT_BACKUP, {});

    if (!response.success) {
      throw new Error(response.error || 'Export failed');
    }

    // Create and download file
    const blob = new Blob([JSON.stringify(response.data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const filename = `bible-insight-backup-${timestamp}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    showStatus('success', 'Backup exported!');
  } catch (error) {
    console.error('[options] Export error:', error);
    showStatus('error', 'Failed to export backup');
  }
}

async function importBackup() {
  elements.importFileInput?.click();
}

async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    showStatus('info', 'Importing backup...');

    const text = await file.text();
    const data = JSON.parse(text);

    // Validate
    if (data.app !== APP_SLUG && data.app !== 'bible-insight') {
      throw new Error('This backup file is not from Bible Insight');
    }

    const response = await sendMessage(MSG_TYPES.IMPORT_BACKUP, { data });

    if (!response.success) {
      throw new Error(response.error || 'Import failed');
    }

    showStatus('success', 'Backup imported!');
    await updateStorageUsage();
  } catch (error) {
    console.error('[options] Import error:', error);
    showStatus('error', error.message || 'Failed to import backup');
  }

  // Reset file input
  event.target.value = '';
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
  elements.saveSettingsBtn?.addEventListener('click', saveSettings);
  elements.exportBackupBtn?.addEventListener('click', exportBackup);
  elements.importBackupBtn?.addEventListener('click', importBackup);
  elements.importFileInput?.addEventListener('change', handleFileImport);

  // Theme preview on change
  elements.themeSelect?.addEventListener('change', applyTheme);

  // Token usage reset
  tokenElements.resetBtn?.addEventListener('click', resetTokenUsage);

  // Pause toggle
  pauseElements.toggle?.addEventListener('change', togglePauseState);
}

// ============================================================
// UTILITIES
// ============================================================

function sendMessage(type, payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

function showStatus(type, message) {
  if (!elements.statusMessage) return;

  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `fhg-status fhg-status-${type}`;
  elements.statusMessage.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      elements.statusMessage.style.display = 'none';
    }, 3000);
  }
}

console.log('[options] Bible Insight options script loaded.');
