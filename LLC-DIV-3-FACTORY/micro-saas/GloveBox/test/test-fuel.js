/**
 * EPA Fuel Economy Adapter Tests
 * Step 6 Acceptance Criteria
 */

import { getFuelEconomy } from '../src/adapters/epa-fuel.js';

const tests = [
  {
    name: 'Known vehicle returns fuel economy data',
    fn: async () => {
      const nodes = await getFuelEconomy(2019, 'Honda', 'Civic');
      if (!Array.isArray(nodes)) throw new Error('Expected array');
      if (nodes.length === 0) throw new Error('Expected non-empty array');
      console.log(`  ✓ Known vehicle returns fuel economy data (${nodes.length} nodes)`);
    }
  },
  {
    name: 'City, highway, combined MPG present',
    fn: async () => {
      const nodes = await getFuelEconomy(2019, 'Honda', 'Civic');
      const fuelNode = nodes.find(n => n['@id'] === 'fuel:economy');
      if (!fuelNode) throw new Error('Missing fuel:economy node');
      if (!fuelNode['aether:city_mpg']) throw new Error('Missing city_mpg');
      if (!fuelNode['aether:highway_mpg']) throw new Error('Missing highway_mpg');
      if (!fuelNode['aether:combined_mpg']) throw new Error('Missing combined_mpg');
      console.log('  ✓ City, highway, combined MPG present');
    }
  },
  {
    name: 'Annual fuel cost present',
    fn: async () => {
      const nodes = await getFuelEconomy(2019, 'Honda', 'Civic');
      const fuelNode = nodes.find(n => n['@id'] === 'fuel:economy');
      if (!fuelNode) throw new Error('Missing fuel:economy node');
      if (!fuelNode['aether:annual_fuel_cost']) throw new Error('Missing annual_fuel_cost');
      console.log('  ✓ Annual fuel cost present');
    }
  }
];

async function run() {
  console.log('\\nEPA Fuel Economy Adapter Tests\\n');
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
