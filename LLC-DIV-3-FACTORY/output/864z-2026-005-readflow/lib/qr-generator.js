/**
 * qr-generator.js - QR Code Generator
 * Strike: 864z-2026-005 (ReadFlow)
 *
 * Generates QR codes client-side without external dependencies.
 * Used for Kobo wireless transfer bridge.
 */

/**
 * QR Code error correction levels
 */
const ERROR_CORRECTION = {
  L: 0, // 7% recovery
  M: 1, // 15% recovery
  Q: 2, // 25% recovery
  H: 3  // 30% recovery
};

/**
 * Generate QR code as SVG
 * @param {string} data - Data to encode
 * @param {Object} options - Generation options
 * @returns {string} - SVG string
 */
export function generateQRCodeSVG(data, options = {}) {
  const {
    size = 200,
    margin = 4,
    darkColor = '#000000',
    lightColor = '#ffffff',
    errorCorrection = 'M'
  } = options;

  const qr = generateQRMatrix(data, ERROR_CORRECTION[errorCorrection] || 1);
  const moduleCount = qr.length;
  const moduleSize = (size - margin * 2) / moduleCount;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="100%" height="100%" fill="${lightColor}"/>`;

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr[row][col]) {
        const x = margin + col * moduleSize;
        const y = margin + row * moduleSize;
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${darkColor}"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

/**
 * Generate QR code as data URL
 * @param {string} data
 * @param {Object} options
 * @returns {string}
 */
export function generateQRCodeDataURL(data, options = {}) {
  const svg = generateQRCodeSVG(data, options);
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

/**
 * Generate QR matrix
 * @param {string} data
 * @param {number} ecLevel
 * @returns {boolean[][]}
 */
function generateQRMatrix(data, ecLevel) {
  // Encode data
  const encoded = encodeData(data);

  // Determine version (size)
  const version = determineVersion(encoded.length, ecLevel);

  // Create matrix
  const size = version * 4 + 17;
  const matrix = createMatrix(size);

  // Add finder patterns
  addFinderPatterns(matrix, size);

  // Add timing patterns
  addTimingPatterns(matrix, size);

  // Add alignment patterns (for version > 1)
  if (version > 1) {
    addAlignmentPatterns(matrix, version);
  }

  // Add format info
  addFormatInfo(matrix, size, ecLevel);

  // Add version info (for version >= 7)
  if (version >= 7) {
    addVersionInfo(matrix, size, version);
  }

  // Add data
  addData(matrix, size, encoded, ecLevel, version);

  // Apply best mask
  applyMask(matrix, size);

  return matrix;
}

/**
 * Encode string data
 */
function encodeData(data) {
  const bytes = new TextEncoder().encode(data);
  const bits = [];

  // Mode indicator (byte mode = 0100)
  bits.push(0, 1, 0, 0);

  // Character count (8 bits for version 1-9)
  const count = bytes.length;
  for (let i = 7; i >= 0; i--) {
    bits.push((count >> i) & 1);
  }

  // Data
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  }

  // Terminator
  for (let i = 0; i < 4 && bits.length < 128; i++) {
    bits.push(0);
  }

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  return bits;
}

/**
 * Determine QR version based on data length
 */
function determineVersion(bitLength, ecLevel) {
  // Simplified - use version that fits data
  // Version 1 = 21x21, each version adds 4 modules
  const capacities = [
    [19, 16, 13, 9],     // Version 1
    [34, 28, 22, 16],    // Version 2
    [55, 44, 34, 26],    // Version 3
    [80, 64, 48, 36],    // Version 4
    [108, 86, 62, 46],   // Version 5
    [136, 108, 76, 60],  // Version 6
    [156, 124, 88, 66],  // Version 7
    [194, 154, 110, 86], // Version 8
    [232, 182, 132, 100] // Version 9
  ];

  const byteLength = Math.ceil(bitLength / 8);

  for (let v = 0; v < capacities.length; v++) {
    if (capacities[v][ecLevel] >= byteLength) {
      return v + 1;
    }
  }

  return 9; // Max supported in this simple implementation
}

/**
 * Create empty matrix
 */
function createMatrix(size) {
  return Array(size).fill(null).map(() => Array(size).fill(false));
}

/**
 * Add finder patterns (corners)
 */
function addFinderPatterns(matrix, size) {
  const positions = [
    [0, 0],           // Top-left
    [size - 7, 0],    // Top-right
    [0, size - 7]     // Bottom-left
  ];

  for (const [row, col] of positions) {
    // Outer black square
    for (let i = 0; i < 7; i++) {
      matrix[row][col + i] = true;
      matrix[row + 6][col + i] = true;
      matrix[row + i][col] = true;
      matrix[row + i][col + 6] = true;
    }

    // Inner black square
    for (let i = 2; i < 5; i++) {
      for (let j = 2; j < 5; j++) {
        matrix[row + i][col + j] = true;
      }
    }
  }

  // Add separators (white border around finder patterns)
  // Top-left
  for (let i = 0; i < 8; i++) {
    if (matrix[7] && col + i < size) matrix[7][i] = false;
    if (matrix[i]) matrix[i][7] = false;
  }
}

/**
 * Add timing patterns
 */
function addTimingPatterns(matrix, size) {
  for (let i = 8; i < size - 8; i++) {
    const value = i % 2 === 0;
    matrix[6][i] = value;
    matrix[i][6] = value;
  }
}

/**
 * Add alignment patterns
 */
function addAlignmentPatterns(matrix, version) {
  const positions = getAlignmentPositions(version);

  for (const row of positions) {
    for (const col of positions) {
      // Skip if overlaps with finder patterns
      if ((row < 9 && col < 9) ||
          (row < 9 && col > matrix.length - 10) ||
          (row > matrix.length - 10 && col < 9)) {
        continue;
      }

      // Draw alignment pattern
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isDark = Math.abs(dr) === 2 || Math.abs(dc) === 2 ||
                        (dr === 0 && dc === 0);
          matrix[row + dr][col + dc] = isDark;
        }
      }
    }
  }
}

/**
 * Get alignment pattern positions
 */
function getAlignmentPositions(version) {
  if (version === 1) return [];

  const positions = [6];
  const count = Math.floor(version / 7) + 2;
  const step = Math.floor((version * 4 + 4) / (count - 1));

  for (let i = 1; i < count; i++) {
    positions.push(6 + i * step);
  }

  return positions;
}

/**
 * Add format information
 */
function addFormatInfo(matrix, size, ecLevel) {
  // Simplified format info
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  // Around top-left finder
  for (let i = 0; i < 6; i++) {
    matrix[8][i] = formatBits[i];
  }
  matrix[8][7] = formatBits[6];
  matrix[8][8] = formatBits[7];
  matrix[7][8] = formatBits[8];

  for (let i = 0; i < 6; i++) {
    matrix[5 - i][8] = formatBits[9 + i];
  }

  // Other side
  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = formatBits[i];
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 8 + i] = formatBits[7 + i];
  }

  // Dark module
  matrix[size - 8][8] = true;
}

/**
 * Add version information
 */
function addVersionInfo(matrix, size, version) {
  // Simplified - add version pattern for versions >= 7
  // This is a placeholder for full implementation
}

/**
 * Add encoded data to matrix
 */
function addData(matrix, size, data, ecLevel, version) {
  let dataIndex = 0;
  let upward = true;

  for (let col = size - 1; col > 0; col -= 2) {
    // Skip timing pattern column
    if (col === 6) col--;

    for (let row = upward ? size - 1 : 0;
         upward ? row >= 0 : row < size;
         upward ? row-- : row++) {

      for (let c = 0; c < 2; c++) {
        const currentCol = col - c;

        // Skip if reserved
        if (isReserved(matrix, row, currentCol, size)) continue;

        if (dataIndex < data.length) {
          matrix[row][currentCol] = data[dataIndex] === 1;
          dataIndex++;
        }
      }
    }

    upward = !upward;
  }
}

/**
 * Check if position is reserved
 */
function isReserved(matrix, row, col, size) {
  // Finder patterns and separators
  if (row < 9 && col < 9) return true;
  if (row < 9 && col > size - 9) return true;
  if (row > size - 9 && col < 9) return true;

  // Timing patterns
  if (row === 6 || col === 6) return true;

  return false;
}

/**
 * Apply mask pattern
 */
function applyMask(matrix, size) {
  // Use mask pattern 0: (row + col) % 2 === 0
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!isReserved(matrix, row, col, size)) {
        if ((row + col) % 2 === 0) {
          matrix[row][col] = !matrix[row][col];
        }
      }
    }
  }
}

/**
 * Render QR code to canvas
 * @param {HTMLCanvasElement} canvas
 * @param {string} data
 * @param {Object} options
 */
export function renderQRCodeToCanvas(canvas, data, options = {}) {
  const {
    size = 200,
    margin = 4,
    darkColor = '#000000',
    lightColor = '#ffffff',
    errorCorrection = 'M'
  } = options;

  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;

  const qr = generateQRMatrix(data, ERROR_CORRECTION[errorCorrection] || 1);
  const moduleCount = qr.length;
  const moduleSize = (size - margin * 2) / moduleCount;

  // Background
  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, size, size);

  // Modules
  ctx.fillStyle = darkColor;
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr[row][col]) {
        ctx.fillRect(
          margin + col * moduleSize,
          margin + row * moduleSize,
          moduleSize,
          moduleSize
        );
      }
    }
  }
}
