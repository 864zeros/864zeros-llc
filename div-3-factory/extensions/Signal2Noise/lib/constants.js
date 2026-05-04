// ============================================================
// CONSTANTS — Signal2Noise
// All storage keys namespaced with app slug
// ============================================================

export const APP_SLUG = 'signal2noise';

export const STORAGE_KEYS = {
  SIGNALS: `${APP_SLUG}_signals`,
  SELECTED_RATIO: `${APP_SLUG}_selectedRatio`,
  INITIALIZED: `${APP_SLUG}_initialized`
};

export const LIMITS = {
  MAX_SIGNALS: 10,
  MIN_PILL_SIGNALS: 2,
  MAX_PILL_SIGNALS: 4,
  PILL_TITLE_LENGTH: 30,
  ACCORDION_TITLE_LENGTH: 50
};

export const RATIOS = ['80', '70', '60'];
