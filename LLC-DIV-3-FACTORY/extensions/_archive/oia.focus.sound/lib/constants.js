/**
 * oia.focus.sound - App Constants
 * 864z-build-kit compliant configuration
 */

export const APP_SLUG = 'oia-focus-sound';
export const APP_NAME = 'oia.focus.sound';
export const APP_BRAND = 'OIA';

// Storage keys - prefixed with APP_SLUG to prevent collisions
export const STORAGE_KEYS = {
  currentSound: `${APP_SLUG}_current_sound`,
  isPlaying: `${APP_SLUG}_is_playing`
};

// Sound types
export const SOUND_TYPES = {
  WHITE_NOISE: 'white_noise',
  PINK_NOISE: 'pink_noise',
  BROWN_NOISE: 'brown_noise',
  RAIN: 'rain'
};

// Sound display names
export const SOUND_NAMES = {
  [SOUND_TYPES.WHITE_NOISE]: 'white noise',
  [SOUND_TYPES.PINK_NOISE]: 'gray noise',
  [SOUND_TYPES.BROWN_NOISE]: 'brown noise',
  [SOUND_TYPES.RAIN]: 'rain'
};

// Sound descriptions
export const SOUND_DESCRIPTIONS = {
  [SOUND_TYPES.WHITE_NOISE]: 'classic static',
  [SOUND_TYPES.PINK_NOISE]: 'balanced static',
  [SOUND_TYPES.BROWN_NOISE]: 'deep rumble',
  [SOUND_TYPES.RAIN]: 'natural calm'
};

// App configuration
export const CONFIG = {
  defaultSound: SOUND_TYPES.WHITE_NOISE
};
