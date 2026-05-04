// drive-ui.js - Google Drive UI Components
// 864zeros Feature Brick - OIA Design System
// Returns DOM elements for easy integration

import * as DriveClient from './drive-client.js';

// --- State Management ---
let _appSlug = null;
let _onConnect = null;
let _onDisconnect = null;
let _onSync = null;
let _onRestore = null;

/**
 * Initialize UI with app context and callbacks
 * @param {object} options
 * @param {string} options.appSlug - App identifier
 * @param {function} [options.onConnect] - Called after successful connect
 * @param {function} [options.onDisconnect] - Called after disconnect
 * @param {function} [options.onSync] - Called to get data for sync, should return data
 * @param {function} [options.onRestore] - Called with restored data
 */
export function initUI(options) {
  _appSlug = options.appSlug;
  _onConnect = options.onConnect;
  _onDisconnect = options.onDisconnect;
  _onSync = options.onSync;
  _onRestore = options.onRestore;
}

// --- Connect Button ---

/**
 * Render connect/disconnect button
 * @param {object} [options]
 * @param {HTMLElement} [options.container] - Container to render into (optional)
 * @returns {HTMLElement}
 */
export function renderConnectButton(options = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'drive-connect-wrapper';

  const button = document.createElement('button');
  button.className = 'oia-btn drive-connect-btn';
  button.setAttribute('aria-live', 'polite');

  const statusText = document.createElement('span');
  statusText.className = 'drive-connect-status oia-caption';

  wrapper.appendChild(button);
  wrapper.appendChild(statusText);

  // Update function
  async function updateState() {
    const info = await DriveClient.getConnectionInfo(_appSlug);

    if (info.connected) {
      button.className = 'oia-btn oia-btn-secondary drive-connect-btn drive-connect-btn--connected';
      button.innerHTML = `
        <span class="drive-connect-icon drive-connect-icon--check"></span>
        <span class="drive-connect-email">${truncateEmail(info.email)}</span>
      `;
      button.onclick = handleDisconnect;
      statusText.textContent = 'Connected to Google Drive';
      statusText.className = 'drive-connect-status oia-caption drive-status--success';
    } else {
      button.className = 'oia-btn oia-btn-primary drive-connect-btn';
      button.innerHTML = `
        <span class="drive-connect-icon drive-connect-icon--drive"></span>
        <span>Connect to Google Drive</span>
      `;
      button.onclick = handleConnect;
      statusText.textContent = '';
      statusText.className = 'drive-connect-status oia-caption';
    }
  }

  async function handleConnect() {
    button.disabled = true;
    button.className = 'oia-btn oia-btn-primary drive-connect-btn drive-connect-btn--loading';
    button.innerHTML = `
      <span class="oia-spinner oia-spinner--sm"></span>
      <span>Connecting...</span>
    `;
    statusText.textContent = '';

    try {
      const result = await DriveClient.connect();
      if (result.success) {
        if (_onConnect) _onConnect(result);
      }
    } catch (error) {
      statusText.textContent = getErrorMessage(error);
      statusText.className = 'drive-connect-status oia-caption drive-status--error';
    } finally {
      button.disabled = false;
      await updateState();
    }
  }

  async function handleDisconnect() {
    button.disabled = true;
    try {
      await DriveClient.disconnect();
      if (_onDisconnect) _onDisconnect();
    } finally {
      button.disabled = false;
      await updateState();
    }
  }

  // Initial state
  updateState();

  // Store update function for external refresh
  wrapper._refresh = updateState;

  if (options.container) {
    options.container.appendChild(wrapper);
  }

  return wrapper;
}

// --- Sync Status ---

/**
 * Render sync status display
 * @param {object} [options]
 * @param {HTMLElement} [options.container] - Container to render into
 * @returns {HTMLElement}
 */
export function renderSyncStatus(options = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'drive-sync-status';
  wrapper.setAttribute('aria-live', 'polite');

  async function updateState() {
    const info = await DriveClient.getConnectionInfo(_appSlug);

    if (!info.connected) {
      wrapper.innerHTML = `
        <span class="drive-sync-icon drive-sync-icon--disconnected"></span>
        <span class="drive-sync-text oia-body-sm">Not connected</span>
      `;
      wrapper.className = 'drive-sync-status drive-sync-status--disconnected';
    } else if (info.lastSync) {
      const timeAgo = formatTimeAgo(new Date(info.lastSync));
      wrapper.innerHTML = `
        <span class="drive-sync-icon drive-sync-icon--synced"></span>
        <span class="drive-sync-text oia-body-sm">Last synced: ${timeAgo}</span>
      `;
      wrapper.className = 'drive-sync-status drive-sync-status--synced';
    } else {
      wrapper.innerHTML = `
        <span class="drive-sync-icon drive-sync-icon--pending"></span>
        <span class="drive-sync-text oia-body-sm">Never synced</span>
      `;
      wrapper.className = 'drive-sync-status drive-sync-status--pending';
    }
  }

  updateState();
  wrapper._refresh = updateState;

  // Listen for sync complete to auto-refresh
  window.addEventListener('drive-sync-complete', updateState);

  if (options.container) {
    options.container.appendChild(wrapper);
  }

  return wrapper;
}

// --- Sync Button ---

/**
 * Render manual sync button
 * @param {object} [options]
 * @param {HTMLElement} [options.container] - Container to render into
 * @returns {HTMLElement}
 */
export function renderSyncButton(options = {}) {
  const button = document.createElement('button');
  button.className = 'oia-btn oia-btn-secondary drive-sync-btn';
  button.setAttribute('aria-live', 'polite');

  let state = 'idle'; // idle, syncing, success, error

  async function updateState() {
    const connected = await DriveClient.isConnected();
    button.disabled = !connected || state === 'syncing';

    switch (state) {
      case 'syncing':
        button.innerHTML = `
          <span class="oia-spinner oia-spinner--sm"></span>
          <span>Syncing...</span>
        `;
        button.className = 'oia-btn oia-btn-secondary drive-sync-btn drive-sync-btn--syncing';
        break;
      case 'success':
        button.innerHTML = `
          <span class="drive-sync-icon drive-sync-icon--check"></span>
          <span>Synced</span>
        `;
        button.className = 'oia-btn oia-btn-secondary drive-sync-btn drive-sync-btn--success';
        // Reset after 2s
        setTimeout(() => {
          state = 'idle';
          updateState();
        }, 2000);
        break;
      case 'error':
        button.innerHTML = `
          <span class="drive-sync-icon drive-sync-icon--error"></span>
          <span>Retry Sync</span>
        `;
        button.className = 'oia-btn oia-btn-secondary drive-sync-btn drive-sync-btn--error';
        break;
      default: // idle
        button.innerHTML = `
          <span class="drive-sync-icon drive-sync-icon--sync"></span>
          <span>Sync Now</span>
        `;
        button.className = 'oia-btn oia-btn-secondary drive-sync-btn';
    }
  }

  button.onclick = async () => {
    if (!_onSync) {
      console.warn('[DriveUI] No onSync callback provided');
      return;
    }

    state = 'syncing';
    updateState();

    try {
      const data = await _onSync();
      await DriveClient.syncNow(data, _appSlug);
      state = 'success';
      // Dispatch event so other components can refresh
      window.dispatchEvent(new CustomEvent('drive-sync-complete'));
    } catch (error) {
      console.error('[DriveUI] Sync failed:', error);
      state = 'error';
    }

    updateState();
  };

  updateState();
  button._refresh = updateState;

  if (options.container) {
    options.container.appendChild(button);
  }

  return button;
}

// --- Backup List ---

/**
 * Render backup list with restore buttons
 * @param {object} [options]
 * @param {HTMLElement} [options.container] - Container to render into
 * @returns {HTMLElement}
 */
export function renderBackupList(options = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'drive-backup-list';

  async function loadBackups() {
    wrapper.innerHTML = `
      <div class="drive-backup-loading">
        <span class="oia-spinner oia-spinner--sm"></span>
        <span class="oia-body-sm">Loading backups...</span>
      </div>
    `;

    try {
      const connected = await DriveClient.isConnected();
      if (!connected) {
        wrapper.innerHTML = `
          <div class="drive-backup-empty oia-body-sm">
            Connect to Google Drive to see backups
          </div>
        `;
        return;
      }

      const backups = await DriveClient.listBackups(_appSlug);

      if (backups.length === 0) {
        wrapper.innerHTML = `
          <div class="drive-backup-empty oia-body-sm">
            No backups yet
          </div>
        `;
        return;
      }

      wrapper.innerHTML = '';

      backups.forEach(backup => {
        const item = document.createElement('div');
        item.className = 'drive-backup-item oia-card';

        const date = new Date(backup.createdAt);
        const formattedDate = formatDate(date);
        const formattedSize = formatSize(backup.size);

        item.innerHTML = `
          <div class="drive-backup-info">
            <div class="drive-backup-date oia-body-sm">${formattedDate}</div>
            <div class="drive-backup-size oia-caption">${formattedSize}</div>
          </div>
          <div class="drive-backup-actions">
            <button class="drive-backup-restore oia-btn oia-btn-secondary" data-id="${backup.id}">
              Restore
            </button>
          </div>
        `;

        const restoreBtn = item.querySelector('.drive-backup-restore');
        restoreBtn.onclick = () => handleRestore(backup.id, restoreBtn);

        wrapper.appendChild(item);
      });
    } catch (error) {
      wrapper.innerHTML = `
        <div class="drive-backup-error oia-body-sm drive-status--error">
          ${getErrorMessage(error)}
        </div>
      `;
    }
  }

  async function handleRestore(fileId, button) {
    const originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = `<span class="oia-spinner oia-spinner--sm"></span>`;

    try {
      const result = await DriveClient.restore(_appSlug);
      if (_onRestore) {
        await _onRestore(result.data, result.meta);
      }
      button.innerHTML = `<span class="drive-sync-icon drive-sync-icon--check"></span>`;
      button.className = 'drive-backup-restore oia-btn oia-btn-secondary drive-sync-btn--success';
    } catch (error) {
      console.error('[DriveUI] Restore failed:', error);
      button.textContent = 'Failed';
      button.className = 'drive-backup-restore oia-btn oia-btn-secondary drive-sync-btn--error';
    }

    // Reset after 2s
    setTimeout(() => {
      button.disabled = false;
      button.textContent = originalText;
      button.className = 'drive-backup-restore oia-btn oia-btn-secondary';
    }, 2000);
  }

  loadBackups();
  wrapper._refresh = loadBackups;

  // Listen for sync complete to auto-refresh
  window.addEventListener('drive-sync-complete', loadBackups);

  if (options.container) {
    options.container.appendChild(wrapper);
  }

  return wrapper;
}

// --- Complete Drive Settings Section ---

/**
 * Render a complete Drive settings section with all components
 * @param {object} options
 * @param {HTMLElement} options.container - Container to render into
 * @returns {HTMLElement}
 */
export function renderDriveSection(options = {}) {
  const section = document.createElement('div');
  section.className = 'drive-section';

  section.innerHTML = `
    <h2 class="oia-h2 drive-section-title">Google Drive Backup</h2>
    <p class="oia-body-sm drive-section-desc">
      Sync your data across devices. Your data is stored in a private folder only you can access.
    </p>
    <div class="drive-section-connect"></div>
    <div class="drive-section-sync">
      <div class="drive-section-sync-status"></div>
      <div class="drive-section-sync-button"></div>
    </div>
    <div class="drive-section-backups">
      <h3 class="oia-body-sm drive-backups-title">Available Backups</h3>
      <div class="drive-section-backup-list"></div>
    </div>
  `;

  // Render components into their containers
  const connectBtn = renderConnectButton({
    container: section.querySelector('.drive-section-connect')
  });

  const syncStatus = renderSyncStatus({
    container: section.querySelector('.drive-section-sync-status')
  });

  const syncBtn = renderSyncButton({
    container: section.querySelector('.drive-section-sync-button')
  });

  const backupList = renderBackupList({
    container: section.querySelector('.drive-section-backup-list')
  });

  // Store refresh function
  section._refresh = async () => {
    await connectBtn._refresh();
    await syncStatus._refresh();
    await syncBtn._refresh();
    await backupList._refresh();
  };

  if (options.container) {
    options.container.appendChild(section);
  }

  return section;
}

// --- Utility Functions ---

function truncateEmail(email) {
  if (!email) return '';
  if (email.length <= 24) return email;
  const [local, domain] = email.split('@');
  if (local.length > 12) {
    return local.substring(0, 10) + '...@' + domain;
  }
  return email;
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(date);
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error) {
  if (!error) return 'Something went wrong';

  const messages = {
    'auth_failed': 'Please sign in again',
    'network_error': 'No internet connection',
    'quota_exceeded': 'Drive storage full',
    'file_not_found': 'No backup found',
    'parse_error': 'Backup file corrupted'
  };

  return messages[error.code] || error.message || 'Something went wrong';
}
