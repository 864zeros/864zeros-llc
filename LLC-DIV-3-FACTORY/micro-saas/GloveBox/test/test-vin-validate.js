/**
 * VIN Validator Tests
 * Step 2 Acceptance Criteria
 */

import { validateVIN } from '../src/utils/vin-validator.js';

const tests = [
  {
    name: 'Valid VIN passes',
    fn: () => {
      const result = validateVIN('1HGBH41JXMN109186');
      if (!result.valid) throw new Error(`Expected valid, got: ${result.error}`);
      console.log('  ✓ Valid VIN passes');
    }
  },
  {
    name: 'Invalid length rejected',
    fn: () => {
      const result = validateVIN('1HGBH41JXMN1091'); // 16 chars
      if (result.valid) throw new Error('Expected invalid for short VIN');
      console.log('  ✓ Invalid length rejected');
    }
  },
  {
    name: 'Invalid characters (I, O, Q) rejected',
    fn: () => {
      const result = validateVIN('1HGBH41IXMN109186'); // I instead of J
      if (result.valid) throw new Error('Expected invalid for VIN with I');
      console.log('  ✓ Invalid characters rejected');
    }
  },
  {
    name: 'Bad check digit rejected',
    fn: () => {
      const result = validateVIN('1HGBH41J0MN109186'); // Wrong check digit
      if (result.valid) throw new Error('Expected invalid for bad check digit');
      console.log('  ✓ Bad check digit rejected');
    }
  },
  {
    name: 'Decoded fields extracted correctly',
    fn: () => {
      const result = validateVIN('1HGBH41JXMN109186');
      if (!result.decoded) throw new Error('Expected decoded fields');
      if (!result.decoded.wmi) throw new Error('Missing WMI');
      if (!result.decoded.vds) throw new Error('Missing VDS');
      if (!result.decoded.year_code) throw new Error('Missing year code');
      console.log('  ✓ Decoded fields extracted correctly');
    }
  }
];

console.log('\\nVIN Validator Tests\\n');
let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    test.fn();
    passed++;
  } catch (err) {
    console.log(`  ✗ ${test.name}: ${err.message}`);
    failed++;
  }
}

console.log(`\\nResults: ${passed} passed, ${failed} failed\\n`);
process.exit(failed > 0 ? 1 : 0);
