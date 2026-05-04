/**
 * ClipBoard AI Proxy — 864zeros
 *
 * Cloudflare Worker that proxies AI requests to Gemini/Claude.
 * Keeps API keys secure on the server side.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Validate origin (Chrome extension)
    const origin = request.headers.get('Origin');
    if (!isAllowedOrigin(origin, env)) {
      return jsonResponse({ error: 'Unauthorized origin' }, 403);
    }

    // Route requests
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/ai/summarize':
          return await handleSummarize(request, env);
        case '/ai/auto-tag':
          return await handleAutoTag(request, env);
        case '/ai/vision':
          return await handleVision(request, env);
        case '/ai/chat':
          return await handleChat(request, env);
        case '/health':
          return jsonResponse({ status: 'ok', worker: 'clipboard-864z' });
        default:
          return jsonResponse({ error: 'Not found' }, 404);
      }
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  }
};

/**
 * CORS preflight handler
 */
function handleCORS(request, env) {
  const origin = request.headers.get('Origin');
  if (isAllowedOrigin(origin, env)) {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        ...CORS_HEADERS
      }
    });
  }
  return new Response(null, { status: 403 });
}

/**
 * Check if origin is allowed (Chrome extension or localhost for dev)
 */
function isAllowedOrigin(origin, env) {
  if (!origin) return false;

  // Allow configured extension origin
  if (origin === env.ALLOWED_ORIGIN) return true;

  // Allow any chrome-extension:// in development
  // Remove this in production if needed
  if (origin.startsWith('chrome-extension://')) return true;

  // Allow localhost for testing
  if (origin.startsWith('http://localhost')) return true;

  return false;
}

/**
 * Summarize text using Gemini
 */
async function handleSummarize(request, env) {
  const { text, maxLength = 150 } = await request.json();

  if (!text) {
    return jsonResponse({ error: 'Text is required' }, 400);
  }

  const prompt = `Summarize the following text in ${maxLength} words or less. Be concise and capture the key points:\n\n${text}`;

  const result = await callGemini(prompt, env);

  return jsonResponse({
    summary: result,
    model: 'gemini-2.0-flash'
  }, 200, request.headers.get('Origin'));
}

/**
 * Auto-generate tags using Gemini
 */
async function handleAutoTag(request, env) {
  const { text, existingTags = [] } = await request.json();

  if (!text) {
    return jsonResponse({ error: 'Text is required' }, 400);
  }

  const prompt = `Generate 3-5 relevant tags for the following content. Return ONLY a JSON array of lowercase tag strings, no explanation.
${existingTags.length > 0 ? `\nExisting tags to avoid duplicating: ${existingTags.join(', ')}` : ''}

Content:
${text}`;

  const result = await callGemini(prompt, env);

  // Parse tags from response
  let tags = [];
  try {
    // Try to extract JSON array from response
    const match = result.match(/\[[\s\S]*?\]/);
    if (match) {
      tags = JSON.parse(match[0]);
    }
  } catch (e) {
    // Fallback: split by comma/newline
    tags = result.split(/[,\n]/).map(t => t.trim().toLowerCase()).filter(Boolean);
  }

  return jsonResponse({
    tags,
    model: 'gemini-2.0-flash'
  }, 200, request.headers.get('Origin'));
}

/**
 * Vision/image analysis using Gemini
 */
async function handleVision(request, env) {
  const { imageBase64, prompt = 'Describe this image in detail.' } = await request.json();

  if (!imageBase64) {
    return jsonResponse({ error: 'Image is required' }, 400);
  }

  const result = await callGeminiVision(imageBase64, prompt, env);

  return jsonResponse({
    description: result,
    model: 'gemini-2.0-flash'
  }, 200, request.headers.get('Origin'));
}

/**
 * General chat/question answering
 */
async function handleChat(request, env) {
  const { messages, context = '' } = await request.json();

  if (!messages || !messages.length) {
    return jsonResponse({ error: 'Messages are required' }, 400);
  }

  // Build prompt from messages
  let prompt = '';
  if (context) {
    prompt += `Context:\n${context}\n\n`;
  }

  for (const msg of messages) {
    if (msg.role === 'user') {
      prompt += `User: ${msg.content}\n`;
    } else if (msg.role === 'assistant') {
      prompt += `Assistant: ${msg.content}\n`;
    }
  }
  prompt += 'Assistant:';

  const result = await callGemini(prompt, env);

  return jsonResponse({
    response: result,
    model: 'gemini-2.0-flash'
  }, 200, request.headers.get('Origin'));
}

/**
 * Call Gemini API
 */
async function callGemini(prompt, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Call Gemini Vision API
 */
async function callGeminiVision(imageBase64, prompt, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Detect mime type from base64 header or default to jpeg
  let mimeType = 'image/jpeg';
  if (imageBase64.startsWith('data:')) {
    const match = imageBase64.match(/data:([^;]+);/);
    if (match) mimeType = match[1];
    // Remove data URL prefix
    imageBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini Vision API error:', error);
    throw new Error(`Gemini Vision API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * JSON response helper
 */
function jsonResponse(data, status = 200, origin = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...CORS_HEADERS
  };

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return new Response(JSON.stringify(data), { status, headers });
}
