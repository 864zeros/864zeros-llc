/**
 * BRK-PRICING-001 - Standard Pricing Modal Brick
 * 864zeros Factory Standard Component
 *
 * Displays the "Upgrade to Pro" or "Lifetime License" modal with
 * standardized 864zeros LLC pricing tiers.
 *
 * USAGE:
 * ```javascript
 * import { PricingModalController } from '../lib/BRK-PRICING-001.js';
 *
 * const pricing = new PricingModalController({
 *   productName: 'PassVault',
 *   currentTier: 'free'
 * });
 *
 * pricing.show();
 * ```
 */

import {
  COMPANY_NAME,
  COPYRIGHT,
  MISSION,
  PRICING_TIERS,
  LEGAL_URLS
} from './864z-core.js';

/**
 * Pricing Modal Controller
 */
export class PricingModalController {
  constructor(config = {}) {
    this.config = {
      productName: 'App',
      currentTier: 'free',
      modalId: 'pricing-modal',
      onUpgrade: null,
      ...config
    };

    this.modal = null;
  }

  /**
   * Show the pricing modal
   */
  show() {
    this._createModal();
    this.modal.classList.remove('hidden');
    this.modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Hide the pricing modal
   */
  hide() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      this.modal.classList.remove('visible');
      document.body.style.overflow = '';
    }
  }

  /**
   * Create and inject the modal HTML
   * @private
   */
  _createModal() {
    // Remove existing modal if present
    const existing = document.getElementById(this.config.modalId);
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = this.config.modalId;
    modal.className = 'pricing-modal hidden';
    modal.innerHTML = this._generateHTML();

    document.body.appendChild(modal);
    this.modal = modal;

    // Attach event listeners
    this._attachListeners();
  }

  /**
   * Generate modal HTML
   * @private
   */
  _generateHTML() {
    const { FREE, PRO, LIFETIME } = PRICING_TIERS;

    return `
      <div class="pricing-overlay" data-close="true">
        <div class="pricing-container">
          <!-- Header -->
          <header class="pricing-header">
            <div class="pricing-brand">
              <span class="brand-logo">864</span>
              <span class="brand-name">zeros</span>
            </div>
            <button class="modal-close" id="pricing-close" title="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </header>

          <!-- Mission -->
          <div class="pricing-mission">
            <p>${MISSION}</p>
          </div>

          <!-- Tier Cards -->
          <div class="pricing-tiers">
            ${this._renderTierCard(FREE, 'free')}
            ${this._renderTierCard(PRO, 'pro')}
            ${this._renderTierCard(LIFETIME, 'lifetime')}
          </div>

          <!-- Trust Message -->
          <div class="pricing-trust">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Local-first. Zero-knowledge. Forever yours.</span>
          </div>

          <!-- Footer -->
          <footer class="pricing-footer">
            <div class="footer-links">
              <a href="${LEGAL_URLS.PRIVACY}" target="_blank" rel="noopener">Privacy</a>
              <span>·</span>
              <a href="${LEGAL_URLS.TERMS}" target="_blank" rel="noopener">Terms</a>
              <span>·</span>
              <a href="${LEGAL_URLS.SUPPORT}" target="_blank" rel="noopener">Support</a>
            </div>
            <div class="footer-copyright">${COPYRIGHT}</div>
          </footer>
        </div>
      </div>
    `;
  }

  /**
   * Render a single tier card
   * @private
   */
  _renderTierCard(tier, tierId) {
    const isCurrent = this.config.currentTier === tierId;
    const isPopular = tier.popular;
    const isBestValue = tier.badge === 'Best Value';

    let priceDisplay;
    if (tier.price === 0) {
      priceDisplay = '<span class="price-amount">Free</span>';
    } else if (tier.period === 'once') {
      priceDisplay = `<span class="price-amount">$${tier.price}</span><span class="price-period">one-time</span>`;
    } else {
      priceDisplay = `<span class="price-amount">$${tier.price}</span><span class="price-period">/${tier.period}</span>`;
    }

    return `
      <div class="tier-card ${isPopular ? 'popular' : ''} ${isBestValue ? 'best-value' : ''} ${isCurrent ? 'current' : ''}" data-tier="${tierId}">
        ${isBestValue ? '<div class="tier-badge">Best Value</div>' : ''}
        ${isPopular ? '<div class="tier-badge popular-badge">Most Popular</div>' : ''}

        <h3 class="tier-name">${tier.name}</h3>
        <p class="tier-description">${tier.description}</p>

        <div class="tier-price">
          ${priceDisplay}
        </div>

        <ul class="tier-features">
          ${tier.features.map(f => `<li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>${f}</li>`).join('')}
        </ul>

        <button class="btn ${tierId === 'lifetime' ? 'btn-accent' : tierId === 'pro' ? 'btn-primary' : 'btn-secondary'} btn-block tier-cta" data-tier="${tierId}" ${isCurrent ? 'disabled' : ''}>
          ${isCurrent ? 'Current Plan' : tier.cta}
        </button>
      </div>
    `;
  }

  /**
   * Attach event listeners
   * @private
   */
  _attachListeners() {
    // Close button
    this.modal.querySelector('#pricing-close')?.addEventListener('click', () => {
      this.hide();
    });

    // Click overlay to close
    this.modal.querySelector('.pricing-overlay')?.addEventListener('click', (e) => {
      if (e.target.dataset.close) {
        this.hide();
      }
    });

    // Tier CTA buttons
    this.modal.querySelectorAll('.tier-cta').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tier = e.target.dataset.tier;
        this._handleUpgrade(tier);
      });
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.hide();
      }
    });
  }

  /**
   * Handle upgrade click
   * @private
   */
  _handleUpgrade(tierId) {
    console.log(`[BRK-PRICING-001] Upgrade requested: ${tierId}`);

    if (this.config.onUpgrade) {
      this.config.onUpgrade(tierId, PRICING_TIERS[tierId.toUpperCase()]);
    } else {
      // Default behavior: open Gumroad or payment page
      const tier = PRICING_TIERS[tierId.toUpperCase()];
      if (tier.price > 0) {
        // Placeholder - replace with actual payment URL
        window.open(`https://864zeros.gumroad.com/${this.config.productName.toLowerCase()}-${tierId}`, '_blank');
      }
    }
  }
}

/**
 * Standard Pricing Modal CSS
 */
export const PRICING_MODAL_CSS = `
/* BRK-PRICING-001 Pricing Modal */
.pricing-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

.pricing-modal.visible {
  opacity: 1;
  visibility: visible;
}

.pricing-overlay {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.pricing-container {
  background: var(--bg-primary, #0a0a0f);
  border: 1px solid var(--border-color, #2a2a3a);
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.pricing-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #2a2a3a);
}

.pricing-brand {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.brand-logo {
  font-size: 24px;
  font-weight: 800;
  color: var(--accent-primary, #00d084);
}

.brand-name {
  font-size: 24px;
  font-weight: 300;
  color: var(--text-primary, #f0f0f5);
}

.pricing-mission {
  text-align: center;
  padding: 24px;
  color: var(--text-secondary, #a0a0b0);
  font-size: 14px;
  border-bottom: 1px solid var(--border-color, #2a2a3a);
}

.pricing-tiers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 24px;
}

.tier-card {
  background: var(--bg-secondary, #12121a);
  border: 1px solid var(--border-color, #2a2a3a);
  border-radius: 12px;
  padding: 24px;
  position: relative;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.tier-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent-primary, #00d084);
}

.tier-card.best-value {
  border-color: var(--accent-primary, #00d084);
  box-shadow: 0 0 30px rgba(0, 208, 132, 0.15);
}

.tier-card.popular {
  border-color: var(--status-info, #4080f0);
}

.tier-badge {
  position: absolute;
  top: -10px;
  right: 20px;
  background: var(--accent-primary, #00d084);
  color: var(--bg-primary, #0a0a0f);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 20px;
}

.tier-badge.popular-badge {
  background: var(--status-info, #4080f0);
  color: white;
}

.tier-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary, #f0f0f5);
}

.tier-description {
  font-size: 13px;
  color: var(--text-secondary, #a0a0b0);
  margin-bottom: 16px;
}

.tier-price {
  margin-bottom: 20px;
}

.price-amount {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary, #f0f0f5);
}

.price-period {
  font-size: 14px;
  color: var(--text-muted, #606070);
  margin-left: 4px;
}

.tier-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
}

.tier-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary, #a0a0b0);
  padding: 6px 0;
}

.tier-features svg {
  color: var(--accent-primary, #00d084);
  flex-shrink: 0;
}

.tier-cta {
  width: 100%;
}

.btn-accent {
  background: var(--accent-primary, #00d084);
  color: var(--bg-primary, #0a0a0f);
  font-weight: 600;
}

.btn-accent:hover {
  background: var(--accent-hover, #00f09a);
}

.pricing-trust {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: var(--accent-primary, #00d084);
  font-size: 13px;
  border-top: 1px solid var(--border-color, #2a2a3a);
}

.pricing-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color, #2a2a3a);
  text-align: center;
}

.pricing-footer .footer-links {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
}

.pricing-footer .footer-links a {
  color: var(--text-muted, #606070);
  text-decoration: none;
}

.pricing-footer .footer-links a:hover {
  color: var(--accent-primary, #00d084);
}

.pricing-footer .footer-links span {
  color: var(--text-muted, #606070);
}

.pricing-footer .footer-copyright {
  font-size: 11px;
  color: var(--text-muted, #606070);
}

.tier-card.current .tier-cta {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

/**
 * Inject pricing CSS into document
 */
export function injectPricingCSS() {
  if (document.getElementById('brk-pricing-001-css')) return;

  const style = document.createElement('style');
  style.id = 'brk-pricing-001-css';
  style.textContent = PRICING_MODAL_CSS;
  document.head.appendChild(style);
}

export default PricingModalController;
