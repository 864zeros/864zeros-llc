// master-password.js - Zero-Knowledge Master Password Flow [DELTA]
// 864zeros Build: 864z-2026-004
//
// SECURITY DESIGN:
// - Master password is NEVER stored
// - Only the derived key is held in memory
// - Salt is stored, but useless without password
// - If user forgets password, data is UNRECOVERABLE (by design)

import { CryptoVault, SecureVaultStorage } from '../lib/crypto-vault.js';
import { recoveryPDF, RECOVERY_PREVIEW_CSS } from '../lib/recovery-pdf.js';
import { SECURITY, COPY } from '../lib/constants.js';

/**
 * Master Password Controller
 *
 * Manages the onboarding flow:
 * 1. Create master password
 * 2. Generate recovery PDF
 * 3. Initialize encrypted vault
 */
export class MasterPasswordController {
  constructor() {
    this.vault = new CryptoVault();
    this.storage = new SecureVaultStorage();
    this.vaultId = null;
    this.salt = null;

    // State
    this.currentStep = 'create'; // create | recovery | complete
  }

  /**
   * Initialize the controller and render UI.
   */
  async init(container) {
    this.container = container;

    // Check if vault already exists
    const vaults = await this.storage.list();
    if (vaults.length > 0) {
      // Vault exists, show unlock screen instead
      this.renderUnlockScreen();
      return;
    }

    this.renderCreatePassword();
  }

  /**
   * Render Step 1: Create Password
   */
  renderCreatePassword() {
    this.currentStep = 'create';

    this.container.innerHTML = `
      <div class="onboarding-container">
        <div class="onboarding-header">
          <div class="logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1>Create Your Master Password</h1>
          <p class="subtitle">${COPY.noRecovery}</p>
        </div>

        <form id="create-password-form" class="password-form">
          <div class="form-group">
            <label for="master-password">Master Password</label>
            <div class="password-input-wrapper">
              <input
                type="password"
                id="master-password"
                placeholder="Enter a strong password"
                autocomplete="new-password"
                required
              />
              <button type="button" class="toggle-visibility" aria-label="Show password">
                <svg class="icon-eye" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <div class="strength-meter">
              <div class="strength-bar" id="strength-bar"></div>
            </div>
            <div class="strength-label" id="strength-label">Enter a password</div>
          </div>

          <div class="form-group">
            <label for="confirm-password">Confirm Password</label>
            <input
              type="password"
              id="confirm-password"
              placeholder="Confirm your password"
              autocomplete="new-password"
              required
            />
            <div class="match-indicator" id="match-indicator"></div>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="acknowledge-no-recovery" required />
              <span class="checkmark"></span>
              <span class="checkbox-text">
                I understand: If I lose this password, my data <strong>cannot be recovered</strong>.
                There is no "forgot password."
              </span>
            </label>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" id="create-vault-btn" disabled>
              Create Vault
            </button>
          </div>
        </form>

        <div class="trust-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>${COPY.tagline}</span>
        </div>
      </div>
    `;

    this._attachPasswordListeners();
  }

  /**
   * Render Step 2: Recovery PDF
   */
  renderRecoveryStep() {
    this.currentStep = 'recovery';

    const previewHTML = recoveryPDF.generatePreviewHTML({
      vaultId: this.vaultId,
      salt: this.salt,
      createdAt: new Date()
    });

    this.container.innerHTML = `
      <style>${RECOVERY_PREVIEW_CSS}</style>
      <div class="onboarding-container">
        <div class="onboarding-header">
          <div class="step-indicator">Step 2 of 2</div>
          <h1>Save Your Recovery Key</h1>
          <p class="subtitle">
            Download and print this document. Store it somewhere safe
            (not on your computer). This is your <strong>ONLY backup option</strong>.
          </p>
        </div>

        <div class="recovery-preview-container">
          ${previewHTML}
        </div>

        <div class="form-actions recovery-actions">
          <button type="button" class="btn-secondary" id="download-pdf-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download PDF
          </button>
          <button type="button" class="btn-secondary" id="print-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print
          </button>
        </div>

        <div class="saved-confirmation">
          <label class="checkbox-label">
            <input type="checkbox" id="saved-recovery" />
            <span class="checkmark"></span>
            <span class="checkbox-text">
              I have saved or printed my recovery key
            </span>
          </label>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-primary" id="continue-btn" disabled>
            Continue to Vault
          </button>
        </div>
      </div>
    `;

    this._attachRecoveryListeners();
  }

  /**
   * Render unlock screen (for returning users).
   */
  renderUnlockScreen() {
    this.container.innerHTML = `
      <div class="onboarding-container unlock-container">
        <div class="onboarding-header">
          <div class="logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1>Unlock Your Vault</h1>
        </div>

        <form id="unlock-form" class="password-form">
          <div class="form-group">
            <label for="unlock-password">Master Password</label>
            <div class="password-input-wrapper">
              <input
                type="password"
                id="unlock-password"
                placeholder="Enter your master password"
                autocomplete="current-password"
                required
              />
              <button type="button" class="toggle-visibility" aria-label="Show password">
                <svg class="icon-eye" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <div class="error-message" id="unlock-error"></div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              Unlock
            </button>
          </div>
        </form>

        <div class="recovery-link">
          <a href="#" id="recover-vault-link">Recover from backup</a>
        </div>
      </div>
    `;

    this._attachUnlockListeners();
  }

  /**
   * Calculate password strength.
   */
  calculateStrength(password) {
    if (!password) return { score: 0, label: 'Enter a password', class: '' };

    let score = 0;

    // Length
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (password.length >= 16) score += 10;

    // Character variety
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 20;

    // Penalties
    if (/^[a-zA-Z]+$/.test(password)) score -= 10;
    if (/^[0-9]+$/.test(password)) score -= 20;
    if (/(.)\1{2,}/.test(password)) score -= 10;

    score = Math.max(0, Math.min(100, score));

    // Label
    let label, cls;
    if (score < SECURITY.PASSWORD_STRENGTH.WEAK) {
      label = 'Weak';
      cls = 'weak';
    } else if (score < SECURITY.PASSWORD_STRENGTH.MODERATE) {
      label = 'Moderate';
      cls = 'moderate';
    } else if (score < SECURITY.PASSWORD_STRENGTH.STRONG) {
      label = 'Strong';
      cls = 'strong';
    } else {
      label = 'Very Strong';
      cls = 'very-strong';
    }

    return { score, label, class: cls };
  }

  /**
   * Create the vault with master password.
   */
  async createVault(masterPassword) {
    try {
      // Generate vault ID
      this.vaultId = `vault_${crypto.randomUUID().slice(0, 12)}`;

      // Initialize crypto with master password
      this.salt = await this.vault.initialize(masterPassword);

      // Store salt in config
      await this.storage.open();

      // Success - move to recovery step
      this.renderRecoveryStep();
    } catch (error) {
      console.error('[MasterPassword] Vault creation failed:', error);
      throw error;
    }
  }

  /**
   * Complete onboarding.
   */
  async completeOnboarding() {
    // Create empty vault structure
    const emptyVault = {
      entries: [],
      secureNotes: [],
      paymentCards: [],
      identities: [],
      metadata: {
        createdAt: new Date().toISOString(),
        version: 1
      }
    };

    // Encrypt and save
    const encrypted = await this.vault.encrypt(emptyVault);
    await this.storage.save(this.vaultId, 'Default Vault', encrypted);

    // Store salt for future unlock
    localStorage.setItem('passvault_salt', btoa(String.fromCharCode.apply(null, this.salt)));
    localStorage.setItem('passvault_vault_id', this.vaultId);
    localStorage.setItem('passvault_onboarded', 'true');

    // Dispatch completion event
    window.dispatchEvent(new CustomEvent('passvault:onboarding-complete', {
      detail: { vaultId: this.vaultId }
    }));
  }

  /**
   * Attach event listeners for password creation.
   */
  _attachPasswordListeners() {
    const form = document.getElementById('create-password-form');
    const password = document.getElementById('master-password');
    const confirm = document.getElementById('confirm-password');
    const acknowledge = document.getElementById('acknowledge-no-recovery');
    const submitBtn = document.getElementById('create-vault-btn');
    const strengthBar = document.getElementById('strength-bar');
    const strengthLabel = document.getElementById('strength-label');
    const matchIndicator = document.getElementById('match-indicator');

    // Toggle password visibility
    this.container.querySelectorAll('.toggle-visibility').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    });

    // Password strength meter
    password.addEventListener('input', () => {
      const strength = this.calculateStrength(password.value);
      strengthBar.style.width = `${strength.score}%`;
      strengthBar.className = `strength-bar ${strength.class}`;
      strengthLabel.textContent = strength.label;
      this._validateForm();
    });

    // Password match check
    confirm.addEventListener('input', () => {
      if (confirm.value && password.value) {
        if (confirm.value === password.value) {
          matchIndicator.textContent = 'Passwords match';
          matchIndicator.className = 'match-indicator match';
        } else {
          matchIndicator.textContent = 'Passwords do not match';
          matchIndicator.className = 'match-indicator no-match';
        }
      } else {
        matchIndicator.textContent = '';
        matchIndicator.className = 'match-indicator';
      }
      this._validateForm();
    });

    // Checkbox
    acknowledge.addEventListener('change', () => {
      this._validateForm();
    });

    // Form validation
    this._validateForm = () => {
      const strength = this.calculateStrength(password.value);
      const isValid =
        strength.score >= SECURITY.PASSWORD_STRENGTH.MODERATE &&
        password.value === confirm.value &&
        acknowledge.checked;

      submitBtn.disabled = !isValid;
    };

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating Vault...';

      try {
        await this.createVault(password.value);
      } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Vault';
        alert('Failed to create vault: ' + error.message);
      }
    });
  }

  /**
   * Attach event listeners for recovery step.
   */
  _attachRecoveryListeners() {
    const downloadBtn = document.getElementById('download-pdf-btn');
    const printBtn = document.getElementById('print-btn');
    const savedCheckbox = document.getElementById('saved-recovery');
    const continueBtn = document.getElementById('continue-btn');

    downloadBtn.addEventListener('click', async () => {
      await recoveryPDF.download({
        vaultId: this.vaultId,
        salt: this.salt,
        createdAt: new Date()
      });
    });

    printBtn.addEventListener('click', () => {
      window.print();
    });

    savedCheckbox.addEventListener('change', () => {
      continueBtn.disabled = !savedCheckbox.checked;
    });

    continueBtn.addEventListener('click', async () => {
      continueBtn.disabled = true;
      continueBtn.textContent = 'Setting up...';

      try {
        await this.completeOnboarding();
        // Redirect to main app
        window.location.href = '../sidepanel/index.html';
      } catch (error) {
        continueBtn.disabled = false;
        continueBtn.textContent = 'Continue to Vault';
        alert('Setup failed: ' + error.message);
      }
    });
  }

  /**
   * Attach event listeners for unlock screen.
   */
  _attachUnlockListeners() {
    const form = document.getElementById('unlock-form');
    const password = document.getElementById('unlock-password');
    const errorDiv = document.getElementById('unlock-error');

    // Toggle visibility
    this.container.querySelector('.toggle-visibility').addEventListener('click', () => {
      password.type = password.type === 'password' ? 'text' : 'password';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorDiv.textContent = '';

      const storedSalt = localStorage.getItem('passvault_salt');
      const vaultId = localStorage.getItem('passvault_vault_id');

      if (!storedSalt || !vaultId) {
        errorDiv.textContent = 'No vault found. Please set up a new vault.';
        return;
      }

      try {
        const salt = Uint8Array.from(atob(storedSalt), c => c.charCodeAt(0));
        await this.vault.initialize(password.value, salt);

        // Try to decrypt vault to verify password
        const encrypted = await this.storage.load(vaultId);
        if (!encrypted) {
          throw new Error('Vault data not found');
        }

        await this.vault.decrypt(encrypted);

        // Success - redirect to main app
        window.location.href = '../sidepanel/index.html';
      } catch (error) {
        errorDiv.textContent = 'Incorrect password or corrupted vault.';
        password.value = '';
        password.focus();
      }
    });
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app');
  if (container) {
    const controller = new MasterPasswordController();
    controller.init(container);
  }
});
