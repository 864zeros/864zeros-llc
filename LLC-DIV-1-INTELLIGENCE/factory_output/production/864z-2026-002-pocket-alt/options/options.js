// options.js - Settings Page Logic
// 864zeros Build Kit - ReadVault Extension

import { count, clearStore } from '../lib/db.js';
import {
  exportLocal,
  exportAsHTML,
  exportAsCSV,
  exportAsMarkdown,
  importLocal
} from '../lib/backup.js';

// ===== DOM ELEMENTS =====

const statArticles = document.getElementById('stat-articles');
const btnExportJson = document.getElementById('btn-export-json');
const btnExportHtml = document.getElementById('btn-export-html');
const btnExportCsv = document.getElementById('btn-export-csv');
const btnExportMd = document.getElementById('btn-export-md');
const btnImport = document.getElementById('btn-import');
const importFile = document.getElementById('import-file');
const btnDeleteAll = document.getElementById('btn-delete-all');
const btnPocketImport = document.getElementById('btn-pocket-import');
const toast = document.getElementById('toast');

// ===== INITIALIZATION =====

async function init() {
  console.log('[Options] Initializing...');

  await loadStats();
  setupEventListeners();

  console.log('[Options] Ready');
}

async function loadStats() {
  try {
    const articleCount = await count('articles');
    statArticles.textContent = `${articleCount} article${articleCount !== 1 ? 's' : ''} saved`;
  } catch (error) {
    statArticles.textContent = 'Unable to load';
  }
}

// ===== EVENT LISTENERS =====

function setupEventListeners() {
  // Export handlers
  btnExportJson.addEventListener('click', async () => {
    const result = await exportLocal();
    if (result.success) {
      showToast(`Exported to ${result.filename}`);
    } else {
      showToast('Export failed: ' + result.error);
    }
  });

  btnExportHtml.addEventListener('click', async () => {
    const result = await exportAsHTML();
    if (result.success) {
      showToast(`Exported ${result.count} articles to HTML`);
    } else {
      showToast('Export failed: ' + result.error);
    }
  });

  btnExportCsv.addEventListener('click', async () => {
    const result = await exportAsCSV();
    if (result.success) {
      showToast(`Exported ${result.count} articles to CSV`);
    } else {
      showToast('Export failed: ' + result.error);
    }
  });

  btnExportMd.addEventListener('click', async () => {
    const result = await exportAsMarkdown();
    if (result.success) {
      showToast(`Exported ${result.count} articles to Markdown`);
    } else {
      showToast('Export failed: ' + result.error);
    }
  });

  // Import handler
  btnImport.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const result = await importLocal(file);

      if (result.success) {
        showToast(`Imported ${result.imported} articles (${result.skipped} skipped)`);
        await loadStats();
      } else {
        showToast('Import failed: ' + result.error);
      }

      importFile.value = '';
    }
  });

  // Delete all handler
  btnDeleteAll.addEventListener('click', async () => {
    const confirmed = confirm(
      'Are you sure you want to delete ALL your saved articles?\n\n' +
      'This action cannot be undone. Consider exporting your data first.'
    );

    if (confirmed) {
      const doubleConfirm = confirm(
        'Final confirmation: Delete everything?'
      );

      if (doubleConfirm) {
        try {
          await clearStore('articles');
          showToast('All articles deleted');
          await loadStats();
        } catch (error) {
          showToast('Delete failed: ' + error.message);
        }
      }
    }
  });

  // Pocket import handler
  btnPocketImport.addEventListener('click', () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('rescue/rescue.html')
    });
  });
}

// ===== TOAST =====

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ===== INIT =====

init();
