/**
 * NHTSA Safety Ratings Adapter
 * GET https://api.nhtsa.gov/SafetyRatings/modelyear/{year}/make/{make}/model/{model}
 * GET https://api.nhtsa.gov/SafetyRatings/VehicleId/{id}
 *
 * Returns array of JSON-LD nodes representing safety ratings (skill:Concept)
 */

import { getCached, setCache } from '../utils/cache.js';
import { createNode } from '../utils/jsonld-helpers.js';

const NHTSA_SAFETY_API = 'https://api.nhtsa.gov/SafetyRatings';

/**
 * Get safety ratings for a vehicle
 * @param {number|string} year - Model year
 * @param {string} make - Vehicle make (e.g., "Honda")
 * @param {string} model - Vehicle model (e.g., "Civic")
 * @param {boolean} refresh - Force refresh from API
 * @returns {Promise<Array>} Array of JSON-LD nodes
 */
export async function getSafetyRatings(year, make, model, refresh = false) {
  const normalizedYear = String(year).trim();
  const normalizedMake = String(make).trim();
  const normalizedModel = String(model).trim();

  if (!normalizedYear || !normalizedMake || !normalizedModel) {
    throw new Error('Year, make, and model are required');
  }

  const cacheKey = `${normalizedYear}-${normalizedMake}-${normalizedModel}-nhtsa-safety`.toLowerCase().replace(/\s+/g, '_');

  // Check cache
  if (!refresh) {
    const cached = getCached(cacheKey);
    if (cached) {
      return cached.nodes;
    }
  }

  const timestamp = new Date().toISOString();

  // First, get list of vehicle variants for this year/make/model
  const listUrl = `${NHTSA_SAFETY_API}/modelyear/${normalizedYear}/make/${encodeURIComponent(normalizedMake)}/model/${encodeURIComponent(normalizedModel)}`;

  let listResponse;
  try {
    listResponse = await fetch(listUrl);
  } catch (err) {
    throw new Error(`NHTSA Safety API request failed: ${err.message}`);
  }

  // Handle 400/404 as "no ratings available"
  if (listResponse.status === 400 || listResponse.status === 404) {
    setCache(cacheKey, {
      year: normalizedYear,
      make: normalizedMake,
      model: normalizedModel,
      nodes: [],
      cached_at: timestamp
    });
    return [];
  }

  if (!listResponse.ok) {
    throw new Error(`NHTSA Safety API returned ${listResponse.status}`);
  }

  const listData = await listResponse.json();
  const vehicles = listData.Results || [];

  if (!vehicles.length) {
    setCache(cacheKey, {
      year: normalizedYear,
      make: normalizedMake,
      model: normalizedModel,
      nodes: [],
      cached_at: timestamp
    });
    return [];
  }

  // Get detailed ratings for first vehicle (most common variant)
  const vehicleId = vehicles[0].VehicleId;
  const detailUrl = `${NHTSA_SAFETY_API}/VehicleId/${vehicleId}`;

  let detailResponse;
  try {
    detailResponse = await fetch(detailUrl);
  } catch (err) {
    throw new Error(`NHTSA Safety details request failed: ${err.message}`);
  }

  if (!detailResponse.ok) {
    // Return basic info if details unavailable
    const basicNode = createNode(
      'safety:overall',
      'skill:Concept',
      `Safety ratings available for ${vehicles.length} variant(s)`,
      'nhtsa-safety-api',
      {
        'aether:variants': vehicles.length,
        'aether:retrieved': timestamp
      }
    );

    setCache(cacheKey, {
      year: normalizedYear,
      make: normalizedMake,
      model: normalizedModel,
      nodes: [basicNode],
      cached_at: timestamp
    });

    return [basicNode];
  }

  const detailData = await detailResponse.json();
  const ratings = detailData.Results?.[0] || {};

  // Parse ratings (they come as strings)
  const overall = parseInt(ratings.OverallRating, 10) || 0;
  const frontal = parseInt(ratings.OverallFrontCrashRating, 10) || 0;
  const side = parseInt(ratings.OverallSideCrashRating, 10) || 0;
  const rollover = parseInt(ratings.RolloverRating, 10) || 0;
  const rolloverRisk = parseFloat(ratings.RolloverPossibility) || 0;

  // Build label based on available ratings
  let ratingLabel = '';
  if (overall) ratingLabel += `${overall} stars overall`;
  if (frontal) ratingLabel += `, ${frontal} frontal`;
  if (side) ratingLabel += `, ${side} side`;
  if (rollover) ratingLabel += `, ${rollover} rollover`;

  if (!ratingLabel) {
    ratingLabel = 'Safety data not fully available';
  }

  const safetyNode = createNode(
    'safety:overall',
    'skill:Concept',
    `Safety: ${ratingLabel}`,
    'nhtsa-safety-api',
    {
      'aether:overall_rating': overall || null,
      'aether:frontal_rating': frontal || null,
      'aether:side_rating': side || null,
      'aether:rollover_rating': rollover || null,
      'aether:rollover_risk_percent': rolloverRisk ? Math.round(rolloverRisk * 100) : null,
      'aether:vehicle_id': vehicleId,
      'aether:vehicle_description': vehicles[0].VehicleDescription || '',
      'aether:retrieved': timestamp
    }
  );

  const nodes = [safetyNode];

  // Cache the result
  setCache(cacheKey, {
    year: normalizedYear,
    make: normalizedMake,
    model: normalizedModel,
    vehicle_id: vehicleId,
    raw: ratings,
    nodes,
    cached_at: timestamp
  });

  return nodes;
}

/**
 * Get safety ratings by VIN (uses pre-decoded vehicle info)
 * @param {string} vin - Vehicle VIN
 * @param {object} decoded - Pre-decoded vehicle info { make, model, year }
 * @returns {Promise<Array>} Array of safety rating nodes
 */
export async function getSafetyRatingsByVIN(vin, decoded) {
  if (!decoded || !decoded.make || !decoded.model || !decoded.year) {
    throw new Error('Decoded vehicle info (make, model, year) required');
  }

  return getSafetyRatings(decoded.year, decoded.make, decoded.model);
}
