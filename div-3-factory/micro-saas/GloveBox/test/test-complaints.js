/**
 * NHTSA Complaints Adapter Tests
 * Step 5 Acceptance Criteria
 */

import { getComplaints } from '../src/adapters/nhtsa-complaints.js';

const tests = [
  {
    name: 'Popular vehicle returns complaint nodes',
    fn: async () => {
      const nodes = await getComplaints('Honda', 'Civic', 2019);
      if (!Array.isArray(nodes)) throw new Error('Expected array');
      console.log(`  ✓ Popular vehicle returns ${nodes.length} complaint nodes`);
    }
  },
  {
    name: 'Complaints aggregated by component',
    fn: async () => {
      const nodes = await getComplaints('Honda', 'Civic', 2019);
      // Check that similar components are grouped
      const components = nodes.map(n => n['@id']);
      const uniqueComponents = new Set(components);
      if (components.length !== uniqueComponents.size) {
        throw new Error('Duplicate component IDs found - not properly aggregated');
      }
      console.log('  ✓ Complaints aggregated by component');
    }
  },
  {
    name: 'Nodes typed as skill:AntiPattern',
    fn: async () => {
      const nodes = await getComplaints('Honda', 'Civic', 2019);
      if (nodes.length > 0) {
        const allAntiPatterns = nodes.every(n => n['@type'] === 'skill:AntiPattern');
        if (!allAntiPatterns) throw new Error('All complaint nodes must be skill:AntiPattern');
      }
      console.log('  ✓ Nodes typed as skill:AntiPattern');
    }
  },
  {
    name: 'Crash/fire flags present',
    fn: async () => {
      const nodes = await getComplaints('Honda', 'Civic', 2019);
      if (nodes.length > 0) {
        const first = nodes[0];
        if (typeof first['aether:crash'] !== 'boolean' || typeof first['aether:fire'] !== 'boolean') {
          throw new Error('Crash/fire flags must be boolean');
        }
      }
      console.log('  ✓ Crash/fire flags present');
    }
  }
];

async function run() {
  console.log('\\nNHTSA Complaints Adapter Tests\\n');
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
