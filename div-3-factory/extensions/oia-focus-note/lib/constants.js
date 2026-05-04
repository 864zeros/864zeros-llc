/**
 * oia.focus.note - App Constants
 * 864z-build-kit compliant configuration
 */

export const APP_SLUG = 'oia-focus-note';
export const APP_NAME = 'oia.focus.note';
export const APP_BRAND = 'OIA';

// Storage keys - prefixed with APP_SLUG to prevent collisions
export const STORAGE_KEYS = {
  notes: `${APP_SLUG}_notes`,
  lastCleanup: `${APP_SLUG}_last_cleanup`
};

// Message types for service worker communication
export const MESSAGE_TYPES = {
  CLEANUP_NOTES: 'CLEANUP_NOTES',
  NOTES_UPDATED: 'NOTES_UPDATED'
};

// App configuration
export const CONFIG = {
  noteExpirationHours: 24,
  maxNotes: 50,
  titleWordCount: 8
};
