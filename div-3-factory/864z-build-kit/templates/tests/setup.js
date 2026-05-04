/**
 * Vitest Global Setup for 864zeros Extensions
 *
 * Initializes fake-indexeddb and Chrome API mocks.
 * Copy to your extension's tests/ directory.
 *
 * Required packages:
 *   npm i -D vitest fake-indexeddb @vitest/coverage-v8
 */

// Mock IndexedDB for Node environment
import 'fake-indexeddb/auto';

// Import and install Chrome API mock
import { chrome, resetChromeMock } from './chrome-mock.js';

// Make chrome available globally (like in extension context)
globalThis.chrome = chrome;

// Reset mock state before each test for isolation
beforeEach(() => {
  resetChromeMock();
});

// Optional: Add custom matchers or global utilities here
// Example:
// expect.extend({
//   toBeValidClip(received) {
//     const pass = received.id && received.content && received.createdAt;
//     return {
//       pass,
//       message: () => `expected ${received} to be a valid clip object`
//     };
//   }
// });
