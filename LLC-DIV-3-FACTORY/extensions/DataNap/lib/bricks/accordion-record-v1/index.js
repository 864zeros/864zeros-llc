// ============================================================
// BRICK — accordion-record-v1
// ============================================================
//
// ID:               BRK-UI-004
// Authority:        BUILD_KIT_RULES.md → RULE-004 (Interactive Record Accordion)
// Origin:           Strike 012 (ScriptureScout) — sidepanel/main.js accordion refactor
// Module style:     ESM
// Dependencies:     OIA Design System tokens (--oia-* variables)
// Side effects:     Attaches `click` and `keydown` listeners to the host container
//                   (event delegation — survives DOM re-renders).
//
// PURPOSE
// -------
// Manages an expandable list of records. Header always visible, body
// expands smoothly via grid-template-rows transition, chevron rotates
// 90° on expand. Default behavior is exclusive (one open at a time);
// Shift+Click switches to multi-expand "Compare Mode".
//
// PUBLIC API
// ----------
//   new AccordionController({ container, ... })
//   instance.toggle(id, shiftKey?)
//   instance.expand(id)
//   instance.collapse(id)
//   instance.collapseAll()
//   instance.isExpanded(id)
//   instance.getExpandedIds()
//   instance.refresh()                    — re-sync after DOM re-render
//   instance.destroy()                    — remove listeners
//
//   createChevronSVG()                    — canonical Bronze chevron markup
//
// HTML CONTRACT
// -------------
// The HOST builds the record DOM. The brick attaches behavior. Required
// classes/attributes are minimal:
//
//   <div class="accordion-list">
//     <div class="accordion-record" data-record-id="42">
//       <div class="accordion-record__header"
//            role="button" tabindex="0"
//            aria-expanded="false" aria-controls="record-body-42">
//         <!-- host content: optional checkbox, title-block, meta -->
//         <button class="accordion-record__chevron" data-no-toggle aria-label="Toggle">
//           <!-- chevron SVG (use createChevronSVG()) -->
//         </button>
//       </div>
//       <div class="accordion-record__body-wrapper">
//         <div class="accordion-record__body" id="record-body-42">
//           <div class="accordion-record__reading">
//             <!-- captured content -->
//           </div>
//           <div class="accordion-record__actions">
//             <!-- View Source · Liberate · Remove · etc -->
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
//
// EXPANDED STATE
// --------------
// When toggled, the controller adds `accordion-record--expanded` to the
// record element. The accompanying styles.css uses this class to:
//   - Set `grid-template-rows: 1fr` on `.accordion-record__body-wrapper`
//   - Apply `transform: rotate(90deg)` to `.accordion-record__chevron`
//
// USAGE
// -----
//   import { AccordionController, createChevronSVG } from
//     '../lib/bricks/accordion-record-v1/index.js';
//
//   const accordion = new AccordionController({
//     container: document.querySelector('.accordion-list'),
//     exclusive: true,            // default — one open at a time
//     shiftMultiExpand: true,     // default — Shift+Click multi-expand
//     onChange: (expandedSet) => updatePersistedState(expandedSet),
//   });
//
//   // After re-rendering the list, re-sync the controller:
//   await renderRecords();
//   accordion.refresh();
//
// PER RULE-004
// ------------
// This brick implements RULE-004 (Interactive Record Accordion).
// Any extension with a queue-of-records UI MUST use this pattern.
// See `usage.md` in this directory for full integration steps.
// ============================================================

const DEFAULT_OPTIONS = {
  recordSelector: '.accordion-record',
  headerSelector: '.accordion-record__header',
  chevronSelector: '.accordion-record__chevron',
  bodyWrapperSelector: '.accordion-record__body-wrapper',
  expandedClass: 'accordion-record--expanded',
  exclusive: true,
  shiftMultiExpand: true,
};

export class AccordionController {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container — required; the list container
   * @param {string} [options.recordSelector] — CSS selector for record elements
   * @param {string} [options.headerSelector] — CSS selector for clickable headers
   * @param {string} [options.chevronSelector] — CSS selector for the chevron
   * @param {string} [options.bodyWrapperSelector] — CSS selector for body wrapper
   * @param {string} [options.expandedClass] — class name applied when expanded
   * @param {boolean} [options.exclusive] — one-open-at-a-time. Default true.
   * @param {boolean} [options.shiftMultiExpand] — Shift+Click toggles compare mode. Default true.
   * @param {(expandedIds: Set) => void} [options.onChange] — fires after every state change
   */
  constructor(options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    if (!opts.container || !(opts.container instanceof HTMLElement)) {
      throw new TypeError('[AccordionController] `container` (HTMLElement) is required');
    }
    Object.assign(this, opts);
    this.expandedIds = new Set();

    this._onClick = this._onClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    this.container.addEventListener('click', this._onClick);
    this.container.addEventListener('keydown', this._onKeyDown);
  }

  // === Public API ===

  toggle(id, shiftKey = false) {
    const id_ = this._normalizeId(id);
    const useMulti = shiftKey && this.shiftMultiExpand;
    if (useMulti || !this.exclusive) {
      if (this.expandedIds.has(id_)) this.expandedIds.delete(id_);
      else this.expandedIds.add(id_);
    } else {
      const wasExpanded = this.expandedIds.has(id_);
      this.expandedIds.clear();
      if (!wasExpanded) this.expandedIds.add(id_);
    }
    this._syncDom();
    return this.expandedIds.has(id_);
  }

  expand(id)     { this.expandedIds.add(this._normalizeId(id));    this._syncDom(); }
  collapse(id)   { this.expandedIds.delete(this._normalizeId(id)); this._syncDom(); }
  collapseAll()  { this.expandedIds.clear();                       this._syncDom(); }

  isExpanded(id)    { return this.expandedIds.has(this._normalizeId(id)); }
  getExpandedIds()  { return Array.from(this.expandedIds); }

  /** Re-apply expanded state to the DOM. Call after the host re-renders the list. */
  refresh()         { this._syncDom(); }

  destroy() {
    this.container.removeEventListener('click', this._onClick);
    this.container.removeEventListener('keydown', this._onKeyDown);
  }

  // === Internals ===

  _normalizeId(id) {
    if (typeof id === 'number') return id;
    const n = Number(id);
    return Number.isFinite(n) && String(n) === String(id) ? n : id;
  }

  _readRecordId(recordEl) {
    if (!recordEl) return undefined;
    const raw = recordEl.dataset.recordId !== undefined
      ? recordEl.dataset.recordId
      : recordEl.dataset.id;
    if (raw === undefined) return undefined;
    return this._normalizeId(raw);
  }

  _shouldIgnoreEvent(e) {
    // Hosts mark interactive sub-controls (checkboxes, action buttons,
    // anchors) with [data-no-toggle] OR call stopPropagation themselves.
    // Clicks inside an open body never re-toggle.
    if (e.target.closest('[data-no-toggle]')) return true;
    if (e.target.closest(this.bodyWrapperSelector)) return true;
    return false;
  }

  _onClick(e) {
    if (this._shouldIgnoreEvent(e)) return;
    const header = e.target.closest(this.headerSelector);
    if (!header || !this.container.contains(header)) return;
    const record = header.closest(this.recordSelector);
    const id = this._readRecordId(record);
    if (id === undefined) return;
    this.toggle(id, e.shiftKey);
  }

  _onKeyDown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (this._shouldIgnoreEvent(e)) return;
    const header = e.target.closest(this.headerSelector);
    if (!header || !this.container.contains(header)) return;
    const record = header.closest(this.recordSelector);
    const id = this._readRecordId(record);
    if (id === undefined) return;
    e.preventDefault();
    this.toggle(id, e.shiftKey);
  }

  _syncDom() {
    const records = this.container.querySelectorAll(this.recordSelector);
    for (const rec of records) {
      const id = this._readRecordId(rec);
      if (id === undefined) continue;
      const isExpanded = this.expandedIds.has(id);
      rec.classList.toggle(this.expandedClass, isExpanded);
      const header = rec.querySelector(this.headerSelector);
      if (header) header.setAttribute('aria-expanded', String(isExpanded));
      const chevron = rec.querySelector(this.chevronSelector);
      if (chevron) chevron.setAttribute('aria-label', isExpanded ? 'Collapse' : 'Expand');
    }
    if (typeof this.onChange === 'function') {
      try { this.onChange(new Set(this.expandedIds)); }
      catch (e) { console.warn('[AccordionController] onChange threw:', e); }
    }
  }
}

/**
 * Canonical Bronze chevron SVG markup. Right-pointing arrow that rotates
 * 90° on expand (per RULE-004 / GTM_MANIFEST §7).
 *
 * @returns {string} SVG markup ready to inject via innerHTML
 */
export function createChevronSVG() {
  return `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="9 6 15 12 9 18"></polyline>
    </svg>
  `;
}
