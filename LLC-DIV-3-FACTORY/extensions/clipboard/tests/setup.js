import 'fake-indexeddb/auto';
import { chrome, resetChromeMock } from './chrome-mock.js';

// Make chrome available globally (like it is in an extension context)
globalThis.chrome = chrome;

// Reset state between every test
beforeEach(() => {
  resetChromeMock();
});
