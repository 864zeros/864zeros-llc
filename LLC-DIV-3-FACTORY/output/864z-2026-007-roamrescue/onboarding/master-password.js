// master-password.js - RoamRescue Onboarding
// 864z-2026-007

import { CryptoVault } from '../lib/crypto-vault.js';
import { STORAGE_KEYS, SECURITY } from '../lib/constants.js';

document.getElementById('master-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const password = document.getElementById('master-password').value;
  const confirm = document.getElementById('confirm-password').value;
  const errorDiv = document.getElementById('error-message');

  errorDiv.textContent = '';

  if (password !== confirm) {
    errorDiv.textContent = 'Passwords do not match';
    return;
  }

  if (password.length < 12) {
    errorDiv.textContent = 'Password must be at least 12 characters';
    return;
  }

  try {
    const vault = new CryptoVault();
    const { salt, vaultId } = await vault.initialize(password);

    // Store salt (not secret) and vault ID
    localStorage.setItem(STORAGE_KEYS.SALT, btoa(String.fromCharCode(...salt)));
    localStorage.setItem(STORAGE_KEYS.VAULT_ID, vaultId);
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');

    // Redirect to sidepanel
    window.location.href = '../sidepanel/index.html';
  } catch (error) {
    errorDiv.textContent = 'Failed to create vault: ' + error.message;
  }
});
