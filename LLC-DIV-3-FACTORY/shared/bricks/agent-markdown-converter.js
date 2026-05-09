/**
 * agent-markdown-converter.js
 * 864zeros LLC | LLC-DIV-3-FACTORY shared brick | v1.0.0
 *
 * CONTRACT (Input → Process → Output):
 *
 *   Input:    Standardized JSON object  { content, title, source_url, timestamp, tags, note }
 *             (or batch of such objects)
 *
 *   Process:  1. Transform HTML / plaintext content into clean Markdown.
 *             2. Inject a YAML frontmatter block conforming to the 864z-metadata spec.
 *             3. Sanitize the derived filename for Windows / macOS / Linux compatibility.
 *
 *   Output:   { filename: string, markdown: string }   (single)
 *             or
 *             { files: [{filename, markdown}, ...] }   (batch)
 *
 * ZERO RUNTIME DEPENDENCIES. Pure Node + standard ES2020. No npm install needed.
 *
 * Designed for: MigrationPilot (Strike 011) — Web Highlights → Obsidian/Capacities export.
 *               Also reusable by any 864zeros extension that needs Markdown-with-frontmatter
 *               output (clipboard, Bible-Insight, Chronicle, OIA series).
 *
 * 864z-metadata spec v1.0 (the YAML frontmatter shape):
 *   ---
 *   title: <string>
 *   source_url: <string or '-'>
 *   captured_at: <ISO 8601>
 *   tags: [<string>, ...]              # omitted if empty
 *   note: <string>                     # omitted if empty
 *   generator: 864zeros/agent-markdown-converter
 *   generator_version: 1.0.0
 *   ---
 */

'use strict';

const VERSION = '1.0.0';
const GENERATOR_ID = '864zeros/agent-markdown-converter';

// ============================================================================
// HTML → Markdown conversion (intentionally minimal; covers highlight content)
// ============================================================================

const HTML_ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
  '&apos;': "'", '&#39;': "'", '&nbsp;': ' ',
  '&copy;': '©', '&reg;': '®', '&trade;': '™',
  '&hellip;': '…', '&ndash;': '–', '&mdash;': '—',
  '&lsquo;': '‘', '&rsquo;': '’',
  '&ldquo;': '“', '&rdquo;': '”',
};

function decodeEntities(s) {
  if (!s) return '';
  let out = String(s);
  for (const [ent, ch] of Object.entries(HTML_ENTITIES)) {
    out = out.replace(new RegExp(ent, 'g'), ch);
  }
  // Numeric entities: &#NNN; and &#xHHH;
  out = out.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)));
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)));
  return out;
}

function htmlToMarkdown(html) {
  if (!html) return '';
  let s = String(html);

  // Drop script/style entirely
  s = s.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');

  // Headings (h1-h6 → #..######)
  for (let lvl = 1; lvl <= 6; lvl++) {
    const re = new RegExp(`<h${lvl}\\b[^>]*>([\\s\\S]*?)<\\/h${lvl}>`, 'gi');
    s = s.replace(re, (_, inner) => `\n\n${'#'.repeat(lvl)} ${inner.trim()}\n\n`);
  }

  // Code blocks (pre/code)
  s = s.replace(/<pre\b[^>]*>\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (_, code) => `\n\n\`\`\`\n${code}\n\`\`\`\n\n`);
  s = s.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi,
    (_, code) => `\n\n\`\`\`\n${code}\n\`\`\`\n\n`);

  // Inline code
  s = s.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, t) => '`' + t + '`');

  // Blockquotes
  s = s.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) =>
    '\n\n' + inner.split('\n').map(line => '> ' + line).join('\n') + '\n\n');

  // Lists
  s = s.replace(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) =>
    '\n' + inner.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n') + '\n');
  s = s.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
    let n = 0;
    return '\n' + inner.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi,
      () => { n++; return ''; }) + '\n';
  });
  // Re-numbered ol pass (run after first ol pass left placeholders — simpler: do it directly)
  s = s.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
    let n = 0;
    const items = inner.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi,
      (__, item) => { n++; return `${n}. ${item.trim()}\n`; });
    return '\n' + items + '\n';
  });

  // Links: <a href="x">y</a> → [y](x)
  s = s.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, text) => `[${text.trim()}](${href})`);

  // Bold / italic
  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => `**${t}**`);
  s = s.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => `*${t}*`);

  // Line breaks and paragraphs
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>/gi, '\n\n');
  s = s.replace(/<p\b[^>]*>/gi, '');

  // Strip remaining tags
  s = s.replace(/<\/?[a-z][^>]*>/gi, '');

  // Decode entities
  s = decodeEntities(s);

  // Normalize whitespace
  s = s.replace(/\r\n?/g, '\n');
  s = s.replace(/[ \t]+\n/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');

  return s.trim();
}

// ============================================================================
// YAML frontmatter (864z-metadata spec v1.0)
// ============================================================================

function yamlEscapeScalar(value) {
  if (value === null || value === undefined) return '""';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  let s = String(value);
  // Multi-line: use folded block scalar with quoted alternative below.
  if (s.includes('\n')) {
    const indented = s.split('\n').map(l => '  ' + l).join('\n');
    return '|\n' + indented;
  }
  // Always quote — safest. Escape backslashes and quotes.
  s = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${s}"`;
}

function buildFrontmatter(meta, options = {}) {
  const generator = options.generator || GENERATOR_ID;
  const generatorVersion = options.generatorVersion || VERSION;

  const lines = ['---'];

  // Required fields (always emitted, even if empty/placeholder)
  lines.push(`title: ${yamlEscapeScalar(meta.title || 'Untitled')}`);
  lines.push(`source_url: ${yamlEscapeScalar(meta.source_url || '-')}`);
  lines.push(`captured_at: ${yamlEscapeScalar(toIsoTimestamp(meta.timestamp))}`);

  // Optional fields — emit only if meaningful
  if (Array.isArray(meta.tags) && meta.tags.length > 0) {
    lines.push('tags:');
    for (const t of meta.tags) {
      lines.push(`  - ${yamlEscapeScalar(String(t))}`);
    }
  }
  if (meta.note && String(meta.note).trim()) {
    lines.push(`note: ${yamlEscapeScalar(meta.note)}`);
  }

  // Pass-through any custom keys under meta.extra (operator-supplied additional metadata)
  if (meta.extra && typeof meta.extra === 'object') {
    for (const [k, v] of Object.entries(meta.extra)) {
      if (v === null || v === undefined || v === '') continue;
      lines.push(`${k}: ${yamlEscapeScalar(v)}`);
    }
  }

  lines.push(`generator: ${generator}`);
  lines.push(`generator_version: ${generatorVersion}`);
  lines.push('---');
  lines.push(''); // trailing blank line before body
  return lines.join('\n');
}

function toIsoTimestamp(ts) {
  if (!ts && ts !== 0) return new Date().toISOString();
  if (typeof ts === 'number') return new Date(ts).toISOString();
  // Try parsing strings
  const d = new Date(ts);
  if (!isNaN(d.getTime())) return d.toISOString();
  return String(ts); // last resort: pass through
}

// ============================================================================
// Filename sanitization (Windows / macOS / Linux safe)
// ============================================================================

const WIN_RESERVED_NAMES = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);

function sanitizeFilename(rawName, options = {}) {
  const maxLength = options.maxLength || 80;
  const fallback = options.fallback || 'untitled';
  const ext = options.extension !== undefined ? options.extension : '.md';

  let s = decodeEntities(String(rawName || ''));

  // Strip Windows-reserved chars + control chars + null
  s = s.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-');
  // Replace runs of whitespace with single dash
  s = s.replace(/\s+/g, '-');
  // Collapse multiple dashes
  s = s.replace(/-+/g, '-');
  // Trim leading/trailing dots, dashes, spaces
  s = s.replace(/^[.\-\s]+|[.\-\s]+$/g, '');

  if (!s) s = fallback;

  // Truncate to maxLength
  if (s.length > maxLength) s = s.substring(0, maxLength).replace(/-+$/, '');

  // Block reserved Windows names (case-insensitive)
  if (WIN_RESERVED_NAMES.has(s.toUpperCase())) s = '_' + s;

  return ext ? s + ext : s;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Convert one item to a {filename, markdown} pair.
 *
 * @param {object} item - { content, title, source_url, timestamp, tags, note, extra? }
 * @param {object} options - { generator?, generatorVersion?, filenamePrefix?, filenameMaxLength?, includeFrontmatter?, includeTitleHeading?, dateInFilename? }
 * @returns {{filename: string, markdown: string}}
 */
function convertItem(item, options = {}) {
  if (!item || typeof item !== 'object') {
    throw new TypeError('agent-markdown-converter: item must be an object');
  }

  const includeFrontmatter = options.includeFrontmatter !== false;       // default true
  const includeTitleHeading = options.includeTitleHeading !== false;     // default true
  const dateInFilename = options.dateInFilename !== false;                // default true (collision-safe)
  const filenamePrefix = options.filenamePrefix || '';
  const filenameMaxLength = options.filenameMaxLength || 80;

  // Body construction
  const body = htmlToMarkdown(item.content || '');
  const title = (item.title && String(item.title).trim()) || deriveTitleFromContent(body);

  let markdown = '';
  if (includeFrontmatter) {
    markdown += buildFrontmatter({
      title,
      source_url: item.source_url,
      timestamp: item.timestamp,
      tags: item.tags,
      note: item.note,
      extra: item.extra,
    }, options);
  }
  if (includeTitleHeading && title) {
    markdown += `# ${title}\n\n`;
  }
  markdown += body;
  if (item.source_url) {
    markdown += `\n\n*Source: <${item.source_url}>*\n`;
  }

  // Filename
  const datePart = dateInFilename ? '-' + toIsoTimestamp(item.timestamp).slice(0, 10) : '';
  const baseName = filenamePrefix + (title || 'untitled') + datePart;
  const filename = sanitizeFilename(baseName, { maxLength: filenameMaxLength });

  return { filename, markdown };
}

/**
 * Convert a batch of items.
 *
 * @param {object[]} items - array of item objects (see convertItem)
 * @param {object} options - extends convertItem options:
 *                           { combined?: bool, combinedFilename?: string }
 *                           When combined=true, all items are emitted into a single .md file.
 * @returns {{files: Array<{filename, markdown}>}}
 */
function convertBatch(items, options = {}) {
  if (!Array.isArray(items)) {
    throw new TypeError('agent-markdown-converter: items must be an array');
  }

  if (options.combined) {
    const combinedFilename = sanitizeFilename(
      options.combinedFilename || `highlights-${new Date().toISOString().slice(0, 10)}`,
      { maxLength: options.filenameMaxLength || 80 }
    );
    const sections = items.map((item, idx) => {
      const single = convertItem(item, { ...options, includeFrontmatter: false, dateInFilename: false });
      return single.markdown;
    });
    // Combined file gets a single top-level frontmatter
    let combined = '';
    if (options.includeFrontmatter !== false) {
      combined += buildFrontmatter({
        title: options.combinedTitle || `Migrated highlights (${items.length})`,
        source_url: '-',
        timestamp: Date.now(),
        tags: options.combinedTags || [],
        note: `Batch of ${items.length} items.`,
      }, options);
    }
    combined += sections.join('\n\n---\n\n');
    return { files: [{ filename: combinedFilename, markdown: combined }] };
  }

  // One file per item, with collision protection (append counter to duplicates)
  const files = [];
  const seenFilenames = new Map(); // base -> count
  for (const item of items) {
    const result = convertItem(item, options);
    let final = result.filename;
    const baseKey = final.toLowerCase();
    if (seenFilenames.has(baseKey)) {
      const count = seenFilenames.get(baseKey) + 1;
      seenFilenames.set(baseKey, count);
      // Inject -N before extension
      const m = final.match(/^(.+?)(\.[^.]+)?$/);
      final = `${m[1]}-${count}${m[2] || ''}`;
    } else {
      seenFilenames.set(baseKey, 1);
    }
    files.push({ filename: final, markdown: result.markdown });
  }
  return { files };
}

// ============================================================================
// Helpers
// ============================================================================

function deriveTitleFromContent(text, maxWords = 8) {
  if (!text) return 'Untitled';
  const firstLine = String(text).split('\n').find(l => l.trim()) || '';
  const cleaned = firstLine.replace(/^#+\s*/, '').replace(/\*+/g, '').trim();
  const words = cleaned.split(/\s+/).slice(0, maxWords).join(' ');
  return words || 'Untitled';
}

// ============================================================================
// Exports (CommonJS)
// ============================================================================

module.exports = {
  // Public API
  convertItem,
  convertBatch,
  // Lower-level (exposed for reuse / testing)
  htmlToMarkdown,
  buildFrontmatter,
  sanitizeFilename,
  decodeEntities,
  // Constants
  VERSION,
  GENERATOR_ID,
};

// ============================================================================
// Self-test (run with: node agent-markdown-converter.js)
// ============================================================================

if (require.main === module) {
  console.log(`agent-markdown-converter v${VERSION} self-test\n`);

  const tests = [
    {
      name: 'simple plain-text highlight',
      input: {
        content: 'The most valuable thinking you do is locked inside three vendor accounts.',
        title: 'Vendor Lock-in',
        source_url: 'https://example.com/article',
        timestamp: '2026-05-07T15:30:00Z',
        tags: ['ai', 'lock-in', 'rescue'],
        note: 'Quote from the migration manifesto.',
      },
    },
    {
      name: 'HTML content with bold/link',
      input: {
        content: '<p>This is <strong>important</strong> with a <a href="https://anthropic.com">link</a>.</p>',
        title: 'HTML Test',
        source_url: 'https://example.com',
        timestamp: 1700000000000,
        tags: ['test'],
      },
    },
    {
      name: 'title with illegal chars',
      input: {
        content: 'body',
        title: 'Hello/World: Volume #1 <draft> | "WIP"?',
        source_url: '-',
        timestamp: Date.now(),
      },
    },
    {
      name: 'batch with duplicate titles',
      input: [
        { content: 'first', title: 'Same Title', timestamp: 1000 },
        { content: 'second', title: 'Same Title', timestamp: 2000 },
        { content: 'third', title: 'Same Title', timestamp: 3000 },
      ],
      isBatch: true,
    },
    {
      name: 'combined batch',
      input: [
        { content: 'one', title: 'A', timestamp: 1000 },
        { content: 'two', title: 'B', timestamp: 2000 },
      ],
      isBatch: true,
      options: { combined: true, combinedFilename: 'all-highlights' },
    },
  ];

  let pass = 0;
  let fail = 0;
  for (const t of tests) {
    console.log(`--- ${t.name} ---`);
    try {
      const result = t.isBatch
        ? convertBatch(t.input, t.options || {})
        : convertItem(t.input);
      if (t.isBatch) {
        console.log(`  files: ${result.files.length}`);
        result.files.forEach(f => console.log(`    ${f.filename} (${f.markdown.length} chars)`));
        // Sanity: combined → 1 file, otherwise N
        const expected = t.options && t.options.combined ? 1 : t.input.length;
        if (result.files.length !== expected) throw new Error(`expected ${expected} files, got ${result.files.length}`);
      } else {
        console.log(`  filename: ${result.filename}`);
        console.log(`  preview:\n${result.markdown.split('\n').slice(0, 8).map(l => '    ' + l).join('\n')}`);
        // Sanity: filename has no illegal chars
        if (/[<>:"/\\|?*]/.test(result.filename)) throw new Error('filename has illegal chars: ' + result.filename);
      }
      pass++;
      console.log('  PASS\n');
    } catch (e) {
      fail++;
      console.log(`  FAIL: ${e.message}\n`);
    }
  }
  console.log(`\nResults: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}
