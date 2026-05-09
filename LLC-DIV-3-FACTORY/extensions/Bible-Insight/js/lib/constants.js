/**
 * constants.js — Bible Insight Extension Identity & Configuration
 *
 * This file defines all app-wide constants. Import it wherever you need
 * consistent values for branding, storage keys, or API configuration.
 *
 * NEVER modify this file per-user. User preferences belong in chrome.storage.
 */

// ============================================================
// APP IDENTITY
// ============================================================

export const APP_NAME = 'Bible Insight';
export const APP_SLUG = 'bible-insight';
export const APP_VERSION = '1.0.0';
export const APP_BRAND = 'FHG'; // For His Glory

// ============================================================
// STORAGE KEY PREFIX
// ============================================================
// All chrome.storage keys are prefixed to avoid collisions
// if multiple 864zeros extensions are installed.

export const STORAGE_PREFIX = 'bi_'; // bible-insight

// ============================================================
// INDEXEDDB CONFIGURATION
// ============================================================

export const DB_NAME = 'BibleInsightDB';
export const DB_VERSION = 1;

// Schema for IndexedDB stores
//
// contentItems record shape:
// {
//   id: number (auto),
//   type: string (page|selection|screenshot|pdf|...),
//   title: string,
//   content: string,
//   url: string,
//   notes: string,              // User's personal notes
//   color: string,              // Highlight color (yellow|green|red|blue|purple|orange)
//   detectedVerses: string[],   // Auto-detected verse references
//   analysis: object,           // AI analysis results
//   createdAt: string (ISO),
//   updatedAt: string (ISO)
// }
//
export const DB_SCHEMA = {
  contentItems: {
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'by-type', field: 'type', unique: false },
      { name: 'by-created', field: 'createdAt', unique: false },
      { name: 'by-url', field: 'url', unique: false },
      { name: 'by-color', field: 'color', unique: false }
    ]
  },
  // User-created tags (beyond colors)
  // Tags allow grouping like "Romans Study", "Prayer Series", etc.
  tags: {
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'by-name', field: 'name', unique: true },
      { name: 'by-color', field: 'color', unique: false }
    ]
  },
  // Junction table: contentItems <-> tags (many-to-many)
  contentTags: {
    keyPath: ['contentId', 'tagId'],
    indexes: [
      { name: 'by-content', field: 'contentId', unique: false },
      { name: 'by-tag', field: 'tagId', unique: false }
    ]
  },
  // Detected verses linked to content items
  verses: {
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'by-reference', field: 'reference', unique: false },
      { name: 'by-book', field: 'book', unique: false },
      { name: 'by-content', field: 'contentId', unique: false }
    ]
  },
  // Cross-references between verses
  crossRefs: {
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'by-source', field: 'sourceRef', unique: false },
      { name: 'by-target', field: 'targetRef', unique: false }
    ]
  }
};

// ============================================================
// CONTENT TYPES
// ============================================================

export const CONTENT_TYPES = {
  PAGE: 'page',
  SELECTION: 'selection',
  SCREENSHOT: 'screenshot',
  PDF: 'pdf',
  GENERATED_ANALYSIS: 'generated_analysis',
  // Bible Insight specific
  SERMON_NOTES: 'sermon_notes',
  TRANSCRIPT: 'transcript',
  VERSE_COLLECTION: 'verse_collection'
};

// ============================================================
// HIGHLIGHT COLORS (Color-based tagging)
// ============================================================
// Simple, visual approach - like physical Bible highlighters.
// Users think in colors, not taxonomies.

export const HIGHLIGHT_COLORS = {
  yellow: { hex: '#FFE066', label: 'Important', default: true },
  green:  { hex: '#7BC96F', label: 'Promise' },
  red:    { hex: '#E57373', label: 'Warning' },
  blue:   { hex: '#64B5F6', label: 'Study' },
  purple: { hex: '#BA68C8', label: 'Cross-ref' },
  orange: { hex: '#FFB74D', label: 'Personal' }
};

// Default color for new items
export const DEFAULT_HIGHLIGHT_COLOR = 'yellow';

// ============================================================
// BIBLE CONFIGURATION
// ============================================================

export const DEFAULT_TRANSLATION = 'KJV';

// Books of the Bible for detection
export const BIBLE_BOOKS = [
  // Old Testament
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Psalm',
  'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Song of Songs',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah',
  'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  // New Testament
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation'
];

// Book abbreviations for detection
export const BIBLE_BOOK_ABBREVS = {
  'Gen': 'Genesis', 'Ex': 'Exodus', 'Lev': 'Leviticus', 'Num': 'Numbers', 'Deut': 'Deuteronomy',
  'Josh': 'Joshua', 'Judg': 'Judges', 'Ru': 'Ruth', '1 Sam': '1 Samuel', '2 Sam': '2 Samuel',
  '1 Kgs': '1 Kings', '2 Kgs': '2 Kings', '1 Chr': '1 Chronicles', '2 Chr': '2 Chronicles',
  'Neh': 'Nehemiah', 'Est': 'Esther', 'Ps': 'Psalms', 'Psa': 'Psalms',
  'Prov': 'Proverbs', 'Eccl': 'Ecclesiastes', 'Song': 'Song of Solomon', 'SS': 'Song of Solomon',
  'Isa': 'Isaiah', 'Jer': 'Jeremiah', 'Lam': 'Lamentations', 'Ezek': 'Ezekiel', 'Dan': 'Daniel',
  'Hos': 'Hosea', 'Ob': 'Obadiah', 'Jon': 'Jonah', 'Mic': 'Micah',
  'Nah': 'Nahum', 'Hab': 'Habakkuk', 'Zeph': 'Zephaniah', 'Hag': 'Haggai', 'Zech': 'Zechariah', 'Mal': 'Malachi',
  'Matt': 'Matthew', 'Mt': 'Matthew', 'Mk': 'Mark', 'Lk': 'Luke', 'Jn': 'John',
  'Rom': 'Romans', '1 Cor': '1 Corinthians', '2 Cor': '2 Corinthians', 'Gal': 'Galatians', 'Eph': 'Ephesians',
  'Phil': 'Philippians', 'Col': 'Colossians', '1 Thess': '1 Thessalonians', '2 Thess': '2 Thessalonians',
  '1 Tim': '1 Timothy', '2 Tim': '2 Timothy', 'Tit': 'Titus', 'Phm': 'Philemon', 'Heb': 'Hebrews',
  'Jas': 'James', '1 Pet': '1 Peter', '2 Pet': '2 Peter', '1 Jn': '1 John', '2 Jn': '2 John', '3 Jn': '3 John',
  'Rev': 'Revelation'
};

// ============================================================
// API ENDPOINTS
// ============================================================

export const API_ENDPOINTS = {
  // API.Bible (free tier supports 1,500+ translations)
  BIBLE_API_BASE: 'https://api.scripture.api.bible/v1',  // Also works: https://rest.api.bible/v1

  // Treasury of Scripture Knowledge for cross-references
  TSK_API_BASE: 'https://api.treasury.api.bible/v1',

  // Gemini AI
  GEMINI_BASE: 'https://generativelanguage.googleapis.com/v1beta'
};

// ============================================================
// AI CONFIGURATION
// ============================================================

export const AI_CONFIG = {
  // Default model for text analysis
  GEMINI_MODEL: 'gemini-2.0-flash',

  // Max tokens for various operations
  MAX_CONTENT_CHARS: 50000,
  MAX_SUMMARY_CHARS: 2000,

  // Prompts for single-item operations
  PROMPTS: {
    KEY_POINTS: 'Extract the main key points from the following content. Focus on theological insights and biblical truths:',
    VERSE_CONTEXT: 'Explain the context and meaning of this Bible verse in a concise way:',
    CROSS_REFS: 'Suggest related Bible verses that connect to this passage thematically:',
    THEMES: 'Identify the main theological themes in this content:',
    SUGGEST_TAGS: 'Based on this content, suggest 2-3 short tag names (1-2 words each) that would help categorize it for Bible study. Return as comma-separated list:'
  },

  // Prompts for synthesis operations (Pro tier)
  SYNTHESIS_PROMPTS: {
    COMBINE_SUMMARIES: `You are a Bible study assistant. The user has saved multiple items on a topic.
Synthesize these into a unified summary that:
1. Identifies common themes across all items
2. Lists all Scripture references mentioned
3. Highlights key theological insights
4. Notes any progression or development of ideas

Content items to synthesize:`,

    VERSE_CONNECTIONS: `Given these Bible verses, explain how they connect thematically:
1. What common thread runs through them?
2. How do they build on each other?
3. What theological truth emerges from seeing them together?

Verses:`,

    ASK_MY_ITEMS: `You are a personal Bible study assistant. The user has saved the following study notes and content.
Answer their question based ONLY on what they have saved. If the answer isn't in their saved items, say so.

User's saved items:
{{ITEMS}}

User's question: {{QUESTION}}`,

    STUDY_DOCUMENT: `Create a comprehensive study document from these saved items.
Structure it as:
1. Overview (2-3 sentences)
2. Key Themes Identified
3. Scripture References (with brief context for each)
4. Key Points Summary
5. Questions for Further Study

Content:`
  }
};

// ============================================================
// MESSAGE TYPES (for chrome.runtime messaging)
// ============================================================

export const MSG_TYPES = {
  // Content capture
  SAVE_PAGE: 'SAVE_PAGE',
  SAVE_SELECTION: 'SAVE_SELECTION',
  SAVE_PDF: 'SAVE_PDF',
  CAPTURE_VISIBLE: 'CAPTURE_VISIBLE',
  CAPTURE_AREA: 'CAPTURE_AREA',
  INITIATE_AREA_CAPTURE: 'INITIATE_AREA_CAPTURE',

  // Content retrieval
  GET_ALL_ITEMS: 'GET_ALL_ITEMS',
  GET_ITEM: 'GET_ITEM',
  DELETE_ITEM: 'DELETE_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',

  // Notes (per-item)
  UPDATE_ITEM_NOTES: 'UPDATE_ITEM_NOTES',

  // Tags (color-based)
  GET_ALL_TAGS: 'GET_ALL_TAGS',
  GET_CONTENT_TAGS: 'GET_CONTENT_TAGS',
  CREATE_TAG: 'CREATE_TAG',
  DELETE_TAG: 'DELETE_TAG',
  LINK_TAG: 'LINK_TAG',
  UNLINK_TAG: 'UNLINK_TAG',
  SET_ITEM_COLOR: 'SET_ITEM_COLOR',
  GET_ITEMS_BY_TAG: 'GET_ITEMS_BY_TAG',
  GET_ITEMS_BY_COLOR: 'GET_ITEMS_BY_COLOR',

  // AI operations (single item)
  GENERATE_KEY_POINTS: 'GENERATE_KEY_POINTS',
  GENERATE_REPORT: 'GENERATE_REPORT',
  ANALYZE_IMAGE: 'ANALYZE_IMAGE',
  SUGGEST_TAGS: 'SUGGEST_TAGS',

  // Synthesis (Pro tier - across items)
  SYNTHESIZE_BY_TAG: 'SYNTHESIZE_BY_TAG',
  SYNTHESIZE_BY_COLOR: 'SYNTHESIZE_BY_COLOR',
  EXTRACT_ALL_VERSES: 'EXTRACT_ALL_VERSES',
  GENERATE_STUDY_DOCUMENT: 'GENERATE_STUDY_DOCUMENT',
  ASK_MY_ITEMS: 'ASK_MY_ITEMS',

  // Bible Insight specific - verse operations
  DETECT_VERSES: 'DETECT_VERSES',
  LOOKUP_VERSE: 'LOOKUP_VERSE',
  GET_CROSS_REFS: 'GET_CROSS_REFS',
  GET_ALL_VERSES: 'GET_ALL_VERSES',
  GET_ITEM_VERSES: 'GET_ITEM_VERSES',

  // YouTube/Sermon
  EXTRACT_TRANSCRIPT: 'EXTRACT_TRANSCRIPT',
  START_SERMON_MODE: 'START_SERMON_MODE',

  // Backup
  EXPORT_BACKUP: 'EXPORT_BACKUP',
  IMPORT_BACKUP: 'IMPORT_BACKUP',

  // Token Usage (Development)
  GET_TOKEN_USAGE: 'GET_TOKEN_USAGE',
  RESET_TOKEN_USAGE: 'RESET_TOKEN_USAGE',

  // Pause Toggle (Development)
  SET_PAUSE_STATE: 'SET_PAUSE_STATE',
  GET_PAUSE_STATE: 'GET_PAUSE_STATE'
};

// ============================================================
// DEFAULT SETTINGS
// ============================================================

export const DEFAULT_SETTINGS = {
  theme: 'system',
  bibleTranslation: 'KJV',
  autoDetectVerses: true,
  aiMode: 'ask', // 'ask', 'local-first', 'cloud-first'
  crossRefSource: 'ai', // 'ai' uses Gemini for cross-refs
  stripNavigation: false,
  cloudAssist: false,
  autoKeyPoints: false,
  includeVerses: true,
  includeThemes: true,
  exportResearchMarkdown: false,
  // API Keys (stored locally, never synced)
  apiKey: '', // Gemini API key
  bibleApiKey: '' // API.Bible key (free at scripture.api.bible)
};
