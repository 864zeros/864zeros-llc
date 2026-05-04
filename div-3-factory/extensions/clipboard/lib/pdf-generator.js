// ============================================================
// PDF-GENERATOR.JS — PDF Generation via Chrome DevTools Protocol
// Captures full page content as PDF using Chrome's debugger API.
// ============================================================

const DEBUG = false;
function log(...args) {
  if (DEBUG) console.log('[pdf-generator]', ...args);
}

/**
 * PDF generation presets for different use cases.
 */
export const PDFPresets = {
  // Standard document - good for most web pages
  standard: {
    landscape: false,
    printBackground: true,
    scale: 1,
    paperWidth: 8.5,
    paperHeight: 11,
    marginTop: 0.4,
    marginBottom: 0.4,
    marginLeft: 0.4,
    marginRight: 0.4,
    preferCSSPageSize: false
  },

  // Full page - no margins, respects CSS
  fullPage: {
    landscape: false,
    printBackground: true,
    scale: 1,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    preferCSSPageSize: true
  },

  // Compact - smaller scale for fitting more content
  compact: {
    landscape: false,
    printBackground: true,
    scale: 0.8,
    paperWidth: 8.5,
    paperHeight: 11,
    marginTop: 0.2,
    marginBottom: 0.2,
    marginLeft: 0.2,
    marginRight: 0.2,
    preferCSSPageSize: false
  },

  // Landscape mode
  landscape: {
    landscape: true,
    printBackground: true,
    scale: 1,
    paperWidth: 11,
    paperHeight: 8.5,
    marginTop: 0.4,
    marginBottom: 0.4,
    marginLeft: 0.4,
    marginRight: 0.4,
    preferCSSPageSize: false
  }
};

/**
 * Generates a PDF of the entire webpage using Chrome DevTools Protocol.
 * @param {number} tabId - The ID of the tab to convert to PDF
 * @param {object} options - PDF generation options
 * @returns {Promise<string>} Base64 encoded PDF data
 */
export async function generatePagePDF(tabId, options = {}) {
  log(`Starting PDF generation for tab ${tabId}`);

  const defaultOptions = {
    landscape: false,
    displayHeaderFooter: false,
    printBackground: true,
    scale: 1,
    paperWidth: 8.5,
    paperHeight: 11,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    pageRanges: '',
    ignoreInvalidPageRanges: false,
    headerTemplate: '',
    footerTemplate: '',
    preferCSSPageSize: true,
    generateTaggedPDF: false,
    generateDocumentOutline: false
  };

  const pdfOptions = { ...defaultOptions, ...options };

  try {
    // Attach debugger to the tab
    log(`Attaching debugger to tab ${tabId}`);
    await chrome.debugger.attach({ tabId }, '1.3');

    // Enable Page domain
    await chrome.debugger.sendCommand({ tabId }, 'Page.enable');

    // Enable Runtime domain
    await chrome.debugger.sendCommand({ tabId }, 'Runtime.enable');

    // Generate PDF with timeout protection
    log('Generating PDF with options:', pdfOptions);
    const PDF_TIMEOUT_MS = 60000; // 1 minute timeout

    const pdfPromise = chrome.debugger.sendCommand(
      { tabId },
      'Page.printToPDF',
      pdfOptions
    );

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF generation timed out')), PDF_TIMEOUT_MS)
    );

    const result = await Promise.race([pdfPromise, timeoutPromise]);

    if (!result || !result.data) {
      throw new Error('PDF generation failed - no data returned');
    }

    log(`PDF generated successfully (${result.data.length} characters)`);
    return result.data; // Base64 encoded PDF

  } catch (error) {
    log('Error generating PDF:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    // Always detach debugger
    try {
      await chrome.debugger.detach({ tabId });
      log(`Debugger detached from tab ${tabId}`);
    } catch (detachError) {
      log('Error detaching debugger:', detachError);
    }
  }
}

/**
 * Converts base64 PDF data to a data URL for storage/display.
 * @param {string} base64Data - Base64 encoded PDF data
 * @returns {string} PDF data URL
 */
export function pdfToDataUrl(base64Data) {
  return `data:application/pdf;base64,${base64Data}`;
}

/**
 * Estimates PDF file size from base64 data.
 * @param {string} base64Data - Base64 encoded PDF data
 * @returns {number} Estimated file size in bytes
 */
export function estimatePDFSize(base64Data) {
  // Base64 encoding increases size by ~33%, so we reverse that calculation
  return Math.floor((base64Data.length * 3) / 4);
}

/**
 * Formats file size for display.
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
