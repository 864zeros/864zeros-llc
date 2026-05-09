/**
 * LLM Client
 * Supports Anthropic Claude and OpenAI GPT APIs
 * Auto-detects which API key is available
 */

/**
 * Detect which LLM provider is configured
 */
export function detectProvider() {
  if (process.env.ANTHROPIC_API_KEY) {
    return 'anthropic';
  }
  if (process.env.OPENAI_API_KEY) {
    return 'openai';
  }
  return null;
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(systemPrompt, messages) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Call OpenAI GPT API
 */
async function callOpenAI(systemPrompt, messages) {
  const apiKey = process.env.OPENAI_API_KEY;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Send message to LLM
 * @param {string} systemPrompt - System prompt (persona + KB)
 * @param {Array} messages - Conversation history [{role, content}]
 * @param {string} provider - 'anthropic' or 'openai' (auto-detected if null)
 * @returns {Promise<string>} LLM response
 */
export async function chat(systemPrompt, messages, provider = null) {
  provider = provider || detectProvider();

  if (!provider) {
    throw new Error('No LLM API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env');
  }

  if (provider === 'anthropic') {
    return callAnthropic(systemPrompt, messages);
  } else if (provider === 'openai') {
    return callOpenAI(systemPrompt, messages);
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }
}
