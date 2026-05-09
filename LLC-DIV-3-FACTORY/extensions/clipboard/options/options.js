// ============================================================
// OPTIONS PAGE — ClipBoard
// User settings, tier display, data export/import.
// ============================================================

import { getSettings, updateSettings } from '../lib/store.js';
import { getTier, getTierInfo, requiresTier } from '../lib/tiers.js';
import { initPayments, openUpgrade, openDonation } from '../lib/payments/extpay-wrapper.js';

// Initialize payments for this context
initPayments();
import { exportLocal, importLocal } from '../lib/backup.js';
import { APP_SLUG, DB_NAME, DB_VERSION, DB_SCHEMA, MESSAGE_TYPES } from '../lib/constants.js';
import { initDB, exportAll, importAll } from '../lib/db.js';
import { init as initDrive } from '../lib/google-drive/drive-client.js';
import { initUI as initDriveUI, renderDriveSection } from '../lib/google-drive/drive-ui.js';

// --- Debug Mode ---
const DEBUG = false;
function log(...args) {
  if (DEBUG) console.log('[ClipBoard Options]', ...args);
}

log('Options page loaded.');

// --- Database Initialization ---
let dbInitialized = false;

async function ensureDB() {
  if (!dbInitialized) {
    await initDB(DB_NAME, DB_VERSION, DB_SCHEMA);
    dbInitialized = true;
    log('Database initialized for export/import');
  }
}

// --- DOM Elements ---
const defaultCaptureSelect = document.getElementById('default-capture');
const autoTagCheckbox = document.getElementById('auto-tag');
const aiProviderSelect = document.getElementById('ai-provider');
const apiKeyInput = document.getElementById('api-key');
const apiKeyToggle = document.getElementById('api-key-toggle');
const apiKeySave = document.getElementById('api-key-save');
const apiKeyStatus = document.getElementById('api-key-status');
const currentTierBadge = document.getElementById('current-tier-badge');
const tierDescription = document.getElementById('tier-description');
const upgradeBtn = document.getElementById('upgrade-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const driveSection = document.getElementById('drive-section');
const fuelBtn = document.getElementById('fuel-btn');

// --- Tier Descriptions ---
const TIER_DESCRIPTIONS = {
  free: 'Text and page capture, tags, search, and local export.',
  starter: 'Everything in Free, plus screenshots, AI summaries, and auto-tagging.',
  pro: 'Everything in Starter, plus marquee capture, AI vision, and Google Drive sync.',
  power: 'Everything in Pro, plus export to InsightForge and priority features.'
};

// --- Load Settings ---
async function loadSettings() {
  const settings = await getSettings();

  // Default capture type
  if (defaultCaptureSelect && settings.defaultCapture) {
    defaultCaptureSelect.value = settings.defaultCapture;
  }

  // Auto-tag
  if (autoTagCheckbox) {
    autoTagCheckbox.checked = settings.autoTag ?? false;
  }

  // AI Provider
  if (aiProviderSelect && settings.aiProvider) {
    aiProviderSelect.value = settings.aiProvider;
  }

  // API Key status
  await loadApiKeyStatus();

  // Load tier
  const tier = await getTier();
  updateTierDisplay(tier);
}

// --- API Key Management ---
async function loadApiKeyStatus() {
  const result = await chrome.storage.local.get(`${APP_SLUG}_ai_api_key`);
  const hasKey = !!result[`${APP_SLUG}_ai_api_key`];

  if (apiKeyStatus) {
    if (hasKey) {
      apiKeyStatus.textContent = 'API key configured';
      apiKeyStatus.style.color = 'var(--oia-sage)';
    } else {
      apiKeyStatus.textContent = 'No API key configured';
      apiKeyStatus.style.color = 'var(--oia-text-muted)';
    }
  }

  // Clear input (never show the actual key)
  if (apiKeyInput) {
    apiKeyInput.value = '';
    apiKeyInput.placeholder = hasKey ? '••••••••••••••••' : 'Enter your API key';
  }
}

// --- Update Tier Display ---
function updateTierDisplay(tier) {
  if (currentTierBadge) {
    const nameEl = currentTierBadge.querySelector('.tier-badge__name');
    if (nameEl) {
      nameEl.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
    }
  }

  if (tierDescription) {
    tierDescription.textContent = TIER_DESCRIPTIONS[tier] || TIER_DESCRIPTIONS.free;
  }

  }

// --- Event Listeners ---

// Default capture type
if (defaultCaptureSelect) {
  defaultCaptureSelect.addEventListener('change', async () => {
    await updateSettings({ defaultCapture: defaultCaptureSelect.value });
    showFeedback('Setting saved');
  });
}

// Auto-tag toggle
if (autoTagCheckbox) {
  autoTagCheckbox.addEventListener('change', async () => {
    await updateSettings({ autoTag: autoTagCheckbox.checked });
    showFeedback('Setting saved');
  });
}

// AI Provider
if (aiProviderSelect) {
  aiProviderSelect.addEventListener('change', async () => {
    await updateSettings({ aiProvider: aiProviderSelect.value });
    showFeedback('Setting saved');
  });
}

// API Key toggle visibility
if (apiKeyToggle && apiKeyInput) {
  apiKeyToggle.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    apiKeyToggle.innerHTML = isPassword
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>`;
  });
}

// API Key save
if (apiKeySave && apiKeyInput) {
  apiKeySave.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      showFeedback('Please enter an API key', 'error');
      return;
    }

    try {
      await chrome.storage.local.set({ [`${APP_SLUG}_ai_api_key`]: key });
      showFeedback('API key saved');
      await loadApiKeyStatus();
    } catch (error) {
      showFeedback("Couldn't save API key — try again?", 'error');
    }
  });

  // Save on Enter
  apiKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      apiKeySave.click();
    }
  });
}

// Upgrade button
if (upgradeBtn) {
  upgradeBtn.addEventListener('click', () => {
    log('Upgrade clicked');
    openUpgrade(); // Opens ExtensionPay payment page
  });
}

// Export button
if (exportBtn) {
  exportBtn.addEventListener('click', async () => {
    try {
      await ensureDB();
      const result = await exportLocal();
      if (result.success) {
        showFeedback(`Exported to ${result.filename}`);
      }
    } catch (error) {
      log('Export error:', error);
      showFeedback('Export failed — try again', 'error');
    }
  });
}

// Import button
if (importBtn && importFile) {
  importBtn.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await ensureDB();
      const result = await importLocal(file);
      if (result.success) {
        showFeedback('Data imported successfully');
        // Notify sidepanel to refresh
        chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DATA_IMPORTED });
      }
    } catch (error) {
      log('Import error:', error);
      showFeedback(error.error || 'Import failed', 'error');
    }

    // Reset file input
    importFile.value = '';
  });
}


// Fuel button (Buy us a coffee)
if (fuelBtn) {
  fuelBtn.addEventListener('click', () => {
    log('Fuel clicked — opening donation page');
    openDonation('coffee');
  });
}

// --- Feedback Toast ---
function showFeedback(message, type = 'success') {
  // Remove existing
  const existing = document.querySelector('.options-feedback');
  if (existing) existing.remove();

  const feedback = document.createElement('div');
  feedback.className = `options-feedback options-feedback--${type}`;
  feedback.textContent = message;
  feedback.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background-color: ${type === 'error' ? 'var(--oia-error)' : 'var(--oia-sage)'};
    color: white;
    border-radius: var(--oia-radius-md);
    font-size: var(--oia-size-body-sm);
    font-weight: var(--oia-weight-semibold);
    box-shadow: var(--oia-shadow-md);
    z-index: 1000;
    animation: oia-fade-in 150ms ease-out;
  `;

  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.style.opacity = '0';
    feedback.style.transition = 'opacity 150ms ease-out';
    setTimeout(() => feedback.remove(), 150);
  }, 2000);
}

// --- Storage Change Listener ---
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  // Reload settings if they changed
  if ('clipboard_settings' in changes || 'clipboard_tier' in changes) {
    loadSettings();
  }
});

// --- Initialize ---
loadSettings();

// --- Google Drive Integration ---
async function initGoogleDrive() {
  // Check tier access
  const hasSyncAccess = await requiresTier('pro');

  if (!driveSection) return;

  if (!hasSyncAccess) {
    // Show upgrade prompt for non-Pro users
    driveSection.innerHTML = `
      <div class="setting-row">
        <div class="setting-info">
          <span class="oia-body">Google Drive Sync</span>
          <span class="oia-caption">Available with Pro plan</span>
        </div>
        <button class="oia-btn oia-btn-secondary" disabled>
          Connect
        </button>
      </div>
    `;
    return;
  }

  try {
    // Get client ID from manifest
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2?.client_id;

    if (!clientId || clientId === 'YOUR_CLIENT_ID.apps.googleusercontent.com') {
      driveSection.innerHTML = `
        <div class="setting-row">
          <div class="setting-info">
            <span class="oia-body">Google Drive Sync</span>
            <span class="oia-caption drive-status--warning">OAuth not configured</span>
          </div>
        </div>
      `;
      log('Google Drive: OAuth client ID not configured');
      return;
    }

    // Initialize Drive client
    initDrive(clientId);

    // Initialize Drive UI
    await ensureDB();

    // Section reference for refresh callbacks
    let section = null;

    initDriveUI({
      appSlug: APP_SLUG,
      onConnect: (result) => {
        log('Connected to Google Drive:', result.email);
        showFeedback('Connected to Google Drive');
        if (section) section._refresh();
      },
      onDisconnect: () => {
        log('Disconnected from Google Drive');
        showFeedback('Disconnected from Google Drive');
        if (section) section._refresh();
      },
      onSync: async () => {
        // Export all data for sync
        const data = await exportAll();
        return data;
      },
      onRestore: async (data, meta) => {
        // Import restored data
        await importAll(data);
        showFeedback('Data restored from ' + new Date(meta.createdAt).toLocaleDateString());
        // Notify sidepanel to refresh
        chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DATA_IMPORTED });
        if (section) section._refresh();
      }
    });

    // Render the Drive section
    section = renderDriveSection({ container: driveSection });

  } catch (error) {
    log('Google Drive init error:', error);
    driveSection.innerHTML = `
      <div class="setting-row">
        <div class="setting-info">
          <span class="oia-body">Google Drive Sync</span>
          <span class="oia-caption drive-status--error">Setup error</span>
        </div>
      </div>
    `;
  }
}

initGoogleDrive();
