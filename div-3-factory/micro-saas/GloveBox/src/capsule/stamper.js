/**
 * Capsule Stamper
 * Produces the 5-file AETHER capsule directory
 *
 * Output structure:
 *   output/glovebox-{vin_last8}/
 *     ├── glovebox-{vin_last8}-manifest.json
 *     ├── glovebox-{vin_last8}-definition.json
 *     ├── glovebox-{vin_last8}-persona.json
 *     ├── glovebox-{vin_last8}-kb.md
 *     └── glovebox-{vin_last8}-kg.jsonld
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_DIR = path.resolve(__dirname, '../../output');

/**
 * Generate a short hash for the manifest UID
 */
function generateHash(data) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')
    .substring(0, 8);
}

/**
 * Extract vehicle info from KG for manifest
 */
function extractVehicleInfo(kg) {
  const nodes = kg['@graph'] || [];
  let make = null, model = null, year = null;

  // First pass: look for spec nodes with Make/Model/ModelYear fields
  for (const node of nodes) {
    const field = node['aether:field'];
    const value = node['aether:value'];

    if (field === 'Make' && value) make = value;
    if (field === 'Model' && value) model = value;
    if (field === 'ModelYear' && value) year = value;

    // Also check vehicle node properties
    if (node['@id']?.startsWith('vehicle:')) {
      if (node['aether:make']) make = make || node['aether:make'];
      if (node['aether:model']) model = model || node['aether:model'];
      if (node['aether:year']) year = year || node['aether:year'];
    }
  }

  return { make, model, year };
}

/**
 * Create manifest.json content
 */
function createManifest(vin, kg, vinLast8) {
  const vehicleInfo = extractVehicleInfo(kg);
  const identity = [vehicleInfo.year, vehicleInfo.make, vehicleInfo.model].filter(Boolean).join(' ');
  const hash = generateHash({ vin, timestamp: Date.now() });

  return {
    uid: `glovebox-${vinLast8}-v1.0.0-${hash}`,
    name: `GloveBox: ${identity || vin}`,
    version: '1.0.0',
    type: 'glovebox',
    vin: vin,
    vin_last8: vinLast8,
    vehicle: {
      make: vehicleInfo.make || null,
      model: vehicleInfo.model || null,
      year: vehicleInfo.year || null
    },
    files: {
      manifest: `glovebox-${vinLast8}-manifest.json`,
      definition: `glovebox-${vinLast8}-definition.json`,
      persona: `glovebox-${vinLast8}-persona.json`,
      kb: `glovebox-${vinLast8}-kb.md`,
      kg: `glovebox-${vinLast8}-kg.jsonld`
    },
    created_at: new Date().toISOString(),
    framework: {
      name: 'AETHER',
      version: '1.0.0',
      company: '864zeros LLC'
    }
  };
}

/**
 * Create definition.json content
 */
function createDefinition(vin, kg, vinLast8) {
  const vehicleInfo = extractVehicleInfo(kg);
  const identity = [vehicleInfo.year, vehicleInfo.make, vehicleInfo.model].filter(Boolean).join(' ');

  return {
    agent_type: 'advisor',
    domain: 'vehicle',
    description: `First-person AI agent representing a specific ${identity || 'vehicle'}`,
    vin: vin,
    domain_boundaries: {
      authoritative: [
        'this specific vehicle',
        `VIN ${vin}`,
        'vehicle specifications from NHTSA',
        'open recalls from NHTSA',
        'known complaints from NHTSA',
        'fuel economy from EPA',
        'safety ratings from NHTSA',
        'manufacturer maintenance schedule'
      ],
      out_of_scope: [
        'other vehicles',
        'mechanical repair procedures',
        'specific repair costs',
        'dealer recommendations',
        'parts sourcing',
        'insurance claims',
        'legal matters'
      ]
    },
    stages: {
      distill: true,
      augment: true,
      generate: true,
      review: true
    },
    aec_threshold: 0.8,
    impulses: [
      {
        trigger: 'schedule:weekly',
        action: 'check_recalls',
        description: 'Check for new NHTSA recalls weekly'
      },
      {
        trigger: 'schedule:monthly',
        action: 'check_complaints',
        description: 'Check for new NHTSA complaints monthly'
      },
      {
        trigger: 'event:mileage_update',
        action: 'recalculate_maintenance',
        description: 'Recalculate maintenance schedule when mileage is updated'
      }
    ],
    data_sources: [
      { name: 'NHTSA VIN Decoder', type: 'api', refresh: 'on_create' },
      { name: 'NHTSA Recalls', type: 'api', refresh: 'weekly' },
      { name: 'NHTSA Complaints', type: 'api', refresh: 'monthly' },
      { name: 'NHTSA Safety Ratings', type: 'api', refresh: 'on_create' },
      { name: 'EPA Fuel Economy', type: 'api', refresh: 'on_create' },
      { name: 'Manufacturer Maintenance Schedule', type: 'static', refresh: 'never' }
    ],
    created_at: new Date().toISOString()
  };
}

/**
 * Stamp a GloveBox capsule to disk
 *
 * @param {string} vin - Full VIN
 * @param {object} kg - Composed knowledge graph (JSON-LD)
 * @param {string} kb - Knowledge base narrative (markdown)
 * @param {object} persona - Persona configuration
 * @param {string} outputDir - Output directory (default: ./output)
 * @returns {object} Info about the stamped capsule
 */
export function stampGloveBox(vin, kg, kb, persona, outputDir = DEFAULT_OUTPUT_DIR) {
  // Validate inputs
  if (!vin || vin.length !== 17) {
    throw new Error('Valid 17-character VIN required');
  }
  if (!kg || !kg['@graph']) {
    throw new Error('Valid knowledge graph required');
  }

  // Extract last 8 characters of VIN for directory name
  const vinLast8 = vin.slice(-8);
  const capsuleName = `glovebox-${vinLast8}`;
  const capsulePath = path.join(outputDir, capsuleName);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create capsule directory
  if (!fs.existsSync(capsulePath)) {
    fs.mkdirSync(capsulePath, { recursive: true });
  }

  // Generate manifest and definition
  const manifest = createManifest(vin, kg, vinLast8);
  const definition = createDefinition(vin, kg, vinLast8);

  // File paths
  const files = {
    manifest: path.join(capsulePath, `glovebox-${vinLast8}-manifest.json`),
    definition: path.join(capsulePath, `glovebox-${vinLast8}-definition.json`),
    persona: path.join(capsulePath, `glovebox-${vinLast8}-persona.json`),
    kb: path.join(capsulePath, `glovebox-${vinLast8}-kb.md`),
    kg: path.join(capsulePath, `glovebox-${vinLast8}-kg.jsonld`)
  };

  // Write files
  fs.writeFileSync(files.manifest, JSON.stringify(manifest, null, 2), 'utf-8');
  fs.writeFileSync(files.definition, JSON.stringify(definition, null, 2), 'utf-8');
  fs.writeFileSync(files.persona, JSON.stringify(persona, null, 2), 'utf-8');
  fs.writeFileSync(files.kb, kb, 'utf-8');
  fs.writeFileSync(files.kg, JSON.stringify(kg, null, 2), 'utf-8');

  return {
    success: true,
    capsulePath,
    capsuleName,
    vin,
    vinLast8,
    files: Object.keys(files).map(key => path.basename(files[key])),
    manifest
  };
}

/**
 * Load an existing GloveBox capsule from disk
 */
export function loadGloveBox(capsulePath) {
  if (!fs.existsSync(capsulePath)) {
    throw new Error(`Capsule not found: ${capsulePath}`);
  }

  // Find manifest file
  const files = fs.readdirSync(capsulePath);
  const manifestFile = files.find(f => f.endsWith('-manifest.json'));

  if (!manifestFile) {
    throw new Error('Manifest file not found in capsule');
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(capsulePath, manifestFile), 'utf-8'));

  // Load other files based on manifest
  const capsule = { manifest };

  if (manifest.files.definition) {
    const defPath = path.join(capsulePath, manifest.files.definition);
    if (fs.existsSync(defPath)) {
      capsule.definition = JSON.parse(fs.readFileSync(defPath, 'utf-8'));
    }
  }

  if (manifest.files.persona) {
    const personaPath = path.join(capsulePath, manifest.files.persona);
    if (fs.existsSync(personaPath)) {
      capsule.persona = JSON.parse(fs.readFileSync(personaPath, 'utf-8'));
    }
  }

  if (manifest.files.kb) {
    const kbPath = path.join(capsulePath, manifest.files.kb);
    if (fs.existsSync(kbPath)) {
      capsule.kb = fs.readFileSync(kbPath, 'utf-8');
    }
  }

  if (manifest.files.kg) {
    const kgPath = path.join(capsulePath, manifest.files.kg);
    if (fs.existsSync(kgPath)) {
      capsule.kg = JSON.parse(fs.readFileSync(kgPath, 'utf-8'));
    }
  }

  return capsule;
}

/**
 * Find GloveBox capsule by VIN
 */
export function findGloveBoxByVIN(vin, outputDir = DEFAULT_OUTPUT_DIR) {
  if (!fs.existsSync(outputDir)) {
    return null;
  }

  const vinLast8 = vin.slice(-8);
  const capsuleName = `glovebox-${vinLast8}`;
  const capsulePath = path.join(outputDir, capsuleName);

  if (fs.existsSync(capsulePath)) {
    return loadGloveBox(capsulePath);
  }

  return null;
}
