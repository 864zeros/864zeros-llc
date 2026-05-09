// crypto-vault.js - Client-Side Encryption Layer [BRK-PWD-001]
// 864zeros Build Kit - HIGH SECURITY BRICK
//
// CRITICAL: 100% client-side encryption using Web Crypto API.
// NO passwords ever touch a server.
// All encryption/decryption happens in the browser.

/**
 * Crypto Vault - Secure local storage for password vaults.
 *
 * Security Model:
 * - AES-256-GCM encryption for vault data
 * - PBKDF2 key derivation from master password
 * - Random salt and IV per encryption operation
 * - Zero server dependencies
 */
export class CryptoVault {
  constructor() {
    // Encryption parameters
    this.ALGORITHM = 'AES-GCM';
    this.KEY_LENGTH = 256;
    this.IV_LENGTH = 12;
    this.SALT_LENGTH = 16;
    this.TAG_LENGTH = 128;

    // PBKDF2 parameters
    this.PBKDF2_ITERATIONS = 600000; // OWASP 2024 recommendation
    this.PBKDF2_HASH = 'SHA-256';

    // Internal state
    this._derivedKey = null;
    this._salt = null;
  }

  /**
   * Check if Web Crypto API is available.
   */
  static isSupported() {
    return typeof crypto !== 'undefined' &&
           crypto.subtle &&
           typeof crypto.subtle.encrypt === 'function';
  }

  /**
   * Initialize vault with master password.
   * This derives the encryption key but stores nothing.
   *
   * @param {string} masterPassword - User's master password
   * @param {Uint8Array} existingSalt - Optional existing salt for unlocking
   * @returns {Promise<Uint8Array>} - The salt (store this to unlock later)
   */
  async initialize(masterPassword, existingSalt = null) {
    if (!CryptoVault.isSupported()) {
      throw new Error('Web Crypto API not available');
    }

    // Generate or use existing salt
    this._salt = existingSalt || crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));

    // Import master password as key material
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(masterPassword);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive AES key using PBKDF2
    this._derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this._salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: this.PBKDF2_HASH
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false, // not extractable
      ['encrypt', 'decrypt']
    );

    console.log('[CryptoVault] Initialized with PBKDF2-derived AES-256-GCM key');
    return this._salt;
  }

  /**
   * Check if vault is initialized with a key.
   */
  isUnlocked() {
    return this._derivedKey !== null;
  }

  /**
   * Lock the vault (clear derived key from memory).
   */
  lock() {
    this._derivedKey = null;
    console.log('[CryptoVault] Vault locked');
  }

  /**
   * Encrypt data using the derived key.
   *
   * @param {Object|string} data - Data to encrypt
   * @returns {Promise<EncryptedPayload>} - Encrypted payload with IV
   */
  async encrypt(data) {
    if (!this.isUnlocked()) {
      throw new Error('Vault is locked. Call initialize() first.');
    }

    // Serialize data
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(plaintext);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
        tagLength: this.TAG_LENGTH
      },
      this._derivedKey,
      plaintextBuffer
    );

    return new EncryptedPayload(
      new Uint8Array(ciphertext),
      iv,
      this._salt
    );
  }

  /**
   * Decrypt data using the derived key.
   *
   * @param {EncryptedPayload} payload - Encrypted payload
   * @returns {Promise<Object|string>} - Decrypted data
   */
  async decrypt(payload) {
    if (!this.isUnlocked()) {
      throw new Error('Vault is locked. Call initialize() first.');
    }

    try {
      const plaintextBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: payload.iv,
          tagLength: this.TAG_LENGTH
        },
        this._derivedKey,
        payload.ciphertext
      );

      const decoder = new TextDecoder();
      const plaintext = decoder.decode(plaintextBuffer);

      // Try to parse as JSON
      try {
        return JSON.parse(plaintext);
      } catch {
        return plaintext;
      }
    } catch (error) {
      throw new Error('Decryption failed. Wrong password or corrupted data.');
    }
  }

  /**
   * Generate a cryptographically secure password.
   *
   * @param {number} length - Password length
   * @param {Object} options - Character set options
   * @returns {string} - Generated password
   */
  static generatePassword(length = 20, options = {}) {
    const {
      lowercase = true,
      uppercase = true,
      numbers = true,
      symbols = true,
      excludeAmbiguous = true
    } = options;

    let charset = '';

    if (lowercase) {
      charset += excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
    }
    if (uppercase) {
      charset += excludeAmbiguous ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    if (numbers) {
      charset += excludeAmbiguous ? '23456789' : '0123456789';
    }
    if (symbols) {
      charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }

    if (charset.length === 0) {
      throw new Error('At least one character set must be enabled');
    }

    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length];
    }

    return password;
  }

  /**
   * Hash data using SHA-256.
   * Useful for checking password against breach databases locally.
   *
   * @param {string} data - Data to hash
   * @returns {Promise<string>} - Hex-encoded hash
   */
  static async hash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate a hash prefix for k-anonymity breach checks.
   * Returns first 5 hex chars of SHA-1 hash (HIBP format).
   *
   * @param {string} password - Password to check
   * @returns {Promise<{prefix: string, suffix: string}>}
   */
  static async getBreachCheckPrefix(password) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fullHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    return {
      prefix: fullHash.substring(0, 5),
      suffix: fullHash.substring(5)
    };
  }
}

/**
 * Encrypted payload container.
 */
export class EncryptedPayload {
  constructor(ciphertext, iv, salt) {
    this.ciphertext = ciphertext;
    this.iv = iv;
    this.salt = salt;
    this.version = 1;
    this.algorithm = 'AES-256-GCM';
    this.kdf = 'PBKDF2';
    this.iterations = 600000;
  }

  /**
   * Serialize to storable format.
   */
  toJSON() {
    return {
      version: this.version,
      algorithm: this.algorithm,
      kdf: this.kdf,
      iterations: this.iterations,
      salt: this._arrayToBase64(this.salt),
      iv: this._arrayToBase64(this.iv),
      ciphertext: this._arrayToBase64(this.ciphertext)
    };
  }

  /**
   * Serialize to string for storage.
   */
  toString() {
    return JSON.stringify(this.toJSON());
  }

  /**
   * Parse from stored format.
   */
  static fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;

    const payload = new EncryptedPayload(
      EncryptedPayload._base64ToArray(data.ciphertext),
      EncryptedPayload._base64ToArray(data.iv),
      EncryptedPayload._base64ToArray(data.salt)
    );

    payload.version = data.version;
    payload.iterations = data.iterations;

    return payload;
  }

  _arrayToBase64(array) {
    return btoa(String.fromCharCode.apply(null, array));
  }

  static _base64ToArray(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

/**
 * Secure Vault Storage - Encrypted IndexedDB wrapper.
 */
export class SecureVaultStorage {
  constructor(dbName = 'passvault_secure') {
    this.dbName = dbName;
    this.dbVersion = 1;
    this.storeName = 'encrypted_vaults';
    this._db = null;
  }

  /**
   * Open the IndexedDB database.
   */
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this._db = request.result;
        resolve(this);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('by-name', 'name', { unique: false });
          store.createIndex('by-updated', 'updatedAt', { unique: false });
        }
      };
    });
  }

  /**
   * Save encrypted vault.
   *
   * @param {string} id - Vault ID
   * @param {string} name - Vault name
   * @param {EncryptedPayload} encryptedData - Encrypted vault data
   */
  async save(id, name, encryptedData) {
    if (!this._db) await this.open();

    const record = {
      id,
      name,
      encrypted: encryptedData.toJSON(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Load encrypted vault.
   *
   * @param {string} id - Vault ID
   * @returns {Promise<EncryptedPayload>}
   */
  async load(id) {
    if (!this._db) await this.open();

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          resolve(EncryptedPayload.fromJSON(request.result.encrypted));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * List all vault metadata (without decrypted content).
   */
  async list() {
    if (!this._db) await this.open();

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result.map(r => ({
          id: r.id,
          name: r.name,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        })));
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a vault.
   */
  async delete(id) {
    if (!this._db) await this.open();

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Export vault for backup (still encrypted).
   */
  async exportVault(id) {
    if (!this._db) await this.open();

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          // Return encrypted backup format
          resolve({
            format: 'passvault_encrypted_backup',
            version: 1,
            exportedAt: new Date().toISOString(),
            data: request.result
          });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// ============================================================================
// USAGE EXAMPLE (for documentation)
// ============================================================================
/*
async function example() {
  // 1. Initialize crypto vault with master password
  const vault = new CryptoVault();
  const salt = await vault.initialize('MySecureMasterPassword123!');

  // 2. Store salt securely (needed to unlock vault later)
  localStorage.setItem('vault_salt', btoa(String.fromCharCode.apply(null, salt)));

  // 3. Import passwords from Dashlane export
  import { parseDashlaneCSV, PasswordVault } from './password-parser.js';
  const importedVault = parseDashlaneCSV(dashlaneExportContent);

  // 4. Run security audit (the "aha!" moment)
  const audit = importedVault.runSecurityAudit();
  console.log('Security Score:', audit.securityScore);
  console.log('Weak passwords:', audit.weak);
  console.log('Reused passwords:', audit.reused);

  // 5. Encrypt and store locally
  const encrypted = await vault.encrypt(importedVault);

  const storage = new SecureVaultStorage();
  await storage.save('main-vault', 'My Passwords', encrypted);

  // 6. Lock vault when not in use
  vault.lock();

  // 7. Later: Unlock and decrypt
  const storedSalt = Uint8Array.from(atob(localStorage.getItem('vault_salt')), c => c.charCodeAt(0));
  await vault.initialize('MySecureMasterPassword123!', storedSalt);

  const encryptedData = await storage.load('main-vault');
  const decryptedVault = await vault.decrypt(encryptedData);
}
*/
