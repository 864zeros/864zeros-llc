// constants.js - RoamRescue Constants
// 864z-2026-007

export const APP_SLUG = 'roamrescue';
export const APP_NAME = 'RoamRescue';
export const STRIKE_ID = '864z-2026-007';
export const TARGET_SAAS = 'Roam Research';
export const TARGET_PRICE = 15;

export const VAULT_STATE = {
  UNINITIALIZED: 'uninitialized',
  LOCKED: 'locked',
  UNLOCKED: 'unlocked'
};

export const MESSAGE_TYPES = {
  VAULT_UNLOCK: 'VAULT_UNLOCK',
  VAULT_LOCK: 'VAULT_LOCK',
  VAULT_STATUS: 'VAULT_STATUS',
  IMPORT_COMPLETE: 'IMPORT_COMPLETE'
};

export const STORAGE_KEYS = {
  SALT: 'roamrescue_salt',
  VAULT_ID: 'roamrescue_vault_id',
  ONBOARDED: 'roamrescue_onboarded',
  SETTINGS: 'roamrescue_settings'
};

export const SECURITY = {
  PBKDF2_ITERATIONS: 600000,
  KEY_LENGTH: 256,
  SALT_LENGTH: 32,
  AUTO_LOCK_MINUTES: 15
};

export const COPY = {
  TRUST_MESSAGE: 'Your data never leaves your device',
  SAVINGS_MESSAGE: `You just saved $${TARGET_PRICE}/year. Forever.`,
  ZERO_KNOWLEDGE: 'Zero-knowledge. Unrecoverable by design.'
};
