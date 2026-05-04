/**
 * BRK-UI-IMPORT-001 - Standard Import Flow Brick
 * 864zeros Factory Standard Component
 *
 * A bulletproof, reusable Import + Audit UI component for Vulture Strike extensions.
 * Handles file drop, parsing, and displays the "Aha Moment" rescue audit.
 *
 * USAGE:
 * ```javascript
 * import { ImportFlowController } from '../lib/BRK-UI-IMPORT-001.js';
 *
 * const importFlow = new ImportFlowController({
 *   modalId: 'import-modal',
 *   dropzoneId: 'import-dropzone',
 *   fileInputId: 'import-file-input',
 *   onImport: async (file) => { return parsedData; },
 *   onAuditComplete: (auditResult) => { },
 *   competitorName: 'Dashlane',
 *   competitorPrice: 60,
 *   rescueNoun: 'passwords'
 * });
 *
 * importFlow.init();
 * ```
 *
 * REQUIRED HTML STRUCTURE:
 * See BRK-UI-IMPORT-001.html for the standard markup template.
 */

/**
 * Import Flow Controller
 * Manages the complete import lifecycle: trigger → modal → dropzone → parse → audit
 */
export class ImportFlowController {
  /**
   * @param {Object} config - Configuration object
   * @param {string} config.modalId - Import modal element ID
   * @param {string} config.dropzoneId - Dropzone element ID
   * @param {string} config.fileInputId - Hidden file input ID
   * @param {string} config.auditModalId - Audit result modal ID
   * @param {Function} config.onImport - Async function to parse imported file, returns parsed data
   * @param {Function} config.onAuditComplete - Callback when user dismisses audit
   * @param {string} config.competitorName - Name of competitor being rescued from
   * @param {number} config.competitorPrice - Annual price of competitor ($)
   * @param {string} config.rescueNoun - What's being rescued (passwords, articles, etc.)
   */
  constructor(config) {
    this.config = {
      modalId: 'import-modal',
      dropzoneId: 'import-dropzone',
      fileInputId: 'import-file-input',
      auditModalId: 'audit-modal',
      triggerBtnIds: ['start-import-btn', 'import-btn'],
      closeBtnId: 'import-modal-close',
      competitorName: 'Competitor',
      competitorPrice: 0,
      rescueNoun: 'items',
      ...config
    };

    this.elements = {};
    this.isOpen = false;

    // Bind methods
    this._handleDrop = this._handleDrop.bind(this);
    this._handleFileSelect = this._handleFileSelect.bind(this);
  }

  /**
   * Initialize the import flow controller.
   * Call this after DOMContentLoaded.
   */
  init() {
    console.log('[BRK-UI-IMPORT-001] Initializing Import Flow');

    // Cache elements
    this.elements = {
      modal: document.getElementById(this.config.modalId),
      dropzone: document.getElementById(this.config.dropzoneId),
      fileInput: document.getElementById(this.config.fileInputId),
      auditModal: document.getElementById(this.config.auditModalId)
    };

    // Validate required elements
    if (!this.elements.modal) {
      console.error('[BRK-UI-IMPORT-001] Modal element not found:', this.config.modalId);
      return false;
    }

    // Attach trigger button listeners
    this.config.triggerBtnIds.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          console.log('[BRK-UI-IMPORT-001] Import Button Clicked:', id);
          this.openModal();
        });
      }
    });

    // Close button
    const closeBtn = document.getElementById(this.config.closeBtnId);
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    // Dropzone events
    if (this.elements.dropzone) {
      this.elements.dropzone.addEventListener('click', () => {
        this.elements.fileInput?.click();
      });

      this.elements.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.elements.dropzone.classList.add('dragover');
      });

      this.elements.dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.elements.dropzone.classList.remove('dragover');
      });

      this.elements.dropzone.addEventListener('drop', this._handleDrop);
    }

    // File input change
    if (this.elements.fileInput) {
      this.elements.fileInput.addEventListener('change', this._handleFileSelect);
    }

    // Import option buttons (if any)
    document.querySelectorAll('.import-option').forEach(option => {
      option.addEventListener('click', () => {
        this.elements.fileInput?.click();
      });
    });

    console.log('[BRK-UI-IMPORT-001] Import Flow Initialized');
    return true;
  }

  /**
   * Open the import modal.
   */
  openModal() {
    if (!this.elements.modal) return;

    console.log('[BRK-UI-IMPORT-001] Opening Import Modal');
    this.elements.modal.classList.remove('hidden');
    this.elements.modal.classList.add('visible');
    this.isOpen = true;
  }

  /**
   * Close the import modal.
   */
  closeModal() {
    if (!this.elements.modal) return;

    console.log('[BRK-UI-IMPORT-001] Closing Import Modal');
    this.elements.modal.classList.add('hidden');
    this.elements.modal.classList.remove('visible');
    this.isOpen = false;
  }

  /**
   * Handle file drop.
   * @private
   */
  _handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.elements.dropzone?.classList.remove('dragover');

    const file = e.dataTransfer?.files[0];
    if (file) {
      this._processFile(file);
    }
  }

  /**
   * Handle file input selection.
   * @private
   */
  _handleFileSelect(e) {
    const file = e.target?.files[0];
    if (file) {
      this._processFile(file);
    }
  }

  /**
   * Process the imported file.
   * @private
   */
  async _processFile(file) {
    console.log('[BRK-UI-IMPORT-001] Processing file:', file.name);

    try {
      // Show loading state
      this._showLoading();

      // Call the user's import handler
      if (this.config.onImport) {
        const result = await this.config.onImport(file);

        // Close import modal
        this.closeModal();

        // Show audit result
        if (result) {
          this._showAuditResult(result);
        }
      }
    } catch (error) {
      console.error('[BRK-UI-IMPORT-001] Import failed:', error);
      this._showError(error.message);
    } finally {
      this._hideLoading();
      // Reset file input
      if (this.elements.fileInput) {
        this.elements.fileInput.value = '';
      }
    }
  }

  /**
   * Show loading state on dropzone.
   * @private
   */
  _showLoading() {
    if (this.elements.dropzone) {
      this.elements.dropzone.classList.add('loading');
      const textEl = this.elements.dropzone.querySelector('.dropzone-text');
      if (textEl) {
        textEl.dataset.originalText = textEl.textContent;
        textEl.textContent = 'Processing...';
      }
    }
  }

  /**
   * Hide loading state.
   * @private
   */
  _hideLoading() {
    if (this.elements.dropzone) {
      this.elements.dropzone.classList.remove('loading');
      const textEl = this.elements.dropzone.querySelector('.dropzone-text');
      if (textEl && textEl.dataset.originalText) {
        textEl.textContent = textEl.dataset.originalText;
      }
    }
  }

  /**
   * Show error toast.
   * @private
   */
  _showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  /**
   * Show the audit result modal (The Aha Moment!).
   * @private
   */
  _showAuditResult(result) {
    if (!this.elements.auditModal) {
      console.warn('[BRK-UI-IMPORT-001] No audit modal element found');
      return;
    }

    const { totalImported, issues, auditSummary } = result;

    // Calculate savings
    const yearsSaved = 1;
    const moneySaved = this.config.competitorPrice * yearsSaved;

    // Build audit HTML
    const auditHTML = `
      <div class="audit-report">
        <header class="modal-header">
          <h3>Rescue Complete!</h3>
          <button class="modal-close" id="audit-modal-close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>

        <div class="audit-content p-lg">
          <!-- Value Saved Banner -->
          <div class="value-saved mb-lg">
            <div class="value-amount">$${moneySaved}</div>
            <div class="value-period">per year saved</div>
            <div class="value-comparison">vs ${this.config.competitorName} @ $${this.config.competitorPrice}/yr</div>
            <div class="value-tagline">Your ${this.config.rescueNoun} are now free forever.</div>
          </div>

          <!-- Import Summary -->
          <div class="import-summary card mb-lg">
            <div class="summary-stat">
              <span class="stat-value">${totalImported || 0}</span>
              <span class="stat-label">${this.config.rescueNoun} rescued</span>
            </div>
          </div>

          ${this._renderAuditIssues(auditSummary || issues)}

          <!-- Action Button -->
          <button class="btn btn-primary btn-block mt-lg" id="audit-continue-btn">
            Continue to Vault
          </button>
        </div>
      </div>
    `;

    this.elements.auditModal.innerHTML = auditHTML;
    this.elements.auditModal.classList.remove('hidden');
    this.elements.auditModal.classList.add('visible');

    // Attach close handlers
    document.getElementById('audit-modal-close')?.addEventListener('click', () => {
      this._closeAuditModal();
    });

    document.getElementById('audit-continue-btn')?.addEventListener('click', () => {
      this._closeAuditModal();
    });
  }

  /**
   * Render audit issues list.
   * @private
   */
  _renderAuditIssues(summary) {
    if (!summary) return '';

    const issues = [];

    if (summary.breached > 0) {
      issues.push(`
        <div class="audit-issue danger">
          <div class="issue-icon">⚠️</div>
          <div class="issue-content">
            <div class="issue-title">Compromised ${this.config.rescueNoun}</div>
            <div class="issue-count">${summary.breached} found in data breaches</div>
          </div>
        </div>
      `);
    }

    if (summary.reused > 0) {
      issues.push(`
        <div class="audit-issue danger">
          <div class="issue-icon">🔄</div>
          <div class="issue-content">
            <div class="issue-title">Reused ${this.config.rescueNoun}</div>
            <div class="issue-count">${summary.reused} used on multiple sites</div>
          </div>
        </div>
      `);
    }

    if (summary.weak > 0) {
      issues.push(`
        <div class="audit-issue warning">
          <div class="issue-icon">📉</div>
          <div class="issue-content">
            <div class="issue-title">Weak ${this.config.rescueNoun}</div>
            <div class="issue-count">${summary.weak} need strengthening</div>
          </div>
        </div>
      `);
    }

    if (issues.length === 0) {
      return `
        <div class="audit-issue" style="border-color: var(--status-secure);">
          <div class="issue-icon">✅</div>
          <div class="issue-content">
            <div class="issue-title">All Clear!</div>
            <div class="issue-count">No security issues detected</div>
          </div>
        </div>
      `;
    }

    return `<div class="audit-issues mb-lg">${issues.join('')}</div>`;
  }

  /**
   * Close the audit modal.
   * @private
   */
  _closeAuditModal() {
    if (this.elements.auditModal) {
      this.elements.auditModal.classList.add('hidden');
      this.elements.auditModal.classList.remove('visible');
      this.elements.auditModal.innerHTML = '';
    }

    // Trigger callback
    if (this.config.onAuditComplete) {
      this.config.onAuditComplete();
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('importflow:complete'));
  }
}

/**
 * Standard Import Modal HTML Template
 * Include this in your sidepanel/index.html
 */
export const IMPORT_MODAL_HTML = `
<!-- Import Modal (BRK-UI-IMPORT-001) -->
<div class="import-modal hidden" id="import-modal">
  <header class="modal-header">
    <h3>Import</h3>
    <button class="modal-close" id="import-modal-close" title="Close">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </header>

  <div class="import-section p-lg">
    <div class="dropzone" id="import-dropzone">
      <div class="dropzone-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
      <div class="dropzone-text">Drop your export file here</div>
      <div class="dropzone-hint">Or click to browse</div>
    </div>

    <input type="file" id="import-file-input" accept=".csv,.json" class="hidden">
  </div>
</div>

<!-- Audit Result Modal (BRK-UI-IMPORT-001) -->
<div class="audit-modal hidden" id="audit-modal"></div>
`;

/**
 * Standard Import CSS (append to your theme CSS)
 */
export const IMPORT_MODAL_CSS = `
/* BRK-UI-IMPORT-001 Modal Styles */
.import-modal,
.audit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  z-index: 50;
  overflow-y: auto;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

.import-modal.visible,
.audit-modal.visible,
.import-modal:not(.hidden),
.audit-modal:not(.hidden) {
  opacity: 1;
  visibility: visible;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md, 16px);
  border-bottom: 1px solid var(--border-color, #2a2a3a);
  background: var(--bg-secondary, #12121a);
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary, #a0a0b0);
  cursor: pointer;
  border-radius: 4px;
}

.modal-close:hover {
  background: var(--bg-hover, #22222e);
  color: var(--text-primary, #f0f0f5);
}

.dropzone.loading {
  opacity: 0.6;
  pointer-events: none;
}

.audit-report {
  min-height: 100vh;
}

.audit-content {
  max-width: 480px;
  margin: 0 auto;
}

.import-summary {
  text-align: center;
  padding: var(--space-lg, 24px);
}

.summary-stat .stat-value {
  display: block;
  font-size: 48px;
  font-weight: 700;
  color: var(--accent-primary, #00d084);
}

.summary-stat .stat-label {
  font-size: 14px;
  color: var(--text-secondary, #a0a0b0);
}
`;

export default ImportFlowController;
