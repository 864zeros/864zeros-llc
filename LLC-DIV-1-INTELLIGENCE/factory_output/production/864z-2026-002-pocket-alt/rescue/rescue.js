// rescue.js - Pocket Rescue Import Wizard [DELTA: BRK-MIG-004]
// 864zeros Build Kit - 20% Custom Development
//
// THE KILLER FEATURE: Import from dying Pocket with zero friction.
// All processing happens locally. No servers. No tracking.

import { put, getAll, count } from '../lib/db.js';
import { parsePocketExport, validatePocketFile } from '../lib/pocket-parser.js';
import { MESSAGE_TYPES } from '../lib/constants.js';

// ===== STATE =====

let parsedData = null;
let currentStep = 1;

// ===== DOM ELEMENTS =====

const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');

const stepUpload = document.getElementById('step-upload');
const stepPreview = document.getElementById('step-preview');
const stepImporting = document.getElementById('step-importing');
const stepComplete = document.getElementById('step-complete');

const btnBack = document.getElementById('btn-back');
const btnImport = document.getElementById('btn-import');
const btnOpenPanel = document.getElementById('btn-open-panel');
const btnImportMore = document.getElementById('btn-import-more');

// ===== INITIALIZATION =====

function init() {
  console.log('[Rescue] Initializing Pocket import wizard...');

  setupUploadHandlers();
  setupNavigationHandlers();

  console.log('[Rescue] Ready');
}

// ===== UPLOAD HANDLING =====

function setupUploadHandlers() {
  // Click to upload
  uploadZone.addEventListener('click', () => {
    fileInput.click();
  });

  // File selected
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  // Drag and drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');

    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
}

async function handleFile(file) {
  console.log('[Rescue] Processing file:', file.name);

  try {
    // Validate file
    const validation = await validatePocketFile(file);

    if (!validation.valid) {
      showError(validation.error);
      return;
    }

    // Parse file content
    const content = await file.text();
    parsedData = parsePocketExport(content);

    console.log('[Rescue] Parsed:', parsedData.stats);

    // Show preview
    showPreview(parsedData);
    goToStep(2);

  } catch (error) {
    console.error('[Rescue] Parse error:', error);
    showError('Failed to parse file: ' + error.message);
  }
}

// ===== PREVIEW =====

function showPreview(data) {
  // Update stats
  document.getElementById('preview-total').textContent = data.stats.total;
  document.getElementById('preview-unread').textContent = data.stats.unread;
  document.getElementById('preview-archived').textContent = data.stats.archived;
  document.getElementById('preview-tags').textContent = data.stats.uniqueTags;

  // Show sample articles
  const sampleList = document.getElementById('sample-list');
  const samples = data.articles.slice(0, 5);

  sampleList.innerHTML = samples.map(article =>
    `<li>${escapeHtml(article.title)}</li>`
  ).join('');
}

// ===== IMPORT =====

async function runImport() {
  if (!parsedData || !parsedData.articles.length) {
    showError('No articles to import');
    return;
  }

  goToStep(3);

  const articles = parsedData.articles;
  const total = articles.length;
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Get existing URLs to check for duplicates
  const existing = await getAll('articles');
  const existingUrls = new Set(existing.map(a => a.url));

  // Update UI
  document.getElementById('import-total').textContent = total;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];

    try {
      // Skip duplicates
      if (existingUrls.has(article.url)) {
        skipped++;
      } else {
        // Save to IndexedDB (OFFLINE-FIRST)
        await put('articles', article);
        imported++;
        existingUrls.add(article.url); // Track for batch duplicates
      }
    } catch (error) {
      console.error('[Rescue] Import error:', error);
      errors++;
    }

    // Update progress
    const progress = Math.round(((i + 1) / total) * 100);
    document.getElementById('import-progress').style.width = `${progress}%`;
    document.getElementById('import-current').textContent = i + 1;

    // Yield to UI every 10 items
    if (i % 10 === 0) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // Show completion
  showCompletion(imported, skipped, errors);
  goToStep(4);

  // Notify other parts of extension
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.IMPORT_COMPLETE,
    stats: { imported, skipped, errors }
  }).catch(() => { /* Panel might not be open */ });

  console.log(`[Rescue] Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);
}

function showCompletion(imported, skipped, errors) {
  document.getElementById('complete-count').textContent = imported;
  document.getElementById('stat-imported').textContent = imported;
  document.getElementById('stat-skipped').textContent = skipped;

  if (errors > 0) {
    document.getElementById('error-stat').style.display = 'flex';
    document.getElementById('stat-errors').textContent = errors;
  }
}

// ===== NAVIGATION =====

function setupNavigationHandlers() {
  btnBack.addEventListener('click', () => {
    goToStep(1);
    resetState();
  });

  btnImport.addEventListener('click', () => {
    runImport();
  });

  btnOpenPanel.addEventListener('click', () => {
    // Open side panel
    chrome.tabs.getCurrent((tab) => {
      chrome.sidePanel.open({ windowId: tab.windowId });
      window.close();
    });
  });

  btnImportMore.addEventListener('click', () => {
    goToStep(1);
    resetState();
  });
}

function goToStep(step) {
  currentStep = step;

  // Update step indicator
  document.querySelectorAll('.step').forEach((el, index) => {
    el.classList.remove('active', 'completed');
    if (index + 1 < step) {
      el.classList.add('completed');
    } else if (index + 1 === step) {
      el.classList.add('active');
    }
  });

  // Show correct content
  [stepUpload, stepPreview, stepImporting, stepComplete].forEach(el => {
    el.classList.remove('active');
  });

  switch (step) {
    case 1:
      stepUpload.classList.add('active');
      break;
    case 2:
      stepPreview.classList.add('active');
      break;
    case 3:
      stepImporting.classList.add('active');
      break;
    case 4:
      stepComplete.classList.add('active');
      break;
  }
}

function resetState() {
  parsedData = null;
  fileInput.value = '';
  document.getElementById('import-progress').style.width = '0%';
  document.getElementById('import-current').textContent = '0';
  document.getElementById('error-stat').style.display = 'none';
}

// ===== HELPERS =====

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function showError(message) {
  // Simple alert for now - could be enhanced with toast UI
  alert(message);
}

// ===== INIT =====

init();
