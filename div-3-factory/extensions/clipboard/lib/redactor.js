// ============================================================
// REDACTOR.JS — PPI Redaction
// Strips personally identifiable information before AI API calls.
// ============================================================

const PATTERNS = [
  {
    type: 'EMAIL',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: '[EMAIL_REDACTED]'
  },
  {
    type: 'PHONE',
    regex: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    replacement: '[PHONE_REDACTED]'
  },
  {
    type: 'SSN',
    regex: /\d{3}-\d{2}-\d{4}/g,
    replacement: '[SSN_REDACTED]'
  },
  {
    type: 'CREDIT_CARD',
    regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    replacement: '[CC_REDACTED]'
  },
  {
    type: 'IP_ADDRESS',
    regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    replacement: '[IP_REDACTED]'
  },
  {
    type: 'ADDRESS',
    regex: /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|place|pl)\b/gi,
    replacement: '[ADDRESS_REDACTED]'
  }
];

/**
 * Redact PPI from text.
 * @param {string} text - Text to redact
 * @returns {object} - { redactedText, redactions }
 */
export function redact(text) {
  if (!text || typeof text !== 'string') {
    return { redactedText: text || '', redactions: [] };
  }

  const redactions = [];
  let redactedText = text;

  for (const pattern of PATTERNS) {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

    while ((match = regex.exec(text)) !== null) {
      redactions.push({
        type: pattern.type,
        original: match[0],
        replacement: pattern.replacement,
        index: match.index
      });
    }

    redactedText = redactedText.replace(pattern.regex, pattern.replacement);
  }

  return { redactedText, redactions };
}

/**
 * Restore original values from redaction map.
 * @param {string} text - Redacted text
 * @param {array} redactions - Redaction map from redact()
 * @returns {string} - Original text
 */
export function restore(text, redactions) {
  if (!redactions || !redactions.length) return text;

  let restored = text;

  // Restore in reverse order to preserve indices
  const sorted = [...redactions].sort((a, b) => b.index - a.index);

  for (const r of sorted) {
    restored = restored.replace(r.replacement, r.original);
  }

  return restored;
}
