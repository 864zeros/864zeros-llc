/**
 * Persona Generator
 * Generates vehicle-appropriate personality for the car agent
 *
 * Rules by vehicle type:
 * - Sports cars → confident, performance-focused
 * - Family SUVs → protective, safety-conscious
 * - Trucks → tough, capable, no-nonsense
 * - Luxury → refined, detail-oriented
 * - Economy → practical, efficient, value-conscious
 * - Electric → progressive, tech-forward
 */

// Vehicle type detection patterns
const VEHICLE_PATTERNS = {
  sports: {
    makes: ['ferrari', 'lamborghini', 'porsche', 'corvette', 'mustang', 'camaro', 'challenger', 'supra', 'miata', '370z', 'gt-r', 'wrx', 'sti', 'type r', 'm3', 'm4', 'amg'],
    bodyClasses: ['coupe', 'convertible', 'roadster', 'sports car'],
    traits: ['confident', 'performance-driven', 'spirited', 'precise'],
    tone: 'enthusiastic and proud',
    style: 'Direct and energetic. Uses performance metaphors. Talks about driving dynamics.'
  },
  truck: {
    makes: ['f-150', 'f-250', 'f-350', 'silverado', 'sierra', 'ram', 'tundra', 'titan', 'tacoma', 'colorado', 'ranger', 'gladiator', 'ridgeline', 'frontier'],
    bodyClasses: ['truck', 'pickup', 'chassis cab'],
    traits: ['reliable', 'tough', 'capable', 'straightforward'],
    tone: 'no-nonsense and dependable',
    style: 'Plain-spoken and practical. Emphasizes capability and work ethic.'
  },
  suv: {
    makes: ['explorer', 'tahoe', 'suburban', 'expedition', 'highlander', 'pilot', 'pathfinder', '4runner', 'grand cherokee', 'wrangler'],
    bodyClasses: ['suv', 'sport utility', 'crossover'],
    traits: ['versatile', 'protective', 'adventurous', 'family-oriented'],
    tone: 'warm and reassuring',
    style: 'Friendly and supportive. Emphasizes safety and family adventures.'
  },
  luxury: {
    makes: ['mercedes', 'bmw', 'audi', 'lexus', 'infiniti', 'acura', 'cadillac', 'lincoln', 'genesis', 'bentley', 'rolls-royce', 'maserati', 'jaguar'],
    bodyClasses: ['sedan', 'luxury'],
    traits: ['sophisticated', 'refined', 'meticulous', 'graceful'],
    tone: 'elegant and composed',
    style: 'Refined and articulate. Appreciates quality and craftsmanship.'
  },
  electric: {
    makes: ['tesla', 'rivian', 'lucid', 'polestar', 'bolt', 'leaf', 'ioniq', 'mach-e', 'id.4', 'ev6', 'model 3', 'model y', 'model s', 'model x'],
    fuelTypes: ['electric', 'battery electric', 'bev'],
    traits: ['innovative', 'efficient', 'tech-forward', 'eco-conscious'],
    tone: 'modern and optimistic',
    style: 'Tech-savvy and forward-thinking. Talks about efficiency and sustainability.'
  },
  economy: {
    makes: ['civic', 'corolla', 'camry', 'accord', 'elantra', 'sentra', 'mazda3', 'impreza', 'forte', 'jetta', 'golf'],
    bodyClasses: ['sedan', 'hatchback', 'compact'],
    traits: ['practical', 'reliable', 'efficient', 'sensible'],
    tone: 'friendly and helpful',
    style: 'Down-to-earth and practical. Values reliability and fuel economy.'
  }
};

/**
 * Detect vehicle type from make, model, body class, and fuel type
 */
function detectVehicleType(make, model, bodyClass, fuelType) {
  const searchText = `${make} ${model} ${bodyClass}`.toLowerCase();
  const fuel = (fuelType || '').toLowerCase();

  // Check electric first (fuel type is definitive)
  if (fuel.includes('electric') || fuel.includes('battery')) {
    return 'electric';
  }

  // Check patterns
  for (const [type, patterns] of Object.entries(VEHICLE_PATTERNS)) {
    // Check makes
    if (patterns.makes?.some(m => searchText.includes(m.toLowerCase()))) {
      return type;
    }

    // Check body classes
    if (patterns.bodyClasses?.some(bc => searchText.includes(bc.toLowerCase()))) {
      return type;
    }

    // Check fuel types
    if (patterns.fuelTypes?.some(ft => fuel.includes(ft.toLowerCase()))) {
      return type;
    }
  }

  // Default to economy for compact cars, suv for larger vehicles
  if (bodyClass?.toLowerCase().includes('compact') ||
      bodyClass?.toLowerCase().includes('sedan') ||
      bodyClass?.toLowerCase().includes('hatchback')) {
    return 'economy';
  }

  return 'suv'; // Safe default for most vehicles
}

/**
 * Extract vehicle info from KG for persona generation
 */
function extractVehicleInfo(kg) {
  const nodes = kg['@graph'] || [];
  let make = null, model = null, year = null, bodyClass = null, fuelType = null;

  for (const node of nodes) {
    const field = node['aether:field'];
    const value = node['aether:value'];

    if (field === 'Make') make = value;
    if (field === 'Model') model = value;
    if (field === 'ModelYear') year = value;
    if (field === 'BodyClass') bodyClass = value;
    if (field === 'FuelTypePrimary') fuelType = value;

    // Also check vehicle node
    if (node['@id']?.startsWith('vehicle:')) {
      make = make || node['aether:make'];
      model = model || node['aether:model'];
      year = year || node['aether:year'];
    }
  }

  return { make, model, year, bodyClass, fuelType };
}

/**
 * Generate persona for a vehicle
 * @param {object} kg - Composed knowledge graph
 * @param {string} make - Vehicle make (optional, will extract from KG)
 * @param {string} model - Vehicle model (optional, will extract from KG)
 * @param {number|string} year - Model year (optional, will extract from KG)
 * @returns {Promise<object>} persona.json content
 */
export async function generatePersona(kg, make, model, year) {
  // Extract info from KG if not provided
  const vehicleInfo = extractVehicleInfo(kg);
  make = make || vehicleInfo.make || 'Unknown';
  model = model || vehicleInfo.model || 'Vehicle';
  year = year || vehicleInfo.year || '';

  // Detect vehicle type
  const vehicleType = detectVehicleType(
    make,
    model,
    vehicleInfo.bodyClass,
    vehicleInfo.fuelType
  );

  const typeConfig = VEHICLE_PATTERNS[vehicleType] || VEHICLE_PATTERNS.economy;

  // Build persona name
  const identity = `${year} ${make} ${model}`.trim();
  const personaName = `Your ${identity}`;

  // Build persona object
  const persona = {
    persona_name: personaName,
    persona_type: 'vehicle_agent',
    vehicle_type: vehicleType,
    identity: {
      make,
      model,
      year: year || null,
      body_class: vehicleInfo.bodyClass || null,
      fuel_type: vehicleInfo.fuelType || null
    },
    voice: {
      tone: typeConfig.tone,
      style: typeConfig.style,
      traits: typeConfig.traits,
      perspective: 'first-person',
      speaks_as: 'the vehicle itself'
    },
    boundaries: {
      authoritative_on: [
        'this specific vehicle',
        `VIN: ${kg['aether:vin'] || 'this vehicle'}`,
        'vehicle specifications',
        'maintenance schedule',
        'recall status',
        'known issues for this model'
      ],
      not_authoritative_on: [
        'other vehicles',
        'mechanical repair procedures',
        'parts pricing',
        'dealer recommendations',
        'insurance matters',
        'legal advice'
      ],
      defers_to: [
        'certified mechanics',
        'dealer service departments',
        'manufacturer documentation'
      ]
    },
    interaction_style: {
      greeting: `Hello! I'm your ${identity}. How can I help you today?`,
      when_uncertain: 'I would recommend checking with a certified mechanic or your dealer for that.',
      when_asked_about_other_cars: 'I can only speak about myself with confidence. You might want to consult a resource specific to that vehicle.',
      when_maintenance_due: 'Based on my records, it might be time for some maintenance. Let me tell you what I know.'
    },
    created_at: new Date().toISOString()
  };

  return persona;
}
