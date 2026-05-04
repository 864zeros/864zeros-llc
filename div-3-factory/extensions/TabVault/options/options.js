// ============================================================
// OPTIONS — TabVault Settings Page
// Settings management, import/export, vault management
// ============================================================

import { MESSAGE_TYPES, STORAGE_KEYS, APP_SLUG } from '../lib/constants.js';
import { init as initDrive } from '../lib/google-drive/drive-client.js';
import { initUI as initDriveUI, renderDriveSection } from '../lib/google-drive/drive-ui.js';
import { canAccessFeature, getTierConfig } from '../lib/payments/tiers.js';
import { openUpgrade, getCurrentTier, openDonation } from '../lib/payments/extpay-wrapper.js';

// --- DOM Elements ---
const deepSleepEnabled = document.getElementById('deepSleepEnabled');
const inactivityMinutes = document.getElementById('inactivityMinutes');
const oneTabInput = document.getElementById('oneTabInput');
const importOneTabButton = document.getElementById('importOneTab');
const importStatus = document.getElementById('importStatus');
const vaultCountLabel = document.getElementById('vault-count-label');
const clearAllButton = document.getElementById('clearAllVaultedTabs');
const confirmContainer = document.getElementById('confirmContainer');
const exportVaultButton = document.getElementById('exportVault');
const importVaultButton = document.getElementById('importVault');
const importFile = document.getElementById('importFile');
const fuelBtn = document.getElementById('fuel-btn');

// --- Message Helper ---
function sendMessage(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      if (!response.success) {
        return reject(new Error(response.error || 'Unknown error'));
      }
      resolve(response);
    });
  });
}

// --- Toast Notifications ---
function showToast(message, type = 'success') {
  document.querySelectorAll('.options-toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `options-toast oia-toast oia-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

// --- Inline Confirmation (no browser dialogs) ---
function showConfirmation(message, onConfirm, onCancel) {
  confirmContainer.innerHTML = `
    <div class="confirm-dialog oia-card oia-animate-slide-up">
      <p class="oia-body oia-mb-md">${message}</p>
      <div class="confirm-actions">
        <button class="oia-btn oia-btn-secondary confirm-cancel" style="flex: 1;">Cancel</button>
        <button class="oia-btn oia-btn-primary confirm-yes" style="flex: 1; background-color: var(--oia-error);">Yes, Clear All</button>
      </div>
    </div>
  `;
  confirmContainer.style.display = 'block';

  confirmContainer.querySelector('.confirm-cancel').onclick = () => {
    confirmContainer.style.display = 'none';
    confirmContainer.innerHTML = '';
    if (onCancel) onCancel();
  };

  confirmContainer.querySelector('.confirm-yes').onclick = () => {
    confirmContainer.style.display = 'none';
    confirmContainer.innerHTML = '';
    onConfirm();
  };
}

// --- Load Settings ---
async function loadSettings() {
  try {
    const response = await sendMessage('TABVAULT_GET_SETTINGS');
    const settings = response.data || {};

    if (deepSleepEnabled) {
      deepSleepEnabled.checked = settings.deepSleepEnabled !== false;
    }
    if (inactivityMinutes) {
      inactivityMinutes.value = settings.inactivityMinutes || 20;
    }
  } catch (err) {
    console.error('[options] Load settings error:', err);
  }
}

// --- Save Settings ---
async function saveSettings() {
  try {
    await sendMessage('TABVAULT_UPDATE_SETTINGS', {
      deepSleepEnabled: deepSleepEnabled.checked,
      inactivityMinutes: parseInt(inactivityMinutes.value, 10) || 20
    });
    showToast('Setting saved');
  } catch (err) {
    console.error('[options] Save settings error:', err);
    showToast('Could not save settings', 'error');
  }
}

// --- Update Vault Count ---
async function updateVaultCount() {
  try {
    const response = await sendMessage(MESSAGE_TYPES.GET_CONTENTS);
    const tabs = response.data || [];
    if (vaultCountLabel) {
      vaultCountLabel.textContent = `${tabs.length} tab${tabs.length !== 1 ? 's' : ''} in your vault`;
    }
  } catch (err) {
    console.error('[options] Count error:', err);
  }
}

// --- OneTab Import (with Session Groups) ---
async function importOneTab() {
  const text = oneTabInput.value.trim();

  if (!text) {
    importStatus.textContent = 'Paste your OneTab data above';
    importStatus.className = 'import-status warning';
    return;
  }

  const parsedGroups = parseOneTabExport(text);

  if (parsedGroups.length === 0) {
    importStatus.textContent = 'No valid URLs found';
    importStatus.className = 'import-status warning';
    return;
  }

  try {
    let totalTabs = 0;
    let groupCount = 0;

    for (const group of parsedGroups) {
      if (group.tabs.length === 0) continue;

      // Import each group with its groupId and groupName
      await sendMessage('TABVAULT_VAULT_MULTIPLE', {
        tabs: group.tabs,
        groupId: group.groupId,
        groupName: group.groupName
      });

      totalTabs += group.tabs.length;
      groupCount++;
    }

    const groupText = groupCount > 1 ? ` in ${groupCount} groups` : '';
    importStatus.textContent = `Imported ${totalTabs} tabs${groupText}`;
    importStatus.className = 'import-status success';
    oneTabInput.value = '';
    updateVaultCount();
  } catch (err) {
    console.error('[options] Import error:', err);
    importStatus.textContent = 'Import failed';
    importStatus.className = 'import-status error';
  }
}

// --- Parse OneTab Format (with Group Detection) ---
// Double newlines indicate session group boundaries
function parseOneTabExport(text) {
  // Split by double newlines to identify separate groups
  const rawGroups = text.trim().split(/\n\s*\n/);
  const timestamp = Date.now();

  return rawGroups.map((groupText, index) => {
    const lines = groupText.split('\n').filter(line => line.trim() !== '');
    const tabs = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Try "url | title" format
      const pipeIndex = trimmed.indexOf(' | ');
      if (pipeIndex > 0) {
        const url = trimmed.slice(0, pipeIndex).trim();
        const title = trimmed.slice(pipeIndex + 3).trim() || url;
        if (isValidUrl(url)) {
          tabs.push({
            url,
            title,
            vaultedAt: timestamp,
            scrollX: 0,
            scrollY: 0
          });
        }
      } else if (isValidUrl(trimmed)) {
        // Bare URL - use URL as title
        tabs.push({
          url: trimmed,
          title: trimmed,
          vaultedAt: timestamp,
          scrollX: 0,
          scrollY: 0
        });
      }
    }

    // Generate group name: "Imported Feb 16, 3:42 PM (#1)"
    const dateStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return {
      groupId: `imported_${timestamp}_${index}`,
      groupName: rawGroups.length > 1
        ? `Imported ${dateStr} (#${index + 1})`
        : `Imported ${dateStr}`,
      tabs
    };
  }).filter(group => group.tabs.length > 0);
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// --- Clear All ---
async function clearAllVaultedTabs() {
  showConfirmation(
    'This will remove all tabs from your vault. This cannot be undone.',
    async () => {
      try {
        await sendMessage(MESSAGE_TYPES.CLEAR_VAULT);
        showToast('Vault cleared');
        updateVaultCount();
      } catch (err) {
        console.error('[options] Clear error:', err);
        showToast('Could not clear vault', 'error');
      }
    }
  );
}

// --- Export Vault ---
async function exportVault() {
  try {
    const response = await sendMessage(MESSAGE_TYPES.GET_CONTENTS);
    const tabs = response.data || [];

    if (tabs.length === 0) {
      showToast('Nothing to export', 'warning');
      return;
    }

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      source: 'TabVault',
      tabCount: tabs.length,
      tabs: tabs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const filename = `tabvault-backup-${new Date().toISOString().slice(0, 10)}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
    showToast(`Exported ${tabs.length} tabs`);
  } catch (err) {
    console.error('[options] Export error:', err);
    showToast('Export failed', 'error');
  }
}

// --- Import Vault from JSON ---
async function importVaultFromFile(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.tabs || !Array.isArray(data.tabs)) {
      throw new Error('Invalid backup format');
    }

    await sendMessage('TABVAULT_VAULT_MULTIPLE', { tabs: data.tabs });
    showToast(`Imported ${data.tabs.length} tabs`);
    updateVaultCount();
  } catch (err) {
    console.error('[options] Import file error:', err);
    showToast('Invalid file format', 'error');
  }
}

// --- Update Tier Display ---
async function updateTierDisplay() {
  const currentTier = await getCurrentTier();
  const tierConfig = getTierConfig(currentTier);

  const tierBadge = document.getElementById('current-tier-badge');
  const tierDescription = document.getElementById('tier-description');
  const upgradeBtn = document.getElementById('upgrade-btn');

  if (tierBadge) {
    const tierName = tierBadge.querySelector('.tier-badge__name');
    if (tierName) {
      tierName.textContent = tierConfig.label || 'Free';
    }

    // Style badge based on tier
    if (currentTier === 'pro') {
      tierBadge.classList.add('tier-badge--pro');
    }
  }

  if (tierDescription) {
    if (currentTier === 'pro') {
      tierDescription.textContent = 'Full access including Google Drive sync and cross-device backup.';
    } else {
      tierDescription.textContent = 'Unlimited tab vaulting, session groups, scroll position memory, Deep Sleep, and local backup.';
    }
  }

  if (upgradeBtn) {
    if (currentTier === 'pro') {
      upgradeBtn.textContent = 'You have Pro!';
      upgradeBtn.disabled = true;
      upgradeBtn.classList.add('oia-btn--success');
    } else {
      upgradeBtn.textContent = 'Upgrade to Pro';
      upgradeBtn.disabled = false;
      upgradeBtn.addEventListener('click', () => {
        const opened = openUpgrade('pro');
        if (!opened) {
          showToast('Upgrades coming soon!', 'warning');
        }
      });
    }
  }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  updateVaultCount();
  updateTierDisplay();
  initGoogleDrive();

  // Settings auto-save on change
  if (deepSleepEnabled) {
    deepSleepEnabled.addEventListener('change', saveSettings);
  }
  if (inactivityMinutes) {
    inactivityMinutes.addEventListener('change', saveSettings);
  }

  // OneTab import
  if (importOneTabButton) {
    importOneTabButton.addEventListener('click', importOneTab);
  }

  // Clear all
  if (clearAllButton) {
    clearAllButton.addEventListener('click', clearAllVaultedTabs);
  }

  // Export
  if (exportVaultButton) {
    exportVaultButton.addEventListener('click', exportVault);
  }

  // Import from file
  if (importVaultButton && importFile) {
    importVaultButton.addEventListener('click', () => {
      importFile.click();
    });

    importFile.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        importVaultFromFile(file);
      }
      importFile.value = '';
    });
  }

  // Fuel button (donation)
  if (fuelBtn) {
    fuelBtn.addEventListener('click', () => {
      const opened = openDonation('coffee');
      if (!opened) {
        // ExtPay not configured - show thanks anyway
        showToast('Thanks for the support!');
      }
    });
  }
});

// --- Google Drive Integration ---
async function initGoogleDrive() {
  const driveSection = document.getElementById('drive-section');
  if (!driveSection) return;

  try {
    // Check if user has Pro tier access
    const hasDriveAccess = await canAccessFeature('google-drive-sync');
    const currentTier = await getCurrentTier();

    if (!hasDriveAccess) {
      // Show upgrade prompt for free users
      driveSection.innerHTML = `
        <div class="drive-upgrade-prompt">
          <div class="drive-upgrade-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--oia-sage)" stroke-width="1.5">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
            </svg>
          </div>
          <p class="oia-body" style="font-weight: var(--oia-weight-semibold); margin-bottom: var(--oia-space-xs);">
            Sync across all your devices
          </p>
          <p class="oia-body-sm" style="color: var(--oia-text-secondary); margin-bottom: var(--oia-space-md);">
            Upgrade to Pro to backup your vault to Google Drive and access it from any computer.
          </p>
          <button class="oia-btn oia-btn-primary" id="upgrade-to-pro-btn">
            Upgrade to Pro — $2.99/mo
          </button>
        </div>
      `;

      // Wire up upgrade button
      const upgradeBtn = document.getElementById('upgrade-to-pro-btn');
      if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
          const opened = openUpgrade('pro');
          if (!opened) {
            showToast('Upgrades coming soon!', 'warning');
          }
        });
      }
      return;
    }

    // User has Pro access - check OAuth config
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2?.client_id;

    if (!clientId || clientId === 'YOUR_CLIENT_ID.apps.googleusercontent.com') {
      // OAuth not configured yet
      driveSection.innerHTML = `
        <div class="drive-setup-pending oia-body-sm" style="color: var(--oia-text-muted); padding: var(--oia-space-md); background: rgba(139, 168, 136, 0.08); border-radius: var(--oia-radius-md);">
          <strong>Setup Required</strong><br>
          Google Drive sync is ready. OAuth configuration pending.
        </div>
      `;
      return;
    }

    // Initialize Drive client
    initDrive(clientId);

    // Section reference for refresh
    let section = null;

    // Initialize UI with callbacks
    initDriveUI({
      appSlug: APP_SLUG,
      onConnect: (result) => {
        console.log('[options] Drive connected:', result.email);
        showToast('Connected to Google Drive');
        if (section) section._refresh();
      },
      onDisconnect: () => {
        console.log('[options] Drive disconnected');
        showToast('Disconnected from Google Drive');
        if (section) section._refresh();
      },
      onSync: async () => {
        // Get all vault data for sync
        const response = await sendMessage(MESSAGE_TYPES.GET_CONTENTS);
        return response.data || [];
      },
      onRestore: async (data, meta) => {
        // Import restored data
        if (data && Array.isArray(data) && data.length > 0) {
          await sendMessage('TABVAULT_VAULT_MULTIPLE', { tabs: data });
          showToast(`Restored ${data.length} tabs from backup`);
          updateVaultCount();
        } else {
          showToast('Backup was empty', 'warning');
        }
        if (section) section._refresh();
      }
    });

    // Render the Drive section
    section = renderDriveSection({ container: driveSection });
  } catch (error) {
    console.error('[options] Google Drive init error:', error);
  }
}

// --- Storage Change Listener ---
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (STORAGE_KEYS.SETTINGS in changes) {
      loadSettings();
    }
    updateVaultCount();
  }
});
