/**
 * panel.js — Bible Insight Side Panel UI
 *
 * Handles:
 * - Content display and management
 * - Tag filtering
 * - AI operations (key points, etc.)
 * - Communication with background service worker
 *
 * State-driven: Listens to chrome.storage.onChanged and re-renders.
 */

import { MSG_TYPES, APP_SLUG, CONTENT_TYPES, HIGHLIGHT_COLORS, DEFAULT_HIGHLIGHT_COLOR } from './lib/constants.js';

// ============================================================
// DOM ELEMENTS
// ============================================================

const elements = {
  // Capture buttons
  savePageBtn: document.getElementById('panelSavePageBtn'),
  savePdfBtn: document.getElementById('panelSavePageAsPDFBtn'),
  saveSelectionBtn: document.getElementById('panelSaveSelectionBtn'),
  captureVisibleBtn: document.getElementById('panelCaptureVisibleBtn'),
  captureAreaBtn: document.getElementById('panelCaptureAreaBtn'),
  sermonModeBtn: document.getElementById('panelSermonModeBtn'),

  // Status
  statusMessage: document.getElementById('panelStatusMessage'),

  // Pause banner
  pausedBanner: document.getElementById('pausedBanner'),
  resumeFromPanelBtn: document.getElementById('resumeFromPanelBtn'),

  // Color filter
  colorFilterList: document.getElementById('colorFilterList'),

  // Tags
  tagFilterList: document.getElementById('tagFilterList'),
  newTagInput: document.getElementById('newTagInput'),
  createTagBtn: document.getElementById('createTagBtn'),

  // Filter actions
  filterActionsSection: document.getElementById('filterActionsSection'),
  clearFilterBtn: document.getElementById('clearFilterBtn'),
  synthesizeBtn: document.getElementById('synthesizeBtn'),
  studyDocBtn: document.getElementById('studyDocBtn'),
  askItemsBtn: document.getElementById('askItemsBtn'),

  // Verses
  versesSection: document.getElementById('versesDetectedSection'),
  versesList: document.getElementById('versesDetectedList'),

  // Key points
  keyPointsResult: document.getElementById('keyPointsResultDisplay'),

  // Content list
  contentList: document.getElementById('panelContentList'),

  // Footer
  optionsBtn: document.getElementById('panelOptionsBtn')
};

// State
let currentColorFilter = null;
let currentTagFilter = null;
let allItems = [];
let allTags = [];
let allContentTags = []; // Junction table: which items have which tags
let allVerses = []; // Detected verses from all items

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[panel] Initializing Bible Insight panel...');

  // Apply theme
  await applyTheme();

  // Check pause state
  await checkPauseState();

  // Load initial data
  await loadAllData();

  // Set up event listeners
  setupEventListeners();

  // Listen for storage changes
  chrome.storage.onChanged.addListener(handleStorageChange);

  // Sermon Mode button is always visible now (YouTube detection was too fragile)
  // User clicks it when on a YouTube video page

  console.log('[panel] Panel initialized.');
});

// ============================================================
// THEME
// ============================================================

async function applyTheme() {
  const settings = await chrome.storage.local.get([`${APP_SLUG}_settings`]);
  const theme = settings[`${APP_SLUG}_settings`]?.theme || 'system';

  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else if (theme === 'light') {
    document.body.classList.remove('dark-mode');
  } else {
    // System preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark-mode');
    }
  }
}

// ============================================================
// PAUSE STATE
// ============================================================

async function checkPauseState() {
  try {
    const response = await sendMessage(MSG_TYPES.GET_PAUSE_STATE, {});
    updatePausedBanner(response.isPaused || false);
  } catch (error) {
    console.error('[panel] Error checking pause state:', error);
  }
}

function updatePausedBanner(isPaused) {
  if (elements.pausedBanner) {
    elements.pausedBanner.style.display = isPaused ? 'flex' : 'none';
  }
}

async function resumeExtension() {
  try {
    const response = await sendMessage(MSG_TYPES.SET_PAUSE_STATE, { paused: false });
    if (response.success) {
      updatePausedBanner(false);
      showStatus('success', 'Extension resumed');
    }
  } catch (error) {
    console.error('[panel] Error resuming extension:', error);
    showStatus('error', 'Failed to resume');
  }
}

/**
 * Handle "paused" response from any operation.
 * Shows a helpful message and returns true if the operation was blocked.
 */
function handlePausedResponse(response) {
  if (response?.paused) {
    showStatus('info', 'Extension is paused. Click Resume or go to Settings.');
    updatePausedBanner(true);
    return true;
  }
  return false;
}

// ============================================================
// DATA LOADING
// ============================================================

async function loadAllData() {
  await Promise.all([
    loadItems(),
    loadTags(),
    loadContentTags(),
    loadVerses()
  ]);
}

async function loadItems() {
  try {
    const response = await sendMessage(MSG_TYPES.GET_ALL_ITEMS, {});
    if (response.success) {
      allItems = response.items || [];
      renderContentList();
    } else {
      showStatus('error', 'Failed to load items');
    }
  } catch (error) {
    console.error('[panel] Error loading items:', error);
    showStatus('error', 'Error loading items');
  }
}

async function loadTags() {
  try {
    const response = await sendMessage(MSG_TYPES.GET_ALL_TAGS, {});
    if (response.success) {
      allTags = response.tags || [];
      renderTagFilter();
    }
  } catch (error) {
    console.error('[panel] Error loading tags:', error);
  }
}

async function loadContentTags() {
  try {
    const response = await sendMessage(MSG_TYPES.GET_CONTENT_TAGS, {});
    if (response.success) {
      allContentTags = response.contentTags || [];
    }
  } catch (error) {
    console.error('[panel] Error loading content tags:', error);
    allContentTags = [];
  }
}

async function loadVerses() {
  try {
    const response = await sendMessage(MSG_TYPES.GET_ALL_VERSES, {});
    if (response.success) {
      allVerses = response.verses || [];
      renderVersesSection();
    }
  } catch (error) {
    console.error('[panel] Error loading verses:', error);
    allVerses = [];
  }
}

// ============================================================
// RENDERING
// ============================================================

function renderContentList() {
  if (!elements.contentList) return;

  const items = currentTagFilter
    ? allItems.filter(item => {
        // TODO: Check if item has the current tag
        return true;
      })
    : allItems;

  if (items.length === 0) {
    elements.contentList.innerHTML = `
      <p class="fhg-caption" style="padding: 16px; text-align: center;">
        <i>No saved items yet. Use the buttons above to capture content.</i>
      </p>
    `;
    return;
  }

  elements.contentList.innerHTML = items.map(item => renderContentItem(item)).join('');

  // Add click handlers
  elements.contentList.querySelectorAll('.content-item').forEach(el => {
    el.addEventListener('click', () => toggleItemDetails(el));
  });

  elements.contentList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id, 10);
      deleteItem(id);
    });
  });

  // Tag remove buttons on items
  elements.contentList.querySelectorAll('.item-tag-remove').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const itemId = parseInt(btn.dataset.itemId, 10);
      const tagId = parseInt(btn.dataset.tagId, 10);
      await quickRemoveTag(itemId, tagId, btn);
    });
  });

  // Return to source buttons
  elements.contentList.querySelectorAll('.return-source-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = parseInt(btn.dataset.id, 10);
      const item = allItems.find(i => i.id === itemId);
      if (item) returnToSource(item);
    });
  });

  // Verse reference clicks - lookup the verse
  elements.contentList.querySelectorAll('.verse-ref').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const ref = el.dataset.reference;
      lookupAndDisplayVerse(ref);
    });
  });
}

function renderContentItem(item) {
  const typeIcon = getTypeIcon(item.type);
  const preview = getPreview(item);
  const timestamp = formatTimestamp(item.createdAt);
  const color = item.color || DEFAULT_HIGHLIGHT_COLOR;
  const hasNotes = item.notes && item.notes.trim().length > 0;
  const itemTags = getTagsForItem(item.id);
  const itemVerses = getVersesForItem(item.id);
  const hasUrl = item.url && item.url.length > 0;

  // Verse references detected in this item
  const versesHtml = itemVerses.length > 0
    ? `<div class="item-verses">
        ${itemVerses.slice(0, 5).map(v => `
          <span class="verse-ref" data-reference="${escapeHtml(v.reference)}" title="Click to lookup">
            📖 ${escapeHtml(v.reference)}
          </span>
        `).join('')}
        ${itemVerses.length > 5 ? `<span class="verse-more">+${itemVerses.length - 5} more</span>` : ''}
       </div>`
    : '';

  const tagsHtml = itemTags.length > 0
    ? `<div class="item-tags">
        ${itemTags.map(tag => `
          <span class="item-tag" style="background-color: ${HIGHLIGHT_COLORS[tag.color]?.hex || HIGHLIGHT_COLORS.yellow.hex}">
            ${escapeHtml(tag.name)}
            <button class="item-tag-remove" data-item-id="${item.id}" data-tag-id="${tag.id}" title="Remove tag">&times;</button>
          </span>
        `).join('')}
       </div>`
    : '';

  const sourceLink = hasUrl
    ? `<button class="return-source-btn" data-id="${item.id}" title="Return to source page">↗ Source</button>`
    : '';

  return `
    <div class="content-item" data-id="${item.id}" data-color="${color}">
      <strong>${typeIcon} ${escapeHtml(item.title || 'Untitled')}${hasNotes ? ' 📝' : ''}</strong>
      <p class="preview">${preview}</p>
      ${versesHtml}
      ${tagsHtml}
      <div class="item-footer">
        <span class="timestamp">${timestamp}</span>
        ${sourceLink}
      </div>
      <button class="delete-btn" data-id="${item.id}" title="Delete item">&times;</button>
    </div>
  `;
}

function getTypeIcon(type) {
  switch (type) {
    case CONTENT_TYPES.PAGE: return '📄';
    case CONTENT_TYPES.SELECTION: return '✂️';
    case CONTENT_TYPES.SCREENSHOT: return '📷';
    case CONTENT_TYPES.PDF: return '📕';
    case CONTENT_TYPES.GENERATED_ANALYSIS: return '✨';
    case CONTENT_TYPES.SERMON_NOTES: return '🎤';
    case CONTENT_TYPES.TRANSCRIPT: return '📝';
    default: return '📌';
  }
}

function getPreview(item) {
  // Detect screenshots by type OR by base64 image content
  const isImage = item.type === CONTENT_TYPES.SCREENSHOT ||
                  (item.content && item.content.startsWith('data:image'));

  // For PDFs, show thumbnail with metadata
  if (item.type === CONTENT_TYPES.PDF) {
    const sizeLabel = formatFileSize(item.fileSize || 0);
    const filename = item.pdfFilename || 'document.pdf';

    // If we have a thumbnail (JPEG captured before PDF generation)
    if (item.content && item.content.startsWith('data:image')) {
      return `
        <div class="pdf-preview">
          <div class="pdf-thumb-container">
            <img src="${item.content}" alt="PDF preview" class="pdf-thumbnail" loading="lazy">
            <div class="pdf-badge">PDF</div>
          </div>
          <div class="pdf-info">
            <span class="pdf-filename">${escapeHtml(filename)}</span>
            <span class="pdf-size">${sizeLabel} · Saved to Downloads</span>
          </div>
        </div>
      `;
    }

    // Fallback if no thumbnail
    return `<i>📕 ${escapeHtml(filename)} (${sizeLabel})</i>`;
  }

  if (isImage && item.content && item.content.startsWith('data:')) {
    return `<img src="${item.content}" alt="Screenshot thumbnail" class="screenshot-thumbnail">`;
  }

  if (item.content) {
    const text = item.content.substring(0, 150);
    return escapeHtml(text) + (item.content.length > 150 ? '...' : '');
  }

  return '<i>No preview available</i>';
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get the HTML for detail view content
 * Shows images properly, text content in pre tag
 */
function getDetailContentHtml(item) {
  // Check if content is an image (screenshot or base64 image)
  const isImage = item.type === CONTENT_TYPES.SCREENSHOT ||
                  (item.content && item.content.startsWith('data:image'));

  if (isImage && item.content && item.content.startsWith('data:')) {
    return `<img src="${item.content}" alt="Captured screenshot" class="detail-screenshot">`;
  }

  // For PDFs, show thumbnail and download info
  if (item.type === CONTENT_TYPES.PDF) {
    const sizeLabel = formatFileSize(item.fileSize || 0);
    const filename = item.pdfFilename || 'document.pdf';

    // If we have a thumbnail
    if (item.content && item.content.startsWith('data:image')) {
      return `
        <div class="pdf-detail">
          <img src="${item.content}" alt="PDF preview" class="pdf-detail-thumb">
          <div class="pdf-detail-info">
            <strong>${escapeHtml(filename)}</strong>
            <span>${sizeLabel}</span>
            <span class="pdf-saved-note">✓ Saved to Downloads folder</span>
          </div>
        </div>
      `;
    }

    return `<i>📕 ${escapeHtml(filename)} (${sizeLabel}) - Saved to Downloads</i>`;
  }

  // For text content, show in pre tag with truncation
  if (item.content) {
    const truncated = item.content.substring(0, 2000);
    const suffix = item.content.length > 2000 ? '...' : '';
    return `<pre>${escapeHtml(truncated)}${suffix}</pre>`;
  }

  return '<i>No content</i>';
}

function renderVersesSection() {
  if (!elements.versesSection || !elements.versesList) return;

  if (allVerses.length === 0) {
    elements.versesSection.style.display = 'none';
    return;
  }

  // Get unique verse references
  const uniqueRefs = new Map();
  for (const verse of allVerses) {
    if (!uniqueRefs.has(verse.reference)) {
      uniqueRefs.set(verse.reference, { ...verse, count: 1 });
    } else {
      uniqueRefs.get(verse.reference).count++;
    }
  }

  // Sort by most referenced
  const sortedVerses = Array.from(uniqueRefs.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10

  elements.versesList.innerHTML = sortedVerses.map(v => `
    <span class="verse-chip" data-reference="${escapeHtml(v.reference)}" title="Referenced ${v.count} time${v.count > 1 ? 's' : ''}">
      ${escapeHtml(v.reference)}
      ${v.count > 1 ? `<span class="verse-count">${v.count}</span>` : ''}
    </span>
  `).join('');

  elements.versesSection.style.display = 'block';

  // Add click handlers for verse lookup
  elements.versesList.querySelectorAll('.verse-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const ref = chip.dataset.reference;
      lookupAndDisplayVerse(ref);
    });
  });
}

/**
 * Look up a verse and display it in the key points result area.
 * @param {string} reference - Verse reference like "John 3:16"
 */
async function lookupAndDisplayVerse(reference) {
  showStatus('info', `Looking up ${reference}...`);

  try {
    const response = await sendMessage(MSG_TYPES.LOOKUP_VERSE, {
      reference: reference,
      translation: 'KJV' // TODO: Get from settings
    });

    // Check if operation was blocked due to pause
    if (handlePausedResponse(response)) return;

    if (response.success) {
      displayVerseResult(response.verse);
      showStatus('success', `Found ${reference}`);
    } else {
      showStatus('error', response.error || 'Failed to look up verse');
    }
  } catch (error) {
    console.error('[panel] Verse lookup error:', error);
    showStatus('error', 'Failed to look up verse');
  }
}

/**
 * Display verse lookup result in the key points area.
 * @param {Object} verse - Verse object from API
 */
function displayVerseResult(verse) {
  if (!elements.keyPointsResult) return;

  const crossRefsHtml = verse.noApiKey
    ? `<p class="verse-api-hint">
        Get your free API key at <a href="https://scripture.api.bible" target="_blank">scripture.api.bible</a>
       </p>`
    : '';

  const copyrightHtml = verse.copyright
    ? `<p class="verse-copyright">${escapeHtml(verse.copyright)}</p>`
    : '';

  elements.keyPointsResult.innerHTML = `
    <div class="verse-result">
      <h4 class="verse-reference">${escapeHtml(verse.reference)}</h4>
      <p class="verse-text">${escapeHtml(verse.text)}</p>
      <span class="verse-translation">${escapeHtml(verse.translation)}</span>
      ${copyrightHtml}
      ${crossRefsHtml}
      <div class="verse-actions">
        <button class="fhg-btn fhg-btn-sm fhg-btn-secondary" id="getCrossRefsBtn" data-ref="${escapeHtml(verse.reference)}">
          Show Cross-References
        </button>
      </div>
    </div>
  `;
  elements.keyPointsResult.style.display = 'block';

  // Wire up cross-refs button
  document.getElementById('getCrossRefsBtn')?.addEventListener('click', async (e) => {
    const ref = e.target.dataset.ref;
    await loadCrossRefs(ref);
  });
}

/**
 * Load and display cross-references for a verse.
 * @param {string} reference - Verse reference
 */
async function loadCrossRefs(reference) {
  const btn = document.getElementById('getCrossRefsBtn');

  // Update button to loading state
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner"></span> Finding...`;
  }

  showStatus('info', `Finding related verses for ${reference}...`);

  try {
    const response = await sendMessage(MSG_TYPES.GET_CROSS_REFS, { reference });

    if (response.success && response.crossRefs?.length > 0) {
      displayCrossRefs(reference, response.crossRefs);
      showStatus('success', `Found ${response.crossRefs.length} related verses`);

      // Hide the button after showing results
      if (btn) btn.style.display = 'none';
    } else if (response.crossRefs?.length === 0) {
      showStatus('info', 'No cross-references found. Try a different verse.');
      // Re-enable button
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Show Cross-References';
      }
    } else {
      showStatus('error', response.error || 'Failed to get cross-references');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Try Again';
      }
    }
  } catch (error) {
    console.error('[panel] Cross-refs error:', error);
    showStatus('error', 'Failed to get cross-references');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Try Again';
    }
  }
}

/**
 * Display cross-references.
 * @param {string} sourceRef - Original verse reference
 * @param {Array} crossRefs - Array of cross-reference objects
 */
/**
 * Generate key points for a single item.
 * @param {number} itemId - The item ID
 * @param {HTMLElement} detailsEl - The details element to update
 */
async function generateItemKeyPoints(itemId, detailsEl) {
  const btn = detailsEl.querySelector('.generate-keypoints-btn');
  const resultEl = detailsEl.querySelector('.item-keypoints-result');

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Generating...';
  }

  try {
    const item = allItems.find(i => i.id === itemId);
    if (!item) {
      showStatus('error', 'Item not found');
      return;
    }

    // Check if content is text-based
    if (!item.content || item.type === CONTENT_TYPES.SCREENSHOT) {
      showStatus('error', 'Cannot generate key points for images');
      if (btn) {
        btn.textContent = 'Generate Key Points';
        btn.disabled = false;
      }
      return;
    }

    const response = await sendMessage(MSG_TYPES.GENERATE_KEY_POINTS, {
      contentIds: [itemId],
      tagName: item.title || 'Item'
    });

    if (response.success) {
      // Show result in the item details
      if (resultEl) {
        resultEl.innerHTML = `
          <h4>Key Points</h4>
          <div class="item-keypoints-content">${escapeHtml(response.keyPoints)}</div>
        `;
        resultEl.style.display = 'block';
      }

      showStatus('success', 'Key points generated!');
      await loadItems(); // Refresh to show the new generated analysis item
    } else {
      showStatus('error', response.error || 'Failed to generate key points');
    }
  } catch (error) {
    console.error('[panel] Generate key points error:', error);
    showStatus('error', 'Failed to generate key points. Check API key in Settings.');
  }

  if (btn) {
    btn.textContent = 'Generate Key Points';
    btn.disabled = false;
  }
}

/**
 * Interpret a screenshot image using Gemini Vision.
 * Sends the image to AI for analysis and displays results.
 */
async function interpretImage(itemId, btn, detailsEl) {
  const resultEl = detailsEl.querySelector('.item-keypoints-result');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Analyzing...';
  }

  try {
    const item = allItems.find(i => i.id === itemId);
    if (!item) {
      showStatus('error', 'Item not found');
      return;
    }

    // Check if content is an image
    if (!item.content || !item.content.startsWith('data:image')) {
      showStatus('error', 'No image data found');
      if (btn) {
        btn.textContent = 'Interpret Image';
        btn.disabled = false;
      }
      return;
    }

    showStatus('info', 'Analyzing image with AI...');

    const response = await sendMessage(MSG_TYPES.ANALYZE_IMAGE, {
      imageData: item.content,
      contentId: itemId
    });

    if (response.success && response.analysis) {
      // Show result in the item details
      if (resultEl) {
        const analysisText = response.analysis.description || response.analysis.text || JSON.stringify(response.analysis, null, 2);
        resultEl.innerHTML = `
          <h4>Image Interpretation</h4>
          <div class="image-interpretation-content">${escapeHtml(analysisText).replace(/\n/g, '<br>')}</div>
        `;
        resultEl.style.display = 'block';
      }

      showStatus('success', 'Image interpreted!');
      await loadItems(); // Refresh to show the updated analysis
    } else {
      showStatus('error', response.error || 'Failed to interpret image');
    }
  } catch (error) {
    console.error('[panel] Interpret image error:', error);
    showStatus('error', 'Failed to interpret image. Check API key in Settings.');
  }

  if (btn) {
    btn.innerHTML = 'Interpret Image';
    btn.disabled = false;
  }
}

function displayCrossRefs(sourceRef, crossRefs) {
  if (!elements.keyPointsResult) return;

  const refsHtml = crossRefs.map(ref => `
    <span class="cross-ref-chip" data-reference="${escapeHtml(ref.reference)}" title="Click to read this verse">
      ${escapeHtml(ref.reference)}
    </span>
  `).join('');

  // Append to existing result
  const existingContent = elements.keyPointsResult.innerHTML;
  elements.keyPointsResult.innerHTML = existingContent + `
    <div class="cross-refs-section">
      <h5>Related Verses</h5>
      <p class="cross-refs-hint">Click any verse to read it</p>
      <div class="cross-refs-list">${refsHtml}</div>
    </div>
  `;

  // Wire up cross-ref clicks to lookup those verses
  elements.keyPointsResult.querySelectorAll('.cross-ref-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const ref = chip.dataset.reference;
      lookupAndDisplayVerse(ref);
    });
  });
}

function renderTagFilter() {
  if (!elements.tagFilterList) return;

  if (allTags.length === 0) {
    elements.tagFilterList.innerHTML = '<i class="fhg-caption">No tags yet</i>';
    return;
  }

  elements.tagFilterList.innerHTML = allTags.map(tag => `
    <button class="tag-filter-item ${currentTagFilter === tag.id ? 'active' : ''}"
            data-tag-id="${tag.id}">
      ${escapeHtml(tag.name)}
    </button>
  `).join('');

  // Add click handlers
  elements.tagFilterList.querySelectorAll('.tag-filter-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tagId = parseInt(btn.dataset.tagId, 10);
      filterByTag(tagId);
    });
  });
}

// ============================================================
// EVENT HANDLERS
// ============================================================

function setupEventListeners() {
  // Capture buttons
  elements.savePageBtn?.addEventListener('click', savePage);
  elements.savePdfBtn?.addEventListener('click', savePdf);
  elements.saveSelectionBtn?.addEventListener('click', saveSelection);
  elements.captureVisibleBtn?.addEventListener('click', captureVisible);
  elements.captureAreaBtn?.addEventListener('click', captureArea);
  elements.sermonModeBtn?.addEventListener('click', startSermonMode);

  // Color filter buttons
  elements.colorFilterList?.querySelectorAll('.color-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => filterByColor(btn.dataset.color));
  });

  // Tag creation
  elements.createTagBtn?.addEventListener('click', createTag);
  elements.newTagInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createTag();
  });

  // Filter action buttons
  elements.clearFilterBtn?.addEventListener('click', clearFilter);
  elements.synthesizeBtn?.addEventListener('click', synthesizeFiltered);
  elements.studyDocBtn?.addEventListener('click', generateStudyDocument);
  elements.askItemsBtn?.addEventListener('click', promptAskItems);

  // Pause/Resume from panel
  elements.resumeFromPanelBtn?.addEventListener('click', resumeExtension);

  // Settings
  elements.optionsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// ============================================================
// CAPTURE ACTIONS
// ============================================================

async function savePage() {
  showStatus('info', 'Saving page...');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Execute script to get page content and scroll position
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const scrollPercent = document.documentElement.scrollHeight > 0
          ? window.scrollY / document.documentElement.scrollHeight
          : 0;
        return {
          title: document.title,
          content: document.body.innerText,
          htmlContent: document.body.innerHTML,
          url: window.location.href,
          scrollPercent: scrollPercent
        };
      }
    });

    const pageData = results[0].result;
    const response = await sendMessage(MSG_TYPES.SAVE_PAGE, pageData);

    if (response.success) {
      showStatus('success', 'Page saved!');
      await loadItems();
    } else {
      showStatus('error', response.error || 'Failed to save page');
    }
  } catch (error) {
    console.error('[panel] Save page error:', error);
    showStatus('error', 'Failed to save page');
  }
}

async function savePdf() {
  showStatus('info', 'Generating PDF...');

  try {
    // Get active tab - required for debugger API
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      showStatus('error', 'No active tab found');
      return;
    }

    const response = await sendMessage(MSG_TYPES.SAVE_PDF, { tabId: tab.id });

    if (response.success) {
      showStatus('success', 'PDF downloaded to your Downloads folder!');
      await loadItems();
    } else {
      showStatus('error', response.error || 'Failed to save PDF');
    }
  } catch (error) {
    console.error('[panel] Save PDF error:', error);
    showStatus('error', 'Failed to save PDF');
  }
}

async function saveSelection() {
  showStatus('info', 'Saving selection...');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const selection = window.getSelection().toString();
        const scrollPercent = document.documentElement.scrollHeight > 0
          ? window.scrollY / document.documentElement.scrollHeight
          : 0;
        return {
          text: selection,
          url: window.location.href,
          scrollPercent: scrollPercent
        };
      }
    });

    const { text: selectedText, url, scrollPercent } = results[0].result;

    if (!selectedText || selectedText.trim().length === 0) {
      showStatus('error', 'No text selected');
      return;
    }

    const response = await sendMessage(MSG_TYPES.SAVE_SELECTION, {
      text: selectedText,
      url: url,
      scrollPercent: scrollPercent,
      title: `Selection from ${tab.title}`
    });

    if (response.success) {
      showStatus('success', 'Selection saved!');
      await loadItems();
    } else {
      showStatus('error', response.error || 'Failed to save selection');
    }
  } catch (error) {
    console.error('[panel] Save selection error:', error);
    showStatus('error', 'Failed to save selection');
  }
}

async function captureVisible() {
  showStatus('info', 'Capturing screenshot...');

  try {
    const response = await sendMessage(MSG_TYPES.CAPTURE_VISIBLE, {});

    if (response.success) {
      showStatus('success', 'Screenshot saved!');
      await loadItems();
    } else {
      showStatus('error', response.error || 'Failed to capture screenshot');
    }
  } catch (error) {
    console.error('[panel] Capture visible error:', error);
    showStatus('error', 'Failed to capture screenshot');
  }
}

async function captureArea() {
  showStatus('info', 'Click and drag to select area...');

  try {
    // Get active tab - required for scripting injection
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      showStatus('error', 'No active tab found');
      return;
    }

    const response = await sendMessage(MSG_TYPES.INITIATE_AREA_CAPTURE, { tabId: tab.id });

    if (!response.success) {
      showStatus('error', response.error || 'Failed to start area capture');
    }
    // Status will be updated when capture completes
  } catch (error) {
    console.error('[panel] Capture area error:', error);
    showStatus('error', 'Failed to start area capture');
  }
}

// ============================================================
// YOUTUBE / SERMON MODE
// ============================================================

/**
 * Check if the current tab is a YouTube video and show Sermon Mode button.
 * Retries a few times in case content script isn't ready yet.
 */
async function checkForYouTubeVideo(retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 500;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    // Quick check: is URL youtube.com?
    if (!tab.url?.includes('youtube.com/watch')) {
      console.log('[panel] Not a YouTube video page');
      return;
    }

    console.log('[panel] YouTube page detected, checking for video...');

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'CHECK_YOUTUBE_VIDEO',
      payload: {}
    });

    if (response?.success && response.isYouTube && response.videoId) {
      console.log('[panel] YouTube video found:', response.videoId);
      // Show Sermon Mode button
      if (elements.sermonModeBtn) {
        elements.sermonModeBtn.style.display = 'flex';
        elements.sermonModeBtn.dataset.videoId = response.videoId;
        elements.sermonModeBtn.dataset.title = response.title || '';
        console.log('[panel] Sermon Mode button shown');
      }
    }
  } catch (error) {
    console.log('[panel] YouTube check error:', error.message);

    // Retry if content script not ready
    if (retryCount < MAX_RETRIES) {
      console.log(`[panel] Retrying YouTube check (${retryCount + 1}/${MAX_RETRIES})...`);
      setTimeout(() => checkForYouTubeVideo(retryCount + 1), RETRY_DELAY_MS);
    }
  }
}

/**
 * Start Sermon Mode - extract transcript and save.
 */
async function startSermonMode() {
  showStatus('info', 'Extracting transcript...');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      showStatus('error', 'No active tab');
      return;
    }

    // Request transcript from content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'EXTRACT_YOUTUBE_TRANSCRIPT',
      payload: {}
    });

    if (!response?.success) {
      showStatus('error', response?.error || 'Failed to extract transcript');
      return;
    }

    const transcript = response.transcript;

    // Save as transcript content item
    const saveResponse = await sendMessage(MSG_TYPES.SAVE_PAGE, {
      title: `Sermon: ${transcript.title}`,
      content: formatTranscriptForSave(transcript),
      url: tab.url,
      type: CONTENT_TYPES.TRANSCRIPT,
      meta: {
        videoId: transcript.videoId,
        language: transcript.language,
        segmentCount: transcript.segments.length
      }
    });

    if (saveResponse.success) {
      showStatus('success', `Transcript saved! (${transcript.segments.length} segments)`);
      await loadItems();
    } else {
      showStatus('error', saveResponse.error || 'Failed to save transcript');
    }
  } catch (error) {
    console.error('[panel] Sermon mode error:', error);
    showStatus('error', 'Failed to extract transcript. Make sure captions are available.');
  }
}

/**
 * Format transcript for saving - includes timestamps.
 */
function formatTranscriptForSave(transcript) {
  const lines = transcript.segments.map(seg =>
    `[${seg.timestamp}] ${seg.text}`
  );
  return lines.join('\n');
}

// ============================================================
// COLOR FILTERING
// ============================================================

async function filterByColor(color) {
  // Toggle if same color clicked
  if (currentColorFilter === color) {
    clearFilter();
    return;
  }

  currentColorFilter = color;
  currentTagFilter = null;

  // Update color button states
  elements.colorFilterList?.querySelectorAll('.color-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === color);
  });

  // Clear tag filter UI
  renderTagFilter();

  // Show filter actions
  showFilterActions();

  // Load filtered items
  try {
    const response = await sendMessage(MSG_TYPES.GET_ITEMS_BY_COLOR, { color });
    if (response.success) {
      allItems = response.items || [];
      renderContentList();
      showStatus('info', `Showing ${allItems.length} ${HIGHLIGHT_COLORS[color]?.label || color} items`);
    }
  } catch (error) {
    console.error('[panel] Color filter error:', error);
  }
}

// ============================================================
// TAG FILTERING
// ============================================================

async function filterByTag(tagId) {
  if (currentTagFilter === tagId) {
    clearFilter();
    return;
  }

  currentTagFilter = tagId;
  currentColorFilter = null;

  // Clear color filter UI
  elements.colorFilterList?.querySelectorAll('.color-filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  renderTagFilter();
  showFilterActions();

  // Load filtered items
  try {
    const response = await sendMessage(MSG_TYPES.GET_ITEMS_BY_TAG, { tagId });
    if (response.success) {
      allItems = response.items || [];
      renderContentList();
      const tag = allTags.find(t => t.id === tagId);
      showStatus('info', `Showing ${allItems.length} items tagged "${tag?.name || 'unknown'}"`);
    }
  } catch (error) {
    console.error('[panel] Tag filter error:', error);
  }
}

function showFilterActions() {
  if (elements.filterActionsSection) {
    elements.filterActionsSection.style.display = 'block';
  }
}

function clearFilter() {
  currentTagFilter = null;
  currentColorFilter = null;

  // Clear color filter UI
  elements.colorFilterList?.querySelectorAll('.color-filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  renderTagFilter();

  // Hide filter actions
  if (elements.filterActionsSection) {
    elements.filterActionsSection.style.display = 'none';
  }

  // Reload all items
  loadItems();
}

// ============================================================
// TAG CREATION
// ============================================================

async function createTag() {
  const tagName = elements.newTagInput?.value?.trim();
  if (!tagName) {
    showStatus('error', 'Enter a tag name');
    return;
  }

  try {
    const response = await sendMessage(MSG_TYPES.CREATE_TAG, {
      name: tagName,
      color: DEFAULT_HIGHLIGHT_COLOR
    });

    if (response.success) {
      elements.newTagInput.value = '';
      showStatus('success', `Tag "${tagName}" created`);
      await loadTags();
    } else {
      showStatus('error', response.error || 'Failed to create tag');
    }
  } catch (error) {
    console.error('[panel] Create tag error:', error);
    showStatus('error', 'Failed to create tag');
  }
}

// ============================================================
// ITEM COLOR & NOTES
// ============================================================

async function setItemColor(itemId, color, detailsEl) {
  try {
    const response = await sendMessage(MSG_TYPES.SET_ITEM_COLOR, { id: itemId, color });

    if (response.success) {
      // Update local cache
      const item = allItems.find(i => i.id === itemId);
      if (item) item.color = color;

      // Update UI
      detailsEl.querySelectorAll('.color-picker-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.color === color);
      });

      // Update item element color indicator
      const itemEl = detailsEl.closest('.content-item');
      if (itemEl) itemEl.dataset.color = color;

      showStatus('success', `Color set to ${HIGHLIGHT_COLORS[color]?.label || color}`);
    } else {
      showStatus('error', response.error || 'Failed to set color');
    }
  } catch (error) {
    console.error('[panel] Set color error:', error);
    showStatus('error', 'Failed to set color');
  }
}

async function saveItemNotes(itemId, notes, buttonEl) {
  buttonEl.disabled = true;
  buttonEl.textContent = 'Saving...';

  try {
    const response = await sendMessage(MSG_TYPES.UPDATE_ITEM_NOTES, { id: itemId, notes });

    if (response.success) {
      // Update local cache
      const item = allItems.find(i => i.id === itemId);
      if (item) item.notes = notes;

      buttonEl.textContent = 'Saved!';
      setTimeout(() => {
        buttonEl.textContent = 'Save Notes';
        buttonEl.disabled = false;
      }, 1500);
    } else {
      buttonEl.textContent = 'Error';
      showStatus('error', response.error || 'Failed to save notes');
      setTimeout(() => {
        buttonEl.textContent = 'Save Notes';
        buttonEl.disabled = false;
      }, 1500);
    }
  } catch (error) {
    console.error('[panel] Save notes error:', error);
    buttonEl.textContent = 'Error';
    showStatus('error', 'Failed to save notes');
    setTimeout(() => {
      buttonEl.textContent = 'Save Notes';
      buttonEl.disabled = false;
    }, 1500);
  }
}

async function addTagToItem(itemId, tagName, detailsEl) {
  try {
    // First create or get the tag
    let tag = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());

    if (!tag) {
      const createResponse = await sendMessage(MSG_TYPES.CREATE_TAG, {
        name: tagName,
        color: DEFAULT_HIGHLIGHT_COLOR
      });
      if (createResponse.success) {
        tag = createResponse.tag;
        allTags.push(tag); // Update local state
        renderTagFilter();
      } else {
        showStatus('error', 'Failed to create tag');
        return;
      }
    }

    // Link tag to item
    const response = await sendMessage(MSG_TYPES.LINK_TAG, {
      contentId: itemId,
      tagId: tag.id
    });

    if (response.success) {
      // Update local state
      allContentTags.push({ contentId: itemId, tagId: tag.id });

      showStatus('success', `Tagged with "${tagName}"`);

      // Re-render the item list to show the new tag
      renderContentList();
    } else {
      showStatus('error', response.error || 'Failed to add tag');
    }
  } catch (error) {
    console.error('[panel] Add tag error:', error);
    showStatus('error', 'Failed to add tag');
  }
}

async function removeTagFromItem(itemId, tagId, detailsEl) {
  try {
    const response = await sendMessage(MSG_TYPES.UNLINK_TAG, {
      contentId: itemId,
      tagId
    });

    if (response.success) {
      // Update local state
      allContentTags = allContentTags.filter(ct => !(ct.contentId === itemId && ct.tagId === tagId));

      showStatus('success', 'Tag removed');
      // Remove from UI
      const tagEl = detailsEl.querySelector(`[data-tag-id="${tagId}"]`)?.closest('.tag-item');
      if (tagEl) tagEl.remove();
    } else {
      showStatus('error', response.error || 'Failed to remove tag');
    }
  } catch (error) {
    console.error('[panel] Remove tag error:', error);
    showStatus('error', 'Failed to remove tag');
  }
}

// Quick remove tag from item list (without expanding)
async function quickRemoveTag(itemId, tagId, btnEl) {
  try {
    const response = await sendMessage(MSG_TYPES.UNLINK_TAG, {
      contentId: itemId,
      tagId
    });

    if (response.success) {
      // Update local state
      allContentTags = allContentTags.filter(ct => !(ct.contentId === itemId && ct.tagId === tagId));

      // Remove tag element from UI
      const tagEl = btnEl.closest('.item-tag');
      if (tagEl) tagEl.remove();

      showStatus('success', 'Tag removed');
    } else {
      showStatus('error', response.error || 'Failed to remove tag');
    }
  } catch (error) {
    console.error('[panel] Quick remove tag error:', error);
    showStatus('error', 'Failed to remove tag');
  }
}

// ============================================================
// AI OPERATIONS & SYNTHESIS (Cloud-only via Gemini API)
// ============================================================

async function synthesizeFiltered() {
  if (!currentColorFilter && !currentTagFilter) {
    showStatus('error', 'Select a color or tag filter first');
    return;
  }

  if (allItems.length === 0) {
    showStatus('error', 'No items to synthesize');
    return;
  }

  showStatus('info', 'Synthesizing content...');

  try {
    let response;

    if (currentTagFilter) {
      response = await sendMessage(MSG_TYPES.SYNTHESIZE_BY_TAG, {
        tagId: currentTagFilter
      });
    } else {
      response = await sendMessage(MSG_TYPES.SYNTHESIZE_BY_COLOR, {
        color: currentColorFilter
      });
    }

    // Check if operation was blocked due to pause
    if (handlePausedResponse(response)) return;

    if (response.success) {
      showSynthesisResult(response.synthesis, response.versesReferenced, response.itemCount);
      showStatus('success', 'Synthesis complete!');
      await loadItems();
    } else {
      showStatus('error', response.error || 'Failed to synthesize');
    }
  } catch (error) {
    console.error('[panel] Synthesis error:', error);
    showStatus('error', 'Failed to synthesize content');
  }
}

function showSynthesisResult(synthesis, verses, itemCount) {
  if (!elements.keyPointsResult) return;

  const versesHtml = verses && verses.length > 0
    ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(91, 140, 90, 0.2);">
         <strong>Verses Referenced:</strong> ${verses.map(v => `<em>${escapeHtml(v)}</em>`).join(', ')}
       </div>`
    : '';

  elements.keyPointsResult.innerHTML = `
    <h4>Synthesis Result</h4>
    <div class="key-points-content">${escapeHtml(synthesis)}</div>
    ${versesHtml}
    <span class="source-info">Synthesized from ${itemCount} items</span>
  `;
  elements.keyPointsResult.style.display = 'block';
}

async function generateStudyDocument() {
  if (!currentTagFilter) {
    showStatus('error', 'Select a tag filter first (Study Document requires a tag)');
    return;
  }

  showStatus('info', 'Generating study document...');

  try {
    const response = await sendMessage(MSG_TYPES.GENERATE_STUDY_DOCUMENT, {
      tagId: currentTagFilter,
      options: {}
    });

    // Check if operation was blocked due to pause
    if (handlePausedResponse(response)) return;

    if (response.success) {
      showSynthesisResult(response.document, response.versesReferenced, response.itemCount);
      showStatus('success', 'Study document generated!');
      await loadItems();
    } else {
      showStatus('error', response.error || 'Failed to generate study document');
    }
  } catch (error) {
    console.error('[panel] Study document error:', error);
    showStatus('error', 'Failed to generate study document');
  }
}

async function promptAskItems() {
  const question = prompt('Ask a question about your saved items:');
  if (!question || !question.trim()) return;

  showStatus('info', 'Searching your notes...');

  try {
    const contentIds = allItems.map(i => i.id);
    const response = await sendMessage(MSG_TYPES.ASK_MY_ITEMS, {
      question: question.trim(),
      contentIds: contentIds.length > 0 ? contentIds : null
    });

    if (response.success) {
      showAskResult(question, response.answer, response.itemsSearched);
      showStatus('success', 'Answer found!');
    } else {
      showStatus('error', response.error || 'Failed to search items');
    }
  } catch (error) {
    console.error('[panel] Ask items error:', error);
    showStatus('error', 'Failed to search your notes');
  }
}

function showAskResult(question, answer, itemsSearched) {
  if (!elements.keyPointsResult) return;

  elements.keyPointsResult.innerHTML = `
    <h4>Question: ${escapeHtml(question)}</h4>
    <div class="key-points-content">${escapeHtml(answer)}</div>
    <span class="source-info">Searched ${itemsSearched} items</span>
  `;
  elements.keyPointsResult.style.display = 'block';
}

// ============================================================
// ITEM MANAGEMENT
// ============================================================

function toggleItemDetails(itemEl) {
  const id = parseInt(itemEl.dataset.id, 10);
  const item = allItems.find(i => i.id === id);
  if (!item) return;

  // Check if details already shown
  const existingDetails = itemEl.querySelector('.item-details');
  if (existingDetails) {
    existingDetails.remove();
    return;
  }

  // Build color picker HTML
  const colorPickerHtml = Object.entries(HIGHLIGHT_COLORS).map(([key, config]) => `
    <button class="color-picker-btn ${item.color === key ? 'selected' : ''}"
            data-color="${key}"
            style="background: ${config.hex};"
            title="${config.label}"></button>
  `).join('');

  // Build tags HTML
  const itemTags = getTagsForItem(item.id);
  const tagsHtml = itemTags.length > 0
    ? itemTags.map(tag => `
        <span class="tag-item" style="background-color: ${HIGHLIGHT_COLORS[tag.color]?.hex || HIGHLIGHT_COLORS.yellow.hex}">
          ${escapeHtml(tag.name)}
          <button class="remove-tag-btn" data-tag-id="${tag.id}">&times;</button>
        </span>
      `).join('')
    : '<i class="fhg-caption">No tags</i>';

  // Add details section
  const detailsHtml = `
    <div class="item-details">
      <!-- Color Picker -->
      <div class="color-picker-section">
        <label>Highlight:</label>
        <div class="color-picker-options">${colorPickerHtml}</div>
      </div>

      <!-- Notes Section -->
      <div class="notes-section">
        <label>Personal Notes</label>
        <textarea class="notes-textarea" placeholder="Add your notes here...">${escapeHtml(item.notes || '')}</textarea>
        <div class="notes-actions">
          <button class="fhg-btn fhg-btn-sm fhg-btn-primary save-notes-btn">Save Notes</button>
        </div>
      </div>

      <!-- Tags Section -->
      <div class="detail-tags-section">
        <h5>Tags</h5>
        <div class="tags-list">${tagsHtml}</div>
        <div class="add-tag-controls">
          <input type="text" class="add-tag-input" placeholder="Add tag...">
          <button class="fhg-btn fhg-btn-sm fhg-btn-secondary add-tag-btn">Add</button>
        </div>
      </div>

      <!-- Content Preview -->
      <h4>Content</h4>
      <div class="detail-content">
        ${getDetailContentHtml(item)}
      </div>

      <!-- AI Actions -->
      <div class="detail-ai-actions">
        <button class="fhg-btn fhg-btn-sm fhg-btn-primary generate-keypoints-btn" data-id="${item.id}">
          Generate Key Points
        </button>
        ${(item.type === CONTENT_TYPES.SCREENSHOT || (item.content && item.content.startsWith('data:image'))) ? `
          <button class="fhg-btn fhg-btn-sm fhg-btn-secondary interpret-image-btn" data-id="${item.id}">
            Interpret Image
          </button>
        ` : ''}
      </div>

      ${item.analysis ? `
        <h4>AI Analysis</h4>
        <div class="detail-analysis">
          <pre>${escapeHtml(JSON.stringify(item.analysis, null, 2))}</pre>
        </div>
      ` : ''}

      <div class="item-keypoints-result" style="display: none;"></div>

      <button class="fhg-btn fhg-btn-sm fhg-btn-secondary close-details-btn">Close</button>
    </div>
  `;

  itemEl.insertAdjacentHTML('beforeend', detailsHtml);

  // Event handlers for detail view
  const detailsEl = itemEl.querySelector('.item-details');

  // CRITICAL: Stop all clicks inside details from bubbling up to parent
  // This prevents the detail view from collapsing when clicking inputs/buttons
  detailsEl.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Color picker
  detailsEl.querySelectorAll('.color-picker-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setItemColor(id, btn.dataset.color, detailsEl);
    });
  });

  // Save notes
  detailsEl.querySelector('.save-notes-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const notes = detailsEl.querySelector('.notes-textarea').value;
    saveItemNotes(id, notes, detailsEl.querySelector('.save-notes-btn'));
  });

  // Add tag
  const addTagBtn = detailsEl.querySelector('.add-tag-btn');
  const addTagInput = detailsEl.querySelector('.add-tag-input');
  addTagBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const tagName = addTagInput.value.trim();
    if (tagName) {
      addTagToItem(id, tagName, detailsEl);
      addTagInput.value = '';
    }
  });
  addTagInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      addTagBtn.click();
    }
  });

  // Generate key points button
  detailsEl.querySelector('.generate-keypoints-btn')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const itemId = parseInt(e.target.dataset.id, 10);
    await generateItemKeyPoints(itemId, detailsEl);
  });

  // Interpret image button (for screenshots)
  detailsEl.querySelector('.interpret-image-btn')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const itemId = parseInt(e.target.dataset.id, 10);
    await interpretImage(itemId, e.target, detailsEl);
  });

  // Remove tag buttons
  detailsEl.querySelectorAll('.remove-tag-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tagId = parseInt(btn.dataset.tagId, 10);
      removeTagFromItem(id, tagId, detailsEl);
    });
  });

  // Close button
  detailsEl.querySelector('.close-details-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    detailsEl.remove();
  });
}

// Get tags for a specific item
function getTagsForItem(contentId) {
  const tagIds = allContentTags
    .filter(ct => ct.contentId === contentId)
    .map(ct => ct.tagId);

  return allTags.filter(tag => tagIds.includes(tag.id));
}

// Get verses for a specific item
function getVersesForItem(contentId) {
  return allVerses.filter(v => v.contentId === contentId);
}

async function deleteItem(id) {
  if (!confirm('Delete this item?')) return;

  try {
    const response = await sendMessage(MSG_TYPES.DELETE_ITEM, { id });

    if (response.success) {
      showStatus('success', 'Item deleted');
      await loadItems();
    } else {
      showStatus('error', response.error || 'Failed to delete item');
    }
  } catch (error) {
    console.error('[panel] Delete error:', error);
    showStatus('error', 'Failed to delete item');
  }
}

// ============================================================
// STORAGE CHANGE HANDLER
// ============================================================

function handleStorageChange(changes, area) {
  if (area !== 'local') return;

  // Check for data updates
  if (changes[`${APP_SLUG}_lastUpdate`]) {
    loadAllData();
  }

  // Check for theme changes
  if (changes[`${APP_SLUG}_settings`]) {
    applyTheme();
  }
}

// ============================================================
// UTILITIES
// ============================================================

function sendMessage(type, payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

function showStatus(type, message) {
  if (!elements.statusMessage) return;

  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `fhg-status fhg-status-${type}`;
  elements.statusMessage.style.display = 'block';

  // Auto-hide success messages
  if (type === 'success') {
    setTimeout(() => {
      elements.statusMessage.style.display = 'none';
    }, 3000);
  }
}

function formatTimestamp(isoString) {
  if (!isoString) return '';

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generate a URL with text fragment for scroll-to-text
 * Chrome's #:~:text= feature scrolls AND highlights the text
 * @param {Object} item - The content item
 * @returns {string|null} - URL with text fragment or null
 */
function generateReturnUrl(item) {
  if (!item.url) return null;

  // If we have a text fragment, use it
  if (item.textFragment) {
    // Clean up the text for URL fragment:
    // - Remove newlines and extra whitespace
    // - Take first 60 chars (shorter is more reliable)
    // - Trim whitespace
    let cleanText = item.textFragment
      .replace(/[\r\n]+/g, ' ')  // Replace newlines with space
      .replace(/\s+/g, ' ')       // Collapse multiple spaces
      .trim()
      .substring(0, 60);          // Chrome works better with shorter fragments

    // Don't use fragment if text is too short
    if (cleanText.length < 3) {
      return item.url;
    }

    const encodedText = encodeURIComponent(cleanText);
    // Remove any existing hash/fragment
    const baseUrl = item.url.split('#')[0];
    return `${baseUrl}#:~:text=${encodedText}`;
  }

  // Fallback: just return the URL (scroll percent handled separately)
  return item.url;
}

/**
 * Open the source URL
 * TODO: Scroll restoration not working reliably - revisit later
 * @param {Object} item - The content item
 */
async function returnToSource(item) {
  const url = generateReturnUrl(item);
  if (!url) {
    showStatus('error', 'No source URL saved');
    return;
  }

  // Open in new tab (text fragments handled by Chrome natively)
  await chrome.tabs.create({ url: url, active: true });

  // TODO: Scroll restoration commented out - not working reliably
  // if (!item.textFragment && item.scrollPercent > 0) {
  //   let attempts = 0;
  //   const maxAttempts = 10;
  //   const interval = 500;
  //   const tryScroll = async () => {
  //     attempts++;
  //     try {
  //       const response = await chrome.tabs.sendMessage(tab.id, {
  //         type: 'BI_RESTORE_SCROLL',
  //         payload: { scrollPercent: item.scrollPercent }
  //       });
  //       if (response?.success) {
  //         console.log('[panel] Scroll restored to', response.scrolledTo);
  //         return;
  //       }
  //     } catch (e) {
  //       console.log('[panel] Scroll attempt', attempts, '- waiting for content script...');
  //     }
  //     if (attempts < maxAttempts) {
  //       setTimeout(tryScroll, interval);
  //     }
  //   };
  //   setTimeout(tryScroll, 800);
  // }
}

console.log('[panel] Bible Insight panel script loaded.');
