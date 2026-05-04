/**
 * Full Pipeline Integration Test
 * End-to-end test from VIN to capsule
 */

import { validateVIN } from '../src/utils/vin-validator.js';
import { decodeVIN } from '../src/adapters/nhtsa-vin.js';
import { getRecalls } from '../src/adapters/nhtsa-recalls.js';
import { getComplaints } from '../src/adapters/nhtsa-complaints.js';
import { getSafetyRatings } from '../src/adapters/nhtsa-safety.js';
import { getFuelEconomy } from '../src/adapters/epa-fuel.js';
import { generateMaintenanceSchedule } from '../src/adapters/maintenance-schedule.js';
import { compose } from '../src/composer/graph-composer.js';
import { narrateKB } from '../src/narrator/kb-narrator.js';
import { generatePersona } from '../src/narrator/persona-gen.js';
import { stampGloveBox } from '../src/capsule/stamper.js';
import fs from 'fs';
import path from 'path';

const TEST_VIN = '1HGBH41JXMN109186';
const TEST_MILEAGE = 45230;

async function run() {
  console.log('\\n=== GLOVEBOX Full Pipeline Test ===\\n');
  console.log(`VIN: ${TEST_VIN}`);
  console.log(`Mileage: ${TEST_MILEAGE}\\n`);

  try {
    // Step 1: Validate VIN
    console.log('[1/8] Validating VIN...');
    const validation = validateVIN(TEST_VIN);
    if (!validation.valid) throw new Error(`Invalid VIN: ${validation.error}`);
    console.log('  ✓ VIN valid\\n');

    // Step 2: Collect data from all sources
    console.log('[2/8] Collecting data from APIs...');

    const vinNodes = await decodeVIN(TEST_VIN);
    console.log(`  ├── NHTSA VIN decode: ${vinNodes.length} nodes`);

    // Extract make/model/year from VIN decode
    const makeNode = vinNodes.find(n => n['@id'] === 'spec:make');
    const modelNode = vinNodes.find(n => n['@id'] === 'spec:model');
    const yearNode = vinNodes.find(n => n['@id'] === 'spec:modelyear');

    const make = makeNode?.['aether:value'] || 'Honda';
    const model = modelNode?.['aether:value'] || 'Civic';
    const year = yearNode?.['aether:value'] || 2019;

    const recallNodes = await getRecalls(make, model, year);
    console.log(`  ├── NHTSA recalls: ${recallNodes.length} nodes`);

    const complaintNodes = await getComplaints(make, model, year);
    console.log(`  ├── NHTSA complaints: ${complaintNodes.length} nodes`);

    const safetyNodes = await getSafetyRatings(year, make, model);
    console.log(`  ├── NHTSA safety: ${safetyNodes.length} nodes`);

    const fuelNodes = await getFuelEconomy(year, make, model);
    console.log(`  ├── EPA fuel economy: ${fuelNodes.length} nodes`);

    const maintenanceNodes = generateMaintenanceSchedule(make, model, year, TEST_MILEAGE);
    console.log(`  └── Maintenance schedule: ${maintenanceNodes.length} nodes`);
    console.log('');

    // Step 3: Compose knowledge graph
    console.log('[3/8] Composing knowledge graph...');
    const fragments = [vinNodes, recallNodes, complaintNodes, safetyNodes, fuelNodes, maintenanceNodes];
    const kg = compose(fragments, TEST_VIN);
    console.log(`  ✓ Composed: ${kg['@graph'].length} nodes\\n`);

    // Step 4: Generate narrative KB
    console.log('[4/8] Generating first-person narrative...');
    const kb = await narrateKB(kg, null); // null = skip LLM in test
    console.log('  ✓ KB narrative generated\\n');

    // Step 5: Generate persona
    console.log('[5/8] Generating car persona...');
    const persona = await generatePersona(kg, make, model, year);
    console.log('  ✓ Persona generated\\n');

    // Step 6: Stamp capsule
    console.log('[6/8] Stamping AETHER capsule...');
    const outputDir = 'output';
    stampGloveBox(TEST_VIN, kg, kb, persona, outputDir);

    const vinLast8 = TEST_VIN.slice(-8);
    const capsulePath = path.join(outputDir, `glovebox-${vinLast8}`);
    console.log(`  ✓ Capsule created at: ${capsulePath}\\n`);

    // Step 7: Verify capsule structure
    console.log('[7/8] Verifying capsule structure...');
    const expectedFiles = [
      `glovebox-${vinLast8}-manifest.json`,
      `glovebox-${vinLast8}-definition.json`,
      `glovebox-${vinLast8}-persona.json`,
      `glovebox-${vinLast8}-kb.md`,
      `glovebox-${vinLast8}-kg.jsonld`
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(capsulePath, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing capsule file: ${file}`);
      }
      console.log(`  ├── ${file} ✓`);
    }
    console.log('');

    // Step 8: Summary
    console.log('[8/8] Pipeline complete!\\n');
    console.log('=== Summary ===');
    console.log(`Vehicle: ${year} ${make} ${model}`);
    console.log(`VIN: ${TEST_VIN}`);
    console.log(`Total KG nodes: ${kg['@graph'].length}`);
    console.log(`Capsule: ${capsulePath}`);
    console.log('');
    console.log('GloveBox created! 🚗\\n');

  } catch (err) {
    console.error(`\\n✗ Pipeline failed: ${err.message}\\n`);
    process.exit(1);
  }
}

run();
