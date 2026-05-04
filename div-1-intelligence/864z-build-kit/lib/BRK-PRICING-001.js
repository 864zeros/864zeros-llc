/**
 * BRK-PRICING-001 - Standard Pricing Modal Brick
 * 864zeros LLC Factory Standard Component
 *
 * A standardized pricing/upgrade modal for all 864zeros products.
 * Displays Free, Pro ($12/mo), and Lifetime ($150) tiers.
 *
 * USAGE:
 * ```javascript
 * import { PricingModalController } from '../lib/BRK-PRICING-001.js';
 *
 * const pricing = new PricingModalController({
 *   modalId: 'pricing-modal',
 *   productName: 'PassVault',
 *   competitorName: 'Dashlane',
 *   competitorPrice: 60,
 *   onSelectTier: (tier) => { console.log('Selected:', tier); }
 * });
 *
 * pricing.init();
 * pricing.open();
 * ```
 */

import {
  COMPANY_NAME,
  COPYRIGHT,
  PRICING_TIERS,
  LEGAL_URLS
} from './864z-core.js';

/**
 * Pricing Modal Controller
 */
export class PricingModalController {
  /**
   * @param {Object} config
   * @param {string} config.modalId - Modal element ID
   * @param {string} config.productName - Current product name
   * @param {string} config.competitorName - Competitor being compared
   * @param {number} config.competitorPrice - Competitor annual price
   * @param {Function} config.onSelectTier - Callback when tier selected
   * @param {string} config.triggerBtnId - Optional trigger button ID
   */
  constructor(config) {
    this.config = {
      modalId: 'pricing-modal',
      productName: 'Product',
      competitorName: 'Competitor',
      competitorPrice: 60,
      triggerBtnId: 'upgrade-btn',
      ...config
    };

    this.modal = null;
    this.isOpen = false;
  }

  /**
   * Initialize the pricing modal.
   */
  init() {
    this.modal = document.getElementById(this.config.modalId);

    if (!this.modal) {
      console.error('[BRK-PRICING-001] Modal element not found:', this.config.modalId);
      return false;
    }

    // Render content
    this.modal.innerHTML = this._generateHTML();

    // Attach event listeners
    this._attachListeners();

    // Trigger button
    const triggerBtn = document.getElementById(this.config.triggerBtnId);
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => this.open());
    }

    console.log('[BRK-PRICING-001] Pricing modal initialized');
    return true;
  }

  /**
   * Open the pricing modal.
   */
  open() {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    this.modal.classList.add('visible');
    this.isOpen = true;
  }

  /**
   * Close the pricing modal.
   */
  close() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    this.modal.classList.remove('visible');
    this.isOpen = false;
  }

  /**
   * Generate the pricing modal HTML.
   * @private
   */
  _generateHTML() {
    const { FREE, PRO, LIFETIME } = PRICING_TIERS;
    const savings = this.config.competitorPrice - (PRO.price * 12);

    return `
      <div class="pricing-modal-content">
        <header class="modal-header">
          <h3>Choose Your Plan</h3>
          <button class="modal-close" id="pricing-modal-close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>

        <div class="pricing-container">
          <div class="pricing-header">
            <h2>Upgrade ${this.config.productName}</h2>
            <p class="pricing-tagline">Local-first. Zero-knowledge. Forever yours.</p>
          </div>

          <div class="pricing-grid">
            <!-- Free Tier -->
            <div class="pricing-card" data-tier="free">
              <div class="tier-name">${FREE.name}</div>
              <div class="tier-description">${FREE.description}</div>
              <div class="tier-price">
                <span class="currency">$</span>
                <span class="amount">0</span>
                <span class="period">forever</span>
              </div>
              <ul class="tier-features">
                ${FREE.features.map(f => `<li>${f}</li>`).join('')}
              </ul>
              <button class="btn btn-secondary tier-cta" data-tier="free">
                ${FREE.cta}
              </button>
            </div>

            <!-- Pro Tier -->
            <div class="pricing-card popular" data-tier="pro">
              <div class="tier-name">${PRO.name}</div>
              <div class="tier-description">${PRO.description}</div>
              <div class="tier-price">
                <span class="currency">$</span>
                <span class="amount">${PRO.price}</span>
                <span class="period">/ month</span>
              </div>
              <ul class="tier-features">
                ${PRO.features.map(f => `<li>${f}</li>`).join('')}
              </ul>
              <button class="btn btn-primary tier-cta" data-tier="pro">
                ${PRO.cta}
              </button>
            </div>

            <!-- Lifetime Tier -->
            <div class="pricing-card lifetime" data-tier="lifetime">
              <span class="tier-badge">${LIFETIME.badge}</span>
              <div class="tier-name">${LIFETIME.name}</div>
              <div class="tier-description">${LIFETIME.description}</div>
              <div class="tier-price">
                <span class="currency">$</span>
                <span class="amount">${LIFETIME.price}</span>
                <span class="period">once</span>
              </div>
              <ul class="tier-features">
                ${LIFETIME.features.map(f => `<li>${f}</li>`).join('')}
              </ul>
              <button class="btn btn-primary tier-cta" data-tier="lifetime">
                ${LIFETIME.cta}
              </button>
            </div>
          </div>

          <!-- Comparison -->
          <div class="pricing-comparison">
            <p class="comparison-text">
              ${this.config.competitorName}:
              <span class="competitor-price">$${this.config.competitorPrice}/year</span>
              &nbsp;→&nbsp;
              ${this.config.productName} Pro:
              <span class="savings">$${PRO.price * 12}/year (save $${savings})</span>
            </p>
          </div>

          <!-- Guarantee -->
          <div class="money-back-guarantee">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            30-day money-back guarantee. No questions asked.
          </div>

          <!-- Footer -->
          <footer class="brand-footer compact mt-xl">
            <div class="footer-links">
              <a href="${LEGAL_URLS.PRIVACY}" target="_blank" rel="noopener">Privacy</a>
              <span class="footer-divider">·</span>
              <a href="${LEGAL_URLS.TERMS}" target="_blank" rel="noopener">Terms</a>
            </div>
            <div class="footer-copyright">${COPYRIGHT}</div>
          </footer>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners.
   * @private
   */
  _attachListeners() {
    // Close button
    this.modal.querySelector('#pricing-modal-close')?.addEventListener('click', () => {
      this.close();
    });

    // Tier selection buttons
    this.modal.querySelectorAll('.tier-cta').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tier = e.target.dataset.tier;
        this._handleTierSelect(tier);
      });
    });

    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
  }

  /**
   * Handle tier selection.
   * @private
   */
  _handleTierSelect(tierId) {
    console.log('[BRK-PRICING-001] Tier selected:', tierId);

    const tier = PRICING_TIERS[tierId.toUpperCase()];

    if (this.config.onSelectTier) {
      this.config.onSelectTier(tier);
    }

    // For free tier, just close
    if (tierId === 'free') {
      this.close();
      return;
    }

    // For paid tiers, dispatch event for payment flow
    window.dispatchEvent(new CustomEvent('pricing:select', {
      detail: { tier, tierId }
    }));
  }
}

/**
 * Standard Pricing Modal HTML Template
 */
export const PRICING_MODAL_HTML = `
<!-- Pricing Modal (BRK-PRICING-001) -->
<div class="pricing-modal hidden" id="pricing-modal"></div>
`;

/**
 * Quick upgrade banner component
 */
export function generateUpgradeBanner(productName, competitorPrice) {
  const savings = competitorPrice - (PRICING_TIERS.PRO.price * 12);

  return `
    <div class="upgrade-banner">
      <div class="upgrade-content">
        <div class="upgrade-text">
          <strong>Upgrade to Pro</strong>
          <span class="text-secondary">Save $${savings}/year vs ${productName}</span>
        </div>
        <button class="btn btn-primary btn-sm" id="upgrade-btn">
          $${PRICING_TIERS.PRO.price}/mo
        </button>
      </div>
    </div>
  `;
}

export default PricingModalController;
