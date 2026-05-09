// ============================================================
// BRICK — tristate-checkbox-list
// ============================================================
//
// ID:               BRK-UI-002
// Authority:        BUILD_KIT_RULES.md → RULE-003 (Selection & Curation UI)
// Origin:           Strike 011 (MigrationPilot) — Selective Liberation refactor
// Module style:     ESM (drop into sidepanel/, options/)
// Dependencies:     OIA Design System (`oia-checkbox` class)
// Side effects:     Attaches event listeners to a master checkbox + delegated
//                   listener on document for items. No fetch / no storage.
//
// PURPOSE
// -------
// Encapsulates tristate selection over a list of records (captures, clips,
// notes, todos). Manages:
//   - A `Set<id>` of currently-selected item IDs
//   - A master "Select all" checkbox with all/some/none tristate
//   - Per-item checkbox sync after re-renders
//   - Live label updates ("3 selected of 7")
//   - onChange callback → host can disable/enable export buttons
//
// PUBLIC API
// ----------
//   new TristateSelection({ ... })
//   instance.refresh()           — call after re-rendering items
//   instance.getSelected()       — returns Array<id>
//   instance.getCount()          — returns number
//   instance.clear()             — uncheck everything
//   instance.destroy()           — remove listeners (for cleanup)
//
// REQUIRED HTML
// -------------
// <input type="checkbox" id="select-all" class="oia-checkbox">
// <span id="select-all-text">Select all</span>
// ...
// <div class="capture-card" data-id="42">
//   <input type="checkbox" class="oia-checkbox capture-checkbox">
//   ...
// </div>
//
// REQUIRED CSS (host stylesheet)
// ------------------------------
// .oia-checkbox is provided by the OIA Design System.
// Selected-row highlight (recommended):
//   .capture-card--selected {
//     border-color: var(--oia-sage);
//     background-color: rgba(139, 168, 136, 0.05);
//   }
//
// USAGE
// -----
//   import { TristateSelection } from '../lib/bricks/tristate-checkbox-list.js';
//
//   const sel = new TristateSelection({
//     masterCheckbox: document.querySelector('#select-all'),
//     itemCheckboxSelector: '.capture-checkbox',
//     getItemId: (cb) => Number(cb.closest('[data-id]').dataset.id),
//     selectedClassTarget: (cb) => cb.closest('.capture-card'),
//     selectedClass: 'capture-card--selected',
//     masterLabelEl: document.querySelector('#select-all-text'),
//     onChange: (ids) => updateExportButton(ids),
//   });
//
//   // After re-rendering the list:
//   await rerenderList();
//   sel.refresh();
//
// ============================================================

const DEFAULT_LABEL_TEMPLATE = (checked, total) =>
  checked === 0 ? 'Select all' : `${checked} selected of ${total}`;

export class TristateSelection {
  /**
   * @param {Object} options
   * @param {HTMLInputElement} options.masterCheckbox — required
   * @param {string} options.itemCheckboxSelector — selector for per-item checkboxes
   * @param {(cb: HTMLInputElement) => any} options.getItemId — derives ID from a checkbox
   * @param {(cb: HTMLInputElement) => HTMLElement|null} [options.selectedClassTarget] — element to receive selected-class
   * @param {string} [options.selectedClass] — class to toggle on the target
   * @param {HTMLElement} [options.masterLabelEl] — element whose textContent reflects state
   * @param {(checked: number, total: number) => string} [options.masterLabelTemplate]
   * @param {(ids: Array<any>) => void} [options.onChange]
   */
  constructor({
    masterCheckbox,
    itemCheckboxSelector,
    getItemId,
    selectedClassTarget = null,
    selectedClass = null,
    masterLabelEl = null,
    masterLabelTemplate = DEFAULT_LABEL_TEMPLATE,
    onChange = null,
  } = {}) {
    if (!masterCheckbox || !(masterCheckbox instanceof HTMLInputElement)) {
      throw new TypeError('[TristateSelection] masterCheckbox required (HTMLInputElement)');
    }
    if (typeof itemCheckboxSelector !== 'string' || !itemCheckboxSelector) {
      throw new TypeError('[TristateSelection] itemCheckboxSelector required (string)');
    }
    if (typeof getItemId !== 'function') {
      throw new TypeError('[TristateSelection] getItemId required (function)');
    }

    this.master = masterCheckbox;
    this.itemSelector = itemCheckboxSelector;
    this.getItemId = getItemId;
    this.selectedClassTarget = selectedClassTarget;
    this.selectedClass = selectedClass;
    this.masterLabelEl = masterLabelEl;
    this.masterLabelTemplate = masterLabelTemplate;
    this.onChange = onChange;

    this.selectedIds = new Set();

    this._handleMaster = this._handleMaster.bind(this);
    this._handleItem = this._handleItem.bind(this);

    this.master.addEventListener('change', this._handleMaster);
    // Delegated listener — survives DOM re-renders
    document.addEventListener('change', this._handleItem, true);
  }

  /**
   * Re-sync DOM checkbox state against `selectedIds` after a list re-render.
   * Drops selections whose checkboxes no longer exist.
   */
  refresh() {
    const checkboxes = document.querySelectorAll(this.itemSelector);
    const liveIds = new Set(Array.from(checkboxes).map((cb) => this._idOf(cb)));
    for (const id of this.selectedIds) {
      if (!liveIds.has(id)) this.selectedIds.delete(id);
    }
    for (const cb of checkboxes) {
      const id = this._idOf(cb);
      const isSelected = this.selectedIds.has(id);
      cb.checked = isSelected;
      this._applySelectedClass(cb, isSelected);
    }
    this._updateMaster(checkboxes);
    this._fireChange();
  }

  getSelected() { return Array.from(this.selectedIds); }
  getCount() { return this.selectedIds.size; }

  clear() {
    this.selectedIds.clear();
    this.refresh();
  }

  destroy() {
    this.master.removeEventListener('change', this._handleMaster);
    document.removeEventListener('change', this._handleItem, true);
  }

  // --- Internals ---

  _idOf(cb) {
    try { return this.getItemId(cb); }
    catch (e) {
      console.warn('[TristateSelection] getItemId threw:', e);
      return undefined;
    }
  }

  _handleMaster(e) {
    const checked = e.target.checked;
    const checkboxes = document.querySelectorAll(this.itemSelector);
    for (const cb of checkboxes) {
      const id = this._idOf(cb);
      if (id === undefined || id === null) continue;
      cb.checked = checked;
      if (checked) this.selectedIds.add(id);
      else this.selectedIds.delete(id);
      this._applySelectedClass(cb, checked);
    }
    e.target.indeterminate = false;
    this._updateMaster(checkboxes);
    this._fireChange();
  }

  _handleItem(e) {
    const target = e.target;
    if (!target || !target.matches || !target.matches(this.itemSelector)) return;
    const id = this._idOf(target);
    if (id === undefined || id === null) return;
    if (target.checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
    this._applySelectedClass(target, target.checked);
    const checkboxes = document.querySelectorAll(this.itemSelector);
    this._updateMaster(checkboxes);
    this._fireChange();
  }

  _applySelectedClass(checkboxEl, isSelected) {
    if (!this.selectedClass) return;
    const target = typeof this.selectedClassTarget === 'function'
      ? this.selectedClassTarget(checkboxEl)
      : null;
    if (!target) return;
    if (isSelected) target.classList.add(this.selectedClass);
    else target.classList.remove(this.selectedClass);
  }

  _updateMaster(checkboxes) {
    const total = checkboxes.length;
    const checked = Array.from(checkboxes).filter((cb) => cb.checked).length;
    if (total === 0 || checked === 0) {
      this.master.checked = false;
      this.master.indeterminate = false;
    } else if (checked === total) {
      this.master.checked = true;
      this.master.indeterminate = false;
    } else {
      this.master.checked = false;
      this.master.indeterminate = true;
    }
    if (this.masterLabelEl) {
      try {
        this.masterLabelEl.textContent = this.masterLabelTemplate(checked, total);
      } catch (e) {
        console.warn('[TristateSelection] masterLabelTemplate threw:', e);
      }
    }
  }

  _fireChange() {
    if (typeof this.onChange === 'function') {
      try { this.onChange(this.getSelected()); }
      catch (e) { console.warn('[TristateSelection] onChange threw:', e); }
    }
  }
}
