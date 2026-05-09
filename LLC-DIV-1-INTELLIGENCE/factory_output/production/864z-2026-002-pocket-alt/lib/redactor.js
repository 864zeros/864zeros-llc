// redactor.js - Privacy Redactor [BRK-PRI-001: Privacy_Shield]
// 864zeros Build Kit - Data Sanitization Layer
//
// PHILOSOPHY: User data never leaves their device unless explicitly shared.
// This module ensures any exported/shared data is properly sanitized.

/**
 * Redact sensitive information from article data.
 * Used when sharing/exporting with privacy mode enabled.
 */
export function redactArticle(article, options = {}) {
  const {
    preserveUrl = true,
    preserveTitle = true,
    preserveTags = true,
    removeTimestamps = false,
    removeMetadata = false
  } = options;

  const redacted = {
    id: article.id,
    status: article.status,
    favorite: article.favorite
  };

  if (preserveUrl) {
    redacted.url = article.url;
  } else {
    redacted.url = redactUrl(article.url);
  }

  if (preserveTitle) {
    redacted.title = article.title;
  } else {
    redacted.title = '[Redacted]';
  }

  if (preserveTags && article.tags) {
    redacted.tags = article.tags;
  }

  if (!removeTimestamps) {
    redacted.createdAt = article.createdAt;
  }

  if (!removeMetadata) {
    redacted.source = article.source;
  }

  return redacted;
}

/**
 * Redact URL to domain only.
 */
export function redactUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}/[redacted]`;
  } catch {
    return '[invalid-url]';
  }
}

/**
 * Redact collection of articles for export.
 */
export function redactCollection(articles, options = {}) {
  return articles.map(article => redactArticle(article, options));
}

/**
 * Sanitize text for safe display.
 * Prevents XSS and removes potentially sensitive patterns.
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';

  // Remove potential script tags
  let sanitized = text.replace(/<script[^>]*>.*?<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized;
}

/**
 * Check if text contains potential PII.
 * Returns detected patterns for user awareness.
 */
export function detectPII(text) {
  if (!text || typeof text !== 'string') {
    return { hasPII: false, patterns: [] };
  }

  const patterns = [];

  // Email pattern
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    patterns.push('email');
  }

  // Phone pattern (various formats)
  if (/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) {
    patterns.push('phone');
  }

  // SSN pattern (US)
  if (/\d{3}[-.\s]?\d{2}[-.\s]?\d{4}/.test(text)) {
    patterns.push('ssn');
  }

  // Credit card pattern
  if (/\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}/.test(text)) {
    patterns.push('credit_card');
  }

  return {
    hasPII: patterns.length > 0,
    patterns
  };
}

/**
 * Generate anonymous statistics without exposing individual articles.
 */
export function generateAnonStats(articles) {
  // Aggregate statistics only - no individual data
  return {
    totalCount: articles.length,
    statusBreakdown: {
      unread: articles.filter(a => a.status !== 'archived').length,
      archived: articles.filter(a => a.status === 'archived').length
    },
    favoriteCount: articles.filter(a => a.favorite).length,
    tagCount: new Set(articles.flatMap(a => a.tags || [])).size,
    sourceBreakdown: articles.reduce((acc, a) => {
      const source = a.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {}),
    // Time-based stats without exact dates
    oldestArticleAge: calculateAgeInDays(
      articles.reduce((oldest, a) =>
        new Date(a.createdAt) < new Date(oldest.createdAt) ? a : oldest
      , articles[0])?.createdAt
    ),
    newestArticleAge: calculateAgeInDays(
      articles.reduce((newest, a) =>
        new Date(a.createdAt) > new Date(newest.createdAt) ? a : newest
      , articles[0])?.createdAt
    )
  };
}

function calculateAgeInDays(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
