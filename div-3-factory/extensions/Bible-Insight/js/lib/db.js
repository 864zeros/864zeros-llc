/**
 * db.js — IndexedDB Wrapper for Bible Insight
 *
 * The privacy backbone. All captured/created content lives here — never on an external server.
 *
 * Why IndexedDB:
 * - Structured storage with indexes (fast queries by tag, date, type)
 * - No practical size limits (~500MB+ per extension)
 * - Fully local — no network, no cloud dependency
 * - Survives browser restarts, tab closes, extension updates
 * - Per-extension isolation — one extension cannot read another's data
 */

import { DB_NAME, DB_VERSION, DB_SCHEMA } from './constants.js';

let db = null;

/**
 * Initialize or upgrade the database.
 * Called once in service worker onInstalled.
 *
 * @param {string} dbName - Database name
 * @param {number} version - Schema version
 * @param {Object} schema - Store definitions
 * @returns {Promise<IDBDatabase>}
 */
export async function initDB(dbName, version, schema) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onerror = () => {
      console.error('[db] Error opening database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('[db] Database opened successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      console.log('[db] Upgrading database schema...');

      for (const [storeName, config] of Object.entries(schema)) {
        // Skip if store already exists
        if (database.objectStoreNames.contains(storeName)) {
          continue;
        }

        console.log(`[db] Creating store: ${storeName}`);

        const storeOptions = {
          keyPath: config.keyPath
        };

        // Handle compound keys
        if (Array.isArray(config.keyPath)) {
          storeOptions.keyPath = config.keyPath;
        } else if (config.autoIncrement) {
          storeOptions.autoIncrement = true;
        }

        const store = database.createObjectStore(storeName, storeOptions);

        // Create indexes
        if (config.indexes) {
          for (const index of config.indexes) {
            console.log(`[db] Creating index: ${index.name} on ${storeName}`);
            store.createIndex(index.name, index.field, { unique: index.unique || false });
          }
        }
      }

      console.log('[db] Schema upgrade complete');
    };
  });
}

/**
 * Get the database connection, initializing if necessary.
 * @returns {Promise<IDBDatabase>}
 */
async function getDB() {
  if (db) return db;

  // Initialize with constants
  return initDB(DB_NAME, DB_VERSION, DB_SCHEMA);
}

/**
 * Insert or update a record.
 * @param {string} storeName - Object store name
 * @param {Object} record - Record to insert/update
 * @returns {Promise<number|string>} - The record key
 */
export async function put(storeName, record) {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(record);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error(`[db] Error putting record in ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Retrieve a single record by key.
 * @param {string} storeName - Object store name
 * @param {*} key - Record key
 * @returns {Promise<Object|undefined>}
 */
export async function get(storeName, key) {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error(`[db] Error getting record from ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Retrieve all records from a store.
 * @param {string} storeName - Object store name
 * @param {string} [indexName] - Optional index to use
 * @param {IDBKeyRange} [query] - Optional key range
 * @returns {Promise<Array>}
 */
export async function getAll(storeName, indexName = null, query = null) {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const target = indexName ? store.index(indexName) : store;
    const request = query ? target.getAll(query) : target.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      console.error(`[db] Error getting all from ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Delete a single record.
 * @param {string} storeName - Object store name
 * @param {*} key - Record key
 * @returns {Promise<void>}
 */
export async function remove(storeName, key) {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      console.error(`[db] Error deleting from ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Query using an index with a key range.
 * @param {string} storeName - Object store name
 * @param {string} indexName - Index name
 * @param {IDBKeyRange} range - Key range
 * @returns {Promise<Array>}
 */
export async function query(storeName, indexName, range) {
  return getAll(storeName, indexName, range);
}

/**
 * Count total records in a store.
 * @param {string} storeName - Object store name
 * @returns {Promise<number>}
 */
export async function count(storeName) {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error(`[db] Error counting ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Delete all records in a store.
 * @param {string} storeName - Object store name
 * @returns {Promise<void>}
 */
export async function clear(storeName) {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      console.error(`[db] Error clearing ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Export entire database as JSON.
 * @returns {Promise<Object>}
 */
export async function exportAll() {
  const database = await getDB();
  const storeNames = Array.from(database.objectStoreNames);
  const data = {};

  for (const storeName of storeNames) {
    data[storeName] = await getAll(storeName);
  }

  return data;
}

/**
 * Import JSON into database (merges, does not overwrite).
 * @param {Object} data - Data to import
 * @returns {Promise<void>}
 */
export async function importAll(data) {
  for (const [storeName, records] of Object.entries(data)) {
    for (const record of records) {
      await put(storeName, record);
    }
  }
}
