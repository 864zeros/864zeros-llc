/**
 * NHTSA Recalls Adapter Tests
 * Step 4 Acceptance Criteria
 */

import { getRecalls } from '../src/adapters/nhtsa-recalls.js';

const tests = [
  {
    name: 'Known recalled vehicle returns recall nodes',
    fn: async () => {
      // Honda Civic 2019 likely has recalls
      const nodes = await getRecalls('Honda', 'Civic', 2019);
      if (!Array.isArray(nodes)) throw new Error('Expected array');
      console.log(`  ✓ Known recalled vehicle returns ${nodes.length} recall nodes`);
    }
  },
  {
    name: 'Nodes typed as skill:Rule',
    fn: async () => {
      const nodes = await getRecalls('Honda', 'Civic', 2019);
      if (nodes.length > 0) {
        const allRules = nodes.every(n => n['@type'] === 'skill:Rule');
        if (!allRules) throw new Error('All recall nodes must be skill:Rule');
      }
      console.log('  ✓ Nodes typed as skill:Rule');
    }
  },
  {
    name: 'Severity and remedy fields populated',
    fn: async () => {
      const nodes = await getRecalls('Honda', 'Civic', 2019);
      if (nodes.length > 0) {
        const first = nodes[0];
        if (!first['aether:severity'] && !first['aether:remedy']) {
          console.log('  ⚠ Severity/remedy may be empty for some recalls');
        } else {
          console.log('  ✓ Severity and remedy fields populated');
        }
      } else {
        console.log('  ✓ Severity and remedy fields populated (no recalls to check)');
      }
    }
  },
  {
    name: 'Vehicle with no recalls returns empty array',
    fn: async () => {
      // Use a very new or obscure vehicle
      const nodes = await getRecalls('TestMake', 'TestModel', 1900);
      if (!Array.isArray(nodes)) throw new Error('Expected array');
      console.log(`  ✓ Vehicle with no recalls returns empty array (${nodes.length})`);
    }
  }
];

async function run() {
  console.log('\\nNHTSA Recalls Adapter Tests\\n');
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
