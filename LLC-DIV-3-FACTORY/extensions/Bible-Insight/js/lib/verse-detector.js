/**
 * verse-detector.js — Bible Verse Detection Engine (TR-07)
 *
 * Feature Brick ID: TR-07
 * Reusable in: Any FHG product, devotional apps, church management tools
 *
 * Detects Bible verse references in text using regex patterns and
 * normalizes them to a standard format for API lookup.
 *
 * Supported formats:
 * - "John 3:16"
 * - "1 Corinthians 13:4-7"
 * - "Rom 8:28"
 * - "Gen. 1:1"
 * - "Ps 23:1-6"
 * - "Matt 5:3-12"
 */

import { BIBLE_BOOKS, BIBLE_BOOK_ABBREVS } from './constants.js';

// ============================================================
// BOOK NAME PATTERNS
// ============================================================

// Build regex pattern for book names (full and abbreviated)
function buildBookPattern() {
  // Combine full names and abbreviations
  const allNames = [
    ...BIBLE_BOOKS,
    ...Object.keys(BIBLE_BOOK_ABBREVS)
  ];

  // Sort by length (longest first) to ensure longer names match before shorter
  allNames.sort((a, b) => b.length - a.length);

  // Escape special regex characters and join
  const escaped = allNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  return escaped.join('|');
}

const BOOK_PATTERN = buildBookPattern();

// ============================================================
// VERSE REFERENCE REGEX
// ============================================================

// Main pattern for detecting verse references
// Captures: [fullMatch, book, chapter, verseStart, verseEnd (optional)]
const VERSE_REGEX = new RegExp(
  `(${BOOK_PATTERN})\\.?\\s*(\\d+):(\\d+)(?:[-–—](\\d+))?`,
  'gi'
);

// Pattern for chapter-only references (e.g., "Psalm 23", "Romans 8")
const CHAPTER_REGEX = new RegExp(
  `(${BOOK_PATTERN})\\.?\\s+(\\d+)(?![:\\d])`,
  'gi'
);

// ============================================================
// NORMALIZATION
// ============================================================

/**
 * Normalize a book name to its full canonical form.
 * @param {string} bookName - Book name or abbreviation
 * @returns {string} - Full book name
 */
function normalizeBookName(bookName) {
  const cleaned = bookName.trim().replace(/\.+$/, '');

  // Check if it's already a full name
  const fullName = BIBLE_BOOKS.find(
    book => book.toLowerCase() === cleaned.toLowerCase()
  );
  if (fullName) return fullName;

  // Check abbreviations
  for (const [abbrev, full] of Object.entries(BIBLE_BOOK_ABBREVS)) {
    if (abbrev.toLowerCase() === cleaned.toLowerCase()) {
      return full;
    }
  }

  // Return as-is if not found (could be a valid variant)
  return cleaned;
}

/**
 * Format a verse reference to standard format.
 * @param {Object} parsed - Parsed verse components
 * @returns {string} - Formatted reference (e.g., "John 3:16")
 */
function formatReference(parsed) {
  let ref = `${parsed.book} ${parsed.chapter}:${parsed.verseStart}`;
  if (parsed.verseEnd && parsed.verseEnd !== parsed.verseStart) {
    ref += `-${parsed.verseEnd}`;
  }
  return ref;
}

// ============================================================
// DETECTION FUNCTIONS
// ============================================================

/**
 * Detect all Bible verse references in text.
 * @param {string} text - Text to search
 * @returns {Array<Object>} - Array of detected verses
 */
export function detectVerses(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const results = [];
  const seenReferences = new Set();

  // Find verse references (Book Chapter:Verse)
  let match;
  while ((match = VERSE_REGEX.exec(text)) !== null) {
    const [fullMatch, bookRaw, chapter, verseStart, verseEnd] = match;

    const book = normalizeBookName(bookRaw);
    const parsed = {
      book,
      chapter: parseInt(chapter, 10),
      verseStart: parseInt(verseStart, 10),
      verseEnd: verseEnd ? parseInt(verseEnd, 10) : parseInt(verseStart, 10)
    };

    const reference = formatReference(parsed);

    // Avoid duplicates
    if (!seenReferences.has(reference.toLowerCase())) {
      seenReferences.add(reference.toLowerCase());

      results.push({
        reference,
        book: parsed.book,
        chapter: parsed.chapter,
        verseStart: parsed.verseStart,
        verseEnd: parsed.verseEnd,
        originalText: fullMatch,
        startIndex: match.index,
        endIndex: match.index + fullMatch.length
      });
    }
  }

  // Reset regex state
  VERSE_REGEX.lastIndex = 0;

  // Sort by position in text
  results.sort((a, b) => a.startIndex - b.startIndex);

  return results;
}

/**
 * Detect chapter references (e.g., "Psalm 23", "Romans 8").
 * @param {string} text - Text to search
 * @returns {Array<Object>} - Array of detected chapters
 */
export function detectChapters(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const results = [];
  const seenReferences = new Set();

  let match;
  while ((match = CHAPTER_REGEX.exec(text)) !== null) {
    const [fullMatch, bookRaw, chapter] = match;

    const book = normalizeBookName(bookRaw);
    const reference = `${book} ${chapter}`;

    // Avoid duplicates
    if (!seenReferences.has(reference.toLowerCase())) {
      seenReferences.add(reference.toLowerCase());

      results.push({
        reference,
        book,
        chapter: parseInt(chapter, 10),
        originalText: fullMatch,
        startIndex: match.index,
        endIndex: match.index + fullMatch.length
      });
    }
  }

  // Reset regex state
  CHAPTER_REGEX.lastIndex = 0;

  return results;
}

/**
 * Detect all Bible references (verses and chapters).
 * @param {string} text - Text to search
 * @returns {Array<Object>} - Combined array of all references
 */
export function detectAllReferences(text) {
  const verses = detectVerses(text);
  const chapters = detectChapters(text);

  // Combine and deduplicate (verses take precedence)
  const verseStarts = new Set(verses.map(v => v.startIndex));
  const chaptersFiltered = chapters.filter(c => !verseStarts.has(c.startIndex));

  return [...verses, ...chaptersFiltered].sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Highlight verse references in HTML text.
 * Returns text with verse references wrapped in <span> elements.
 * @param {string} text - Plain text
 * @param {string} [className='bible-verse-ref'] - CSS class for spans
 * @returns {string} - HTML with highlighted verses
 */
export function highlightVerses(text, className = 'bible-verse-ref') {
  if (!text || typeof text !== 'string') {
    return text;
  }

  const verses = detectVerses(text);
  if (verses.length === 0) {
    return text;
  }

  // Process in reverse order to maintain correct indices
  let result = text;
  for (let i = verses.length - 1; i >= 0; i--) {
    const verse = verses[i];
    const before = result.substring(0, verse.startIndex);
    const match = result.substring(verse.startIndex, verse.endIndex);
    const after = result.substring(verse.endIndex);

    result = `${before}<span class="${className}" data-reference="${verse.reference}">${match}</span>${after}`;
  }

  return result;
}

/**
 * Extract unique books mentioned in text.
 * @param {string} text - Text to search
 * @returns {Array<string>} - Unique book names
 */
export function extractBooks(text) {
  const references = detectAllReferences(text);
  const books = new Set(references.map(r => r.book));
  return Array.from(books).sort();
}

/**
 * Validate a verse reference format.
 * @param {string} reference - Reference to validate
 * @returns {boolean}
 */
export function isValidReference(reference) {
  if (!reference || typeof reference !== 'string') {
    return false;
  }

  const verses = detectVerses(reference);
  return verses.length > 0;
}

/**
 * Parse a single verse reference.
 * @param {string} reference - Reference to parse
 * @returns {Object|null}
 */
export function parseReference(reference) {
  const verses = detectVerses(reference);
  return verses.length > 0 ? verses[0] : null;
}
