// ============================================================
// BRICK — two-tap-arm-pattern
// ============================================================
//
// ID:               BRK-UI-003
// Authority:        CLAUDE-base.md (no alert/confirm/prompt) +
//                   BUILD_KIT_RULES.md → RULE-001 §3 (Destructive Actions)
// Origin:           Strike 011 (MigrationPilot) — RULE-001 implementation
// Module style:     ESM
// Dependencies:     none (pure DOM)
// Side effects:     Adds click + outside-click listeners; mutates the
//                   button's textContent + dataset + className while armed.
//
// PURPOSE
// -------
// Wraps any destructive button in a two-tap arm/confirm pattern compliant
// with `CLAUDE-base.md` ("never alert(), never 'are you sure?'").
//
// First tap arms (visible state change). Second tap within `timeoutMs`
// confirms. Clicking elsewhere or waiting cancels. No modals, no spam.
//
// PUBLIC API
// ----------
//   const controller = armDestructiveButton({ button, onConfirm, ... });
//   controller.cancelArm()    — programmatically un-arm
//   controller.destroy()      — remove all listeners
//   controller.isArmed()      — boolean
//
// USAGE
// -----
//   import { armDestructiveButton } from '../lib/bricks/two-tap-arm-pattern.js';
//
//   armDestructiveButton({
//     button: document.querySelector('#btn-clear-db'),
//     hintEl: document.querySelector('#clear-hint'),
//     defaultLabel: 'Clear all captures',
//     armedLabel:   'Tap again to confirm',
//     defaultHint:  'Permanent. There is no undo.',
//     armedHint:    'Click again within 4 seconds, or anywhere else to cancel.',
//     armClass: 'data-actions__danger--armed',
//     timeoutMs: 4000,
//     onConfirm: async () => {
//       await clearAll();
//       showToast('All captures cleared');
//     },
//   });
//
// REQUIRED CSS (host stylesheet)
// ------------------------------
// .danger-btn          — your default destructive-button style (red border, etc.)
// .danger-btn--armed   — armed state (filled red, pulsing animation)
//
// Recommended pulse animation:
//   @keyframes armed-pulse {
//     0%, 100% { box-shadow: 0 0 0 0 rgba(212, 132, 122, 0.4); }
//     50%      { box-shadow: 0 0 0 6px rgba(212, 132, 122, 0); }
//   }
//   .danger-btn--armed { animation: armed-pulse 1s ease-in-out infinite; }
//
// ============================================================

/**
 * Wrap a button with the two-tap arm/confirm destructive-action pattern.
 *
 * @param {Object} options
 * @param {HTMLButtonElement} options.button — required
 * @param {() => any|Promise<any>} options.onConfirm — required
 * @param {HTMLElement} [options.hintEl] — element whose textContent shows status hints
 * @param {string} [options.defaultLabel] — button text in resting state. Defaults to current textContent.
 * @param {string} [options.armedLabel] — button text while armed. Default 'Tap again to confirm'.
 * @param {string} [options.defaultHint] — hintEl text in resting state. Defaults to current textContent.
 * @param {string} [options.armedHint] — hintEl text while armed.
 * @param {string} [options.armClass] — CSS class added to button while armed. Default 'armed'.
 * @param {number} [options.timeoutMs] — auto-cancel after N ms. Default 4000.
 * @param {boolean} [options.disableDuringConfirm] — disable the button while onConfirm runs. Default true.
 * @returns {{ cancelArm: () => void, destroy: () => void, isArmed: () => boolean }}
 */
export function armDestructiveButton({
  button,
  onConfirm,
  hintEl = null,
  defaultLabel = null,
  armedLabel = 'Tap again to confirm',
  defaultHint = null,
  armedHint = null,
  armClass = 'armed',
  timeoutMs = 4000,
  disableDuringConfirm = true,
} = {}) {
  if (!button || !(button instanceof HTMLElement)) {
    throw new TypeError('[two-tap-arm-pattern] button must be an HTMLElement');
  }
  if (typeof onConfirm !== 'function') {
    throw new TypeError('[two-tap-arm-pattern] onConfirm must be a function');
  }

  const _defaultLabel = defaultLabel !== null ? defaultLabel : button.textContent;
  const _defaultHint = (hintEl && defaultHint !== null) ? defaultHint
                       : (hintEl ? hintEl.textContent : null);

  let armedTimer = null;
  let outsideClickHandler = null;
  let armed = false;

  function isArmed() { return armed; }

  function cancelArm() {
    if (armedTimer) {
      clearTimeout(armedTimer);
      armedTimer = null;
    }
    if (outsideClickHandler) {
      document.removeEventListener('click', outsideClickHandler, true);
      outsideClickHandler = null;
    }
    armed = false;
    button.dataset.armed = 'false';
    button.textContent = _defaultLabel;
    button.classList.remove(armClass);
    if (hintEl && _defaultHint !== null) hintEl.textContent = _defaultHint;
  }

  function arm() {
    armed = true;
    button.dataset.armed = 'true';
    button.textContent = armedLabel;
    button.classList.add(armClass);
    if (hintEl && armedHint) hintEl.textContent = armedHint;

    armedTimer = setTimeout(cancelArm, timeoutMs);

    // Outside-click cancel — registered next tick so the current click
    // doesn't immediately fire it.
    setTimeout(() => {
      outsideClickHandler = (e) => {
        if (e.target === button || button.contains(e.target)) return;
        cancelArm();
      };
      document.addEventListener('click', outsideClickHandler, { capture: true });
    }, 0);
  }

  async function confirm() {
    cancelArm();
    if (disableDuringConfirm) button.disabled = true;
    try {
      await onConfirm();
    } catch (e) {
      console.warn('[two-tap-arm-pattern] onConfirm threw:', e);
    } finally {
      if (disableDuringConfirm) button.disabled = false;
    }
  }

  function onClick(e) {
    if (button.disabled) return;
    if (armed) {
      e.preventDefault();
      e.stopPropagation();
      confirm();
    } else {
      arm();
    }
  }

  button.addEventListener('click', onClick);

  return {
    cancelArm,
    isArmed,
    destroy: () => {
      cancelArm();
      button.removeEventListener('click', onClick);
    },
  };
}
