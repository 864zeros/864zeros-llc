/**
 * EPA Fuel Economy Adapter
 * Uses fueleconomy.gov REST API to get fuel economy data
 *
 * API Flow:
 * 1. GET /vehicle/menu/model?year={year}&make={make} → list of models
 * 2. GET /vehicle/menu/options?year={year}&make={make}&model={model} → vehicle IDs
 * 3. GET /vehicle/{id} → detailed fuel economy data
 *
 * Returns array of JSON-LD nodes representing fuel economy (skill:Concept)
 */

import { getCached, setCache } from '../utils/cache.js';
import { createNode } from '../utils/jsonld-helpers.js';

const EPA_API_BASE = 'https://www.fueleconomy.gov/ws/rest';

/**
 * Fetch from EPA API with JSON headers
 */
async function epaFetch(endpoint) {
  const url = `${EPA_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`EPA API returned ${response.status}`);
  }

  return response.json();
}

/**
 * Find matching model in EPA database (handles model variants)
 * @param {number} year - Model year
 * @param {string} make - Vehicle make
 * @param {string} model - Vehicle model (may be partial, e.g., "Civic")
 * @returns {Promise<string|null>} Matching EPA model name or null
 */
async function findMatchingModel(year, make, model) {
  try {
    const data = await epaFetch(`/vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`);
    const models = data.menuItem || [];

    // Exact match first
    const exactMatch = models.find(m => m.value.toLowerCase() === model.toLowerCase());
    if (exactMatch) return exactMatch.value;

    // Partial match (model starts with input, e.g., "Civic" matches "Civic 4Dr")
    const partialMatch = models.find(m => m.value.toLowerCase().startsWith(model.toLowerCase()));
    if (partialMatch) return partialMatch.value;

    // Contains match
    const containsMatch = models.find(m => m.value.toLowerCase().includes(model.toLowerCase()));
    if (containsMatch) return containsMatch.value;

    return null;
  } catch {
    return null;
  }
}

/**
 * Get vehicle options/IDs for a specific year/make/model
 */
async function getVehicleOptions(year, make, model) {
  const data = await epaFetch(
    `/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
  );
  return data.menuItem || [];
}

/**
 * Get detailed vehicle data by ID
 */
async function getVehicleDetails(vehicleId) {
  return epaFetch(`/vehicle/${vehicleId}`);
}

/**
 * Get fuel economy data for a vehicle
 * @param {number|string} year - Model year
 * @param {string} make - Vehicle make (e.g., "Honda")
 * @param {string} model - Vehicle model (e.g., "Civic")
 * @param {boolean} refresh - Force refresh from API
 * @returns {Promise<Array>} Array of JSON-LD nodes
 */
export async function getFuelEconomy(year, make, model, refresh = false) {
  const normalizedYear = String(year).trim();
  const normalizedMake = String(make).trim();
  const normalizedModel = String(model).trim();

  if (!normalizedYear || !normalizedMake || !normalizedModel) {
    throw new Error('Year, make, and model are required');
  }

  const cacheKey = `${normalizedYear}-${normalizedMake}-${normalizedModel}-epa-fuel`.toLowerCase().replace(/\s+/g, '_');

  // Check cache
  if (!refresh) {
    const cached = getCached(cacheKey);
    if (cached) {
      return cached.nodes;
    }
  }

  const timestamp = new Date().toISOString();

  // Find matching model in EPA database
  const matchedModel = await findMatchingModel(normalizedYear, normalizedMake, normalizedModel);

  if (!matchedModel) {
    // No matching model found - cache empty result
    setCache(cacheKey, {
      year: normalizedYear,
      make: normalizedMake,
      model: normalizedModel,
      nodes: [],
      cached_at: timestamp
    });
    return [];
  }

  // Get vehicle options
  const options = await getVehicleOptions(normalizedYear, normalizedMake, matchedModel);

  if (!options.length) {
    setCache(cacheKey, {
      year: normalizedYear,
      make: normalizedMake,
      model: normalizedModel,
      nodes: [],
      cached_at: timestamp
    });
    return [];
  }

  // Get details for first option (most common configuration)
  const vehicleId = options[0].value;
  const details = await getVehicleDetails(vehicleId);

  // Extract fuel economy data
  const cityMpg = parseInt(details.city08, 10) || 0;
  const highwayMpg = parseInt(details.highway08, 10) || 0;
  const combinedMpg = parseInt(details.comb08, 10) || 0;
  const annualFuelCost = parseInt(details.fuelCost08, 10) || 0;
  const co2Emissions = parseInt(details.co2, 10) || 0;
  const fuelType = details.fuelType1 || details.fuelType || 'Unknown';
  const feScore = parseInt(details.feScore, 10) || 0;
  const ghgScore = parseInt(details.ghgScore, 10) || 0;

  // Create fuel economy node
  const nodes = [];

  const fuelNode = createNode(
    'fuel:economy',
    'skill:Concept',
    `Fuel Economy: ${cityMpg} city / ${highwayMpg} highway / ${combinedMpg} combined MPG`,
    'epa-fuel-api',
    {
      'aether:city_mpg': cityMpg,
      'aether:highway_mpg': highwayMpg,
      'aether:combined_mpg': combinedMpg,
      'aether:annual_fuel_cost': annualFuelCost,
      'aether:co2_grams_per_mile': co2Emissions,
      'aether:fuel_type': fuelType,
      'aether:epa_fuel_economy_score': feScore,
      'aether:epa_ghg_score': ghgScore,
      'aether:vehicle_class': details.VClass || '',
      'aether:drive_type': details.drive || '',
      'aether:transmission': details.trany || '',
      'aether:epa_vehicle_id': vehicleId,
      'aether:retrieved': timestamp
    }
  );

  nodes.push(fuelNode);

  // Add emissions rating node if available
  if (feScore > 0) {
    const emissionsNode = createNode(
      'fuel:emissions',
      'skill:Concept',
      `EPA Ratings: ${feScore}/10 fuel economy, ${ghgScore}/10 greenhouse gas`,
      'epa-fuel-api',
      {
        'aether:fuel_economy_score': feScore,
        'aether:ghg_score': ghgScore,
        'aether:retrieved': timestamp
      }
    );
    nodes.push(emissionsNode);
  }

  // Cache the result
  setCache(cacheKey, {
    year: normalizedYear,
    make: normalizedMake,
    model: normalizedModel,
    matched_model: matchedModel,
    vehicle_id: vehicleId,
    raw: details,
    nodes,
    cached_at: timestamp
  });

  return nodes;
}

/**
 * Get fuel economy by VIN (uses pre-decoded vehicle info)
 * @param {string} vin - Vehicle VIN
 * @param {object} decoded - Pre-decoded vehicle info { make, model, year }
 * @returns {Promise<Array>} Array of fuel economy nodes
 */
export async function getFuelEconomyByVIN(vin, decoded) {
  if (!decoded || !decoded.make || !decoded.model || !decoded.year) {
    throw new Error('Decoded vehicle info (make, model, year) required');
  }

  return getFuelEconomy(decoded.year, decoded.make, decoded.model);
}
