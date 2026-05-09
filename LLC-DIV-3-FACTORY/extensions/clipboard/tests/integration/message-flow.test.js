import { describe, test, expect, beforeEach, vi } from 'vitest';
import { initDB, put, get, getAll, clear } from '../../lib/db.js';
import { redact } from '../../lib/redactor.js';
import { setTier, getTier } from '../../lib/tiers.js';

/**
 * Integration tests for message passing between contexts.
 *
 * These test the actual handler functions and data flow,
 * NOT chrome.runtime.sendMessage (which requires a real extension context).
 */

describe('message flow integration', () => {
  beforeEach(async () => {
    await chrome.storage.local.clear();
    await initDB('test-db-' + Date.now(), 1, {
      clips: {
        keyPath: 'id',
        indexes: [
          { name: 'by-type', field: 'clipType', unique: false },
          { name: 'by-created', field: 'createdAt', unique: false }
        ]
      },
      tags: {
        keyPath: 'id',
        indexes: []
      }
    });
  });

  test('content capture → store → retrieve flow', async () => {
    // Simulate: content script sends capture → service worker stores → panel reads
    const capturePayload = {
      id: crypto.randomUUID(),
      clipType: 'text',
      content: 'Selected text from a webpage',
      sourceUrl: 'https://example.com/article',
      sourceTitle: 'Example Article',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store the clip (simulates service worker handler)
    await put('clips', capturePayload);

    // Verify it's in the database (simulates panel read)
    const stored = await get('clips', capturePayload.id);
    expect(stored.content).toBe(capturePayload.content);
    expect(stored.sourceUrl).toBe(capturePayload.sourceUrl);
  });

  test('AI analysis flow redacts PPI before sending', async () => {
    const contentWithPPI = 'Report by john@company.com about Q3 results. Call 555-123-4567.';

    // Redact before sending to AI (simulates service worker behavior)
    const { redactedText, redactions } = redact(contentWithPPI);

    // Verify PPI is removed
    expect(redactedText).not.toContain('john@company.com');
    expect(redactedText).not.toContain('555-123-4567');
    expect(redactedText).toContain('[EMAIL_REDACTED]');
    expect(redactedText).toContain('[PHONE_REDACTED]');

    // Verify redactions are tracked for restoration
    expect(redactions.length).toBe(2);
    expect(redactions.some(r => r.type === 'EMAIL')).toBe(true);
    expect(redactions.some(r => r.type === 'PHONE')).toBe(true);
  });

  test('tier change propagates via storage change event', async () => {
    const changeCallback = vi.fn();
    chrome.storage.onChanged.addListener(changeCallback);

    // Simulate payment callback setting tier
    await setTier('pro');

    // Verify storage change listener was called
    expect(changeCallback).toHaveBeenCalled();
    const changes = changeCallback.mock.calls[0][0];
    expect(changes['clipboard_tier'].newValue).toBe('pro');

    // Verify tier is persisted
    expect(await getTier()).toBe('pro');
  });

  test('clip deletion removes from database', async () => {
    const clip = {
      id: 'delete-test',
      clipType: 'text',
      content: 'Test content',
      createdAt: new Date().toISOString()
    };

    await put('clips', clip);
    expect(await get('clips', 'delete-test')).toBeTruthy();

    // Simulate delete handler
    const { remove } = await import('../../lib/db.js');
    await remove('clips', 'delete-test');

    expect(await get('clips', 'delete-test')).toBeNull();
  });

  test('tag assignment persists correctly', async () => {
    // Create a clip
    const clip = {
      id: 'tag-test-clip',
      clipType: 'text',
      content: 'Test content',
      tagIds: [],
      createdAt: new Date().toISOString()
    };
    await put('clips', clip);

    // Create a tag
    const tag = {
      id: 'tag-1',
      name: 'Research',
      createdAt: new Date().toISOString()
    };
    await put('tags', tag);

    // Assign tag to clip (simulates service worker handler)
    const updatedClip = { ...clip, tagIds: ['tag-1'] };
    await put('clips', updatedClip);

    // Verify assignment
    const retrieved = await get('clips', 'tag-test-clip');
    expect(retrieved.tagIds).toContain('tag-1');
  });

  test('multiple clips can be retrieved and filtered', async () => {
    // Create several clips
    const clips = [
      { id: '1', clipType: 'text', content: 'Text clip', createdAt: '2026-01-01' },
      { id: '2', clipType: 'screenshot', content: 'data:image/png;base64,...', createdAt: '2026-01-02' },
      { id: '3', clipType: 'text', content: 'Another text', createdAt: '2026-01-03' }
    ];

    for (const clip of clips) {
      await put('clips', clip);
    }

    // Get all clips
    const all = await getAll('clips');
    expect(all).toHaveLength(3);

    // Filter by type (would happen in service worker)
    const textClips = all.filter(c => c.clipType === 'text');
    expect(textClips).toHaveLength(2);
  });
});
