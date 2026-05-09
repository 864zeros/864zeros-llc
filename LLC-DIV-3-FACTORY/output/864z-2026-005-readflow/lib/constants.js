// constants.js - ReadFlow Constants
// 864z-2026-005

export const APP_SLUG = 'readflow';
export const APP_NAME = 'ReadFlow';
export const STRIKE_ID = '864z-2026-005';
export const TARGET_SAAS = 'Instapaper';
export const TARGET_PRICE = 30;

export const ARTICLE_STATUS = {
  UNREAD: 'unread',
  READING: 'reading',
  READ: 'read',
  ARCHIVED: 'archived'
};

export const MESSAGE_TYPES = {
  LIBRARY_REFRESH: 'LIBRARY_REFRESH',
  ARTICLE_SAVED: 'ARTICLE_SAVED',
  DIGEST_GENERATED: 'DIGEST_GENERATED',
  IMPORT_COMPLETE: 'IMPORT_COMPLETE'
};

export const STORAGE_KEYS = {
  LIBRARY: 'readflow_library',
  SETTINGS: 'readflow_settings',
  FOLDERS: 'readflow_folders'
};

export const READING_DEFAULTS = {
  WORDS_PER_MINUTE: 200,
  MIN_READING_TIME: 1
};

export const COPY = {
  TRUST_MESSAGE: 'Your data never leaves your device',
  SAVINGS_MESSAGE: `You just saved $${TARGET_PRICE}/year. Forever.`,
  LOCAL_FIRST: 'Local-first. Your articles, your device.'
};
