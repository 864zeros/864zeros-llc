// app.js - RoamRescue Sidepanel Controller
// 864z-2026-007
// Uses BRK-UI-IMPORT-001 Standard Import Flow

import { APP_NAME, TARGET_SAAS, TARGET_PRICE, VAULT_STATE } from '../lib/constants.js';
import { ImportFlowController } from '../lib/BRK-UI-IMPORT-001.js';
import { PricingModalController, injectPricingCSS } from '../lib/BRK-PRICING-001.js';

/**
 * RoamRescue Application Controller
 */
class App {
  constructor() {
    this.state = VAULT_STATE.UNINITIALIZED;
    this.importFlow = null;
    this.pricingModal = null;
  }

  async init() {
    console.log(`[${APP_NAME}] Initializing...`);

    // Check onboarding status
    const isOnboarded = localStorage.getItem('roamrescue_onboarded');

    if (!isOnboarded) {
      window.location.href = '../onboarding/index.html';
      return;
    }

    // Initialize import flow (BRK-UI-IMPORT-001)
    this.importFlow = new ImportFlowController({
      modalId: 'import-modal',
      dropzoneId: 'import-dropzone',
      fileInputId: 'import-file-input',
      auditModalId: 'audit-modal',
      triggerBtnIds: ['start-import-btn', 'import-btn'],
      closeBtnId: 'import-modal-close',
      competitorName: TARGET_SAAS,
      competitorPrice: TARGET_PRICE,
      rescueNoun: 'items',
      onImport: async (file) => {
        return await this._handleImport(file);
      },
      onAuditComplete: () => {
        this._renderContent();
      }
    });

    this.importFlow.init();

    // Initialize pricing modal (BRK-PRICING-001)
    injectPricingCSS();
    this.pricingModal = new PricingModalController({
      productName: APP_NAME,
      currentTier: 'free',
      onUpgrade: (tier) => {
        console.log(`[${APP_NAME}] Upgrade to:`, tier);
      }
    });

    this._attachListeners();

    console.log(`[${APP_NAME}] Ready`);
  }

  _attachListeners() {
    document.getElementById('lock-btn')?.addEventListener('click', () => {
      this._lock();
    });

    // Upgrade link in footer
    document.getElementById('upgrade-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.pricingModal.show();
    });
  }

  async _handleImport(file) {
    console.log(`[${APP_NAME}] Processing import:`, file.name);

    // TODO: Implement actual parsing logic
    const content = await file.text();

    // Return audit result for the Aha Moment display
    return {
      totalImported: 0,
      auditSummary: {
        breached: 0,
        reused: 0,
        weak: 0
      }
    };
  }

  _renderContent() {
    console.log(`[${APP_NAME}] Rendering content`);
    // TODO: Implement content rendering
  }

  _lock() {
    console.log(`[${APP_NAME}] Locking vault`);
    // TODO: Implement lock
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
