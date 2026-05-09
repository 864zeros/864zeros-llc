// ============================================================
// PANEL HEADER COMPONENT — 864zeros canonical (RULE-001)
// ============================================================
//
// Authority:        BUILD_KIT_RULES.md → RULE-001
// Origin:           extracted from MigrationPilot (Strike 011)
// Effective:        2026-05-08
// Authored:         Principal Architect
//
// PURPOSE
// -------
// Mounts the canonical 864zeros side-panel header into a host
// element: title block on the left, Cog icon on the right.
// Cog click opens chrome.runtime.openOptionsPage() unless the
// caller overrides it.
//
// USAGE
// -----
//   <header class="panel-header"></header>
//   ...
//   <script type="module">
//     import { mountPanelHeader } from './header-component.js';
//     mountPanelHeader({
//       title: 'YourExtension',
//       tagline: 'Optional subtitle',
//       mountTarget: document.querySelector('header.panel-header'),
//     });
//   </script>
//
// REQUIRED CSS (host stylesheet — extends OIA design system tokens)
// -----------------------------------------------------------------
// .panel-header {
//   position: sticky; top: 0; z-index: 10;
//   background-color: var(--oia-bg-card);
//   padding: var(--oia-space-md);
//   border-bottom: 1px solid rgba(166, 148, 133, 0.2);
//   flex-shrink: 0;
//   display: flex; align-items: center; justify-content: space-between;
//   gap: var(--oia-space-sm);
// }
// .panel-header__title { display: flex; flex-direction: column; gap: 2px; }
// .panel-header__title .oia-h2 { margin: 0; }
// .panel-header__title .tagline { color: var(--oia-text-muted); }
// .panel-header__settings {
//   display: flex; align-items: center; justify-content: center;
//   width: 36px; height: 36px; padding: 0;
//   background: none; border: none;
//   border-radius: var(--oia-radius-sm);
//   color: var(--oia-text-muted);
//   cursor: pointer; flex-shrink: 0;
//   transition: color 150ms ease-out, background-color 150ms ease-out;
// }
// .panel-header__settings:hover {
//   color: var(--oia-text-primary);
//   background-color: rgba(166, 148, 133, 0.1);
// }
// .panel-header__settings:focus-visible {
//   outline: 2px solid var(--oia-sage); outline-offset: 2px;
// }
// ============================================================

const COG_SVG = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
`;

/**
 * Mount the canonical 864zeros side-panel header into a host element.
 *
 * @param {Object} options
 * @param {string} options.title — Required. The visible app/extension name (rendered as oia-h2).
 * @param {string} [options.tagline] — Optional caption beneath the title.
 * @param {HTMLElement} options.mountTarget — Required. The empty <header> element to populate.
 *                                             Will receive the `.panel-header` class.
 * @param {Function} [options.onSettingsClick] — Optional override. If omitted, calls
 *                                                chrome.runtime.openOptionsPage().
 * @param {string} [options.settingsLabel] — Accessible label for the cog button.
 *                                            Default: 'Open settings'.
 * @returns {{ titleBlock: HTMLElement, settingsBtn: HTMLButtonElement }}
 */
export function mountPanelHeader({
  title,
  tagline = '',
  mountTarget,
  onSettingsClick = null,
  settingsLabel = 'Open settings',
} = {}) {
  if (!title || typeof title !== 'string') {
    throw new TypeError('[mountPanelHeader] `title` is required (string).');
  }
  if (!mountTarget || !(mountTarget instanceof HTMLElement)) {
    throw new TypeError('[mountPanelHeader] `mountTarget` must be an HTMLElement.');
  }

  // Idempotent: clear any previous header DOM
  mountTarget.innerHTML = '';
  mountTarget.classList.add('panel-header');

  // --- Title block (left) ---
  const titleBlock = document.createElement('div');
  titleBlock.className = 'panel-header__title';

  const h1 = document.createElement('h1');
  h1.className = 'oia-h2';
  h1.textContent = title;
  titleBlock.appendChild(h1);

  if (tagline && typeof tagline === 'string') {
    const tag = document.createElement('span');
    tag.className = 'oia-caption tagline';
    tag.textContent = tagline;
    titleBlock.appendChild(tag);
  }

  // --- Cog button (right) ---
  const settingsBtn = document.createElement('button');
  settingsBtn.id = 'open-options';
  settingsBtn.type = 'button';
  settingsBtn.className = 'panel-header__settings';
  settingsBtn.title = settingsLabel;
  settingsBtn.setAttribute('aria-label', settingsLabel);
  settingsBtn.innerHTML = COG_SVG;

  settingsBtn.addEventListener('click', () => {
    if (typeof onSettingsClick === 'function') {
      try { onSettingsClick(); }
      catch (e) { console.warn('[mountPanelHeader] onSettingsClick threw:', e); }
      return;
    }
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      console.warn('[mountPanelHeader] No options page handler available in this context.');
    }
  });

  // --- Assemble ---
  mountTarget.appendChild(titleBlock);
  mountTarget.appendChild(settingsBtn);

  return { titleBlock, settingsBtn };
}
