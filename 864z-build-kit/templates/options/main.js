// ============================================================
// OPTIONS — Canonical (RULE-001 Command & Control Standard)
// 864zeros LLC | OIA pillar
// Authority: BUILD_KIT_RULES.md → RULE-001
// ============================================================
//
// IMPORT REQUIREMENT
// ------------------
// This template assumes the host extension exposes the following
// async functions from `../lib/db.js` (or equivalent):
//   - countAll() : Promise<number>
//   - clearAll() : Promise<void>
//
// If your DB module names them differently (e.g., countCaptures /
// clearAll for MigrationPilot), update the imports below.
//
// MESSAGE BROADCAST CONTRACT
// --------------------------
// On Clear-all success, this module emits a runtime broadcast that
// other extension surfaces (sidepanel, content script) can subscribe
// to via chrome.runtime.onMessage:
//   { type: 'CAPTURES_CLEARED' }
// (rename per your domain — e.g., 'CLIPS_CLEARED', 'NOTES_CLEARED'.)
// ============================================================

import { countAll, clearAll } from '../lib/db.js';

const $ = (sel) => document.querySelector(sel);

document.addEventListener('DOMContentLoaded', async () => {
  await refreshCount();
  $('#btn-clear-db').addEventListener('click', onClearClicked);

  // Live-refresh count when other surfaces add/remove records.
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message && (
        message.type === 'CAPTURE_ADDED' ||
        message.type === 'CAPTURE_REMOVED' ||
        message.type === 'CAPTURES_CLEARED'
      )) {
        refreshCount();
      }
    });
  }
});

async function refreshCount() {
  try {
    const n = await countAll();
    $('#data-count').textContent = String(n);
    $('#btn-clear-db').disabled = n === 0;
  } catch (e) {
    $('#data-count').textContent = '?';
    console.warn('[Options] count failed:', e);
  }
}

// Two-tap confirm pattern — RULE-001-aligned.
// Per CLAUDE-base.md copy rules: NEVER alert(), NEVER "are you sure?".
// Pattern: first tap arms (visible state change); second tap within
// 4s confirms; clicking elsewhere cancels.
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
  setTimeout(() => {
    document.addEventListener('click', cancelArmOnOutsideClick, { once: true, capture: true });
  }, 0);
}

function cancelArmOnOutsideClick(e) {
  if (e.target.id === 'btn-clear-db') return;
  cancelArm();
}

function cancelArm() {
  const button = $('#btn-clear-db');
  const hint = $('#clear-hint');
  if (armedTimer) { clearTimeout(armedTimer); armedTimer = null; }
  button.dataset.armed = 'false';
  button.textContent = 'Clear all __DATA_NOUN__';
  button.classList.remove('data-actions__danger--armed');
  hint.textContent = 'Permanent. There is no undo.';
  document.removeEventListener('click', cancelArmOnOutsideClick, true);
}

async function executeClear() {
  const button = $('#btn-clear-db');
  button.disabled = true;
  try {
    await clearAll();
    // Tell other extension surfaces (sidepanel) to re-render.
    chrome.runtime.sendMessage({ type: 'CAPTURES_CLEARED' }).catch(() => {});
    // Reset toolbar badge.
    if (chrome.action && chrome.action.setBadgeText) {
      chrome.action.setBadgeText({ text: '' });
    }
    showToast('All __DATA_NOUN__ cleared');
    await refreshCount();
  } catch (e) {
    showToast('That didn’t work — try again?', 'error');
    console.warn('[Options] clear failed:', e);
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
