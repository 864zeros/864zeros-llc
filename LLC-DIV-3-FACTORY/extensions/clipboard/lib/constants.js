// ============================================================
// CONSTANTS — ClipBoard
// App identity, storage keys, message types, tier definitions.
// ============================================================

export const APP_SLUG = 'clipboard';
export const APP_NAME = 'ClipBoard';
export const APP_BRAND = '864zeros';

export const STORAGE_KEYS = {
  settings: `${APP_SLUG}_settings`,
  tier: `${APP_SLUG}_tier`,
  lastSync: `${APP_SLUG}_last_sync`,
  initialized: `${APP_SLUG}_initialized`,
  credits: `${APP_SLUG}_credits`,
  creditHistory: `${APP_SLUG}_credit_history`
};

export const MESSAGE_TYPES = {
  // Content capture
  CAPTURE_SELECTION: 'CAPTURE_SELECTION',
  CAPTURE_PAGE: 'CAPTURE_PAGE',
  CAPTURE_SCREENSHOT: 'CAPTURE_SCREENSHOT',
  CAPTURE_MARQUEE: 'CAPTURE_MARQUEE',
  CAPTURE_PDF: 'CAPTURE_PDF',

  // Data operations
  GET_CLIPS: 'GET_CLIPS',
  DELETE_CLIP: 'DELETE_CLIP',
  UPDATE_CLIP: 'UPDATE_CLIP',

  // Tags
  GET_TAGS: 'GET_TAGS',
  CREATE_TAG: 'CREATE_TAG',
  DELETE_TAG: 'DELETE_TAG',
  LINK_TAG: 'LINK_TAG',
  UNLINK_TAG: 'UNLINK_TAG',

  // AI
  SUMMARIZE_CLIP: 'SUMMARIZE_CLIP',
  AUTO_TAG_CLIP: 'AUTO_TAG_CLIP',
  ANALYZE_IMAGE: 'ANALYZE_IMAGE',

  // Tiers
  TIER_CHANGED: 'TIER_CHANGED',

  // Sync
  EXPORT_DATA: 'EXPORT_DATA',
  IMPORT_DATA: 'IMPORT_DATA',
  DATA_IMPORTED: 'DATA_IMPORTED',

  // InsightForge (Power tier)
  SYNTHESIZE_CLIPS: 'SYNTHESIZE_CLIPS',

  // Credits
  GET_CREDITS: 'GET_CREDITS',
  DEDUCT_CREDITS: 'DEDUCT_CREDITS',
  ADD_CREDITS: 'ADD_CREDITS',

  // Token tracking (debug)
  GET_TOKEN_USAGE: 'GET_TOKEN_USAGE',
  RESET_TOKEN_USAGE: 'RESET_TOKEN_USAGE'
};

export const TIERS = {
  free: { level: 0, price: 0 },
  starter: { level: 1, price: 1.99 },
  pro: { level: 2, price: 3.99 },
  power: { level: 3, price: 5.99 }
};

export const FEATURE_TIERS = {
  'text-capture': 'free',
  'page-capture': 'free',
  'tag-management': 'free',
  'search': 'free',
  'local-export': 'free',
  'local-import': 'free',
  'screenshot-capture': 'starter',
  'pdf-capture': 'starter',
  'ai-summary': 'starter',
  'ai-auto-tag': 'pro',
  'marquee-capture': 'pro',
  'ai-vision': 'pro',
  'bulk-operations': 'pro',
  'google-drive-sync': 'pro',
  // InsightForge features (Power tier + credits)
  'synthesize-clips': 'power',
  'ask-clips': 'power',
  'research-report': 'power'
};

export const AI_CONFIG = {
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  maxTokens: 1000,
  temperature: 0.7
};

// Credit system configuration
export const CREDIT_CONFIG = {
  initialCredits: 10, // Free credits on install
  costs: {
    'ai-summary': 1,
    'ai-auto-tag': 1,
    'ai-vision': 2,
    // InsightForge templates
    'quick-summary': 3,
    'research-dossier': 5,
    'visual-map': 8,        // Future
    'ask-clips': 2
  },
  packs: [
    { id: 'pack-20', credits: 20, price: 1.99, label: '20 credits' },
    { id: 'pack-50', credits: 50, price: 3.99, label: '50 credits', popular: true },
    { id: 'pack-100', credits: 100, price: 6.99, label: '100 credits' }
  ]
};

// IndexedDB configuration
export const DB_NAME = 'clipboard_db';
export const DB_VERSION = 1;

export const DB_SCHEMA = {
  clips: {
    keyPath: 'id',
    indexes: [
      { name: 'by-created', field: 'createdAt', unique: false },
      { name: 'by-type', field: 'clipType', unique: false },
      { name: 'by-url', field: 'sourceUrl', unique: false },
      { name: 'by-starred', field: 'starred', unique: false }
    ]
  },
  tags: {
    keyPath: 'id',
    indexes: [
      { name: 'by-name', field: 'name', unique: true },
      { name: 'by-color', field: 'color', unique: false }
    ]
  },
  clip_tags: {
    keyPath: 'id',
    indexes: [
      { name: 'by-clip', field: 'clipId', unique: false },
      { name: 'by-tag', field: 'tagId', unique: false }
    ]
  }
};
