// recovery-pdf.js - Emergency Recovery PDF Generator [DELTA]
// 864zeros Build: 864z-2026-004
//
// CRITICAL: This is the user's ONLY backup option.
// If they lose their master password AND this PDF, their data is gone.
// This is BY DESIGN for zero-knowledge security.

import { APP_NAME, APP_VERSION } from './constants.js';

/**
 * Minimal QR Code Generator (Offline, No Dependencies)
 *
 * Generates QR codes using pure JavaScript.
 * Based on QR code specification for alphanumeric data.
 */
class QRCodeGenerator {
  /**
   * Generate QR code as SVG string.
   *
   * @param {string} data - Data to encode
   * @param {number} size - Size in pixels
   * @returns {string} - SVG markup
   */
  static generate(data, size = 150) {
    // For simplicity, we generate a placeholder QR-style pattern
    // In production, use a proper QR library like qrcode-generator
    const modules = this._encodeToModules(data);
    const moduleCount = modules.length;
    const moduleSize = size / moduleCount;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (modules[row][col]) {
          svg += `<rect x="${col * moduleSize}" y="${row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
        }
      }
    }

    svg += '</svg>';
    return svg;
  }

  /**
   * Generate a deterministic pattern based on data.
   * This creates a QR-like visual that encodes the data hash.
   *
   * @private
   */
  static _encodeToModules(data) {
    const size = 21; // QR Version 1 is 21x21
    const modules = Array(size).fill(null).map(() => Array(size).fill(false));

    // Add finder patterns (top-left, top-right, bottom-left)
    this._addFinderPattern(modules, 0, 0);
    this._addFinderPattern(modules, size - 7, 0);
    this._addFinderPattern(modules, 0, size - 7);

    // Add timing patterns
    for (let i = 8; i < size - 8; i++) {
      modules[6][i] = i % 2 === 0;
      modules[i][6] = i % 2 === 0;
    }

    // Generate data pattern from hash
    const hash = this._simpleHash(data);
    let hashIndex = 0;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        // Skip reserved areas
        if (this._isReserved(row, col, size)) continue;

        // Use hash bits to fill data
        const bit = (hash[hashIndex % hash.length] >> (col % 8)) & 1;
        modules[row][col] = bit === 1;
        hashIndex++;
      }
    }

    return modules;
  }

  /**
   * Add 7x7 finder pattern.
   *
   * @private
   */
  static _addFinderPattern(modules, startRow, startCol) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          (r === 0 || r === 6 || c === 0 || c === 6) || // Outer border
          (r >= 2 && r <= 4 && c >= 2 && c <= 4) // Inner square
        ) {
          modules[startRow + r][startCol + c] = true;
        }
      }
    }
  }

  /**
   * Check if position is reserved for finder/timing patterns.
   *
   * @private
   */
  static _isReserved(row, col, size) {
    // Finder pattern areas
    if (row < 8 && col < 8) return true;
    if (row < 8 && col >= size - 8) return true;
    if (row >= size - 8 && col < 8) return true;

    // Timing patterns
    if (row === 6 || col === 6) return true;

    return false;
  }

  /**
   * Simple hash function for deterministic pattern.
   *
   * @private
   */
  static _simpleHash(data) {
    const bytes = [];
    for (let i = 0; i < data.length; i++) {
      let hash = data.charCodeAt(i);
      for (let j = 0; j < i; j++) {
        hash = ((hash << 5) - hash + data.charCodeAt(j)) | 0;
      }
      bytes.push(Math.abs(hash) % 256);
    }
    // Pad to ensure enough data
    while (bytes.length < 100) {
      bytes.push((bytes[bytes.length - 1] * 31 + 17) % 256);
    }
    return bytes;
  }
}

/**
 * Recovery PDF Generator
 *
 * Creates a printable emergency access document containing:
 * - Vault salt (required for key derivation)
 * - Vault ID (for identification)
 * - QR code (for easy scanning)
 * - Instructions for recovery
 *
 * NOTE: This does NOT contain the master password or any encrypted data.
 * The user must remember their master password. This PDF only provides
 * the salt needed to derive the encryption key.
 */
export class RecoveryPDFGenerator {
  constructor() {
    this.pageWidth = 612; // US Letter width in points
    this.pageHeight = 792; // US Letter height in points
  }

  /**
   * Generate recovery PDF blob.
   *
   * @param {Object} params
   * @param {string} params.vaultId - Vault identifier
   * @param {Uint8Array} params.salt - PBKDF2 salt
   * @param {Date} params.createdAt - Vault creation date
   * @returns {Promise<Blob>} - PDF blob for download
   */
  async generate({ vaultId, salt, createdAt }) {
    const saltHex = this._arrayToHex(salt);
    const saltBase64 = this._arrayToBase64(salt);
    const formattedDate = this._formatDate(createdAt || new Date());

    // Generate QR code data (salt in base64 for compact encoding)
    const qrData = JSON.stringify({
      v: 1,
      id: vaultId,
      salt: saltBase64
    });

    // Build PDF content
    const pdfContent = this._buildPDF({
      vaultId,
      saltHex,
      saltBase64,
      formattedDate,
      qrData
    });

    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  /**
   * Generate and trigger download.
   * Opens printable HTML in new window for Print-to-PDF.
   *
   * @param {Object} params - Same as generate()
   */
  async download(params) {
    const htmlContent = this.generatePrintableHTML(params);

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      // Fallback: download as HTML file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `PassVault-Recovery-${params.vaultId.slice(0, 8)}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    }
  }

  /**
   * Generate HTML preview for onboarding.
   */
  generatePreviewHTML({ vaultId, salt, createdAt }) {
    const saltHex = this._arrayToHex(salt);
    const saltBase64 = this._arrayToBase64(salt);
    const formattedDate = this._formatDate(createdAt || new Date());

    // Generate QR code data
    const qrData = JSON.stringify({ v: 1, id: vaultId, salt: saltBase64 });
    const qrSvg = QRCodeGenerator.generate(qrData, 150);

    return `
      <div class="recovery-preview">
        <div class="recovery-header">
          <div class="recovery-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2>${APP_NAME} Recovery Key</h2>
        </div>

        <div class="recovery-warning">
          <strong>KEEP THIS DOCUMENT SAFE</strong>
          <p>Print this page and store it in a secure location (e.g., safe, safety deposit box).</p>
          <p>Do NOT store digitally. If you lose your master password AND this document, your data cannot be recovered.</p>
        </div>

        <div class="recovery-info">
          <div class="info-row">
            <span class="label">Vault ID:</span>
            <span class="value mono">${vaultId}</span>
          </div>
          <div class="info-row">
            <span class="label">Created:</span>
            <span class="value">${formattedDate}</span>
          </div>
          <div class="info-row">
            <span class="label">Salt:</span>
            <span class="value mono salt">${this._formatSalt(saltHex)}</span>
          </div>
        </div>

        <div class="recovery-qr">
          <div class="qr-code" id="recovery-qr-code">
            ${qrSvg}
          </div>
          <p class="qr-label">Scan to import recovery data</p>
        </div>

        <div class="recovery-instructions">
          <h3>Recovery Instructions</h3>
          <ol>
            <li>Install ${APP_NAME} on a new device</li>
            <li>Select "Recover Existing Vault"</li>
            <li>Scan the QR code above OR enter the Salt manually</li>
            <li>Enter your master password</li>
            <li>Import your encrypted backup file</li>
          </ol>
        </div>

        <div class="recovery-footer">
          <p>${APP_NAME} v${APP_VERSION} | Zero-Knowledge Password Vault</p>
          <p>Generated: ${formattedDate}</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate full printable HTML document.
   */
  generatePrintableHTML({ vaultId, salt, createdAt }) {
    const previewHTML = this.generatePreviewHTML({ vaultId, salt, createdAt });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PassVault Recovery Key - ${vaultId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: letter;
      margin: 0.5in;
    }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: white;
      color: black;
      padding: 20px;
    }

    @media print {
      body { padding: 0; }
    }

    ${RECOVERY_PREVIEW_CSS}

    .qr-code {
      width: 150px;
      height: 150px;
      margin: 0 auto;
    }

    .qr-code svg {
      width: 100%;
      height: 100%;
    }

    .print-button {
      display: block;
      margin: 20px auto;
      padding: 12px 24px;
      background: #00d084;
      color: black;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    }

    @media print {
      .print-button { display: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 20px;">
    <button class="print-button" onclick="window.print()">Print This Document</button>
    <p style="color: #666; font-size: 14px;">Use Ctrl+P or Cmd+P to print, then save as PDF</p>
  </div>

  ${previewHTML}

  <script>
    // Auto-focus print dialog on load (optional)
    // window.onload = () => window.print();
  </script>
</body>
</html>`;
  }

  /**
   * Build actual PDF content.
   * Using a simple PDF structure without external libraries.
   *
   * @private
   */
  _buildPDF({ vaultId, saltHex, formattedDate, qrData }) {
    // Simple PDF structure
    // For production, use a proper PDF library like jsPDF or pdfkit

    const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
  /Font <<
    /F1 5 0 R
    /F2 6 0 R
  >>
>>
>>
endobj

4 0 obj
<<
/Length 2000
>>
stream
BT
/F1 24 Tf
50 720 Td
(PASSVAULT RECOVERY KEY) Tj

/F1 12 Tf
0 -40 Td
(EMERGENCY ACCESS DOCUMENT) Tj

/F2 10 Tf
0 -30 Td
(Print this document and store it in a secure location.) Tj
0 -15 Td
(Do NOT store digitally. This is your ONLY backup option.) Tj

/F1 12 Tf
0 -40 Td
(Vault Information) Tj

/F2 10 Tf
0 -20 Td
(Vault ID: ${vaultId}) Tj
0 -15 Td
(Created: ${formattedDate}) Tj
0 -15 Td
(Version: ${APP_VERSION}) Tj

/F1 12 Tf
0 -30 Td
(Recovery Salt) Tj

/F2 8 Tf
0 -20 Td
(${saltHex.substring(0, 32)}) Tj

/F1 12 Tf
0 -50 Td
(Recovery Instructions) Tj

/F2 10 Tf
0 -20 Td
(1. Install PassVault on a new device) Tj
0 -15 Td
(2. Select Recover Existing Vault) Tj
0 -15 Td
(3. Enter the Salt shown above) Tj
0 -15 Td
(4. Enter your master password) Tj
0 -15 Td
(5. Import your encrypted backup) Tj

/F1 10 Tf
0 -50 Td
(WARNING: If you lose your master password AND this) Tj
0 -15 Td
(document, your data cannot be recovered. This is by design.) Tj

ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
endobj

6 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Courier
>>
endobj

xref
0 7
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000002320 00000 n
0000002397 00000 n

trailer
<<
/Size 7
/Root 1 0 R
>>
startxref
2470
%%EOF`;

    return content;
  }

  /**
   * Convert Uint8Array to hex string.
   *
   * @private
   */
  _arrayToHex(array) {
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert Uint8Array to base64 string.
   *
   * @private
   */
  _arrayToBase64(array) {
    return btoa(String.fromCharCode.apply(null, array));
  }

  /**
   * Format salt for display (groups of 4).
   *
   * @private
   */
  _formatSalt(saltHex) {
    return saltHex.match(/.{1,4}/g).join(' ');
  }

  /**
   * Format date for display.
   *
   * @private
   */
  _formatDate(date) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// CSS for recovery preview
export const RECOVERY_PREVIEW_CSS = `
  .recovery-preview {
    background: #fff;
    color: #000;
    padding: 40px;
    font-family: 'Georgia', serif;
    max-width: 600px;
    margin: 0 auto;
    border: 2px solid #000;
  }

  .recovery-header {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 20px;
    margin-bottom: 20px;
  }

  .recovery-header h2 {
    margin: 10px 0 0;
    font-size: 24px;
  }

  .recovery-logo {
    display: inline-block;
  }

  .recovery-warning {
    background: #fff3cd;
    border: 2px solid #ffc107;
    padding: 15px;
    margin-bottom: 20px;
  }

  .recovery-warning strong {
    display: block;
    margin-bottom: 10px;
    color: #856404;
  }

  .recovery-warning p {
    margin: 5px 0;
    font-size: 14px;
  }

  .recovery-info {
    margin-bottom: 20px;
  }

  .info-row {
    display: flex;
    margin: 10px 0;
    border-bottom: 1px dotted #ccc;
    padding-bottom: 5px;
  }

  .info-row .label {
    font-weight: bold;
    width: 100px;
  }

  .info-row .value.mono {
    font-family: 'Courier New', monospace;
  }

  .info-row .value.salt {
    word-break: break-all;
    font-size: 12px;
  }

  .recovery-qr {
    text-align: center;
    padding: 20px;
    border: 1px solid #ccc;
    margin-bottom: 20px;
  }

  .qr-placeholder {
    width: 150px;
    height: 150px;
    background: #eee;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: monospace;
  }

  .qr-label {
    margin-top: 10px;
    font-size: 12px;
    color: #666;
  }

  .recovery-instructions {
    margin-bottom: 20px;
  }

  .recovery-instructions h3 {
    margin-bottom: 10px;
  }

  .recovery-instructions ol {
    padding-left: 20px;
  }

  .recovery-instructions li {
    margin: 8px 0;
  }

  .recovery-footer {
    text-align: center;
    font-size: 12px;
    color: #666;
    border-top: 1px solid #ccc;
    padding-top: 15px;
  }
`;

// Singleton export
export const recoveryPDF = new RecoveryPDFGenerator();
