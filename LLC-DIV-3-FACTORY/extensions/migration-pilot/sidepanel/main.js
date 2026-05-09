// ============================================================
// SIDE PANEL — [864F] MigrationPilot
// 864zeros LLC | 864-Flux pillar | v1.0.0
// UI logic for capture list + selective Liberate flow + settings link.
//
// RULE-004 compliant: uses BRK-UI-004 (accordion-record-v1) for the
// record list. Per-record header/body with grid-template-rows
// transition, Graphite chevron rotation, Shift+Click multi-expand.
// ============================================================

import { getAllCaptures, deleteCapture } from '../lib/db.js';
import { AccordionController, createChevronSVG } from '../lib/bricks/accordion-record-v1/index.js';

const $ = (sel) => document.querySelector(sel);

// --- Theme (per GTM_MANIFEST §8 + auto-default) ---
async function loadAndApplyTheme() {
  try {
    const result = await chrome.storage.local.get('theme');
    applyTheme(result.theme || 'auto');
  } catch (e) { /* storage unavailable; fall back to auto */ }
}

function applyTheme(theme) {
  if (theme === 'auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// React to theme changes from any extension surface
if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.theme) {
      applyTheme(changes.theme.newValue || 'auto');
    }
  });
}
loadAndApplyTheme();

// Selection state — Set of capture IDs the user has checked.
const selectedIds = new Set();

// Tracks the IDs that were just liberated, so the cleanup prompt knows
// which captures to delete on "Clear selected".
let lastLiberatedIds = [];
let cleanupAutoDismissTimer = null;

// Accordion controller (BRK-UI-004) — initialized in DOMContentLoaded
let accordion = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize accordion controller BEFORE first render so refresh() picks up state.
  // Defaults: exclusive=true, shiftMultiExpand=true (REQUIRED per RULE-004).
  accordion = new AccordionController({
    container: $('#captures-list'),
  });

  await renderCaptures();
  $('#btn-marquee').addEventListener('click', onMarqueeClick);
  $('#btn-page').addEventListener('click', onCapturePageClick);
  $('#btn-liberate').addEventListener('click', onLiberateClick);
  $('#open-options').addEventListener('click', onOpenOptions);
  $('#select-all').addEventListener('change', onSelectAllChange);
  $('#btn-cleanup-clear').addEventListener('click', onCleanupClear);
  $('#btn-cleanup-keep').addEventListener('click', onCleanupKeep);

  // Listen for capture broadcasts from the service worker / other surfaces.
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (!message || typeof message.type !== 'string') return false;
      if (
        message.type === 'CAPTURE_ADDED' ||
        message.type === 'CAPTURE_REMOVED' ||
        message.type === 'CAPTURES_CLEARED'
      ) {
        renderCaptures();
        if (message.type === 'CAPTURE_ADDED') {
          showToast(message.preview || 'Captured Clip');
        }
      }
      return false;
    });
  }
});

function onOpenOptions() {
  if (chrome.runtime && chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  }
}

function buildSnippet(content) {
  const text = (content || '').trim().replace(/\s+/g, ' ');
  if (!text) return 'Captured Clip';
  return text.length > 140 ? text.substring(0, 140) + '…' : text;
}

function formatTimestamp(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${month} ${day}, ${time}`;
  } catch (e) { return ''; }
}

function extractHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch (e) { return url; }
}

// Defensive HTML sanitizer for in-panel display. Strips scripts, styles,
// and inline event handlers. Captured content is from trusted user-driven
// extraction, but we sanitize defensively.
function sanitizeForDisplay(html) {
  if (!html) return '';
  let s = String(html);
  s = s.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
  s = s.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
  s = s.replace(/\son\w+\s*=\s*\S+/gi, '');
  s = s.replace(/\bjavascript:/gi, '');
  return s;
}

async function renderCaptures() {
  const items = await getAllCaptures();
  const list = $('#captures-list');
  $('#count-num').textContent = String(items.length);

  // Drop selections for captures that no longer exist
  const liveIds = new Set(items.map((it) => it.id));
  for (const id of selectedIds) {
    if (!liveIds.has(id)) selectedIds.delete(id);
  }

  if (items.length === 0) {
    list.innerHTML = `
      <div class="oia-empty">
        <p class="oia-empty__headline">No captures yet</p>
        <p class="oia-empty__subtext">Right-click any selected text on a page, or use the buttons above.</p>
      </div>
    `;
    $('#select-all-row').hidden = true;
    updateLiberateButtonState();
    if (accordion) accordion.refresh();
    return;
  }

  $('#select-all-row').hidden = false;
  list.innerHTML = '';
  for (const item of items.slice().reverse()) {
    list.appendChild(buildCaptureCard(item));
  }
  updateSelectAllState(items);
  updateLiberateButtonState();
  // Re-sync accordion state to the freshly-rendered DOM
  if (accordion) accordion.refresh();
}

// Builds an accordion-record element per BRK-UI-004 contract.
// Uses the canonical .accordion-record-* class names so the brick's CSS
// + AccordionController behavior apply automatically.
function buildCaptureCard(item) {
  const isSelected = selectedIds.has(item.id);

  const card = document.createElement('div');
  card.className = 'accordion-record';
  if (isSelected) card.classList.add('accordion-record--selected');
  card.dataset.id = String(item.id);

  // ============================================================
  // HEADER — always visible, click-to-toggle
  // [ ☐ ] [ title + timestamp + host ] [ chevron > ]
  // ============================================================
  const header = document.createElement('div');
  header.className = 'accordion-record__header';
  header.setAttribute('role', 'button');
  header.setAttribute('tabindex', '0');
  header.setAttribute('aria-expanded', 'false');
  header.setAttribute('aria-controls', `record-body-${item.id}`);

  // Selection checkbox (RULE-003 pairing). [data-no-toggle] tells the
  // AccordionController to ignore clicks on this control.
  const selectLabel = document.createElement('label');
  selectLabel.className = 'accordion-record__select';
  selectLabel.setAttribute('aria-label', 'Select this capture');
  selectLabel.setAttribute('data-no-toggle', '');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'oia-checkbox capture-checkbox';
  checkbox.checked = isSelected;
  checkbox.addEventListener('change', (e) => onCaptureSelected(item.id, e.target.checked, card));
  selectLabel.appendChild(checkbox);
  header.appendChild(selectLabel);

  // Title block (title + meta line)
  const titleBlock = document.createElement('div');
  titleBlock.className = 'accordion-record__title-block';

  const title = document.createElement('div');
  title.className = 'accordion-record__title';
  title.textContent = item.title || '(untitled)';
  titleBlock.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'accordion-record__meta';
  const stamp = formatTimestamp(item.timestamp);
  if (stamp) meta.appendChild(document.createTextNode(stamp));
  if (item.source_url) {
    if (stamp) meta.appendChild(document.createTextNode(' · '));
    meta.appendChild(document.createTextNode(extractHost(item.source_url)));
  }
  titleBlock.appendChild(meta);
  header.appendChild(titleBlock);

  // Graphite chevron — rotates 90° on expand (handled by brick CSS)
  const chevron = document.createElement('button');
  chevron.className = 'accordion-record__chevron';
  chevron.type = 'button';
  chevron.setAttribute('data-no-toggle', '');
  chevron.setAttribute('aria-label', 'Toggle');
  chevron.tabIndex = -1;
  chevron.innerHTML = createChevronSVG();
  chevron.addEventListener('click', (e) => {
    e.stopPropagation();
    accordion.toggle(item.id, e.shiftKey);
  });
  header.appendChild(chevron);

  card.appendChild(header);

  // ============================================================
  // BODY — hidden until expanded; grid-template-rows transition
  // ============================================================
  const bodyWrapper = document.createElement('div');
  bodyWrapper.className = 'accordion-record__body-wrapper';

  const body = document.createElement('div');
  body.className = 'accordion-record__body';
  body.id = `record-body-${item.id}`;

  // Parchment Reading Surface (per RULE-004 §2 / brick standard)
  const reading = document.createElement('div');
  reading.className = 'accordion-record__reading';
  if (item.contentFormat === 'html') {
    reading.innerHTML = sanitizeForDisplay(item.content);
  } else {
    reading.textContent = item.content || '';
  }
  body.appendChild(reading);

  // Action row: View Source · Liberate to Markdown · Remove
  const actions = document.createElement('div');
  actions.className = 'accordion-record__actions';

  if (item.source_url && item.source_url !== '-') {
    const viewSource = document.createElement('a');
    viewSource.className = 'accordion-record__action';
    viewSource.setAttribute('data-no-toggle', '');
    viewSource.href = item.source_url;
    viewSource.target = '_blank';
    viewSource.rel = 'noopener noreferrer';
    viewSource.textContent = 'View Source';
    actions.appendChild(viewSource);
  }

  const liberateBtn = document.createElement('button');
  liberateBtn.className = 'accordion-record__action accordion-record__action--primary';
  liberateBtn.type = 'button';
  liberateBtn.setAttribute('data-no-toggle', '');
  liberateBtn.textContent = 'Liberate to Markdown';
  liberateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onLiberateSingle(item.id, liberateBtn);
  });
  actions.appendChild(liberateBtn);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'accordion-record__action accordion-record__action--danger';
  removeBtn.type = 'button';
  removeBtn.setAttribute('data-no-toggle', '');
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    selectedIds.delete(item.id);
    if (accordion) accordion.collapse(item.id);
    await deleteCapture(item.id);
    chrome.runtime.sendMessage({ type: 'CAPTURE_REMOVED' }).catch(() => {});
    await renderCaptures();
  });
  actions.appendChild(removeBtn);

  body.appendChild(actions);
  bodyWrapper.appendChild(body);
  card.appendChild(bodyWrapper);

  return card;
}

async function onLiberateSingle(id, button) {
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = 'Liberating…';
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'LIBERATE_TO_MARKDOWN',
      options: { combined: false, selectedIds: [id] },
    });
    if (response && response.ok) {
      showToast('Liberated 1 file to your vault');
    } else {
      showToast(response?.error || 'That didn’t work — try again?', 'error');
    }
  } catch (e) {
    showToast('Liberation failed', 'error');
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
}

function onCaptureSelected(id, isChecked, cardEl) {
  if (isChecked) {
    selectedIds.add(id);
    cardEl.classList.add('accordion-record--selected');
  } else {
    selectedIds.delete(id);
    cardEl.classList.remove('accordion-record--selected');
  }
  updateLiberateButtonState();
  refreshSelectAllFromCurrentDOM();
}

function refreshSelectAllFromCurrentDOM() {
  const checkboxes = document.querySelectorAll('.capture-checkbox');
  const total = checkboxes.length;
  const checked = Array.from(checkboxes).filter((cb) => cb.checked).length;
  const master = $('#select-all');
  if (total === 0) {
    master.checked = false;
    master.indeterminate = false;
  } else if (checked === 0) {
    master.checked = false;
    master.indeterminate = false;
  } else if (checked === total) {
    master.checked = true;
    master.indeterminate = false;
  } else {
    master.checked = false;
    master.indeterminate = true;
  }
  $('#select-all-text').textContent = checked > 0
    ? `${checked} selected of ${total}`
    : 'Select all';
  $('#selection-count').textContent = checked > 0 ? ` · ${checked} selected` : '';
}

function updateSelectAllState(items) {
  refreshSelectAllFromCurrentDOM();
}

function onSelectAllChange(e) {
  const checked = e.target.checked;
  const checkboxes = document.querySelectorAll('.capture-checkbox');
  for (const cb of checkboxes) {
    cb.checked = checked;
    const cardEl = cb.closest('.accordion-record');
    if (!cardEl) continue;
    const id = Number(cardEl.dataset.id);
    if (checked) {
      selectedIds.add(id);
      cardEl.classList.add('accordion-record--selected');
    } else {
      selectedIds.delete(id);
      cardEl.classList.remove('accordion-record--selected');
    }
  }
  e.target.indeterminate = false;
  updateLiberateButtonState();
  refreshSelectAllFromCurrentDOM();
}

function updateLiberateButtonState() {
  const btn = $('#btn-liberate');
  const count = selectedIds.size;
  btn.disabled = count === 0;
  btn.textContent = count > 0
    ? `Liberate ${count} to Markdown`
    : 'Liberate to Markdown';
}

async function onMarqueeClick() {
  const response = await chrome.runtime.sendMessage({ type: 'START_MARQUEE' });
  if (response && response.ok) {
    showToast('Drag a region on the page', 'info');
  } else {
    showToast(response?.error || 'Could not start marquee mode', 'error');
  }
}

async function onCapturePageClick() {
  $('#btn-page').disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_PAGE_TEXT' });
    if (response && response.ok) {
      showToast(`Page saved (${response.count} total)`);
      await renderCaptures();
    } else {
      showToast(response?.error || 'That didn’t work — try again?', 'error');
    }
  } finally {
    $('#btn-page').disabled = false;
  }
}

async function onLiberateClick() {
  const button = $('#btn-liberate');
  const ids = Array.from(selectedIds);
  if (ids.length === 0) {
    showToast('Select captures to liberate', 'info');
    return;
  }

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = 'Liberating…';

  try {
    const combined = $('#combined-toggle').checked;
    const response = await chrome.runtime.sendMessage({
      type: 'LIBERATE_TO_MARKDOWN',
      options: { combined, selectedIds: ids },
    });
    if (response && response.ok) {
      showToast(`Liberated ${response.downloaded} file${response.downloaded === 1 ? '' : 's'}`);
      lastLiberatedIds = ids.slice();
      showCleanupPrompt(response.downloaded);
    } else {
      showToast(response?.error || 'That didn’t work — try again?', 'error');
    }
  } finally {
    button.textContent = originalText;
    updateLiberateButtonState();
  }
}

function showCleanupPrompt(fileCount) {
  if (lastLiberatedIds.length === 0) return;
  const prompt = $('#cleanup-prompt');
  const msg = $('#cleanup-prompt-msg');
  const clearBtn = $('#btn-cleanup-clear');
  msg.textContent = `Liberated ${fileCount} file${fileCount === 1 ? '' : 's'}. Clear the ${lastLiberatedIds.length} selected capture${lastLiberatedIds.length === 1 ? '' : 's'} from this list?`;
  clearBtn.textContent = `Clear selected (${lastLiberatedIds.length})`;
  prompt.hidden = false;
  prompt.classList.add('cleanup-prompt--visible');

  if (cleanupAutoDismissTimer) clearTimeout(cleanupAutoDismissTimer);
  cleanupAutoDismissTimer = setTimeout(hideCleanupPrompt, 12000);
}

function hideCleanupPrompt() {
  const prompt = $('#cleanup-prompt');
  prompt.hidden = true;
  prompt.classList.remove('cleanup-prompt--visible');
  if (cleanupAutoDismissTimer) {
    clearTimeout(cleanupAutoDismissTimer);
    cleanupAutoDismissTimer = null;
  }
}

async function onCleanupClear() {
  const ids = lastLiberatedIds.slice();
  if (ids.length === 0) {
    hideCleanupPrompt();
    return;
  }
  $('#btn-cleanup-clear').disabled = true;
  $('#btn-cleanup-keep').disabled = true;
  try {
    for (const id of ids) {
      await deleteCapture(id);
      selectedIds.delete(id);
    }
    chrome.runtime.sendMessage({ type: 'CAPTURE_REMOVED' }).catch(() => {});
    showToast(`Cleared ${ids.length} from list`);
    lastLiberatedIds = [];
    await renderCaptures();
  } catch (e) {
    showToast('That didn’t work — try again?', 'error');
    console.warn('[MigrationPilot] cleanup failed:', e);
  } finally {
    $('#btn-cleanup-clear').disabled = false;
    $('#btn-cleanup-keep').disabled = false;
    hideCleanupPrompt();
  }
}

function onCleanupKeep() {
  lastLiberatedIds = [];
  hideCleanupPrompt();
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.oia-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = `oia-toast oia-toast--${type}`;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}
