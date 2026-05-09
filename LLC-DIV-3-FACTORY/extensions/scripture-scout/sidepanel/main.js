// ============================================================
// SIDE PANEL — [FHG] ScriptureScout
// 864zeros LLC | Faith / Heritage pillar | v0.1.0
// UI logic for capture list + selective Liberate flow + settings link.
// ============================================================

import { getAllCaptures, deleteCapture } from '../lib/db.js';

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
// Persists across re-renders within a session (cleared if a capture is removed
// from the DB while still in the set; we filter on render).
const selectedIds = new Set();

// Accordion expansion state — Set of capture IDs currently expanded.
// Default: exclusive (clicking one collapses others). Shift+Click toggles
// without affecting other expansions (multi-compare mode for ADHD focus).
const expandedIds = new Set();

// Tracks the IDs that were just liberated, so the cleanup prompt knows
// which captures to delete on "Clear selected".
let lastLiberatedIds = [];
let cleanupAutoDismissTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
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
          // Bronze "Scout Success" toast.
          // Preferred format: "Scout Success — N verses from Blue Letter Bible"
          // (built from message.summary, which marquee.js produces per profile).
          // Fallback: "Scout Success — <preview>" or just "Scout Success".
          let toastText;
          if (message.summary) {
            toastText = `Scout Success — ${message.summary}`;
          } else if (message.source_name) {
            toastText = `Scout Success — captured from ${message.source_name}`;
          } else if (message.preview) {
            toastText = `Scout Success — ${message.preview}`;
          } else {
            toastText = 'Scout Success';
          }
          showToast(toastText, 'scout-success');
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
    return;
  }

  $('#select-all-row').hidden = false;
  list.innerHTML = '';
  for (const item of items.slice().reverse()) {
    list.appendChild(buildCaptureCard(item));
  }
  updateSelectAllState(items);
  updateLiberateButtonState();
}

function buildCaptureCard(item) {
  const isSelected = selectedIds.has(item.id);
  const isExpanded = expandedIds.has(item.id);
  const bodyId = `capture-body-${item.id}`;

  const card = document.createElement('div');
  card.className = 'capture-card';
  if (isSelected) card.classList.add('capture-card--selected');
  if (isExpanded) card.classList.add('capture-card--expanded');
  card.dataset.id = String(item.id);

  // ============================================================
  // HEADER (always visible, click-to-toggle)
  // [ ☐ ] [ title + timestamp + source ] [ > chevron ]
  // ============================================================
  const header = document.createElement('div');
  header.className = 'capture-card__header';
  header.setAttribute('role', 'button');
  header.setAttribute('tabindex', '0');
  header.setAttribute('aria-expanded', String(isExpanded));
  header.setAttribute('aria-controls', bodyId);

  // Selection checkbox (RULE-003) — stops propagation so clicking it
  // does NOT toggle the accordion.
  const selectLabel = document.createElement('label');
  selectLabel.className = 'capture-card__select';
  selectLabel.setAttribute('aria-label', 'Select this capture');
  selectLabel.addEventListener('click', (e) => e.stopPropagation());

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'oia-checkbox capture-checkbox';
  checkbox.checked = isSelected;
  checkbox.addEventListener('change', (e) => onCaptureSelected(item.id, e.target.checked, card));
  checkbox.addEventListener('click', (e) => e.stopPropagation());
  selectLabel.appendChild(checkbox);
  header.appendChild(selectLabel);

  // Title block (title + meta line)
  const titleBlock = document.createElement('div');
  titleBlock.className = 'capture-card__title-block';

  const title = document.createElement('div');
  title.className = 'capture-card__title';
  title.textContent = item.title || '(untitled)';
  titleBlock.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'capture-card__meta';
  const stampSpan = document.createElement('span');
  stampSpan.className = 'capture-card__timestamp';
  stampSpan.textContent = formatTimestamp(item.timestamp);
  meta.appendChild(stampSpan);
  if (item.source_url) {
    const sep = document.createElement('span');
    sep.textContent = ' · ';
    sep.setAttribute('aria-hidden', 'true');
    meta.appendChild(sep);
    const hostSpan = document.createElement('span');
    hostSpan.className = 'capture-card__host';
    hostSpan.textContent = extractHost(item.source_url);
    meta.appendChild(hostSpan);
  }
  titleBlock.appendChild(meta);
  header.appendChild(titleBlock);

  // Chevron (Bronze, rotates 90° on expand)
  const chevron = document.createElement('button');
  chevron.className = 'capture-card__chevron';
  chevron.type = 'button';
  chevron.setAttribute('aria-label', isExpanded ? 'Collapse' : 'Expand');
  chevron.tabIndex = -1; // header itself handles keyboard, prevent double-tab
  chevron.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="9 6 15 12 9 18"></polyline>
    </svg>
  `;
  chevron.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAccordion(item.id, e.shiftKey);
  });
  header.appendChild(chevron);

  // Header click handler (whole header is the toggle target)
  header.addEventListener('click', (e) => {
    toggleAccordion(item.id, e.shiftKey);
  });
  // Keyboard: Enter / Space toggle
  header.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleAccordion(item.id, e.shiftKey);
    }
  });

  card.appendChild(header);

  // ============================================================
  // BODY (hidden until expanded, grid-template-rows transition)
  // ============================================================
  const bodyWrapper = document.createElement('div');
  bodyWrapper.className = 'capture-card__body-wrapper';

  const body = document.createElement('div');
  body.className = 'capture-card__body';
  body.id = bodyId;

  // The Parchment-surface reading area
  const reading = document.createElement('div');
  reading.className = 'capture-card__reading';
  if (item.contentFormat === 'html') {
    reading.innerHTML = sanitizeForDisplay(item.content);
  } else {
    reading.textContent = item.content || '';
  }
  body.appendChild(reading);

  // Action row: View Source · Liberate to Vault · Remove
  const actions = document.createElement('div');
  actions.className = 'capture-card__actions';

  if (item.source_url && item.source_url !== '-') {
    const viewSource = document.createElement('a');
    viewSource.className = 'capture-card__action capture-card__action--view-source';
    viewSource.href = item.source_url;
    viewSource.target = '_blank';
    viewSource.rel = 'noopener noreferrer';
    viewSource.textContent = 'View Source';
    viewSource.addEventListener('click', (e) => e.stopPropagation());
    actions.appendChild(viewSource);
  }

  const liberateBtn = document.createElement('button');
  liberateBtn.className = 'capture-card__action capture-card__action--liberate';
  liberateBtn.type = 'button';
  liberateBtn.textContent = 'Liberate to Vault';
  liberateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onLiberateSingle(item.id, liberateBtn);
  });
  actions.appendChild(liberateBtn);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'capture-card__action capture-card__action--remove';
  removeBtn.type = 'button';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    selectedIds.delete(item.id);
    expandedIds.delete(item.id);
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

// Exclusive-by-default expand. Shift+Click keeps multiple open for comparison.
function toggleAccordion(id, shiftKey = false) {
  if (shiftKey) {
    if (expandedIds.has(id)) expandedIds.delete(id);
    else expandedIds.add(id);
  } else {
    const wasExpanded = expandedIds.has(id);
    expandedIds.clear();
    if (!wasExpanded) expandedIds.add(id);
  }
  applyAccordionStates();
}

function applyAccordionStates() {
  document.querySelectorAll('.capture-card').forEach((card) => {
    const id = Number(card.dataset.id);
    const isExpanded = expandedIds.has(id);
    card.classList.toggle('capture-card--expanded', isExpanded);
    const header = card.querySelector('.capture-card__header');
    if (header) header.setAttribute('aria-expanded', String(isExpanded));
    const chevron = card.querySelector('.capture-card__chevron');
    if (chevron) chevron.setAttribute('aria-label', isExpanded ? 'Collapse' : 'Expand');
  });
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
      showToast(`Liberated 1 file to your vault`, 'scout-success');
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

function formatTimestamp(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    // Compact format: "May 8, 7:42 PM"
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

// Minimal HTML sanitizer for in-panel display. Strips scripts, styles,
// and inline event handlers. Captured content is from trusted user-driven
// extraction, but we sanitize defensively in case of future capture paths.
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

function onCaptureSelected(id, isChecked, cardEl) {
  if (isChecked) {
    selectedIds.add(id);
    cardEl.classList.add('capture-card--selected');
  } else {
    selectedIds.delete(id);
    cardEl.classList.remove('capture-card--selected');
  }
  updateLiberateButtonState();
  // Refresh master checkbox tristate without re-rendering the whole list
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
  // Called after a full re-render; total = items.length
  refreshSelectAllFromCurrentDOM();
}

function onSelectAllChange(e) {
  const checked = e.target.checked;
  const checkboxes = document.querySelectorAll('.capture-checkbox');
  for (const cb of checkboxes) {
    cb.checked = checked;
    const id = Number(cb.closest('.capture-card').dataset.id);
    const card = cb.closest('.capture-card');
    if (checked) {
      selectedIds.add(id);
      card.classList.add('capture-card--selected');
    } else {
      selectedIds.delete(id);
      card.classList.remove('capture-card--selected');
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
      // Stash the liberated IDs and offer optional cleanup
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
    console.warn('[ScriptureScout] cleanup failed:', e);
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
