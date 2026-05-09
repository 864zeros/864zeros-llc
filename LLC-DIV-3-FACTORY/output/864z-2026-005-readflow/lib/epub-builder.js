/**
 * epub-builder.js - Client-Side ePub Generator
 * Strike: 864z-2026-005 (ReadFlow)
 *
 * Generates ePub files entirely client-side using JSZip-like approach.
 * No external dependencies - pure JavaScript implementation.
 *
 * ePub Structure:
 * - mimetype (uncompressed)
 * - META-INF/container.xml
 * - OEBPS/content.opf (package file)
 * - OEBPS/toc.ncx (navigation)
 * - OEBPS/nav.xhtml (EPUB3 navigation)
 * - OEBPS/styles.css
 * - OEBPS/chapter_*.xhtml (articles)
 */

/**
 * Generate ePub digest from articles
 * @param {Object[]} articles - Articles to include
 * @param {Object} options - Generation options
 * @returns {Promise<Blob>} - ePub file as Blob
 */
export async function generateEpub(articles, options = {}) {
  const {
    title = 'ReadFlow Digest',
    author = 'ReadFlow',
    maxArticles = 10
  } = options;

  // Limit articles
  const selectedArticles = articles.slice(0, maxArticles);

  if (selectedArticles.length === 0) {
    throw new Error('No articles to include in digest');
  }

  // Generate date string for filename
  const dateStr = new Date().toISOString().split('T')[0];
  const bookTitle = `${title}_${dateStr}`;
  const bookId = `readflow-${dateStr}-${Date.now()}`;

  // Build ePub structure
  const files = {};

  // 1. mimetype (must be first, uncompressed)
  files['mimetype'] = {
    content: 'application/epub+zip',
    compressed: false
  };

  // 2. META-INF/container.xml
  files['META-INF/container.xml'] = {
    content: generateContainerXml(),
    compressed: true
  };

  // 3. OEBPS/content.opf (package document)
  files['OEBPS/content.opf'] = {
    content: generateContentOpf(bookId, bookTitle, author, selectedArticles),
    compressed: true
  };

  // 4. OEBPS/toc.ncx (NCX navigation for EPUB2 compatibility)
  files['OEBPS/toc.ncx'] = {
    content: generateTocNcx(bookId, bookTitle, selectedArticles),
    compressed: true
  };

  // 5. OEBPS/nav.xhtml (EPUB3 navigation)
  files['OEBPS/nav.xhtml'] = {
    content: generateNavXhtml(bookTitle, selectedArticles),
    compressed: true
  };

  // 6. OEBPS/styles.css
  files['OEBPS/styles.css'] = {
    content: generateStylesCss(),
    compressed: true
  };

  // 7. OEBPS/title.xhtml (title page)
  files['OEBPS/title.xhtml'] = {
    content: generateTitlePage(bookTitle, author, selectedArticles.length, dateStr),
    compressed: true
  };

  // 8. Generate chapter files for each article
  selectedArticles.forEach((article, index) => {
    const filename = `OEBPS/chapter_${String(index + 1).padStart(3, '0')}.xhtml`;
    files[filename] = {
      content: generateChapterXhtml(article, index + 1),
      compressed: true
    };
  });

  // Create ZIP archive
  const zipBlob = await createZipArchive(files);

  return zipBlob;
}

/**
 * Generate container.xml
 */
function generateContainerXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

/**
 * Generate content.opf (package document)
 */
function generateContentOpf(bookId, title, author, articles) {
  const now = new Date().toISOString();

  const manifestItems = articles.map((_, i) => {
    const num = String(i + 1).padStart(3, '0');
    return `    <item id="chapter_${num}" href="chapter_${num}.xhtml" media-type="application/xhtml+xml"/>`;
  }).join('\n');

  const spineItems = articles.map((_, i) => {
    const num = String(i + 1).padStart(3, '0');
    return `    <itemref idref="chapter_${num}"/>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(bookId)}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>${now}</dc:date>
    <dc:publisher>ReadFlow</dc:publisher>
    <meta property="dcterms:modified">${now}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
    <item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
${manifestItems}
  </manifest>
  <spine toc="ncx">
    <itemref idref="title"/>
${spineItems}
  </spine>
</package>`;
}

/**
 * Generate toc.ncx (NCX navigation)
 */
function generateTocNcx(bookId, title, articles) {
  const navPoints = articles.map((article, i) => {
    const num = String(i + 1).padStart(3, '0');
    const playOrder = i + 2; // 1 is title page
    return `    <navPoint id="navpoint_${num}" playOrder="${playOrder}">
      <navLabel><text>${escapeXml(article.title || 'Untitled')}</text></navLabel>
      <content src="chapter_${num}.xhtml"/>
    </navPoint>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(bookId)}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
    <navPoint id="navpoint_title" playOrder="1">
      <navLabel><text>Title</text></navLabel>
      <content src="title.xhtml"/>
    </navPoint>
${navPoints}
  </navMap>
</ncx>`;
}

/**
 * Generate nav.xhtml (EPUB3 navigation)
 */
function generateNavXhtml(title, articles) {
  const navItems = articles.map((article, i) => {
    const num = String(i + 1).padStart(3, '0');
    return `        <li><a href="chapter_${num}.xhtml">${escapeXml(article.title || 'Untitled')}</a></li>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Contents</h1>
    <ol>
      <li><a href="title.xhtml">Title</a></li>
${navItems}
    </ol>
  </nav>
</body>
</html>`;
}

/**
 * Generate styles.css
 */
function generateStylesCss() {
  return `/* ReadFlow ePub Styles */
body {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1em;
  line-height: 1.6;
  margin: 1em;
  padding: 0;
  color: #333;
  background: #fff;
}

h1 {
  font-size: 1.8em;
  font-weight: bold;
  margin: 1em 0 0.5em;
  line-height: 1.2;
}

h2 {
  font-size: 1.4em;
  font-weight: bold;
  margin: 1em 0 0.5em;
}

h3 {
  font-size: 1.2em;
  font-weight: bold;
  margin: 1em 0 0.5em;
}

p {
  margin: 0.8em 0;
  text-align: justify;
  text-indent: 1em;
}

p:first-of-type {
  text-indent: 0;
}

a {
  color: #0066cc;
  text-decoration: none;
}

blockquote {
  margin: 1em 2em;
  padding-left: 1em;
  border-left: 3px solid #ccc;
  font-style: italic;
}

.title-page {
  text-align: center;
  padding-top: 30%;
}

.title-page h1 {
  font-size: 2em;
  margin-bottom: 0.5em;
}

.title-page .subtitle {
  font-size: 1.2em;
  color: #666;
  margin-bottom: 2em;
}

.title-page .meta {
  font-size: 0.9em;
  color: #999;
}

.article-header {
  margin-bottom: 2em;
  padding-bottom: 1em;
  border-bottom: 1px solid #eee;
}

.article-header h1 {
  margin-bottom: 0.3em;
}

.article-meta {
  font-size: 0.85em;
  color: #666;
}

.article-content img {
  max-width: 100%;
  height: auto;
}

.source-link {
  font-size: 0.85em;
  color: #666;
  margin-top: 2em;
  padding-top: 1em;
  border-top: 1px solid #eee;
}

@media (prefers-color-scheme: dark) {
  body {
    color: #e8e6e3;
    background: #1a1a1a;
  }

  .article-header {
    border-bottom-color: #333;
  }

  .source-link {
    border-top-color: #333;
  }
}`;
}

/**
 * Generate title page
 */
function generateTitlePage(title, author, articleCount, dateStr) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div class="title-page">
    <h1>${escapeXml(title.replace(/_/g, ' '))}</h1>
    <p class="subtitle">${articleCount} Articles</p>
    <p class="meta">Generated by ReadFlow</p>
    <p class="meta">${dateStr}</p>
  </div>
</body>
</html>`;
}

/**
 * Generate chapter XHTML for an article
 */
function generateChapterXhtml(article, chapterNum) {
  const title = article.title || 'Untitled';
  const author = article.author || '';
  const date = article.date || '';
  const domain = article.domain || extractDomain(article.url || '');
  const content = article.content || article.textContent || '<p>No content available.</p>';

  // Clean content for XHTML
  const cleanedContent = sanitizeForXhtml(content);

  const metaParts = [];
  if (domain) metaParts.push(domain);
  if (author) metaParts.push(author);
  if (date) metaParts.push(date);
  const metaLine = metaParts.join(' · ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <article>
    <header class="article-header">
      <h1>${escapeXml(title)}</h1>
      ${metaLine ? `<p class="article-meta">${escapeXml(metaLine)}</p>` : ''}
    </header>
    <div class="article-content">
      ${cleanedContent}
    </div>
    ${article.url ? `<p class="source-link">Source: <a href="${escapeXml(article.url)}">${escapeXml(domain)}</a></p>` : ''}
  </article>
</body>
</html>`;
}

/**
 * Sanitize HTML content for XHTML
 */
function sanitizeForXhtml(html) {
  // Convert to XHTML-compatible format
  let xhtml = html;

  // Self-closing tags
  xhtml = xhtml.replace(/<(br|hr|img|input|meta|link)([^>]*)(?<!\/)>/gi, '<$1$2/>');

  // Ensure proper attribute quoting
  xhtml = xhtml.replace(/(\s\w+)=([^"'\s>]+)/g, '$1="$2"');

  // Remove invalid attributes
  xhtml = xhtml.replace(/\s(onclick|onload|onerror|onmouseover)="[^"]*"/gi, '');

  // Escape ampersands not part of entities
  xhtml = xhtml.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/gi, '&amp;');

  return xhtml;
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// ============================================
// ZIP ARCHIVE CREATION (Pure JS Implementation)
// ============================================

/**
 * Create ZIP archive from files
 * @param {Object} files - { path: { content, compressed } }
 * @returns {Promise<Blob>}
 */
async function createZipArchive(files) {
  const entries = [];
  let offset = 0;

  // Process files
  for (const [path, file] of Object.entries(files)) {
    const content = typeof file.content === 'string'
      ? new TextEncoder().encode(file.content)
      : file.content;

    const compressed = file.compressed !== false;
    let compressedData = content;
    let compressionMethod = 0; // Store

    if (compressed && content.length > 0) {
      // Use CompressionStream if available
      if (typeof CompressionStream !== 'undefined') {
        try {
          compressedData = await compressData(content);
          compressionMethod = 8; // Deflate
        } catch (e) {
          // Fall back to store
          compressedData = content;
          compressionMethod = 0;
        }
      }
    }

    const entry = {
      path,
      content,
      compressedData,
      compressionMethod,
      crc32: crc32(content),
      offset
    };

    entries.push(entry);

    // Calculate local file header size
    const localHeaderSize = 30 + path.length + entry.compressedData.length;
    offset += localHeaderSize;
  }

  // Build ZIP file
  const parts = [];

  // Local file headers and data
  for (const entry of entries) {
    parts.push(buildLocalFileHeader(entry));
    parts.push(entry.compressedData);
  }

  // Central directory
  const centralDirStart = offset;
  for (const entry of entries) {
    parts.push(buildCentralDirectoryHeader(entry));
  }

  // End of central directory
  const centralDirSize = parts.slice(entries.length).reduce(
    (sum, part) => sum + part.length, 0
  );
  parts.push(buildEndOfCentralDirectory(entries.length, centralDirSize, centralDirStart));

  // Combine all parts
  const totalSize = parts.reduce((sum, part) => sum + part.length, 0);
  const zipData = new Uint8Array(totalSize);
  let pos = 0;
  for (const part of parts) {
    zipData.set(part, pos);
    pos += part.length;
  }

  return new Blob([zipData], { type: 'application/epub+zip' });
}

/**
 * Compress data using CompressionStream
 */
async function compressData(data) {
  const stream = new CompressionStream('deflate-raw');
  const writer = stream.writable.getWriter();
  writer.write(data);
  writer.close();

  const reader = stream.readable.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Build local file header
 */
function buildLocalFileHeader(entry) {
  const pathBytes = new TextEncoder().encode(entry.path);
  const header = new Uint8Array(30 + pathBytes.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x04034b50, true); // Signature
  view.setUint16(4, 20, true); // Version needed
  view.setUint16(6, 0, true); // Flags
  view.setUint16(8, entry.compressionMethod, true);
  view.setUint16(10, 0, true); // Mod time
  view.setUint16(12, 0, true); // Mod date
  view.setUint32(14, entry.crc32, true);
  view.setUint32(18, entry.compressedData.length, true);
  view.setUint32(22, entry.content.length, true);
  view.setUint16(26, pathBytes.length, true);
  view.setUint16(28, 0, true); // Extra length

  header.set(pathBytes, 30);

  return header;
}

/**
 * Build central directory header
 */
function buildCentralDirectoryHeader(entry) {
  const pathBytes = new TextEncoder().encode(entry.path);
  const header = new Uint8Array(46 + pathBytes.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x02014b50, true); // Signature
  view.setUint16(4, 20, true); // Version made by
  view.setUint16(6, 20, true); // Version needed
  view.setUint16(8, 0, true); // Flags
  view.setUint16(10, entry.compressionMethod, true);
  view.setUint16(12, 0, true); // Mod time
  view.setUint16(14, 0, true); // Mod date
  view.setUint32(16, entry.crc32, true);
  view.setUint32(20, entry.compressedData.length, true);
  view.setUint32(24, entry.content.length, true);
  view.setUint16(28, pathBytes.length, true);
  view.setUint16(30, 0, true); // Extra length
  view.setUint16(32, 0, true); // Comment length
  view.setUint16(34, 0, true); // Disk start
  view.setUint16(36, 0, true); // Internal attrs
  view.setUint32(38, 0, true); // External attrs
  view.setUint32(42, entry.offset, true);

  header.set(pathBytes, 46);

  return header;
}

/**
 * Build end of central directory
 */
function buildEndOfCentralDirectory(entryCount, centralDirSize, centralDirStart) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x06054b50, true); // Signature
  view.setUint16(4, 0, true); // Disk number
  view.setUint16(6, 0, true); // Central dir disk
  view.setUint16(8, entryCount, true); // Entries on disk
  view.setUint16(10, entryCount, true); // Total entries
  view.setUint32(12, centralDirSize, true);
  view.setUint32(16, centralDirStart, true);
  view.setUint16(20, 0, true); // Comment length

  return header;
}

/**
 * Calculate CRC32
 */
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = getCrc32Table();

  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Get CRC32 lookup table
 */
let crc32Table = null;
function getCrc32Table() {
  if (crc32Table) return crc32Table;

  crc32Table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crc32Table[i] = c;
  }

  return crc32Table;
}

/**
 * Generate digest filename
 * @param {Date} date
 * @returns {string}
 */
export function generateDigestFilename(date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  return `ReadFlow_Digest_${dateStr}.epub`;
}

/**
 * Create download link for ePub
 * @param {Blob} epubBlob
 * @param {string} filename
 * @returns {string} - Object URL
 */
export function createDownloadUrl(epubBlob, filename) {
  return URL.createObjectURL(epubBlob);
}

/**
 * Trigger ePub download
 * @param {Blob} epubBlob
 * @param {string} filename
 */
export function downloadEpub(epubBlob, filename) {
  const url = createDownloadUrl(epubBlob, filename);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Clean up after small delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
