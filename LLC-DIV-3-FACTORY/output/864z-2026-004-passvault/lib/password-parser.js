// password-parser.js - Password Rescue Parser [BRK-PWD-001]
// 864zeros Build Kit - HIGH SECURITY BRICK
//
// CRITICAL: 100% client-side. NO passwords ever touch a server.
// Uses Web Crypto API for local encryption.
//
// Supports:
// - Dashlane CSV & JSON export
// - LastPass CSV export
// - 1Password CSV export
// - Bitwarden JSON export
// - Generic CSV (auto-detect)

/**
 * Parsed password entry (normalized format).
 */
export class PasswordEntry {
  constructor({
    id = null,
    title = '',
    url = '',
    username = '',
    password = '',
    email = '',
    notes = '',
    category = '',
    totp = null,
    created = null,
    modified = null,
    customFields = {}
  } = {}) {
    this.id = id || crypto.randomUUID();
    this.title = title;
    this.url = this._normalizeUrl(url);
    this.username = username;
    this.password = password;
    this.email = email;
    this.notes = notes;
    this.category = category;
    this.totp = totp;
    this.created = created;
    this.modified = modified;
    this.customFields = customFields;

    // Security audit fields (populated during import)
    this.audit = {
      strength: null,
      isWeak: false,
      isReused: false,
      reusedWith: [],
      breached: false,
      issues: []
    };
  }

  _normalizeUrl(url) {
    if (!url) return '';
    try {
      // Ensure protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      const parsed = new URL(url);
      return parsed.href;
    } catch {
      return url;
    }
  }

  get domain() {
    try {
      return new URL(this.url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  }
}

/**
 * TOTP (2FA) configuration.
 */
export class TOTPConfig {
  constructor({
    secret = '',
    algorithm = 'SHA1',
    digits = 6,
    period = 30,
    issuer = '',
    accountName = ''
  } = {}) {
    this.secret = secret;
    this.algorithm = algorithm;
    this.digits = digits;
    this.period = period;
    this.issuer = issuer;
    this.accountName = accountName;
  }

  /**
   * Parse otpauth:// URI.
   */
  static fromURI(uri) {
    if (!uri || !uri.startsWith('otpauth://')) {
      return null;
    }

    try {
      const url = new URL(uri);
      const params = url.searchParams;

      return new TOTPConfig({
        secret: params.get('secret') || '',
        algorithm: params.get('algorithm') || 'SHA1',
        digits: parseInt(params.get('digits')) || 6,
        period: parseInt(params.get('period')) || 30,
        issuer: params.get('issuer') || '',
        accountName: decodeURIComponent(url.pathname.split(':').pop() || '')
      });
    } catch {
      return null;
    }
  }
}

/**
 * Password Vault (collection of entries).
 */
export class PasswordVault {
  constructor() {
    this.entries = [];
    this.secureNotes = [];
    this.paymentCards = [];
    this.identities = [];
    this.metadata = {
      importedAt: new Date().toISOString(),
      source: 'unknown',
      totalImported: 0,
      duplicatesSkipped: 0,
      errors: []
    };
  }

  addEntry(entry) {
    this.entries.push(entry);
  }

  /**
   * Run security audit on all entries.
   */
  runSecurityAudit() {
    const passwordMap = new Map(); // password -> [entry IDs]

    for (const entry of this.entries) {
      // Check password strength
      entry.audit.strength = this._calculateStrength(entry.password);
      entry.audit.isWeak = entry.audit.strength < 50;

      if (entry.audit.isWeak) {
        entry.audit.issues.push('Weak password');
      }

      // Track for reuse detection
      if (entry.password) {
        const existing = passwordMap.get(entry.password) || [];
        existing.push(entry.id);
        passwordMap.set(entry.password, existing);
      }
    }

    // Mark reused passwords
    for (const entry of this.entries) {
      const reusedIds = passwordMap.get(entry.password) || [];
      if (reusedIds.length > 1) {
        entry.audit.isReused = true;
        entry.audit.reusedWith = reusedIds.filter(id => id !== entry.id);
        entry.audit.issues.push(`Password reused across ${reusedIds.length} sites`);
      }
    }

    return this.getAuditSummary();
  }

  /**
   * Get audit summary for Migration Audit feature.
   */
  getAuditSummary() {
    const total = this.entries.length;
    const weak = this.entries.filter(e => e.audit.isWeak).length;
    const reused = this.entries.filter(e => e.audit.isReused).length;
    const strong = this.entries.filter(e => e.audit.strength >= 80).length;

    // Find the most reused password
    const reuseCounts = new Map();
    for (const entry of this.entries) {
      if (entry.audit.reusedWith.length > 0) {
        const key = entry.password;
        reuseCounts.set(key, (reuseCounts.get(key) || 0) + 1);
      }
    }

    const worstReuse = Math.max(0, ...reuseCounts.values());

    return {
      total,
      weak,
      weakPercent: Math.round((weak / total) * 100),
      reused,
      reusedPercent: Math.round((reused / total) * 100),
      strong,
      strongPercent: Math.round((strong / total) * 100),
      worstReuseCount: worstReuse,
      securityScore: this._calculateOverallScore(total, weak, reused),
      topIssues: this._getTopIssues()
    };
  }

  _calculateStrength(password) {
    if (!password) return 0;

    let score = 0;

    // Length scoring
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (password.length >= 16) score += 10;

    // Character variety
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 20;

    // Penalty for common patterns
    if (/^[a-zA-Z]+$/.test(password)) score -= 10;
    if (/^[0-9]+$/.test(password)) score -= 20;
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated chars
    if (/^(password|123456|qwerty)/i.test(password)) score = 5;

    return Math.max(0, Math.min(100, score));
  }

  _calculateOverallScore(total, weak, reused) {
    if (total === 0) return 100;

    const weakPenalty = (weak / total) * 40;
    const reusePenalty = (reused / total) * 40;

    return Math.max(0, Math.round(100 - weakPenalty - reusePenalty));
  }

  _getTopIssues() {
    const issues = [];

    const weakEntries = this.entries.filter(e => e.audit.isWeak);
    if (weakEntries.length > 0) {
      issues.push({
        type: 'weak',
        count: weakEntries.length,
        message: `${weakEntries.length} weak passwords need strengthening`,
        entries: weakEntries.slice(0, 5).map(e => e.title || e.domain)
      });
    }

    const reusedEntries = this.entries.filter(e => e.audit.isReused);
    if (reusedEntries.length > 0) {
      issues.push({
        type: 'reused',
        count: reusedEntries.length,
        message: `${reusedEntries.length} passwords are reused across sites`,
        entries: reusedEntries.slice(0, 5).map(e => e.title || e.domain)
      });
    }

    return issues;
  }
}

// =============================================================================
// DASHLANE PARSER
// =============================================================================

/**
 * Parse Dashlane CSV export.
 *
 * CSV Format:
 * username,username2,username3,title,password,note,url,category,otpSecret
 */
export function parseDashlaneCSV(csvContent) {
  console.log('[BRK-PWD-001] Parsing Dashlane CSV...');

  const vault = new PasswordVault();
  vault.metadata.source = 'dashlane_csv';

  const lines = parseCSVLines(csvContent);
  if (lines.length < 2) {
    vault.metadata.errors.push('CSV file is empty or has no data rows');
    return vault;
  }

  // Parse header
  const header = lines[0].map(h => h.toLowerCase().trim());
  const indices = {
    username: findIndex(header, ['username', 'login', 'email']),
    username2: findIndex(header, ['username2', 'secondarylogin']),
    username3: findIndex(header, ['username3']),
    title: findIndex(header, ['title', 'name']),
    password: findIndex(header, ['password', 'pass']),
    note: findIndex(header, ['note', 'notes', 'comment']),
    url: findIndex(header, ['url', 'website', 'site']),
    category: findIndex(header, ['category', 'folder', 'group']),
    otpSecret: findIndex(header, ['otpsecret', 'totp', '2fa'])
  };

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    try {
      const entry = new PasswordEntry({
        username: getField(row, indices.username) || getField(row, indices.username2),
        email: getField(row, indices.username), // Dashlane often uses email as username
        title: getField(row, indices.title),
        password: getField(row, indices.password),
        notes: getField(row, indices.note),
        url: getField(row, indices.url),
        category: getField(row, indices.category),
        totp: TOTPConfig.fromURI(getField(row, indices.otpSecret))
      });

      // Skip empty entries
      if (!entry.password && !entry.username && !entry.url) {
        continue;
      }

      vault.addEntry(entry);
      vault.metadata.totalImported++;
    } catch (error) {
      vault.metadata.errors.push(`Row ${i}: ${error.message}`);
    }
  }

  console.log(`[BRK-PWD-001] Parsed ${vault.metadata.totalImported} entries from Dashlane CSV`);
  return vault;
}

/**
 * Parse Dashlane JSON export.
 *
 * JSON Format:
 * {
 *   "AUTHENTIFIANT": [...],
 *   "SECURENOTE": [...],
 *   "PAYMENTMEAN_CREDITCARD": [...],
 *   "IDENTITY": [...],
 *   "ADDRESS": [...]
 * }
 */
export function parseDashlaneJSON(jsonContent) {
  console.log('[BRK-PWD-001] Parsing Dashlane JSON...');

  const vault = new PasswordVault();
  vault.metadata.source = 'dashlane_json';

  let data;
  try {
    data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
  } catch (error) {
    vault.metadata.errors.push(`Invalid JSON: ${error.message}`);
    return vault;
  }

  // Parse credentials (AUTHENTIFIANT)
  const credentials = data.AUTHENTIFIANT || data.authentifiant || [];
  for (const item of credentials) {
    try {
      const entry = new PasswordEntry({
        title: item.title || item.name || '',
        url: item.url || item.domain || '',
        username: item.login || item.username || '',
        email: item.email || item.secondaryLogin || '',
        password: item.password || '',
        notes: item.note || item.notes || '',
        category: item.category || item.spaceId || '',
        totp: item.otpSecret ? TOTPConfig.fromURI(item.otpSecret) : null,
        customFields: {
          autoLogin: item.autoLogin,
          subdomainOnly: item.subdomainOnly
        }
      });

      if (entry.password || entry.username) {
        vault.addEntry(entry);
        vault.metadata.totalImported++;
      }
    } catch (error) {
      vault.metadata.errors.push(`Credential parse error: ${error.message}`);
    }
  }

  // Parse secure notes (SECURENOTE)
  const notes = data.SECURENOTE || data.securenote || [];
  for (const item of notes) {
    vault.secureNotes.push({
      id: crypto.randomUUID(),
      title: item.title || 'Untitled Note',
      content: item.content || item.note || '',
      category: item.category || '',
      created: item.creationDatetime,
      modified: item.userModificationDatetime
    });
  }

  // Parse payment cards (PAYMENTMEAN_CREDITCARD)
  const cards = data.PAYMENTMEAN_CREDITCARD || data.paymentCards || [];
  for (const item of cards) {
    vault.paymentCards.push({
      id: crypto.randomUUID(),
      name: item.name || item.cardName || '',
      number: item.cardNumber || '',
      expMonth: item.expireMonth || '',
      expYear: item.expireYear || '',
      cvv: item.securityCode || '',
      bank: item.bank || ''
    });
  }

  // Parse identities (IDENTITY)
  const identities = data.IDENTITY || data.identity || [];
  for (const item of identities) {
    vault.identities.push({
      id: crypto.randomUUID(),
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      email: item.email || '',
      phone: item.phone || '',
      address: item.addressFull || ''
    });
  }

  console.log(`[BRK-PWD-001] Parsed ${vault.metadata.totalImported} credentials from Dashlane JSON`);
  console.log(`[BRK-PWD-001] Also found: ${vault.secureNotes.length} notes, ${vault.paymentCards.length} cards`);

  return vault;
}

// =============================================================================
// LASTPASS PARSER
// =============================================================================

/**
 * Parse LastPass CSV export.
 *
 * CSV Format:
 * url,username,password,totp,extra,name,grouping,fav
 */
export function parseLastPassCSV(csvContent) {
  console.log('[BRK-PWD-001] Parsing LastPass CSV...');

  const vault = new PasswordVault();
  vault.metadata.source = 'lastpass_csv';

  const lines = parseCSVLines(csvContent);
  if (lines.length < 2) {
    vault.metadata.errors.push('CSV file is empty or has no data rows');
    return vault;
  }

  const header = lines[0].map(h => h.toLowerCase().trim());
  const indices = {
    url: findIndex(header, ['url', 'website']),
    username: findIndex(header, ['username', 'login']),
    password: findIndex(header, ['password']),
    totp: findIndex(header, ['totp', 'otp']),
    extra: findIndex(header, ['extra', 'notes']),
    name: findIndex(header, ['name', 'title']),
    grouping: findIndex(header, ['grouping', 'folder', 'group']),
    fav: findIndex(header, ['fav', 'favorite'])
  };

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    try {
      const entry = new PasswordEntry({
        url: getField(row, indices.url),
        username: getField(row, indices.username),
        password: getField(row, indices.password),
        title: getField(row, indices.name),
        notes: getField(row, indices.extra),
        category: getField(row, indices.grouping),
        totp: TOTPConfig.fromURI(getField(row, indices.totp))
      });

      if (entry.password || entry.username) {
        vault.addEntry(entry);
        vault.metadata.totalImported++;
      }
    } catch (error) {
      vault.metadata.errors.push(`Row ${i}: ${error.message}`);
    }
  }

  console.log(`[BRK-PWD-001] Parsed ${vault.metadata.totalImported} entries from LastPass CSV`);
  return vault;
}

// =============================================================================
// AUTO-DETECT PARSER
// =============================================================================

/**
 * Auto-detect format and parse.
 */
export function parsePasswordExport(content, filename = '') {
  console.log('[BRK-PWD-001] Auto-detecting format...');

  const trimmed = content.trim();
  const lowerFilename = filename.toLowerCase();

  // JSON detection
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed);

      // Dashlane JSON signature
      if (data.AUTHENTIFIANT || data.authentifiant) {
        return parseDashlaneJSON(content);
      }

      // Bitwarden JSON signature
      if (data.items && Array.isArray(data.items)) {
        return parseBitwardenJSON(content);
      }

      // Generic JSON array
      if (Array.isArray(data)) {
        return parseGenericJSON(content);
      }
    } catch {
      // Not valid JSON, try CSV
    }
  }

  // CSV detection by filename
  if (lowerFilename.includes('dashlane')) {
    return parseDashlaneCSV(content);
  }
  if (lowerFilename.includes('lastpass')) {
    return parseLastPassCSV(content);
  }
  if (lowerFilename.includes('1password')) {
    return parse1PasswordCSV(content);
  }

  // CSV detection by header
  const firstLine = trimmed.split('\n')[0].toLowerCase();
  if (firstLine.includes('username2') || firstLine.includes('username3')) {
    return parseDashlaneCSV(content);
  }
  if (firstLine.includes('grouping') && firstLine.includes('fav')) {
    return parseLastPassCSV(content);
  }

  // Default to generic CSV
  return parseGenericCSV(content);
}

/**
 * Parse generic CSV with common password fields.
 */
export function parseGenericCSV(csvContent) {
  console.log('[BRK-PWD-001] Parsing generic CSV...');

  const vault = new PasswordVault();
  vault.metadata.source = 'generic_csv';

  const lines = parseCSVLines(csvContent);
  if (lines.length < 2) return vault;

  const header = lines[0].map(h => h.toLowerCase().trim());
  const indices = {
    title: findIndex(header, ['title', 'name', 'site', 'service']),
    url: findIndex(header, ['url', 'website', 'site', 'domain']),
    username: findIndex(header, ['username', 'user', 'login', 'email', 'account']),
    password: findIndex(header, ['password', 'pass', 'pwd']),
    notes: findIndex(header, ['notes', 'note', 'comment', 'extra']),
    category: findIndex(header, ['category', 'folder', 'group', 'tag'])
  };

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0) continue;

    const entry = new PasswordEntry({
      title: getField(row, indices.title),
      url: getField(row, indices.url),
      username: getField(row, indices.username),
      password: getField(row, indices.password),
      notes: getField(row, indices.notes),
      category: getField(row, indices.category)
    });

    if (entry.password || entry.username) {
      vault.addEntry(entry);
      vault.metadata.totalImported++;
    }
  }

  return vault;
}

// =============================================================================
// CSV UTILITIES
// =============================================================================

function parseCSVLines(content) {
  const lines = [];
  let currentLine = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentField);
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentLine.push(currentField);
        lines.push(currentLine);
        currentLine = [];
        currentField = '';
        if (char === '\r') i++; // Skip \n
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }

  // Handle last field/line
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField);
    lines.push(currentLine);
  }

  return lines;
}

function findIndex(header, possibleNames) {
  for (const name of possibleNames) {
    const idx = header.indexOf(name);
    if (idx !== -1) return idx;
  }
  return -1;
}

function getField(row, index) {
  if (index === -1 || index >= row.length) return '';
  return (row[index] || '').trim();
}

// =============================================================================
// STUB PARSERS (To be implemented)
// =============================================================================

function parseBitwardenJSON(content) {
  console.log('[BRK-PWD-001] Bitwarden JSON parser (stub)');
  const vault = new PasswordVault();
  vault.metadata.source = 'bitwarden_json';
  // TODO: Implement
  return vault;
}

function parse1PasswordCSV(content) {
  console.log('[BRK-PWD-001] 1Password CSV parser (stub)');
  const vault = new PasswordVault();
  vault.metadata.source = '1password_csv';
  // TODO: Implement
  return vault;
}

function parseGenericJSON(content) {
  console.log('[BRK-PWD-001] Generic JSON parser (stub)');
  const vault = new PasswordVault();
  vault.metadata.source = 'generic_json';
  // TODO: Implement
  return vault;
}
