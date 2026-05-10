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
 * Reference impl: 864z-chronical/options/options.js (Strike 013); the inline
 *   <script type="module"> patterns in Strikes 016/017/018/019/021 were extracted
 *   here in Strike 022 (fleet-wide consolidation; eliminates 11-extension
 *   code duplication).
 *
 * Update protocol (canonical): edit this file, then re-sync per-extension
 * lib/options-tier-init.js copies in the next compliance migration sprint.
 */

import { getTier, setTier, TIER_FREE, TIER_VAULT } from './tier.js';

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

renderTier();
initDevOverride();
