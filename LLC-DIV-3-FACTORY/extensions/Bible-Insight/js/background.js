/**
 * background.js — Bible Insight Service Worker
 *
 * Central orchestration hub for the extension:
 * - Message routing between UI, content scripts, and APIs
 * - IndexedDB operations
 * - AI processing pipeline
 * - Bible verse detection and lookup
 *
 * MV3 Rules:
 * - All listeners registered at top level
 * - No persistent state in global variables
 * - Use chrome.storage for anything that must survive restart
 */

import {
  APP_NAME,
  APP_SLUG,
  DB_NAME,
  DB_VERSION,
  DB_SCHEMA,
  MSG_TYPES,
  DEFAULT_SETTINGS,
  CONTENT_TYPES,
  HIGHLIGHT_COLORS,
  DEFAULT_HIGHLIGHT_COLOR,
  AI_CONFIG
} from './lib/constants.js';

import { initDB, put, get, getAll, remove, query, count } from './lib/db.js';
import { analyzeText, analyzeImage, lookupVerse, getCrossRefs, detectVersesWithAI, getTokenUsage, resetTokenUsage } from './lib/api.js';
import { detectVerses } from './lib/verse-detector.js';
import { isPaused, handlePauseMessage } from './lib/pause-toggle.js';

// ============================================================
// SIDE PANEL BEHAVIOR
// ============================================================
// Opens the side panel when user clicks the toolbar icon.
// This CANNOT be set in manifest — only via API.

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[background] Panel behavior error:', error));

// ============================================================
// INSTALL / UPDATE
// ============================================================

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    console.log(`[background] ${APP_NAME} installed. Initializing...`);

    // Initialize IndexedDB
    await initDB(DB_NAME, DB_VERSION, DB_SCHEMA);

    // Set default settings
    await chrome.storage.local.set({
      [`${APP_SLUG}_initialized`]: true,
      [`${APP_SLUG}_settings`]: DEFAULT_SETTINGS
    });

    console.log('[background] Database and settings initialized.');
  }

  if (reason === 'update') {
    console.log(`[background] ${APP_NAME} updated.`);
    // Handle any migrations here
  }
});

// ============================================================
// MESSAGE ROUTING
// ============================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  console.log('[background] Message received:', type);

  // Handle pause toggle messages first
  const pauseHandled = handlePauseMessage(type, payload, sendResponse);
  if (pauseHandled !== null) return pauseHandled;

  // Route by message type
  switch (type) {
    // --- Content Capture ---
    case MSG_TYPES.SAVE_PAGE:
      handleSavePage(payload, sender.tab, sendResponse);
      return true;

    case MSG_TYPES.SAVE_SELECTION:
      handleSaveSelection(payload, sender.tab, sendResponse);
      return true;

    case MSG_TYPES.SAVE_PDF:
      handleSavePDF(payload, sender.tab, sendResponse);
      return true;

    case MSG_TYPES.CAPTURE_VISIBLE:
      handleCaptureVisible(sender.tab, sendResponse);
      return true;

    case MSG_TYPES.INITIATE_AREA_CAPTURE:
      handleInitiateAreaCapture(payload, sender.tab, sendResponse);
      return true;

    case MSG_TYPES.CAPTURE_AREA:
      handleCaptureArea(payload, sender.tab, sendResponse);
      return true;

    // --- Content Retrieval ---
    case MSG_TYPES.GET_ALL_ITEMS:
      handleGetAllItems(sendResponse);
      return true;

    case MSG_TYPES.GET_ITEM:
      handleGetItem(payload.id, sendResponse);
      return true;

    case MSG_TYPES.DELETE_ITEM:
      handleDeleteItem(payload.id, sendResponse);
      return true;

    case MSG_TYPES.UPDATE_ITEM:
      handleUpdateItem(payload.id, payload.updates, sendResponse);
      return true;

    // --- Notes ---
    case MSG_TYPES.UPDATE_ITEM_NOTES:
      handleUpdateItemNotes(payload.id, payload.notes, sendResponse);
      return true;

    // --- Tags (color-based) ---
    case MSG_TYPES.GET_ALL_TAGS:
      handleGetAllTags(sendResponse);
      return true;

    case MSG_TYPES.GET_CONTENT_TAGS:
      handleGetContentTags(sendResponse);
      return true;

    case MSG_TYPES.CREATE_TAG:
      handleCreateTag(payload.name, payload.color, sendResponse);
      return true;

    case MSG_TYPES.DELETE_TAG:
      handleDeleteTag(payload.tagId, sendResponse);
      return true;

    case MSG_TYPES.LINK_TAG:
      handleLinkTag(payload.contentId, payload.tagId, sendResponse);
      return true;

    case MSG_TYPES.UNLINK_TAG:
      handleUnlinkTag(payload.contentId, payload.tagId, sendResponse);
      return true;

    case MSG_TYPES.SET_ITEM_COLOR:
      handleSetItemColor(payload.id, payload.color, sendResponse);
      return true;

    case MSG_TYPES.GET_ITEMS_BY_TAG:
      handleGetItemsByTag(payload.tagId, sendResponse);
      return true;

    case MSG_TYPES.GET_ITEMS_BY_COLOR:
      handleGetItemsByColor(payload.color, sendResponse);
      return true;

    // --- AI Operations (single item) ---
    case MSG_TYPES.GENERATE_KEY_POINTS:
      handleGenerateKeyPoints(payload, sendResponse);
      return true;

    case MSG_TYPES.ANALYZE_IMAGE:
      handleAnalyzeImage(payload, sendResponse);
      return true;

    case MSG_TYPES.SUGGEST_TAGS:
      handleSuggestTags(payload.contentId, sendResponse);
      return true;

    // --- Synthesis Operations (Pro tier) ---
    case MSG_TYPES.SYNTHESIZE_BY_TAG:
      handleSynthesizeByTag(payload.tagId, sendResponse);
      return true;

    case MSG_TYPES.SYNTHESIZE_BY_COLOR:
      handleSynthesizeByColor(payload.color, sendResponse);
      return true;

    case MSG_TYPES.EXTRACT_ALL_VERSES:
      handleExtractAllVerses(payload.contentIds, sendResponse);
      return true;

    case MSG_TYPES.GENERATE_STUDY_DOCUMENT:
      handleGenerateStudyDocument(payload.tagId, payload.options, sendResponse);
      return true;

    case MSG_TYPES.ASK_MY_ITEMS:
      handleAskMyItems(payload.question, payload.contentIds, sendResponse);
      return true;

    // --- Bible Insight Specific ---
    case MSG_TYPES.DETECT_VERSES:
      handleDetectVerses(payload.text, sendResponse);
      return true;

    case MSG_TYPES.LOOKUP_VERSE:
      handleLookupVerse(payload.reference, payload.translation, sendResponse);
      return true;

    case MSG_TYPES.GET_CROSS_REFS:
      handleGetCrossRefs(payload.reference, sendResponse);
      return true;

    case MSG_TYPES.GET_ALL_VERSES:
      handleGetAllVerses(sendResponse);
      return true;

    case MSG_TYPES.GET_ITEM_VERSES:
      handleGetItemVerses(payload.contentId, sendResponse);
      return true;

    // --- Backup ---
    case MSG_TYPES.EXPORT_BACKUP:
      handleExportBackup(sendResponse);
      return true;

    case MSG_TYPES.IMPORT_BACKUP:
      handleImportBackup(payload.data, sendResponse);
      return true;

    // --- Token Usage (Development) ---
    case MSG_TYPES.GET_TOKEN_USAGE:
      sendResponse({ success: true, usage: getTokenUsage() });
      return false;

    case MSG_TYPES.RESET_TOKEN_USAGE:
      resetTokenUsage();
      sendResponse({ success: true });
      return false;

    default:
      console.warn('[background] Unknown message type:', type);
      sendResponse({ success: false, error: 'Unknown message type' });
      return false;
  }
});

// ============================================================
// CONTENT CAPTURE HANDLERS
// ============================================================

async function handleSavePage(payload, tab, sendResponse) {
  try {
    const record = {
      type: payload.type || CONTENT_TYPES.PAGE, // Allow custom types (e.g., TRANSCRIPT)
      title: payload.title || tab?.title || 'Untitled Page',
      content: payload.content,
      htmlContent: payload.htmlContent,
      url: payload.url || tab?.url,
      scrollPercent: payload.scrollPercent || 0,
      color: payload.color || DEFAULT_HIGHLIGHT_COLOR,
      notes: '',
      createdAt: new Date().toISOString(),
      wordCount: payload.content ? payload.content.split(/\s+/).length : 0,
      meta: payload.meta || null // Store extra metadata (e.g., videoId, segmentCount)
    };

    const id = await put('contentItems', record);
    console.log('[background] Page saved with id:', id);

    // Trigger verse detection if enabled
    await detectAndStoreVerses(id, payload.content);

    // Update timestamp for UI refresh
    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    sendResponse({ success: true, id });
  } catch (error) {
    console.error('[background] Save page error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSaveSelection(payload, tab, sendResponse) {
  try {
    // Extract and clean text for text fragment (Chrome works best with ~50-60 chars)
    let textFragment = null;
    if (payload.text) {
      textFragment = payload.text
        .replace(/[\r\n]+/g, ' ')  // Replace newlines with space
        .replace(/\s+/g, ' ')       // Collapse multiple spaces
        .trim()
        .substring(0, 80);          // Keep it short for reliability
    }

    const record = {
      type: CONTENT_TYPES.SELECTION,
      title: payload.title || `Selection from ${tab?.title || 'page'}`,
      content: payload.text,
      url: payload.url || tab?.url,
      textFragment: textFragment,
      scrollPercent: payload.scrollPercent || 0,
      color: payload.color || DEFAULT_HIGHLIGHT_COLOR,
      notes: '',
      createdAt: new Date().toISOString(),
      wordCount: payload.text ? payload.text.split(/\s+/).length : 0
    };

    const id = await put('contentItems', record);
    console.log('[background] Selection saved with id:', id);

    // Trigger verse detection
    await detectAndStoreVerses(id, payload.text);

    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    sendResponse({ success: true, id });
  } catch (error) {
    console.error('[background] Save selection error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSavePDF(payload, tab, sendResponse) {
  let tabId = null;

  try {
    // Get tab ID from payload (from side panel) or sender.tab (from content script)
    tabId = payload?.tabId || tab?.id;
    if (!tabId) {
      throw new Error('No tab ID available');
    }

    // Get tab info for title/url
    const tabInfo = await chrome.tabs.get(tabId);

    // Step 1: Capture thumbnail FIRST (JPEG, lower quality for smaller storage)
    const thumbnail = await chrome.tabs.captureVisibleTab(null, {
      format: 'jpeg',
      quality: 60
    });

    // Step 2: Generate PDF using Chrome DevTools Protocol
    const targets = await chrome.debugger.getTargets();
    const target = targets.find(t => t.tabId === tabId);

    if (!target) {
      throw new Error('Could not attach debugger to tab');
    }

    await chrome.debugger.attach({ tabId: tabId }, '1.3');

    const result = await chrome.debugger.sendCommand(
      { tabId: tabId },
      'Page.printToPDF',
      {
        printBackground: true,
        preferCSSPageSize: true,
        marginTop: 0.5,
        marginBottom: 0.5,
        marginLeft: 0.5,
        marginRight: 0.5
      }
    );

    await chrome.debugger.detach({ tabId: tabId });

    // Step 3: Generate filename and download PDF to local Downloads folder
    const safeTitle = (tabInfo?.title || 'page')
      .replace(/[^a-z0-9]/gi, '_')
      .substring(0, 50);
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `bible-insight_${safeTitle}_${timestamp}.pdf`;

    // Convert base64 to data URL for download
    const pdfDataUrl = `data:application/pdf;base64,${result.data}`;
    const fileSize = Math.round((result.data.length * 3) / 4);

    // Trigger download to local Downloads folder
    await chrome.downloads.download({
      url: pdfDataUrl,
      filename: filename,
      saveAs: false // Auto-save to Downloads
    });

    // Step 4: Store ONLY thumbnail and metadata in IndexedDB (not the full PDF)
    const record = {
      type: CONTENT_TYPES.PDF,
      title: tabInfo?.title || 'PDF Document',
      content: thumbnail, // Store thumbnail only, not full PDF
      url: tabInfo?.url,
      pdfFilename: filename,
      fileSize: fileSize,
      color: DEFAULT_HIGHLIGHT_COLOR,
      notes: '',
      createdAt: new Date().toISOString()
    };

    const id = await put('contentItems', record);
    console.log('[background] PDF saved to Downloads and thumbnail stored with id:', id);

    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    sendResponse({ success: true, id, filename });
  } catch (error) {
    console.error('[background] Save PDF error:', error);
    // Ensure debugger is detached on error
    if (tabId) {
      try {
        await chrome.debugger.detach({ tabId: tabId });
      } catch (e) {
        // Ignore detach errors
      }
    }
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCaptureVisible(tab, sendResponse) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });

    const record = {
      type: CONTENT_TYPES.SCREENSHOT,
      title: `Screenshot of ${tab?.title || 'page'}`,
      content: dataUrl,
      url: tab?.url,
      color: DEFAULT_HIGHLIGHT_COLOR,
      notes: '',
      createdAt: new Date().toISOString()
    };

    const id = await put('contentItems', record);
    console.log('[background] Screenshot saved with id:', id);

    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    sendResponse({ success: true, id });
  } catch (error) {
    console.error('[background] Capture visible error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleInitiateAreaCapture(payload, tab, sendResponse) {
  try {
    // Get tab ID from payload (from side panel) or sender.tab (from content script)
    const tabId = payload?.tabId || tab?.id;
    if (!tabId) {
      throw new Error('No tab ID available');
    }

    // Send message to content script to initiate area selection
    // The content script has the full implementation with CSS styles
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'INITIATE_AREA_SELECTION'
    });

    sendResponse(response || { success: true });
  } catch (error) {
    console.error('[background] Initiate area capture error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCaptureArea(payload, tab, sendResponse) {
  try {
    const { rect } = payload;

    // Capture full visible area first
    const fullDataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });

    // Crop the image to the selected area using offscreen canvas
    // For now, store the full capture with crop metadata
    // Full cropping would require an offscreen document

    const record = {
      type: CONTENT_TYPES.SCREENSHOT,
      title: `Area capture from ${tab?.title || 'page'}`,
      content: fullDataUrl,
      url: tab?.url,
      color: DEFAULT_HIGHLIGHT_COLOR,
      notes: '',
      createdAt: new Date().toISOString(),
      cropRect: rect
    };

    const id = await put('contentItems', record);
    console.log('[background] Area capture saved with id:', id);

    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    sendResponse({ success: true, id });
  } catch (error) {
    console.error('[background] Capture area error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// ============================================================
// CONTENT RETRIEVAL HANDLERS
// ============================================================

async function handleGetAllItems(sendResponse) {
  try {
    const items = await getAll('contentItems');
    // Sort by creation date, newest first
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    sendResponse({ success: true, items });
  } catch (error) {
    console.error('[background] Get all items error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetItem(id, sendResponse) {
  try {
    const item = await get('contentItems', id);
    sendResponse({ success: true, item });
  } catch (error) {
    console.error('[background] Get item error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDeleteItem(id, sendResponse) {
  try {
    await remove('contentItems', id);
    // Also remove related tags and verses
    // TODO: Clean up related data

    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[background] Delete item error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// ============================================================
// UPDATE ITEM HANDLERS
// ============================================================

async function handleUpdateItem(id, updates, sendResponse) {
  try {
    const item = await get('contentItems', id);
    if (!item) {
      sendResponse({ success: false, error: 'Item not found' });
      return;
    }

    // Apply updates
    const updatedItem = {
      ...item,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await put('contentItems', updatedItem);
    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    sendResponse({ success: true, item: updatedItem });
  } catch (error) {
    console.error('[background] Update item error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// ============================================================
// NOTES HANDLERS
// ============================================================

async function handleUpdateItemNotes(id, notes, sendResponse) {
  try {
    const item = await get('contentItems', id);
    if (!item) {
      sendResponse({ success: false, error: 'Item not found' });
      return;
    }

    item.notes = notes;
    item.updatedAt = new Date().toISOString();

    await put('contentItems', item);
    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    console.log(`[background] Notes updated for item ${id}`);
    sendResponse({ success: true, id });
  } catch (error) {
    console.error('[background] Update notes error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// ============================================================
// TAG HANDLERS (Color-based)
// ============================================================

async function handleGetAllTags(sendResponse) {
  try {
    const tags = await getAll('tags');
    sendResponse({ success: true, tags });
  } catch (error) {
    console.error('[background] Get all tags error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetContentTags(sendResponse) {
  try {
    const contentTags = await getAll('contentTags');
    sendResponse({ success: true, contentTags });
  } catch (error) {
    console.error('[background] Get content tags error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCreateTag(name, color, sendResponse) {
  try {
    // Check for duplicate name
    const tags = await getAll('tags');
    const existing = tags.find(t => t.name.toLowerCase() === name.toLowerCase());

    if (existing) {
      sendResponse({ success: false, error: 'Tag already exists' });
      return;
    }

    // Validate color
    const validColor = HIGHLIGHT_COLORS[color] ? color : DEFAULT_HIGHLIGHT_COLOR;

    const tag = {
      name: name.trim(),
      color: validColor,
      createdAt: new Date().toISOString()
    };

    const tagId = await put('tags', tag);
    tag.id = tagId;

    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    console.log(`[background] Tag created: ${name} (${validColor})`);
    sendResponse({ success: true, tag });
  } catch (error) {
    console.error('[background] Create tag error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDeleteTag(tagId, sendResponse) {
  try {
    // Remove tag
    await remove('tags', tagId);

    // Remove all content-tag links for this tag
    const contentTags = await getAll('contentTags');
    const linksToRemove = contentTags.filter(ct => ct.tagId === tagId);

    for (const link of linksToRemove) {
      await remove('contentTags', [link.contentId, link.tagId]);
    }

    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    console.log(`[background] Tag ${tagId} deleted with ${linksToRemove.length} links`);
    sendResponse({ success: true });
  } catch (error) {
    console.error('[background] Delete tag error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleLinkTag(contentId, tagId, sendResponse) {
  try {
    // Check if link already exists
    const contentTags = await getAll('contentTags');
    const existing = contentTags.find(ct => ct.contentId === contentId && ct.tagId === tagId);

    if (existing) {
      sendResponse({ success: true, message: 'Already linked' });
      return;
    }

    await put('contentTags', { contentId, tagId });
    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    console.log(`[background] Linked content ${contentId} to tag ${tagId}`);
    sendResponse({ success: true });
  } catch (error) {
    console.error('[background] Link tag error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUnlinkTag(contentId, tagId, sendResponse) {
  try {
    await remove('contentTags', [contentId, tagId]);
    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    console.log(`[background] Unlinked content ${contentId} from tag ${tagId}`);
    sendResponse({ success: true });
  } catch (error) {
    console.error('[background] Unlink tag error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSetItemColor(id, color, sendResponse) {
  try {
    const item = await get('contentItems', id);
    if (!item) {
      sendResponse({ success: false, error: 'Item not found' });
      return;
    }

    // Validate color
    const validColor = HIGHLIGHT_COLORS[color] ? color : DEFAULT_HIGHLIGHT_COLOR;

    item.color = validColor;
    item.updatedAt = new Date().toISOString();

    await put('contentItems', item);
    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    console.log(`[background] Set color ${validColor} for item ${id}`);
    sendResponse({ success: true, color: validColor });
  } catch (error) {
    console.error('[background] Set item color error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetItemsByTag(tagId, sendResponse) {
  try {
    const contentTags = await getAll('contentTags');
    const contentIds = contentTags
      .filter(ct => ct.tagId === tagId)
      .map(ct => ct.contentId);

    const allItems = await getAll('contentItems');
    const filteredItems = allItems.filter(item => contentIds.includes(item.id));

    // Sort by creation date, newest first
    filteredItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sendResponse({ success: true, items: filteredItems });
  } catch (error) {
    console.error('[background] Get items by tag error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetItemsByColor(color, sendResponse) {
  try {
    const allItems = await getAll('contentItems');
    const filteredItems = allItems.filter(item => item.color === color);

    // Sort by creation date, newest first
    filteredItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sendResponse({ success: true, items: filteredItems });
  } catch (error) {
    console.error('[background] Get items by color error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// ============================================================
// AI HANDLERS
// ============================================================

async function handleGenerateKeyPoints(payload, sendResponse) {
  // Check pause state before AI operation
  if (isPaused()) {
    sendResponse({ success: false, paused: true, error: 'Extension is paused. Resume in Settings.' });
    return;
  }

  try {
    const { contentIds, tagName } = payload;

    // Get content for all items
    const allItems = await getAll('contentItems');
    const selectedItems = allItems.filter(item => contentIds.includes(item.id));

    // Combine text content
    const combinedText = selectedItems
      .filter(item => item.content && item.type !== CONTENT_TYPES.SCREENSHOT)
      .map(item => item.content)
      .join('\n\n---\n\n');

    if (!combinedText) {
      sendResponse({ success: false, error: 'No text content to analyze' });
      return;
    }

    // Call AI API
    const keyPoints = await analyzeText(combinedText, 'key_points');

    // Store as generated analysis
    const record = {
      type: CONTENT_TYPES.GENERATED_ANALYSIS,
      title: `Key Points: ${tagName || 'Selected Items'}`,
      content: keyPoints,
      sourceItemIds: contentIds,
      createdAt: new Date().toISOString()
    };

    const id = await put('contentItems', record);

    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    sendResponse({ success: true, keyPoints, id });
  } catch (error) {
    console.error('[background] Generate key points error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleAnalyzeImage(payload, sendResponse) {
  // Check pause state before AI operation
  if (isPaused()) {
    sendResponse({ success: false, paused: true, error: 'Extension is paused. Resume in Settings.' });
    return;
  }

  try {
    const { imageData, contentId } = payload;

    const analysis = await analyzeImage(imageData);

    // Update content item with analysis
    const item = await get('contentItems', contentId);
    if (item) {
      item.analysis = analysis;
      item.analysisCompleted = true;
      await put('contentItems', item);
    }

    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    sendResponse({ success: true, analysis });
  } catch (error) {
    console.error('[background] Analyze image error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSuggestTags(contentId, sendResponse) {
  // Check pause state before AI operation
  if (isPaused()) {
    sendResponse({ success: false, paused: true, error: 'Extension is paused. Resume in Settings.' });
    return;
  }

  try {
    const item = await get('contentItems', contentId);
    if (!item || !item.content) {
      sendResponse({ success: false, error: 'No content to analyze' });
      return;
    }

    // Use AI to suggest tags
    const prompt = AI_CONFIG.PROMPTS.SUGGEST_TAGS + '\n\n' + item.content.substring(0, 5000);
    const suggestions = await analyzeText(prompt, 'suggest_tags');

    // Parse comma-separated suggestions
    const tagNames = suggestions
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0 && t.length < 30);

    sendResponse({ success: true, suggestions: tagNames });
  } catch (error) {
    console.error('[background] Suggest tags error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// ============================================================
// SYNTHESIS HANDLERS (Pro Tier)
// ============================================================

async function handleSynthesizeByTag(tagId, sendResponse) {
  // Check pause state before AI operation
  if (isPaused()) {
    sendResponse({ success: false, paused: true, error: 'Extension is paused. Resume in Settings.' });
    return;
  }

  try {
    // Get all items with this tag
    const contentTags = await getAll('contentTags');
    const contentIds = contentTags
      .filter(ct => ct.tagId === tagId)
      .map(ct => ct.contentId);

    if (contentIds.length === 0) {
      sendResponse({ success: false, error: 'No items found for this tag' });
      return;
    }

    const allItems = await getAll('contentItems');
    const taggedItems = allItems.filter(item => contentIds.includes(item.id));

    // Get tag info
    const tag = await get('tags', tagId);

    // Combine content
    const combinedContent = taggedItems
      .filter(item => item.content && item.type !== CONTENT_TYPES.SCREENSHOT)
      .map(item => `--- ${item.title} ---\n${item.content}`)
      .join('\n\n');

    if (!combinedContent) {
      sendResponse({ success: false, error: 'No text content to synthesize' });
      return;
    }

    // Call AI for synthesis
    const prompt = AI_CONFIG.SYNTHESIS_PROMPTS.COMBINE_SUMMARIES + '\n\n' + combinedContent;
    const synthesis = await analyzeText(prompt, 'synthesis');

    // Extract all verses from the items
    const allVerses = await getAll('verses');
    const relatedVerses = allVerses.filter(v => contentIds.includes(v.contentId));
    const uniqueVerseRefs = [...new Set(relatedVerses.map(v => v.reference))];

    // Store as generated analysis
    const record = {
      type: CONTENT_TYPES.GENERATED_ANALYSIS,
      title: `Synthesis: ${tag?.name || 'Tagged Items'}`,
      content: synthesis,
      sourceItemIds: contentIds,
      versesReferenced: uniqueVerseRefs,
      createdAt: new Date().toISOString()
    };

    const id = await put('contentItems', record);
    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    sendResponse({
      success: true,
      synthesis,
      versesReferenced: uniqueVerseRefs,
      itemCount: taggedItems.length,
      id
    });
  } catch (error) {
    console.error('[background] Synthesize by tag error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSynthesizeByColor(color, sendResponse) {
  // Check pause state before AI operation
  if (isPaused()) {
    sendResponse({ success: false, paused: true, error: 'Extension is paused. Resume in Settings.' });
    return;
  }

  try {
    const allItems = await getAll('contentItems');
    const coloredItems = allItems.filter(item => item.color === color);

    if (coloredItems.length === 0) {
      sendResponse({ success: false, error: 'No items found with this color' });
      return;
    }

    // Combine content
    const combinedContent = coloredItems
      .filter(item => item.content && item.type !== CONTENT_TYPES.SCREENSHOT)
      .map(item => `--- ${item.title} ---\n${item.content}`)
      .join('\n\n');

    if (!combinedContent) {
      sendResponse({ success: false, error: 'No text content to synthesize' });
      return;
    }

    // Call AI for synthesis
    const prompt = AI_CONFIG.SYNTHESIS_PROMPTS.COMBINE_SUMMARIES + '\n\n' + combinedContent;
    const synthesis = await analyzeText(prompt, 'synthesis');

    // Get color label
    const colorLabel = HIGHLIGHT_COLORS[color]?.label || color;

    // Store as generated analysis
    const record = {
      type: CONTENT_TYPES.GENERATED_ANALYSIS,
      title: `Synthesis: ${colorLabel} Items`,
      content: synthesis,
      sourceItemIds: coloredItems.map(i => i.id),
      color,
      createdAt: new Date().toISOString()
    };

    const id = await put('contentItems', record);
    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    sendResponse({
      success: true,
      synthesis,
      itemCount: coloredItems.length,
      id
    });
  } catch (error) {
    console.error('[background] Synthesize by color error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleExtractAllVerses(contentIds, sendResponse) {
  try {
    const allVerses = await getAll('verses');
    const filteredVerses = contentIds
      ? allVerses.filter(v => contentIds.includes(v.contentId))
      : allVerses;

    // Get unique verse references
    const uniqueRefs = [...new Set(filteredVerses.map(v => v.reference))];

    // Lookup full text for each verse (if API key available)
    const settings = await chrome.storage.local.get([`${APP_SLUG}_settings`]);
    const config = settings[`${APP_SLUG}_settings`] || DEFAULT_SETTINGS;

    const versesWithText = [];
    for (const ref of uniqueRefs) {
      try {
        const verseData = await lookupVerse(ref, config.bibleTranslation);
        versesWithText.push({
          reference: ref,
          text: verseData?.text || null,
          translation: config.bibleTranslation
        });
      } catch (e) {
        versesWithText.push({ reference: ref, text: null, error: e.message });
      }
    }

    sendResponse({
      success: true,
      verses: versesWithText,
      totalReferences: uniqueRefs.length
    });
  } catch (error) {
    console.error('[background] Extract all verses error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGenerateStudyDocument(tagId, options, sendResponse) {
  // Check pause state before AI operation
  if (isPaused()) {
    sendResponse({ success: false, paused: true, error: 'Extension is paused. Resume in Settings.' });
    return;
  }

  try {
    // Get items by tag
    const contentTags = await getAll('contentTags');
    const contentIds = contentTags
      .filter(ct => ct.tagId === tagId)
      .map(ct => ct.contentId);

    const allItems = await getAll('contentItems');
    const taggedItems = allItems.filter(item => contentIds.includes(item.id));
    const tag = await get('tags', tagId);

    if (taggedItems.length === 0) {
      sendResponse({ success: false, error: 'No items found for this tag' });
      return;
    }

    // Combine content with notes
    const combinedContent = taggedItems
      .filter(item => item.content && item.type !== CONTENT_TYPES.SCREENSHOT)
      .map(item => {
        let text = `--- ${item.title} ---\n${item.content}`;
        if (item.notes) {
          text += `\n\n[User Notes: ${item.notes}]`;
        }
        return text;
      })
      .join('\n\n');

    // Get all verses
    const allVerses = await getAll('verses');
    const relatedVerses = allVerses.filter(v => contentIds.includes(v.contentId));
    const uniqueVerseRefs = [...new Set(relatedVerses.map(v => v.reference))];

    // Generate study document via AI
    const prompt = AI_CONFIG.SYNTHESIS_PROMPTS.STUDY_DOCUMENT + '\n\n' + combinedContent;
    const studyDocument = await analyzeText(prompt, 'study_document');

    // Store as generated analysis
    const record = {
      type: CONTENT_TYPES.GENERATED_ANALYSIS,
      title: `Study Document: ${tag?.name || 'Selected Items'}`,
      content: studyDocument,
      sourceItemIds: contentIds,
      versesReferenced: uniqueVerseRefs,
      createdAt: new Date().toISOString()
    };

    const id = await put('contentItems', record);
    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    sendResponse({
      success: true,
      document: studyDocument,
      versesReferenced: uniqueVerseRefs,
      itemCount: taggedItems.length,
      id
    });
  } catch (error) {
    console.error('[background] Generate study document error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleAskMyItems(question, contentIds, sendResponse) {
  // Check pause state before AI operation
  if (isPaused()) {
    sendResponse({ success: false, paused: true, error: 'Extension is paused. Resume in Settings.' });
    return;
  }

  try {
    // Get items to search
    const allItems = await getAll('contentItems');
    const searchItems = contentIds
      ? allItems.filter(item => contentIds.includes(item.id))
      : allItems;

    if (searchItems.length === 0) {
      sendResponse({ success: false, error: 'No items to search' });
      return;
    }

    // Build context from items
    const itemsContext = searchItems
      .filter(item => item.content && item.type !== CONTENT_TYPES.SCREENSHOT)
      .map(item => {
        let text = `[${item.title}]\n${item.content.substring(0, 2000)}`;
        if (item.notes) {
          text += `\n[Notes: ${item.notes}]`;
        }
        return text;
      })
      .join('\n\n---\n\n');

    // Build prompt
    const prompt = AI_CONFIG.SYNTHESIS_PROMPTS.ASK_MY_ITEMS
      .replace('{{ITEMS}}', itemsContext)
      .replace('{{QUESTION}}', question);

    const answer = await analyzeText(prompt, 'ask_items');

    sendResponse({
      success: true,
      answer,
      itemsSearched: searchItems.length
    });
  } catch (error) {
    console.error('[background] Ask my items error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// ============================================================
// BIBLE INSIGHT SPECIFIC HANDLERS
// ============================================================

async function detectAndStoreVerses(contentId, text) {
  if (!text) return;

  // Check pause state before verse detection (which may call AI)
  if (isPaused()) {
    console.log('[background] Skipping verse detection - extension paused');
    return;
  }

  try {
    const settings = await chrome.storage.local.get([`${APP_SLUG}_settings`]);
    const config = settings[`${APP_SLUG}_settings`] || DEFAULT_SETTINGS;

    if (!config.autoDetectVerses) return;

    let detectedVerses = [];

    // First try semantic detection with AI (recognizes verse CONTENT)
    if (config.apiKey) {
      try {
        const semanticVerses = await detectVersesWithAI(text);
        if (semanticVerses.length > 0) {
          detectedVerses = semanticVerses;
          console.log(`[background] AI detected ${semanticVerses.length} verses semantically`);
        }
      } catch (aiError) {
        console.warn('[background] Semantic detection failed, falling back to regex:', aiError.message);
      }
    }

    // Fallback to regex detection (finds explicit references like "John 3:16")
    if (detectedVerses.length === 0) {
      const regexVerses = detectVerses(text);
      detectedVerses = regexVerses.map(v => ({
        ...v,
        method: 'regex',
        type: 'explicit',
        confidence: 'high'
      }));
      console.log(`[background] Regex detected ${regexVerses.length} explicit references`);
    }

    // Store each detected verse
    for (const verse of detectedVerses) {
      await put('verses', {
        ...verse,
        contentId,
        createdAt: new Date().toISOString()
      });
    }

    console.log(`[background] Stored ${detectedVerses.length} verses for content ${contentId}`);

    // === AUTO-TAGGING based on book/chapter ===
    if (detectedVerses.length > 0) {
      await autoTagByVerseSource(contentId, detectedVerses);
    }
  } catch (error) {
    console.error('[background] Verse detection error:', error);
  }
}

/**
 * Auto-creates tags based on detected verse book/chapter and links them to the content item.
 * Example: "1 Kings 22:19" → creates/finds tag "1 Kings 22" and links it
 */
async function autoTagByVerseSource(contentId, detectedVerses) {
  try {
    // Extract unique book/chapter combinations
    const bookChapters = new Set();

    for (const verse of detectedVerses) {
      const bookChapter = extractBookChapter(verse.reference || verse.book);
      if (bookChapter) {
        bookChapters.add(bookChapter);
      }
    }

    if (bookChapters.size === 0) {
      console.log('[background] No book/chapters extracted for auto-tagging');
      return;
    }

    console.log(`[background] Auto-tagging with ${bookChapters.size} book/chapter(s):`, [...bookChapters]);

    // Get existing tags
    const existingTags = await getAll('tags');
    const existingTagNames = new Map(existingTags.map(t => [t.name.toLowerCase(), t]));

    // Create/link tags for each book/chapter
    for (const bookChapter of bookChapters) {
      let tag = existingTagNames.get(bookChapter.toLowerCase());

      // Create tag if it doesn't exist
      if (!tag) {
        const newTag = {
          name: bookChapter,
          color: 'purple', // "Cross-ref" color - appropriate for verse tags
          createdAt: new Date().toISOString(),
          autoCreated: true // Mark as auto-created for potential filtering later
        };
        const tagId = await put('tags', newTag);
        tag = { ...newTag, id: tagId };
        console.log(`[background] Auto-created tag: "${bookChapter}" (id: ${tagId})`);
      }

      // Link content to tag (check for existing link first)
      const contentTags = await getAll('contentTags');
      const alreadyLinked = contentTags.some(ct => ct.contentId === contentId && ct.tagId === tag.id);

      if (!alreadyLinked) {
        await put('contentTags', { contentId, tagId: tag.id });
        console.log(`[background] Linked content ${contentId} to tag "${bookChapter}"`);
      }
    }

    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });
  } catch (error) {
    console.error('[background] Auto-tag error:', error);
  }
}

/**
 * Extracts book and chapter from a verse reference.
 * Examples:
 *   "1 Kings 22:19" → "1 Kings 22"
 *   "John 3:16-17" → "John 3"
 *   "Psalm 23" → "Psalm 23"
 *   "Romans 8:28-30" → "Romans 8"
 */
function extractBookChapter(reference) {
  if (!reference) return null;

  // Pattern: captures book (including leading number like "1 Kings") and chapter number
  // Handles: "1 Kings 22:19", "John 3:16", "Psalm 23", "Romans 8:28-30"
  const match = reference.match(/^(\d?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+)/);

  if (match) {
    const book = match[1].trim();
    const chapter = match[2];
    return `${book} ${chapter}`;
  }

  // If no chapter found, might be just the book (rare)
  return null;
}

async function handleDetectVerses(text, sendResponse) {
  try {
    const verses = detectVerses(text);
    sendResponse({ success: true, verses });
  } catch (error) {
    console.error('[background] Detect verses error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleLookupVerse(reference, translation, sendResponse) {
  // Check pause state before API call
  if (isPaused()) {
    sendResponse({ success: false, paused: true, error: 'Extension is paused. Resume in Settings.' });
    return;
  }

  try {
    const verse = await lookupVerse(reference, translation);
    sendResponse({ success: true, verse });
  } catch (error) {
    console.error('[background] Lookup verse error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetCrossRefs(reference, sendResponse) {
  // Check pause state before API call
  if (isPaused()) {
    sendResponse({ success: false, paused: true, error: 'Extension is paused. Resume in Settings.' });
    return;
  }

  try {
    const crossRefs = await getCrossRefs(reference);
    sendResponse({ success: true, crossRefs });
  } catch (error) {
    console.error('[background] Get cross refs error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetAllVerses(sendResponse) {
  try {
    const verses = await getAll('verses');
    sendResponse({ success: true, verses });
  } catch (error) {
    console.error('[background] Get all verses error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetItemVerses(contentId, sendResponse) {
  try {
    const allVerses = await getAll('verses');
    const itemVerses = allVerses.filter(v => v.contentId === contentId);
    sendResponse({ success: true, verses: itemVerses });
  } catch (error) {
    console.error('[background] Get item verses error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// ============================================================
// BACKUP HANDLERS
// ============================================================

async function handleExportBackup(sendResponse) {
  try {
    const contentItems = await getAll('contentItems');
    const tags = await getAll('tags');
    const contentTags = await getAll('contentTags');
    const verses = await getAll('verses');

    const backup = {
      app: APP_SLUG,
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      stores: {
        contentItems,
        tags,
        contentTags,
        verses
      }
    };

    sendResponse({ success: true, data: backup });
  } catch (error) {
    console.error('[background] Export backup error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleImportBackup(data, sendResponse) {
  try {
    // Validate backup format
    if (data.app !== APP_SLUG) {
      throw new Error('This backup is not for Bible Insight');
    }

    // Import each store
    for (const item of data.stores.contentItems || []) {
      await put('contentItems', item);
    }
    for (const item of data.stores.tags || []) {
      await put('tags', item);
    }
    for (const item of data.stores.contentTags || []) {
      await put('contentTags', item);
    }
    for (const item of data.stores.verses || []) {
      await put('verses', item);
    }

    await chrome.storage.local.set({ [`${APP_SLUG}_lastUpdate`]: Date.now() });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[background] Import backup error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// ============================================================
// CONTEXT MENU (optional)
// ============================================================

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-selection',
    title: 'Save to Bible Insight',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-selection') {
    handleSaveSelection(
      { text: info.selectionText },
      tab,
      (response) => console.log('[background] Context menu save:', response)
    );
  }
});

console.log(`[background] ${APP_NAME} service worker loaded.`);
