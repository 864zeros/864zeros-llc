/**
 * AI Client — ClipBoard
 *
 * Calls the 864zeros AI proxy worker.
 * No API keys stored client-side.
 */

// Worker URL
const WORKER_URL = 'https://clipboard-864z.864zeros.workers.dev';

// For local development with wrangler dev
const DEV_WORKER_URL = 'http://localhost:8787';

// Set to true during local worker development
const USE_DEV_WORKER = false;

function getWorkerUrl() {
  return USE_DEV_WORKER ? DEV_WORKER_URL : WORKER_URL;
}

/**
 * Summarize text using AI.
 * @param {string} text - Text to summarize
 * @param {number} maxLength - Max words in summary
 * @returns {Promise<{summary: string, model: string}>}
 */
export async function summarize(text, maxLength = 150) {
  const response = await fetch(`${getWorkerUrl()}/ai/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, maxLength })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `AI request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Auto-generate tags for content.
 * @param {string} text - Content to tag
 * @param {string[]} existingTags - Tags to avoid duplicating
 * @returns {Promise<{tags: string[], model: string}>}
 */
export async function autoTag(text, existingTags = []) {
  const response = await fetch(`${getWorkerUrl()}/ai/auto-tag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, existingTags })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `AI request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Analyze an image using AI vision.
 * @param {string} imageBase64 - Base64-encoded image (with or without data URL prefix)
 * @param {string} prompt - What to analyze
 * @returns {Promise<{description: string, model: string}>}
 */
export async function analyzeImage(imageBase64, prompt = 'Describe this image in detail.') {
  const response = await fetch(`${getWorkerUrl()}/ai/vision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, prompt })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `AI request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Chat/ask questions with optional context.
 * @param {Array<{role: string, content: string}>} messages - Chat messages
 * @param {string} context - Optional context (e.g., clip content)
 * @returns {Promise<{response: string, model: string}>}
 */
export async function chat(messages, context = '') {
  const response = await fetch(`${getWorkerUrl()}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `AI request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Check if AI service is available.
 * @returns {Promise<boolean>}
 */
export async function isAvailable() {
  try {
    const response = await fetch(`${getWorkerUrl()}/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch {
    return false;
  }
}
