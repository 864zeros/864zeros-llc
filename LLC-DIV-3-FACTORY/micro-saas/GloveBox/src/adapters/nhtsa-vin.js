/**
 * NHTSA VIN Decoder Adapter
 * GET https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{vin}?format=json
 *
 * Returns array of JSON-LD nodes representing vehicle specifications
 */

import { validateVIN } from '../utils/vin-validator.js';
import { getCached, setCache } from '../utils/cache.js';
import { createNode } from '../utils/jsonld-helpers.js';

const NHTSA_VIN_API = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues';

// Fields to extract from NHTSA response (map to node IDs)
const EXTRACT_FIELDS = {
  Make: 'make',
  Model: 'model',
  ModelYear: 'modelyear',
  Trim: 'trim',
  BodyClass: 'bodyclass',
  DriveType: 'drivetype',
  EngineConfiguration: 'engine_config',
  EngineCylinders: 'engine_cylinders',
  EngineHP: 'engine_hp',
  DisplacementL: 'displacement',
  FuelTypePrimary: 'fuel_type',
  TransmissionStyle: 'transmission',
  PlantCity: 'plant_city',
  PlantState: 'plant_state',
  PlantCountry: 'plant_country',
  VehicleType: 'vehicle_type',
  GVWR: 'gvwr',
  // Safety equipment
  AirBagLocFront: 'airbag_front',
  AirBagLocSide: 'airbag_side',
  AirBagLocCurtain: 'airbag_curtain',
  ABS: 'abs',
  ESC: 'esc',
  TractionControl: 'traction_control',
  TPMS: 'tpms',
  ForwardCollisionWarning: 'fcw',
  LaneDepartureWarning: 'ldw',
  AdaptiveCruiseControl: 'acc',
  BlindSpotMon: 'blind_spot',
  ParkAssist: 'park_assist',
  RearCrossTrafficAlert: 'rcta',
  AutomaticEmergencyBraking: 'aeb'
};

/**
 * Decode a VIN using NHTSA API
 * @param {string} vin - VIN to decode
 * @param {boolean} refresh - Force refresh from API (ignore cache)
 * @returns {Promise<Array>} Array of JSON-LD nodes
 */
export async function decodeVIN(vin, refresh = false) {
  // Validate VIN first
  const validation = validateVIN(vin);
  if (!validation.valid) {
    throw new Error(`Invalid VIN: ${validation.error}`);
  }

  const normalizedVIN = validation.decoded.vin;
  const cacheKey = `${normalizedVIN}-nhtsa-decode`;

  // Check cache unless refresh requested
  if (!refresh) {
    const cached = getCached(cacheKey);
    if (cached) {
      return cached.nodes;
    }
  }

  // Fetch from NHTSA API
  const url = `${NHTSA_VIN_API}/${normalizedVIN}?format=json`;

  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new Error(`NHTSA API request failed: ${err.message}`);
  }

  if (!response.ok) {
    throw new Error(`NHTSA API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // NHTSA returns Results array with single object
  if (!data.Results || !data.Results[0]) {
    throw new Error('NHTSA API returned no results');
  }

  const result = data.Results[0];

  // Check for error code (bad VIN)
  if (result.ErrorCode && result.ErrorCode !== '0') {
    const errorText = result.ErrorText || 'Unknown error';
    // Error codes 1-5 indicate VIN issues, but partial data may still be returned
    if (result.ErrorCode.includes('1') || result.ErrorCode.includes('11')) {
      throw new Error(`NHTSA VIN decode error: ${errorText}`);
    }
  }

  // Convert relevant fields to JSON-LD nodes
  const nodes = [];
  const timestamp = new Date().toISOString();

  for (const [apiField, nodeId] of Object.entries(EXTRACT_FIELDS)) {
    const value = result[apiField];

    // Skip empty/null values
    if (!value || value === 'Not Applicable' || value === 'null') {
      continue;
    }

    const node = createNode(
      `spec:${nodeId}`,
      'skill:Concept',
      `${apiField}: ${value}`,
      'nhtsa-vin-api',
      {
        'aether:field': apiField,
        'aether:value': value,
        'aether:retrieved': timestamp
      }
    );

    nodes.push(node);
  }

  // Add vehicle identity node
  const year = result.ModelYear || '';
  const make = result.Make || '';
  const model = result.Model || '';
  const trim = result.Trim || '';

  const identityLabel = [year, make, model, trim].filter(Boolean).join(' ');

  nodes.unshift(createNode(
    `vehicle:${normalizedVIN}`,
    'skill:Concept',
    identityLabel || `Vehicle ${normalizedVIN}`,
    'nhtsa-vin-api',
    {
      'aether:vin': normalizedVIN,
      'aether:retrieved': timestamp
    }
  ));

  // Cache the result (raw response + nodes)
  setCache(cacheKey, {
    vin: normalizedVIN,
    raw: result,
    nodes,
    cached_at: timestamp
  });

  return nodes;
}

/**
 * Get cached raw NHTSA response for a VIN
 * @param {string} vin - VIN to lookup
 * @returns {object|null} Raw NHTSA response or null
 */
export function getCachedRaw(vin) {
  const validation = validateVIN(vin);
  if (!validation.valid) return null;

  const cacheKey = `${validation.decoded.vin}-nhtsa-decode`;
  const cached = getCached(cacheKey);
  return cached?.raw || null;
}
