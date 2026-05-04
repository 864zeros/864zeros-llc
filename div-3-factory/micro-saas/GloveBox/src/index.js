#!/usr/bin/env node
/**
 * GLOVEBOX CLI Entry Point
 * Your Car, As an Agent
 *
 * Usage:
 *   node src/index.js create --vin <VIN> [--mileage <miles>]
 *   node src/index.js refresh --vin <VIN>
 *   node src/index.js info --vin <VIN>
 *   node src/index.js ask --vin <VIN> "<question>"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateVIN, getVINLast8 } from './utils/vin-validator.js';
import { decodeVIN, getCachedRaw } from './adapters/nhtsa-vin.js';
import { getRecalls } from './adapters/nhtsa-recalls.js';
import { getComplaints } from './adapters/nhtsa-complaints.js';
import { getSafetyRatings } from './adapters/nhtsa-safety.js';
import { getFuelEconomy } from './adapters/epa-fuel.js';
import { generateMaintenanceSchedule } from './adapters/maintenance-schedule.js';
import { compose, getStats } from './composer/graph-composer.js';
import { narrateKB } from './narrator/kb-narrator.js';
import { generatePersona } from './narrator/persona-gen.js';
import { stampGloveBox, findGloveBoxByVIN } from './capsule/stamper.js';
import { startChat } from './chat/chat-mode.js';

// Load .env file manually (no external deps)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

// Parse command line arguments
function parseArgs(args) {
  const parsed = {
    command: args[0],
    vin: null,
    mileage: 0,
    question: null,
    refresh: false
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--vin' && args[i + 1]) {
      parsed.vin = args[++i];
    } else if (arg === '--mileage' && args[i + 1]) {
      parsed.mileage = parseInt(args[++i], 10) || 0;
    } else if (arg === '--refresh') {
      parsed.refresh = true;
    } else if (!arg.startsWith('--') && parsed.command === 'ask') {
      parsed.question = arg;
    }
  }

  return parsed;
}

// Display help
function showHelp() {
  console.log(`
GLOVEBOX - Your Car, As an Agent
================================

Commands:
  create   Create a new GloveBox from a VIN
  info     Show info about an existing GloveBox
  refresh  Refresh data for an existing GloveBox
  chat     Interactive chat with your car (requires API key)
  ask      Ask a single question (preview mode)

Options:
  --vin <VIN>        Vehicle Identification Number (17 characters)
  --mileage <miles>  Current odometer reading (for maintenance schedule)
  --refresh          Force refresh from APIs (ignore cache)

Environment:
  ANTHROPIC_API_KEY  For chat with Claude
  OPENAI_API_KEY     For chat with GPT-4

Examples:
  node src/index.js create --vin 1HGBH41JXMN109186 --mileage 45230
  node src/index.js info --vin 1HGBH41JXMN109186
  node src/index.js chat --vin 1HGBH41JXMN109186
  node src/index.js ask --vin 1HGBH41JXMN109186 "Do I have any recalls?"
`);
}

// Extract vehicle info from decoded nodes
function extractVehicleInfo(nodes) {
  let make = null, model = null, year = null;

  for (const node of nodes) {
    const field = node['aether:field'];
    const value = node['aether:value'];

    if (field === 'Make') make = value;
    if (field === 'Model') model = value;
    if (field === 'ModelYear') year = value;
  }

  return { make, model, year };
}

// Create command
async function createGloveBox(vin, mileage, refresh) {
  console.log(`\n[glovebox] Validating VIN: ${vin}`);

  // 1. Validate VIN
  const validation = validateVIN(vin);
  if (!validation.valid) {
    console.error(`\n  ✗ Invalid VIN: ${validation.error}\n`);
    process.exit(1);
  }
  console.log('  ✓ VIN valid');

  const normalizedVIN = validation.decoded.vin;

  // 2. Collect data from all sources
  console.log('\n[glovebox] Collecting data from 6 sources...');

  try {
    // NHTSA VIN decode
    const vinNodes = await decodeVIN(normalizedVIN, refresh);
    console.log(`  ├── NHTSA VIN decode: ${vinNodes.length} nodes ✓`);

    // Extract make/model/year for other queries
    const vehicleInfo = extractVehicleInfo(vinNodes);
    const make = vehicleInfo.make || 'Unknown';
    const model = vehicleInfo.model || 'Unknown';
    const year = vehicleInfo.year || '2020';

    // NHTSA recalls
    const recallNodes = await getRecalls(make, model, year, refresh);
    console.log(`  ├── NHTSA recalls: ${recallNodes.length} nodes ✓`);

    // NHTSA complaints
    const complaintNodes = await getComplaints(make, model, year, refresh);
    console.log(`  ├── NHTSA complaints: ${complaintNodes.length} nodes ✓`);

    // NHTSA safety ratings
    const safetyNodes = await getSafetyRatings(year, make, model, refresh);
    console.log(`  ├── NHTSA safety: ${safetyNodes.length} nodes ✓`);

    // EPA fuel economy
    const fuelNodes = await getFuelEconomy(year, make, model, refresh);
    console.log(`  ├── EPA fuel economy: ${fuelNodes.length} nodes ✓`);

    // Maintenance schedule
    const maintenanceNodes = generateMaintenanceSchedule(make, model, year, mileage);
    console.log(`  └── Maintenance schedule: ${maintenanceNodes.length} nodes ✓`);

    // 3. Compose knowledge graph
    console.log('\n[glovebox] Composing knowledge graph...');
    const fragments = [vinNodes, recallNodes, complaintNodes, safetyNodes, fuelNodes, maintenanceNodes];
    const kg = compose(fragments, normalizedVIN);
    const stats = getStats(kg);
    console.log(`  ✓ Composed: ${stats.nodeCount} nodes, ${stats.edgeCount} edges`);

    // 4. Generate KB narrative
    console.log('\n[glovebox] Generating first-person narrative...');
    const kb = await narrateKB(kg, null); // null = use template, no LLM
    console.log('  ✓ KB narrative generated');

    // 5. Generate persona
    console.log('\n[glovebox] Generating car persona...');
    const persona = await generatePersona(kg, make, model, year);
    console.log(`  ✓ Persona: ${persona.vehicle_type} (${persona.voice.tone})`);

    // 6. Stamp capsule
    console.log('\n[glovebox] Stamping AETHER capsule...');
    const result = stampGloveBox(normalizedVIN, kg, kb, persona);
    console.log(`  ✓ Capsule created: ${result.capsulePath}`);

    // Summary
    const identity = `${year} ${make} ${model}`.trim();
    console.log(`
═══════════════════════════════════════════════════════════════
  GloveBox Created Successfully!
═══════════════════════════════════════════════════════════════
  Vehicle:    ${identity}
  VIN:        ${normalizedVIN}
  Mileage:    ${mileage || 'Not specified'}

  KG Nodes:   ${stats.nodeCount}
  KG Edges:   ${stats.edgeCount}

  Capsule:    ${result.capsulePath}

  Files:
    ${result.files.join('\n    ')}
═══════════════════════════════════════════════════════════════
`);

  } catch (err) {
    console.error(`\n  ✗ Error: ${err.message}\n`);
    process.exit(1);
  }
}

// Info command
function showInfo(vin) {
  console.log(`\n[glovebox] Looking up VIN: ${vin}`);

  const validation = validateVIN(vin);
  if (!validation.valid) {
    console.error(`\n  ✗ Invalid VIN: ${validation.error}\n`);
    process.exit(1);
  }

  const capsule = findGloveBoxByVIN(validation.decoded.vin);

  if (!capsule) {
    console.log(`\n  ✗ No GloveBox found for VIN: ${vin}`);
    console.log(`\n  Run: node src/index.js create --vin ${vin}\n`);
    process.exit(1);
  }

  const manifest = capsule.manifest;
  const stats = capsule.kg ? getStats(capsule.kg) : { nodeCount: 0, edgeCount: 0 };

  console.log(`
═══════════════════════════════════════════════════════════════
  GloveBox Info
═══════════════════════════════════════════════════════════════
  Name:       ${manifest.name}
  UID:        ${manifest.uid}
  VIN:        ${manifest.vin}

  Vehicle:    ${manifest.vehicle.year} ${manifest.vehicle.make} ${manifest.vehicle.model}

  KG Nodes:   ${stats.nodeCount}
  KG Edges:   ${stats.edgeCount}

  Created:    ${manifest.created_at}
═══════════════════════════════════════════════════════════════
`);

  if (capsule.persona) {
    console.log(`  Persona:   ${capsule.persona.vehicle_type}`);
    console.log(`  Tone:      ${capsule.persona.voice?.tone || 'N/A'}\n`);
  }
}

// Refresh command
async function refreshGloveBox(vin) {
  console.log(`\n[glovebox] Refreshing data for VIN: ${vin}`);

  const validation = validateVIN(vin);
  if (!validation.valid) {
    console.error(`\n  ✗ Invalid VIN: ${validation.error}\n`);
    process.exit(1);
  }

  const capsule = findGloveBoxByVIN(validation.decoded.vin);

  if (!capsule) {
    console.log(`\n  ✗ No GloveBox found for VIN: ${vin}`);
    console.log(`\n  Run: node src/index.js create --vin ${vin}\n`);
    process.exit(1);
  }

  // Re-create with refresh flag
  await createGloveBox(validation.decoded.vin, 0, true);
}

// Ask command (placeholder - requires AETHER integration)
function askQuestion(vin, question) {
  console.log(`\n[glovebox] Ask feature requires AETHER integration.`);

  const validation = validateVIN(vin);
  if (!validation.valid) {
    console.error(`\n  ✗ Invalid VIN: ${validation.error}\n`);
    process.exit(1);
  }

  const capsule = findGloveBoxByVIN(validation.decoded.vin);

  if (!capsule) {
    console.log(`\n  ✗ No GloveBox found for VIN: ${vin}`);
    console.log(`\n  Run: node src/index.js create --vin ${vin}\n`);
    process.exit(1);
  }

  console.log(`
═══════════════════════════════════════════════════════════════
  Ask Your Car (Preview Mode)
═══════════════════════════════════════════════════════════════
  Vehicle:    ${capsule.manifest.name}
  Question:   "${question}"

  To enable full conversational mode, integrate with AETHER:
    python cli.py run output/glovebox-${capsule.manifest.vin_last8} "${question}"

  For now, here's what I know about myself:
═══════════════════════════════════════════════════════════════
`);

  // Show relevant KB excerpt
  if (capsule.kb) {
    const excerpt = capsule.kb.substring(0, 500);
    console.log(excerpt + (capsule.kb.length > 500 ? '\n...\n' : '\n'));
  }
}

// Main entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const parsed = parseArgs(args);

  if (!parsed.vin && parsed.command !== '--help') {
    console.error('\n  ✗ Error: --vin is required\n');
    showHelp();
    process.exit(1);
  }

  switch (parsed.command) {
    case 'create':
      await createGloveBox(parsed.vin, parsed.mileage, parsed.refresh);
      break;

    case 'info':
      showInfo(parsed.vin);
      break;

    case 'refresh':
      await refreshGloveBox(parsed.vin);
      break;

    case 'chat':
      await startChat(parsed.vin);
      break;

    case 'ask':
      if (!parsed.question) {
        console.error('\n  ✗ Error: Question required for ask command\n');
        process.exit(1);
      }
      askQuestion(parsed.vin, parsed.question);
      break;

    default:
      console.error(`\n  ✗ Unknown command: ${parsed.command}\n`);
      showHelp();
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`\n  ✗ Fatal error: ${err.message}\n`);
  process.exit(1);
});
