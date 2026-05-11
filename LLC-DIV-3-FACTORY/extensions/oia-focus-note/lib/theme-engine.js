/**
 * 864zeros Theme Engine (Strike 033)
 *
 * Canonical:        864z-build-kit/references/core/theme-engine.js
 * Per-extension:    extensions/{ext}/lib/theme-engine.js
 *
 * Three-state theme system: 'dark' / 'light' / 'system'.
 * - Persistence: chrome.storage.local key '864z_user_theme'.
 * - Effective theme: when stored value is 'system', resolves via
 *   window.matchMedia('(prefers-color-scheme: dark)') and reacts to changes.
 * - Application: sets `data-theme="dark"|"light"` attribute on <html>.
 *   FOUC-safe: applied during head-time parsing BEFORE DOMContentLoaded.
 * - UI: updates `#theme-toggle` text to "Theme: Dark|Light|System".
 *
 * Loaded as a CLASSIC script (no `type="module"`) from <head> via:
 *   <script src="../lib/theme-engine.js"></script>
 * (chrome.* APIs are available immediately in extension pages.)
 *
 * Runtime context: requires DOM (document, window.matchMedia). Safe in
 * options/panel/popup. NOT safe in service worker.
 *
 * Cycle function exposed on window for external triggers:
 *   window.__864zCycleTheme() → Promise<void>
 */

(function () {
  'use strict';

  const STORAGE_KEY = '864z_user_theme';
  const STATES = ['dark', 'light', 'system'];

  function resolveEffective(mode) {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  }

  function applyThemeToHtml(mode) {
    const effective = resolveEffective(mode);
    document.documentElement.setAttribute('data-theme', effective);
  }

  function updateToggleLabel(mode) {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      const label = mode.charAt(0).toUpperCase() + mode.slice(1);
      toggle.textContent = `Theme: ${label}`;
    }
  }

  async function getStoredMode() {
    try {
      const got = await chrome.storage.local.get(STORAGE_KEY);
      const mode = got[STORAGE_KEY];
      return STATES.includes(mode) ? mode : 'system';
    } catch {
      return 'system';
    }
  }

  async function setStoredMode(mode) {
    await chrome.storage.local.set({ [STORAGE_KEY]: mode });
  }

  async function cycleTheme() {
    const current = await getStoredMode();
    const next = STATES[(STATES.indexOf(current) + 1) % STATES.length];
    await setStoredMode(next);
    applyThemeToHtml(next);
    updateToggleLabel(next);
  }

  // FOUC-safe early apply: set data-theme on <html> as soon as we can read
  // the stored mode. Runs at head-time; <html> exists; document.body may not.
  const earlyApply = getStoredMode().then(mode => {
    applyThemeToHtml(mode);
    return mode;
  });

  function attachUI(initialMode) {
    updateToggleLabel(initialMode);

    // React to OS color-scheme changes while in 'system' mode.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = async () => {
      const current = await getStoredMode();
      if (current === 'system') applyThemeToHtml('system');
    };
    // addEventListener is the modern API; addListener is the legacy fallback.
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        cycleTheme();
      });
    }
  }

  // Wait for DOM ready, then wire the toggle UI.
  earlyApply.then(initialMode => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => attachUI(initialMode));
    } else {
      attachUI(initialMode);
    }
  });

  // Expose cycleTheme on window so callers can trigger from anywhere.
  window.__864zCycleTheme = cycleTheme;
})();
