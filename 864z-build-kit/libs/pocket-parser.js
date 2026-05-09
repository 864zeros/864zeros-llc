// pocket-parser.js - Pocket Import Parser [DELTA: BRK-MIG-004]
// 864zeros Build Kit - 20% Custom Development
//
// This brick parses Pocket's export formats:
// 1. HTML export (ril_export.html)
// 2. JSON export (from Pocket API)

/**
 * Parse Pocket HTML export file.
 * Pocket exports as nested <ul><li><a> structure.
 *
 * @param {string} htmlContent - Raw HTML content from ril_export.html
 * @returns {Array} Array of article objects
 */
export function parsePocketHTML(htmlContent) {
  const articles = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Pocket HTML structure:
  // <ul>
  //   <li><a href="URL" time_added="TIMESTAMP" tags="tag1,tag2">Title</a></li>
  // </ul>

  const links = doc.querySelectorAll('a[href]');

  for (const link of links) {
    try {
      const url = link.getAttribute('href');
      const title = link.textContent?.trim() || url;
      const timeAdded = link.getAttribute('time_added');
      const tagsAttr = link.getAttribute('tags');

      // Skip invalid URLs
      if (!url || !url.startsWith('http')) {
        continue;
      }

      const article = {
        id: crypto.randomUUID(),
        url: url,
        title: title,
        excerpt: '',
        status: 'unread',
        favorite: false,
        source: 'pocket_import',
        createdAt: timeAdded
          ? new Date(parseInt(timeAdded) * 1000).toISOString()
          : new Date().toISOString(),
        importedAt: new Date().toISOString(),
        tags: tagsAttr ? tagsAttr.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      articles.push(article);
    } catch (error) {
      console.warn('[pocket-parser] Error parsing link:', error);
    }
  }

  console.log(`[pocket-parser] Parsed ${articles.length} articles from HTML`);
  return articles;
}

/**
 * Parse Pocket JSON export (from API or browser extension backup).
 *
 * @param {string|object} jsonContent - JSON string or object
 * @returns {Array} Array of article objects
 */
export function parsePocketJSON(jsonContent) {
  const articles = [];

  let data;
  if (typeof jsonContent === 'string') {
    try {
      data = JSON.parse(jsonContent);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  } else {
    data = jsonContent;
  }

  // Pocket JSON structure varies:
  // 1. API export: { list: { "12345": { given_url, given_title, ... } } }
  // 2. Direct export: [{ url, title, excerpt, ... }]

  let items = [];

  if (data.list && typeof data.list === 'object') {
    // API format
    items = Object.values(data.list);
  } else if (Array.isArray(data)) {
    // Direct array format
    items = data;
  } else if (data.items && Array.isArray(data.items)) {
    // Alternative format
    items = data.items;
  }

  for (const item of items) {
    try {
      const url = item.given_url || item.resolved_url || item.url;
      const title = item.given_title || item.resolved_title || item.title || url;

      if (!url || !url.startsWith('http')) {
        continue;
      }

      const article = {
        id: crypto.randomUUID(),
        url: url,
        title: title,
        excerpt: item.excerpt || '',
        status: item.status === '1' ? 'archived' : 'unread',
        favorite: item.favorite === '1',
        source: 'pocket_import',
        createdAt: item.time_added
          ? new Date(parseInt(item.time_added) * 1000).toISOString()
          : new Date().toISOString(),
        importedAt: new Date().toISOString(),
        tags: extractTags(item.tags),
        wordCount: parseInt(item.word_count) || 0,
        timeToRead: parseInt(item.time_to_read) || 0,
        image: item.top_image_url || item.image?.src || null
      };

      articles.push(article);
    } catch (error) {
      console.warn('[pocket-parser] Error parsing item:', error);
    }
  }

  console.log(`[pocket-parser] Parsed ${articles.length} articles from JSON`);
  return articles;
}

/**
 * Extract tags from Pocket's tag format.
 */
function extractTags(tagsObj) {
  if (!tagsObj) return [];

  // Pocket tags can be:
  // 1. Object: { "tag1": { item_id, tag }, "tag2": {...} }
  // 2. String: "tag1,tag2,tag3"
  // 3. Array: ["tag1", "tag2"]

  if (typeof tagsObj === 'string') {
    return tagsObj.split(',').map(t => t.trim()).filter(Boolean);
  }

  if (Array.isArray(tagsObj)) {
    return tagsObj.map(t => typeof t === 'string' ? t : t.tag).filter(Boolean);
  }

  if (typeof tagsObj === 'object') {
    return Object.keys(tagsObj);
  }

  return [];
}

/**
 * Auto-detect format and parse.
 *
 * @param {string} content - File content (HTML or JSON)
 * @returns {Object} { format: 'html'|'json', articles: Array, stats: Object }
 */
export function parsePocketExport(content) {
  const trimmed = content.trim();

  // Detect format
  const isHTML = trimmed.startsWith('<!DOCTYPE') ||
                 trimmed.startsWith('<html') ||
                 trimmed.startsWith('<ul');
  const isJSON = trimmed.startsWith('{') || trimmed.startsWith('[');

  let articles = [];
  let format = 'unknown';

  if (isHTML) {
    format = 'html';
    articles = parsePocketHTML(content);
  } else if (isJSON) {
    format = 'json';
    articles = parsePocketJSON(content);
  } else {
    throw new Error('Unrecognized file format. Expected Pocket HTML or JSON export.');
  }

  // Generate import stats
  const stats = {
    total: articles.length,
    unread: articles.filter(a => a.status === 'unread').length,
    archived: articles.filter(a => a.status === 'archived').length,
    favorites: articles.filter(a => a.favorite).length,
    withTags: articles.filter(a => a.tags.length > 0).length,
    uniqueTags: [...new Set(articles.flatMap(a => a.tags))].length
  };

  return { format, articles, stats };
}

/**
 * Validate Pocket export file before import.
 *
 * @param {File} file - File object from file input
 * @returns {Promise<Object>} Validation result
 */
export async function validatePocketFile(file) {
  const result = {
    valid: false,
    format: null,
    error: null,
    preview: null
  };

  // Check file type
  const validTypes = ['text/html', 'application/json', 'text/plain'];
  const validExtensions = ['.html', '.htm', '.json'];

  const hasValidType = validTypes.includes(file.type) || file.type === '';
  const hasValidExtension = validExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidType && !hasValidExtension) {
    result.error = 'Invalid file type. Please upload a Pocket HTML or JSON export file.';
    return result;
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    result.error = 'File too large. Maximum size is 50MB.';
    return result;
  }

  try {
    const content = await file.text();
    const parsed = parsePocketExport(content);

    result.valid = true;
    result.format = parsed.format;
    result.preview = {
      articleCount: parsed.stats.total,
      sampleArticles: parsed.articles.slice(0, 3).map(a => ({
        title: a.title.substring(0, 50),
        url: a.url.substring(0, 50)
      })),
      stats: parsed.stats
    };
  } catch (error) {
    result.error = error.message;
  }

  return result;
}
