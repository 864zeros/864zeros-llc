/**
 * NHTSA Recalls Adapter
 * GET https://api.nhtsa.dot.gov/recalls/recallsByVehicle?make={make}&model={model}&modelYear={year}
 *
 * Returns array of JSON-LD nodes representing open recalls (skill:Rule)
 */

import { getCached, setCache } from '../utils/cache.js';
import { createNode } from '../utils/jsonld-helpers.js';

const NHTSA_RECALLS_API = 'https://api.nhtsa.gov/recalls/recallsByVehicle';

/**
 * Get recalls for a vehicle by make/model/year
 * @param {string} make - Vehicle make (e.g., "Honda")
 * @param {string} model - Vehicle model (e.g., "Civic")
 * @param {number|string} year - Model year
 * @param {boolean} refresh - Force refresh from API
 * @returns {Promise<Array>} Array of JSON-LD nodes typed as skill:Rule
 */
export async function getRecalls(make, model, year, refresh = false) {
  // Normalize inputs
  const normalizedMake = String(make).trim();
  const normalizedModel = String(model).trim();
  const normalizedYear = String(year).trim();

  if (!normalizedMake || !normalizedModel || !normalizedYear) {
    throw new Error('Make, model, and year are required');
  }

  const cacheKey = `${normalizedMake}-${normalizedModel}-${normalizedYear}-nhtsa-recalls`.toLowerCase().replace(/\s+/g, '_');

  // Check cache unless refresh requested
  if (!refresh) {
    const cached = getCached(cacheKey);
    if (cached) {
      return cached.nodes;
    }
  }

  // Build URL with query parameters
  const url = new URL(NHTSA_RECALLS_API);
  url.searchParams.set('make', normalizedMake);
  url.searchParams.set('model', normalizedModel);
  url.searchParams.set('modelYear', normalizedYear);

  let response;
  try {
    response = await fetch(url.toString());
  } catch (err) {
    throw new Error(`NHTSA Recalls API request failed: ${err.message}`);
  }

  // Handle 400 as "no results" (invalid make/model/year)
  if (response.status === 400) {
    // Cache empty result
    setCache(cacheKey, {
      make: normalizedMake,
      model: normalizedModel,
      year: normalizedYear,
      count: 0,
      nodes: [],
      cached_at: new Date().toISOString()
    });
    return [];
  }

  if (!response.ok) {
    throw new Error(`NHTSA Recalls API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // NHTSA returns results in 'results' array
  const results = data.results || [];
  const nodes = [];
  const timestamp = new Date().toISOString();

  for (const recall of results) {
    // Extract campaign number for unique ID
    const campaignNumber = recall.NHTSACampaignNumber || recall.nhtsaCampaignNumber || `unknown_${nodes.length}`;
    const component = recall.Component || recall.component || 'Unknown Component';
    const summary = recall.Summary || recall.summary || '';
    const consequence = recall.Consequence || recall.consequence || '';
    const remedy = recall.Remedy || recall.remedy || '';
    const reportDate = recall.ReportReceivedDate || recall.reportReceivedDate || '';

    // Create short summary for label (first 100 chars)
    const summaryShort = summary.length > 100 ? summary.substring(0, 100) + '...' : summary;

    const node = createNode(
      `recall:${campaignNumber.replace(/\s+/g, '_')}`,
      'skill:Rule',
      `Recall ${campaignNumber}: ${component} — ${summaryShort}`,
      'nhtsa-recall-api',
      {
        'aether:campaign': campaignNumber,
        'aether:component': component,
        'aether:summary': summary,
        'aether:severity': consequence,
        'aether:remedy': remedy,
        'aether:date': reportDate,
        'aether:retrieved': timestamp
      }
    );

    nodes.push(node);
  }

  // Cache the result
  setCache(cacheKey, {
    make: normalizedMake,
    model: normalizedModel,
    year: normalizedYear,
    count: results.length,
    nodes,
    cached_at: timestamp
  });

  return nodes;
}

/**
 * Get recalls by VIN (uses VIN decode first to get make/model/year)
 * @param {string} vin - Vehicle VIN
 * @param {object} decoded - Pre-decoded vehicle info { make, model, year }
 * @returns {Promise<Array>} Array of recall nodes
 */
export async function getRecallsByVIN(vin, decoded) {
  if (!decoded || !decoded.make || !decoded.model || !decoded.year) {
    throw new Error('Decoded vehicle info (make, model, year) required');
  }

  return getRecalls(decoded.make, decoded.model, decoded.year);
}
