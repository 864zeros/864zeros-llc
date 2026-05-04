# Phase 5 — Proof

> **Why "Proof"?** Like mathematical proof (rigorous verification), proofing dough (final check before baking), or bulletproof (hardened, tested). This phase *proves* the build is ready to ship.

**Goal:** Every `/lib/` module unit tested. Service worker message handling integration tested. Manual QA checklist passed. Regression baseline saved. Nothing ships without this phase.

**Time estimate:** 45-90 minutes
**Prerequisite:** Phase 4 checkpoint passed.

---

## Test Stack

| Tool | Purpose | Install |
|------|---------|---------|
| **Vitest** | Unit + integration test runner | `npm i -D vitest` |
| **fake-indexeddb** | IndexedDB mock for Node | `npm i -D fake-indexeddb` |
| **chrome-mock** | `chrome.*` API stubs (custom, see 5.1) | Built in-repo |

**Why Vitest:** ESM-native (matches our `"type": "module"` codebase), zero-config for most cases, fast, built-in coverage reporting. No Babel, no transpile step.

**Why NOT Playwright/Puppeteer for v1:** Extension E2E testing is brittle and slow. Manual QA covers end-to-end flows. Automated E2E is a Phase 6+ investment.

---

## Directory Structure

Add to the extension root:

```
__APP_SLUG__/
├── tests/
│   ├── setup.js                    # Global test setup — mocks, fake-indexeddb
│   ├── chrome-mock.js              # Lightweight chrome.* API stub
│   ├── lib/                        # Unit tests for /lib/ modules
│   │   ├── redactor.test.js
│   │   ├── api-client.test.js
│   │   ├── tiers.test.js
│   │   ├── constants.test.js
│   │   ├── db.test.js
│   │   ├── store.test.js
│   │   └── backup.test.js
│   ├── background/                 # Service worker logic tests
│   │   └── handlers.test.js
│   └── integration/                # Cross-module flow tests
│       └── message-flow.test.js
├── vitest.config.js
└── package.json                    # Add devDependencies
```

---

## Steps

### 5.0 Initialize Test Infrastructure

**package.json** (create or update):

```json
{
  "name": "__APP_SLUG__",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  },
  "devDependencies": {
    "vitest": "^3.0.0",
    "fake-indexeddb": "^6.0.0",
    "@vitest/coverage-v8": "^3.0.0"
  }
}
```

**vitest.config.js:**

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.js', 'background/**/*.js'],
      exclude: ['tests/**', 'node_modules/**'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    }
  }
});
```

### 5.1 Chrome API Mock

Create a lightweight mock that covers the APIs we actually use. This is NOT a full Chrome API simulation — just enough to test our code.

**tests/chrome-mock.js:**

```javascript
/**
 * Minimal chrome.* API mock for testing 864zeros extensions.
 * Only stubs the APIs our /lib/ and service worker actually call.
 */

const storageData = {};
const changeListeners = [];

export const chrome = {
  storage: {
    local: {
      get: async (keys) => {
        if (typeof keys === 'string') {
          return { [keys]: storageData[keys] ?? undefined };
        }
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(k => { result[k] = storageData[k] ?? undefined; });
          return result;
        }
        return { ...storageData };
      },
      set: async (items) => {
        const oldValues = {};
        const changes = {};
        Object.entries(items).forEach(([key, value]) => {
          oldValues[key] = storageData[key];
          storageData[key] = value;
          changes[key] = { oldValue: oldValues[key], newValue: value };
        });
        changeListeners.forEach(fn => fn(changes, 'local'));
      },
      remove: async (keys) => {
        const toRemove = Array.isArray(keys) ? keys : [keys];
        const changes = {};
        toRemove.forEach(k => {
          changes[k] = { oldValue: storageData[k] };
          delete storageData[k];
        });
        changeListeners.forEach(fn => fn(changes, 'local'));
      },
      clear: async () => {
        Object.keys(storageData).forEach(k => delete storageData[k]);
      }
    },
    onChanged: {
      addListener: (fn) => changeListeners.push(fn),
      removeListener: (fn) => {
        const idx = changeListeners.indexOf(fn);
        if (idx >= 0) changeListeners.splice(idx, 1);
      }
    }
  },

  runtime: {
    sendMessage: async (message) => message,
    onMessage: {
      _listeners: [],
      addListener: (fn) => chrome.runtime.onMessage._listeners.push(fn),
      removeListener: (fn) => {
        const idx = chrome.runtime.onMessage._listeners.indexOf(fn);
        if (idx >= 0) chrome.runtime.onMessage._listeners.splice(idx, 1);
      }
    },
    onInstalled: {
      addListener: (fn) => fn({ reason: 'install' })
    },
    getURL: (path) => `chrome-extension://test-id/${path}`
  },

  sidePanel: {
    setPanelBehavior: async () => {},
    setOptions: async () => {}
  },

  alarms: {
    _alarms: {},
    create: (name, info) => { chrome.alarms._alarms[name] = info; },
    clear: (name) => { delete chrome.alarms._alarms[name]; },
    onAlarm: {
      addListener: () => {}
    }
  },

  identity: {
    getAuthToken: async ({ interactive }) => ({ token: 'mock-token-12345' }),
    removeCachedAuthToken: async () => {}
  }
};

// Reset all state between tests
export function resetChromeMock() {
  Object.keys(storageData).forEach(k => delete storageData[k]);
  changeListeners.length = 0;
  chrome.runtime.onMessage._listeners.length = 0;
  chrome.alarms._alarms = {};
}
```

**tests/setup.js:**

```javascript
import 'fake-indexeddb/auto';
import { chrome, resetChromeMock } from './chrome-mock.js';

// Make chrome available globally (like it is in an extension context)
globalThis.chrome = chrome;

// Reset state between every test
beforeEach(() => {
  resetChromeMock();
});
```

---

### 5.2 Unit Tests — /lib/ Core Modules

#### tests/lib/redactor.test.js

```javascript
import { redact, restore } from '../../lib/redactor.js';

describe('redactor', () => {
  describe('redact()', () => {
    test('strips email addresses', () => {
      const { redactedText } = redact('Contact me at john@example.com please');
      expect(redactedText).toContain('[EMAIL_REDACTED]');
      expect(redactedText).not.toContain('john@example.com');
    });

    test('strips phone numbers', () => {
      const { redactedText } = redact('Call me at 555-123-4567');
      expect(redactedText).toContain('[PHONE_REDACTED]');
      expect(redactedText).not.toContain('555-123-4567');
    });

    test('strips SSN patterns', () => {
      const { redactedText } = redact('My SSN is 123-45-6789');
      expect(redactedText).toContain('[SSN_REDACTED]');
    });

    test('strips credit card numbers', () => {
      const { redactedText } = redact('Card: 4111111111111111');
      expect(redactedText).toContain('[CC_REDACTED]');
    });

    test('strips multiple PPI types in one pass', () => {
      const input = 'Email john@test.com, call 555-000-1234, SSN 111-22-3333';
      const { redactedText, redactions } = redact(input);
      expect(redactions.length).toBe(3);
      expect(redactedText).not.toContain('john@test.com');
      expect(redactedText).not.toContain('555-000-1234');
      expect(redactedText).not.toContain('111-22-3333');
    });

    test('returns empty redactions for clean text', () => {
      const { redactedText, redactions } = redact('Just a normal sentence.');
      expect(redactedText).toBe('Just a normal sentence.');
      expect(redactions).toHaveLength(0);
    });

    test('handles empty string', () => {
      const { redactedText, redactions } = redact('');
      expect(redactedText).toBe('');
      expect(redactions).toHaveLength(0);
    });
  });

  describe('restore()', () => {
    test('restores redacted values', () => {
      const original = 'Email me at john@example.com';
      const { redactedText, redactions } = redact(original);
      const restored = restore(redactedText, redactions);
      expect(restored).toBe(original);
    });
  });
});
```

#### tests/lib/tiers.test.js

```javascript
import { getTier, setTier, requiresTier, getFeatureAccess } from '../../lib/tiers.js';

describe('tiers', () => {
  test('defaults to free tier', async () => {
    const tier = await getTier();
    expect(tier).toBe('free');
  });

  test('setTier persists and getTier retrieves', async () => {
    await setTier('pro');
    expect(await getTier()).toBe('pro');
  });

  test('requiresTier returns true when at or above', async () => {
    await setTier('pro');
    expect(await requiresTier('free')).toBe(true);
    expect(await requiresTier('starter')).toBe(true);
    expect(await requiresTier('pro')).toBe(true);
  });

  test('requiresTier returns false when below', async () => {
    await setTier('starter');
    expect(await requiresTier('pro')).toBe(false);
    expect(await requiresTier('power')).toBe(false);
  });

  test('free user cannot access paid features', async () => {
    // Assumes FEATURE_TIERS has 'ai-analysis': 'starter'
    expect(await getFeatureAccess('ai-analysis')).toBe(false);
  });

  test('paid user can access their tier features', async () => {
    await setTier('starter');
    expect(await getFeatureAccess('ai-analysis')).toBe(true);
  });
});
```

#### tests/lib/constants.test.js

```javascript
import { APP_SLUG, STORAGE_KEYS, TIERS } from '../../lib/constants.js';

describe('constants', () => {
  test('APP_SLUG is set (not placeholder)', () => {
    expect(APP_SLUG).toBeTruthy();
    expect(APP_SLUG).not.toBe('__APP_SLUG__');
  });

  test('storage keys are namespaced with slug', () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      expect(key.startsWith(APP_SLUG)).toBe(true);
    });
  });

  test('tier levels are ordered correctly', () => {
    expect(TIERS.free.level).toBeLessThan(TIERS.starter.level);
    expect(TIERS.starter.level).toBeLessThan(TIERS.pro.level);
    expect(TIERS.pro.level).toBeLessThan(TIERS.power.level);
  });

  test('all tier prices meet minimum floor', () => {
    expect(TIERS.free.price).toBe(0);
    expect(TIERS.starter.price).toBeGreaterThanOrEqual(1.99);
  });
});
```

#### tests/lib/api-client.test.js

```javascript
import { configure, analyze, getProviderInfo } from '../../lib/api-client.js';

// Mock fetch globally for API tests
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('api-client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    configure({
      provider: 'gemini',
      apiKey: 'test-key',
      model: 'gemini-pro',
      options: { maxTokens: 100 }
    });
  });

  test('configure sets provider info', () => {
    const info = getProviderInfo();
    expect(info.provider).toBe('gemini');
    expect(info.model).toBe('gemini-pro');
  });

  test('analyze sends redacted content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'summary result' }] } }]
      })
    });

    const result = await analyze(
      'Contact john@secret.com for details',
      'Summarize this'
    );

    expect(result.success).toBe(true);
    // Verify the fetch body does NOT contain the raw email
    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const sentText = JSON.stringify(fetchBody);
    expect(sentText).not.toContain('john@secret.com');
    expect(sentText).toContain('[EMAIL_REDACTED]');
  });

  test('analyze returns error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await analyze('some content', 'do something');
    expect(result.success).toBe(false);
    expect(result.error).toBe('offline');
  });

  test('analyze returns error on 429 rate limit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'rate limited' })
    });

    const result = await analyze('content', 'instruction');
    expect(result.success).toBe(false);
    expect(result.error).toBe('rate_limited');
  });
});
```

#### tests/lib/db.test.js

```javascript
import { initDB, put, get, getAll, remove, count, clear, exportAll, importAll } from '../../lib/db.js';

describe('db (IndexedDB)', () => {
  beforeEach(async () => {
    // Initialize with test schema
    await initDB('test-db', 1, {
      items: {
        keyPath: 'id',
        indexes: [
          { name: 'by-type', field: 'type', unique: false },
          { name: 'by-created', field: 'createdAt', unique: false }
        ]
      }
    });
  });

  test('put and get a record', async () => {
    const record = { id: 'test-1', type: 'note', content: 'hello', createdAt: new Date().toISOString() };
    await put('items', record);
    const retrieved = await get('items', 'test-1');
    expect(retrieved).toEqual(record);
  });

  test('getAll returns all records', async () => {
    await put('items', { id: '1', type: 'a', createdAt: '2026-01-01' });
    await put('items', { id: '2', type: 'b', createdAt: '2026-01-02' });
    const all = await getAll('items');
    expect(all).toHaveLength(2);
  });

  test('remove deletes a record', async () => {
    await put('items', { id: 'del-1', type: 'x', createdAt: '2026-01-01' });
    await remove('items', 'del-1');
    const result = await get('items', 'del-1');
    expect(result).toBeUndefined();
  });

  test('count returns correct number', async () => {
    await put('items', { id: 'c1', type: 'a', createdAt: '2026-01-01' });
    await put('items', { id: 'c2', type: 'a', createdAt: '2026-01-01' });
    expect(await count('items')).toBe(2);
  });

  test('clear removes all records', async () => {
    await put('items', { id: 'cl1', type: 'a', createdAt: '2026-01-01' });
    await put('items', { id: 'cl2', type: 'a', createdAt: '2026-01-01' });
    await clear('items');
    expect(await count('items')).toBe(0);
  });

  test('put updates existing record', async () => {
    await put('items', { id: 'up1', type: 'a', content: 'old', createdAt: '2026-01-01' });
    await put('items', { id: 'up1', type: 'a', content: 'new', createdAt: '2026-01-01' });
    const result = await get('items', 'up1');
    expect(result.content).toBe('new');
    expect(await count('items')).toBe(1);
  });

  test('exportAll and importAll round-trip', async () => {
    await put('items', { id: 'ex1', type: 'a', createdAt: '2026-01-01' });
    await put('items', { id: 'ex2', type: 'b', createdAt: '2026-01-02' });
    const exported = await exportAll();
    await clear('items');
    expect(await count('items')).toBe(0);
    await importAll(exported);
    expect(await count('items')).toBe(2);
  });
});
```

#### tests/lib/store.test.js

```javascript
import { getState, setState, removeState, onStateChange } from '../../lib/store.js';

describe('store (chrome.storage.local wrapper)', () => {
  test('setState and getState round-trip', async () => {
    await setState('theme', 'dark');
    const value = await getState('theme');
    expect(value).toBe('dark');
  });

  test('keys are namespaced with app slug', async () => {
    await setState('mykey', 'myvalue');
    // Verify the raw chrome.storage.local has the prefixed key
    const raw = await chrome.storage.local.get(null);
    const keys = Object.keys(raw);
    const hasNamespaced = keys.some(k => k.includes('mykey') && k.length > 'mykey'.length);
    expect(hasNamespaced).toBe(true);
  });

  test('removeState deletes the value', async () => {
    await setState('temp', 'value');
    await removeState('temp');
    const value = await getState('temp');
    expect(value).toBeUndefined();
  });

  test('onStateChange fires callback on update', async () => {
    const callback = vi.fn();
    const unsubscribe = onStateChange('watched', callback);

    await setState('watched', 'new-value');

    // Give the listener a tick to fire
    await new Promise(r => setTimeout(r, 10));
    expect(callback).toHaveBeenCalledWith('new-value', undefined);

    unsubscribe();
  });
});
```

---

### 5.3 Integration Tests — Message Flow

Test that the service worker correctly handles messages from panel and content scripts.

#### tests/integration/message-flow.test.js

```javascript
/**
 * Integration tests for message passing between contexts.
 *
 * These test the actual handler functions from the service worker,
 * NOT chrome.runtime.sendMessage (which requires a real extension context).
 * We import handlers directly and test their logic.
 */

// Import handlers — adjust path to match your service worker structure
// import { handleCapture, handleAnalyze } from '../../background/handlers.js';

describe('message flow', () => {
  test('content capture → store → retrieve', async () => {
    // Simulate: content script sends capture → service worker stores → panel reads
    const capturePayload = {
      contentType: 'selection',
      content: 'Selected text from a webpage',
      sourceUrl: 'https://example.com/article',
      sourceTitle: 'Example Article'
    };

    // TODO: Import and call your actual handler
    // const result = await handleCapture(capturePayload);
    // expect(result.success).toBe(true);
    // expect(result.id).toBeTruthy();

    // Then verify it's in the database
    // const stored = await get('content', result.id);
    // expect(stored.content).toBe(capturePayload.content);
  });

  test('AI analysis flow redacts PPI before sending', async () => {
    // Simulate: panel requests AI analysis on content with PPI
    const contentWithPPI = 'Report by john@company.com about Q3 results';

    // TODO: Import and call your actual handler
    // Verify fetch was called with redacted content (mock fetch, check body)
  });

  test('tier change propagates to panel', async () => {
    // Simulate: Stripe callback sets tier → storage change → panel updates
    const changeCallback = vi.fn();
    chrome.storage.onChanged.addListener(changeCallback);

    await chrome.storage.local.set({ 'app_tier': 'pro' });

    expect(changeCallback).toHaveBeenCalled();
    const changes = changeCallback.mock.calls[0][0];
    expect(changes['app_tier'].newValue).toBe('pro');
  });
});
```

---

### 5.4 Manual QA Checklist

Run through these by hand before declaring production-ready. Each item requires a human verify.

Print this checklist or copy into a tracking doc.

#### Installation & Loading

- [ ] Fresh install: `chrome://extensions` → Load unpacked → No errors
- [ ] Extension icon appears in toolbar
- [ ] Click icon → side panel opens
- [ ] Panel shows correct initial state (empty state or onboarding)
- [ ] Options page opens from `chrome://extensions` → Details → Extension options

#### Core Functionality (per feature)

For each feature in the app brief, verify:

- [ ] Feature triggers correctly (button, context menu, keyboard shortcut, page action)
- [ ] Feature produces expected result
- [ ] Result displays correctly in panel
- [ ] Data persists: close panel → reopen → data still there
- [ ] Data persists: close browser → reopen → data still there
- [ ] Feature works on: a news article, a Google Doc, a GitHub page, a plain text site
- [ ] Feature gracefully handles: empty input, very long input, special characters, non-English text

#### AI Integration

- [ ] AI call works with default provider
- [ ] PPI is NOT visible in DevTools Network tab (check the outgoing request body)
- [ ] AI failure (disable network) shows friendly error, not a crash
- [ ] AI rate limit shows appropriate message

#### Tier Gating

- [ ] Free tier: paid features show upgrade prompt, not errors
- [ ] Upgrade prompt copy is friendly (no "you need to pay")
- [ ] After simulated upgrade: gated feature works immediately
- [ ] Downgrade scenario: content created at higher tier is still accessible

#### Visual & UX

- [ ] Light mode: all views render correctly
- [ ] Dark mode: toggle OS theme → all views adapt, no white flashes
- [ ] Font is Nunito (check in DevTools → Computed styles)
- [ ] No pure `#000000` or `#FFFFFF` anywhere
- [ ] All interactive elements have visible focus states (Tab through the UI)
- [ ] No horizontal scrollbar in panel at any content state
- [ ] Animations play smoothly (card appear, toast, view switch)
- [ ] `prefers-reduced-motion` → animations are killed (test in DevTools → Rendering)
- [ ] Empty states use inviting copy (no guilt, no pressure)
- [ ] Error messages use friendly copy ("Something went wrong", not "Error")

#### Data & Privacy

- [ ] Export: click export → JSON file downloads → file contains all stored data
- [ ] Import: upload exported JSON → data appears in panel → no duplicates
- [ ] Network tab audit: no outgoing requests except AI API calls (no analytics, no telemetry)
- [ ] AI request bodies contain redacted PPI placeholders (verify in Network tab)
- [ ] Google Drive sync (if Pro): OAuth flow works, snapshot appears in Drive
- [ ] No `localStorage`, `sessionStorage`, or cookies used (all in IndexedDB / chrome.storage)

#### Edge Cases

- [ ] Restricted pages: navigate to `chrome://settings` → extension doesn't crash
- [ ] Rapid clicking: spam the main action button → no duplicate operations
- [ ] Offline: disable network → local features work, AI shows offline message
- [ ] Very long content: capture a 10,000+ word page → no crash, display truncates sensibly
- [ ] Multiple tabs: use the extension across 5+ tabs → no state corruption
- [ ] Extension reload: `chrome://extensions` → reload → no data loss, panel recovers

#### Options & Settings

- [ ] All settings save and persist
- [ ] "Your Plan" shows correct tier
- [ ] "Export my data" works
- [ ] "Import data" works
- [ ] "Fuel the Build" button links to Stripe
- [ ] Footer shows "No ads. No tracking. Your data stays yours."

#### Pre-Submission

- [ ] All 3 icons are real brand assets (not placeholders)
- [ ] `_locales/en/messages.json` has final production copy
- [ ] No `console.log` statements in production (or gated behind `DEBUG` flag)
- [ ] Manifest has minimum required permissions (no extras)
- [ ] Version number in manifest is correct
- [ ] Description is under 132 characters

---

### 5.5 Regression Baseline

After all tests pass and manual QA is complete, save a **golden file** — a snapshot of known-good test output that future builds diff against.

```bash
# Run tests and save output as baseline
npm test -- --reporter=json > tests/golden/baseline.json

# On future builds, compare:
npm test -- --reporter=json > tests/golden/current.json
diff tests/golden/baseline.json tests/golden/current.json
```

**Golden file rules:**
- Committed to repo alongside source code
- Updated intentionally when features change (never silently)
- CI/CD compares new output against golden file — any diff requires review
- Timestamp fields stripped before comparison (tests should use fixed dates)

---

## 5.6 Session Recap

After completing Phase 5, save a session recap to `scratch/`:

```markdown
# Phase 5 — Proof Complete

**Date:** YYYY-MM-DD
**Extension:** [app-slug]

## Test Results
- Test Files: X passed
- Tests: X passed
- Duration: Xms

## Manual QA
- [ ] Fresh install tested
- [ ] All features verified
- [ ] Dark mode checked
- [ ] Edge cases handled

## Issues Found & Fixed
- [List any bugs found during proof]

## Ready to Ship
- [ ] All automated tests pass
- [ ] Manual QA complete
- [ ] Golden baseline saved

**Status:** PRODUCTION READY / blocked on ___
```

---

## Checkpoint

```
CHECKPOINT: Phase 5 — Proof
VERIFY:
  1. npm test runs clean — all unit tests pass
  2. Coverage report meets thresholds (≥80% statements, ≥75% branches)
  3. Integration tests verify message flow and PPI redaction
  4. Manual QA checklist 100% complete — every box checked
  5. Network tab audit passed — no unauthorized outbound requests
  6. Dark mode + reduced motion verified by human
  7. Edge cases tested (offline, rapid click, restricted pages, long content)
  8. Export/import round-trip verified by human
  9. Golden baseline saved
  10. All console.log removed or gated
  11. Session recap saved to scratch/
STATUS: [PRODUCTION READY / blocked on ___]
```

**The extension ships when all 11 checks pass. Not before.**
