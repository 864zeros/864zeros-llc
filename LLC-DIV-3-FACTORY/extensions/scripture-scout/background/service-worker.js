// ============================================================
// SERVICE WORKER — [FHG] ScriptureScout Side Panel Extension
// 864zeros LLC | Faith / Heritage pillar | v0.1.0
//
// All listeners and one-shot setup at TOP LEVEL (MV3 requirement).
// This file is the relay. UI logic lives in sidepanel/main.js
// and options/main.js.
// ============================================================

import { addCapture, getAllCaptures, clearAll } from '../lib/db.js';
import { convertBatch } from '../lib/markdown-converter.js';
import { SELECTOR_PROFILES } from '../scripts/selectors.js';

const CONTEXT_MENU_SAVE = 'scripture-scout-save-selection';
const CONTEXT_MENU_LIBERATE = 'scripture-scout-liberate';
const SNIPPET_PREVIEW_LEN = 80;

// --- Panel Behavior ---
// Opens the side panel when the user clicks the toolbar icon.
// REQUIRED: This cannot be set in the manifest — only via API.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[ScriptureScout] sidePanel error:', error));

// --- Context Menus ---
// Created at TOP LEVEL (not inside async callbacks) per workspace pattern.
chrome.contextMenus.create({
  id: CONTEXT_MENU_SAVE,
  title: '864zeros: Save passage',
  contexts: ['selection'],
}, () => {
  if (chrome.runtime.lastError) { /* menu already exists, ignore */ }
});

chrome.contextMenus.create({
  id: CONTEXT_MENU_LIBERATE,
  title: '864zeros: Liberate to Vault',
  contexts: ['page'],
}, () => {
  if (chrome.runtime.lastError) { /* menu already exists, ignore */ }
});

// --- Lifecycle ---
chrome.runtime.onInstalled.addListener(() => {
  // No-op for now — context menus are created at top level.
  // Future install/update migrations land here.
});

// --- Context menu router ---
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === CONTEXT_MENU_SAVE) {
      await handleSaveSelection(info, tab);
    } else if (info.menuItemId === CONTEXT_MENU_LIBERATE) {
      await runLiberation({ combined: false, clearAfter: false });
    }
  } catch (e) {
    console.warn('[ScriptureScout] context-menu handler failed:', e);
  }
});

async function handleSaveSelection(info, tab) {
  if (!tab || !tab.id) return;
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractSelectionInPage,
  });
  if (result && result.content) {
    await saveCapture({
      title: result.title || tab.title,
      content: result.content,
      source_url: tab.url,
      captureMode: 'selection',
    });
  }
}

// Injected into the page; must be self-contained (no closures).
function extractSelectionInPage() {
  const sel = window.getSelection();
  return {
    content: sel ? sel.toString() : '',
    title: document.title,
    url: window.location.href,
  };
}

function scrapePageInPage() {
  return {
    content: document.body ? document.body.innerText : '',
    title: document.title,
    url: window.location.href,
  };
}

// --- Message routing (sidepanel + content script + options → SW) ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Ignore broadcast messages we ourselves emit.
  if (message && (
    message.type === 'CAPTURE_ADDED' ||
    message.type === 'CAPTURE_REMOVED' ||
    message.type === 'CAPTURES_CLEARED'
  )) {
    return false;
  }
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((err) => sendResponse({ ok: false, error: String(err) }));
  return true;
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'CAPTURE_FROM_CONTENT': {
      const id = await saveCapture({
        title: message.payload.title,
        content: message.payload.content,
        contentFormat: message.payload.contentFormat || 'text',
        source_url: message.payload.source_url,
        captureMode: message.payload.captureMode || 'marquee',
        bounds: message.payload.bounds || null,
        profile_host: message.payload.profile_host || null,
        page_variant: message.payload.page_variant || null,
        metadata: message.payload.metadata || null,
        summary: message.payload.summary || null,
        source_name: message.payload.source_name || null,
      });
      const count = (await getAllCaptures()).length;
      return { ok: true, id, count };
    }

    case 'CAPTURE_PAGE_TEXT': {
      const tab = await getActiveTab();
      if (!tab) return { ok: false, error: 'No active tab' };
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapePageInPage,
      });
      const id = await saveCapture({
        title: result.title,
        content: result.content,
        source_url: result.url,
        captureMode: 'full_page',
      });
      const count = (await getAllCaptures()).length;
      return { ok: true, id, count };
    }

    case 'START_MARQUEE': {
      const tab = await getActiveTab();
      if (!tab) return { ok: false, error: 'No active tab' };
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'START_MARQUEE' });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: 'Marquee mode requires the page to be loaded. Refresh the page and try again.' };
      }
    }

    case 'LIBERATE_TO_MARKDOWN':
      return runLiberation(message.options || {});

    case 'GET_CAPTURE_COUNT': {
      const count = (await getAllCaptures()).length;
      return { ok: true, count };
    }

    default:
      return { ok: false, error: 'Unknown message type: ' + message.type };
  }
}

async function runLiberation({ combined = false, clearAfter = false, selectedIds = null }) {
  const allCaptures = await getAllCaptures();
  if (allCaptures.length === 0) {
    return { ok: false, error: 'No captures to liberate. Capture something first.' };
  }

  // Filter to selected IDs if provided. If null/undefined (e.g., context-menu
  // "Liberate to Markdown" right-click trigger), fall back to all-captures
  // behavior so the menu still works without a selection round-trip.
  let captures = allCaptures;
  if (Array.isArray(selectedIds) && selectedIds.length > 0) {
    const wanted = new Set(selectedIds.map((n) => Number(n)));
    captures = allCaptures.filter((c) => wanted.has(Number(c.id)));
    if (captures.length === 0) {
      return { ok: false, error: 'Selected captures were not found. Refresh and try again.' };
    }
  } else if (Array.isArray(selectedIds) && selectedIds.length === 0) {
    return { ok: false, error: 'No captures selected.' };
  }

  const items = captures.map((c) => {
    // Per-item profile lookup → noise selectors for the sanitization pipeline.
    const profile = c.profile_host ? SELECTOR_PROFILES[c.profile_host] : null;
    const noiseSelectors = (profile && profile.selectors && profile.selectors.noise) || null;

    // Merge per-capture metadata into frontmatter `extra`. Fields like
    // `reference`, `translation`, etc. become first-class frontmatter keys.
    const extra = {};
    if (c.metadata && typeof c.metadata === 'object') {
      for (const [k, v] of Object.entries(c.metadata)) {
        if (v === null || v === undefined || v === '') continue;
        extra[k] = v;
      }
    }
    if (c.captureMode) extra.capture_mode = c.captureMode;
    if (c.profile_host) extra.profile_host = c.profile_host;
    // Traceability per RULE-004 + Strike 012 closure: View Source URL
    // appears in frontmatter as a dedicated `view_source` field that
    // mirrors the standard `source_url`. Vault tools and humans can
    // both quickly locate the original passage.
    if (c.source_url) extra.view_source = c.source_url;

    return {
      content: c.content,
      title: c.title,
      source_url: c.source_url,
      timestamp: c.timestamp,
      tags: c.tags || [],
      note: c.note || '',
      extra: Object.keys(extra).length > 0 ? extra : undefined,
      noiseSelectors,
      profile_host: c.profile_host || null,  // Heritage logic gate (BibleHub interlinear → GFM table)
    };
  });

  const { files } = convertBatch(items, {
    combined,
    combinedFilename: `scripture-scout-${new Date().toISOString().slice(0, 10)}`,
    combinedTitle: `ScriptureScout export — ${captures.length} items`,
  });

  let downloaded = 0;
  for (const f of files) {
    // MV3 service worker context: URL.createObjectURL is unreliable here
    // (unsupported pre-Chrome 110, intermittent failures even after).
    // Encode markdown as a UTF-8-safe Base64 data URI so chrome.downloads
    // receives a self-contained URL that doesn't depend on a worker-scope
    // blob registry. Build-kit pattern; see SYSTEM_STRIKE_LOG.md (2026-05-08).
    const base64Content = btoa(unescape(encodeURIComponent(f.markdown)));
    const url = 'data:text/markdown;base64,' + base64Content;
    try {
      await chrome.downloads.download({
        url,
        filename: `scripture-scout/${f.filename}`,
        conflictAction: 'uniquify',
        saveAs: false,
      });
      downloaded++;
    } catch (e) {
      console.warn('[ScriptureScout] download failed:', f.filename, e);
    }
  }

  if (clearAfter) {
    await clearAll();
    broadcast({ type: 'CAPTURES_CLEARED' });
  }
  await updateBadge();
  return { ok: true, files: files.length, downloaded };
}

// --- Helpers ---

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

async function saveCapture(item) {
  // Resolve source_name from profile registry if not already provided.
  // (Marquee.js sends source_name; right-click / full-page paths may not.)
  const profile = item.profile_host ? SELECTOR_PROFILES[item.profile_host] : null;
  const resolvedSourceName = item.source_name || (profile && profile.name) || null;

  const stored = {
    title: item.title || 'Untitled',
    content: item.content || '',
    contentFormat: item.contentFormat || 'text',
    source_url: item.source_url || '',
    timestamp: new Date().toISOString(),
    tags: item.tags || [],
    note: item.note || '',
    captureMode: item.captureMode || 'unknown',
    bounds: item.bounds || null,
    profile_host: item.profile_host || null,
    page_variant: item.page_variant || null,
    metadata: item.metadata || null,
    summary: item.summary || null,
    source_name: resolvedSourceName,
  };
  const id = await addCapture(stored);
  const count = await updateBadge();

  // Build a short preview so the sidepanel toast can show what was captured.
  // For HTML content, strip tags before previewing.
  let previewSrc = stored.content || '';
  if (stored.contentFormat === 'html') {
    previewSrc = previewSrc.replace(/<[^>]*>/g, ' ');
  }
  previewSrc = previewSrc.trim().replace(/\s+/g, ' ');
  const preview = previewSrc
    ? (previewSrc.length > SNIPPET_PREVIEW_LEN
        ? previewSrc.substring(0, SNIPPET_PREVIEW_LEN) + '…'
        : previewSrc)
    : 'Captured passage';

  // Broadcast to all extension surfaces (sidepanel, options) so they re-render.
  // The sidepanel uses `summary` + `source_name` to build the Bronze
  // "Scout Success — N verses from Blue Letter Bible" toast.
  broadcast({
    type: 'CAPTURE_ADDED',
    id,
    count,
    preview,
    summary: stored.summary,
    source_name: stored.source_name,
    captureMode: stored.captureMode,
    profile_host: stored.profile_host,
  });

  return id;
}

function broadcast(message) {
  try {
    chrome.runtime.sendMessage(message).catch(() => { /* no listener, ignore */ });
  } catch (e) {
    /* sendMessage may throw synchronously if no listener registered yet */
  }
}

async function updateBadge() {
  const count = (await getAllCaptures()).length;
  chrome.action.setBadgeBackgroundColor({ color: '#8BA888' });
  chrome.action.setBadgeText({ text: count ? String(count) : '' });
  return count;
}
