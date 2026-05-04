// ============================================================
// DATABASE — Who Is Watching
// IndexedDB wrapper for timeline persistence.
// Pattern: Chronicle/Clipboard hybrid approach.
// ============================================================

const DB_NAME = 'wiw_db';
const DB_VERSION = 1;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes idle

let db = null;

// ============================================================
// INITIALIZATION
// ============================================================

export async function initDB() {
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

      // Sessions store - page visit sessions
      if (!database.objectStoreNames.contains('sessions')) {
        const sessions = database.createObjectStore('sessions', { keyPath: 'id' });
        sessions.createIndex('by-startTime', 'startTime', { unique: false });
        sessions.createIndex('by-domain', 'domain', { unique: false });
      }

      // Events store - timeline entries (all detection types)
      if (!database.objectStoreNames.contains('events')) {
        const events = database.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
        events.createIndex('by-sessionId', 'sessionId', { unique: false });
        events.createIndex('by-timestamp', 'timestamp', { unique: false });
        events.createIndex('by-type', 'type', { unique: false });
        events.createIndex('by-category', 'category', { unique: false });
      }

      // Identities store - graph nodes
      if (!database.objectStoreNames.contains('identities')) {
        const identities = database.createObjectStore('identities', { keyPath: 'id' });
        identities.createIndex('by-sessionId', 'sessionId', { unique: false });
        identities.createIndex('by-type', 'type', { unique: false });
        identities.createIndex('by-value', 'value', { unique: false });
      }

      // Links store - graph edges
      if (!database.objectStoreNames.contains('links')) {
        const links = database.createObjectStore('links', { keyPath: 'id', autoIncrement: true });
        links.createIndex('by-source', 'source', { unique: false });
        links.createIndex('by-target', 'target', { unique: false });
        links.createIndex('by-sessionId', 'sessionId', { unique: false });
      }
    };
  });
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

export async function createSession(url) {
  await ensureDB();

  const session = {
    id: crypto.randomUUID(),
    domain: new URL(url).hostname,
    startUrl: url,
    startTime: Date.now(),
    lastActivity: Date.now(),
    endTime: null,
    vendorCount: 0,
    eventCount: 0
  };

  await put('sessions', session);
  return session;
}

export async function getOrCreateSession(url) {
  await ensureDB();

  const domain = new URL(url).hostname;

  // Find most recent session for this domain
  const existing = await getRecentSessionByDomain(domain);

  if (existing && !isSessionExpired(existing)) {
    // Update last activity
    existing.lastActivity = Date.now();
    await put('sessions', existing);
    return existing;
  }

  // Create new session
  return createSession(url);
}

async function getRecentSessionByDomain(domain) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions', 'readonly');
    const store = tx.objectStore('sessions');
    const index = store.index('by-domain');
    const request = index.openCursor(IDBKeyRange.only(domain), 'prev');

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        resolve(cursor.value);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

function isSessionExpired(session) {
  return Date.now() - session.lastActivity > SESSION_TIMEOUT;
}

export async function updateSessionActivity(sessionId) {
  await ensureDB();

  const session = await get('sessions', sessionId);
  if (session) {
    session.lastActivity = Date.now();
    await put('sessions', session);
  }
}

export async function getSession(sessionId) {
  await ensureDB();
  return get('sessions', sessionId);
}

// ============================================================
// EVENTS (TIMELINE)
// ============================================================

export async function addEvent(sessionId, event) {
  await ensureDB();

  const eventData = {
    sessionId,
    timestamp: Date.now(),
    ...event
  };

  const id = await put('events', eventData);
  eventData.id = id;

  // Update session event count
  const session = await get('sessions', sessionId);
  if (session) {
    session.eventCount = (session.eventCount || 0) + 1;
    session.lastActivity = Date.now();
    await put('sessions', session);
  }

  return eventData;
}

export async function getSessionTimeline(sessionId, options = {}) {
  await ensureDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('events', 'readonly');
    const store = tx.objectStore('events');
    const index = store.index('by-sessionId');
    const request = index.openCursor(IDBKeyRange.only(sessionId), 'prev'); // Newest first

    const events = [];
    const limit = options.limit || 500;
    const category = options.category;

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor && events.length < limit) {
        const evt = cursor.value;

        // Filter by category if specified
        if (category && category !== 'all' && evt.category !== category) {
          cursor.continue();
          return;
        }

        events.push(evt);
        cursor.continue();
      } else {
        // Reverse to get chronological order (oldest first)
        resolve(events.reverse());
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getEventsByType(sessionId, type) {
  await ensureDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('events', 'readonly');
    const store = tx.objectStore('events');
    const index = store.index('by-sessionId');
    const request = index.getAll(IDBKeyRange.only(sessionId));

    request.onsuccess = () => {
      const events = request.result.filter(e => e.type === type);
      resolve(events.sort((a, b) => a.timestamp - b.timestamp));
    };
    request.onerror = () => reject(request.error);
  });
}

// ============================================================
// IDENTITIES (GRAPH NODES)
// ============================================================

export async function addIdentity(sessionId, identity) {
  await ensureDB();

  // Create composite ID for deduplication
  const id = `${sessionId}_${identity.type}_${identity.value}`;

  const existing = await get('identities', id);
  if (existing) {
    // Update existing identity
    existing.lastSeen = Date.now();
    existing.sources = [...new Set([...(existing.sources || []), identity.source])];
    await put('identities', existing);
    return id;
  }

  // Create new identity
  const identityData = {
    id,
    sessionId,
    type: identity.type,
    value: identity.value,
    vendor: identity.vendor,
    source: identity.source,
    sources: [identity.source],
    firstSeen: Date.now(),
    lastSeen: Date.now()
  };

  await put('identities', identityData);
  return id;
}

export async function getSessionIdentities(sessionId) {
  await ensureDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('identities', 'readonly');
    const store = tx.objectStore('identities');
    const index = store.index('by-sessionId');
    const request = index.getAll(IDBKeyRange.only(sessionId));

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getIdentitiesByVendor(sessionId, vendor) {
  await ensureDB();

  const allIdentities = await getSessionIdentities(sessionId);
  return allIdentities.filter(id => id.vendor === vendor);
}

export async function getEvent(eventId) {
  await ensureDB();
  return get('events', eventId);
}

// ============================================================
// LINKS (GRAPH EDGES)
// ============================================================

export async function linkIdentities(sessionId, sourceId, targetId, reason) {
  await ensureDB();

  // Check if link already exists
  const existing = await findLink(sourceId, targetId);
  if (existing) return existing.id;

  const linkData = {
    sessionId,
    source: sourceId,
    target: targetId,
    reason,
    timestamp: Date.now()
  };

  return put('links', linkData);
}

async function findLink(sourceId, targetId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('links', 'readonly');
    const store = tx.objectStore('links');
    const index = store.index('by-source');
    const request = index.openCursor(IDBKeyRange.only(sourceId));

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.target === targetId) {
          resolve(cursor.value);
          return;
        }
        cursor.continue();
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getSessionLinks(sessionId) {
  await ensureDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('links', 'readonly');
    const store = tx.objectStore('links');
    const index = store.index('by-sessionId');
    const request = index.getAll(IDBKeyRange.only(sessionId));

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================
// IDENTITY GRAPH (COMBINED FOR D3)
// ============================================================

export async function getIdentityGraph(sessionId) {
  await ensureDB();

  const [rawNodes, rawLinks] = await Promise.all([
    getSessionIdentities(sessionId),
    getSessionLinks(sessionId)
  ]);

  // Create a map of ID -> identity for value lookup
  const nodeMap = new Map();
  rawNodes.forEach(n => nodeMap.set(n.id, n));

  // Filter links:
  // 1. Remove self-referential links (source === target)
  // 2. Remove links where source and target have the same value (same identity, different IDs)
  // 3. Deduplicate by source+target combination
  const seenLinks = new Set();
  const validLinks = rawLinks.filter(l => {
    // Check self-reference by ID
    if (l.source === l.target) return false;

    // Check if source and target have the same value (same identity stored multiple times)
    const sourceNode = nodeMap.get(l.source);
    const targetNode = nodeMap.get(l.target);
    if (sourceNode && targetNode) {
      // Same type AND same value = same identity, skip the link
      if (sourceNode.type === targetNode.type && sourceNode.value === targetNode.value) {
        return false;
      }
    }

    // Deduplicate: only keep first occurrence of each source->target pair
    const linkKey = `${l.source}->${l.target}`;
    const reverseLinkKey = `${l.target}->${l.source}`;
    if (seenLinks.has(linkKey) || seenLinks.has(reverseLinkKey)) {
      return false;
    }
    seenLinks.add(linkKey);

    return true;
  });

  // Transform for D3 force graph
  return {
    nodes: rawNodes.map(n => ({
      id: n.id,
      type: n.type,
      value: n.value,
      vendor: n.vendor,
      sources: n.sources
    })),
    links: validLinks.map(l => ({
      source: l.source,
      target: l.target,
      reason: l.reason
    }))
  };
}

// ============================================================
// AUTO-LINKING LOGIC
// ============================================================

export async function autoLinkIdentities(sessionId) {
  await ensureDB();

  const identities = await getSessionIdentities(sessionId);
  console.log('[WIW-DB] autoLinkIdentities:', identities.length, 'identities');

  if (identities.length < 2) return;

  // Group by vendor
  const byVendor = {};
  identities.forEach(id => {
    if (id.vendor) {
      if (!byVendor[id.vendor]) byVendor[id.vendor] = [];
      byVendor[id.vendor].push(id);
    }
  });

  // Link identities from same vendor
  // Only link if they are different identity types OR different values
  for (const vendor of Object.keys(byVendor)) {
    const vendorIds = byVendor[vendor];
    for (let i = 0; i < vendorIds.length; i++) {
      for (let j = i + 1; j < vendorIds.length; j++) {
        const a = vendorIds[i];
        const b = vendorIds[j];
        // Skip if same type AND same value (duplicate entries for same identity)
        if (a.type === b.type && a.value === b.value) {
          continue;
        }
        console.log('[WIW-DB] Linking same vendor:', vendor, a.type, '↔', b.type);
        await linkIdentities(sessionId, a.id, b.id, `same_vendor:${vendor}`);
      }
    }
  }

  // Special linking rules
  const ecid = identities.find(i => i.type === 'ECID');
  const cuid = identities.find(i => i.type === 'CUID');
  const userId = identities.find(i => i.type === 'USER_ID');
  const gaCid = identities.find(i => i.type === 'GA_CID');

  // Adobe ECID ↔ CUID stitching
  if (ecid && cuid) {
    console.log('[WIW-DB] Linking ECID ↔ CUID (adobe_stitching)');
    await linkIdentities(sessionId, ecid.id, cuid.id, 'adobe_stitching');
  }

  // ECID ↔ USER_ID (known user)
  if (ecid && userId) {
    console.log('[WIW-DB] Linking ECID ↔ USER_ID (user_identification)');
    await linkIdentities(sessionId, ecid.id, userId.id, 'user_identification');
  }

  // GA_CID ↔ USER_ID (known user)
  if (gaCid && userId) {
    console.log('[WIW-DB] Linking GA_CID ↔ USER_ID (user_identification)');
    await linkIdentities(sessionId, gaCid.id, userId.id, 'user_identification');
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

async function ensureDB() {
  if (!db) {
    await initDB();
  }
}

function put(storeName, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function get(storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllData() {
  await ensureDB();

  console.log('[WIW-DB] Clearing all data...');

  // Clear all object stores
  const stores = ['sessions', 'events', 'identities', 'links'];

  for (const storeName of stores) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  console.log('[WIW-DB] All data cleared');
  return true;
}

export async function clearSession(sessionId) {
  await ensureDB();

  // Delete events for this session
  const events = await getSessionTimeline(sessionId, { limit: 10000 });
  const tx1 = db.transaction('events', 'readwrite');
  const store1 = tx1.objectStore('events');
  for (const evt of events) {
    store1.delete(evt.id);
  }

  // Delete identities for this session
  const identities = await getSessionIdentities(sessionId);
  const tx2 = db.transaction('identities', 'readwrite');
  const store2 = tx2.objectStore('identities');
  for (const id of identities) {
    store2.delete(id.id);
  }

  // Delete links for this session
  const links = await getSessionLinks(sessionId);
  const tx3 = db.transaction('links', 'readwrite');
  const store3 = tx3.objectStore('links');
  for (const link of links) {
    store3.delete(link.id);
  }

  // Delete session
  const tx4 = db.transaction('sessions', 'readwrite');
  tx4.objectStore('sessions').delete(sessionId);

  return true;
}

export async function getStats() {
  await ensureDB();

  const tx = db.transaction(['sessions', 'events', 'identities', 'links'], 'readonly');

  const [sessions, events, identities, links] = await Promise.all([
    countStore(tx.objectStore('sessions')),
    countStore(tx.objectStore('events')),
    countStore(tx.objectStore('identities')),
    countStore(tx.objectStore('links'))
  ]);

  return { sessions, events, identities, links };
}

function countStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

console.log('[who-is-watching] db.js loaded');
