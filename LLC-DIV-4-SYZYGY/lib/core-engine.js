/**
 * SYZYGY Core Engine — platform-agnostic Bone (v0.1.0)
 *
 * Runtime: auto-detects Chrome extension OR Apps Script V8 OR fallback (tests).
 * Loading:
 *   - Chrome:      <script src="../lib/core-engine.js"></script> in options/panel/popup HTML.
 *                  Attaches to globalThis.SyzygyCoreEngine + window.SyzygyCoreEngine.
 *   - Apps Script: Paste / clasp-sync into the project as a sibling .gs file (rename to
 *                  CoreEngine.gs in the editor — content unchanged). The factory IIFE runs
 *                  at load; SyzygyCoreEngine is assigned to the global namespace.
 *
 * Modules (see README §II):
 *   • Storage    — 9KB-chunked wrapper (storageSet/Get/Remove)
 *   • Theme      — 3-state cycler (getTheme/setTheme/cycleTheme)
 *   • Billing    — abstract tier interface (getBillingTier/setBillingTier/isVaultUnlocked)
 *   • Crypto     — AES-GCM via Web Crypto (encryptVault/decryptVault — Chrome runtime only)
 *   • Drive Vault— stateless directory listing (driveListDirectory/driveFolderBreadcrumbs)
 *   • HTTP       — fetch (Chrome) vs UrlFetchApp (Apps Script) abstraction (httpGet)
 *
 * Strike: SYZYGY-001
 */

(function (root, factory) {
  var Engine = factory();
  if (typeof globalThis !== 'undefined') globalThis.SyzygyCoreEngine = Engine;
  if (typeof window !== 'undefined')      window.SyzygyCoreEngine = Engine;
  if (root && root !== globalThis)         root.SyzygyCoreEngine = Engine;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ============================================================
  // Environment detection
  // ============================================================

  function isWorkspace() {
    return typeof PropertiesService !== 'undefined';
  }

  function isChrome() {
    return typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined';
  }

  // In-memory fallback for tests / unknown environments
  var _memStore = Object.create(null);

  // ============================================================
  // Storage wrapper — 9KB Rule chunking for Workspace
  // ============================================================

  var CHUNK_SIZE = 8000;             // bytes; safety margin below ~9KB ceiling
  var CHUNK_META_SUFFIX = '__chunks';

  function chunkString(s, size) {
    var out = [];
    for (var i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
    return out;
  }

  function _cleanupWorkspaceChunks(props, key) {
    var meta = props.getProperty(key + CHUNK_META_SUFFIX);
    if (!meta) return;
    var n = parseInt(meta, 10);
    for (var i = 0; i < n; i++) props.deleteProperty(key + '__' + i);
    props.deleteProperty(key + CHUNK_META_SUFFIX);
  }

  async function storageSet(key, value) {
    var serialized = JSON.stringify(value);

    if (isWorkspace()) {
      var props = PropertiesService.getUserProperties();
      if (serialized.length <= CHUNK_SIZE) {
        props.setProperty(key, serialized);
        _cleanupWorkspaceChunks(props, key);
      } else {
        var chunks = chunkString(serialized, CHUNK_SIZE);
        // Clear any base key + prior chunks before writing fresh
        props.deleteProperty(key);
        _cleanupWorkspaceChunks(props, key);
        props.setProperty(key + CHUNK_META_SUFFIX, String(chunks.length));
        for (var i = 0; i < chunks.length; i++) {
          props.setProperty(key + '__' + i, chunks[i]);
        }
      }
      return value;
    }

    if (isChrome()) {
      await chrome.storage.local.set({ [key]: value });
      return value;
    }

    _memStore[key] = serialized;
    return value;
  }

  async function storageGet(key) {
    if (isWorkspace()) {
      var props = PropertiesService.getUserProperties();
      var meta = props.getProperty(key + CHUNK_META_SUFFIX);
      if (meta) {
        var n = parseInt(meta, 10);
        var parts = new Array(n);
        for (var i = 0; i < n; i++) parts[i] = props.getProperty(key + '__' + i) || '';
        return JSON.parse(parts.join(''));
      }
      var raw = props.getProperty(key);
      return raw == null ? null : JSON.parse(raw);
    }

    if (isChrome()) {
      var got = await chrome.storage.local.get(key);
      return got[key] == null ? null : got[key];
    }

    var v = _memStore[key];
    return v == null ? null : JSON.parse(v);
  }

  async function storageRemove(key) {
    if (isWorkspace()) {
      var props = PropertiesService.getUserProperties();
      props.deleteProperty(key);
      _cleanupWorkspaceChunks(props, key);
      return;
    }
    if (isChrome()) {
      await chrome.storage.local.remove(key);
      return;
    }
    delete _memStore[key];
  }

  // ============================================================
  // Theme state — 3-state cycler (dark / light / system)
  // ============================================================

  var THEME_KEY = '864z_user_theme';
  var THEME_STATES = ['dark', 'light', 'system'];

  async function getTheme() {
    var mode = await storageGet(THEME_KEY);
    return THEME_STATES.indexOf(mode) !== -1 ? mode : 'system';
  }

  async function setTheme(mode) {
    if (THEME_STATES.indexOf(mode) === -1) throw new Error('Invalid theme: ' + mode);
    await storageSet(THEME_KEY, mode);
    return mode;
  }

  async function cycleTheme() {
    var current = await getTheme();
    var idx = THEME_STATES.indexOf(current);
    var next = THEME_STATES[(idx + 1) % THEME_STATES.length];
    return await setTheme(next);
  }

  // ============================================================
  // Billing checks — abstract tier interface
  // ============================================================

  var BILLING_KEY = '864z_billing_tier';
  var BILLING_TIERS = ['free', 'vault', 'power'];

  async function getBillingTier() {
    var t = await storageGet(BILLING_KEY);
    return BILLING_TIERS.indexOf(t) !== -1 ? t : 'free';
  }

  async function setBillingTier(tier) {
    if (BILLING_TIERS.indexOf(tier) === -1) throw new Error('Invalid tier: ' + tier);
    await storageSet(BILLING_KEY, tier);
    return tier;
  }

  async function isVaultUnlocked() {
    var t = await getBillingTier();
    return t === 'vault' || t === 'power';
  }

  // ============================================================
  // Trust Vault encryption — AES-GCM via Web Crypto
  // ------------------------------------------------------------
  // Chrome runtime ONLY. Apps Script has no window.crypto.subtle; the
  // addon stores/retrieves opaque ciphertext but does NOT decrypt
  // server-side. User encrypts on Chrome, syncs via Drive/storage,
  // decrypts on Chrome. RULE-007 sovereignty preserved: encryption
  // happens client-side; passphrase never leaves the device.
  // ============================================================

  function _hasSubtleCrypto() {
    return typeof crypto !== 'undefined'
      && typeof crypto.subtle !== 'undefined'
      && typeof crypto.getRandomValues === 'function';
  }

  async function _deriveKey(passphrase, salt) {
    if (!_hasSubtleCrypto()) {
      throw new Error('SYZYGY crypto: Web Crypto unavailable (Apps Script runtime). Encrypt on Chrome.');
    }
    var baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passphrase),
      'PBKDF2', false, ['deriveKey']
    );
    return await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false, ['encrypt', 'decrypt']
    );
  }

  function _bytesToBase64(bytes) {
    var binary = '';
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function _base64ToBytes(b64) {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function encryptVault(plaintextObj, passphrase) {
    if (!_hasSubtleCrypto()) {
      throw new Error('SYZYGY crypto: Web Crypto unavailable.');
    }
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var key = await _deriveKey(passphrase, salt);
    var plaintext = new TextEncoder().encode(JSON.stringify(plaintextObj));
    var ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, plaintext);

    // Bundle: salt(16) || iv(12) || ciphertext  →  base64
    var bundle = new Uint8Array(salt.byteLength + iv.byteLength + ciphertext.byteLength);
    bundle.set(salt, 0);
    bundle.set(iv, salt.byteLength);
    bundle.set(new Uint8Array(ciphertext), salt.byteLength + iv.byteLength);

    return {
      version: 1,
      algorithm: 'AES-GCM-256',
      kdf: 'PBKDF2-SHA256-100k',
      saltBytes: salt.byteLength,
      ivBytes: iv.byteLength,
      payload: _bytesToBase64(bundle)
    };
  }

  async function decryptVault(bundle, passphrase) {
    if (!_hasSubtleCrypto()) {
      throw new Error('SYZYGY crypto: Web Crypto unavailable.');
    }
    if (!bundle || bundle.version !== 1) throw new Error('Unsupported vault bundle version');
    var blob = _base64ToBytes(bundle.payload);
    var saltLen = bundle.saltBytes || 16;
    var ivLen = bundle.ivBytes || 12;
    var salt = blob.slice(0, saltLen);
    var iv = blob.slice(saltLen, saltLen + ivLen);
    var ciphertext = blob.slice(saltLen + ivLen);
    var key = await _deriveKey(passphrase, salt);
    var plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(plaintext));
  }

  // ============================================================
  // HTTP — fetch (Chrome) vs UrlFetchApp.fetch (Apps Script)
  // ============================================================

  async function httpGet(url, headers) {
    headers = headers || {};
    if (isWorkspace()) {
      // UrlFetchApp is sync in Apps Script; wrap for async parity.
      var res = UrlFetchApp.fetch(url, {
        method: 'get',
        headers: headers,
        muteHttpExceptions: true
      });
      var code = res.getResponseCode();
      if (code < 200 || code >= 300) {
        throw new Error('HTTP ' + code + ' (Workspace UrlFetchApp): ' + url);
      }
      return JSON.parse(res.getContentText());
    }
    // Chrome / other fetch-capable
    var response = await fetch(url, { headers: headers });
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' (' + response.statusText + '): ' + url);
    }
    return await response.json();
  }

  // ============================================================
  // Drive Vault — stateless async-first directory listing
  // (ported from [864F] clipboard/lib/google-drive/drive-client.js)
  // Caller is responsible for the accessToken; engine never stores it.
  // ============================================================

  var DRIVE_API_V3 = 'https://www.googleapis.com/drive/v3';

  async function driveListDirectory(accessToken, folderId, opts) {
    if (!accessToken) throw new Error('SYZYGY drive: accessToken required');
    folderId = folderId || 'root';
    opts = opts || {};
    var params = [
      'q=' + encodeURIComponent("'" + folderId + "' in parents and trashed = false"),
      'fields=' + encodeURIComponent('files(id,name,mimeType,size,modifiedTime,iconLink,webViewLink),nextPageToken'),
      'orderBy=' + encodeURIComponent(opts.orderBy || 'folder,name'),
      'pageSize=' + encodeURIComponent(String(opts.pageSize || 100))
    ];
    if (opts.pageToken) params.push('pageToken=' + encodeURIComponent(opts.pageToken));
    var url = DRIVE_API_V3 + '/files?' + params.join('&');
    var data = await httpGet(url, { Authorization: 'Bearer ' + accessToken });
    return {
      files: data.files || [],
      nextPageToken: data.nextPageToken || null
    };
  }

  async function driveFolderBreadcrumbs(accessToken, folderId) {
    if (!accessToken) throw new Error('SYZYGY drive: accessToken required');
    var crumbs = [];
    var current = folderId;
    // Walk up via parents (Drive API returns at most one parent per file)
    var safety = 0;
    while (current && current !== 'root' && safety < 32) {
      var node = await httpGet(
        DRIVE_API_V3 + '/files/' + encodeURIComponent(current) + '?fields=id,name,parents',
        { Authorization: 'Bearer ' + accessToken }
      );
      crumbs.unshift({ id: node.id, name: node.name });
      current = node.parents && node.parents[0] ? node.parents[0] : null;
      safety++;
    }
    crumbs.unshift({ id: 'root', name: 'My Drive' });
    return crumbs;
  }

  // ============================================================
  // Public API
  // ============================================================

  return {
    // env
    isWorkspace: isWorkspace,
    isChrome: isChrome,
    // storage
    storageSet: storageSet,
    storageGet: storageGet,
    storageRemove: storageRemove,
    CHUNK_SIZE: CHUNK_SIZE,
    // theme
    getTheme: getTheme,
    setTheme: setTheme,
    cycleTheme: cycleTheme,
    THEME_STATES: THEME_STATES.slice(),
    // billing
    getBillingTier: getBillingTier,
    setBillingTier: setBillingTier,
    isVaultUnlocked: isVaultUnlocked,
    BILLING_TIERS: BILLING_TIERS.slice(),
    // crypto
    encryptVault: encryptVault,
    decryptVault: decryptVault,
    // drive vault
    driveListDirectory: driveListDirectory,
    driveFolderBreadcrumbs: driveFolderBreadcrumbs,
    // http
    httpGet: httpGet,
    // version
    VERSION: '0.1.0-syzygy-strike-001'
  };
});
