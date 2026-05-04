// breach-checker.js - HIBP k-Anonymity Breach Checker [DELTA]
// 864zeros Build: 864z-2026-004
//
// PRIVACY MODEL: k-Anonymity (OPT-IN)
// - DISABLED by default - user must explicitly enable
// - Only sends first 5 characters of SHA-1 hash
// - API returns ~500 matching suffixes
// - We check locally if our full hash matches
// - Full password NEVER leaves the device
//
// REBUILD FIX: Made opt-in per Z-Audit verdict

import { HIBP, BREACH_CHECK } from './constants.js';

/**
 * Breach Checker - Check passwords against HIBP database.
 *
 * Uses k-Anonymity model:
 * 1. Hash password with SHA-1
 * 2. Send only first 5 chars of hash to HIBP
 * 3. HIBP returns all hashes starting with that prefix
 * 4. Check locally if our full hash is in the response
 *
 * Result: HIBP never sees the full hash, cannot identify password.
 */
export class BreachChecker {
  constructor() {
    this.cache = new Map(); // Cache prefix results
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    this._consentGranted = null; // Cached consent status
  }

  /**
   * Check if user has granted consent for breach checking.
   * Returns cached value if available, otherwise checks storage.
   *
   * @returns {Promise<boolean>}
   */
  async hasConsent() {
    // Return cached value if available
    if (this._consentGranted !== null) {
      return this._consentGranted;
    }

    try {
      // Check chrome.storage for consent
      const stored = await chrome.storage.local.get('settings');
      const settings = stored.settings || {};

      // Default to false (opt-in model)
      this._consentGranted = settings.breachCheck === true;
      return this._consentGranted;
    } catch (error) {
      // If storage unavailable, default to disabled
      console.warn('[BreachChecker] Could not check consent:', error);
      return false;
    }
  }

  /**
   * Clear cached consent (call when settings change).
   */
  clearConsentCache() {
    this._consentGranted = null;
  }

  /**
   * Check if a password has been breached.
   * REQUIRES USER CONSENT - will return disabled result if not granted.
   *
   * @param {string} password - Password to check
   * @returns {Promise<BreachResult>}
   */
  async check(password) {
    if (!password) {
      return new BreachResult(false, 0, 'Empty password');
    }

    // CONSENT CHECK: Verify user has opted in before any network call
    const hasConsent = await this.hasConsent();
    if (!hasConsent) {
      return new BreachResult(false, 0, 'Breach checking disabled', false, true);
    }

    try {
      // Generate SHA-1 hash
      const hash = await this._sha1(password);
      const prefix = hash.substring(0, HIBP.PREFIX_LENGTH).toUpperCase();
      const suffix = hash.substring(HIBP.PREFIX_LENGTH).toUpperCase();

      // Check cache first
      let suffixes = this._getFromCache(prefix);

      if (!suffixes) {
        // Fetch from HIBP API
        suffixes = await this._fetchPrefixRange(prefix);
        this._addToCache(prefix, suffixes);
      }

      // Check if our suffix is in the results
      const match = suffixes.find(s => s.suffix === suffix);

      if (match) {
        return new BreachResult(true, match.count, `Found in ${match.count} breaches`);
      }

      return new BreachResult(false, 0, 'Not found in known breaches');
    } catch (error) {
      console.error('[BreachChecker] Check failed:', error);
      return new BreachResult(false, 0, `Check failed: ${error.message}`, true);
    }
  }

  /**
   * Batch check multiple passwords.
   *
   * @param {string[]} passwords - Array of passwords
   * @returns {Promise<Map<string, BreachResult>>}
   */
  async checkBatch(passwords) {
    const results = new Map();
    const uniquePasswords = [...new Set(passwords)];

    // Process in parallel with concurrency limit
    const CONCURRENCY = 5;
    for (let i = 0; i < uniquePasswords.length; i += CONCURRENCY) {
      const batch = uniquePasswords.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (password) => {
          const result = await this.check(password);
          return { password, result };
        })
      );

      for (const { password, result } of batchResults) {
        results.set(password, result);
      }
    }

    return results;
  }

  /**
   * Get breach summary for a vault.
   * Returns early if breach checking is disabled.
   *
   * @param {PasswordEntry[]} entries - Password entries to check
   * @returns {Promise<BreachSummary>}
   */
  async auditVault(entries) {
    // Check consent before processing
    const hasConsent = await this.hasConsent();
    if (!hasConsent) {
      console.log('[BreachChecker] Breach checking disabled - skipping audit');
      return new BreachSummary([], 0, true); // disabled = true
    }

    console.log(`[BreachChecker] Auditing ${entries.length} entries...`);

    const passwords = entries.map(e => e.password).filter(Boolean);
    const results = await this.checkBatch(passwords);

    const breached = [];
    let totalBreachCount = 0;

    for (const entry of entries) {
      const result = results.get(entry.password);
      if (result && result.breached) {
        entry.audit.breached = true;
        entry.audit.breachCount = result.count;
        entry.audit.issues.push(`Found in ${result.count} data breaches`);
        breached.push({
          entry,
          count: result.count
        });
        totalBreachCount += result.count;
      }
    }

    // Sort by breach count (most breached first)
    breached.sort((a, b) => b.count - a.count);

    console.log(`[BreachChecker] Found ${breached.length} breached passwords`);

    return new BreachSummary(breached, totalBreachCount);
  }

  /**
   * Fetch HIBP range for a prefix.
   *
   * @private
   */
  async _fetchPrefixRange(prefix) {
    const url = `${HIBP.API_URL}${prefix}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': HIBP.USER_AGENT
      }
    });

    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`);
    }

    const text = await response.text();
    return this._parseHIBPResponse(text);
  }

  /**
   * Parse HIBP response format.
   * Format: SUFFIX:COUNT\r\n
   *
   * @private
   */
  _parseHIBPResponse(text) {
    const lines = text.split('\r\n').filter(Boolean);
    return lines.map(line => {
      const [suffix, count] = line.split(':');
      return {
        suffix: suffix.trim(),
        count: parseInt(count, 10)
      };
    });
  }

  /**
   * Compute SHA-1 hash of password.
   *
   * @private
   */
  async _sha1(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get cached prefix results.
   *
   * @private
   */
  _getFromCache(prefix) {
    const cached = this.cache.get(prefix);
    if (!cached) return null;

    // Check expiry
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(prefix);
      return null;
    }

    return cached.data;
  }

  /**
   * Add prefix results to cache.
   *
   * @private
   */
  _addToCache(prefix, data) {
    this.cache.set(prefix, {
      data,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.cache.size > 1000) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
  }

  /**
   * Clear the cache.
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * Result of a breach check.
 */
export class BreachResult {
  constructor(breached, count, message, error = false, disabled = false) {
    this.breached = breached;
    this.count = count;
    this.message = message;
    this.error = error;
    this.disabled = disabled; // True if breach checking is disabled (no consent)
    this.checkedAt = new Date().toISOString();
  }
}

/**
 * Summary of breach audit for a vault.
 */
export class BreachSummary {
  constructor(breachedEntries, totalBreachCount, disabled = false) {
    this.breachedEntries = breachedEntries;
    this.totalBreachCount = totalBreachCount;
    this.breachedCount = breachedEntries.length;
    this.disabled = disabled; // True if breach checking was skipped (no consent)
    this.auditedAt = new Date().toISOString();
  }

  /**
   * Get the most compromised entries.
   */
  getWorstOffenders(limit = 5) {
    return this.breachedEntries.slice(0, limit);
  }

  /**
   * Get breach severity level.
   */
  get severity() {
    if (this.breachedCount === 0) return 'none';
    if (this.breachedCount <= 3) return 'low';
    if (this.breachedCount <= 10) return 'medium';
    if (this.breachedCount <= 25) return 'high';
    return 'critical';
  }

  /**
   * Get human-readable summary.
   */
  getSummaryText() {
    if (this.disabled) {
      return 'Breach checking is disabled. Enable it in Settings to scan for compromised passwords.';
    }

    if (this.breachedCount === 0) {
      return 'No compromised passwords found.';
    }

    return `${this.breachedCount} password${this.breachedCount > 1 ? 's' : ''} found in data breaches. ` +
           `These appear in ${this.totalBreachCount.toLocaleString()} known breach records.`;
  }
}

// Singleton export
export const breachChecker = new BreachChecker();
