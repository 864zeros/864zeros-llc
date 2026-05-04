/**
 * article-fetcher.js - Article Content Extractor
 * Strike: 864z-2026-005 (ReadFlow)
 *
 * Extracts readable article content from URLs using DOMParser.
 *
 * SECURITY CONSTRAINTS:
 * - Only fetches the target URL (no tracking pixels, no third-party)
 * - Runs in content script or sidepanel context
 * - No external dependencies
 * - Strips all scripts, iframes, and tracking elements
 */

/**
 * Extracted article content
 * @typedef {Object} ExtractedArticle
 * @property {string} title - Article title
 * @property {string} author - Author name (if found)
 * @property {string} date - Publication date (if found)
 * @property {string} content - Clean HTML content
 * @property {string} textContent - Plain text content
 * @property {number} wordCount - Word count
 * @property {number} readingTimeMinutes - Estimated reading time
 * @property {string} excerpt - First 200 chars
 * @property {string} siteName - Site name
 * @property {string} imageUrl - Main image URL (if found)
 */

// Selectors for content extraction (priority order)
const CONTENT_SELECTORS = [
  'article',
  '[role="main"]',
  'main',
  '.post-content',
  '.article-content',
  '.entry-content',
  '.content',
  '.post',
  '#content',
  '#article',
  '.story-body',
  '.article-body'
];

// Selectors to remove (noise)
const NOISE_SELECTORS = [
  'script',
  'style',
  'noscript',
  'iframe',
  'nav',
  'header',
  'footer',
  'aside',
  '.sidebar',
  '.navigation',
  '.nav',
  '.menu',
  '.ad',
  '.ads',
  '.advertisement',
  '.social-share',
  '.share-buttons',
  '.comments',
  '.comment-section',
  '.related-posts',
  '.recommended',
  '.newsletter',
  '.subscribe',
  '.popup',
  '.modal',
  '[role="complementary"]',
  '[role="navigation"]',
  '[aria-hidden="true"]'
];

// Meta tag selectors for metadata extraction
const META_SELECTORS = {
  title: [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'meta[name="title"]',
    'title'
  ],
  author: [
    'meta[name="author"]',
    'meta[property="article:author"]',
    '[rel="author"]',
    '.author',
    '.byline'
  ],
  date: [
    'meta[property="article:published_time"]',
    'meta[name="date"]',
    'time[datetime]',
    '.date',
    '.published'
  ],
  siteName: [
    'meta[property="og:site_name"]',
    'meta[name="application-name"]'
  ],
  image: [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]'
  ]
};

/**
 * Fetch and extract article content from URL
 * @param {string} url - Article URL
 * @returns {Promise<ExtractedArticle>}
 */
export async function fetchArticle(url) {
  // Fetch the page
  const response = await fetch(url, {
    credentials: 'omit', // Don't send cookies
    mode: 'cors',
    headers: {
      'Accept': 'text/html'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  return extractArticle(html, url);
}

/**
 * Extract article content from HTML string
 * @param {string} html - Raw HTML
 * @param {string} url - Source URL (for resolving relative URLs)
 * @returns {ExtractedArticle}
 */
export function extractArticle(html, url) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Set base URL for relative links
  const base = doc.createElement('base');
  base.href = url;
  doc.head.prepend(base);

  // Extract metadata first
  const metadata = extractMetadata(doc);

  // Remove noise elements
  removeNoise(doc);

  // Find main content
  const content = findMainContent(doc);

  // Clean the content
  const cleanedContent = cleanContent(content, url);

  // Get text content and stats
  const textContent = cleanedContent.textContent.trim();
  const wordCount = countWords(textContent);
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  return {
    title: metadata.title || extractTitle(doc),
    author: metadata.author || '',
    date: metadata.date || '',
    content: cleanedContent.innerHTML,
    textContent,
    wordCount,
    readingTimeMinutes,
    excerpt: textContent.substring(0, 200).trim() + '...',
    siteName: metadata.siteName || extractDomain(url),
    imageUrl: metadata.image || ''
  };
}

/**
 * Extract metadata from document
 * @param {Document} doc
 * @returns {Object}
 */
function extractMetadata(doc) {
  const metadata = {};

  for (const [key, selectors] of Object.entries(META_SELECTORS)) {
    for (const selector of selectors) {
      try {
        const el = doc.querySelector(selector);
        if (el) {
          if (el.tagName === 'META') {
            metadata[key] = el.content;
          } else if (el.tagName === 'TIME') {
            metadata[key] = el.getAttribute('datetime') || el.textContent;
          } else if (el.tagName === 'TITLE') {
            metadata[key] = el.textContent;
          } else {
            metadata[key] = el.textContent?.trim();
          }
          if (metadata[key]) break;
        }
      } catch (e) {
        // Selector failed, try next
      }
    }
  }

  return metadata;
}

/**
 * Remove noise elements from document
 * @param {Document} doc
 */
function removeNoise(doc) {
  for (const selector of NOISE_SELECTORS) {
    try {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    } catch (e) {
      // Invalid selector, skip
    }
  }

  // Remove hidden elements
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    const style = el.getAttribute('style') || '';
    if (style.includes('display:none') || style.includes('display: none') ||
        style.includes('visibility:hidden') || style.includes('visibility: hidden')) {
      el.remove();
    }
  });
}

/**
 * Find main content element
 * @param {Document} doc
 * @returns {Element}
 */
function findMainContent(doc) {
  // Try content selectors in order
  for (const selector of CONTENT_SELECTORS) {
    const el = doc.querySelector(selector);
    if (el && el.textContent.trim().length > 200) {
      return el;
    }
  }

  // Fallback: find largest text block
  const body = doc.body;
  if (!body) return createEmptyContent();

  let bestElement = body;
  let bestScore = 0;

  const candidates = body.querySelectorAll('div, section, article');
  candidates.forEach(el => {
    const text = el.textContent || '';
    const score = scoreContentBlock(el, text);
    if (score > bestScore) {
      bestScore = score;
      bestElement = el;
    }
  });

  return bestElement;
}

/**
 * Score a content block for relevance
 * @param {Element} el
 * @param {string} text
 * @returns {number}
 */
function scoreContentBlock(el, text) {
  let score = 0;

  // Text length (main factor)
  score += text.length;

  // Paragraph density
  const paragraphs = el.querySelectorAll('p');
  score += paragraphs.length * 50;

  // Penalize elements with many links (likely navigation)
  const links = el.querySelectorAll('a');
  const linkDensity = links.length / (text.length || 1);
  if (linkDensity > 0.1) {
    score *= 0.5;
  }

  // Boost elements with class hints
  const className = el.className.toLowerCase();
  if (className.includes('content') || className.includes('article') ||
      className.includes('post') || className.includes('entry')) {
    score *= 1.5;
  }

  return score;
}

/**
 * Clean content element for reading
 * @param {Element} content
 * @param {string} baseUrl
 * @returns {Element}
 */
function cleanContent(content, baseUrl) {
  // Clone to avoid modifying original
  const clone = content.cloneNode(true);

  // Remove remaining noise
  const noiseInContent = clone.querySelectorAll(
    'script, style, form, input, button, .ad, .share, .social'
  );
  noiseInContent.forEach(el => el.remove());

  // Clean attributes (remove tracking, onclick, etc.)
  const allElements = clone.querySelectorAll('*');
  allElements.forEach(el => {
    // Keep only safe attributes
    const safeAttrs = ['href', 'src', 'alt', 'title', 'class', 'id'];
    const attrs = [...el.attributes];
    attrs.forEach(attr => {
      if (!safeAttrs.includes(attr.name)) {
        el.removeAttribute(attr.name);
      }
    });

    // Resolve relative URLs
    if (el.href && !el.href.startsWith('http')) {
      try {
        el.href = new URL(el.href, baseUrl).toString();
      } catch (e) {
        // Invalid URL, leave as is
      }
    }
    if (el.src && !el.src.startsWith('http')) {
      try {
        el.src = new URL(el.src, baseUrl).toString();
      } catch (e) {
        // Invalid URL, leave as is
      }
    }
  });

  // Remove empty paragraphs
  const emptyParagraphs = clone.querySelectorAll('p:empty, div:empty');
  emptyParagraphs.forEach(el => {
    if (!el.querySelector('img')) {
      el.remove();
    }
  });

  return clone;
}

/**
 * Extract title from document
 * @param {Document} doc
 * @returns {string}
 */
function extractTitle(doc) {
  // Try h1 first
  const h1 = doc.querySelector('h1');
  if (h1 && h1.textContent.trim()) {
    return h1.textContent.trim();
  }

  // Fall back to title tag
  const title = doc.querySelector('title');
  if (title) {
    // Remove site name from title
    let text = title.textContent;
    text = text.replace(/\s*[|\-–—]\s*[^|\-–—]+$/, '');
    return text.trim();
  }

  return 'Untitled';
}

/**
 * Extract domain from URL
 * @param {string} url
 * @returns {string}
 */
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

/**
 * Count words in text
 * @param {string} text
 * @returns {number}
 */
function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Create empty content element
 * @returns {Element}
 */
function createEmptyContent() {
  const div = document.createElement('div');
  div.innerHTML = '<p>Content could not be extracted.</p>';
  return div;
}

/**
 * Batch fetch multiple articles
 * @param {string[]} urls
 * @param {Function} onProgress - Progress callback (index, total, result)
 * @returns {Promise<ExtractedArticle[]>}
 */
export async function fetchArticlesBatch(urls, onProgress = null) {
  const results = [];

  for (let i = 0; i < urls.length; i++) {
    try {
      const article = await fetchArticle(urls[i]);
      results.push(article);
      if (onProgress) onProgress(i + 1, urls.length, { success: true, article });
    } catch (error) {
      results.push({
        url: urls[i],
        error: error.message,
        title: extractDomain(urls[i]),
        content: `<p>Failed to fetch: ${error.message}</p>`,
        textContent: '',
        wordCount: 0,
        readingTimeMinutes: 0
      });
      if (onProgress) onProgress(i + 1, urls.length, { success: false, error });
    }

    // Small delay to avoid rate limiting
    if (i < urls.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return results;
}
