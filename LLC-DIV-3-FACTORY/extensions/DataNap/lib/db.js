// ============================================================
// DB — TabVault IndexedDB Persistence Layer
// Handles all vault storage operations
// ============================================================

import { DB_NAME, DB_VERSION, STORE_NAME } from './constants.js';

let db = null;

/**
 * Initialize the IndexedDB vault
 * @returns {Promise<void>}
 */
export function initVault() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      const oldVersion = event.oldVersion;

      // Create object store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });

        // Create indexes for common queries
        store.createIndex('url', 'url', { unique: false });
        store.createIndex('vaultedAt', 'vaultedAt', { unique: false });
        store.createIndex('windowId', 'windowId', { unique: false });
        store.createIndex('groupId', 'groupId', { unique: false });
      } else if (oldVersion < 3) {
        // Upgrade to v3: Add groupId index
        const store = event.target.transaction.objectStore(STORE_NAME);
        if (!store.indexNames.contains('groupId')) {
          store.createIndex('groupId', 'groupId', { unique: false });
        }
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };

    request.onerror = (event) => {
      console.error('[db] IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Vault a tab (store in IndexedDB)
 * @param {Object} tabData - Tab data to store
 * @returns {Promise<number>} - The ID of the stored record
 */
export function vaultTab(tabData) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('IndexedDB not initialized. Call initVault() first.'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Ensure required fields and timestamp
    const record = {
      url: tabData.url || '',
      title: tabData.title || tabData.url || 'Untitled',
      favIconUrl: tabData.favIconUrl || '',
      windowId: tabData.windowId || -1,
      scrollX: tabData.scrollX || 0,
      scrollY: tabData.scrollY || 0,
      vaultedAt: tabData.vaultedAt || Date.now(),
      originalTabId: tabData.tabId || null,
      groupId: tabData.groupId || null,
      groupName: tabData.groupName || null
    };

    const request = store.add(record);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error('[db] Error vaulting tab:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Get all vaulted tabs
 * @returns {Promise<Array>}
 */
export function getVaultContents() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('IndexedDB not initialized. Call initVault() first.'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by vaultedAt descending (newest first)
      const results = request.result.sort((a, b) => b.vaultedAt - a.vaultedAt);
      resolve(results);
    };

    request.onerror = (event) => {
      console.error('[db] Error getting vault contents:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Delete a vaulted tab by ID
 * @param {number} id - The record ID to delete
 * @returns {Promise<void>}
 */
export function deleteVaultedTab(id) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('IndexedDB not initialized. Call initVault() first.'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error('[db] Error deleting tab:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Clear all vaulted tabs
 * @returns {Promise<void>}
 */
export function clearVault() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('IndexedDB not initialized. Call initVault() first.'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error('[db] Error clearing vault:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Get vault count
 * @returns {Promise<number>}
 */
export function getVaultCount() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('IndexedDB not initialized. Call initVault() first.'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error('[db] Error counting vault:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Bulk vault multiple tabs with optional grouping
 * @param {Array} tabsData - Array of tab data objects
 * @param {Object} groupInfo - Optional { groupId, groupName } for session groups
 * @returns {Promise<number>} - Number of tabs vaulted
 */
export function vaultMultipleTabs(tabsData, groupInfo = null) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('IndexedDB not initialized. Call initVault() first.'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    let count = 0;

    transaction.oncomplete = () => {
      resolve(count);
    };

    transaction.onerror = (event) => {
      console.error('[db] Error in bulk vault:', event.target.error);
      reject(event.target.error);
    };

    for (const tabData of tabsData) {
      const record = {
        url: tabData.url || '',
        title: tabData.title || tabData.url || 'Untitled',
        favIconUrl: tabData.favIconUrl || '',
        windowId: tabData.windowId || -1,
        scrollX: tabData.scrollX || 0,
        scrollY: tabData.scrollY || 0,
        vaultedAt: tabData.vaultedAt || Date.now(),
        originalTabId: tabData.tabId || null,
        groupId: groupInfo?.groupId || null,
        groupName: groupInfo?.groupName || null
      };

      const request = store.add(record);
      request.onsuccess = () => count++;
    }
  });
}

/**
 * Delete all tabs in a group
 * @param {string} groupId - The group ID to delete
 * @returns {Promise<number>} - Number of tabs deleted
 */
export function deleteGroup(groupId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('IndexedDB not initialized. Call initVault() first.'));
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('groupId');
    const request = index.openCursor(IDBKeyRange.only(groupId));
    let count = 0;

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        count++;
        cursor.continue();
      }
    };

    transaction.oncomplete = () => {
      resolve(count);
    };

    transaction.onerror = (event) => {
      console.error('[db] Error deleting group:', event.target.error);
      reject(event.target.error);
    };
  });
}
