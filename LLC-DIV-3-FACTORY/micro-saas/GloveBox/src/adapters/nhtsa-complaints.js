/**
 * NHTSA Complaints Adapter
 * GET https://api.nhtsa.gov/complaints/complaintsByVehicle?make={make}&model={model}&modelYear={year}
 *
 * Returns array of JSON-LD nodes representing known problems (skill:AntiPattern)
 * Complaints are aggregated by component to avoid creating hundreds of individual nodes
 */

import { getCached, setCache } from '../utils/cache.js';
import { createNode } from '../utils/jsonld-helpers.js';

const NHTSA_COMPLAINTS_API = 'https://api.nhtsa.gov/complaints/complaintsByVehicle';

/**
 * Get complaints for a vehicle by make/model/year
 * @param {string} make - Vehicle make (e.g., "Honda")
 * @param {string} model - Vehicle model (e.g., "Civic")
 * @param {number|string} year - Model year
 * @param {boolean} refresh - Force refresh from API
 * @returns {Promise<Array>} Array of JSON-LD nodes typed as skill:AntiPattern
 */
export async function getComplaints(make, model, year, refresh = false) {
  // Normalize inputs
  const normalizedMake = String(make).trim();
  const normalizedModel = String(model).trim();
  const normalizedYear = String(year).trim();

  if (!normalizedMake || !normalizedModel || !normalizedYear) {
    throw new Error('Make, model, and year are required');
  }

  const cacheKey = `${normalizedMake}-${normalizedModel}-${normalizedYear}-nhtsa-complaints`.toLowerCase().replace(/\s+/g, '_');

  // Check cache unless refresh requested
  if (!refresh) {
    const cached = getCached(cacheKey);
    if (cached) {
      return cached.nodes;
    }
  }

  // Build URL with query parameters
  const url = new URL(NHTSA_COMPLAINTS_API);
  url.searchParams.set('make', normalizedMake);
  url.searchParams.set('model', normalizedModel);
  url.searchParams.set('modelYear', normalizedYear);

  let response;
  try {
    response = await fetch(url.toString());
  } catch (err) {
    throw new Error(`NHTSA Complaints API request failed: ${err.message}`);
  }

  // Handle 400 as "no results" (invalid make/model/year)
  if (response.status === 400) {
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
    throw new Error(`NHTSA Complaints API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // NHTSA returns results in 'results' array
  const results = data.results || [];
  const timestamp = new Date().toISOString();

  // Aggregate complaints by component
  const componentMap = new Map();

  for (const complaint of results) {
    const component = complaint.components || complaint.Component || 'UNKNOWN';
    const crash = complaint.crash || false;
    const fire = complaint.fire || false;
    const summary = complaint.summary || complaint.Summary || '';

    if (!componentMap.has(component)) {
      componentMap.set(component, {
        count: 0,
        crashes: 0,
        fires: 0,
        summaries: []
      });
    }

    const entry = componentMap.get(component);
    entry.count++;
    if (crash) entry.crashes++;
    if (fire) entry.fires++;

    // Keep first 3 summaries as examples
    if (entry.summaries.length < 3 && summary) {
      entry.summaries.push(summary.substring(0, 200));
    }
  }

  // Convert aggregated data to nodes
  const nodes = [];

  for (const [component, data] of componentMap.entries()) {
    const nodeId = `complaint:${component.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    const hasCrash = data.crashes > 0;
    const hasFire = data.fires > 0;

    // Create summary description
    let description = `${data.count} complaints`;
    if (hasCrash) description += `, ${data.crashes} involving crashes`;
    if (hasFire) description += `, ${data.fires} involving fires`;

    const node = createNode(
      nodeId,
      'skill:AntiPattern',
      `Known issue: ${component} — ${description}`,
      'nhtsa-complaints-api',
      {
        'aether:component': component,
        'aether:count': data.count,
        'aether:crash': hasCrash,
        'aether:fire': hasFire,
        'aether:crash_count': data.crashes,
        'aether:fire_count': data.fires,
        'aether:examples': data.summaries,
        'aether:retrieved': timestamp
      }
    );

    nodes.push(node);
  }

  // Sort by complaint count (most common issues first)
  nodes.sort((a, b) => b['aether:count'] - a['aether:count']);

  // Cache the result
  setCache(cacheKey, {
    make: normalizedMake,
    model: normalizedModel,
    year: normalizedYear,
    total_complaints: results.length,
    components: componentMap.size,
    nodes,
    cached_at: timestamp
  });

  return nodes;
}

/**
 * Get complaints by VIN (uses pre-decoded vehicle info)
 * @param {string} vin - Vehicle VIN
 * @param {object} decoded - Pre-decoded vehicle info { make, model, year }
 * @returns {Promise<Array>} Array of complaint nodes
 */
export async function getComplaintsByVIN(vin, decoded) {
  if (!decoded || !decoded.make || !decoded.model || !decoded.year) {
    throw new Error('Decoded vehicle info (make, model, year) required');
  }

  return getComplaints(decoded.make, decoded.model, decoded.year);
}
