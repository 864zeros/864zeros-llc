/**
 * oia.focus (timer) - App Constants
 * 864z-build-kit compliant configuration
 */

export const APP_SLUG = 'oia-focus-timer';
export const APP_NAME = 'oia.focus';
export const APP_BRAND = 'OIA';

// Storage keys - prefixed with APP_SLUG to prevent collisions
export const STORAGE_KEYS = {
  settings: `${APP_SLUG}_settings`,
  soundType: `${APP_SLUG}_sound_type`,
  lastFocusText: `${APP_SLUG}_last_focus_text`
};

// Message types for service worker communication
export const MESSAGE_TYPES = {
  TIMER_COMPLETE: 'TIMER_COMPLETE',
  SETTINGS_CHANGED: 'SETTINGS_CHANGED'
};

// Timer presets in minutes
export const TIMER_PRESETS = [5, 10, 25, 50];

// Sound options
export const SOUND_OPTIONS = {
  OFF: 'off',
  SOFT_CHIME: 'soft-chime',
  NATURE_POP: 'nature-pop',
  BREATH: 'breath'
};

// App configuration
export const CONFIG = {
  defaultSoundType: SOUND_OPTIONS.SOFT_CHIME,
  completionAutoDismissMs: 30000,
  focusInputMaxLength: 60
};
