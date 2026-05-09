// ============================================================
// CONSTANTS — TabVault
// Centralized app configuration and magic strings
// ============================================================

export const APP_SLUG = 'tabvault';
export const APP_NAME = 'TabVault';
export const APP_VERSION = '1.0.0';

// IndexedDB
export const DB_NAME = 'tabvault_db';
export const DB_VERSION = 3;  // v3: Added groupId for session groups
export const STORE_NAME = 'vaulted_tabs';

// Chrome Storage Keys (namespaced)
export const STORAGE_KEYS = {
  INITIALIZED: 'tabvault_initialized',
  SETTINGS: 'tabvault_settings',
  TAB_ACTIVITY: 'tabvault_tab_activity',
  VAULT_UPDATED: 'tabvault_vault_updated'  // Timestamp trigger for reactive updates
};

// Message Types (UPPER_SNAKE_CASE with prefix)
export const MESSAGE_TYPES = {
  GET_CONTENTS: 'TABVAULT_GET_CONTENTS',
  VAULT_TAB: 'TABVAULT_VAULT_TAB',
  DELETE_TAB: 'TABVAULT_DELETE_TAB',
  CLEAR_VAULT: 'TABVAULT_CLEAR_VAULT',
  GET_SCROLL: 'TABVAULT_GET_SCROLL',
  RESTORE_SCROLL: 'TABVAULT_RESTORE_SCROLL'
};

// Alarms
export const ALARMS = {
  DEEP_SLEEP_CHECK: 'tabvault_deep_sleep_check'
};

// Default Settings
export const DEFAULT_SETTINGS = {
  deepSleepEnabled: true,
  inactivityMinutes: 20
};
