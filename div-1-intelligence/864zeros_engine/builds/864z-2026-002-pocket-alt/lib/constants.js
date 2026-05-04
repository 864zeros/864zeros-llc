// constants.js - App Configuration [BRK-CORE]
// 864zeros Build Kit - Auto-generated boilerplate

export const APP_SLUG = 'readvault';
export const APP_NAME = 'ReadVault';
export const APP_BRAND = '864zeros';

export const STORAGE_KEYS = {
  settings: `${APP_SLUG}_settings`,
  tier: `${APP_SLUG}_tier`,
  lastSync: `${APP_SLUG}_last_sync`,
  initialized: `${APP_SLUG}_initialized`
};

export const MESSAGE_TYPES = {
  TIER_CHANGED: 'TIER_CHANGED',
  ARTICLE_SAVED: 'ARTICLE_SAVED',
  IMPORT_COMPLETE: 'IMPORT_COMPLETE',
  SYNC_REQUESTED: 'SYNC_REQUESTED'
};

export const TIERS = {
  free:    { level: 0, price: 0, name: 'Free' },
  starter: { level: 1, price: 1.99, name: 'Starter' },
  pro:     { level: 2, price: 3.99, name: 'Pro' },
  power:   { level: 3, price: 5.99, name: 'Power' }
};

export const FEATURE_TIERS = {
  'save-article': 'free',
  'pocket-import': 'free',
  'local-export': 'free',
  'tags': 'free',
  'search': 'free',
  'ai-summary': 'starter',
  'cloud-sync': 'pro',
  'multi-device': 'pro',
  'api-access': 'power'
};

export const AI_CONFIG = {
  provider: 'gemini',
  model: 'gemini-1.5-flash',
  maxTokens: 1000,
  temperature: 0.7
};

// Database schema for IndexedDB
export const DB_NAME = `${APP_SLUG}_db`;
export const DB_VERSION = 1;

export const DB_SCHEMA = {
  articles: {
    keyPath: 'id',
    indexes: [
      { name: 'by-created', field: 'createdAt', unique: false },
      { name: 'by-url', field: 'url', unique: true },
      { name: 'by-status', field: 'status', unique: false },
      { name: 'by-favorite', field: 'favorite', unique: false }
    ]
  },
  tags: {
    keyPath: 'id',
    indexes: [
      { name: 'by-name', field: 'name', unique: true }
    ]
  },
  article_tags: {
    keyPath: 'id',
    indexes: [
      { name: 'by-article', field: 'articleId', unique: false },
      { name: 'by-tag', field: 'tagId', unique: false }
    ]
  }
};

// Default settings
export const DEFAULT_SETTINGS = {
  theme: 'system',
  fontSize: 'medium',
  autoSave: false,
  offlineFirst: true,  // CRITICAL: Privacy moat
  cloudSyncEnabled: false,  // Opt-in only
  importedFromPocket: false
};
