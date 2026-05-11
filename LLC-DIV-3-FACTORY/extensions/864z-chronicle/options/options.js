/**
 * Chronicle Options Page
 *
 * RULE-001 compliant: Cog-triggered options_ui with mandatory sections
 *   How to Use, Subscription & Tiers, Data Management.
 *
 * RULE-005 compliant: destructive Clear All uses two-tap arm pattern
 *   (4-second window, label + color shift, no alert/confirm/prompt).
 *
 * RULE-006 v1.1 compliant: brand-prefix pill in hero AND in manifest.json
 *   `name` field ([OIA] Chronicle).
 *
 * RULE-007 compliant: tier flag stored in chrome.storage.local only;
 *   "Unlock Vault" button currently sets the flag locally (Strike 013
 *   stub — real ExtPay/Stripe integration deferred per blueprint §VII.1).
 */

import { getTier, setTier, isVaultUnlocked, TIER_FREE, TIER_VAULT } from '../lib/tier.js';
import { initPayments, openPaymentPage } from '../lib/payments/extpay-wrapper.js';

(async function init() {
  await Promise.all([
    loadProviderSettings(),
    renderTierUI(),
    loadDataStats(),
  ]);
  bindEvents();
  // Strike 024: initDevOverride() removed — handled by shared lib/options-tier-init.js
  // (script tag in options.html). Tier-rendering on tier-flag changes is wired
  // via chrome.runtime.onMessage + chrome.storage.onChanged listeners at the
  // bottom of this file.
})();

// ============================================================
// Provider toggles (General Settings)
// ============================================================

async function loadProviderSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  const providers = ['gemini', 'claude', 'chatgpt', 'copilot'];
  for (const p of providers) {
    const el = document.getElementById('setting-' + p);
    if (!el) continue;
    el.checked = settings[p + 'Enabled'] !== false;
    el.addEventListener('change', saveProviderSettings);
  }
}

async function saveProviderSettings() {
  const settings = {
    geminiEnabled:  document.getElementById('setting-gemini').checked,
    claudeEnabled:  document.getElementById('setting-claude').checked,
    chatgptEnabled: document.getElementById('setting-chatgpt').checked,
    copilotEnabled: document.getElementById('setting-copilot').checked,
  };
  await chrome.storage.local.set({ settings });
  toast('Provider settings saved');
}

// ============================================================
// Tier UI (Subscription & Tiers + Data Management gating)
// ============================================================

async function renderTierUI() {
  const tier = await getTier();
  const isUnlocked = tier === TIER_VAULT;

  // Current tier badge
  document.getElementById('current-tier-name').textContent = isUnlocked ? 'Tier-0.5: Vault' : 'Free';
  document.getElementById('current-tier-description').textContent = isUnlocked
    ? 'All Free features PLUS Markdown-vault-folder export, bulk export by filter, and scheduled snapshots. Local-first; never leaves your device.'
    : 'Capture from 4 AI providers · Per-entry Markdown export · Full-vault JSON export · Search · Star · Filter · Local-first storage; never leaves your device.';

  // Vault tier card visual state
  const card = document.getElementById('vault-tier-card');
  const watermark = document.getElementById('vault-lock-watermark');
  const unlockBtn = document.getElementById('unlock-vault-btn');
  if (isUnlocked) {
    card.classList.remove('tier-card--locked');
    card.classList.add('tier-card--unlocked');
    watermark.textContent = 'UNLOCKED';
    watermark.style.color = 'var(--oia-sage)';
    unlockBtn.style.display = 'none';
  } else {
    card.classList.add('tier-card--locked');
    card.classList.remove('tier-card--unlocked');
    watermark.textContent = 'LOCKED';
    watermark.style.color = '';
    unlockBtn.style.display = '';
  }

  // Markdown export button
  const mdBtn = document.getElementById('liberate-md-btn');
  const mdLabel = document.getElementById('liberate-md-label');
  if (isUnlocked) {
    mdBtn.disabled = false;
    mdBtn.classList.remove('data-action--locked');
    mdLabel.textContent = '✓ Liberate Vault as Markdown';
  } else {
    mdBtn.disabled = true;
    mdBtn.classList.add('data-action--locked');
    mdLabel.textContent = '⊘ Liberate Vault as Markdown — Tier-0.5';
  }
}

// ============================================================
// Data inventory (vault stats)
// ============================================================

async function loadDataStats() {
  try {
    const { entries = [] } = await chrome.runtime.sendMessage({ type: 'GET_ENTRIES', options: { limit: 10000 } });
    const totalMessages = entries.reduce((sum, e) => sum + (e.messageCount || 0), 0);
    const statsEl = document.getElementById('data-stats');
    statsEl.innerHTML = `
      <span class="data-stats__main">${entries.length} entries · ${totalMessages} messages</span>
      <span class="data-stats__detail">Stored locally on this device only.</span>
    `;
  } catch (err) {
    console.error('[Chronicle Options] Failed to load stats:', err);
    document.getElementById('data-stats').innerHTML = '<span class="oia-caption">Could not load vault inventory</span>';
  }
}

// ============================================================
// Event wiring
// ============================================================

function bindEvents() {
  document.getElementById('unlock-vault-btn').addEventListener('click', onUnlockVault);
  document.getElementById('liberate-json-btn').addEventListener('click', onLiberateJson);
  document.getElementById('liberate-md-btn').addEventListener('click', onLiberateMarkdown);
  document.getElementById('fuel-btn').addEventListener('click', onFuel);

  // RULE-005 two-tap arm pattern for Clear All
  armDestructiveButton({
    button: document.getElementById('clear-all-btn'),
    hintEl: document.getElementById('clear-all-hint'),
    onConfirm: onClearAll,
    defaultLabel: 'Clear all captures',
    armedLabel: 'Tap again to confirm — this cannot be undone',
    defaultHint: 'Permanently deletes every entry and exchange from this device. This cannot be undone.',
    armedHint: 'Tap the button again within 4 seconds to commit. Click anywhere else (or wait) to cancel.',
    timeoutMs: 4000,
  });
}

// ============================================================
// Tier-0.5 unlock flow (Strike 024 — real ExtPay checkout)
// ============================================================

async function onUnlockVault() {
  // Strike 024: opens ExtPay's checkout page. ExtPay handles the Stripe
  // checkout in a new tab; on payment success, the SW's onPaid() handler
  // (service-worker.js Strike-024 block) calls setTier(TIER_VAULT) and
  // broadcasts TIER_UNLOCKED, which fires the listener at the bottom of
  // this file to re-render the tier card.
  //
  // No two-tap arm here: ExtPay's checkout page IS the confirmation gate
  // (user explicitly clicks Pay $2.99 on Stripe's UI).
  //
  // Strike 026 Task 3 (storage-passed tab ID variant): record this options
  // tab's ID to chrome.storage.local BEFORE opening checkout. The SW reads
  // it on payment success + calls chrome.tabs.update(id, {active: true}) to
  // refocus this tab. No 'tabs' permission needed (we use chrome.tabs.update
  // with a known ID; we never query by URL). The key is cleared after focus.
  try {
    // Capture this tab's ID (defensive: getCurrent may return undefined for
    // some contexts; if so, skip the redirect — focus listener will pick up).
    const myTab = await new Promise(resolve => chrome.tabs.getCurrent(resolve));
    if (myTab?.id !== undefined) {
      await chrome.storage.local.set({ paymentReturnTabId: myTab.id });
    }

    initPayments();
    openPaymentPage();
    toast('Opening checkout… complete payment to unlock the Vault.');
  } catch (err) {
    console.error('[Chronicle Options] Unlock failed:', err);
    toast('Could not open checkout. Try again, or contact support.');
  }
}

// ============================================================
// Liberation flows (Free + Tier-0.5)
// ============================================================

async function onLiberateJson() {
  try {
    const { entries = [] } = await chrome.runtime.sendMessage({ type: 'GET_ENTRIES', options: { limit: 10000 } });
    if (entries.length === 0) {
      toast('Your vault is empty — nothing to liberate.');
      return;
    }
    toast(`Building JSON export of ${entries.length} entries…`);

    // Hydrate every entry with its exchanges
    const fullData = [];
    for (const entry of entries) {
      const detail = await chrome.runtime.sendMessage({ type: 'GET_ENTRY', id: entry.id });
      fullData.push({
        ...entry,
        exchanges: detail.exchanges || [],
      });
    }

    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronicle-vault-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast(`Vault liberated. ${entries.length} entries written to your Downloads folder.`);
  } catch (err) {
    console.error('[Chronicle Options] JSON liberation failed:', err);
    toast('Liberation failed — see console for details.');
  }
}

async function onLiberateMarkdown() {
  if (!(await isVaultUnlocked())) {
    toast('Tier-0.5 required. Unlock Vault to enable Markdown-folder export.');
    return;
  }
  try {
    const { entries = [] } = await chrome.runtime.sendMessage({ type: 'GET_ENTRIES', options: { limit: 10000 } });
    if (entries.length === 0) {
      toast('Your vault is empty — nothing to liberate.');
      return;
    }
    toast(`Building Markdown vault of ${entries.length} conversations… (this may take a moment)`);

    // Build one .md per conversation, organized by scribe
    let written = 0;
    for (const entry of entries) {
      const detail = await chrome.runtime.sendMessage({ type: 'GET_ENTRY', id: entry.id });
      const md = buildConversationMarkdown(entry, detail.exchanges || []);
      const filename = mdFilename(entry);

      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      written++;

      // Yield to the browser between writes so the click chain doesn't
      // get rate-limited; small extensions / large vaults benefit.
      await new Promise(r => setTimeout(r, 60));
    }

    toast(`Vault liberated. ${written} Markdown files written to your Downloads folder.`);
  } catch (err) {
    console.error('[Chronicle Options] Markdown liberation failed:', err);
    toast('Liberation failed — see console for details.');
  }
}

function buildConversationMarkdown(entry, exchanges) {
  const date = new Date(entry.recordedAt);
  const scribeName = {
    gemini: 'Google Gemini',
    claude: 'Anthropic Claude',
    chatgpt: 'OpenAI ChatGPT',
    copilot: 'Microsoft Copilot',
  }[entry.scribe] || entry.scribe;

  const conv = exchanges.map(ex => {
    const role = ex.role === 'user' ? '**User**' : '**Assistant**';
    return `### ${role}\n\n${ex.content}`;
  }).join('\n\n---\n\n');

  return `---
title: ${JSON.stringify(entry.title || 'Conversation')}
scribe: ${entry.scribe}
scribe_name: ${JSON.stringify(scribeName)}
recorded_at: ${entry.recordedAt}
message_count: ${exchanges.length}
source_url: ${JSON.stringify(entry.metadata?.url || '')}
starred: ${!!entry.starred}
exported_by: chronicle
exported_at: ${new Date().toISOString()}
---

# ${entry.title || 'Conversation'}

**Source:** ${scribeName}
**Recorded:** ${date.toISOString()}
**Messages:** ${exchanges.length}

---

## Conversation

${conv}

---

*Exported from Chronicle by 864zeros (Tier-0.5 Vault).*
`;
}

function mdFilename(entry) {
  const date = new Date(entry.recordedAt).toISOString().split('T')[0];
  const safeTitle = (entry.title || 'conversation')
    .slice(0, 40)
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    || 'conversation';
  // Chrome's downloads.download supports subdirectories via filename; we
  // use the same hierarchy for the in-tab a.click() pattern so users with
  // a folder-aware download manager get a clean tree. Browsers without
  // that support fall back to flat filenames, which is still useful.
  return `chronicle/${entry.scribe}/${date}-${safeTitle}.md`;
}

// ============================================================
// Destructive: Clear all
// ============================================================

async function onClearAll() {
  try {
    await chrome.runtime.sendMessage({ type: 'CLEAR_ALL' });
    toast('All captures cleared. Vault is empty.');
    await loadDataStats();
  } catch (err) {
    console.error('[Chronicle Options] Clear All failed:', err);
    toast('Clear failed — see console for details.');
  }
}

// ============================================================
// Two-tap arm pattern (RULE-005 / BRK-UI-003)
// Local implementation — Chronicle does not yet vendor the build-kit
// brick (would be a Strike 013 follow-up to align with build-kit copy).
// ============================================================

function armDestructiveButton({ button, hintEl, onConfirm, defaultLabel, armedLabel, defaultHint, armedHint, timeoutMs = 4000 }) {
  let armTimer = null;
  let outsideClickHandler = null;

  function disarm() {
    button.dataset.armed = 'false';
    button.textContent = defaultLabel;
    if (hintEl) hintEl.textContent = defaultHint;
    if (armTimer) { clearTimeout(armTimer); armTimer = null; }
    if (outsideClickHandler) {
      document.removeEventListener('click', outsideClickHandler, true);
      outsideClickHandler = null;
    }
  }

  button.dataset.armed = 'false';
  button.textContent = defaultLabel;
  if (hintEl) hintEl.textContent = defaultHint;

  button.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (button.dataset.armed === 'true') {
      // Second tap — commit
      disarm();
      try { await onConfirm(); } catch (err) { console.error('Destructive action failed:', err); }
      return;
    }
    // First tap — arm
    button.dataset.armed = 'true';
    button.textContent = armedLabel;
    if (hintEl) hintEl.textContent = armedHint;
    armTimer = setTimeout(disarm, timeoutMs);
    // Outside-click cancels silently
    outsideClickHandler = (ev) => {
      if (ev.target !== button && !button.contains(ev.target)) disarm();
    };
    setTimeout(() => document.addEventListener('click', outsideClickHandler, true), 0);
  });

  return { disarm };
}

// ============================================================
// Fuel
// ============================================================

function onFuel() {
  // Placeholder — open whatever tipping URL the operator chooses
  toast('Coming soon — thank you for your support.');
}

// ============================================================
// Tier-flag change listeners (Strike 024)
//
// The shared lib/options-tier-init.js (loaded via script tag in options.html)
// handles the canonical 3 tier-card elements (current-tier-name, vault-tier-card
// classList, vault-lock-watermark) AND the URL-gated dev-override panel. These
// listeners pick up the chronicle-specific extras: current-tier-description text
// + liberate-md-btn enabled state.
//
// Two signals are observed for safety:
//   - chrome.runtime.onMessage TIER_UNLOCKED / TIER_DOWNGRADED — fired by SW
//     onPaid() callback after ExtPay confirms a payment (real checkout flow)
//   - chrome.storage.onChanged tier — fired by ANY setTier() write, including
//     the shared dev-override panel's Force-tier-{vault,free} buttons
// ============================================================

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'TIER_UNLOCKED') {
    renderTierUI();
    // Strike 026: visible payment-success confirmation. The SW already
    // logged + persisted; this is the user-facing acknowledgement.
    toast('Payment Successful! Vault unlocked.', 5000);
  } else if (msg?.type === 'TIER_DOWNGRADED') {
    renderTierUI();
    toast('Vault locked — payment status changed.', 5000);
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.tier) renderTierUI();
});

// ============================================================
// Toast utility
// ============================================================

let toastTimer = null;
function toast(message, ms = 3000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), ms);
}
