/**
 * Options Page Tier-Init Helper (864zeros canonical)
 *
 * Canonical:        864z-build-kit/references/core/options-tier-init.js
 * Per-extension:    extensions/{ext}/lib/options-tier-init.js
 *
 * Wires three behaviors on every Tier-0.5-aware options page:
 *   1. renderTier()        — reads tier from chrome.storage.local (via lib/tier.js),
 *                            toggles vault-tier-card.tier-card--locked ↔ --unlocked,
 *                            updates current-tier-name + vault-lock-watermark
 *   2. initDevOverride()   — URL-gated by ?dev=1; reveals #dev-override-panel and
 *                            wires Force-tier-{vault,free} buttons
 *   3. refreshDevTierLabel() — keeps the dev panel's tier label in sync
 *
 * Design contract for the host options.html:
 *   - imports `tier.js` from same lib/ directory (relative path './tier.js')
 *   - DOM elements with these IDs are optional (defensive null-checks throughout):
 *       #current-tier-name      — text element receiving "Tier-0.5: Vault" / "Free"
 *       #vault-tier-card        — element whose tier-card--locked/unlocked classes toggle
 *       #vault-lock-watermark   — text element receiving "LOCKED" / "UNLOCKED" + sage color
 *       #dev-override-panel     — section with .hidden class to be removed on ?dev=1
 *       #dev-current-tier       — text element showing current tier in dev panel
 *       #dev-force-vault        — button to setTier(TIER_VAULT)
 *       #dev-force-free         — button to setTier(TIER_FREE)
 *
 * Compliance:
 *   - RULE-007: tier flag is in chrome.storage.local only (per lib/tier.js)
 *   - Dev override is URL-gated only — no localStorage flag, no magic header,
 *     no hidden activation. Documented in source. Not a backdoor.
 *
 * Reference impl: 864z-chronicle/options/options.js (Strike 013); the inline
 *   <script type="module"> patterns in Strikes 016/017/018/019/021 were extracted
 *   here in Strike 022 (fleet-wide consolidation; eliminates 11-extension
 *   code duplication).
 *
 * Update protocol (canonical): edit this file, then re-sync per-extension
 * lib/options-tier-init.js copies in the next compliance migration sprint.
 */

import { getTier, setTier, TIER_FREE, TIER_VAULT } from './tier.js';
import { BRAND_MISSION } from './brand-identity.js';

async function renderTier() {
  const tier = await getTier();
  const isUnlocked = tier === TIER_VAULT;
  const nameEl = document.getElementById('current-tier-name');
  if (nameEl) nameEl.textContent = isUnlocked ? 'Tier-0.5: Vault' : 'Free';
  const card = document.getElementById('vault-tier-card');
  if (card) {
    card.classList.toggle('tier-card--locked', !isUnlocked);
    card.classList.toggle('tier-card--unlocked', isUnlocked);
  }
  const watermark = document.getElementById('vault-lock-watermark');
  if (watermark) {
    watermark.textContent = isUnlocked ? 'UNLOCKED' : 'LOCKED';
    watermark.style.color = isUnlocked ? 'var(--oia-sage, #8BA888)' : '';
  }
}

function initDevOverride() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('dev') !== '1') return;
  const panel = document.getElementById('dev-override-panel');
  if (!panel) return;
  panel.classList.remove('hidden');
  refreshDevTierLabel();

  const vaultBtn = document.getElementById('dev-force-vault');
  if (vaultBtn) {
    vaultBtn.addEventListener('click', async () => {
      await setTier(TIER_VAULT);
      await renderTier();
      await refreshDevTierLabel();
    });
  }

  const freeBtn = document.getElementById('dev-force-free');
  if (freeBtn) {
    freeBtn.addEventListener('click', async () => {
      await setTier(TIER_FREE);
      await renderTier();
      await refreshDevTierLabel();
    });
  }
}

async function refreshDevTierLabel() {
  const el = document.getElementById('dev-current-tier');
  if (el) el.textContent = await getTier();
}

// Strike 025: cross-surface BRAND_MISSION injection. Idempotent + defensive —
// host options.html may include `<div id="brand-mission" class="brand-text">`
// to receive the founder-voice mission copy; pages without that element no-op.
function injectBrandMission() {
  const el = document.getElementById('brand-mission');
  if (el) el.textContent = BRAND_MISSION;
}

// Strike 027: ExtPay-as-source-of-truth fail-safe sync. Best-effort poll of
// extpay.getUser() (via the per-extension wrapper) on page load + window focus
// — catches the case where ExtPay's onPaid callback didn't fire (SW evicted,
// network glitch, transient race). Dynamic import lets the 11 extensions
// without an extpay-wrapper.js gracefully no-op. Upgrade-only this strike;
// downgrade (refund handling) is a separate concern per blueprint §V FM4.
async function tryExtPaySync() {
  let mod;
  try {
    mod = await import('./payments/extpay-wrapper.js');
  } catch {
    return; // wrapper not present for this extension (yet); silent skip
  }
  if (typeof mod.getCurrentTier !== 'function') return;
  try {
    const remoteTier = await mod.getCurrentTier();
    if (remoteTier !== TIER_VAULT) return; // free remote → nothing to upgrade
    const localTier = await getTier();
    if (localTier === TIER_VAULT) return; // already vault locally → no-op
    await setTier(TIER_VAULT);
    console.log('[options-tier-init] Strike-027 fail-safe: upgraded local tier to vault per ExtPay getUser()');
    // Direct re-render in addition to any storage.onChanged listeners.
    renderTier();
    refreshDevTierLabel();
  } catch (err) {
    console.warn('[options-tier-init] Strike-027 fail-safe sync failed (non-fatal):', err);
  }
}

// Strike 029: Trust Vault UI fleet rollout. Renders operator-mandated header +
// status label + Export/Import buttons + Privacy Guarantee block into any
// element with id="trust-vault-root". Buttons dynamically import ./trust-vault.js
// (graceful no-op for extensions without it). Default behavior: chrome.storage.local
// dump/restore. Idempotent via root.dataset.injected.
function injectTrustVaultUI() {
  const root = document.getElementById('trust-vault-root');
  if (!root) return;
  if (root.dataset.injected === '029') return;
  root.dataset.injected = '029';

  // Extract app name from manifest, stripping the [PILLAR] prefix per RULE-006 v1.1.
  let appName = 'App';
  try {
    const raw = chrome.runtime.getManifest().name;
    appName = raw.replace(/^\[[^\]]+\]\s*/, '').trim() || raw;
  } catch { /* manifest unavailable; fall back to default */ }

  // Operator-verbatim text (Strike 029 Task 2 + Task 3) — all four labels +
  // Privacy Guarantee block. The **bold** marker on "Your Privacy Guarantee:"
  // is rendered as <strong>; remaining text preserved exactly.
  root.innerHTML = `
    <section class="oia-card trust-vault" data-strike="029">
      <h2 class="oia-h2">864zeros Trust Vault</h2>
      <p class="oia-body-sm">Privacy Status: Local-Only (No Data Stored by 864zeros)</p>
      <div class="trust-vault__actions" style="display:flex; gap:.5rem; flex-wrap:wrap; margin:.75rem 0;">
        <button class="oia-btn oia-btn-primary" id="trust-vault-export-btn">Export Data Backup</button>
        <button class="oia-btn oia-btn-secondary" id="trust-vault-import-btn">Import Data Backup</button>
      </div>
      <p class="oia-body-sm trust-vault__guarantee"><strong>Your Privacy Guarantee:</strong> 1. Total Privacy: We never store, see, or monitor your data. 2. Sovereign Custody: Records stay in your Local File System. 3. Local Protection: Moving files to Cloud/Email services voids this guarantee. You own the keys. You own the data. You own the vault.</p>
    </section>
  `;

  let vaultMod = null;
  async function loadVault() {
    if (vaultMod) return vaultMod;
    try {
      vaultMod = await import('./trust-vault.js');
      return vaultMod;
    } catch {
      return null;
    }
  }

  document.getElementById('trust-vault-export-btn')?.addEventListener('click', async () => {
    const mod = await loadVault();
    if (!mod?.exportVault) {
      alert('Trust Vault library not installed for this extension.');
      return;
    }
    try {
      const data = await chrome.storage.local.get(null);
      mod.exportVault(appName, data);
    } catch (err) {
      console.error('[trust-vault] Export failed:', err);
      alert('Export failed: ' + (err?.message || 'Unknown error'));
    }
  });

  document.getElementById('trust-vault-import-btn')?.addEventListener('click', async () => {
    const mod = await loadVault();
    if (!mod?.importVault) {
      alert('Trust Vault library not installed for this extension.');
      return;
    }
    try {
      // importVault() shows the operator-mandated alert() warning internally
      // (Strike 028), then opens the file picker. Resolves to null if user cancels.
      const data = await mod.importVault();
      if (!data) return;
      // OVERWRITE semantics per the import warning text: clear, then set.
      await chrome.storage.local.clear();
      await chrome.storage.local.set(data);
      // Re-render any UI dependent on storage (tier, dev label, brand mission).
      renderTier();
      refreshDevTierLabel();
      injectBrandMission();
    } catch (err) {
      console.error('[trust-vault] Import failed:', err);
      alert('Import failed: ' + (err?.message || 'Unknown error'));
    }
  });
}

renderTier();
initDevOverride();
injectBrandMission();
injectTrustVaultUI();
tryExtPaySync();

// Strike 024: re-render the canonical 3 tier-card elements when the SW broadcasts
// a tier change (e.g., after ExtPay onPaid() webhook fires + service-worker calls
// setTier(TIER_VAULT) + sends TIER_UNLOCKED). Per-extension code can layer
// additional listeners (chrome.storage.onChanged, etc.) for extension-specific
// extras like description text or feature-toggle state.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'TIER_UNLOCKED' || msg?.type === 'TIER_DOWNGRADED') {
    renderTier();
    refreshDevTierLabel();
  }
});

// Strike 026: force a tier-check whenever the options window regains focus.
// Covers the "user paid in ExtPay tab → manually switched back to options tab"
// flow where the runtime.sendMessage may have already fired (and missed) before
// the user clicks back to this tab. chrome.storage.onChanged also covers this
// when setTier writes — focus is the belt-and-suspenders for cases where the
// storage change has already propagated but the UI didn't re-render (e.g.,
// page was loaded BEFORE the storage write).
window.addEventListener('focus', () => {
  renderTier();
  refreshDevTierLabel();
  // Strike 027: also re-poll ExtPay on focus — covers the "user paid in
  // Stripe checkout tab + switched back" flow where the runtime broadcast
  // may have already fired (and missed) before the user returned.
  tryExtPaySync();
});
