/**
 * Chronicle IndexedDB wrapper
 * Simple, vanilla JS, no dependencies
 */

const DB_NAME = 'chronicle';
const DB_VERSION = 1;

let db = null;

export async function openDB() {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Entries store - conversation metadata
      if (!database.objectStoreNames.contains('entries')) {
        const entries = database.createObjectStore('entries', { keyPath: 'id' });
        entries.createIndex('by-date', 'recordedAt');
        entries.createIndex('by-scribe', 'scribe');
        entries.createIndex('by-starred', 'starred');
      }

      // Exchanges store - individual messages
      if (!database.objectStoreNames.contains('exchanges')) {
        const exchanges = database.createObjectStore('exchanges', { keyPath: 'id' });
        exchanges.createIndex('by-entry', 'entryId');
      }
    };
  });
}

export async function saveEntry(entry, exchanges = []) {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction(['entries', 'exchanges'], 'readwrite');

    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve(entry.id);

    // Save entry
    tx.objectStore('entries').put(entry);

    // Save exchanges
    const exchangeStore = tx.objectStore('exchanges');
    for (const ex of exchanges) {
      exchangeStore.put({ ...ex, entryId: entry.id });
    }
  });
}

export async function getEntries(options = {}) {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction('entries', 'readonly');
    const store = tx.objectStore('entries');
    const request = store.index('by-date').openCursor(null, 'prev');

    const entries = [];
    const limit = options.limit || 100;

    request.onerror = () => reject(request.error);

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor && entries.length < limit) {
        const entry = cursor.value;

        // Apply filters
        if (options.scribe && entry.scribe !== options.scribe) {
          cursor.continue();
          return;
        }
        if (options.starred && !entry.starred) {
          cursor.continue();
          return;
        }

        entries.push(entry);
        cursor.continue();
      } else {
        resolve(entries);
      }
    };
  });
}

export async function getEntry(id) {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction(['entries', 'exchanges'], 'readonly');

    const entryRequest = tx.objectStore('entries').get(id);
    const exchangeRequest = tx.objectStore('exchanges').index('by-entry').getAll(id);

    tx.onerror = () => reject(tx.error);

    tx.oncomplete = () => {
      resolve({
        entry: entryRequest.result,
        exchanges: exchangeRequest.result || []
      });
    };
  });
}

export async function deleteEntry(id) {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction(['entries', 'exchanges'], 'readwrite');

    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    // Delete entry
    tx.objectStore('entries').delete(id);

    // Delete associated exchanges
    const exchangeStore = tx.objectStore('exchanges');
    const index = exchangeStore.index('by-entry');
    const request = index.openCursor(IDBKeyRange.only(id));

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  });
}

export async function updateEntry(id, updates) {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction('entries', 'readwrite');
    const store = tx.objectStore('entries');

    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const entry = getRequest.result;
      if (entry) {
        const updated = { ...entry, ...updates, updatedAt: new Date().toISOString() };
        store.put(updated);
      }
    };

    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();
  });
}

export async function searchEntries(query) {
  const entries = await getEntries({ limit: 500 });
  const q = query.toLowerCase();

  return entries.filter(entry =>
    (entry.title && entry.title.toLowerCase().includes(q)) ||
    (entry.excerpt && entry.excerpt.toLowerCase().includes(q))
  );
}

export async function clearAll() {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction(['entries', 'exchanges'], 'readwrite');

    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    tx.objectStore('entries').clear();
    tx.objectStore('exchanges').clear();
  });
}
