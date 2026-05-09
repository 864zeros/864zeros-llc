// ============================================================
// constants.js — App Configuration for PlannerPress
// ============================================================

export const APP_SLUG = 'plannerpress';
export const APP_NAME = 'PlannerPress';
export const APP_BRAND = '864zeros';

export const STORAGE_KEYS = {
  settings: `${APP_SLUG}_settings`,
  tier: `${APP_SLUG}_tier`,
  lastSync: `${APP_SLUG}_last_sync`,
  initialized: `${APP_SLUG}_initialized`,
};

export const MESSAGE_TYPES = {
  TIER_CHANGED: 'TIER_CHANGED',
};

export const TIERS = {
  free:    { level: 0, price: 0 },
  pro:     { level: 1, price: 29.00 },
  studio:  { level: 2, price: 49.00 },
};

export const FEATURE_TIERS = {
  'planner-generation': 'free', // with limits
  'premium-themes': 'pro',
  'ai-listing-assistant': 'pro',
  'brand-kit': 'studio',
};

export const AI_CONFIG = {
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  maxTokens: 1000,
  temperature: 0.7,
};
