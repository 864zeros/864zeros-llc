/**
 * Vitest Configuration for 864zeros Extensions
 *
 * ESM-native, fast, zero-config for most cases.
 * Copy to your extension root directory.
 *
 * Usage:
 *   npm run test        # Run all tests once
 *   npm run test:watch  # Watch mode
 *   npm run test:coverage # With coverage report
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use global test functions (describe, test, expect)
    globals: true,

    // Node environment for service worker testing
    environment: 'node',

    // Load setup file before tests
    setupFiles: ['./tests/setup.js'],

    // Test file patterns
    include: ['tests/**/*.test.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',

      // What to measure
      include: ['lib/**/*.js', 'background/**/*.js'],

      // What to exclude
      exclude: ['tests/**', 'node_modules/**', '**/*.test.js'],

      // Minimum thresholds (Phase 5 — Proof requirement)
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    },

    // Reporter options
    reporters: ['default'],

    // Timeout for async tests (ms)
    testTimeout: 10000
  }
});
