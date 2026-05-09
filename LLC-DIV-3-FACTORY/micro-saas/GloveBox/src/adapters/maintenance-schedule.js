/**
 * Maintenance Schedule Generator
 * Generates manufacturer-based service interval nodes
 *
 * Uses built-in lookup tables compiled from manufacturer maintenance manuals.
 * NOT an API call — deterministic output based on make/model.
 *
 * Returns array of JSON-LD nodes representing service intervals (skill:Rule)
 */

import { createNode } from '../utils/jsonld-helpers.js';

// Default maintenance intervals (most manufacturers)
const DEFAULT_SCHEDULE = {
  oil_change: { miles: 7500, months: 12, description: 'Oil and filter change' },
  tire_rotation: { miles: 7500, months: 12, description: 'Rotate tires' },
  brake_inspection: { miles: 15000, months: 24, description: 'Inspect brake pads and rotors' },
  air_filter: { miles: 30000, months: 36, description: 'Replace engine air filter' },
  cabin_filter: { miles: 15000, months: 24, description: 'Replace cabin air filter' },
  transmission_fluid: { miles: 60000, months: 72, description: 'Replace transmission fluid' },
  coolant: { miles: 60000, months: 60, description: 'Replace engine coolant' },
  spark_plugs: { miles: 100000, months: 120, description: 'Replace spark plugs' },
  timing_belt: { miles: 90000, months: 84, description: 'Replace timing belt (if equipped)' },
  battery: { miles: 50000, months: 48, description: 'Test/replace battery' },
  brake_fluid: { miles: 30000, months: 36, description: 'Replace brake fluid' },
  power_steering: { miles: 75000, months: 60, description: 'Replace power steering fluid' }
};

// Manufacturer-specific overrides
const MANUFACTURER_SCHEDULES = {
  honda: {
    oil_change: { miles: 7500, months: 12, description: 'Oil and filter change (0W-20)' },
    transmission_fluid: { miles: 30000, months: 36, description: 'Replace CVT fluid' },
    timing_belt: null, // Honda uses timing chains on most modern vehicles
    valve_adjustment: { miles: 105000, months: 84, description: 'Adjust valve clearance' }
  },
  toyota: {
    oil_change: { miles: 10000, months: 12, description: 'Oil and filter change (0W-20)' },
    transmission_fluid: { miles: 60000, months: 72, description: 'Replace automatic transmission fluid' },
    timing_belt: null // Toyota uses timing chains on most modern vehicles
  },
  ford: {
    oil_change: { miles: 7500, months: 12, description: 'Oil and filter change (5W-30)' },
    spark_plugs: { miles: 100000, months: 120, description: 'Replace spark plugs (iridium)' }
  },
  chevrolet: {
    oil_change: { miles: 7500, months: 12, description: 'Oil and filter change per Oil Life Monitor' },
    transmission_fluid: { miles: 45000, months: 48, description: 'Replace transmission fluid' }
  },
  gm: {
    oil_change: { miles: 7500, months: 12, description: 'Oil and filter change per Oil Life Monitor' }
  },
  bmw: {
    oil_change: { miles: 10000, months: 12, description: 'Oil and filter change (0W-40 synthetic)' },
    brake_fluid: { miles: 30000, months: 24, description: 'Replace brake fluid' },
    spark_plugs: { miles: 60000, months: 60, description: 'Replace spark plugs' },
    coolant: { miles: 100000, months: 60, description: 'Replace engine coolant' }
  },
  mercedes: {
    oil_change: { miles: 10000, months: 12, description: 'Oil and filter change (synthetic)' },
    transmission_fluid: { miles: 40000, months: 48, description: 'Replace transmission fluid' },
    brake_fluid: { miles: 20000, months: 24, description: 'Replace brake fluid' }
  },
  'mercedes-benz': {
    oil_change: { miles: 10000, months: 12, description: 'Oil and filter change (synthetic)' },
    transmission_fluid: { miles: 40000, months: 48, description: 'Replace transmission fluid' }
  },
  audi: {
    oil_change: { miles: 10000, months: 12, description: 'Oil and filter change (Castrol synthetic)' },
    transmission_fluid: { miles: 40000, months: 48, description: 'Replace DSG fluid' }
  },
  volkswagen: {
    oil_change: { miles: 10000, months: 12, description: 'Oil and filter change (VW 502 spec)' },
    transmission_fluid: { miles: 40000, months: 48, description: 'Replace DSG fluid' }
  },
  nissan: {
    oil_change: { miles: 5000, months: 6, description: 'Oil and filter change (conventional)' },
    cvt_fluid: { miles: 60000, months: 48, description: 'Replace CVT fluid' }
  },
  hyundai: {
    oil_change: { miles: 7500, months: 12, description: 'Oil and filter change' },
    timing_belt: { miles: 60000, months: 72, description: 'Replace timing belt (if equipped)' }
  },
  kia: {
    oil_change: { miles: 7500, months: 12, description: 'Oil and filter change' }
  },
  subaru: {
    oil_change: { miles: 6000, months: 6, description: 'Oil and filter change (0W-20)' },
    cvt_fluid: { miles: 60000, months: 60, description: 'Replace CVT fluid' }
  },
  mazda: {
    oil_change: { miles: 7500, months: 12, description: 'Oil and filter change (0W-20)' }
  },
  tesla: {
    // Electric vehicle - no oil changes
    oil_change: null,
    spark_plugs: null,
    transmission_fluid: null,
    timing_belt: null,
    coolant: { miles: 50000, months: 48, description: 'Check battery coolant' },
    brake_fluid: { miles: 50000, months: 24, description: 'Test brake fluid' },
    cabin_filter: { miles: 24000, months: 24, description: 'Replace HEPA cabin filter' },
    tire_rotation: { miles: 6250, months: 12, description: 'Rotate tires' }
  }
};

/**
 * Calculate next due mileage based on interval
 */
function calculateNextDue(currentMileage, intervalMiles) {
  if (!currentMileage || !intervalMiles) return null;
  const elapsed = currentMileage % intervalMiles;
  return currentMileage + (intervalMiles - elapsed);
}

/**
 * Generate maintenance schedule for a vehicle
 * @param {string} make - Vehicle make
 * @param {string} model - Vehicle model (not used currently, for future model-specific schedules)
 * @param {number|string} year - Model year (not used currently)
 * @param {number} currentMileage - Current odometer reading
 * @returns {Array} Array of JSON-LD nodes typed as skill:Rule
 */
export function generateMaintenanceSchedule(make, model, year, currentMileage = 0) {
  const normalizedMake = String(make).toLowerCase().trim();
  const mileage = parseInt(currentMileage, 10) || 0;
  const timestamp = new Date().toISOString();

  // Get manufacturer-specific schedule or use default
  const mfgOverrides = MANUFACTURER_SCHEDULES[normalizedMake] || {};

  // Merge manufacturer overrides with defaults
  const schedule = { ...DEFAULT_SCHEDULE };
  for (const [key, value] of Object.entries(mfgOverrides)) {
    if (value === null) {
      delete schedule[key]; // Remove items that don't apply (e.g., timing belt for timing chain cars)
    } else {
      schedule[key] = value;
    }
  }

  // Generate nodes
  const nodes = [];

  for (const [serviceId, service] of Object.entries(schedule)) {
    const nextDueMiles = calculateNextDue(mileage, service.miles);

    const node = createNode(
      `maintenance:${serviceId}`,
      'skill:Rule',
      `${service.description} every ${service.miles.toLocaleString()} miles or ${service.months} months`,
      'manufacturer-schedule',
      {
        'aether:service_type': serviceId,
        'aether:interval_miles': service.miles,
        'aether:interval_months': service.months,
        'aether:next_due_miles': nextDueMiles,
        'aether:current_mileage': mileage,
        'aether:retrieved': timestamp
      }
    );

    nodes.push(node);
  }

  // Sort by next due mileage (most urgent first)
  nodes.sort((a, b) => {
    const aDue = a['aether:next_due_miles'] || Infinity;
    const bDue = b['aether:next_due_miles'] || Infinity;
    return aDue - bDue;
  });

  return nodes;
}

/**
 * Get maintenance schedule by VIN (uses pre-decoded vehicle info)
 * @param {string} vin - Vehicle VIN
 * @param {object} decoded - Pre-decoded vehicle info { make, model, year }
 * @param {number} mileage - Current mileage
 * @returns {Array} Array of maintenance nodes
 */
export function getMaintenanceByVIN(vin, decoded, mileage = 0) {
  if (!decoded || !decoded.make || !decoded.model || !decoded.year) {
    throw new Error('Decoded vehicle info (make, model, year) required');
  }

  return generateMaintenanceSchedule(decoded.make, decoded.model, decoded.year, mileage);
}
