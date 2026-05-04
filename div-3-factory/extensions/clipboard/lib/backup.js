// ============================================================
// BACKUP.JS — Backup & Restore
// Local export always free. Google Drive sync is Pro tier.
// ============================================================

import { APP_SLUG, STORAGE_KEYS } from './constants.js';

const DEBUG = false;
function log(...args) {
  if (DEBUG) console.log('[backup]', ...args);
}
import { exportAll, importAll } from './db.js';
import { requiresTier } from './tiers.js';

/**
 * Export entire IndexedDB as JSON file. Triggers browser download.
 */
export async function exportLocal() {
  const data = await exportAll();

  const exportData = {
    app: APP_SLUG,
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    stores: data
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${APP_SLUG}-backup-${timestamp}.json`;

  // Create download link
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);

  return { success: true, filename };
}

/**
 * Import JSON file into IndexedDB. Merges with existing data.
 * @param {File} file - JSON file to import
 */
export async function importLocal(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);

        // Validate structure
        if (data.app !== APP_SLUG) {
          throw new Error("This file doesn't match this extension.");
        }

        if (!data.stores || typeof data.stores !== 'object') {
          throw new Error('Invalid backup file structure.');
        }

        await importAll(data.stores);
        resolve({ success: true, itemCount: Object.keys(data.stores).length });
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    };

    reader.onerror = () => reject({ success: false, error: 'Failed to read file.' });
    reader.readAsText(file);
  });
}

/**
 * Sync database to Google Drive (Pro tier only).
 * @param {object} options - Sync options
 */
export async function syncToGoogleDrive(options = {}) {
  const hasAccess = await requiresTier('pro');
  if (!hasAccess) {
    return { success: false, error: 'tier_required', requiredTier: 'pro' };
  }

  // TODO: Implement Google Drive sync
  log('Google Drive sync not yet implemented');
  return { success: false, error: 'not_implemented' };
}

/**
 * Restore from Google Drive (Pro tier only).
 */
export async function restoreFromGoogleDrive() {
  const hasAccess = await requiresTier('pro');
  if (!hasAccess) {
    return { success: false, error: 'tier_required', requiredTier: 'pro' };
  }

  // TODO: Implement Google Drive restore
  log('Google Drive restore not yet implemented');
  return { success: false, error: 'not_implemented' };
}

/**
 * Get the timestamp of last successful Google Drive sync.
 * @returns {Promise<string|null>} - ISO timestamp or null
 */
export async function getLastSyncTimestamp() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.lastSync);
  return result[STORAGE_KEYS.lastSync] ?? null;
}
