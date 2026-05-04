/**
 * oia.focus.wall - App Constants
 * 864z-build-kit compliant configuration
 */

export const APP_SLUG = 'oia-focus-wall';
export const APP_NAME = 'oia.focus.wall';
export const APP_BRAND = 'OIA';

// Storage keys - prefixed with APP_SLUG to prevent collisions
export const STORAGE_KEYS = {
  notes: `${APP_SLUG}_notes`,
  lastCleanup: `${APP_SLUG}_last_cleanup`,
  version: `${APP_SLUG}_version`
};

// Message types for service worker communication
export const MESSAGE_TYPES = {
  CLEANUP_NOTES: 'CLEANUP_NOTES',
  NOTES_UPDATED: 'NOTES_UPDATED'
};

// Sticky note types
export const NOTE_TYPES = ['blue', 'yellow', 'yellow-lined'];

// App configuration
export const CONFIG = {
  noteExpirationHours: 24,
  maxNotes: 10,
  titleWordCount: 8,
  maxNoteLength: 500
};
