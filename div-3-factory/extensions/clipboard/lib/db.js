// ============================================================
// DB.JS — IndexedDB Wrapper
// Local-first storage for ClipBoard.
// ============================================================

const DEBUG = false;
function log(...args) {
  if (DEBUG) console.log('[db]', ...args);
}

let db = null;

/**
 * Initialize or upgrade the IndexedDB database.
 * @param {string} dbName - Database name
 * @param {number} version - Database version
 * @param {object} schema - Schema definition { storeName: { keyPath, indexes } }
 */
export async function initDB(dbName, version, schema) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      log(`Database "${dbName}" opened successfully.`);
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      for (const [storeName, config] of Object.entries(schema)) {
        if (!database.objectStoreNames.contains(storeName)) {
          const store = database.createObjectStore(storeName, {
            keyPath: config.keyPath
          });

          for (const index of config.indexes || []) {
            store.createIndex(index.name, index.field, { unique: index.unique });
          }

          log(`Created object store: ${storeName}`);
        }
      }
    };
  });
}

/**
 * Insert or update a record.
 * @param {string} storeName - Object store name
 * @param {object} record - Record to store
 * @returns {Promise<string>} - Record key
 * @throws {Error} - Throws 'QUOTA_EXCEEDED' if storage is full
 */
export async function put(storeName, record) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(record);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      // Check for QuotaExceededError
      if (request.error?.name === 'QuotaExceededError') {
        const quotaError = new Error('Storage is full — export and clear some data to make room.');
        quotaError.code = 'QUOTA_EXCEEDED';
        reject(quotaError);
      } else {
        reject(request.error);
      }
    };
  });
}

/**
 * Retrieve a single record by key.
 * @param {string} storeName - Object store name
 * @param {string} key - Record key
 * @returns {Promise<object|null>}
 */
export async function get(storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve all records, optionally filtered by index.
 * @param {string} storeName - Object store name
 * @param {string} [indexName] - Optional index name
 * @param {IDBKeyRange} [query] - Optional query range
 * @returns {Promise<array>}
 */
export async function getAll(storeName, indexName, query) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const target = indexName ? store.index(indexName) : store;
    const request = query ? target.getAll(query) : target.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a single record.
 * @param {string} storeName - Object store name
 * @param {string} key - Record key
 */
export async function remove(storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Query using IDBKeyRange.
 * @param {string} storeName - Object store name
 * @param {string} indexName - Index name
 * @param {IDBKeyRange} range - Key range
 * @returns {Promise<array>}
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
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete all records in a store.
 * @param {string} storeName - Object store name
 */
export async function clear(storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Export entire database as JSON.
 * @returns {Promise<object>}
 */
export async function exportAll() {
  const storeNames = Array.from(db.objectStoreNames);
  const data = {};

  for (const storeName of storeNames) {
    data[storeName] = await getAll(storeName);
  }

  return data;
}

/**
 * Import JSON into database. Merges, does not overwrite.
 * @param {object} data - Data to import { storeName: [records] }
 */
export async function importAll(data) {
  for (const [storeName, records] of Object.entries(data)) {
    if (!db.objectStoreNames.contains(storeName)) continue;

    for (const record of records) {
      await put(storeName, record);
    }
  }
}
