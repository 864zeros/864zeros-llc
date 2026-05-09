// ============================================================
// SELECTORS — ScriptureScout Extraction Engine
// 864zeros LLC | Faith / Heritage pillar | Strike 012
// ============================================================
//
// Each profile describes the DOM selectors used to harvest
// passage text and metadata from a supported Bible-study site.
//
// PROFILE SHAPE (production)
// --------------------------
//   {
//     name:                string,
//     domain:              string,         // e.g., 'biblegateway.com'
//     profile_version:     semver,
//     verified_at:         ISO date | null,
//     selectors: {
//       container:         CSS selector,   // outer passage container
//       title:             CSS selector,   // passage reference / heading
//       translation:       CSS selector,   // translation name
//       noise:             [CSS selectors] // elements to PURGE before markdown conversion
//     },
//     metadata_extractor:  (document) => { reference, translation, timestamp, ... }
//   }
//
// USAGE — service worker
// ----------------------
//   import { SELECTOR_PROFILES, getProfileForUrl } from '../scripts/selectors.js';
//   const profile = getProfileForUrl(captureUrl);
//   const noise = profile?.selectors?.noise || [];
//
// USAGE — content script (marquee)
// --------------------------------
//   The content script CANNOT import ESM. It carries a duplicate
//   subset of these selectors. Keep in sync — see content/marquee.js.
// ============================================================

export const SELECTOR_PROFILES = {
  'biblegateway.com': {
    name: 'BibleGateway',
    domain: 'biblegateway.com',
    profile_version: '1.0.0',
    verified_at: '2026-05-08',
    unit: { singular: 'passage', plural: 'passages' },
    selectors: {
      container: '.passage-content',
      title: '.passage-display-tab',
      translation: '.translation-name',
      // Elements to PURGE before markdown conversion
      noise: [
        '.footnote',
        '.crossreference',
        '.bibleref',
        '.passage-other-trans',
        '.versenum',
        '.chapternum'
      ]
    },
    metadata_extractor: (doc) => ({
      // Defensive optional-chaining (?.textContent?.trim()) survives any
      // DOM context — jsdom, real Chrome, future runtimes. textContent is
      // universally implemented; innerText can be undefined in test DOMs.
      reference: doc.querySelector('.passage-display-tab')?.textContent?.trim(),
      translation: doc.querySelector('.translation-name')?.textContent?.replace(/[()]/g, '').trim(),
      timestamp: new Date().toISOString()
    }),
    notes: 'v1 wedge target. Production-grade selectors verified 2026-05-08.'
  },

  'blueletterbible.org': {
    name: 'Blue Letter Bible',
    domain: 'blueletterbible.org',
    profile_version: '1.0.0',
    verified_at: '2026-05-08',
    unit: { singular: 'verse', plural: 'verses' },
    selectors: {
      container: '.verse-text',
      title: '.verse-ref',
      translation: '.translation-id',
      noise: ['.footnote-marker', 'sup.versenum', '.strongs-num']
    },
    metadata_extractor: (doc) => ({
      // Defensive optional-chaining (?.textContent?.trim()) for cross-DOM safety.
      reference: doc.querySelector('.verse-ref')?.textContent?.trim(),
      translation: doc.querySelector('.translation-id')?.textContent?.trim() || 'KJV',
      timestamp: new Date().toISOString()
    }),
    notes: 'Strong’s concordance + public-domain commentary corpus. Production v1.'
  },

  'biblehub.com': {
    name: 'Bible Hub',
    domain: 'biblehub.com',
    profile_version: '1.0.0',
    verified_at: '2026-05-08',
    // Variant-aware: interlinear pages get tabular GFM output;
    // standard passage pages render as plain markdown.
    unit: { singular: 'word', plural: 'words' },     // primary use case = interlinear
    unit_standard: { singular: 'passage', plural: 'passages' },
    selectors: {
      container: '.interlinear',                      // primary target (interlinear pages)
      container_standard: '.chap',                    // fallback for non-interlinear pages
      title: '.chap',
      translation: null,
      noise: ['.pos', '.parsing', '.cross-ref-section']
    },
    detect_variant: (urlPathname) =>
      String(urlPathname || '').includes('/interlinear/') ? 'interlinear' : 'standard',
    metadata_extractor: (doc) => {
      // doc is the page Document; called from content script (marquee.js).
      const path = (doc && doc.location ? doc.location.pathname : (typeof window !== 'undefined' ? window.location.pathname : '')) || '';
      return {
        reference: doc.querySelector('.chap')?.textContent?.trim() || (doc.title || '').trim(),
        pageVariant: path.includes('/interlinear/') ? 'interlinear' : 'standard',
        timestamp: new Date().toISOString()
      };
    },
    notes: 'Interlinear pages produce GFM tables in markdown-converter (heritage logic, RULE-002 sanitization-after). Standard passage pages fall back to htmlToMarkdown.'
  }
};

/**
 * Resolve a selector profile from a URL by hostname match.
 * @param {string} url
 * @returns {object|null}
 */
export function getProfileForUrl(url) {
  if (!url) return null;
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const profile of Object.values(SELECTOR_PROFILES)) {
    if (host === profile.domain || host.endsWith('.' + profile.domain)) {
      return profile;
    }
  }
  return null;
}

export function listSupportedDomains() {
  return Object.values(SELECTOR_PROFILES).map((p) => p.domain);
}

export function isSupported(url) {
  const p = getProfileForUrl(url);
  // Only "supported" if the profile has real selectors (not a stub)
  return !!(p && p.selectors && p.selectors.container);
}
