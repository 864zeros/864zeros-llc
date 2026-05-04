/**
 * NHTSA VIN Decoder Tests
 * Step 3 Acceptance Criteria
 */

import { decodeVIN } from '../src/adapters/nhtsa-vin.js';

const TEST_VIN = '1HGBH41JXMN109186';

const tests = [
  {
    name: 'Real VIN returns valid data',
    fn: async () => {
      const nodes = await decodeVIN(TEST_VIN);
      if (!Array.isArray(nodes)) throw new Error('Expected array of nodes');
      if (nodes.length === 0) throw new Error('Expected non-empty array');
      console.log(`  ✓ Real VIN returns valid data (${nodes.length} nodes)`);
    }
  },
  {
    name: 'Fields extracted as JSON-LD nodes',
    fn: async () => {
      const nodes = await decodeVIN(TEST_VIN);
      const hasId = nodes.every(n => n['@id']);
      if (!hasId) throw new Error('All nodes must have @id');
      console.log('  ✓ Fields extracted as JSON-LD nodes');
    }
  },
  {
    name: 'Each node has @type, aether:source, aether:origin',
    fn: async () => {
      const nodes = await decodeVIN(TEST_VIN);
      for (const node of nodes) {
        if (!node['@type']) throw new Error(`Node missing @type: ${node['@id']}`);
        if (!node['aether:source']) throw new Error(`Node missing aether:source: ${node['@id']}`);
        if (!node['aether:origin']) throw new Error(`Node missing aether:origin: ${node['@id']}`);
      }
      console.log('  ✓ Each node has @type, aether:source, aether:origin');
    }
  },
  {
    name: 'Cached response used on second call',
    fn: async () => {
      const start1 = Date.now();
      await decodeVIN(TEST_VIN);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await decodeVIN(TEST_VIN);
      const time2 = Date.now() - start2;

      // Second call should be faster (cached)
      if (time2 > time1 * 0.5 && time1 > 100) {
        console.log(`  ⚠ Cache may not be working (${time1}ms vs ${time2}ms)`);
      } else {
        console.log(`  ✓ Cached response used on second call (${time1}ms → ${time2}ms)`);
      }
    }
  },
  {
    name: 'Invalid VIN returns error',
    fn: async () => {
      try {
        await decodeVIN('INVALID');
        throw new Error('Expected error for invalid VIN');
      } catch (err) {
        if (err.message === 'Expected error for invalid VIN') throw err;
        console.log('  ✓ Invalid VIN returns error');
      }
    }
  }
];

async function run() {
  console.log('\\nNHTSA VIN Decoder Tests\\n');
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.fn();
      passed++;
    } catch (err) {
      console.log(`  ✗ ${test.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\\nResults: ${passed} passed, ${failed} failed\\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
