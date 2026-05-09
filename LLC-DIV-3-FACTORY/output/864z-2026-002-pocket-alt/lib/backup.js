// backup.js - Backup & Restore [BRK-MIG-002: Migration_Engine]
// 864zeros Build Kit - Export/Import Pipeline

import { exportAll, importAll } from './db.js';
import { getState, setState } from './store.js';
import { APP_SLUG, APP_NAME } from './constants.js';

/**
 * Export entire database as JSON file.
 * Always available at every tier. OFFLINE-FIRST.
 */
export async function exportLocal() {
  try {
    const data = await exportAll();

    // Create downloadable file
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    const filename = `${APP_SLUG}_backup_${formatDate(new Date())}.json`;
    const url = URL.createObjectURL(blob);

    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`[backup.js] Exported to ${filename}`);
    return { success: true, filename };
  } catch (error) {
    console.error('[backup.js] Export failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export as HTML (browser bookmarks compatible).
 */
export async function exportAsHTML() {
  try {
    const data = await exportAll();
    const articles = data.stores?.articles || [];

    // Generate HTML bookmarks format
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
  <DT><H3 ADD_DATE="${Math.floor(Date.now() / 1000)}">${APP_NAME} Export</H3>
  <DL><p>
`;

    for (const article of articles) {
      const addDate = Math.floor(new Date(article.createdAt).getTime() / 1000);
      html += `    <DT><A HREF="${escapeHtml(article.url)}" ADD_DATE="${addDate}">${escapeHtml(article.title)}</A>\n`;
    }

    html += `  </DL><p>
</DL><p>`;

    const blob = new Blob([html], { type: 'text/html' });
    const filename = `${APP_SLUG}_bookmarks_${formatDate(new Date())}.html`;
    downloadBlob(blob, filename);

    return { success: true, filename, count: articles.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Export as CSV (spreadsheet analysis).
 */
export async function exportAsCSV() {
  try {
    const data = await exportAll();
    const articles = data.stores?.articles || [];

    // CSV header
    let csv = 'Title,URL,Status,Favorite,Created,Tags\n';

    for (const article of articles) {
      const row = [
        escapeCsv(article.title),
        escapeCsv(article.url),
        article.status || 'unread',
        article.favorite ? 'Yes' : 'No',
        article.createdAt || '',
        (article.tags || []).join('; ')
      ];
      csv += row.join(',') + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const filename = `${APP_SLUG}_export_${formatDate(new Date())}.csv`;
    downloadBlob(blob, filename);

    return { success: true, filename, count: articles.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Export as Markdown (Obsidian/Notion compatible).
 */
export async function exportAsMarkdown() {
  try {
    const data = await exportAll();
    const articles = data.stores?.articles || [];

    let md = `# ${APP_NAME} Export\n\n`;
    md += `Exported: ${new Date().toISOString()}\n`;
    md += `Total Articles: ${articles.length}\n\n`;
    md += `---\n\n`;

    for (const article of articles) {
      md += `## ${article.title}\n\n`;
      md += `- **URL:** [Link](${article.url})\n`;
      md += `- **Status:** ${article.status || 'unread'}\n`;
      md += `- **Saved:** ${article.createdAt || 'Unknown'}\n`;
      if (article.tags?.length > 0) {
        md += `- **Tags:** ${article.tags.map(t => `#${t}`).join(' ')}\n`;
      }
      if (article.excerpt) {
        md += `\n> ${article.excerpt}\n`;
      }
      md += `\n---\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const filename = `${APP_SLUG}_export_${formatDate(new Date())}.md`;
    downloadBlob(blob, filename);

    return { success: true, filename, count: articles.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Import JSON file into database.
 */
export async function importLocal(file) {
  try {
    const content = await file.text();
    const data = JSON.parse(content);

    // Validate format
    if (!data.app || !data.stores) {
      throw new Error('Invalid backup file format');
    }

    // Check app match
    if (data.app !== `${APP_SLUG}_db`) {
      throw new Error(`This backup is from a different app: ${data.app}`);
    }

    const result = await importAll(data);

    console.log('[backup.js] Import complete:', result);
    return {
      success: true,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors.length
    };
  } catch (error) {
    console.error('[backup.js] Import failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get last sync timestamp.
 */
export async function getLastSyncTimestamp() {
  return await getState('lastSync');
}

/**
 * Set last sync timestamp.
 */
export async function setLastSyncTimestamp() {
  await setState('lastSync', new Date().toISOString());
}

// ===== HELPER FUNCTIONS =====

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeCsv(text) {
  if (!text) return '';
  // Wrap in quotes and escape internal quotes
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
