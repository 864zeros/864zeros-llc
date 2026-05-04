// app.js - PassVault Sidepanel Controller
// 864zeros Build: 864z-2026-004
//
// Main application logic for the sidepanel UI.
// Handles vault lifecycle, import/export, and password management.

import { CryptoVault, SecureVaultStorage } from '../lib/crypto-vault.js';
import { parsePasswordExport, PasswordVault } from '../lib/password-parser.js';
import { breachChecker } from '../lib/breach-checker.js';
import { AuditReportController, AUDIT_REPORT_CSS } from './audit-report.js';
import { VAULT_STATE, MESSAGE_TYPES, COPY } from '../lib/constants.js';
import { PricingModalController, injectPricingCSS } from '../lib/BRK-PRICING-001.js';

/**
 * PassVault Application Controller
 */
class PassVaultApp {
  constructor() {
    this.vault = new CryptoVault();
    this.storage = new SecureVaultStorage();
    this.passwordVault = null;
    this.vaultId = null;
    this.state = VAULT_STATE.UNINITIALIZED;
    this.pricingModal = null;

    // DOM references
    this.elements = {};

    // Bind methods
    this.handleImport = this.handleImport.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
  }

  /**
   * Initialize the application.
   */
  async init() {
    console.log('[PassVault] Initializing...');

    // Add audit report CSS
    this._injectCSS(AUDIT_REPORT_CSS);

    // Initialize pricing modal (BRK-PRICING-001)
    injectPricingCSS();
    this.pricingModal = new PricingModalController({
      productName: 'PassVault',
      currentTier: 'free',
      onUpgrade: (tier) => {
        console.log('[PassVault] Upgrade requested:', tier);
      }
    });

    // Cache DOM elements
    this._cacheElements();

    // Attach event listeners
    this._attachListeners();

    // Check vault state
    const isOnboarded = localStorage.getItem('passvault_onboarded');

    if (!isOnboarded) {
      // Redirect to onboarding
      window.location.href = '../onboarding/index.html';
      return;
    }

    // Try to unlock vault
    const storedSalt = localStorage.getItem('passvault_salt');
    this.vaultId = localStorage.getItem('passvault_vault_id');

    if (!storedSalt || !this.vaultId) {
      this._showLockedState();
      return;
    }

    // Check if we have a session key (auto-unlock)
    const sessionUnlocked = sessionStorage.getItem('passvault_unlocked');
    if (sessionUnlocked) {
      // Reconstruct vault state (simplified - in production, use secure session)
      await this._tryAutoUnlock();
    } else {
      this._showLockedState();
    }

    console.log('[PassVault] Initialized');
  }

  /**
   * Cache DOM elements.
   */
  _cacheElements() {
    this.elements = {
      app: document.getElementById('app'),
      mainContent: document.getElementById('main-content'),
      passwordList: document.getElementById('password-list'),
      emptyState: document.getElementById('empty-state'),
      searchInput: document.getElementById('search-input'),
      importModal: document.getElementById('import-modal'),
      auditModal: document.getElementById('audit-modal'),
      importDropzone: document.getElementById('import-dropzone'),
      importFileInput: document.getElementById('import-file-input')
    };
  }

  /**
   * Attach event listeners.
   */
  _attachListeners() {
    // Header actions
    document.getElementById('add-entry-btn')?.addEventListener('click', () => {
      this._showAddEntry();
    });

    document.getElementById('import-btn')?.addEventListener('click', () => {
      console.log('[PassVault] Import Button Clicked (header)');
      this._showImportModal();
    });

    document.getElementById('lock-btn')?.addEventListener('click', () => {
      this.lockVault();
    });

    document.getElementById('settings-btn')?.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    document.getElementById('start-import-btn')?.addEventListener('click', () => {
      console.log('[PassVault] Import Button Clicked');
      this._showImportModal();
    });

    // Search
    this.elements.searchInput?.addEventListener('input', this.handleSearch);

    // Import dropzone
    if (this.elements.importDropzone) {
      this.elements.importDropzone.addEventListener('click', () => {
        this.elements.importFileInput.click();
      });

      this.elements.importDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.elements.importDropzone.classList.add('dragover');
      });

      this.elements.importDropzone.addEventListener('dragleave', () => {
        this.elements.importDropzone.classList.remove('dragover');
      });

      this.elements.importDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.elements.importDropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) this.handleImport(file);
      });
    }

    // File input
    this.elements.importFileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.handleImport(file);
    });

    // Import options
    document.querySelectorAll('.import-option').forEach(option => {
      option.addEventListener('click', () => {
        this.elements.importFileInput.click();
      });
    });

    // Import modal close button
    document.getElementById('import-modal-close')?.addEventListener('click', () => {
      this._hideImportModal();
    });

    // Upgrade link in footer
    document.getElementById('upgrade-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.pricingModal.show();
    });

    // Custom events
    window.addEventListener('passvault:close-audit', () => {
      this._hideAuditModal();
      this._renderPasswordList();
    });

    window.addEventListener('passvault:show-weak-passwords', () => {
      this._hideAuditModal();
      this._showWeakPasswords();
    });
  }

  /**
   * Show locked state UI.
   */
  _showLockedState() {
    this.state = VAULT_STATE.LOCKED;

    const lockedHTML = `
      <div class="locked-overlay" id="locked-overlay">
        <div class="lock-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2>Vault Locked</h2>
        <p>Enter your master password to unlock</p>

        <form class="unlock-form" id="unlock-form">
          <div class="form-group">
            <input
              type="password"
              id="unlock-password"
              placeholder="Master password"
              autocomplete="current-password"
              required
            />
          </div>
          <div class="error-message" id="unlock-error"></div>
          <button type="submit" class="btn btn-primary btn-block mt-md">
            Unlock
          </button>
        </form>
      </div>
    `;

    this.elements.app.insertAdjacentHTML('beforeend', lockedHTML);

    // Attach unlock listener
    document.getElementById('unlock-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this._handleUnlock();
    });

    // Focus password input
    document.getElementById('unlock-password').focus();
  }

  /**
   * Handle unlock attempt.
   */
  async _handleUnlock() {
    const password = document.getElementById('unlock-password').value;
    const errorDiv = document.getElementById('unlock-error');
    errorDiv.textContent = '';

    try {
      const storedSalt = localStorage.getItem('passvault_salt');
      const salt = Uint8Array.from(atob(storedSalt), c => c.charCodeAt(0));

      await this.vault.initialize(password, salt);

      // Try to decrypt vault
      const encrypted = await this.storage.load(this.vaultId);
      if (!encrypted) {
        throw new Error('Vault data not found');
      }

      const decrypted = await this.vault.decrypt(encrypted);
      this.passwordVault = this._hydrateVault(decrypted);

      // Mark session as unlocked
      sessionStorage.setItem('passvault_unlocked', 'true');

      // Remove locked overlay
      document.getElementById('locked-overlay')?.remove();

      this.state = VAULT_STATE.UNLOCKED;
      this._renderPasswordList();
    } catch (error) {
      errorDiv.textContent = 'Incorrect password';
      document.getElementById('unlock-password').value = '';
      document.getElementById('unlock-password').focus();
    }
  }

  /**
   * Try auto-unlock (for session persistence).
   */
  async _tryAutoUnlock() {
    // In a real implementation, we'd use a more secure method
    // For now, just show locked state
    this._showLockedState();
  }

  /**
   * Lock the vault.
   */
  lockVault() {
    this.vault.lock();
    this.passwordVault = null;
    this.state = VAULT_STATE.LOCKED;
    sessionStorage.removeItem('passvault_unlocked');

    // Show locked state
    this._showLockedState();
  }

  /**
   * Handle password import.
   */
  async handleImport(file) {
    console.log('[PassVault] Importing file:', file.name);

    try {
      const content = await file.text();
      const importedVault = parsePasswordExport(content, file.name);

      if (importedVault.metadata.errors.length > 0) {
        console.warn('[PassVault] Import errors:', importedVault.metadata.errors);
      }

      if (importedVault.entries.length === 0) {
        this._showToast('No passwords found in file', 'error');
        return;
      }

      // Run security audit (the "aha!" moment)
      const auditSummary = importedVault.runSecurityAudit();

      // Run breach check
      this._showToast('Checking for breaches...', 'info');
      const breachSummary = await breachChecker.auditVault(importedVault.entries);

      // Merge into existing vault
      if (!this.passwordVault) {
        this.passwordVault = importedVault;
      } else {
        // Merge entries (skip duplicates by URL)
        const existingUrls = new Set(this.passwordVault.entries.map(e => e.url));
        for (const entry of importedVault.entries) {
          if (!existingUrls.has(entry.url)) {
            this.passwordVault.addEntry(entry);
          } else {
            importedVault.metadata.duplicatesSkipped++;
          }
        }
      }

      // Save encrypted vault
      await this._saveVault();

      // Hide import modal
      this._hideImportModal();

      // Show audit report (THE AHA MOMENT!)
      this._showAuditReport({
        source: importedVault.metadata.source,
        totalImported: importedVault.metadata.totalImported,
        auditSummary,
        breachSummary
      });

    } catch (error) {
      console.error('[PassVault] Import failed:', error);
      this._showToast('Import failed: ' + error.message, 'error');
    }
  }

  /**
   * Handle search.
   */
  handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    if (!this.passwordVault) return;

    const entries = this.passwordVault.entries.filter(entry => {
      return (
        entry.title?.toLowerCase().includes(query) ||
        entry.url?.toLowerCase().includes(query) ||
        entry.username?.toLowerCase().includes(query) ||
        entry.domain?.toLowerCase().includes(query)
      );
    });

    this._renderPasswordList(entries);
  }

  /**
   * Save vault to encrypted storage.
   */
  async _saveVault() {
    if (!this.vault.isUnlocked() || !this.passwordVault) return;

    const encrypted = await this.vault.encrypt({
      entries: this.passwordVault.entries,
      secureNotes: this.passwordVault.secureNotes,
      paymentCards: this.passwordVault.paymentCards,
      identities: this.passwordVault.identities,
      metadata: this.passwordVault.metadata
    });

    await this.storage.save(this.vaultId, 'Default Vault', encrypted);
    console.log('[PassVault] Vault saved');
  }

  /**
   * Hydrate vault from decrypted data.
   */
  _hydrateVault(data) {
    const vault = new PasswordVault();
    vault.entries = data.entries || [];
    vault.secureNotes = data.secureNotes || [];
    vault.paymentCards = data.paymentCards || [];
    vault.identities = data.identities || [];
    vault.metadata = data.metadata || {};
    return vault;
  }

  /**
   * Render password list.
   */
  _renderPasswordList(entries = null) {
    const list = entries || this.passwordVault?.entries || [];

    if (list.length === 0) {
      this.elements.passwordList.innerHTML = '';
      this.elements.emptyState.classList.remove('hidden');
      return;
    }

    this.elements.emptyState.classList.add('hidden');

    const html = list.map(entry => this._renderPasswordEntry(entry)).join('');
    this.elements.passwordList.innerHTML = html;

    // Attach click handlers
    this.elements.passwordList.querySelectorAll('.password-entry').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        this._showEntryDetails(id);
      });
    });
  }

  /**
   * Render single password entry.
   */
  _renderPasswordEntry(entry) {
    const badges = [];

    if (entry.audit?.breached) {
      badges.push('<span class="badge badge-danger">Breached</span>');
    }
    if (entry.audit?.isReused) {
      badges.push('<span class="badge badge-danger">Reused</span>');
    }
    if (entry.audit?.isWeak) {
      badges.push('<span class="badge badge-warning">Weak</span>');
    }

    const favicon = this._getFaviconEmoji(entry.domain || entry.url);

    return `
      <div class="password-entry" data-id="${entry.id}">
        <div class="entry-icon">${favicon}</div>
        <div class="entry-info">
          <div class="entry-title">${this._escapeHtml(entry.title || entry.domain || 'Untitled')}</div>
          <div class="entry-username">${this._escapeHtml(entry.username || entry.email || '')}</div>
        </div>
        <div class="entry-badges">
          ${badges.join('')}
        </div>
      </div>
    `;
  }

  /**
   * Get favicon emoji for domain.
   */
  _getFaviconEmoji(domain) {
    if (!domain) return '🔐';

    const domainLower = domain.toLowerCase();

    // Common site mappings
    const emojiMap = {
      'google': '🔵',
      'facebook': '📘',
      'twitter': '🐦',
      'amazon': '📦',
      'netflix': '🎬',
      'github': '🐙',
      'linkedin': '💼',
      'instagram': '📷',
      'youtube': '▶️',
      'spotify': '🎵',
      'apple': '🍎',
      'microsoft': '🪟',
      'reddit': '🤖',
      'discord': '💬',
      'slack': '💬',
      'dropbox': '📁',
      'paypal': '💳',
      'bank': '🏦'
    };

    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (domainLower.includes(key)) return emoji;
    }

    return '🔐';
  }

  /**
   * Show import modal.
   */
  _showImportModal() {
    console.log('[PassVault] Opening Import Modal');
    this.elements.importModal.classList.remove('hidden');
    this.elements.importModal.classList.add('visible');
  }

  /**
   * Hide import modal.
   */
  _hideImportModal() {
    this.elements.importModal.classList.add('hidden');
    this.elements.importModal.classList.remove('visible');
  }

  /**
   * Show audit report modal.
   */
  _showAuditReport(params) {
    const controller = new AuditReportController(this.elements.auditModal);
    controller.render(params);
    this.elements.auditModal.classList.remove('hidden');
  }

  /**
   * Hide audit modal.
   */
  _hideAuditModal() {
    this.elements.auditModal.classList.add('hidden');
    this.elements.auditModal.innerHTML = '';
  }

  /**
   * Show entry details.
   */
  _showEntryDetails(id) {
    const entry = this.passwordVault?.entries.find(e => e.id === id);
    if (!entry) return;

    // TODO: Implement entry detail view
    console.log('[PassVault] Show entry:', entry);
  }

  /**
   * Show add entry form.
   */
  _showAddEntry() {
    // TODO: Implement add entry form
    console.log('[PassVault] Show add entry');
  }

  /**
   * Show weak passwords list.
   */
  _showWeakPasswords() {
    if (!this.passwordVault) return;

    const weakEntries = this.passwordVault.entries.filter(
      e => e.audit?.isWeak || e.audit?.isReused || e.audit?.breached
    );

    this._renderPasswordList(weakEntries);
    this.elements.searchInput.value = '';
    this.elements.searchInput.placeholder = 'Showing passwords that need attention...';
  }

  /**
   * Show toast notification.
   */
  _showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  /**
   * Inject CSS into page.
   */
  _injectCSS(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Escape HTML.
   */
  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new PassVaultApp();
  app.init();
});
