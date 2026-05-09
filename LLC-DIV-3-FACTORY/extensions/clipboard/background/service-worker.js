// ============================================================
// SERVICE WORKER — ClipBoard Panel Extension
// Registers all listeners at the TOP LEVEL (MV3 requirement).
// This file is the relay. It does NOT hold UI logic or state.
// ============================================================

import { APP_SLUG, STORAGE_KEYS, MESSAGE_TYPES, DB_NAME, DB_VERSION, DB_SCHEMA, CREDIT_CONFIG } from '../lib/constants.js';
import { initDB, put, get, getAll, remove, query } from '../lib/db.js';
import { analyze, analyzeImage, getTokenUsage, resetTokenUsage } from '../lib/api-client.js';
import { generatePagePDF, pdfToDataUrl, estimatePDFSize, PDFPresets } from '../lib/pdf-generator.js';

// Payment Brick imports
import { initPayments, getCurrentTier, onPaid } from '../lib/payments/extpay-wrapper.js';
import { canAccessFeature, getFeatureTier } from '../lib/payments/tiers.js';
import { getBalance, canAfford, deduct, addCredits, initCredits } from '../lib/payments/credits.js';

// --- Debug Mode ---
const DEBUG = false;
function log(...args) {
  if (DEBUG) console.log('[service-worker]', ...args);
}

// --- Database reference ---
let dbReady = false;

// --- Initialize ExtensionPay ---
// Must be called at top level for MV3 service workers
initPayments();

// --- Panel Behavior ---
// Opens the side panel when the user clicks the toolbar icon.
// REQUIRED: This cannot be set in the manifest — only via API.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => log('Panel behavior error:', error));

// --- Context Menu ---
// Must be created at top level, not inside async callbacks
chrome.contextMenus.create({
  id: 'clip-selection',
  title: 'Clip to ClipBoard',
  contexts: ['selection']
}, () => {
  if (chrome.runtime.lastError) {
    // Menu already exists, ignore
  }
});

chrome.contextMenus.create({
  id: 'clip-page',
  title: 'Clip entire page',
  contexts: ['page']
}, () => {
  if (chrome.runtime.lastError) {
    // Menu already exists, ignore
  }
});

// --- Context Menu Handler ---
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!dbReady) {
    await initDatabase();
  }

  if (info.menuItemId === 'clip-selection') {
    // Inject content script and get selection
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
          text: window.getSelection().toString().trim(),
          url: window.location.href,
          title: document.title
        })
      });

      if (result.result.text) {
        await saveClip({
          clipType: 'selection',
          content: result.result.text,
          sourceUrl: result.result.url,
          sourceTitle: result.result.title
        });
      }
    } catch (error) {
      log('Context menu capture error:', error);
    }
  }

  if (info.menuItemId === 'clip-page') {
    // Inject content script and get page content
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Try to get main content, stripping nav/footer/sidebar
          function extractMainContent() {
            // Priority 1: Look for article or main element
            const article = document.querySelector('article');
            if (article) return article.innerText;

            const main = document.querySelector('main');
            if (main) return main.innerText;

            // Priority 2: Clone body and remove noise elements
            const clone = document.body.cloneNode(true);

            // Remove common noise elements
            const noiseSelectors = [
              'nav', 'header', 'footer', 'aside',
              '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
              '.nav', '.navbar', '.navigation', '.header', '.footer', '.sidebar',
              '#nav', '#navbar', '#navigation', '#header', '#footer', '#sidebar',
              '.menu', '.ad', '.ads', '.advertisement', '.social', '.share',
              '.comments', '.comment-section', '.related', '.recommended'
            ];

            noiseSelectors.forEach(selector => {
              clone.querySelectorAll(selector).forEach(el => el.remove());
            });

            return clone.innerText || document.body?.innerText || '';
          }

          return {
            text: extractMainContent(),
            url: window.location.href,
            title: document.title
          };
        }
      });

      if (result.result.text) {
        await saveClip({
          clipType: 'page',
          content: result.result.text,
          sourceUrl: result.result.url,
          sourceTitle: result.result.title
        });
      }
    } catch (error) {
      log('Page capture error:', error);
    }
  }
});

// --- Install / Update ---
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    // Initialize default state
    await chrome.storage.local.set({
      [STORAGE_KEYS.initialized]: true,
      [STORAGE_KEYS.settings]: {}
    });

    // Initialize IndexedDB
    await initDatabase();

    // Initialize credits (gives free welcome credits)
    await initCredits();

    log('ClipBoard installed. Database and credits initialized.');
  }

  if (reason === 'update') {
    await initDatabase();
    log('ClipBoard updated.');
  }
});

// --- Initialize Database ---
async function initDatabase() {
  if (dbReady) return;

  try {
    await initDB(DB_NAME, DB_VERSION, DB_SCHEMA);
    dbReady = true;
    log('IndexedDB ready.');
  } catch (error) {
    log('IndexedDB init error:', error);
  }
}

// --- Message Relay ---
// Routes messages from content scripts, side panel, and options page.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  // Ensure DB is ready before handling messages
  const handleMessage = async () => {
    if (!dbReady) {
      await initDatabase();
    }

    switch (type) {
      // --- Clips ---
      case MESSAGE_TYPES.CAPTURE_SELECTION:
        return handleCaptureSelection(payload);

      case MESSAGE_TYPES.CAPTURE_PAGE:
        return handleCapturePage(payload);

      case MESSAGE_TYPES.GET_CLIPS:
        return handleGetClips(payload);

      case MESSAGE_TYPES.DELETE_CLIP:
        return handleDeleteClip(payload);

      case MESSAGE_TYPES.UPDATE_CLIP:
        return handleUpdateClip(payload);

      // --- Tags ---
      case MESSAGE_TYPES.GET_TAGS:
        return handleGetTags();

      case MESSAGE_TYPES.CREATE_TAG:
        return handleCreateTag(payload);

      case MESSAGE_TYPES.DELETE_TAG:
        return handleDeleteTag(payload);

      case MESSAGE_TYPES.LINK_TAG:
        return handleLinkTag(payload);

      case MESSAGE_TYPES.UNLINK_TAG:
        return handleUnlinkTag(payload);

      // --- Search ---
      case 'SEARCH_CLIPS':
        return handleSearchClips(payload);

      // --- Get clip tags ---
      case 'GET_CLIP_TAGS':
        return handleGetClipTags(payload);

      // --- Screenshot ---
      case MESSAGE_TYPES.CAPTURE_SCREENSHOT:
        return handleCaptureScreenshot(payload);

      case MESSAGE_TYPES.CAPTURE_MARQUEE:
        return handleCaptureMarquee(payload);

      case 'MARQUEE_SELECTION_COMPLETE':
        return handleMarqueeComplete(payload);

      case MESSAGE_TYPES.CAPTURE_PDF:
        return handleCapturePDF(payload);

      // --- AI Features ---
      case MESSAGE_TYPES.SUMMARIZE_CLIP:
        return handleSummarizeClip(payload);

      case MESSAGE_TYPES.AUTO_TAG_CLIP:
        return handleAutoTagClip(payload);

      case MESSAGE_TYPES.ANALYZE_IMAGE:
        return handleAnalyzeImage(payload);

      case 'CHECK_FEATURE_ACCESS':
        return handleCheckFeatureAccess(payload);

      // --- Credits ---
      case MESSAGE_TYPES.GET_CREDITS:
        return handleGetCredits();

      case MESSAGE_TYPES.DEDUCT_CREDITS:
        return handleDeductCredits(payload);

      case MESSAGE_TYPES.ADD_CREDITS:
        return handleAddCredits(payload);

      // --- Token Tracking (Debug) ---
      case MESSAGE_TYPES.GET_TOKEN_USAGE:
        return { success: true, usage: getTokenUsage() };

      case MESSAGE_TYPES.RESET_TOKEN_USAGE:
        resetTokenUsage();
        return { success: true };

      // --- InsightForge ---
      case MESSAGE_TYPES.SYNTHESIZE_CLIPS:
        return handleSynthesizeClips(payload);

      case MESSAGE_TYPES.DATA_IMPORTED:
        // Broadcast to all extension views (sidepanel, popup, etc.)
        try {
          chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DATA_IMPORTED }).catch(() => {});
        } catch (e) {
          // Ignore errors if no receivers
        }
        return { success: true };

      default:
        log('Unknown message type:', type);
        return { success: false, error: 'Unknown message type' };
    }
  };

  handleMessage()
    .then(sendResponse)
    .catch(error => sendResponse({ success: false, error: error.message }));

  return true; // Keep channel open for async response
});

// --- Save Clip Helper ---
async function saveClip(clipData) {
  const clip = {
    id: crypto.randomUUID(),
    clipType: clipData.clipType,
    content: clipData.content,
    sourceUrl: clipData.sourceUrl,
    sourceTitle: clipData.sourceTitle,
    summary: null,
    starred: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await put('clips', clip);

  // Notify panel of new clip
  chrome.runtime.sendMessage({
    type: 'CLIP_ADDED',
    payload: clip
  }).catch(() => {
    // Panel might not be open, ignore
  });

  log('Clip saved:', clip.id);
  return clip;
}

// --- Clip Handlers ---
async function handleCaptureSelection(payload) {
  try {
    const clip = await saveClip({
      clipType: 'selection',
      content: payload.content,
      sourceUrl: payload.sourceUrl,
      sourceTitle: payload.sourceTitle
    });
    return { success: true, clip };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleCapturePage(payload) {
  try {
    const clip = await saveClip({
      clipType: 'page',
      content: payload.content,
      sourceUrl: payload.sourceUrl,
      sourceTitle: payload.sourceTitle
    });
    return { success: true, clip };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleGetClips(payload) {
  try {
    let clips = await getAll('clips');

    // Sort by createdAt descending (newest first)
    clips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Filter by tag if specified
    if (payload?.tagId) {
      const clipTags = await getAll('clip_tags');
      const clipIdsWithTag = new Set(
        clipTags.filter(ct => ct.tagId === payload.tagId).map(ct => ct.clipId)
      );
      clips = clips.filter(c => clipIdsWithTag.has(c.id));
    }

    return { success: true, clips };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleDeleteClip(payload) {
  try {
    await remove('clips', payload.clipId);

    // Also remove clip_tags entries
    const clipTags = await getAll('clip_tags');
    for (const ct of clipTags) {
      if (ct.clipId === payload.clipId) {
        await remove('clip_tags', ct.id);
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleUpdateClip(payload) {
  try {
    const clip = await get('clips', payload.clipId);
    if (!clip) {
      return { success: false, error: 'Clip not found' };
    }

    const updated = {
      ...clip,
      ...payload.updates,
      updatedAt: new Date().toISOString()
    };

    await put('clips', updated);
    return { success: true, clip: updated };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- Tag Handlers ---
async function handleGetTags() {
  try {
    const tags = await getAll('tags');

    // Get clip counts for each tag
    const clipTags = await getAll('clip_tags');
    const tagCounts = {};
    for (const ct of clipTags) {
      tagCounts[ct.tagId] = (tagCounts[ct.tagId] || 0) + 1;
    }

    const tagsWithCounts = tags.map(tag => ({
      ...tag,
      clipCount: tagCounts[tag.id] || 0
    }));

    return { success: true, tags: tagsWithCounts };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleCreateTag(payload) {
  try {
    // Check if tag with same name exists
    const existing = await getAll('tags');
    if (existing.some(t => t.name.toLowerCase() === payload.name.toLowerCase())) {
      return { success: false, error: 'Tag already exists' };
    }

    const tag = {
      id: crypto.randomUUID(),
      name: payload.name,
      color: payload.color || 'sage',
      createdAt: new Date().toISOString()
    };

    await put('tags', tag);
    return { success: true, tag };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleDeleteTag(payload) {
  try {
    await remove('tags', payload.tagId);

    // Also remove clip_tags entries
    const clipTags = await getAll('clip_tags');
    for (const ct of clipTags) {
      if (ct.tagId === payload.tagId) {
        await remove('clip_tags', ct.id);
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleLinkTag(payload) {
  try {
    // Check if link already exists
    const existing = await getAll('clip_tags');
    if (existing.some(ct => ct.clipId === payload.clipId && ct.tagId === payload.tagId)) {
      return { success: true }; // Already linked
    }

    const clipTag = {
      id: crypto.randomUUID(),
      clipId: payload.clipId,
      tagId: payload.tagId
    };

    await put('clip_tags', clipTag);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleUnlinkTag(payload) {
  try {
    const clipTags = await getAll('clip_tags');
    const toRemove = clipTags.find(
      ct => ct.clipId === payload.clipId && ct.tagId === payload.tagId
    );

    if (toRemove) {
      await remove('clip_tags', toRemove.id);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleGetClipTags(payload) {
  try {
    const clipTags = await getAll('clip_tags');
    const tagIds = clipTags
      .filter(ct => ct.clipId === payload.clipId)
      .map(ct => ct.tagId);

    const allTags = await getAll('tags');
    const tags = allTags.filter(t => tagIds.includes(t.id));

    return { success: true, tags };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- Search Handler ---
async function handleSearchClips(payload) {
  try {
    const searchQuery = payload.query.toLowerCase();
    const clips = await getAll('clips');
    const allTags = await getAll('tags');
    const clipTags = await getAll('clip_tags');

    // Build a map of clipId -> tag names
    const clipTagNames = {};
    for (const ct of clipTags) {
      const tag = allTags.find(t => t.id === ct.tagId);
      if (tag) {
        if (!clipTagNames[ct.clipId]) {
          clipTagNames[ct.clipId] = [];
        }
        clipTagNames[ct.clipId].push(tag.name.toLowerCase());
      }
    }

    const results = clips.filter(clip => {
      const contentMatch = clip.content?.toLowerCase().includes(searchQuery);
      const titleMatch = clip.sourceTitle?.toLowerCase().includes(searchQuery);
      const urlMatch = clip.sourceUrl?.toLowerCase().includes(searchQuery);
      const tagMatch = clipTagNames[clip.id]?.some(tagName => tagName.includes(searchQuery));
      return contentMatch || titleMatch || urlMatch || tagMatch;
    });

    // Sort by relevance (content matches first, then tags, then title, then URL)
    results.sort((a, b) => {
      const aContent = a.content?.toLowerCase().includes(searchQuery) ? 2 : 0;
      const bContent = b.content?.toLowerCase().includes(searchQuery) ? 2 : 0;
      const aTag = clipTagNames[a.id]?.some(t => t.includes(searchQuery)) ? 1 : 0;
      const bTag = clipTagNames[b.id]?.some(t => t.includes(searchQuery)) ? 1 : 0;

      const aScore = aContent + aTag;
      const bScore = bContent + bTag;

      if (aScore !== bScore) return bScore - aScore;

      // Then by date
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return { success: true, clips: results, query: searchQuery };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- Marquee Capture Handler ---
async function handleCaptureMarquee(payload) {
  log('handleCaptureMarquee called for tab:', payload.tabId);

  try {
    // Check tier access
    const hasAccess = await canAccessFeature('marquee-capture');
    if (!hasAccess) {
      return { success: false, error: 'tier_required', requiredTier: 'pro' };
    }

    // Inject the marquee overlay script
    await chrome.scripting.executeScript({
      target: { tabId: payload.tabId },
      func: injectMarqueeOverlay,
      args: [payload.sourceUrl, payload.sourceTitle]
    });

    return { success: true };
  } catch (error) {
    log('Marquee inject error:', error);
    return { success: false, error: error.message };
  }
}

// Injected function for marquee selection
function injectMarqueeOverlay(sourceUrl, sourceTitle) {
  // Remove any existing overlay
  document.getElementById('clipboard-marquee-overlay')?.remove();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'clipboard-marquee-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    cursor: crosshair;
    z-index: 2147483647;
  `;

  // Selection box
  const selectionBox = document.createElement('div');
  selectionBox.style.cssText = `
    position: fixed;
    border: 2px dashed #8ba888;
    background: rgba(139, 168, 136, 0.1);
    pointer-events: none;
    display: none;
    z-index: 2147483647;
  `;
  overlay.appendChild(selectionBox);

  // Instructions
  const instructions = document.createElement('div');
  instructions.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    z-index: 2147483647;
  `;
  instructions.textContent = 'Click and drag to select an area. Press Escape to cancel.';
  overlay.appendChild(instructions);

  document.body.appendChild(overlay);

  let startX, startY, isDrawing = false;

  overlay.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
    isDrawing = true;
    selectionBox.style.display = 'block';
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
  });

  overlay.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  });

  overlay.addEventListener('mouseup', (e) => {
    if (!isDrawing) return;
    isDrawing = false;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    // Remove overlay
    overlay.remove();

    // Minimum size check
    if (width < 10 || height < 10) {
      return;
    }

    // Get device pixel ratio for accurate cropping
    const dpr = window.devicePixelRatio || 1;

    // Send selection to service worker
    chrome.runtime.sendMessage({
      type: 'MARQUEE_SELECTION_COMPLETE',
      payload: {
        rect: {
          x: left * dpr,
          y: top * dpr,
          width: width * dpr,
          height: height * dpr
        },
        sourceUrl: sourceUrl,
        sourceTitle: sourceTitle
      }
    });
  });

  // Escape to cancel
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

// --- Marquee Complete Handler ---
async function handleMarqueeComplete(payload) {
  log('handleMarqueeComplete called with rect:', payload.rect);

  try {
    // Capture the visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });

    // Crop the image using OffscreenCanvas
    const croppedDataUrl = await cropImage(dataUrl, payload.rect);

    const clip = {
      id: crypto.randomUUID(),
      clipType: 'marquee',
      content: croppedDataUrl,
      sourceUrl: payload.sourceUrl,
      sourceTitle: payload.sourceTitle,
      summary: null,
      starred: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await put('clips', clip);

    // Notify panel
    chrome.runtime.sendMessage({
      type: 'CLIP_ADDED',
      payload: clip
    }).catch(() => {});

    log('Marquee clip saved:', clip.id);
    return { success: true, clip };
  } catch (error) {
    log('Marquee complete error:', error);
    return { success: false, error: error.message };
  }
}

// --- Crop Image Helper ---
async function cropImage(dataUrl, rect) {
  // Use createImageBitmap and OffscreenCanvas (works in service worker)
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  const canvas = new OffscreenCanvas(rect.width, rect.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    imageBitmap,
    rect.x, rect.y, rect.width, rect.height,  // Source rect
    0, 0, rect.width, rect.height              // Dest rect
  );

  const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });

  // Convert blob to data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(croppedBlob);
  });
}

// --- Screenshot Capture Handler ---
async function handleCaptureScreenshot(payload) {
  try {
    // Check tier access
    const hasAccess = await canAccessFeature('screenshot-capture');
    if (!hasAccess) {
      return { success: false, error: 'tier_required', requiredTier: 'starter' };
    }

    // Capture visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 90
    });

    const clip = {
      id: crypto.randomUUID(),
      clipType: 'screenshot',
      content: dataUrl, // Base64 data URL
      sourceUrl: payload.sourceUrl,
      sourceTitle: payload.sourceTitle,
      summary: null,
      starred: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await put('clips', clip);

    // Notify panel
    chrome.runtime.sendMessage({
      type: 'CLIP_ADDED',
      payload: clip
    }).catch(() => {});

    log('Screenshot saved:', clip.id);
    return { success: true, clip };
  } catch (error) {
    log('Screenshot capture error:', error);
    return { success: false, error: error.message };
  }
}

// --- PDF Capture Handler ---
async function handleCapturePDF(payload) {
  log('handleCapturePDF called for tab:', payload.tabId);

  try {
    // Check tier access
    const hasAccess = await canAccessFeature('pdf-capture');
    if (!hasAccess) {
      return { success: false, error: 'tier_required', requiredTier: 'starter' };
    }

    // Step 1: Capture thumbnail (visible tab screenshot, compressed)
    const thumbnail = await chrome.tabs.captureVisibleTab(null, {
      format: 'jpeg',
      quality: 60 // Lower quality for smaller file size
    });

    // Step 2: Generate PDF using Chrome DevTools Protocol
    const pdfBase64 = await generatePagePDF(payload.tabId, PDFPresets.standard);

    if (!pdfBase64) {
      throw new Error('PDF generation returned empty data');
    }

    const fileSize = estimatePDFSize(pdfBase64);
    log(`PDF generated successfully. Size: ${Math.round(fileSize / 1024)}KB`);

    // Step 3: Generate filename and trigger download
    const safeTitle = (payload.sourceTitle || 'page')
      .replace(/[^a-z0-9]/gi, '_')
      .substring(0, 50);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${safeTitle}_${timestamp}.pdf`;

    // Use data URL directly (service workers don't have URL.createObjectURL)
    const dataUrl = `data:application/pdf;base64,${pdfBase64}`;

    // Trigger download
    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: false
    });

    log('PDF download started:', downloadId);

    // Step 4: Store only thumbnail + metadata (not the full PDF)
    const clip = {
      id: crypto.randomUUID(),
      clipType: 'pdf',
      content: thumbnail, // Thumbnail only, not the full PDF
      sourceUrl: payload.sourceUrl,
      sourceTitle: payload.sourceTitle,
      pdfFilename: filename,
      fileSize: fileSize,
      summary: null,
      starred: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await put('clips', clip);

    // Notify panel
    chrome.runtime.sendMessage({
      type: 'CLIP_ADDED',
      payload: clip
    }).catch(() => {});

    log('PDF clip saved with thumbnail:', clip.id);
    return { success: true, clip, filename };
  } catch (error) {
    log('PDF capture error:', error);
    return { success: false, error: error.message };
  }
}

// --- AI Summary Handler ---
async function handleSummarizeClip(payload) {
  try {
    // Check tier access
    const hasAccess = await canAccessFeature('ai-summary');
    if (!hasAccess) {
      return { success: false, error: 'tier_required', requiredTier: 'starter' };
    }

    const clip = await get('clips', payload.clipId);
    if (!clip) {
      return { success: false, error: 'Clip not found' };
    }

    // Can't summarize screenshots or PDFs (yet - that's ai-vision for images)
    if (clip.clipType === 'screenshot' || clip.clipType === 'marquee' || clip.clipType === 'pdf') {
      return { success: false, error: 'Cannot summarize this clip type.' };
    }

    const instruction = 'Summarize the following content in 2-3 concise sentences. Focus on key facts and actionable information.';
    const result = await analyze(clip.content, instruction);

    if (!result.success) {
      return { success: false, error: result.error || 'AI analysis failed' };
    }

    // Update clip with summary
    const updated = {
      ...clip,
      summary: result.result,
      updatedAt: new Date().toISOString()
    };

    await put('clips', updated);
    log('Summary generated for clip:', clip.id);

    return { success: true, clip: updated, summary: result.result };
  } catch (error) {
    log('Summarize error:', error);
    return { success: false, error: error.message };
  }
}

// --- AI Auto-Tag Handler ---
async function handleAutoTagClip(payload) {
  log('handleAutoTagClip called with:', payload);

  try {
    // Check tier access
    const hasAccess = await canAccessFeature('ai-auto-tag');
    log('Tier access for ai-auto-tag:', hasAccess);
    if (!hasAccess) {
      return { success: false, error: 'tier_required', requiredTier: 'pro' };
    }

    const clip = await get('clips', payload.clipId);
    log('Retrieved clip:', clip?.id, clip?.clipType);
    if (!clip) {
      return { success: false, error: 'Clip not found' };
    }

    // Can't auto-tag screenshots
    if (clip.clipType === 'screenshot' || clip.clipType === 'marquee') {
      return { success: false, error: 'Cannot auto-tag images' };
    }

    // Use first 500 chars for efficiency
    const contentSnippet = clip.content.substring(0, 500);
    const instruction = 'Suggest exactly 3 short tags (1-2 words each) for this content. Return ONLY a JSON array of strings, nothing else. Example: ["technology", "tutorial", "web dev"]';

    log('Calling AI for auto-tag...');
    const result = await analyze(contentSnippet, instruction);
    log('AI result:', result);

    if (!result.success) {
      return { success: false, error: result.error || 'AI analysis failed' };
    }

    // Parse the JSON response
    let suggestedTags = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.result.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        suggestedTags = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      log('Failed to parse AI tag suggestions:', result.result);
      return { success: false, error: 'Failed to parse tag suggestions' };
    }

    // Ensure we have an array of strings
    if (!Array.isArray(suggestedTags)) {
      return { success: false, error: 'Invalid tag format from AI' };
    }

    suggestedTags = suggestedTags
      .filter(t => typeof t === 'string')
      .map(t => t.trim().toLowerCase())
      .slice(0, 3);

    log('Suggested tags for clip:', clip.id, suggestedTags);
    return { success: true, clipId: clip.id, suggestedTags };
  } catch (error) {
    log('Auto-tag error:', error);
    return { success: false, error: error.message };
  }
}

// --- Check Feature Access Handler ---
async function handleCheckFeatureAccess(payload) {
  try {
    const hasAccess = await canAccessFeature(payload.feature);
    return { hasAccess };
  } catch (error) {
    return { hasAccess: false, error: error.message };
  }
}

// --- AI Vision Analysis Handler ---
async function handleAnalyzeImage(payload) {
  log('handleAnalyzeImage called with clipId:', payload.clipId);

  try {
    // Check tier access
    const hasAccess = await canAccessFeature('ai-vision');
    log('Tier access for ai-vision:', hasAccess);
    if (!hasAccess) {
      return { success: false, error: 'tier_required', requiredTier: 'pro' };
    }

    const clip = await get('clips', payload.clipId);
    if (!clip) {
      return { success: false, error: 'Clip not found' };
    }

    // Only for screenshots
    if (clip.clipType !== 'screenshot' && clip.clipType !== 'marquee') {
      return { success: false, error: 'AI Vision only works on screenshots' };
    }

    const instruction = 'Describe what you see in this screenshot. Identify key text, UI elements, data, or visual content. Be concise but thorough.';

    log('Calling AI Vision...');
    const result = await analyzeImage(clip.content, instruction);
    log('AI Vision result:', result);

    if (!result.success) {
      return { success: false, error: result.error || 'AI vision analysis failed' };
    }

    // Update clip with the analysis as summary
    const updated = {
      ...clip,
      summary: result.result,
      updatedAt: new Date().toISOString()
    };

    await put('clips', updated);
    log('Vision analysis saved for clip:', clip.id);

    return { success: true, clip: updated, analysis: result.result };
  } catch (error) {
    log('AI Vision error:', error);
    return { success: false, error: error.message };
  }
}

// --- Credit Handlers ---
async function handleGetCredits() {
  try {
    const balance = await getBalance();
    return { success: true, balance };
  } catch (error) {
    return { success: false, error: error.message, balance: 0 };
  }
}

async function handleDeductCredits(payload) {
  try {
    const result = await deduct(payload.action, payload.description);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleAddCredits(payload) {
  try {
    const result = await addCredits(payload.amount, payload.source, payload.packId);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- InsightForge: Synthesize Clips Handler ---
async function handleSynthesizeClips(payload) {
  const template = payload.template || 'quick-summary';
  log('handleSynthesizeClips called with template:', template, 'clipIds:', payload.clipIds);

  try {
    // Check tier access
    const hasAccess = await canAccessFeature('synthesize-clips');
    if (!hasAccess) {
      return { success: false, error: 'tier_required', requiredTier: 'power' };
    }

    // Check credits based on template
    const affordCheck = await canAfford(template);
    if (!affordCheck.canAfford) {
      return {
        success: false,
        error: 'insufficient_credits',
        cost: affordCheck.cost,
        balance: affordCheck.balance
      };
    }

    // Get the clips
    const clips = [];
    for (const clipId of payload.clipIds) {
      const clip = await get('clips', clipId);
      if (clip) {
        clips.push(clip);
      }
    }

    if (clips.length < 2) {
      return { success: false, error: 'Need at least 2 clips to synthesize' };
    }

    // Build content based on template type
    let combinedContent;
    let instruction;

    if (template === 'research-dossier') {
      // Research Dossier: Use more content, include sources
      const contentParts = clips.map((clip, i) => {
        if (clip.clipType === 'screenshot' || clip.clipType === 'marquee') {
          return `[Source ${i + 1}]: (Screenshot from ${clip.sourceTitle || clip.sourceUrl})`;
        }
        // Use more content for dossier (up to 1500 chars)
        const content = clip.content.length > 1500
          ? clip.content.substring(0, 1500) + '...'
          : clip.content;
        return `[Source ${i + 1}: ${clip.sourceTitle || 'Unknown'}]\nURL: ${clip.sourceUrl || 'N/A'}\n\n${content}`;
      });

      combinedContent = contentParts.join('\n\n---\n\n');

      instruction = `You are creating a Research Dossier from ${clips.length} sources. Provide comprehensive analysis. Return a JSON object with:
- "executive_summary": 3-4 sentence executive summary
- "themes": array of 3-5 major themes with brief explanations
- "key_findings": array of 5-8 important findings from the sources
- "insights": array of 3-5 analytical insights
- "connections": array of 2-4 relationships between sources
- "questions": array of 2-3 open questions for further research
- "summary": comprehensive 4-5 sentence conclusion

Return ONLY valid JSON, no other text.`;

    } else {
      // Quick Summary: Concise output
      const contentParts = clips.map((clip, i) => {
        if (clip.clipType === 'screenshot' || clip.clipType === 'marquee') {
          return `[Clip ${i + 1}]: (Screenshot from ${clip.sourceTitle || clip.sourceUrl})`;
        }
        const content = clip.content.length > 500
          ? clip.content.substring(0, 500) + '...'
          : clip.content;
        return `[Clip ${i + 1} from ${clip.sourceTitle || 'Unknown'}]:\n${content}`;
      });

      combinedContent = contentParts.join('\n\n---\n\n');

      instruction = `Analyze these ${clips.length} clips and provide a concise synthesis. Return a JSON object with:
- "themes": array of 2-4 common themes (brief phrases)
- "insights": array of 3-5 key takeaways (1 sentence each)
- "connections": array of 2-3 connections between clips
- "summary": 2-3 sentence overall summary

Return ONLY valid JSON, no other text.`;
    }

    log('Calling AI for synthesis...');
    const result = await analyze(combinedContent, instruction);

    if (!result.success) {
      return { success: false, error: result.error || 'AI synthesis failed' };
    }

    // Parse the synthesis result
    let synthesis = {};
    try {
      const jsonMatch = result.result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        synthesis = JSON.parse(jsonMatch[0]);
      } else {
        synthesis = JSON.parse(result.result);
      }
    } catch (parseError) {
      log('Failed to parse synthesis JSON:', result.result);
      synthesis = {
        themes: ['Unable to parse themes'],
        insights: [result.result],
        connections: [],
        summary: 'AI response could not be structured properly.'
      };
    }

    // For research-dossier, include source clips and tags in response
    if (template === 'research-dossier') {
      synthesis.sources = clips.map(clip => ({
        id: clip.id,
        type: clip.clipType,
        title: clip.sourceTitle || 'Untitled',
        url: clip.sourceUrl,
        content: clip.clipType === 'screenshot' || clip.clipType === 'marquee'
          ? null
          : clip.content,
        thumbnail: clip.clipType === 'screenshot' || clip.clipType === 'marquee'
          ? clip.content
          : null,
        createdAt: clip.createdAt
      }));

      // Gather all unique tags from synthesized clips
      const tagIds = new Set();
      for (const clip of clips) {
        const clipTags = await query('clip_tags', 'by-clip', clip.id);
        clipTags.forEach(ct => tagIds.add(ct.tagId));
      }

      // Fetch tag details
      const tagsArray = [];
      for (const tagId of tagIds) {
        const tag = await get('tags', tagId);
        if (tag) {
          tagsArray.push({ id: tag.id, name: tag.name, color: tag.color });
        }
      }
      synthesis.tags = tagsArray;
    }

    // Deduct credits based on template
    const templateName = template === 'research-dossier' ? 'Research Dossier' : 'Quick Summary';
    const deductResult = await deduct(template, `${templateName} - ${clips.length} clips`);

    log('Synthesis complete, credits deducted:', deductResult);

    return {
      success: true,
      synthesis,
      template,
      newBalance: deductResult.newBalance,
      clipsAnalyzed: clips.length
    };
  } catch (error) {
    log('Synthesize error:', error);
    return { success: false, error: error.message };
  }
}
