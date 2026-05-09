// db.js - IndexedDB Wrapper [BRK-DB-001: Persistence_Vault]
// 864zeros Build Kit - Production-Ready Brick

import { DB_NAME, DB_VERSION, DB_SCHEMA } from './constants.js';

let db = null;

/**
 * Initialize or upgrade the database.
 * Called once in service worker onInstalled.
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create object stores from schema
      for (const [storeName, config] of Object.entries(DB_SCHEMA)) {
        if (!database.objectStoreNames.contains(storeName)) {
          const store = database.createObjectStore(storeName, {
            keyPath: config.keyPath,
            autoIncrement: true
          });

          // Create indexes
          for (const index of config.indexes || []) {
            store.createIndex(index.name, index.field, { unique: index.unique });
          }
        }
      }
    };

    request.onsuccess = () => {
      db = request.result;
      console.log(`[db.js] Database initialized: ${DB_NAME} v${DB_VERSION}`);
      resolve(db);
    };
  });
}

/**
 * Get the database instance, initializing if needed.
 */
async function getDB() {
  if (!db) {
    await initDB();
  }
  return db;
}

/**
 * Insert or update a record.
 */
export async function put(storeName, record) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    // Auto-generate ID if not present
    if (!record.id) {
      record.id = crypto.randomUUID();
    }

    // Add timestamps
    if (!record.createdAt) {
      record.createdAt = new Date().toISOString();
    }
    record.updatedAt = new Date().toISOString();

    const request = store.put(record);
    request.onsuccess = () => resolve(record.id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve a single record by key.
 */
export async function get(storeName, key) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve all records, optionally filtered by index.
 */
export async function getAll(storeName, indexName = null, query = null) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const target = indexName ? store.index(indexName) : store;
    const request = query ? target.getAll(query) : target.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a single record.
 */
export async function remove(storeName, key) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Query using IDBKeyRange.
 */
export async function query(storeName, indexName, range) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(range);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Count total records in a store.
 */
export async function count(storeName) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete all records in a store.
 * Alias: clearStore (for semantic clarity)
 */
export async function clear(storeName) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Export entire database as JSON.
 * Used by backup.js for local export and cloud sync.
 */
export async function exportAll() {
  const database = await getDB();
  const exportData = {
    app: DB_NAME,
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    stores: {}
  };

  for (const storeName of Object.keys(DB_SCHEMA)) {
    exportData.stores[storeName] = await getAll(storeName);
  }

  return exportData;
}

/**
 * Import JSON into database.
 * Merges with existing data (does not overwrite).
 */
export async function importAll(data) {
  if (!data || !data.stores) {
    throw new Error('Invalid import data format');
  }

  const results = {
    imported: 0,
    skipped: 0,
    errors: []
  };

  for (const [storeName, records] of Object.entries(data.stores)) {
    if (!DB_SCHEMA[storeName]) {
      console.warn(`[db.js] Unknown store in import: ${storeName}`);
      continue;
    }

    for (const record of records) {
      try {
        // Check if record already exists (by URL for articles)
        if (storeName === 'articles' && record.url) {
          const existing = await getAll(storeName, 'by-url', record.url);
          if (existing.length > 0) {
            results.skipped++;
            continue;
          }
        }

        await put(storeName, record);
        results.imported++;
      } catch (error) {
        results.errors.push({ record: record.id, error: error.message });
      }
    }
  }

  console.log(`[db.js] Import complete:`, results);
  return results;
}

/**
 * Get database statistics.
 */
export async function getStats() {
  const stats = {};
  for (const storeName of Object.keys(DB_SCHEMA)) {
    stats[storeName] = await count(storeName);
  }
  return stats;
}

// Alias for semantic clarity
export { clear as clearStore };
