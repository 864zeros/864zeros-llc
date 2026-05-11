/**
 * 864zeros Trust Vault (Strike 028)
 *
 * Canonical:        864z-build-kit/references/core/trust-vault.js
 * Per-extension:    extensions/{ext}/lib/trust-vault.js
 *
 * Local-first vault export/import. Produces a portable Markdown file with
 * an operator-mandated 6-line header (Founder's Guarantee + export date +
 * format note) followed by a fenced JSON block holding the actual
 * application data. Round-trip safe: importVault() can parse a file
 * produced by exportVault().
 *
 * Per RULE-007:
 *   - The Markdown file goes to the user's local Downloads folder — never
 *     through 864zeros servers.
 *   - Storage IO (reading vault data from chrome.storage.local or IndexedDB,
 *     writing it back on import) is the caller's responsibility — this module
 *     is purely about file serialization.
 *
 * Runtime context:
 *   - Requires a DOM (document.createElement, Blob, URL, alert). Safe to
 *     import in options pages, side panels, popups. NOT safe in the service
 *     worker (no document).
 *
 * Exports:
 *   - exportVault(appName, data)   → triggers a .md download; returns
 *                                    { filename, size } sync.
 *   - importVault()                → Promise<data | null>; null on user
 *                                    cancel; rejects on parse failure.
 */

const HEADER = (appName, date) =>
`# 864zeros Trust Vault | ${appName} Snapshot
**Founder's Guarantee:** No Ads. No Tracking. Local-First Sovereignty.
---
**Export Date:** ${date}
**Format:** Portable Markdown (Standard)
---`;

const DATA_BLOCK_OPEN = '\n\n## Application Data\n\n```json\n';
const DATA_BLOCK_CLOSE = '\n```\n';

// Operator-verbatim alert text (Strike 028 Task 5). Two segments concatenated
// to fit prose-wrap conventions; runtime output is a single sentence-pair.
const IMPORT_WARNING =
  'Warning: This will permanently OVERWRITE your current application state. ' +
  'To keep your current items, export a fresh Data Backup before loading a historic one.';

function formatDate(d) {
  // ISO date YYYY-MM-DD (UTC). Stable across timezones; matches the
  // Chronicle markdown export filename convention.
  return d.toISOString().split('T')[0];
}

function sanitizeForFilename(s) {
  // Replace non-alphanumeric/dash/underscore runs with single dash;
  // strip leading/trailing dashes. Keeps the operator-mandated filename
  // shape `864z-Vault-[AppName]-[Date].md` resilient to spacey app names.
  return String(s).replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'App';
}

/**
 * Trigger a download of an 864z Vault Markdown file.
 *
 * @param {string} appName — application name (e.g., "Chronicle")
 * @param {*} data — any JSON-serializable structure (the vault payload)
 * @returns {{ filename: string, size: number }}
 */
export function exportVault(appName, data) {
  const date = formatDate(new Date());
  const header = HEADER(appName, date);
  const body = DATA_BLOCK_OPEN + JSON.stringify(data, null, 2) + DATA_BLOCK_CLOSE;
  const markdown = header + body;

  const filename = `864z-Vault-${sanitizeForFilename(appName)}-${date}.md`;
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  return { filename, size: markdown.length };
}

/**
 * Prompt the user to select an 864z Vault Markdown file + parse the data.
 *
 * Order of operations (operator-mandated, Strike 028 Task 5):
 *   1. alert() the operator-verbatim warning text — user dismisses with OK.
 *   2. Open file picker — user can opt out by clicking Cancel on the picker
 *      (Promise resolves with null in that case).
 *   3. On file select: read text, parse out the ```json block, resolve.
 *
 * @returns {Promise<*|null>} parsed vault data, or null if user cancelled.
 *                            Rejects with an Error if the file's format
 *                            is unrecognized (no ```json block found).
 */
export function importVault() {
  alert(IMPORT_WARNING);

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,text/markdown';

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        resolve(parseVaultMarkdown(text));
      } catch (err) {
        reject(err);
      }
    });

    input.click();
  });
}

function parseVaultMarkdown(markdown) {
  const match = markdown.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!match) {
    throw new Error('Vault file format not recognized — no JSON data block found.');
  }
  return JSON.parse(match[1]);
}
