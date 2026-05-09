// drive-client.js - Google Drive OAuth + API wrapper
// 864zeros Feature Brick - Reusable across all extensions
// Uses chrome.identity.launchWebAuthFlow for OAuth (any Google account)
// Scope: drive.appdata (hidden app folder only)

// --- Constants ---
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const OAUTH_BASE = 'https://accounts.google.com/o/oauth2';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata email';

// Storage keys (namespaced with drive_ prefix)
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'drive_access_token',
  TOKEN_EXPIRY: 'drive_token_expiry',
  USER_EMAIL: 'drive_user_email',
  LAST_SYNC: 'drive_last_sync_', // + appSlug
  AUTO_SYNC_ENABLED: 'drive_auto_sync_', // + appSlug
  AUTO_SYNC_INTERVAL: 'drive_auto_sync_interval_' // + appSlug
};

// Backup retention limit
const MAX_BACKUPS = 5;

// --- Internal State ---
let _clientId = null;

// --- Initialization ---

/**
 * Initialize the Drive client with OAuth client ID
 * Must be called before any other operations
 * @param {string} clientId - Google OAuth 2.0 client ID
 */
export function init(clientId) {
  if (!clientId) {
    throw new Error('Client ID is required');
  }
  _clientId = clientId;
}

// --- Connection ---

/**
 * Start OAuth flow and connect to Google Drive
 * @returns {Promise<{success: boolean, email: string}>}
 */
export async function connect() {
  if (!_clientId) {
    throw new Error('Drive client not initialized. Call init(clientId) first.');
  }

  try {
    const token = await launchOAuthFlow();
    if (!token) {
      return { success: false, email: null };
    }

    // Get user info to verify token and get email
    const userInfo = await fetchUserInfo(token);

    // Store token and user info
    const expiry = Date.now() + (3600 * 1000); // 1 hour
    await chrome.storage.local.set({
      [STORAGE_KEYS.ACCESS_TOKEN]: token,
      [STORAGE_KEYS.TOKEN_EXPIRY]: expiry,
      [STORAGE_KEYS.USER_EMAIL]: userInfo.email
    });

    return { success: true, email: userInfo.email };
  } catch (error) {
    console.error('[DriveClient] Connect failed:', error);
    throw categorizeError(error);
  }
}

/**
 * Disconnect from Google Drive and clear stored tokens
 * @returns {Promise<void>}
 */
export async function disconnect() {
  try {
    const token = await getStoredToken();

    // Revoke token if we have one
    if (token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
          method: 'POST'
        });
      } catch (e) {
        // Ignore revoke errors - token may already be expired
      }
    }

    // Clear all stored Drive data
    await chrome.storage.local.remove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRY,
      STORAGE_KEYS.USER_EMAIL
    ]);
  } catch (error) {
    console.error('[DriveClient] Disconnect error:', error);
    throw error;
  }
}

/**
 * Check if currently connected to Google Drive
 * @returns {Promise<boolean>}
 */
export async function isConnected() {
  const token = await getValidToken();
  return token !== null;
}

/**
 * Get connection info
 * @param {string} appSlug - App identifier for last sync time
 * @returns {Promise<{connected: boolean, email: string|null, lastSync: string|null}>}
 */
export async function getConnectionInfo(appSlug) {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.TOKEN_EXPIRY,
    STORAGE_KEYS.USER_EMAIL,
    STORAGE_KEYS.LAST_SYNC + appSlug
  ]);

  const connected = await isConnected();

  return {
    connected,
    email: connected ? result[STORAGE_KEYS.USER_EMAIL] : null,
    lastSync: result[STORAGE_KEYS.LAST_SYNC + appSlug] || null
  };
}

// --- Backup Operations ---

/**
 * Backup data to Google Drive
 * @param {object} data - Data to backup (will be JSON serialized)
 * @param {string} appSlug - App identifier (e.g., 'tabvault', 'clipboard')
 * @param {string} [version='1.0.0'] - App version for metadata
 * @returns {Promise<{success: boolean, fileId: string, fileName: string}>}
 */
export async function backup(data, appSlug, version = '1.0.0') {
  const token = await getValidToken();
  if (!token) {
    throw { code: 'auth_failed', message: 'Not connected to Google Drive' };
  }

  try {
    // Ensure app folder exists
    const folderId = await ensureAppFolder(token, appSlug);

    // Create backup file
    const timestamp = new Date().toISOString();
    const fileName = `backup-${timestamp.replace(/[:.]/g, '-')}.json`;

    const backupData = {
      meta: {
        app: appSlug,
        version,
        createdAt: timestamp,
        deviceId: await getDeviceId(),
        itemCount: Array.isArray(data) ? data.length : Object.keys(data).length
      },
      data
    };

    const fileId = await uploadFile(token, fileName, backupData, folderId);

    // Update last sync time
    await chrome.storage.local.set({
      [STORAGE_KEYS.LAST_SYNC + appSlug]: timestamp
    });

    // Cleanup old backups (keep only MAX_BACKUPS)
    await cleanupOldBackups(token, appSlug, folderId);

    return { success: true, fileId, fileName };
  } catch (error) {
    console.error('[DriveClient] Backup failed:', error);
    throw categorizeError(error);
  }
}

/**
 * Restore latest backup from Google Drive
 * @param {string} appSlug - App identifier
 * @returns {Promise<{success: boolean, data: object, meta: object}>}
 */
export async function restore(appSlug) {
  const token = await getValidToken();
  if (!token) {
    throw { code: 'auth_failed', message: 'Not connected to Google Drive' };
  }

  try {
    const backups = await listBackups(appSlug);

    if (backups.length === 0) {
      throw { code: 'file_not_found', message: 'No backup found' };
    }

    // Get the latest backup
    const latest = backups[0];
    const content = await downloadFile(token, latest.id);

    // Validate backup structure
    if (!content.meta || !content.data) {
      throw { code: 'parse_error', message: 'Invalid backup format' };
    }

    // Validate app slug matches
    if (content.meta.app !== appSlug) {
      throw { code: 'parse_error', message: 'Backup is for a different app' };
    }

    return { success: true, data: content.data, meta: content.meta };
  } catch (error) {
    console.error('[DriveClient] Restore failed:', error);
    throw categorizeError(error);
  }
}

/**
 * List available backups
 * @param {string} appSlug - App identifier
 * @returns {Promise<Array<{id: string, name: string, createdAt: string, size: number}>>}
 */
export async function listBackups(appSlug) {
  const token = await getValidToken();
  if (!token) {
    throw { code: 'auth_failed', message: 'Not connected to Google Drive' };
  }

  try {
    // Find app folder
    const folderId = await findAppFolder(token, appSlug);
    if (!folderId) {
      return [];
    }

    // List backup files
    const query = `'${folderId}' in parents and name contains 'backup-' and trashed=false`;
    const response = await fetch(
      `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=${encodeURIComponent(query)}&fields=files(id,name,createdTime,size)&orderBy=createdTime desc`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      throw await parseApiError(response);
    }

    const result = await response.json();
    return (result.files || []).map(file => ({
      id: file.id,
      name: file.name,
      createdAt: file.createdTime,
      size: parseInt(file.size, 10) || 0
    }));
  } catch (error) {
    console.error('[DriveClient] List backups failed:', error);
    throw categorizeError(error);
  }
}

/**
 * Delete a specific backup
 * @param {string} appSlug - App identifier (for validation)
 * @param {string} fileId - Drive file ID to delete
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteBackup(appSlug, fileId) {
  const token = await getValidToken();
  if (!token) {
    throw { code: 'auth_failed', message: 'Not connected to Google Drive' };
  }

  try {
    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok && response.status !== 404) {
      throw await parseApiError(response);
    }

    return { success: true };
  } catch (error) {
    console.error('[DriveClient] Delete backup failed:', error);
    throw categorizeError(error);
  }
}

// --- Sync ---

/**
 * Sync data to Google Drive (alias for backup with timestamp update)
 * @param {object} data - Data to sync
 * @param {string} appSlug - App identifier
 * @returns {Promise<{success: boolean, fileId: string}>}
 */
export async function syncNow(data, appSlug) {
  return backup(data, appSlug);
}

/**
 * Get last sync time
 * @param {string} appSlug - App identifier
 * @returns {Promise<string|null>}
 */
export async function getLastSyncTime(appSlug) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.LAST_SYNC + appSlug);
  return result[STORAGE_KEYS.LAST_SYNC + appSlug] || null;
}

/**
 * Enable auto-sync using chrome.alarms
 * @param {string} appSlug - App identifier
 * @param {number} intervalMinutes - Sync interval in minutes (minimum 1)
 * @returns {Promise<void>}
 */
export async function enableAutoSync(appSlug, intervalMinutes = 60) {
  const interval = Math.max(1, intervalMinutes);

  await chrome.storage.local.set({
    [STORAGE_KEYS.AUTO_SYNC_ENABLED + appSlug]: true,
    [STORAGE_KEYS.AUTO_SYNC_INTERVAL + appSlug]: interval
  });

  // Create alarm
  await chrome.alarms.create(`drive-sync-${appSlug}`, {
    periodInMinutes: interval
  });
}

/**
 * Disable auto-sync
 * @param {string} appSlug - App identifier
 * @returns {Promise<void>}
 */
export async function disableAutoSync(appSlug) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.AUTO_SYNC_ENABLED + appSlug]: false
  });

  await chrome.alarms.clear(`drive-sync-${appSlug}`);
}

// --- Internal Helpers ---

/**
 * Launch OAuth flow using chrome.identity.launchWebAuthFlow
 */
async function launchOAuthFlow() {
  const redirectUri = chrome.identity.getRedirectURL();

  const authUrl = new URL(`${OAUTH_BASE}/auth`);
  authUrl.searchParams.set('client_id', _clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('prompt', 'consent');

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!responseUrl) {
          resolve(null); // User cancelled
          return;
        }

        // Extract token from URL fragment
        const url = new URL(responseUrl);
        const params = new URLSearchParams(url.hash.substring(1));
        const token = params.get('access_token');

        if (!token) {
          reject(new Error('No access token in response'));
          return;
        }

        resolve(token);
      }
    );
  });
}

/**
 * Get user info from token
 */
async function fetchUserInfo(token) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json();
}

/**
 * Get stored token from chrome.storage
 */
async function getStoredToken() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.TOKEN_EXPIRY
  ]);
  return result[STORAGE_KEYS.ACCESS_TOKEN] || null;
}

/**
 * Get valid (non-expired) token, refreshing if needed
 */
async function getValidToken() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.TOKEN_EXPIRY
  ]);

  const token = result[STORAGE_KEYS.ACCESS_TOKEN];
  const expiry = result[STORAGE_KEYS.TOKEN_EXPIRY];

  if (!token) {
    return null;
  }

  // Check if token is expired (with 5 min buffer)
  if (expiry && Date.now() > expiry - (5 * 60 * 1000)) {
    // Token expired - user needs to reconnect
    // launchWebAuthFlow doesn't support refresh tokens in implicit flow
    return null;
  }

  return token;
}

/**
 * Get or create device ID for backup metadata
 */
async function getDeviceId() {
  const key = 'drive_device_id';
  const result = await chrome.storage.local.get(key);

  if (result[key]) {
    return result[key];
  }

  const deviceId = crypto.randomUUID().substring(0, 8);
  await chrome.storage.local.set({ [key]: deviceId });
  return deviceId;
}

/**
 * Find app folder in appDataFolder space
 */
async function findAppFolder(token, appSlug) {
  // First find 864zeros root folder
  let query = `name='864zeros' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  let response = await fetch(
    `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=${encodeURIComponent(query)}&fields=files(id)`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw await parseApiError(response);
  }

  let result = await response.json();
  if (!result.files || result.files.length === 0) {
    return null;
  }

  const rootId = result.files[0].id;

  // Now find app-specific folder
  query = `'${rootId}' in parents and name='${appSlug}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  response = await fetch(
    `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=${encodeURIComponent(query)}&fields=files(id)`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw await parseApiError(response);
  }

  result = await response.json();
  return result.files && result.files.length > 0 ? result.files[0].id : null;
}

/**
 * Ensure app folder exists, creating if needed
 */
async function ensureAppFolder(token, appSlug) {
  // Check if folder exists
  let folderId = await findAppFolder(token, appSlug);
  if (folderId) {
    return folderId;
  }

  // Create 864zeros root folder first
  let rootId = await findOrCreateFolder(token, '864zeros', 'appDataFolder');

  // Create app-specific folder
  folderId = await findOrCreateFolder(token, appSlug, rootId);

  return folderId;
}

/**
 * Find or create a folder
 */
async function findOrCreateFolder(token, name, parentId) {
  const parentQuery = parentId === 'appDataFolder'
    ? ''
    : `'${parentId}' in parents and `;

  const query = `${parentQuery}name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  let response = await fetch(
    `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=${encodeURIComponent(query)}&fields=files(id)`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw await parseApiError(response);
  }

  let result = await response.json();
  if (result.files && result.files.length > 0) {
    return result.files[0].id;
  }

  // Create folder
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId]
  };

  response = await fetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  result = await response.json();
  return result.id;
}

/**
 * Upload file to Drive
 */
async function uploadFile(token, fileName, data, folderId) {
  const metadata = {
    name: fileName,
    parents: [folderId]
  };

  const content = JSON.stringify(data, null, 2);

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: 'application/json' }));

  const response = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const result = await response.json();
  return result.id;
}

/**
 * Download file from Drive
 */
async function downloadFile(token, fileId) {
  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json();
}

/**
 * Cleanup old backups, keeping only MAX_BACKUPS
 */
async function cleanupOldBackups(token, appSlug, folderId) {
  try {
    const query = `'${folderId}' in parents and name contains 'backup-' and trashed=false`;
    const response = await fetch(
      `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=${encodeURIComponent(query)}&fields=files(id,createdTime)&orderBy=createdTime desc`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) return;

    const result = await response.json();
    const files = result.files || [];

    // Delete excess backups
    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(MAX_BACKUPS);
      await Promise.all(
        toDelete.map(file =>
          fetch(`${DRIVE_API_BASE}/files/${file.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      );
    }
  } catch (e) {
    // Non-critical - log and continue
    console.warn('[DriveClient] Cleanup old backups failed:', e);
  }
}

/**
 * Parse API error response
 */
async function parseApiError(response) {
  try {
    const error = await response.json();
    return {
      code: error.error?.code || response.status,
      message: error.error?.message || response.statusText
    };
  } catch {
    return {
      code: response.status,
      message: response.statusText
    };
  }
}

/**
 * Categorize error for user-friendly messages
 */
function categorizeError(error) {
  if (error.code) {
    return error; // Already categorized
  }

  const message = error.message || String(error);

  if (message.includes('network') || message.includes('fetch')) {
    return { code: 'network_error', message: 'No internet connection' };
  }

  if (message.includes('auth') || message.includes('token') || message.includes('401')) {
    return { code: 'auth_failed', message: 'Please sign in again' };
  }

  if (message.includes('quota') || message.includes('403')) {
    return { code: 'quota_exceeded', message: 'Drive storage full' };
  }

  if (message.includes('404') || message.includes('not found')) {
    return { code: 'file_not_found', message: 'Backup not found' };
  }

  return { code: 'unknown', message: message || 'Something went wrong' };
}
