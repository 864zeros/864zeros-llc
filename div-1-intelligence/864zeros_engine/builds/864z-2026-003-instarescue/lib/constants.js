// constants.js - Application Constants
// 864zeros Build Kit - ReadFlow (InstaRescue)

export const APP_NAME = 'ReadFlow';
export const APP_SLUG = 'readflow';
export const APP_VERSION = '1.0.0';

// Database Configuration
export const DB_NAME = `${APP_SLUG}_db`;
export const DB_VERSION = 1;

// Database Schema
export const DB_SCHEMA = {
  articles: {
    keyPath: 'id',
    indexes: [
      { name: 'by-url', field: 'url', unique: true },
      { name: 'by-status', field: 'status', unique: false },
      { name: 'by-folder', field: 'folder', unique: false },
      { name: 'by-created', field: 'createdAt', unique: false },
      { name: 'by-synced', field: 'syncedToDevice', unique: false }
    ]
  },
  folders: {
    keyPath: 'id',
    indexes: [
      { name: 'by-name', field: 'name', unique: true }
    ]
  },
  parseCache: {
    keyPath: 'url',
    indexes: [
      { name: 'by-parsed', field: 'parsedAt', unique: false }
    ]
  },
  deviceSync: {
    keyPath: 'id',
    indexes: [
      { name: 'by-device', field: 'deviceType', unique: false },
      { name: 'by-synced', field: 'syncedAt', unique: false }
    ]
  }
};

// Message Types
export const MESSAGE_TYPES = {
  ARTICLE_SAVED: 'ARTICLE_SAVED',
  ARTICLE_PARSED: 'ARTICLE_PARSED',
  PARSE_FAILED: 'PARSE_FAILED',
  IMPORT_COMPLETE: 'IMPORT_COMPLETE',
  SYNC_STARTED: 'SYNC_STARTED',
  SYNC_COMPLETE: 'SYNC_COMPLETE',
  SYNC_FAILED: 'SYNC_FAILED'
};

// Parse Confidence Levels
export const PARSE_CONFIDENCE = {
  HIGH: 0.8,
  MEDIUM: 0.5,
  LOW: 0.3,
  FAILED: 0
};

// Parser Chain Priority
export const PARSER_CHAIN = [
  'readability',
  'mercury',
  'dom_snapshot',
  'raw_text'
];

// E-Reader Formats
export const EREADER_FORMATS = {
  EPUB: { ext: '.epub', mime: 'application/epub+zip', label: 'EPUB' },
  MOBI: { ext: '.mobi', mime: 'application/x-mobipocket-ebook', label: 'MOBI (Kindle)' },
  AZW3: { ext: '.azw3', mime: 'application/vnd.amazon.ebook', label: 'AZW3 (Kindle)' },
  PDF: { ext: '.pdf', mime: 'application/pdf', label: 'PDF' },
  HTML: { ext: '.html', mime: 'text/html', label: 'HTML (Offline)' }
};

// Device Signatures for Detection
export const DEVICE_SIGNATURES = {
  KOBO: {
    paths: ['.kobo', 'KOBOeReader', 'kobo'],
    name: 'Kobo',
    format: 'EPUB'
  },
  KINDLE: {
    paths: ['documents', 'Kindle', 'kindle'],
    name: 'Kindle',
    format: 'MOBI'
  },
  CALIBRE: {
    paths: ['.calibre', 'Calibre Library'],
    name: 'Calibre',
    format: 'EPUB'
  }
};

// Article Status
export const ARTICLE_STATUS = {
  UNREAD: 'unread',
  READING: 'reading',
  ARCHIVED: 'archived'
};

// Default Settings
export const DEFAULT_SETTINGS = {
  defaultFolder: 'Inbox',
  autoSave: true,
  parseImages: true,
  defaultFormat: 'EPUB',
  readerFont: 'Georgia',
  readerFontSize: 18,
  readerTheme: 'light',
  sendToKindleEmail: '',
  showParseConfidence: true
};

// Export Formats
export const EXPORT_FORMATS = {
  JSON: { ext: '.json', mime: 'application/json' },
  HTML: { ext: '.html', mime: 'text/html' },
  CSV: { ext: '.csv', mime: 'text/csv' },
  MARKDOWN: { ext: '.md', mime: 'text/markdown' },
  EPUB: { ext: '.epub', mime: 'application/epub+zip' }
};
