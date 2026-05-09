// lib/markdown-converter.js — ESM port of agent-markdown-converter brick
// 864zeros LLC | [FHG] ScriptureScout v0.1.0
//
// CANONICAL SOURCE: 864zeros-llc/LLC-DIV-3-FACTORY/shared/bricks/agent-markdown-converter.js (CommonJS)
// This file is the ES-module port for use in Chrome MV3 extension contexts.
// When updating logic: update BOTH files. The CJS version is the canonical
// brick (Node-CLI-runnable, self-tested, registered in BRICK_REGISTRY.json).
//
// CONTRACT: see header of the canonical brick for full I/O contract.

export const VERSION = '1.0.0';
export const GENERATOR_ID = '864zeros/agent-markdown-converter';

const HTML_ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
  '&apos;': "'", '&#39;': "'", '&nbsp;': ' ',
  '&copy;': '©', '&reg;': '®', '&trade;': '™',
  '&hellip;': '…', '&ndash;': '–', '&mdash;': '—',
  '&lsquo;': '‘', '&rsquo;': '’',
  '&ldquo;': '“', '&rdquo;': '”',
};

export function decodeEntities(s) {
  if (!s) return '';
  let out = String(s);
  for (const [ent, ch] of Object.entries(HTML_ENTITIES)) {
    out = out.replace(new RegExp(ent, 'g'), ch);
  }
  out = out.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)));
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)));
  return out;
}

/**
 * SANITIZATION PIPELINE (RULE-001 Sanitization step, added 2026-05-08)
 * Clones the HTML fragment via DOMParser, removes elements matching any
 * selector in `noiseSelectors`, returns the cleaned HTML body. Used by
 * convertItem() when called with item.noiseSelectors or options.noiseSelectors.
 *
 * Falls back to the unmodified HTML when:
 *   - noiseSelectors is empty / not an array
 *   - DOMParser is unavailable (Node.js context)
 *   - parsing throws
 *
 * @param {string} html — raw HTML fragment
 * @param {string[]} noiseSelectors — CSS selectors to strip
 * @returns {string} cleaned HTML
 */
export function sanitizeFragment(html, noiseSelectors) {
  if (!html) return '';
  if (!Array.isArray(noiseSelectors) || noiseSelectors.length === 0) {
    return html;
  }
  if (typeof DOMParser === 'undefined') {
    // Non-DOM context (Node.js CLI). Skip — canonical CJS brick can ship
    // a regex-based fallback later if needed.
    return html;
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    for (const selector of noiseSelectors) {
      if (!selector || typeof selector !== 'string') continue;
      try {
        doc.querySelectorAll(selector).forEach((el) => el.remove());
      } catch (e) {
        // Invalid selector — skip without breaking the pipeline
      }
    }
    return doc.body ? doc.body.innerHTML : html;
  } catch (e) {
    return html;
  }
}

/**
 * HERITAGE LOGIC — BibleHub interlinear table renderer.
 * Strike 012 / 2026-05-08.
 *
 * When the captured fragment contains an interlinear table from
 * biblehub.com (or similar), produce a clean GFM table rather than
 * running through the standard htmlToMarkdown pipeline.
 *
 * Table format:
 *   | Greek | Translit | English | Strongs |
 *   | --- | --- | --- | --- |
 *   | ... | ... | ... | ... |
 *
 * Returns the GFM table string on success, or null when:
 *   - DOMParser is unavailable (Node.js)
 *   - No recognizable interlinear rows are found
 *   - All rows yield empty data
 *
 * Defensive selectors: tries class-based extraction first
 * (.greek/.hebrew/.translit/.english/.strongs*), then falls back to
 * cell-position extraction. The actual BibleHub DOM may evolve;
 * this extractor degrades to null and lets convertItem fall through
 * to htmlToMarkdown rather than failing.
 *
 * @param {string} html — captured HTML fragment
 * @returns {string|null} GFM table string, or null
 */
export function buildInterlinearTable(html) {
  if (!html || typeof DOMParser === 'undefined') return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Try several row-locator strategies, ordered most-specific to least.
    let rows = doc.querySelectorAll('.interlinear tr, table.interlinear tr');
    if (!rows.length) {
      rows = doc.querySelectorAll('.word-row, .interlin-row, tr.word');
    }
    if (!rows.length) {
      rows = doc.querySelectorAll('table tr');
    }
    if (!rows.length) return null;

    const headers = ['Greek', 'Translit', 'English', 'Strongs'];
    const lines = [
      `| ${headers.join(' | ')} |`,
      `| ${headers.map(() => '---').join(' | ')} |`,
    ];

    let dataRowCount = 0;
    for (const row of rows) {
      const cells = row.querySelectorAll('td, th');
      if (cells.length < 2) continue;

      // Class-based extraction — try common BibleHub patterns.
      let greek = pickFirstText(row, ['.greek', '.hebrew', '.heb', '.gk', '.original']);
      let translit = pickFirstText(row, ['.translit', '.transliteration', '.pronun', '.pron']);
      let english = pickFirstText(row, ['.english', '.eng', '.kjv', '.nasb', '.gloss']);
      let strongs = pickFirstText(row, ['.strongsnum', '.strongs', '.strg', '.str', '.strongs-num']);

      // Cell-position fallback if class-based gave nothing.
      // Common BibleHub layout: [Strongs] [Greek/Hebrew] [Translit] [English]
      if (!greek && !translit && !english && !strongs && cells.length >= 4) {
        strongs = (cells[0]?.textContent || '').trim();
        greek = (cells[1]?.textContent || '').trim();
        translit = (cells[2]?.textContent || '').trim();
        english = (cells[3]?.textContent || '').trim();
      }

      if (!greek && !translit && !english && !strongs) continue;

      // Escape pipes (would break GFM table syntax) and collapse whitespace.
      const safe = [greek, translit, english, strongs].map((s) =>
        (s || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
      );
      lines.push(`| ${safe.join(' | ')} |`);
      dataRowCount++;
    }

    return dataRowCount > 0 ? lines.join('\n') : null;
  } catch (e) {
    return null;
  }
}

function pickFirstText(scope, selectors) {
  for (const sel of selectors) {
    try {
      const el = scope.querySelector(sel);
      if (el && el.textContent && el.textContent.trim()) {
        return el.textContent.trim();
      }
    } catch (e) { /* invalid selector — skip */ }
  }
  return '';
}

/**
 * Strip <table> elements from an HTML fragment. Used after
 * buildInterlinearTable() to prevent the same table data from
 * appearing twice (once as GFM table, once as fallback markdown).
 */
function stripTables(html) {
  if (!html) return '';
  return String(html).replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, '');
}

export function htmlToMarkdown(html) {
  if (!html) return '';
  let s = String(html);
  s = s.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  for (let lvl = 1; lvl <= 6; lvl++) {
    const re = new RegExp(`<h${lvl}\\b[^>]*>([\\s\\S]*?)<\\/h${lvl}>`, 'gi');
    s = s.replace(re, (_, inner) => `\n\n${'#'.repeat(lvl)} ${inner.trim()}\n\n`);
  }
  s = s.replace(/<pre\b[^>]*>\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (_, code) => `\n\n\`\`\`\n${code}\n\`\`\`\n\n`);
  s = s.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi,
    (_, code) => `\n\n\`\`\`\n${code}\n\`\`\`\n\n`);
  s = s.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, t) => '`' + t + '`');
  s = s.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) =>
    '\n\n' + inner.split('\n').map(line => '> ' + line).join('\n') + '\n\n');
  s = s.replace(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) =>
    '\n' + inner.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n') + '\n');
  s = s.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
    let n = 0;
    const items = inner.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi,
      (__, item) => { n++; return `${n}. ${item.trim()}\n`; });
    return '\n' + items + '\n';
  });
  s = s.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, text) => `[${text.trim()}](${href})`);
  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => `**${t}**`);
  s = s.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => `*${t}*`);
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>/gi, '\n\n');
  s = s.replace(/<p\b[^>]*>/gi, '');
  s = s.replace(/<\/?[a-z][^>]*>/gi, '');
  s = decodeEntities(s);
  s = s.replace(/\r\n?/g, '\n');
  s = s.replace(/[ \t]+\n/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

function yamlEscapeScalar(value) {
  if (value === null || value === undefined) return '""';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  let s = String(value);
  if (s.includes('\n')) {
    const indented = s.split('\n').map(l => '  ' + l).join('\n');
    return '|\n' + indented;
  }
  s = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${s}"`;
}

function toIsoTimestamp(ts) {
  if (!ts && ts !== 0) return new Date().toISOString();
  if (typeof ts === 'number') return new Date(ts).toISOString();
  const d = new Date(ts);
  if (!isNaN(d.getTime())) return d.toISOString();
  return String(ts);
}

export function buildFrontmatter(meta, options = {}) {
  const generator = options.generator || GENERATOR_ID;
  const generatorVersion = options.generatorVersion || VERSION;
  const lines = ['---'];
  lines.push(`title: ${yamlEscapeScalar(meta.title || 'Untitled')}`);
  lines.push(`source_url: ${yamlEscapeScalar(meta.source_url || '-')}`);
  lines.push(`captured_at: ${yamlEscapeScalar(toIsoTimestamp(meta.timestamp))}`);
  if (Array.isArray(meta.tags) && meta.tags.length > 0) {
    lines.push('tags:');
    for (const t of meta.tags) {
      lines.push(`  - ${yamlEscapeScalar(String(t))}`);
    }
  }
  if (meta.note && String(meta.note).trim()) {
    lines.push(`note: ${yamlEscapeScalar(meta.note)}`);
  }
  if (meta.extra && typeof meta.extra === 'object') {
    for (const [k, v] of Object.entries(meta.extra)) {
      if (v === null || v === undefined || v === '') continue;
      lines.push(`${k}: ${yamlEscapeScalar(v)}`);
    }
  }
  lines.push(`generator: ${generator}`);
  lines.push(`generator_version: ${generatorVersion}`);
  lines.push('---');
  lines.push('');
  return lines.join('\n');
}

const WIN_RESERVED_NAMES = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);

export function sanitizeFilename(rawName, options = {}) {
  const maxLength = options.maxLength || 80;
  const fallback = options.fallback || 'untitled';
  const ext = options.extension !== undefined ? options.extension : '.md';
  let s = decodeEntities(String(rawName || ''));
  s = s.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-');
  s = s.replace(/\s+/g, '-');
  s = s.replace(/-+/g, '-');
  s = s.replace(/^[.\-\s]+|[.\-\s]+$/g, '');
  if (!s) s = fallback;
  if (s.length > maxLength) s = s.substring(0, maxLength).replace(/-+$/, '');
  if (WIN_RESERVED_NAMES.has(s.toUpperCase())) s = '_' + s;
  return ext ? s + ext : s;
}

function deriveTitleFromContent(text, maxWords = 8) {
  if (!text) return 'Untitled';
  const firstLine = String(text).split('\n').find(l => l.trim()) || '';
  const cleaned = firstLine.replace(/^#+\s*/, '').replace(/\*+/g, '').trim();
  const words = cleaned.split(/\s+/).slice(0, maxWords).join(' ');
  return words || 'Untitled';
}

export function convertItem(item, options = {}) {
  if (!item || typeof item !== 'object') {
    throw new TypeError('agent-markdown-converter: item must be an object');
  }
  const includeFrontmatter = options.includeFrontmatter !== false;
  const includeTitleHeading = options.includeTitleHeading !== false;
  const dateInFilename = options.dateInFilename !== false;
  const filenamePrefix = options.filenamePrefix || '';
  const filenameMaxLength = options.filenameMaxLength || 80;

  // Sanitization pipeline (Strike 012, 2026-05-08): if the item or batch
  // ships noise selectors, strip them BEFORE markdown conversion so that
  // ".versenum", ".footnote", etc., never reach the output.
  const noiseSelectors = item.noiseSelectors || options.noiseSelectors || null;
  const rawContent = noiseSelectors
    ? sanitizeFragment(item.content || '', noiseSelectors)
    : (item.content || '');

  // HERITAGE LOGIC — BibleHub gets interlinear table rendering when possible.
  // If the source profile is biblehub.com, attempt to extract a GFM table
  // first; only fall back to htmlToMarkdown if the table extractor returns
  // null (no interlinear rows found, e.g., a standard passage page).
  let body;
  if (item.profile_host === 'biblehub.com') {
    const interlinearTable = buildInterlinearTable(rawContent);
    body = interlinearTable
      ? interlinearTable + '\n\n' + htmlToMarkdown(stripTables(rawContent))
      : htmlToMarkdown(rawContent);
  } else {
    body = htmlToMarkdown(rawContent);
  }
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

  const datePart = dateInFilename ? '-' + toIsoTimestamp(item.timestamp).slice(0, 10) : '';
  const baseName = filenamePrefix + (title || 'untitled') + datePart;
  const filename = sanitizeFilename(baseName, { maxLength: filenameMaxLength });

  return { filename, markdown };
}

export function convertBatch(items, options = {}) {
  if (!Array.isArray(items)) {
    throw new TypeError('agent-markdown-converter: items must be an array');
  }

  if (options.combined) {
    const combinedFilename = sanitizeFilename(
      options.combinedFilename || `highlights-${new Date().toISOString().slice(0, 10)}`,
      { maxLength: options.filenameMaxLength || 80 }
    );
    const sections = items.map((item) => {
      const single = convertItem(item, { ...options, includeFrontmatter: false, dateInFilename: false });
      return single.markdown;
    });
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

  const files = [];
  const seenFilenames = new Map();
  for (const item of items) {
    const result = convertItem(item, options);
    let final = result.filename;
    const baseKey = final.toLowerCase();
    if (seenFilenames.has(baseKey)) {
      const count = seenFilenames.get(baseKey) + 1;
      seenFilenames.set(baseKey, count);
      const m = final.match(/^(.+?)(\.[^.]+)?$/);
      final = `${m[1]}-${count}${m[2] || ''}`;
    } else {
      seenFilenames.set(baseKey, 1);
    }
    files.push({ filename: final, markdown: result.markdown });
  }
  return { files };
}
