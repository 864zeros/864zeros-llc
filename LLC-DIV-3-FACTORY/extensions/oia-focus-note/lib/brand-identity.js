/**
 * 864zeros Brand Identity (Strike 025)
 *
 * Canonical:        864z-build-kit/references/core/brand-identity.js
 * Per-extension:    extensions/{ext}/lib/brand-identity.js
 *
 * Single source of truth for cross-surface 864zeros brand copy. Today this is
 * just BRAND_MISSION — a founder-voice mission statement injected into any
 * options-page element with id="brand-mission" by lib/options-tier-init.js
 * (canonical script; distributed to all 12 extensions). Future canonical brand
 * strings (tagline, privacy attestation, pillar slogans, etc.) can live here.
 *
 * Update protocol (canonical): edit this file, then re-sync all 12 per-extension
 * lib/brand-identity.js copies. Mirror touched by GTM_BUILD_REPORT_TEMPLATE.md
 * header (ISD-DIV-5-EVOLUTION/templates/) — keep both in lockstep on copy changes.
 */

export const BRAND_MISSION = 'After 25 years in the web industry, and with the rise of AI, the founder knew it was time to create single-focused apps for real daily life and work challenges. Every app is simple by design, easy to use, and always private — because complex problems are best solved simply. No ads. No tracking. Your data stays yours.';
