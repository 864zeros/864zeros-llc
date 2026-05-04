// ============================================================
// MAIN.JS — Signal2Noise Panel Logic
// ============================================================

import { getState, setState, onStateChange } from '../lib/store.js';
import { STORAGE_KEYS, LIMITS, RATIOS } from '../lib/constants.js';

// --- DOM Elements ---
const signalPillContainer = document.getElementById('signalPillContainer');
const signalInput = document.getElementById('signalInput');
const saveSignalBtn = document.getElementById('saveSignalBtn');
const copyAllSignalsBtn = document.getElementById('copyAllSignalsBtn');
const downloadSignalsBtn = document.getElementById('downloadSignalsBtn');
const accordionContainer = document.getElementById('accordionContainer');
const emptyState = document.getElementById('emptyState');
const openOptionsBtn = document.getElementById('openOptions');
const toastContainer = document.getElementById('toastContainer');
const ratioInputs = document.querySelectorAll('input[name="s_n_ratio"]');

// --- State ---
let signals = [];

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', init);

async function init() {
  console.log('[Signal2Noise] Panel loaded.');

  // Load signals and ratio from storage
  const storedSignals = await getState(STORAGE_KEYS.SIGNALS);
  const storedRatio = await getState(STORAGE_KEYS.SELECTED_RATIO);

  signals = storedSignals || [];

  // Set ratio radio button
  if (storedRatio) {
    const ratioInput = document.getElementById(`ratio${storedRatio}`);
    if (ratioInput) ratioInput.checked = true;
  }

  // Render UI
  renderAccordion();
  renderPill();
  updateEmptyState();

  // Attach event listeners
  attachEventListeners();

  // Listen for storage changes (reactive updates)
  onStateChange(STORAGE_KEYS.SIGNALS, (newSignals) => {
    signals = newSignals || [];
    renderAccordion();
    renderPill();
    updateEmptyState();
  });
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function attachEventListeners() {
  // Save signal
  saveSignalBtn.addEventListener('click', handleSaveSignal);

  // Copy all signals
  copyAllSignalsBtn.addEventListener('click', handleCopyAll);

  // Download signals
  downloadSignalsBtn.addEventListener('click', handleDownload);

  // Ratio change
  ratioInputs.forEach(input => {
    input.addEventListener('change', handleRatioChange);
  });

  // Open options
  openOptionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Enter key in textarea saves signal
  signalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSaveSignal();
    }
  });
}

// ============================================================
// FEAT-04: SAVE SIGNAL
// ============================================================

async function handleSaveSignal() {
  const text = signalInput.value.trim();

  if (!text) {
    showToast('Add some text first', 'warning');
    return;
  }

  if (signals.length >= LIMITS.MAX_SIGNALS) {
    showToast(`You've reached ${LIMITS.MAX_SIGNALS} signals. Delete one to add a new one.`, 'warning');
    return;
  }

  const newSignal = {
    id: Date.now().toString(),
    text: text,
    isMarked: false
  };

  signals.push(newSignal);
  await setState(STORAGE_KEYS.SIGNALS, signals);

  // Clear input
  signalInput.value = '';

  // Render updates
  renderAccordion();
  renderPill();
  updateEmptyState();

  showToast('Signal saved', 'success');
}

// ============================================================
// FEAT-06: DELETE SIGNAL
// ============================================================

async function handleDeleteSignal(id) {
  signals = signals.filter(s => s.id !== id);
  await setState(STORAGE_KEYS.SIGNALS, signals);

  renderAccordion();
  renderPill();
  updateEmptyState();
}

// ============================================================
// FEAT-07: MARK AS SIGNAL (PRIORITY TOGGLE)
// ============================================================

async function handleToggleMark(id) {
  const signal = signals.find(s => s.id === id);
  if (!signal) return;

  signal.isMarked = !signal.isMarked;
  await setState(STORAGE_KEYS.SIGNALS, signals);

  renderAccordion();
  renderPill();
}

// ============================================================
// FEAT-08: COPY ALL SIGNALS
// ============================================================

async function handleCopyAll() {
  if (signals.length === 0) {
    showToast('No signals to copy', 'warning');
    return;
  }

  const text = signals.map(s => s.text).join('\n\n');

  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  } catch (err) {
    console.error('Clipboard error:', err);
    showToast('Could not copy to clipboard', 'error');
  }
}

// ============================================================
// FEAT-09: DOWNLOAD SIGNALS
// ============================================================

function handleDownload() {
  if (signals.length === 0) {
    showToast('No signals to download', 'warning');
    return;
  }

  const text = signals.map(s => s.text).join('\n\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'signal2noise_signals.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
  showToast('Download started', 'success');
}

// ============================================================
// FEAT-02: RATIO CHANGE
// ============================================================

async function handleRatioChange(e) {
  const value = e.target.value;
  await setState(STORAGE_KEYS.SELECTED_RATIO, value);
}

// ============================================================
// FEAT-01: RENDER SIGNAL PILL
// ============================================================

function renderPill() {
  const markedSignals = signals.filter(s => s.isMarked);

  // Hide pill if fewer than MIN_PILL_SIGNALS marked
  if (markedSignals.length < LIMITS.MIN_PILL_SIGNALS) {
    signalPillContainer.innerHTML = '';
    signalPillContainer.classList.remove('visible');
    return;
  }

  // Show only up to MAX_PILL_SIGNALS
  const displaySignals = markedSignals.slice(0, LIMITS.MAX_PILL_SIGNALS);

  signalPillContainer.innerHTML = displaySignals.map(signal => {
    const title = truncateText(signal.text, LIMITS.PILL_TITLE_LENGTH);
    return `<div class="pill-segment" title="${escapeHtml(signal.text)}">
      <span class="pill-text">${escapeHtml(title)}</span>
    </div>`;
  }).join('');

  signalPillContainer.classList.add('visible');
}

// ============================================================
// FEAT-05: RENDER ACCORDION
// ============================================================

function renderAccordion() {
  if (signals.length === 0) {
    accordionContainer.innerHTML = '';
    return;
  }

  // Render signals (newest at top)
  const reversedSignals = [...signals].reverse();

  accordionContainer.innerHTML = reversedSignals.map(signal => {
    const title = truncateText(signal.text, LIMITS.ACCORDION_TITLE_LENGTH);
    const isMarked = signal.isMarked;

    return `
      <div class="accordion-item oia-card" data-id="${signal.id}">
        <div class="accordion-header" id="accordionHeader_${signal.id}">
          <button class="accordion-toggle" aria-expanded="false" aria-controls="accordionContent_${signal.id}">
            <span class="accordion-title ${isMarked ? 'is-marked' : ''}">${escapeHtml(title)}</span>
            <svg class="accordion-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <button class="delete-btn" id="deleteSignal_${signal.id}" title="Delete signal" aria-label="Delete signal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="accordion-content" id="accordionContent_${signal.id}" hidden>
          <p class="accordion-text oia-body">${escapeHtml(signal.text)}</p>
          <button class="mark-btn oia-btn ${isMarked ? 'oia-btn-primary' : 'oia-btn-secondary'}" id="markAsSignal_${signal.id}">
            ${isMarked ? 'Marked as Signal' : 'Mark as Signal'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach accordion event listeners
  attachAccordionListeners();
}

function attachAccordionListeners() {
  // Toggle expand/collapse
  accordionContainer.querySelectorAll('.accordion-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const header = btn.closest('.accordion-header');
      const item = btn.closest('.accordion-item');
      const content = item.querySelector('.accordion-content');
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';

      btn.setAttribute('aria-expanded', !isExpanded);
      content.hidden = isExpanded;
      item.classList.toggle('is-expanded', !isExpanded);
    });
  });

  // Delete buttons
  accordionContainer.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.closest('.accordion-item').dataset.id;
      handleDeleteSignal(id);
    });
  });

  // Mark buttons
  accordionContainer.querySelectorAll('.mark-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.accordion-item').dataset.id;
      handleToggleMark(id);
    });
  });
}

// ============================================================
// EMPTY STATE
// ============================================================

function updateEmptyState() {
  const hasSignals = signals.length > 0;
  emptyState.hidden = hasSignals;
  accordionContainer.hidden = !hasSignals;

  // Disable action buttons when no signals
  copyAllSignalsBtn.disabled = !hasSignals;
  downloadSignalsBtn.disabled = !hasSignals;
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `oia-toast oia-toast--${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toast.classList.add('oia-toast--dismiss');
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

// ============================================================
// UTILITIES
// ============================================================

function truncateText(text, maxLength) {
  // Get first line or truncate
  const firstLine = text.split('\n')[0];
  if (firstLine.length <= maxLength) return firstLine;
  return firstLine.substring(0, maxLength - 3) + '...';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
