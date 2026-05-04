// ============================================================
// AI FEATURE SCAFFOLD
// Template for implementing AI-powered features with Gemini.
// Includes PPI redaction, API key handling, and error states.
// ============================================================
//
// USAGE:
// 1. Copy relevant sections to your files
// 2. Replace all [PLACEHOLDERS] with actual values
// 3. Delete these instruction comments
//
// ============================================================


// ============================================================
// STEP 1: Add to lib/constants.js
// ============================================================

// Add to MESSAGE_TYPES:
export const MESSAGE_TYPES = {
  // ... existing ...
  [AI_FEATURE_NAME]: '[AI_FEATURE_NAME]',
};

// Add to FEATURE_TIERS:
export const FEATURE_TIERS = {
  // ... existing ...
  '[ai-feature-id]': '[tier]', // Usually starter or pro
};

// AI config (should already exist):
export const AI_CONFIG = {
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  maxTokens: 1000,
  temperature: 0.7
};


// ============================================================
// STEP 2: API Client (lib/api-client.js)
// ============================================================

import { AI_CONFIG, APP_SLUG } from './constants.js';

// --- PPI Redaction ---
const PPI_PATTERNS = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE]' },
  { pattern: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, replacement: '[SSN]' },
  { pattern: /\b\d{16}\b/g, replacement: '[CARD]' },
  { pattern: /\b\d{1,5}\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way|place|pl)\b/gi, replacement: '[ADDRESS]' },
];

function redactPPI(text) {
  if (!text) return text;
  let redacted = text;
  for (const { pattern, replacement } of PPI_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}

// --- API Key Management ---
async function getApiKey() {
  const result = await chrome.storage.local.get(`${APP_SLUG}_ai_api_key`);
  return result[`${APP_SLUG}_ai_api_key`] || null;
}

// --- Gemini API Call (Text) ---
async function callGemini(prompt, options = {}) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('API key not configured');
  }

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
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// --- Gemini API Call (Vision) ---
async function callGeminiVision(prompt, imageBase64, mimeType = 'image/png') {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  // Remove data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Data } }
          ]
        }],
        generationConfig: {
          maxOutputTokens: AI_CONFIG.maxTokens,
          temperature: AI_CONFIG.temperature,
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Vision API request failed');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// --- Your AI Feature Method ---
export async function [aiFeatureMethod](input) {
  // 1. Redact PPI from input
  const safeInput = redactPPI(input);

  // 2. Build prompt
  const prompt = `[Your prompt template here]

Content:
${safeInput}

[Instructions for AI response format]`;

  // 3. Call API
  const response = await callGemini(prompt);

  // 4. Parse response (if structured output expected)
  // Example: Extract JSON from response
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // Fall back to raw response
  }

  return response;
}

// --- Vision Feature Method ---
export async function [visionFeatureMethod](imageBase64) {
  const prompt = `[Your vision prompt here]

Describe what you see in this image. Be concise and helpful.`;

  return await callGeminiVision(prompt, imageBase64);
}


// ============================================================
// STEP 3: Service Worker Handler (background/service-worker.js)
// ============================================================

import { [aiFeatureMethod] } from '../lib/api-client.js';

// Add case to message handler:
case MESSAGE_TYPES.[AI_FEATURE_NAME]:
  return handle[AiFeatureName](payload);

// Handler function:
async function handle[AiFeatureName](payload) {
  log('handle[AiFeatureName] called with:', payload);

  try {
    // 1. Check tier access
    const hasAccess = await getFeatureAccess('[ai-feature-id]');
    if (!hasAccess) {
      return { success: false, error: 'tier_required', requiredTier: '[tier]' };
    }

    // 2. Check API key
    const apiKey = await chrome.storage.local.get(`${APP_SLUG}_ai_api_key`);
    if (!apiKey[`${APP_SLUG}_ai_api_key`]) {
      return { success: false, error: 'api_key_required' };
    }

    // 3. Get the data to process
    const clip = await get('clips', payload.clipId);
    if (!clip) {
      return { success: false, error: 'Clip not found' };
    }

    // 4. Call the AI feature
    const result = await [aiFeatureMethod](clip.content);

    // 5. Optionally update the clip with results
    clip.[resultField] = result;
    clip.updatedAt = new Date().toISOString();
    await put('clips', clip);

    // 6. Return success
    return {
      success: true,
      result: result
    };

  } catch (error) {
    log('[AiFeatureName] error:', error);
    return { success: false, error: error.message };
  }
}


// ============================================================
// STEP 4: UI Trigger (sidepanel/main.js)
// ============================================================

// Add button to clip card (in renderClipCard function):
const aiButtonHtml = `
  <button class="clip-card__action clip-card__ai-action"
          data-clip-id="${clip.id}"
          title="[AI Feature Name]">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <!-- Your icon SVG path -->
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  </button>
`;

// Event delegation for AI button:
clipsContainer.addEventListener('click', async (e) => {
  const aiButton = e.target.closest('.clip-card__ai-action');
  if (aiButton) {
    const clipId = aiButton.dataset.clipId;
    await trigger[AiFeature](clipId, aiButton);
  }
});

// AI trigger function:
async function trigger[AiFeature](clipId, buttonElement) {
  // Show loading state
  const originalContent = buttonElement.innerHTML;
  buttonElement.innerHTML = '<span class="spinner"></span>';
  buttonElement.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.[AI_FEATURE_NAME],
      payload: { clipId }
    });

    if (response.success) {
      // Show result (update card, show toast, etc.)
      showToast('[Success message]');

      // Refresh the clip card to show new data
      loadClips();

    } else if (response.error === 'tier_required') {
      showUpgradePrompt('[ai-feature-id]', response.requiredTier);

    } else if (response.error === 'api_key_required') {
      showToast('Please configure your API key in Settings', 'error');
      // Optionally open options page:
      // chrome.runtime.openOptionsPage();

    } else {
      showToast(response.error || '[Error message]', 'error');
    }

  } catch (error) {
    console.error('[AiFeature] error:', error);
    showToast('[Error message]', 'error');

  } finally {
    // Restore button
    buttonElement.innerHTML = originalContent;
    buttonElement.disabled = false;
  }
}


// ============================================================
// STEP 5: Display AI Results in Card
// ============================================================

// Add result display section to clip card HTML:
function renderAiResult(clip) {
  if (!clip.[resultField]) return '';

  return `
    <div class="clip-card__ai-result">
      <div class="clip-card__ai-result-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>[AI Result Label]</span>
      </div>
      <div class="clip-card__ai-result-content">
        ${escapeHtml(clip.[resultField])}
      </div>
    </div>
  `;
}


// ============================================================
// STEP 6: Styles (sidepanel/styles.css)
// ============================================================

/*
.clip-card__ai-action {
  color: var(--oia-text-muted);
  transition: color 150ms ease;
}

.clip-card__ai-action:hover {
  color: var(--oia-sage);
}

.clip-card__ai-result {
  margin-top: 12px;
  padding: 12px;
  background-color: var(--oia-sage-light);
  border-radius: var(--oia-radius-sm);
  border-left: 3px solid var(--oia-sage);
}

.clip-card__ai-result-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--oia-size-body-sm);
  font-weight: var(--oia-weight-semibold);
  color: var(--oia-sage);
  margin-bottom: 8px;
}

.clip-card__ai-result-content {
  font-size: var(--oia-size-body-sm);
  color: var(--oia-text-secondary);
  line-height: 1.5;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--oia-text-muted);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
*/


// ============================================================
// PROMPT TEMPLATES
// ============================================================

// --- Summarization ---
const SUMMARIZE_PROMPT = `Summarize the following content in 2-3 concise sentences.
Focus on the key points and main ideas.

Content:
{content}

Summary:`;

// --- Auto-Tagging ---
const AUTO_TAG_PROMPT = `Analyze the following content and suggest 3-5 relevant tags.
Return ONLY a JSON array of tag strings, no explanation.
Tags should be lowercase, single words or short phrases.

Content:
{content}

Tags:`;

// --- Image Description ---
const VISION_PROMPT = `Describe what you see in this image in 2-3 sentences.
Focus on the main subject and any notable details.
Be concise and helpful.`;

// --- Sentiment Analysis ---
const SENTIMENT_PROMPT = `Analyze the sentiment of the following content.
Return one of: positive, negative, neutral, mixed
Also provide a confidence score from 0-100.

Content:
{content}

Response format: {"sentiment": "...", "confidence": ...}`;


// ============================================================
// TESTING CHECKLIST
// ============================================================
//
// [ ] Set tier to required level
// [ ] Configure API key in Options
// [ ] Test with text content
// [ ] Test with image content (if vision feature)
// [ ] Test PPI redaction (add email/phone to content)
// [ ] Test without API key (should show error)
// [ ] Test below required tier (should show upgrade prompt)
// [ ] Test loading state on button
// [ ] Test error handling (invalid API key, network error)
// [ ] Verify results display correctly in UI
//
