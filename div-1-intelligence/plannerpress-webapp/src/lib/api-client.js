// ============================================================
// api-client.js — AI Provider Abstraction for PlannerPress
// ============================================================

import { AI_CONFIG } from './constants.js';

// --- PPI Redaction (simplified for web app context, full redactor in dedicated module if needed) ---
function redactPPI(text) {
  // In a web app, PPI redaction might happen server-side or be handled differently.
  // For now, this is a placeholder. Full redactor from 864z-build-kit/lib/redactor.js would be used in a robust impl.
  return text;
}

// --- AI API Call (Text) ---
export async function analyze(content, instruction, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY; // API Key from environment variables (server-side)
  if (!apiKey) {
    return { success: false, error: 'api_key_not_configured', message: 'AI API key not configured' };
  }

  const redactedContent = redactPPI(content);
  const prompt = `${redactedContent}

${instruction}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: options.maxTokens || AI_CONFIG.maxTokens,
            temperature: options.temperature || AI_CONFIG.temperature,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 429) {
        return { success: false, error: 'rate_limited', message: 'AI API rate limit exceeded. Please try again later.' };
      }
      return { success: false, error: 'api_request_failed', message: errorData.error?.message || 'AI API request failed' };
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { success: true, result: resultText, usage: { tokens: data.usageMetadata?.totalTokenCount || 0 } };
  } catch (error) {
    console.error('AI API call error:', error);
    // Differentiate network error from other errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return { success: false, error: 'offline', message: 'Network error. Please check your internet connection.' };
    }
    return { success: false, error: 'unknown', message: error.message };
  }
}

export function configure({ provider, apiKey, model, options }) {
  // For a web app, API key is typically handled server-side via environment variables.
  // This function would be more relevant for client-side configuration in extensions.
  console.warn('configure API client called in web app context. API key should be set via environment variables.');
}

export function getProviderInfo() {
  return { provider: AI_CONFIG.provider, model: AI_CONFIG.model, sessionUsage: 0 }; // Session usage not tracked client-side
}

// analyzeImage and summarize would be implemented here if needed, following a similar pattern.
