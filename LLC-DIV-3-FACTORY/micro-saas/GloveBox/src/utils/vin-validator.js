/**
 * VIN Validator
 * Validates VIN format, check digit, and extracts decoded fields
 *
 * VIN Structure (17 characters):
 *   Positions 1-3:  WMI (World Manufacturer Identifier)
 *   Positions 4-8:  VDS (Vehicle Descriptor Section)
 *   Position 9:     Check digit
 *   Position 10:    Model year
 *   Position 11:    Plant code
 *   Positions 12-17: Sequence number (VIS)
 */

// Character transliteration values for check digit calculation
const TRANSLITERATION = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
};

// Position weights for check digit calculation
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

// Model year codes (position 10)
const YEAR_CODES = {
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015,
  G: 2016, H: 2017, J: 2018, K: 2019, L: 2020, M: 2021,
  N: 2022, P: 2023, R: 2024, S: 2025, T: 2026, V: 2027,
  W: 2028, X: 2029, Y: 2030,
  '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
  '6': 2006, '7': 2007, '8': 2008, '9': 2009
};

// Invalid characters in VIN (easily confused with numbers)
const INVALID_CHARS = ['I', 'O', 'Q'];

/**
 * Calculate the check digit for a VIN
 * @param {string} vin - The VIN to calculate check digit for
 * @returns {string} The calculated check digit (0-9 or X)
 */
function calculateCheckDigit(vin) {
  let sum = 0;

  for (let i = 0; i < 17; i++) {
    const char = vin[i].toUpperCase();
    const value = TRANSLITERATION[char];

    if (value === undefined) {
      return null; // Invalid character
    }

    // Position 9 (index 8) is the check digit itself, use 0 for calculation
    if (i === 8) {
      continue;
    }

    sum += value * WEIGHTS[i];
  }

  const remainder = sum % 11;
  return remainder === 10 ? 'X' : String(remainder);
}

/**
 * Validate a VIN and extract decoded information
 * @param {string} vin - The VIN to validate
 * @returns {object} { valid: boolean, error?: string, decoded?: object }
 */
export function validateVIN(vin) {
  // Normalize input
  if (!vin || typeof vin !== 'string') {
    return { valid: false, error: 'VIN must be a non-empty string' };
  }

  const normalizedVIN = vin.toUpperCase().trim();

  // Check length (must be exactly 17 characters)
  if (normalizedVIN.length !== 17) {
    return {
      valid: false,
      error: `VIN must be exactly 17 characters (got ${normalizedVIN.length})`
    };
  }

  // Check for invalid characters (I, O, Q)
  for (const char of normalizedVIN) {
    if (INVALID_CHARS.includes(char)) {
      return {
        valid: false,
        error: `VIN contains invalid character '${char}' (I, O, Q are not allowed)`
      };
    }
  }

  // Check all characters are valid (alphanumeric, no I/O/Q)
  const validPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
  if (!validPattern.test(normalizedVIN)) {
    return {
      valid: false,
      error: 'VIN contains invalid characters (must be alphanumeric, no I/O/Q)'
    };
  }

  // Calculate and verify check digit (position 9, index 8)
  const calculatedCheckDigit = calculateCheckDigit(normalizedVIN);
  const actualCheckDigit = normalizedVIN[8];

  if (calculatedCheckDigit === null) {
    return {
      valid: false,
      error: 'VIN contains untranslatable character'
    };
  }

  if (calculatedCheckDigit !== actualCheckDigit) {
    return {
      valid: false,
      error: `Invalid check digit: expected '${calculatedCheckDigit}', got '${actualCheckDigit}'`
    };
  }

  // Extract decoded fields
  const wmi = normalizedVIN.substring(0, 3);      // World Manufacturer Identifier
  const vds = normalizedVIN.substring(3, 8);      // Vehicle Descriptor Section
  const checkDigit = normalizedVIN[8];            // Check digit
  const yearCode = normalizedVIN[9];              // Model year code
  const plantCode = normalizedVIN[10];            // Assembly plant code
  const sequence = normalizedVIN.substring(11);   // Production sequence number

  // Decode model year
  const modelYear = YEAR_CODES[yearCode];

  return {
    valid: true,
    decoded: {
      vin: normalizedVIN,
      wmi,
      vds,
      check_digit: checkDigit,
      year_code: yearCode,
      model_year: modelYear || null,
      plant_code: plantCode,
      sequence
    }
  };
}

/**
 * Extract just the last 8 characters of VIN (commonly used as identifier)
 * @param {string} vin - The VIN
 * @returns {string} Last 8 characters
 */
export function getVINLast8(vin) {
  const result = validateVIN(vin);
  if (!result.valid) {
    throw new Error(result.error);
  }
  return result.decoded.vin.slice(-8);
}
