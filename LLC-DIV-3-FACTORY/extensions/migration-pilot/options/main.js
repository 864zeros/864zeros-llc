// ============================================================
// OPTIONS — [864F] MigrationPilot
// 864zeros LLC | OIA pillar | v1.0.0
// Wires the Settings page: theme selector + count + Clear-all DB action.
// ============================================================

import { getAllCaptures, clearAll, countCaptures } from '../lib/db.js';

const $ = (sel) => document.querySelector(sel);

// --- Theme (per GTM_MANIFEST §8) ---
async function loadAndApplyTheme() {
  try {
    const result = await chrome.storage.local.get('theme');
    const theme = result.theme || 'auto';
    applyTheme(theme);
    const sel = $('#theme-selector');
    if (sel) sel.value = theme;
  } catch (e) { /* storage unavailable; fall back to auto */ }
}

function applyTheme(theme) {
  if (theme === 'auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

async function onThemeChange(e) {
  const theme = e.target.value;
  await chrome.storage.local.set({ theme });
  applyTheme(theme);
  // chrome.storage.onChanged broadcasts to other surfaces (sidepanel) automatically.
}

// React to theme changes from any extension surface
if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.theme) {
      applyTheme(changes.theme.newValue || 'auto');
      const sel = $('#theme-selector');
      if (sel) sel.value = changes.theme.newValue || 'auto';
    }
  });
}
loadAndApplyTheme();

// --- Dopamine-Friendly info-popover (per GTM_MANIFEST §3) ---
function toggleDopaminePopover(force) {
  const trigger = $('#dopamine-info-trigger');
  const popover = $('#dopamine-info-popover');
  if (!trigger || !popover) return;
  const willShow = force !== undefined ? force : popover.hidden;
  popover.hidden = !willShow;
  trigger.setAttribute('aria-expanded', String(willShow));
}

function setupDopamineInfo() {
  const trigger = $('#dopamine-info-trigger');
  const closer = $('#dopamine-info-close');
  const popover = $('#dopamine-info-popover');
  if (!trigger || !popover) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDopaminePopover();
  });
  if (closer) {
    closer.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDopaminePopover(false);
    });
  }
  document.addEventListener('click', (e) => {
    if (popover.hidden) return;
    if (popover.contains(e.target) || trigger.contains(e.target)) return;
    toggleDopaminePopover(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !popover.hidden) toggleDopaminePopover(false);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadAndApplyTheme();
  await refreshCount();
  $('#btn-clear-db').addEventListener('click', onClearClicked);
  $('#theme-selector').addEventListener('change', onThemeChange);
  setupDopamineInfo();

  // If a capture is added/removed elsewhere, keep the count fresh.
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message && (message.type === 'CAPTURE_ADDED' || message.type === 'CAPTURE_REMOVED' || message.type === 'CAPTURES_CLEARED')) {
        refreshCount();
      }
    });
  }
});

async function refreshCount() {
  try {
    const n = await countCaptures();
    $('#data-count').textContent = String(n);
    $('#btn-clear-db').disabled = n === 0;
  } catch (e) {
    $('#data-count').textContent = '?';
    console.warn('[MigrationPilot Options] count failed:', e);
  }
}

// Two-tap confirm pattern — no modal, no alert(), no "are you sure?" spam.
// First tap arms; second tap within 4s confirms. Click anywhere else cancels.
let armedTimer = null;
function onClearClicked() {
  const button = $('#btn-clear-db');
  const hint = $('#clear-hint');

  if (button.dataset.armed === 'true') {
    cancelArm();
    executeClear();
    return;
  }

  button.dataset.armed = 'true';
  button.textContent = 'Tap again to confirm';
  button.classList.add('data-actions__danger--armed');
  hint.textContent = 'Click again within 4 seconds, or anywhere else to cancel.';

  armedTimer = setTimeout(cancelArm, 4000);

  // Cancel if user clicks somewhere else
  setTimeout(() => {
    document.addEventListener('click', cancelArmOnOutsideClick, { once: true, capture: true });
  }, 0);
}

function cancelArmOnOutsideClick(e) {
  if (e.target.id === 'btn-clear-db') return; // re-arm path handled above
  cancelArm();
}

function cancelArm() {
  const button = $('#btn-clear-db');
  const hint = $('#clear-hint');
  if (armedTimer) { clearTimeout(armedTimer); armedTimer = null; }
  button.dataset.armed = 'false';
  button.textContent = 'Clear all captures';
  button.classList.remove('data-actions__danger--armed');
  hint.textContent = 'Permanent. There is no undo.';
  document.removeEventListener('click', cancelArmOnOutsideClick, true);
}

async function executeClear() {
  const button = $('#btn-clear-db');
  button.disabled = true;
  try {
    await clearAll();
    // Tell other extension surfaces (sidepanel) to re-render
    chrome.runtime.sendMessage({ type: 'CAPTURES_CLEARED' }).catch(() => {});
    // Reset toolbar badge
    if (chrome.action && chrome.action.setBadgeText) {
      chrome.action.setBadgeText({ text: '' });
    }
    showToast('All captures cleared');
    await refreshCount();
  } catch (e) {
    showToast('That didn’t work — try again?', 'error');
    console.warn('[MigrationPilot Options] clear failed:', e);
  } finally {
    button.disabled = false;
  }
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
