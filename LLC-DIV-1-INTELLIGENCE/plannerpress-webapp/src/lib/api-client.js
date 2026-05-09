/**
 * 864zeros Core — api-client.js
 * AI Provider Abstraction with Auto-Redaction, Vision support, and Token Tracking.
 * Supports Gemini and Claude.
 * Implements BRK-AI-001
 */

import { redact } from './redactor.js';

let config = {
  provider: 'gemini',
  apiKey: null,
  model: 'gemini-1.5-flash',
  options: {
    maxTokens: 1000,
    temperature: 0.7,
    systemPrompt: 'You are a helpful assistant.'
  }
};

// Session token tracking
let sessionUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  calls: 0
};

/**
 * Configure the active AI provider
 * @param {Object} newConfig 
 */
export function configure(newConfig) {
  config = { ...config, ...newConfig, options: { ...config.options, ...newConfig.options } };
  if (newConfig.apiKey) config.apiKey = newConfig.apiKey;
}

/**
 * Send content + instruction to active AI provider
 * @param {string} content 
 * @param {string} instruction 
 * @returns {Promise<Object>} { success, result, usage, error }
 */
export async function analyze(content, instruction) {
  if (!config.apiKey) {
    // Try to load from chrome storage if in extension context
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const storageKey = `${config.appSlug || '864z'}_ai_api_key`;
      const result = await chrome.storage.local.get(storageKey);
      config.apiKey = result[storageKey];
    }
  }

  if (!config.apiKey) {
    return { success: false, error: 'auth_failed', message: 'API Key not configured' };
  }

  // 1. Redact PPI
  const { redactedText } = redact(content);

  try {
    if (config.provider === 'gemini') {
      return await callGemini(redactedText, instruction);
    } else if (config.provider === 'claude') {
      return await callClaude(redactedText, instruction);
    } else {
      return { success: false, error: 'unknown_provider' };
    }
  } catch (error) {
    console.error(`[api-client] ${config.provider} error:`, error);
    return { 
      success: false, 
      error: error.name === 'AbortError' ? 'timeout' : 'unknown', 
      message: error.message 
    };
  }
}

/**
 * Analyze an image with AI vision (Gemini only for now)
 */
export async function analyzeImage(base64Image, instruction) {
  if (!config.apiKey) return { success: false, error: 'auth_failed' };
  
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
 * Summarize multiple content items
 */
export async function summarize(contentArray, options = {}) {
  const combined = contentArray.join('\n\n---\n\n');
  const instruction = options.format === 'keypoints'
    ? 'Extract the main key points from the following content:'
    : 'Summarize the following content concisely:';

  return analyze(combined, instruction);
}

/**
 * Gemini API call
 */
async function callGemini(content, instruction) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
  const prompt = `${instruction}\n\n${content}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: config.options.maxTokens,
        temperature: config.options.temperature
      },
      system_instruction: config.options.systemPrompt ? {
        parts: [{ text: config.options.systemPrompt }]
      } : undefined
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  const usage = {
    promptTokens: data.usageMetadata?.promptTokenCount || 0,
    completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
    totalTokens: data.usageMetadata?.totalTokenCount || 0
  };

  updateUsage(usage);

  return { success: true, result: result.trim(), usage };
}

/**
 * Gemini Vision API call
 */
async function callGeminiVision(base64Image, instruction) {
  let imageData = base64Image;
  let mimeType = 'image/png';

  if (base64Image.startsWith('data:')) {
    const match = base64Image.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      imageData = match[2];
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: instruction },
          { inlineData: { mimeType, data: imageData } }
        ]
      }],
      generationConfig: {
        maxOutputTokens: config.options.maxTokens,
        temperature: config.options.temperature
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  const usage = {
    promptTokens: data.usageMetadata?.promptTokenCount || 0,
    completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
    totalTokens: data.usageMetadata?.totalTokenCount || 0
  };

  updateUsage(usage);

  return { success: true, result: result.trim(), usage };
}

/**
 * Claude API call
 */
async function callClaude(content, instruction) {
  const url = 'https://api.anthropic.com/v1/messages';
  const prompt = `${instruction}\n\n${content}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'dangerously-allow-browser': 'true'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.options.maxTokens,
      temperature: config.options.temperature,
      system: config.options.systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const result = data.content?.[0]?.text || '';
  
  const usage = {
    promptTokens: data.usage?.input_tokens || 0,
    completionTokens: data.usage?.output_tokens || 0,
    totalTokens: (data.usage?.input_tokens + data.usage?.output_tokens) || 0
  };

  updateUsage(usage);

  return { success: true, result: result.trim(), usage };
}

function updateUsage(usage) {
  sessionUsage.promptTokens += usage.promptTokens;
  sessionUsage.completionTokens += usage.completionTokens;
  sessionUsage.totalTokens += usage.totalTokens;
  sessionUsage.calls += 1;
}

export function getProviderInfo() {
  return { provider: config.provider, model: config.model, sessionUsage: { ...sessionUsage } };
}

export function resetUsage() {
  sessionUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, calls: 0 };
}
