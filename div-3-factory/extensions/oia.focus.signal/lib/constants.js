/**
 * oia.focus.signal - App Constants
 * 864z-build-kit compliant configuration
 */

export const APP_SLUG = 'oia-focus-signal';
export const APP_NAME = 'oia.focus.signal';
export const APP_BRAND = 'OIA';

// Storage keys - prefixed with APP_SLUG to prevent collisions
export const STORAGE_KEYS = {
  signals: `${APP_SLUG}_signals`,
  selectedRatio: `${APP_SLUG}_selected_ratio`,
  lastCleanup: `${APP_SLUG}_last_cleanup`,
  lastUpdated: `${APP_SLUG}_last_updated`
};

// Signal-to-noise ratio options
export const RATIO_OPTIONS = [60, 70, 80];

// App configuration
export const CONFIG = {
  maxSignals: 10,
  maxPrioritySignals: 4,
  defaultRatio: 70,
  titleMaxLength: 40,
  unmarkedExpirationDays: 7,
  markedExpirationDays: 30
};
