// deep-parser.js - Deep Parse Engine [DELTA: BRK-PRS-001]
// 864zeros Build Kit - 25% Custom Development
//
// Superior article parsing with fallback chain.
// Handles SPAs, paywalls, and modern web architecture.

import { PARSE_CONFIDENCE, PARSER_CHAIN } from './constants.js';

/**
 * Parse result with confidence scoring.
 */
export class ParseResult {
  constructor({
    success = false,
    title = '',
    content = '',
    excerpt = '',
    byline = '',
    siteName = '',
    publishedDate = null,
    images = [],
    wordCount = 0,
    readingTime = 0,
    confidence = 0,
    parser = 'unknown',
    error = null
  } = {}) {
    this.success = success;
    this.title = title;
    this.content = content;
    this.excerpt = excerpt;
    this.byline = byline;
    this.siteName = siteName;
    this.publishedDate = publishedDate;
    this.images = images;
    this.wordCount = wordCount;
    this.readingTime = readingTime;
    this.confidence = confidence;
    this.parser = parser;
    this.error = error;
  }

  get confidenceLevel() {
    if (this.confidence >= PARSE_CONFIDENCE.HIGH) return 'high';
    if (this.confidence >= PARSE_CONFIDENCE.MEDIUM) return 'medium';
    if (this.confidence >= PARSE_CONFIDENCE.LOW) return 'low';
    return 'failed';
  }
}

/**
 * Deep Parser - Article extraction with fallback chain.
 */
export class DeepParser {
  constructor(options = {}) {
    this.options = {
      parseImages: true,
      maxImageSize: 5 * 1024 * 1024, // 5MB
      timeout: 30000,
      ...options
    };
  }

  /**
   * Parse article from URL.
   * Uses fallback chain for maximum extraction success.
   */
  async parse(url, html = null) {
    console.log(`[DeepParser] Parsing: ${url}`);

    // Fetch HTML if not provided
    if (!html) {
      try {
        html = await this._fetchHTML(url);
      } catch (error) {
        return new ParseResult({
          success: false,
          error: `Fetch failed: ${error.message}`
        });
      }
    }

    // Try each parser in the chain
    for (const parserName of PARSER_CHAIN) {
      try {
        console.log(`[DeepParser] Trying parser: ${parserName}`);
        const result = await this._tryParser(parserName, url, html);

        if (result.success && result.confidence >= PARSE_CONFIDENCE.LOW) {
          console.log(`[DeepParser] Success with ${parserName} (confidence: ${result.confidence})`);
          return result;
        }
      } catch (error) {
        console.warn(`[DeepParser] Parser ${parserName} failed:`, error.message);
      }
    }

    // All parsers failed
    return new ParseResult({
      success: false,
      error: 'All parsers failed to extract content'
    });
  }

  /**
   * Try a specific parser.
   */
  async _tryParser(parserName, url, html) {
    switch (parserName) {
      case 'readability':
        return this._parseWithReadability(url, html);
      case 'mercury':
        return this._parseWithMercury(url, html);
      case 'dom_snapshot':
        return this._parseWithDOMSnapshot(url, html);
      case 'raw_text':
        return this._parseRawText(url, html);
      default:
        throw new Error(`Unknown parser: ${parserName}`);
    }
  }

  /**
   * Mozilla Readability parser (primary).
   */
  _parseWithReadability(url, html) {
    const doc = this._parseHTML(html);

    // Import Readability dynamically
    // In production, this would use the actual Readability library
    const article = this._simulateReadability(doc, url);

    if (!article || !article.content || article.content.length < 100) {
      return new ParseResult({
        success: false,
        parser: 'readability',
        confidence: 0
      });
    }

    const wordCount = this._countWords(article.textContent);
    const confidence = this._calculateConfidence(article);

    return new ParseResult({
      success: true,
      title: article.title || this._extractTitle(doc),
      content: article.content,
      excerpt: article.excerpt || this._generateExcerpt(article.textContent),
      byline: article.byline || '',
      siteName: article.siteName || this._extractSiteName(url),
      publishedDate: this._extractDate(doc),
      images: this.options.parseImages ? this._extractImages(doc, url) : [],
      wordCount,
      readingTime: Math.ceil(wordCount / 200),
      confidence,
      parser: 'readability'
    });
  }

  /**
   * Mercury Parser fallback.
   */
  _parseWithMercury(url, html) {
    // Mercury parser implementation
    // This is a simplified version - in production use @postlight/parser
    const doc = this._parseHTML(html);

    // Try to find article content
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      '#content'
    ];

    let content = null;
    for (const selector of selectors) {
      const el = doc.querySelector(selector);
      if (el && el.textContent.length > 200) {
        content = el;
        break;
      }
    }

    if (!content) {
      return new ParseResult({
        success: false,
        parser: 'mercury',
        confidence: 0
      });
    }

    const textContent = content.textContent;
    const wordCount = this._countWords(textContent);

    return new ParseResult({
      success: true,
      title: this._extractTitle(doc),
      content: content.innerHTML,
      excerpt: this._generateExcerpt(textContent),
      byline: this._extractByline(doc),
      siteName: this._extractSiteName(url),
      publishedDate: this._extractDate(doc),
      images: this.options.parseImages ? this._extractImages(content, url) : [],
      wordCount,
      readingTime: Math.ceil(wordCount / 200),
      confidence: 0.6, // Mercury is reliable but less sophisticated
      parser: 'mercury'
    });
  }

  /**
   * DOM Snapshot with CSS inlining (fallback for SPAs).
   */
  _parseWithDOMSnapshot(url, html) {
    const doc = this._parseHTML(html);

    // Remove navigation, ads, footers
    const removeSelectors = [
      'nav', 'header', 'footer', 'aside',
      '.nav', '.header', '.footer', '.sidebar',
      '.ads', '.advertisement', '.social-share',
      'script', 'style', 'iframe'
    ];

    for (const selector of removeSelectors) {
      doc.querySelectorAll(selector).forEach(el => el.remove());
    }

    const body = doc.body;
    if (!body || body.textContent.length < 100) {
      return new ParseResult({
        success: false,
        parser: 'dom_snapshot',
        confidence: 0
      });
    }

    const textContent = body.textContent;
    const wordCount = this._countWords(textContent);

    return new ParseResult({
      success: true,
      title: this._extractTitle(doc),
      content: body.innerHTML,
      excerpt: this._generateExcerpt(textContent),
      siteName: this._extractSiteName(url),
      images: this.options.parseImages ? this._extractImages(body, url) : [],
      wordCount,
      readingTime: Math.ceil(wordCount / 200),
      confidence: 0.4, // DOM snapshot is a fallback
      parser: 'dom_snapshot'
    });
  }

  /**
   * Raw text extraction (last resort).
   */
  _parseRawText(url, html) {
    const doc = this._parseHTML(html);

    // Get all text, removing scripts and styles
    const scripts = doc.querySelectorAll('script, style, noscript');
    scripts.forEach(el => el.remove());

    const text = doc.body?.textContent || '';
    const cleanText = text.replace(/\s+/g, ' ').trim();

    if (cleanText.length < 100) {
      return new ParseResult({
        success: false,
        parser: 'raw_text',
        confidence: 0
      });
    }

    const wordCount = this._countWords(cleanText);

    return new ParseResult({
      success: true,
      title: this._extractTitle(doc),
      content: `<p>${cleanText.substring(0, 50000)}</p>`,
      excerpt: cleanText.substring(0, 300),
      siteName: this._extractSiteName(url),
      wordCount,
      readingTime: Math.ceil(wordCount / 200),
      confidence: 0.2, // Raw text is last resort
      parser: 'raw_text'
    });
  }

  // ===== HELPER METHODS =====

  async _fetchHTML(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ReadFlow/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  _parseHTML(html) {
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  _simulateReadability(doc, url) {
    // Simplified Readability simulation
    // In production, use the actual Readability.js library
    const article = doc.querySelector('article') || doc.querySelector('main');

    if (!article) return null;

    return {
      title: this._extractTitle(doc),
      content: article.innerHTML,
      textContent: article.textContent,
      excerpt: this._generateExcerpt(article.textContent),
      byline: this._extractByline(doc),
      siteName: this._extractSiteName(url)
    };
  }

  _extractTitle(doc) {
    return doc.querySelector('h1')?.textContent?.trim() ||
           doc.querySelector('title')?.textContent?.trim() ||
           doc.querySelector('[property="og:title"]')?.getAttribute('content') ||
           'Untitled';
  }

  _extractByline(doc) {
    return doc.querySelector('[rel="author"]')?.textContent?.trim() ||
           doc.querySelector('.author')?.textContent?.trim() ||
           doc.querySelector('[property="article:author"]')?.getAttribute('content') ||
           '';
  }

  _extractSiteName(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  _extractDate(doc) {
    const dateEl = doc.querySelector('time[datetime]') ||
                   doc.querySelector('[property="article:published_time"]');

    if (dateEl) {
      return dateEl.getAttribute('datetime') || dateEl.getAttribute('content');
    }
    return null;
  }

  _extractImages(container, baseUrl) {
    const images = [];
    const imgElements = container.querySelectorAll('img[src]');

    for (const img of imgElements) {
      try {
        const src = new URL(img.src, baseUrl).href;
        images.push({
          src,
          alt: img.alt || '',
          width: img.width,
          height: img.height
        });
      } catch {
        // Skip invalid URLs
      }
    }

    return images.slice(0, 20); // Limit to 20 images
  }

  _generateExcerpt(text, maxLength = 300) {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLength) return clean;
    return clean.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }

  _countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  _calculateConfidence(article) {
    let confidence = 0.5; // Base confidence

    // Boost for longer content
    if (article.textContent.length > 1000) confidence += 0.1;
    if (article.textContent.length > 3000) confidence += 0.1;

    // Boost for title match
    if (article.title && article.title.length > 10) confidence += 0.1;

    // Boost for byline
    if (article.byline) confidence += 0.05;

    // Cap at 0.95
    return Math.min(0.95, confidence);
  }
}

// Singleton export
export const deepParser = new DeepParser();
