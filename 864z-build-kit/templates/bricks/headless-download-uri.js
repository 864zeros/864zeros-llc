// ============================================================
// BRICK — headless-download-uri
// ============================================================
//
// ID:               BRK-DL-001
// Authority:        BUILD_KIT_RULES.md → RULE-002 (Service Worker Download Pattern)
// Origin:           Strike 011 (MigrationPilot) — SW-DL-FIX 2026-05-08
// Module style:     ESM (drop into background/, sidepanel/, or options/)
// Dependencies:     chrome.downloads (`downloads` permission required)
// Side effects:     Triggers `chrome.downloads.download`. No DOM access. No network.
//
// PURPOSE
// -------
// Triggers a file download from a background context (MV3 service worker)
// without relying on `URL.createObjectURL`. The blob URL approach is
// unreliable in SW context — unsupported pre-Chrome 110, intermittent
// failures even after, because blob URLs are scoped to a document
// context the service worker does not own.
//
// This brick wraps the canonical UTF-8-safe Base64 → data URI pattern.
//
// PUBLIC API
// ----------
//   downloadAsDataURI(options)   → Promise<number>   // returns downloadId
//   downloadAsMarkdown(content, filename, options?)  // convenience wrapper
//   encodeUtf8Base64(content)    → string            // exposed for advanced use
//
// USAGE — service worker
// ----------------------
//   import { downloadAsMarkdown } from '../lib/bricks/headless-download-uri.js';
//
//   await downloadAsMarkdown('# Hello\n\nWorld', 'hello.md', {
//     subdirectory: 'my-extension',
//     conflictAction: 'uniquify',
//   });
//
// USAGE — multi-file batch
// ------------------------
//   for (const f of files) {
//     await downloadAsDataURI({
//       content: f.markdown,
//       filename: `my-extension/${f.filename}`,
//       mimeType: 'text/markdown;charset=utf-8',
//     });
//   }
//
// CONTRACT
// --------
// Inputs:
//   content      — string. Arbitrary Unicode (not validated). Empty allowed.
//   filename     — string. Path-safe filename. Subdirectories allowed via
//                  forward slashes, e.g., `my-extension/clip-1.md`.
//   mimeType     — string. Default `application/octet-stream`. Set to
//                  `text/markdown;charset=utf-8` for .md, `application/json`
//                  for JSON dumps, etc.
// Outputs:
//   Promise resolving to the chrome.downloads downloadId (number).
//   Rejects with the underlying Chrome error on failure.
// Side effects:
//   Adds an entry to the user's Chrome download history.
// ============================================================

/**
 * UTF-8-safe Base64 encode a string. Suitable for arbitrary Unicode
 * (em-dashes, smart quotes, emoji, CJK, etc.) before forming a data URI.
 *
 * Implementation: encodeURIComponent → unescape → btoa is the canonical
 * cross-browser UTF-8-byte-string conversion. Modern alternative is
 * `TextEncoder` + chunked `String.fromCharCode`, but this idiom is
 * shorter, supported in every Chrome MV3 context (SW included), and
 * has no call-stack-size concerns for typical clip sizes.
 *
 * @param {string} content — arbitrary Unicode string
 * @returns {string} Base64-encoded UTF-8 byte representation
 */
export function encodeUtf8Base64(content) {
  if (typeof content !== 'string') {
    throw new TypeError('[headless-download-uri] content must be a string');
  }
  return btoa(unescape(encodeURIComponent(content)));
}

/**
 * Trigger a Chrome download from any extension context (most importantly,
 * a background service worker). Encodes content as a Base64 data URI.
 *
 * @param {Object} options
 * @param {string} options.content — file content (text)
 * @param {string} options.filename — target filename, may include subdirectory
 * @param {string} [options.mimeType] — MIME type. Default 'application/octet-stream'
 * @param {string} [options.conflictAction] — 'uniquify' | 'overwrite' | 'prompt'. Default 'uniquify'
 * @param {boolean} [options.saveAs] — show the Save As dialog. Default false
 * @returns {Promise<number>} the downloadId
 */
export function downloadAsDataURI({
  content,
  filename,
  mimeType = 'application/octet-stream',
  conflictAction = 'uniquify',
  saveAs = false,
} = {}) {
  if (typeof filename !== 'string' || !filename) {
    return Promise.reject(new TypeError('[headless-download-uri] filename is required'));
  }
  const base64 = encodeUtf8Base64(content || '');
  const url = `data:${mimeType};base64,${base64}`;
  return chrome.downloads.download({
    url,
    filename,
    conflictAction,
    saveAs,
  });
}

/**
 * Convenience wrapper for Markdown downloads. Sets the right MIME type
 * and supports an optional subdirectory shorthand.
 *
 * @param {string} content — Markdown text
 * @param {string} filename — target filename (e.g., 'my-clip.md')
 * @param {Object} [opts]
 * @param {string} [opts.subdirectory] — places the file under `<subdir>/<filename>`
 * @param {string} [opts.conflictAction] — see downloadAsDataURI
 * @param {boolean} [opts.saveAs] — see downloadAsDataURI
 * @returns {Promise<number>} the downloadId
 */
export function downloadAsMarkdown(content, filename, opts = {}) {
  const { subdirectory, ...rest } = opts;
  const path = subdirectory ? `${subdirectory.replace(/\/+$/, '')}/${filename}` : filename;
  return downloadAsDataURI({
    content,
    filename: path,
    mimeType: 'text/markdown;charset=utf-8',
    ...rest,
  });
}

/**
 * Convenience wrapper for JSON dumps.
 */
export function downloadAsJson(data, filename, opts = {}) {
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const { subdirectory, ...rest } = opts;
  const path = subdirectory ? `${subdirectory.replace(/\/+$/, '')}/${filename}` : filename;
  return downloadAsDataURI({
    content,
    filename: path,
    mimeType: 'application/json;charset=utf-8',
    ...rest,
  });
}
