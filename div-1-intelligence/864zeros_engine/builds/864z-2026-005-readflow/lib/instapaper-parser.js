/**
 * instapaper-parser.js - Instapaper CSV Import Parser
 * Strike: 864z-2026-005 (ReadFlow)
 * Brick: BRK-ARTICLE-001
 *
 * Parses Instapaper CSV exports and generates rescue audit metrics.
 * Format: URL, Title, Selection, Folder, Timestamp
 */

// Average reading speed (words per minute)
const READING_SPEED_WPM = 200;

// Instapaper Premium annual price
const INSTAPAPER_PREMIUM_PRICE = 30;

/**
 * Article entry structure
 * @typedef {Object} Article
 * @property {string} id - Unique identifier
 * @property {string} url - Article URL
 * @property {string} title - Article title
 * @property {string} selection - Highlighted text (if any)
 * @property {string} folder - Instapaper folder
 * @property {Date} timestamp - When article was saved
 * @property {string} domain - Extracted domain
 * @property {string} status - 'unread' | 'read' | 'archived'
 * @property {string} content - Fetched article content (optional)
 * @property {number} wordCount - Estimated word count
 * @property {number} readingTimeMinutes - Estimated reading time
 */

/**
 * Rescue audit summary
 * @typedef {Object} RescueAudit
 * @property {number} totalArticles - Total articles imported
 * @property {number} unreadCount - Articles marked unread
 * @property {number} archivedCount - Articles in Archive folder
 * @property {number} totalReadingTimeMinutes - Estimated total reading time
 * @property {number} totalReadingTimeHours - Reading time in hours
 * @property {number} savingsAnnual - Annual savings vs Instapaper Premium
 * @property {number} savingsLifetime - Lifetime savings (5 years projected)
 * @property {string[]} folders - Unique folders found
 * @property {Object} folderCounts - Articles per folder
 * @property {string} oldestArticle - Date of oldest article
 * @property {string} newestArticle - Date of newest article
 */

/**
 * Parse Instapaper CSV export
 * @param {string} csvContent - Raw CSV file content
 * @returns {{ articles: Article[], audit: RescueAudit, errors: string[] }}
 */
export function parseInstapaperCSV(csvContent) {
  const articles = [];
  const errors = [];
  const folderCounts = {};

  // Split into lines and parse
  const lines = csvContent.split(/\r?\n/);

  // Check for header row
  let startIndex = 0;
  const firstLine = lines[0]?.toLowerCase() || '';
  if (firstLine.includes('url') && firstLine.includes('title')) {
    startIndex = 1; // Skip header
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const parsed = parseCSVLine(line);

      if (parsed.length < 2) {
        errors.push(`Line ${i + 1}: Insufficient fields`);
        continue;
      }

      const [url, title, selection = '', folder = 'Unread', timestamp = ''] = parsed;

      // Validate URL
      if (!isValidURL(url)) {
        errors.push(`Line ${i + 1}: Invalid URL - ${url.substring(0, 50)}`);
        continue;
      }

      // Extract domain
      const domain = extractDomain(url);

      // Parse timestamp
      const date = parseTimestamp(timestamp);

      // Determine status based on folder
      const status = folder.toLowerCase() === 'archive' ? 'archived' : 'unread';

      // Estimate word count from title + selection (rough estimate)
      const estimatedWords = estimateWordCount(title, selection);

      const article = {
        id: generateId(),
        url: url.trim(),
        title: title.trim() || domain,
        selection: selection.trim(),
        folder: folder.trim() || 'Unread',
        timestamp: date,
        domain,
        status,
        content: null,
        wordCount: estimatedWords,
        readingTimeMinutes: Math.ceil(estimatedWords / READING_SPEED_WPM)
      };

      articles.push(article);

      // Track folder counts
      folderCounts[article.folder] = (folderCounts[article.folder] || 0) + 1;

    } catch (err) {
      errors.push(`Line ${i + 1}: Parse error - ${err.message}`);
    }
  }

  // Generate audit summary
  const audit = generateRescueAudit(articles, folderCounts);

  return { articles, audit, errors };
}

/**
 * Parse a single CSV line handling quoted fields
 * @param {string} line - CSV line
 * @returns {string[]} - Parsed fields
 */
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Push last field
  fields.push(current);

  return fields;
}

/**
 * Generate rescue audit summary
 * @param {Article[]} articles
 * @param {Object} folderCounts
 * @returns {RescueAudit}
 */
function generateRescueAudit(articles, folderCounts) {
  const unreadCount = articles.filter(a => a.status === 'unread').length;
  const archivedCount = articles.filter(a => a.status === 'archived').length;

  // Calculate total reading time
  // Assume average article is ~1000 words (5 min read)
  const avgWordsPerArticle = 1000;
  const totalWords = articles.length * avgWordsPerArticle;
  const totalReadingTimeMinutes = Math.ceil(totalWords / READING_SPEED_WPM);
  const totalReadingTimeHours = Math.round(totalReadingTimeMinutes / 60 * 10) / 10;

  // Find date range
  const dates = articles
    .map(a => a.timestamp)
    .filter(d => d instanceof Date && !isNaN(d))
    .sort((a, b) => a - b);

  const oldestArticle = dates[0] ? formatDate(dates[0]) : 'Unknown';
  const newestArticle = dates[dates.length - 1] ? formatDate(dates[dates.length - 1]) : 'Unknown';

  return {
    totalArticles: articles.length,
    unreadCount,
    archivedCount,
    totalReadingTimeMinutes,
    totalReadingTimeHours,
    savingsAnnual: INSTAPAPER_PREMIUM_PRICE,
    savingsLifetime: INSTAPAPER_PREMIUM_PRICE * 5,
    folders: Object.keys(folderCounts),
    folderCounts,
    oldestArticle,
    newestArticle
  };
}

/**
 * Validate URL
 * @param {string} url
 * @returns {boolean}
 */
function isValidURL(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL
 * @param {string} url
 * @returns {string}
 */
function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

/**
 * Parse timestamp from various formats
 * @param {string} timestamp
 * @returns {Date|null}
 */
function parseTimestamp(timestamp) {
  if (!timestamp) return new Date();

  // Try ISO format
  let date = new Date(timestamp);
  if (!isNaN(date)) return date;

  // Try Unix timestamp (seconds)
  const unixSeconds = parseInt(timestamp, 10);
  if (!isNaN(unixSeconds) && unixSeconds > 1000000000) {
    return new Date(unixSeconds * 1000);
  }

  // Try Unix timestamp (milliseconds)
  if (!isNaN(unixSeconds) && unixSeconds > 1000000000000) {
    return new Date(unixSeconds);
  }

  return new Date();
}

/**
 * Estimate word count from title and selection
 * @param {string} title
 * @param {string} selection
 * @returns {number}
 */
function estimateWordCount(title, selection) {
  const text = `${title} ${selection}`;
  const words = text.split(/\s+/).filter(w => w.length > 0);
  // Title/selection gives a hint, but assume ~1000 words for full article
  return Math.max(words.length * 50, 500);
}

/**
 * Generate unique ID
 * @returns {string}
 */
function generateId() {
  return crypto.randomUUID();
}

/**
 * Format date for display
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * ReadFlow Article Library
 * Manages imported articles with IndexedDB persistence
 */
export class ArticleLibrary {
  constructor() {
    this.articles = [];
    this.metadata = {
      source: null,
      importedAt: null,
      totalImported: 0
    };
    this.db = null;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('readflow-library', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Articles store
        if (!db.objectStoreNames.contains('articles')) {
          const store = db.createObjectStore('articles', { keyPath: 'id' });
          store.createIndex('by-status', 'status', { unique: false });
          store.createIndex('by-folder', 'folder', { unique: false });
          store.createIndex('by-domain', 'domain', { unique: false });
          store.createIndex('by-timestamp', 'timestamp', { unique: false });
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Import articles from parsed CSV
   * @param {{ articles: Article[], audit: RescueAudit }} parsed
   */
  async importArticles(parsed) {
    const { articles, audit } = parsed;

    // Check for duplicates by URL
    const existingUrls = new Set(this.articles.map(a => a.url));
    const newArticles = articles.filter(a => !existingUrls.has(a.url));

    // Add to library
    this.articles.push(...newArticles);

    // Update metadata
    this.metadata = {
      source: 'Instapaper',
      importedAt: new Date().toISOString(),
      totalImported: this.articles.length,
      lastAudit: audit
    };

    // Persist to IndexedDB
    await this.save();

    return {
      imported: newArticles.length,
      duplicatesSkipped: articles.length - newArticles.length,
      audit
    };
  }

  /**
   * Save library to IndexedDB
   */
  async save() {
    if (!this.db) await this.init();

    const tx = this.db.transaction(['articles', 'metadata'], 'readwrite');
    const articlesStore = tx.objectStore('articles');
    const metadataStore = tx.objectStore('metadata');

    // Save all articles
    for (const article of this.articles) {
      articlesStore.put(article);
    }

    // Save metadata
    metadataStore.put({ key: 'library', ...this.metadata });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Load library from IndexedDB
   */
  async load() {
    if (!this.db) await this.init();

    const tx = this.db.transaction(['articles', 'metadata'], 'readonly');
    const articlesStore = tx.objectStore('articles');
    const metadataStore = tx.objectStore('metadata');

    // Load articles
    const articlesRequest = articlesStore.getAll();
    const metadataRequest = metadataStore.get('library');

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        this.articles = articlesRequest.result || [];
        if (metadataRequest.result) {
          this.metadata = metadataRequest.result;
        }
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get unread articles
   * @param {number} limit
   * @returns {Article[]}
   */
  getUnread(limit = 0) {
    const unread = this.articles.filter(a => a.status === 'unread');
    return limit > 0 ? unread.slice(0, limit) : unread;
  }

  /**
   * Mark article as read
   * @param {string} id
   */
  async markRead(id) {
    const article = this.articles.find(a => a.id === id);
    if (article) {
      article.status = 'read';
      await this.save();
    }
  }

  /**
   * Archive article
   * @param {string} id
   */
  async archive(id) {
    const article = this.articles.find(a => a.id === id);
    if (article) {
      article.status = 'archived';
      article.folder = 'Archive';
      await this.save();
    }
  }

  /**
   * Search articles
   * @param {string} query
   * @returns {Article[]}
   */
  search(query) {
    const q = query.toLowerCase();
    return this.articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.domain.toLowerCase().includes(q) ||
      a.folder.toLowerCase().includes(q)
    );
  }

  /**
   * Get articles by folder
   * @param {string} folder
   * @returns {Article[]}
   */
  getByFolder(folder) {
    return this.articles.filter(a => a.folder === folder);
  }

  /**
   * Get unique folders
   * @returns {string[]}
   */
  getFolders() {
    return [...new Set(this.articles.map(a => a.folder))];
  }

  /**
   * Get library stats
   */
  getStats() {
    return {
      total: this.articles.length,
      unread: this.articles.filter(a => a.status === 'unread').length,
      read: this.articles.filter(a => a.status === 'read').length,
      archived: this.articles.filter(a => a.status === 'archived').length,
      folders: this.getFolders().length
    };
  }
}

// Export for use in app
export { INSTAPAPER_PREMIUM_PRICE, READING_SPEED_WPM };
