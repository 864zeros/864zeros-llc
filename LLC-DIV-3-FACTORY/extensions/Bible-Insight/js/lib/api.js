/**
 * api.js — External API Communication for Bible Insight
 *
 * Handles:
 * - Google Gemini AI (text and image analysis)
 * - API.Bible (verse lookup, cross-references)
 *
 * Privacy note: Only redacted/user-approved content is sent to APIs.
 */

import { API_ENDPOINTS, AI_CONFIG, APP_SLUG } from './constants.js';

// ============================================================
// TOKEN COUNTER (Development Tracking)
// ============================================================

// In-memory token tracking (resets on service worker restart)
let tokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalCalls: 0,
  lastReset: new Date().toISOString()
};

/**
 * Get current token usage stats.
 * @returns {Object} Token usage statistics
 */
export function getTokenUsage() {
  return { ...tokenUsage };
}

/**
 * Reset token usage counter.
 */
export function resetTokenUsage() {
  tokenUsage = {
    inputTokens: 0,
    outputTokens: 0,
    totalCalls: 0,
    lastReset: new Date().toISOString()
  };
  console.log('[api] Token usage reset');
}

/**
 * Update token usage from API response.
 * @param {Object} result - Gemini API response
 */
function trackTokenUsage(result) {
  const usage = result.usageMetadata;
  if (usage) {
    tokenUsage.inputTokens += usage.promptTokenCount || 0;
    tokenUsage.outputTokens += usage.candidatesTokenCount || 0;
    tokenUsage.totalCalls += 1;
    console.log(`[api] Tokens used: ${usage.promptTokenCount || 0} in, ${usage.candidatesTokenCount || 0} out. Total calls: ${tokenUsage.totalCalls}`);
  }
}

// ============================================================
// VERSE CACHE (Reduces API calls)
// ============================================================

// In-memory caches (reset on service worker restart)
const verseCache = new Map();      // key: "reference|translation" -> verse data
const crossRefCache = new Map();   // key: reference -> cross-refs array

const CACHE_MAX_SIZE = 200;        // Max entries per cache
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Get cached verse or null if not found/expired.
 */
function getCachedVerse(reference, translation) {
  const key = `${reference.toLowerCase()}|${translation}`;
  const cached = verseCache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    console.log(`[api] Cache hit for verse: ${reference}`);
    return cached.data;
  }
  return null;
}

/**
 * Cache a verse lookup result.
 */
function cacheVerse(reference, translation, data) {
  const key = `${reference.toLowerCase()}|${translation}`;

  // Evict oldest if at capacity
  if (verseCache.size >= CACHE_MAX_SIZE) {
    const firstKey = verseCache.keys().next().value;
    verseCache.delete(firstKey);
  }

  verseCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get cached cross-references or null if not found/expired.
 */
function getCachedCrossRefs(reference) {
  const key = reference.toLowerCase();
  const cached = crossRefCache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    console.log(`[api] Cache hit for cross-refs: ${reference}`);
    return cached.data;
  }
  return null;
}

/**
 * Cache cross-references.
 */
function cacheCrossRefs(reference, data) {
  const key = reference.toLowerCase();

  // Evict oldest if at capacity
  if (crossRefCache.size >= CACHE_MAX_SIZE) {
    const firstKey = crossRefCache.keys().next().value;
    crossRefCache.delete(firstKey);
  }

  crossRefCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get cache stats for debugging.
 */
export function getCacheStats() {
  return {
    verseCount: verseCache.size,
    crossRefCount: crossRefCache.size,
    maxSize: CACHE_MAX_SIZE,
    ttlMinutes: CACHE_TTL_MS / 60000
  };
}

/**
 * Clear all caches.
 */
export function clearCaches() {
  verseCache.clear();
  crossRefCache.clear();
  console.log('[api] Caches cleared');
}

// ============================================================
// RATE LIMIT HANDLING (Exponential Backoff)
// ============================================================

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000; // 1 second
const MAX_BACKOFF_MS = 32000;    // 32 seconds

/**
 * Fetch with exponential backoff retry for rate limits (429 errors).
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @param {number} retries - Current retry count
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options, retries = 0) {
  const response = await fetch(url, options);

  // If rate limited (429), retry with exponential backoff
  if (response.status === 429 && retries < MAX_RETRIES) {
    const backoffMs = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, retries), MAX_BACKOFF_MS);
    // Add jitter (0-500ms random) to prevent thundering herd
    const jitter = Math.random() * 500;
    const waitTime = backoffMs + jitter;

    console.warn(`[api] Rate limited (429). Retry ${retries + 1}/${MAX_RETRIES} after ${Math.round(waitTime)}ms`);

    await new Promise(resolve => setTimeout(resolve, waitTime));
    return fetchWithRetry(url, options, retries + 1);
  }

  return response;
}

// ============================================================
// SETTINGS HELPERS
// ============================================================

async function getApiKey() {
  const settings = await chrome.storage.local.get([`${APP_SLUG}_settings`]);
  return settings[`${APP_SLUG}_settings`]?.apiKey || null;
}

async function getBibleApiKey() {
  const settings = await chrome.storage.local.get([`${APP_SLUG}_settings`]);
  return settings[`${APP_SLUG}_settings`]?.bibleApiKey || null;
}

// ============================================================
// GEMINI AI API
// ============================================================

/**
 * Analyze text with Gemini.
 * @param {string} text - Text to analyze
 * @param {string} analysisType - 'key_points', 'themes', 'summary', 'cross_refs'
 * @returns {Promise<string>}
 */
export async function analyzeText(text, analysisType = 'key_points') {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add it in Settings.');
  }

  // Select prompt based on analysis type
  let prompt;
  switch (analysisType) {
    case 'key_points':
      prompt = AI_CONFIG.PROMPTS.KEY_POINTS;
      break;
    case 'themes':
      prompt = AI_CONFIG.PROMPTS.THEMES;
      break;
    case 'cross_refs':
      prompt = AI_CONFIG.PROMPTS.CROSS_REFS;
      break;
    case 'verse_context':
      prompt = AI_CONFIG.PROMPTS.VERSE_CONTEXT;
      break;
    default:
      prompt = 'Summarize the following content:';
  }

  // Truncate if too long
  const truncatedText = text.length > AI_CONFIG.MAX_CONTENT_CHARS
    ? text.substring(0, AI_CONFIG.MAX_CONTENT_CHARS) + '...[truncated]'
    : text;

  const requestBody = {
    contents: [{
      parts: [{
        text: `${prompt}\n\n${truncatedText}`
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  };

  const response = await fetchWithRetry(
    `${API_ENDPOINTS.GEMINI_BASE}/models/${AI_CONFIG.GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API request failed');
  }

  const result = await response.json();

  // Track token usage
  trackTokenUsage(result);

  const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error('No response generated from Gemini');
  }

  return generatedText;
}

/**
 * Analyze an image with Gemini Vision.
 * @param {string} imageData - Base64 encoded image (data URL or raw base64)
 * @returns {Promise<Object>}
 */
export async function analyzeImage(imageData) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add it in Settings.');
  }

  // Extract base64 data if it's a data URL
  let base64Data = imageData;
  let mimeType = 'image/png';

  if (imageData.startsWith('data:')) {
    const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      base64Data = matches[2];
    }
  }

  const requestBody = {
    contents: [{
      parts: [
        {
          text: 'Analyze this image and provide: 1) A brief description, 2) Any text/diagrams/charts you can identify, 3) Key observations relevant to Bible study or sermon notes.'
        },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024
    }
  };

  const response = await fetchWithRetry(
    `${API_ENDPOINTS.GEMINI_BASE}/models/${AI_CONFIG.GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini Vision API request failed');
  }

  const result = await response.json();

  // Track token usage
  trackTokenUsage(result);

  const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error('No analysis generated from Gemini Vision');
  }

  return {
    description: generatedText,
    analyzedAt: new Date().toISOString()
  };
}

// ============================================================
// BIBLE API (API.Bible)
// ============================================================

// Bible IDs for API.Bible (free tier)
const BIBLE_IDS = {
  'KJV': 'de4e12af7f28f599-02',  // King James Version
  'ASV': '06125adad2d5898a-01',  // American Standard Version
  'WEB': '9879dbb7cfe39e4d-04',  // World English Bible
  'BBE': '65eec8e0b60e656b-01',  // Bible in Basic English
  'DARBY': '478b6f362720ff76-01' // Darby Translation
};

// Book name to API.Bible book ID mapping
const BOOK_IDS = {
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM', 'Deuteronomy': 'DEU',
  'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
  '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH',
  'Ezra': 'EZR', 'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB',
  'Psalms': 'PSA', 'Psalm': 'PSA', 'Proverbs': 'PRO', 'Ecclesiastes': 'ECC',
  'Song of Solomon': 'SNG', 'Song of Songs': 'SNG',
  'Isaiah': 'ISA', 'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN',
  'Hosea': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON', 'Micah': 'MIC',
  'Nahum': 'NAM', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP', 'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
  'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT',
  'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO', 'Galatians': 'GAL', 'Ephesians': 'EPH',
  'Philippians': 'PHP', 'Colossians': 'COL', '1 Thessalonians': '1TH', '2 Thessalonians': '2TH',
  '1 Timothy': '1TI', '2 Timothy': '2TI', 'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB',
  'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN', '3 John': '3JN',
  'Jude': 'JUD', 'Revelation': 'REV'
};

/**
 * Look up a Bible verse using Gemini AI.
 * KISS approach: Gemini knows the Bible, no need for separate Bible API.
 *
 * @param {string} reference - Verse reference (e.g., "John 3:16", "Romans 8:28-30")
 * @param {string} translation - Translation code (e.g., "KJV", "ESV", "NIV")
 * @returns {Promise<Object>}
 */
export async function lookupVerse(reference, translation = 'KJV') {
  // Check cache first
  const cached = getCachedVerse(reference, translation);
  if (cached) {
    return cached;
  }

  const apiKey = await getApiKey();

  // Parse the reference
  const parsed = parseVerseReference(reference);
  if (!parsed) {
    throw new Error(`Could not parse verse reference: ${reference}`);
  }

  // If no Gemini API key, return helpful message
  if (!apiKey) {
    return {
      reference: reference,
      book: parsed.book,
      chapter: parsed.chapter,
      verse: parsed.verse,
      verseEnd: parsed.verseEnd,
      translation: translation,
      text: `Add your Gemini API key in Settings to see verse text.`,
      copyright: null,
      lookedUpAt: new Date().toISOString(),
      noApiKey: true
    };
  }

  try {
    const prompt = `Quote the exact text of ${reference} from the ${translation} Bible translation.
Return ONLY the verse text, nothing else - no verse numbers, no commentary, no quotation marks.
If this is a verse range, include all verses in the range.`;

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1, // Very low for accuracy
        maxOutputTokens: 512
      }
    };

    const response = await fetchWithRetry(
      `${API_ENDPOINTS.GEMINI_BASE}/models/${AI_CONFIG.GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to lookup verse');
    }

    const result = await response.json();

    // Track token usage
    trackTokenUsage(result);

    const verseText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!verseText) {
      throw new Error(`Could not retrieve verse text for ${reference}`);
    }

    const verseData = {
      reference: reference,
      book: parsed.book,
      chapter: parsed.chapter,
      verse: parsed.verse,
      verseEnd: parsed.verseEnd,
      translation: translation,
      text: verseText,
      copyright: translation === 'KJV' ? 'Public Domain' : `${translation} - via AI lookup`,
      lookedUpAt: new Date().toISOString()
    };

    // Cache the result
    cacheVerse(reference, translation, verseData);

    return verseData;
  } catch (error) {
    console.error('[api] Verse lookup error:', error);
    throw error;
  }
}

/**
 * Get cross-references for a verse.
 * Uses Gemini AI to suggest related verses thematically.
 * @param {string} reference - Verse reference
 * @returns {Promise<Array>}
 */
export async function getCrossRefs(reference) {
  // Check cache first
  const cached = getCachedCrossRefs(reference);
  if (cached) {
    return cached;
  }

  const parsed = parseVerseReference(reference);
  if (!parsed) {
    throw new Error(`Could not parse verse reference: ${reference}`);
  }

  // Try to use Gemini to generate cross-references
  const apiKey = await getApiKey();
  if (!apiKey) {
    // Return empty if no Gemini API key
    return [];
  }

  try {
    const prompt = `List 3-5 Bible verses that are closely related to ${reference} thematically or contextually. Return ONLY the verse references, one per line, no explanations. Example format:
John 1:1
Romans 8:28
Isaiah 40:31`;

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 256
      }
    };

    const response = await fetchWithRetry(
      `${API_ENDPOINTS.GEMINI_BASE}/models/${AI_CONFIG.GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      console.error('[api] Cross-refs Gemini error:', response.status);
      return [];
    }

    const result = await response.json();

    // Track token usage
    trackTokenUsage(result);

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse the response into references
    const lines = text.split('\n').filter(line => line.trim());
    const refs = lines
      .map(line => line.trim())
      .filter(line => {
        // Basic validation - should look like a verse reference
        return /^\d?\s*[A-Za-z]+/.test(line) && /\d+:\d+/.test(line);
      })
      .slice(0, 5) // Max 5
      .map(ref => ({ reference: ref, relationship: 'thematic' }));

    // Cache the result
    cacheCrossRefs(reference, refs);

    return refs;
  } catch (error) {
    console.error('[api] Cross-refs error:', error);
    return [];
  }
}

/**
 * Get list of available translations.
 * @returns {Array} - Array of translation objects
 */
export function getAvailableTranslations() {
  return Object.keys(BIBLE_IDS).map(code => ({
    code,
    name: getTranslationName(code)
  }));
}

function getTranslationName(code) {
  const names = {
    'KJV': 'King James Version',
    'ASV': 'American Standard Version',
    'WEB': 'World English Bible',
    'BBE': 'Bible in Basic English',
    'DARBY': 'Darby Translation'
  };
  return names[code] || code;
}

/**
 * Parse a verse reference into components.
 * @param {string} reference - e.g., "John 3:16", "1 Corinthians 13:4-7"
 * @returns {Object|null}
 */
function parseVerseReference(reference) {
  // Pattern: Book Chapter:Verse (or Verse-Verse)
  const pattern = /^(\d?\s*[A-Za-z]+(?:\s+[A-Za-z]+)?)\s*(\d+):(\d+)(?:-(\d+))?$/;
  const match = reference.trim().match(pattern);

  if (!match) {
    return null;
  }

  return {
    book: match[1].trim(),
    chapter: parseInt(match[2], 10),
    verse: parseInt(match[3], 10),
    verseEnd: match[4] ? parseInt(match[4], 10) : null
  };
}

// ============================================================
// SEMANTIC VERSE DETECTION (AI-Powered)
// ============================================================

/**
 * Detect Bible verses in text using AI semantic analysis.
 * Unlike regex detection, this recognizes verse CONTENT, not just references.
 * E.g., "For God so loved the world..." → John 3:16
 *
 * @param {string} text - Text to analyze
 * @returns {Promise<Array>} Array of detected verses with references
 */
export async function detectVersesWithAI(text) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    console.log('[api] No Gemini API key - skipping semantic verse detection');
    return [];
  }

  if (!text || text.length < 20) {
    return [];
  }

  // Truncate very long text to avoid excessive token usage
  const truncatedText = text.length > 10000
    ? text.substring(0, 10000) + '...[truncated]'
    : text;

  const prompt = `Analyze this text and identify any Bible verses it contains or quotes. Look for:
1. Direct quotes from Scripture (even partial)
2. Clear allusions or paraphrases of specific verses
3. Any explicit verse references (like "John 3:16")

For each verse found, provide the reference. If a phrase is a direct quote or clear allusion to a known verse, include it.

Return your response as a JSON array of objects. Each object should have:
- "reference": the verse reference (e.g., "John 3:16")
- "type": either "explicit" (reference mentioned in text), "quote" (direct quote), or "allusion" (paraphrase/allusion)
- "confidence": "high", "medium", or "low"
- "matchedText": the phrase from the input that matches this verse (keep it short, max 100 chars)

If no verses are found, return an empty array: []

IMPORTANT: Only return valid JSON, no markdown formatting, no explanation text.

Text to analyze:
${truncatedText}`;

  try {
    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.2, // Low temp for more precise detection
        maxOutputTokens: 1024
      }
    };

    const response = await fetchWithRetry(
      `${API_ENDPOINTS.GEMINI_BASE}/models/${AI_CONFIG.GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      console.error('[api] Semantic verse detection error:', response.status);
      return [];
    }

    const result = await response.json();

    // Track token usage
    trackTokenUsage(result);

    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON response (handle potential markdown code blocks)
    let verses = [];
    try {
      // Remove markdown code block if present
      let jsonStr = rawText.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      verses = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[api] Failed to parse verse detection response:', parseError);
      console.log('[api] Raw response:', rawText);
      return [];
    }

    // Validate and clean results
    if (!Array.isArray(verses)) {
      return [];
    }

    return verses
      .filter(v => v.reference && typeof v.reference === 'string')
      .map(v => ({
        reference: v.reference.trim(),
        type: v.type || 'detected',
        confidence: v.confidence || 'medium',
        matchedText: v.matchedText?.substring(0, 100) || '',
        detectedAt: new Date().toISOString(),
        method: 'semantic'
      }));

  } catch (error) {
    console.error('[api] Semantic verse detection error:', error);
    return [];
  }
}

// ============================================================
// YOUTUBE TRANSCRIPT (TR-06)
// ============================================================

/**
 * Extract transcript from a YouTube video.
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Array>}
 */
export async function extractYouTubeTranscript(videoId) {
  // This is a placeholder for the TR-06 YouTube Transcript Engine
  // Full implementation would fetch captions from YouTube's timedtext API

  throw new Error('YouTube transcript extraction not yet implemented. Coming in Phase 3.');
}
