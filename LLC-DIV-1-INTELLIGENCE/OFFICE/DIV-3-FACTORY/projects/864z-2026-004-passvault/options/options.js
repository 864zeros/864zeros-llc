// options.js - PassVault Settings Controller
// 864zeros Build: 864z-2026-004

import { CryptoVault, SecureVaultStorage } from '../lib/crypto-vault.js';
import { recoveryPDF } from '../lib/recovery-pdf.js';

/**
 * Options Controller
 */
class OptionsController {
  constructor() {
    this.storage = new SecureVaultStorage();
    this.settings = {};
  }

  async init() {
    // Load current settings
    await this.loadSettings();

    // Attach event listeners
    this.attachListeners();

    console.log('[PassVault] Options initialized');
  }

  async loadSettings() {
    // Load from chrome.storage.local
    const stored = await chrome.storage.local.get('settings');
    this.settings = stored.settings || {
      autoLockTimeout: 15,
      clipboardTimeout: 30,
      breachCheck: false, // OPT-IN: Disabled by default per Z-Audit
      theme: 'dark',
      showStrength: true
    };

    // Apply to UI
    document.getElementById('auto-lock-timeout').value = this.settings.autoLockTimeout;
    document.getElementById('clipboard-timeout').value = this.settings.clipboardTimeout;
    document.getElementById('breach-check').checked = this.settings.breachCheck;
    document.getElementById('theme').value = this.settings.theme;
    document.getElementById('show-strength').checked = this.settings.showStrength;
  }

  async saveSettings() {
    await chrome.storage.local.set({ settings: this.settings });
    console.log('[PassVault] Settings saved');
  }

  attachListeners() {
    // Auto-lock timeout
    document.getElementById('auto-lock-timeout').addEventListener('change', (e) => {
      this.settings.autoLockTimeout = parseInt(e.target.value);
      this.saveSettings();
    });

    // Clipboard timeout
    document.getElementById('clipboard-timeout').addEventListener('change', (e) => {
      this.settings.clipboardTimeout = parseInt(e.target.value);
      this.saveSettings();
    });

    // Breach check toggle (requires permission request)
    document.getElementById('breach-check').addEventListener('change', async (e) => {
      const enabled = e.target.checked;

      if (enabled) {
        // Request optional permission for HIBP API
        try {
          const granted = await chrome.permissions.request({
            origins: ['https://api.pwnedpasswords.com/*']
          });

          if (!granted) {
            // Permission denied - revert checkbox
            e.target.checked = false;
            alert('Permission required for breach checking. The feature has been disabled.');
            return;
          }
        } catch (error) {
          console.error('[Options] Permission request failed:', error);
          e.target.checked = false;
          return;
        }
      }

      this.settings.breachCheck = enabled;
      this.saveSettings();

      // Notify user about the change
      if (enabled) {
        console.log('[Options] Breach checking enabled - k-anonymity mode');
      } else {
        console.log('[Options] Breach checking disabled');
      }
    });

    // Theme
    document.getElementById('theme').addEventListener('change', (e) => {
      this.settings.theme = e.target.value;
      this.saveSettings();
      // Apply theme change would go here
    });

    // Show strength toggle
    document.getElementById('show-strength').addEventListener('change', (e) => {
      this.settings.showStrength = e.target.checked;
      this.saveSettings();
    });

    // Export vault
    document.getElementById('export-vault').addEventListener('click', async () => {
      await this.exportVault();
    });

    // Download recovery PDF
    document.getElementById('download-recovery').addEventListener('click', async () => {
      await this.downloadRecoveryPDF();
    });

    // Import passwords
    document.getElementById('import-passwords').addEventListener('click', () => {
      // Open side panel for import
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.sidePanel.open({ tabId: tabs[0].id });
        }
      });
    });

    // Delete all data
    document.getElementById('delete-all').addEventListener('click', async () => {
      await this.deleteAllData();
    });
  }

  async exportVault() {
    const vaultId = localStorage.getItem('passvault_vault_id');
    if (!vaultId) {
      alert('No vault found to export.');
      return;
    }

    try {
      const backup = await this.storage.exportVault(vaultId);
      if (!backup) {
        alert('Failed to export vault.');
        return;
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `passvault-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  }

  async downloadRecoveryPDF() {
    const vaultId = localStorage.getItem('passvault_vault_id');
    const storedSalt = localStorage.getItem('passvault_salt');

    if (!vaultId || !storedSalt) {
      alert('No vault found.');
      return;
    }

    try {
      const salt = Uint8Array.from(atob(storedSalt), c => c.charCodeAt(0));
      await recoveryPDF.download({
        vaultId,
        salt,
        createdAt: new Date()
      });
    } catch (error) {
      alert('Failed to generate recovery PDF: ' + error.message);
    }
  }

  async deleteAllData() {
    const confirmed = confirm(
      'ARE YOU SURE?\n\n' +
      'This will permanently delete:\n' +
      '- All your saved passwords\n' +
      '- Your vault encryption key\n' +
      '- All settings\n\n' +
      'This action CANNOT be undone.\n\n' +
      'Type "DELETE" to confirm.'
    );

    if (!confirmed) return;

    const typed = prompt('Type DELETE to confirm:');
    if (typed !== 'DELETE') {
      alert('Deletion cancelled.');
      return;
    }

    try {
      // Clear IndexedDB
      await indexedDB.deleteDatabase('passvault_secure');

      // Clear localStorage
      localStorage.removeItem('passvault_vault_id');
      localStorage.removeItem('passvault_salt');
      localStorage.removeItem('passvault_onboarded');

      // Clear chrome.storage
      await chrome.storage.local.clear();
      await chrome.storage.sync.clear();

      alert('All data has been deleted. The extension will now reset.');

      // Redirect to onboarding
      window.location.href = '../onboarding/index.html';
    } catch (error) {
      alert('Delete failed: ' + error.message);
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const controller = new OptionsController();
  controller.init();
});
