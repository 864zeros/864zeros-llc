# ClipBoard AI Proxy — 864zeros

Cloudflare Worker that proxies AI requests for the ClipBoard extension.

## Why a Proxy?

Chrome extensions are client-side code. Embedding API keys in extension code exposes them to anyone who installs the extension. This worker holds API keys securely server-side.

## Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### 2. Add API Key Secret

```bash
cd workers/clipboard-864z
wrangler secret put GEMINI_API_KEY
# Paste your Gemini API key when prompted
```

### 3. Deploy

```bash
wrangler deploy
```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ai/summarize` | POST | Summarize text |
| `/ai/auto-tag` | POST | Generate tags for content |
| `/ai/vision` | POST | Analyze images |
| `/ai/chat` | POST | General Q&A |
| `/health` | POST | Health check |

### Example: Summarize

```javascript
const response = await fetch('https://clipboard-864z.864zeros.workers.dev/ai/summarize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Long article text here...',
    maxLength: 150
  })
});

const { summary } = await response.json();
```

### Example: Auto-Tag

```javascript
const response = await fetch('https://clipboard-864z.864zeros.workers.dev/ai/auto-tag', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Article about JavaScript frameworks...',
    existingTags: ['web']
  })
});

const { tags } = await response.json();
// ['javascript', 'frameworks', 'frontend']
```

### Example: Vision

```javascript
const response = await fetch('https://clipboard-864z.864zeros.workers.dev/ai/vision', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageBase64: 'data:image/jpeg;base64,...',
    prompt: 'What is in this image?'
  })
});

const { description } = await response.json();
```

## Security

- **Origin validation**: Only allows requests from the Chrome extension
- **CORS headers**: Configured for extension origin
- **API keys**: Stored as Cloudflare secrets (never in code)

## Development

### Local testing

```bash
wrangler dev
```

### View logs

```bash
wrangler tail
```

## Configuration

Edit `wrangler.toml`:

```toml
[vars]
ALLOWED_ORIGIN = "chrome-extension://YOUR_EXTENSION_ID"
```

## Costs

Cloudflare Workers free tier:
- 100,000 requests/day
- 10ms CPU time per request

This is plenty for a Chrome extension with reasonable usage.
