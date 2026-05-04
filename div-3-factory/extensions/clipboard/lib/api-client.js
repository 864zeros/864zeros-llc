// ============================================================
// API-CLIENT.JS — AI Provider Abstraction
// Model-agnostic interface for AI calls.
// ============================================================

import { AI_CONFIG, APP_SLUG } from './constants.js';
import { redact } from './redactor.js';

let config = { ...AI_CONFIG };
let apiKey = null;

// Session token tracking
let sessionTokens = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  calls: 0
};

/**
 * Configure the AI provider.
 * @param {object} options - { provider, apiKey, model, options }
 */
export function configure(options) {
  config = { ...config, ...options };
  if (options.apiKey) {
    apiKey = options.apiKey;
  }
}

/**
 * Load API key from storage if not already set.
 */
async function ensureApiKey() {
  if (apiKey) return true;

  try {
    const result = await chrome.storage.local.get(`${APP_SLUG}_ai_api_key`);
    apiKey = result[`${APP_SLUG}_ai_api_key`];
    return !!apiKey;
  } catch {
    return false;
  }
}

/**
 * Send content to AI for analysis.
 * @param {string} content - Content to analyze (will be auto-redacted)
 * @param {string} instruction - Analysis instruction
 * @returns {Promise<object>} - { success, result, usage }
 */
export async function analyze(content, instruction) {
  try {
    // Auto-redact PPI before sending
    const { redactedText } = redact(content);

    // Route to active provider
    if (config.provider === 'gemini') {
      return await callGemini(redactedText, instruction);
    } else if (config.provider === 'claude') {
      return await callClaude(redactedText, instruction);
    }

    return { success: false, error: 'unknown_provider' };
  } catch (error) {
    return { success: false, error: 'unknown', message: error.message };
  }
}

/**
 * Analyze an image with AI vision.
 * @param {string} base64Image - Base64-encoded image (data URL or raw base64)
 * @param {string} instruction - Analysis instruction
 * @returns {Promise<object>} - { success, result }
 */
export async function analyzeImage(base64Image, instruction) {
  try {
    if (config.provider === 'gemini') {
      return await callGeminiVision(base64Image, instruction);
    }
    return { success: false, error: 'vision_not_supported' };
  } catch (error) {
    return { success: false, error: 'unknown', message: error.message };
  }
}

/**
 * Summarize multiple content items.
 * @param {array} contentArray - Array of content strings
 * @param {object} options - { format, maxLength }
 * @returns {Promise<object>} - { success, result }
 */
export async function summarize(contentArray, options = {}) {
  const combined = contentArray.join('\n\n---\n\n');
  const instruction = options.format === 'keypoints'
    ? 'Extract the main key points from the following content:'
    : 'Summarize the following content concisely:';

  return analyze(combined, instruction);
}

/**
 * Get current provider info.
 * @returns {object} - { provider, model, sessionUsage }
 */
export function getProviderInfo() {
  return {
    provider: config.provider,
    model: config.model,
    sessionUsage: { ...sessionTokens }
  };
}

/**
 * Get session token usage.
 * @returns {object} - { promptTokens, completionTokens, totalTokens, calls }
 */
export function getTokenUsage() {
  return { ...sessionTokens };
}

/**
 * Reset session token counters.
 */
export function resetTokenUsage() {
  sessionTokens = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    calls: 0
  };
}

// --- Internal Provider Calls ---

async function callGemini(content, instruction) {
  const hasKey = await ensureApiKey();
  if (!hasKey) {
    return { success: false, error: 'no_api_key', message: 'API key not configured. Set it in Options.' };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [{
        text: `${instruction}\n\n${content}`
      }]
    }],
    generationConfig: {
      maxOutputTokens: config.maxTokens,
      temperature: config.temperature
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        return { success: false, error: 'auth_failed', message: 'Invalid API key' };
      }
      if (response.status === 429) {
        return { success: false, error: 'rate_limited', message: 'Rate limit exceeded. Try again later.' };
      }

      return {
        success: false,
        error: 'api_error',
        message: errorData.error?.message || `API error: ${response.status}`
      };
    }

    const data = await response.json();

    // Extract text from Gemini response
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      return { success: false, error: 'empty_response', message: 'AI returned no content' };
    }

    // Track session tokens
    const promptTokens = data.usageMetadata?.promptTokenCount || 0;
    const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;
    sessionTokens.promptTokens += promptTokens;
    sessionTokens.completionTokens += completionTokens;
    sessionTokens.totalTokens += promptTokens + completionTokens;
    sessionTokens.calls += 1;

    return {
      success: true,
      result: resultText.trim(),
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      }
    };
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return { success: false, error: 'offline', message: 'No internet connection' };
    }
    return { success: false, error: 'unknown', message: error.message };
  }
}

async function callGeminiVision(base64Image, instruction) {
  const hasKey = await ensureApiKey();
  if (!hasKey) {
    return { success: false, error: 'no_api_key', message: 'API key not configured' };
  }

  // Extract base64 data from data URL if needed
  let imageData = base64Image;
  let mimeType = 'image/png';

  if (base64Image.startsWith('data:')) {
    const match = base64Image.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      imageData = match[2];
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [
        { text: instruction },
        {
          inlineData: {
            mimeType: mimeType,
            data: imageData
          }
        }
      ]
    }],
    generationConfig: {
      maxOutputTokens: config.maxTokens,
      temperature: config.temperature
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: 'api_error',
        message: errorData.error?.message || `API error: ${response.status}`
      };
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      return { success: false, error: 'empty_response', message: 'AI returned no content' };
    }

    // Track session tokens
    const promptTokens = data.usageMetadata?.promptTokenCount || 0;
    const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;
    sessionTokens.promptTokens += promptTokens;
    sessionTokens.completionTokens += completionTokens;
    sessionTokens.totalTokens += promptTokens + completionTokens;
    sessionTokens.calls += 1;

    return {
      success: true,
      result: resultText.trim(),
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      }
    };
  } catch (error) {
    return { success: false, error: 'unknown', message: error.message };
  }
}

async function callClaude(content, instruction) {
  // Claude API implementation for future use
  return { success: false, error: 'not_implemented', message: 'Claude API not yet configured' };
}
