/**
 * 864zeros Core — redactor.js
 * Strips PPI (Personally Identifiable Information) before AI calls.
 * Implements BRK-PRIVACY-001
 */

export const REDACTION_PATTERNS = {
  EMAIL: {
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: '[EMAIL_REDACTED]'
  },
  PHONE: {
    regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    replacement: '[PHONE_REDACTED]'
  },
  SSN: {
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN_REDACTED]'
  },
  CC: {
    regex: /\b(?:\d[ -]*?){13,19}\b/g,
    replacement: '[CC_REDACTED]'
  },
  IP: {
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    replacement: '[IP_REDACTED]'
  },
  ADDRESS: {
    regex: /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|place|pl)\b/gi,
    replacement: '[ADDRESS_REDACTED]'
  }
};

/**
 * Redact PPI from text
 * @param {string} text 
 * @returns {Object} { redactedText, redactions }
 */
export function redact(text) {
  if (!text || typeof text !== 'string') return { redactedText: text, redactions: [] };

  let redactedText = text;
  const redactions = [];

  for (const [type, pattern] of Object.entries(REDACTION_PATTERNS)) {
    const matches = [...text.matchAll(pattern.regex)];
    
    for (const match of matches) {
      redactions.push({
        type,
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
 * Restore original text from redaction map
 * @param {string} text 
 * @param {Array} redactions 
 * @returns {string}
 */
export function restore(text, redactions) {
  if (!text || !redactions || !redactions.length) return text;

  let restoredText = text;
  // Restore in reverse order to preserve indices if we ever use them
  const sorted = [...redactions].sort((a, b) => b.index - a.index);
  
  for (const r of sorted) {
    restoredText = restoredText.replace(r.replacement, r.original);
  }

  return restoredText;
}
