// ============================================================
// CONSTANTS — Who Is Watching
// App-specific constants following 864zeros patterns.
// ============================================================

export const APP_SLUG = 'wiw';
export const APP_NAME = 'Who Is Watching';
export const APP_VERSION = '1.0.0';

// Storage keys (namespaced with app slug)
export const STORAGE_KEYS = {
  INITIALIZED: `${APP_SLUG}_initialized`,
  SETTINGS: `${APP_SLUG}_settings`,
  VENDOR_CACHE: `${APP_SLUG}_vendor_cache`
};

// Message types
export const MESSAGE_TYPES = {
  // From content scripts
  VENDOR_DETECTED: 'VENDOR_DETECTED',
  IDENTITY_DETECTED: 'IDENTITY_DETECTED',
  NETWORK_REQUEST: 'NETWORK_REQUEST',
  DATALAYER_PUSH: 'DATALAYER_PUSH',
  DATALAYER_DETECTED: 'DATALAYER_DETECTED',
  DATALAYER_SNAPSHOT: 'DATALAYER_SNAPSHOT',
  CONSENT_DETECTED: 'CONSENT_DETECTED',
  HOOK_READY: 'HOOK_READY',

  // From panel
  INIT: 'INIT',
  INJECT_COMMAND: 'INJECT_COMMAND',
  INJECT_RESULT: 'INJECT_RESULT',
  GET_SETTINGS: 'GET_SETTINGS'
};

// Vendor categories
export const VENDOR_CATEGORIES = {
  ANALYTICS: 'analytics',
  MARKETING: 'marketing',
  INTENT: 'intent',
  CONSENT: 'consent'
};

// Default settings
export const DEFAULT_SETTINGS = {
  captureNetwork: true,
  captureIdentity: true,
  captureDataLayer: true,
  maxNetworkLogs: 100
};
