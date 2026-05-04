import { describe, test, expect, beforeEach } from 'vitest';
import { initDB, put, get, getAll, remove, count, clear, exportAll, importAll } from '../../lib/db.js';

describe('db (IndexedDB)', () => {
  beforeEach(async () => {
    // Initialize with test schema
    await initDB('test-db-' + Date.now(), 1, {
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

  test('get returns null for nonexistent record', async () => {
    const result = await get('items', 'nonexistent');
    expect(result).toBeNull();
  });

  test('getAll returns all records', async () => {
    await put('items', { id: '1', type: 'a', createdAt: '2026-01-01' });
    await put('items', { id: '2', type: 'b', createdAt: '2026-01-02' });
    const all = await getAll('items');
    expect(all).toHaveLength(2);
  });

  test('getAll returns empty array when no records', async () => {
    const all = await getAll('items');
    expect(all).toEqual([]);
  });

  test('remove deletes a record', async () => {
    await put('items', { id: 'del-1', type: 'x', createdAt: '2026-01-01' });
    await remove('items', 'del-1');
    const result = await get('items', 'del-1');
    expect(result).toBeNull();
  });

  test('count returns correct number', async () => {
    await put('items', { id: 'c1', type: 'a', createdAt: '2026-01-01' });
    await put('items', { id: 'c2', type: 'a', createdAt: '2026-01-01' });
    expect(await count('items')).toBe(2);
  });

  test('count returns 0 for empty store', async () => {
    expect(await count('items')).toBe(0);
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
    expect(exported.items).toHaveLength(2);
    await clear('items');
    expect(await count('items')).toBe(0);
    await importAll(exported);
    expect(await count('items')).toBe(2);
  });
});
