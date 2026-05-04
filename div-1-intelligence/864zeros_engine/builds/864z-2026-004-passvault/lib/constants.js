// constants.js - PassVault Application Constants
// 864zeros Build: 864z-2026-004
// SECURITY: Zero-Knowledge Architecture

export const APP_NAME = 'PassVault';
export const APP_SLUG = 'passvault';
export const APP_VERSION = '1.0.0';

// Database Configuration
export const DB_NAME = `${APP_SLUG}_secure_db`;
export const DB_VERSION = 1;

// Vault States
export const VAULT_STATE = {
  LOCKED: 'locked',
  UNLOCKED: 'unlocked',
  UNINITIALIZED: 'uninitialized'
};

// Message Types (for extension messaging)
export const MESSAGE_TYPES = {
  // Vault lifecycle
  VAULT_UNLOCK: 'VAULT_UNLOCK',
  VAULT_LOCK: 'VAULT_LOCK',
  VAULT_STATUS: 'VAULT_STATUS',

  // Import/Export
  IMPORT_START: 'IMPORT_START',
  IMPORT_COMPLETE: 'IMPORT_COMPLETE',
  IMPORT_ERROR: 'IMPORT_ERROR',
  EXPORT_VAULT: 'EXPORT_VAULT',

  // Audit
  AUDIT_RUN: 'AUDIT_RUN',
  AUDIT_COMPLETE: 'AUDIT_COMPLETE',
  BREACH_CHECK: 'BREACH_CHECK',
  BREACH_RESULT: 'BREACH_RESULT',

  // Entry operations
  ENTRY_CREATE: 'ENTRY_CREATE',
  ENTRY_UPDATE: 'ENTRY_UPDATE',
  ENTRY_DELETE: 'ENTRY_DELETE',
  ENTRY_SEARCH: 'ENTRY_SEARCH'
};

// Security Constants
export const SECURITY = {
  // PBKDF2 Configuration (OWASP 2024 recommendations)
  PBKDF2_ITERATIONS: 600000,
  PBKDF2_HASH: 'SHA-256',

  // AES Configuration
  AES_ALGORITHM: 'AES-GCM',
  AES_KEY_LENGTH: 256,
  AES_IV_LENGTH: 12,
  AES_TAG_LENGTH: 128,

  // Salt Configuration
  SALT_LENGTH: 16,

  // Auto-lock timeout (ms)
  AUTO_LOCK_DEFAULT: 15 * 60 * 1000, // 15 minutes
  AUTO_LOCK_MIN: 1 * 60 * 1000,      // 1 minute
  AUTO_LOCK_MAX: 60 * 60 * 1000,     // 60 minutes

  // Password strength thresholds
  PASSWORD_STRENGTH: {
    WEAK: 40,
    MODERATE: 60,
    STRONG: 80,
    VERY_STRONG: 90
  }
};

// HIBP API Configuration (k-Anonymity)
export const HIBP = {
  API_URL: 'https://api.pwnedpasswords.com/range/',
  PREFIX_LENGTH: 5, // SHA-1 prefix for k-anonymity
  USER_AGENT: 'PassVault-BreachChecker'
};

// Import Source Signatures
export const IMPORT_SOURCES = {
  DASHLANE_CSV: {
    id: 'dashlane_csv',
    name: 'Dashlane (CSV)',
    signatures: ['username2', 'username3', 'otpSecret']
  },
  DASHLANE_JSON: {
    id: 'dashlane_json',
    name: 'Dashlane (JSON)',
    signatures: ['AUTHENTIFIANT', 'SECURENOTE']
  },
  LASTPASS_CSV: {
    id: 'lastpass_csv',
    name: 'LastPass (CSV)',
    signatures: ['grouping', 'fav', 'extra']
  },
  ONEPASSWORD_CSV: {
    id: '1password_csv',
    name: '1Password (CSV)',
    signatures: ['Login', 'Password', 'OTP']
  },
  BITWARDEN_JSON: {
    id: 'bitwarden_json',
    name: 'Bitwarden (JSON)',
    signatures: ['items', 'folders', 'login']
  },
  GENERIC_CSV: {
    id: 'generic_csv',
    name: 'Generic CSV',
    signatures: []
  }
};

// Value Proposition (for Migration Audit)
export const VALUE_COMPARISON = {
  DASHLANE_ANNUAL: 60,      // $60/year
  LASTPASS_ANNUAL: 36,      // $36/year
  ONEPASSWORD_ANNUAL: 36,   // $36/year
  PASSVAULT_COST: 0,        // Free forever
  CALCULATION_YEARS: [1, 3, 5] // Show savings over 1, 3, 5 years
};

// UI Theme Tokens (Security-Hardened Dark Mode)
export const THEME = {
  colors: {
    // Background
    bgPrimary: '#0a0a0f',
    bgSecondary: '#12121a',
    bgElevated: '#1a1a24',
    bgHover: '#22222e',

    // Text
    textPrimary: '#f0f0f5',
    textSecondary: '#a0a0b0',
    textMuted: '#606070',

    // Accent (Security Green)
    accentPrimary: '#00d084',
    accentHover: '#00f09a',
    accentMuted: 'rgba(0, 128, 80, 0.3)',

    // Status
    statusSecure: '#00d084',
    statusWarning: '#f0c020',
    statusDanger: '#f04040',
    statusInfo: '#4080f0',

    // Borders
    borderColor: '#2a2a3a',
    borderFocus: '#00d084'
  },
  fonts: {
    mono: "'JetBrains Mono', 'Fira Code', monospace",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px'
  }
};

// Copy/Messaging (Trust-Based Tone)
export const COPY = {
  tagline: 'Your passwords never leave your device.',
  noRecovery: 'We cannot recover your master password. This is by design.',
  freeForever: 'Free forever. No limits. No subscription.',
  zeroKnowledge: 'Zero-knowledge architecture: We never see your data.',
  localOnly: '100% local encryption. Optional breach checking available.',
  valueProp: 'Dashlane charges $60/year. PassVault is free forever.',
  breachDisclosure: 'Breach checking sends only the first 5 characters of a password hash (k-anonymity). Your actual password never leaves your device.'
};

// Breach Check Consent
export const BREACH_CHECK = {
  defaultEnabled: false, // OPT-IN by default
  consentKey: 'breach_check_consent',
  consentVersion: 1
};

// Database Schema
export const DB_SCHEMA = {
  vaults: {
    keyPath: 'id',
    indexes: [
      { name: 'by-name', field: 'name', unique: true },
      { name: 'by-updated', field: 'updatedAt', unique: false }
    ]
  },
  config: {
    keyPath: 'key',
    indexes: []
  }
};
