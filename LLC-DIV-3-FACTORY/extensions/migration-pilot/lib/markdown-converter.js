// lib/markdown-converter.js — ESM port of agent-markdown-converter brick
// 864zeros LLC | MigrationPilot v0.1.0
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
