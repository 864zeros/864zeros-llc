/**
 * 864z-core.js - 864zeros LLC Corporate Identity Constants
 *
 * IMMUTABLE BRAND CONSTANTS
 * These values are hardcoded and must not be modified per-product.
 * All 864zeros products inherit this corporate identity.
 */

// ============================================
// COMPANY IDENTITY
// ============================================

export const COMPANY_NAME = '864zeros LLC';
export const COMPANY_SHORT = '864zeros';
export const COPYRIGHT = '© 2026 864zeros LLC. All rights reserved.';
export const MISSION = 'Organize Your Internal Architecture (OIA)';
export const TAGLINE = 'Local-first. Zero-knowledge. Forever yours.';

// ============================================
// LEGAL URLS
// ============================================

export const LEGAL_URLS = {
  PRIVACY: 'https://864zeros.com/privacy',
  TERMS: 'https://864zeros.com/terms',
  SUPPORT: 'https://864zeros.com/support',
  HOME: 'https://864zeros.com'
};

export const PRIVACY_URL = LEGAL_URLS.PRIVACY;
export const TERMS_URL = LEGAL_URLS.TERMS;

// ============================================
// BRAND COLORS (CSS Custom Properties)
// ============================================

export const BRAND_COLORS = {
  PRIMARY: '#00d084',      // Trust Green
  SECONDARY: '#0a0a0f',    // Deep Black
  ACCENT: '#00f09a',       // Bright Green
  DANGER: '#f04040',
  WARNING: '#f0c020',
  SUCCESS: '#00d084'
};

// ============================================
// PRICING TIERS
// ============================================

export const PRICING_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    period: null,
    description: 'Basic Local Rescue',
    features: [
      'Unlimited local storage',
      'Zero-knowledge encryption',
      'Basic import/export',
      'No account required'
    ],
    cta: 'Get Started'
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 12,
    period: 'month',
    description: 'Advanced Sync & Automation',
    features: [
      'Everything in Free',
      'Cross-device sync',
      'Automated backups',
      'Priority support',
      'Advanced analytics'
    ],
    cta: 'Upgrade to Pro',
    popular: true
  },
  LIFETIME: {
    id: 'lifetime',
    name: 'Lifetime',
    price: 150,
    period: 'once',
    description: 'The Ransom-Free Forever License',
    features: [
      'Everything in Pro',
      'Pay once, own forever',
      'All future updates',
      'No subscription anxiety',
      'Support indie software'
    ],
    cta: 'Buy Lifetime License',
    badge: 'Best Value'
  }
};

// ============================================
// TRUST SIGNALS
// ============================================

export const TRUST_SIGNALS = {
  ZERO_KNOWLEDGE: 'Your data never leaves your device',
  NO_TRACKING: 'No analytics. No telemetry. No tracking.',
  OPEN_AUDIT: 'Security architecture available for review',
  LOCAL_FIRST: 'Works offline. No internet required.'
};

// ============================================
// FACTORY METADATA
// ============================================

export const FACTORY = {
  NAME: 'Vulture Nest',
  VERSION: '2.0',
  BUILD_KIT: '864z-build-kit',
  GENERATOR: 'Strike Bridge'
};

// ============================================
// STANDARD FOOTER HTML
// ============================================

export function generateFooterHTML(productName = '') {
  return `
    <footer class="app-footer brand-footer">
      <div class="footer-brand">
        <span class="footer-logo">864</span>
        <span class="footer-company">${COMPANY_SHORT}</span>
      </div>
      <div class="footer-links">
        <a href="${LEGAL_URLS.PRIVACY}" target="_blank" rel="noopener">Privacy</a>
        <span class="footer-divider">·</span>
        <a href="${LEGAL_URLS.TERMS}" target="_blank" rel="noopener">Terms</a>
        <span class="footer-divider">·</span>
        <a href="${LEGAL_URLS.SUPPORT}" target="_blank" rel="noopener">Support</a>
      </div>
      <div class="footer-copyright">${COPYRIGHT}</div>
    </footer>
  `;
}

// ============================================
// MANIFEST AUTHOR
// ============================================

export const MANIFEST_AUTHOR = {
  name: COMPANY_NAME,
  email: 'support@864zeros.com',
  url: LEGAL_URLS.HOME
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  COMPANY_NAME,
  COMPANY_SHORT,
  COPYRIGHT,
  MISSION,
  TAGLINE,
  LEGAL_URLS,
  PRIVACY_URL,
  TERMS_URL,
  BRAND_COLORS,
  PRICING_TIERS,
  TRUST_SIGNALS,
  FACTORY,
  MANIFEST_AUTHOR,
  generateFooterHTML
};
