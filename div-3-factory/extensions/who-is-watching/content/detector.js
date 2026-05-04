// ============================================================
// DETECTOR — Content Script
// Detects analytics vendors via script scanning and dynamic injection.
// Enhanced with GTM/Tealium awareness and behavioral detection.
// Runs in isolated world — relies on hook.js for deep inspection.
// ============================================================

(function() {
  'use strict';

  // Expanded vendor patterns with more coverage
  const VENDOR_PATTERNS = {
    // Adobe
    adobe_launch: {
      scripts: [/launch-.*\.min\.js/i, /satellite-.*\.js/i],
      domains: ['assets.adobedtm.com', 'launch.adobe.com']
    },
    adobe_alloy: {
      scripts: [/alloy.*\.js/i, /at\.js/i],
      domains: ['edge.adobedc.net', 'adobedc.net']
    },
    adobe_analytics: {
      scripts: [/AppMeasurement.*\.js/i, /s_code.*\.js/i],
      domains: ['omtrdc.net', '2o7.net', 'demdex.net']
    },

    // Google
    google_gtm: {
      scripts: [/gtm\.js/i, /gtag\/js/i],
      domains: ['googletagmanager.com'],
      globals: ['google_tag_manager', 'dataLayer']
    },
    google_analytics: {
      scripts: [/analytics\.js/i, /ga\.js/i],
      domains: ['google-analytics.com', 'analytics.google.com']
    },
    google_ga4: {
      scripts: [/gtag/i],
      domains: ['analytics.google.com/g/'],
      patterns: [/G-[A-Z0-9]+/]
    },

    // Marketing Automation
    marketo: {
      scripts: [/munchkin.*\.js/i, /marketo/i],
      domains: ['mktoresp.com', 'marketo.com', 'marketo.net'],
      globals: ['Munchkin']
    },
    hubspot: {
      scripts: [/hs-scripts\.com/i, /hs-analytics/i, /hubspot/i],
      domains: ['hubspot.com', 'hs-scripts.com', 'hs-analytics.net', 'hsforms.com'],
      globals: ['_hsq', 'HubSpotConversations']
    },
    pardot: {
      scripts: [/pardot\.com/i, /pi\.pardot/i],
      domains: ['pardot.com', 'pi.pardot.com'],
      globals: ['piTracker']
    },
    eloqua: {
      scripts: [/eloqua/i, /elqcfg/i],
      domains: ['eloqua.com', 'en25.com'],
      globals: ['_elqQ']
    },

    // Intent Data
    sixsense: {
      scripts: [/6sense/i, /6sc\.co/i],
      domains: ['6sense.com', 'j.6sc.co', '6si.co'],
      globals: ['_6si']
    },
    bombora: {
      scripts: [/bombora/i, /ml314/i],
      domains: ['bombora.com', 'ml314.com'],
      globals: ['_bmb']
    },
    demandbase: {
      scripts: [/demandbase/i, /tag\.demandbase/i],
      domains: ['demandbase.com', 'tag.demandbase.com'],
      globals: ['Demandbase']
    },
    clearbit: {
      scripts: [/clearbit/i, /reveal\.clearbit/i],
      domains: ['clearbit.com', 'x.clearbitjs.com'],
      globals: ['clearbit']
    },
    zoominfo: {
      scripts: [/zoominfo/i, /ws\.zoominfo/i],
      domains: ['zoominfo.com', 'ws.zoominfo.com'],
      globals: ['ZoomInfo']
    },

    // Analytics Platforms
    segment: {
      scripts: [/segment/i, /analytics\.js/i],
      domains: ['segment.io', 'segment.com', 'cdn.segment.com'],
      globals: ['analytics']
    },
    mixpanel: {
      scripts: [/mixpanel/i],
      domains: ['mixpanel.com', 'api.mixpanel.com', 'cdn.mxpnl.com'],
      globals: ['mixpanel']
    },
    amplitude: {
      scripts: [/amplitude/i],
      domains: ['amplitude.com', 'cdn.amplitude.com'],
      globals: ['amplitude']
    },
    heap: {
      scripts: [/heap/i, /heapanalytics/i],
      domains: ['heap.io', 'heapanalytics.com'],
      globals: ['heap']
    },
    fullstory: {
      scripts: [/fullstory/i],
      domains: ['fullstory.com', 'rs.fullstory.com'],
      globals: ['FS']
    },
    hotjar: {
      scripts: [/hotjar/i],
      domains: ['hotjar.com', 'static.hotjar.com'],
      globals: ['hj', 'hjSiteSettings']
    },
    clarity: {
      scripts: [/clarity/i],
      domains: ['clarity.ms'],
      globals: ['clarity']
    },
    logrocket: {
      scripts: [/logrocket/i],
      domains: ['logrocket.com', 'cdn.logrocket.io'],
      globals: ['LogRocket']
    },

    // Advertising Pixels
    facebook_pixel: {
      scripts: [/fbevents\.js/i, /connect\.facebook/i],
      domains: ['connect.facebook.net', 'facebook.com/tr'],
      globals: ['fbq', '_fbq']
    },
    linkedin_insight: {
      scripts: [/snap\.licdn/i, /linkedin/i],
      domains: ['linkedin.com/px', 'snap.licdn.com', 'linkedin.com/li/'],
      globals: ['_linkedin_data_partner_ids']
    },
    twitter_pixel: {
      scripts: [/static\.ads-twitter/i],
      domains: ['ads.twitter.com', 'analytics.twitter.com', 't.co'],
      globals: ['twq']
    },
    pinterest_tag: {
      scripts: [/pintrk/i],
      domains: ['ct.pinterest.com'],
      globals: ['pintrk']
    },
    tiktok_pixel: {
      scripts: [/analytics\.tiktok/i],
      domains: ['analytics.tiktok.com'],
      globals: ['ttq']
    },
    bing_ads: {
      scripts: [/bat\.bing/i],
      domains: ['bat.bing.com'],
      globals: ['uetq']
    },

    // Consent Management
    onetrust: {
      scripts: [/otSDKStub/i, /optanon/i, /onetrust/i],
      domains: ['onetrust.com', 'cookielaw.org', 'cookiepro.com'],
      globals: ['Optanon', 'OneTrust']
    },
    trustarc: {
      scripts: [/trustarc/i, /consent\.trustarc/i],
      domains: ['trustarc.com', 'truste.com'],
      globals: ['truste']
    },
    cookiebot: {
      scripts: [/cookiebot/i],
      domains: ['cookiebot.com', 'cookiebot.eu'],
      globals: ['Cookiebot']
    },

    // Chat/Support
    intercom: {
      scripts: [/intercom/i],
      domains: ['intercom.io', 'widget.intercom.io'],
      globals: ['Intercom']
    },
    drift: {
      scripts: [/drift/i, /driftt/i],
      domains: ['drift.com', 'js.driftt.com'],
      globals: ['drift', 'driftt']
    },
    zendesk: {
      scripts: [/zendesk/i, /zdassets/i],
      domains: ['zendesk.com', 'zdassets.com'],
      globals: ['zE', 'Zendesk']
    },

    // Tag Managers
    tealium: {
      scripts: [/utag\.js/i, /tealium/i, /tags\.tiqcdn/i],
      domains: ['tags.tiqcdn.com', 'tealium.com'],
      globals: ['utag', 'utag_data']
    },
    ensighten: {
      scripts: [/ensighten/i, /nexus\.ensighten/i],
      domains: ['ensighten.com', 'nexus.ensighten.com'],
      globals: ['Bootstrapper']
    }
  };

  const detectedVendors = new Set();
  const tagManagersDetected = new Set();
  let pendingRescan = false;

  // Category mapping
  const VENDOR_CATEGORIES = {
    adobe_launch: 'analytics', adobe_alloy: 'analytics', adobe_analytics: 'analytics',
    google_gtm: 'tag_manager', google_analytics: 'analytics', google_ga4: 'analytics',
    marketo: 'marketing', hubspot: 'marketing', pardot: 'marketing', eloqua: 'marketing',
    sixsense: 'intent', bombora: 'intent', demandbase: 'intent', clearbit: 'intent', zoominfo: 'intent',
    segment: 'analytics', mixpanel: 'analytics', amplitude: 'analytics', heap: 'analytics',
    fullstory: 'analytics', hotjar: 'analytics', clarity: 'analytics', logrocket: 'analytics',
    facebook_pixel: 'advertising', linkedin_insight: 'advertising', twitter_pixel: 'advertising',
    pinterest_tag: 'advertising', tiktok_pixel: 'advertising', bing_ads: 'advertising',
    onetrust: 'consent', trustarc: 'consent', cookiebot: 'consent',
    intercom: 'chat', drift: 'chat', zendesk: 'chat',
    tealium: 'tag_manager', ensighten: 'tag_manager'
  };

  // Human-readable names
  const VENDOR_NAMES = {
    adobe_launch: 'Adobe Launch', adobe_alloy: 'Adobe Web SDK', adobe_analytics: 'Adobe Analytics',
    google_gtm: 'Google Tag Manager', google_analytics: 'Google Analytics', google_ga4: 'Google Analytics 4',
    marketo: 'Marketo Munchkin', hubspot: 'HubSpot', pardot: 'Pardot', eloqua: 'Oracle Eloqua',
    sixsense: '6sense', bombora: 'Bombora', demandbase: 'Demandbase', clearbit: 'Clearbit', zoominfo: 'ZoomInfo',
    segment: 'Segment', mixpanel: 'Mixpanel', amplitude: 'Amplitude', heap: 'Heap',
    fullstory: 'FullStory', hotjar: 'Hotjar', clarity: 'Microsoft Clarity', logrocket: 'LogRocket',
    facebook_pixel: 'Facebook Pixel', linkedin_insight: 'LinkedIn Insight', twitter_pixel: 'Twitter/X Pixel',
    pinterest_tag: 'Pinterest Tag', tiktok_pixel: 'TikTok Pixel', bing_ads: 'Microsoft Ads',
    onetrust: 'OneTrust', trustarc: 'TrustArc', cookiebot: 'Cookiebot',
    intercom: 'Intercom', drift: 'Drift', zendesk: 'Zendesk',
    tealium: 'Tealium iQ', ensighten: 'Ensighten'
  };

  // Scan all script tags
  function scanScripts() {
    const scripts = document.querySelectorAll('script[src]');

    scripts.forEach(script => {
      const src = script.src.toLowerCase();
      scanSource(src, 'script');
    });

    // Also scan inline scripts for patterns
    document.querySelectorAll('script:not([src])').forEach(script => {
      const content = script.textContent || '';
      scanInlineScript(content);
    });
  }

  function scanSource(src, detectionType) {
    for (const [vendorKey, patterns] of Object.entries(VENDOR_PATTERNS)) {
      // Check script filename patterns
      if (patterns.scripts) {
        for (const pattern of patterns.scripts) {
          if (pattern.test(src)) {
            addVendor(vendorKey, detectionType, src);

            // Track tag managers for re-scanning
            if (vendorKey === 'google_gtm' || vendorKey === 'tealium' || vendorKey === 'ensighten') {
              tagManagersDetected.add(vendorKey);
              scheduleRescan();
            }
            return;
          }
        }
      }

      // Check domains
      if (patterns.domains) {
        for (const domain of patterns.domains) {
          if (src.includes(domain)) {
            addVendor(vendorKey, detectionType, src);

            if (vendorKey === 'google_gtm' || vendorKey === 'tealium' || vendorKey === 'ensighten') {
              tagManagersDetected.add(vendorKey);
              scheduleRescan();
            }
            return;
          }
        }
      }
    }
  }

  function scanInlineScript(content) {
    // Detect GTM container ID
    const gtmMatch = content.match(/GTM-[A-Z0-9]+/);
    if (gtmMatch) {
      addVendor('google_gtm', 'inline', gtmMatch[0]);
      tagManagersDetected.add('google_gtm');
      scheduleRescan();
    }

    // Detect GA4 measurement ID
    const ga4Match = content.match(/G-[A-Z0-9]+/);
    if (ga4Match) {
      addVendor('google_ga4', 'inline', ga4Match[0]);
    }

    // Detect UA property
    const uaMatch = content.match(/UA-\d+-\d+/);
    if (uaMatch) {
      addVendor('google_analytics', 'inline', uaMatch[0]);
    }

    // Detect Tealium
    if (content.includes('utag') || content.includes('tealium')) {
      addVendor('tealium', 'inline', 'utag detected');
      tagManagersDetected.add('tealium');
      scheduleRescan();
    }
  }

  // Schedule a rescan after tag manager loads its tags
  function scheduleRescan() {
    if (pendingRescan) return;
    pendingRescan = true;

    // Rescan at increasing intervals to catch lazy-loaded tags
    setTimeout(() => { pendingRescan = false; scanScripts(); }, 500);
    setTimeout(scanScripts, 1500);
    setTimeout(scanScripts, 3000);
    setTimeout(scanScripts, 5000);
  }

  // Add detected vendor
  function addVendor(vendorKey, detectionType, source) {
    const vendorId = `${vendorKey}`;

    if (detectedVendors.has(vendorId)) return;
    detectedVendors.add(vendorId);

    const scripts = [];
    if (source && source.startsWith('http')) {
      scripts.push(source);
    }

    chrome.runtime.sendMessage({
      type: 'VENDOR_DETECTED',
      payload: {
        name: VENDOR_NAMES[vendorKey] || vendorKey,
        key: vendorKey,
        category: VENDOR_CATEGORIES[vendorKey] || 'unknown',
        detectionMethod: detectionType,
        source: source,
        scripts: scripts,
        isTagManagerLoaded: tagManagersDetected.size > 0,
        timestamp: Date.now()
      }
    });
  }

  // MutationObserver for dynamic script injection
  const observer = new MutationObserver((mutations) => {
    let foundNewScript = false;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeName === 'SCRIPT') {
          foundNewScript = true;

          if (node.src) {
            scanSource(node.src.toLowerCase(), 'dynamic');

            // Log dynamic injection for debugging
            console.log('[who-is-watching] Dynamic script:', node.src);
          } else if (node.textContent) {
            scanInlineScript(node.textContent);
          }
        }

        // Also check for iframes (some trackers inject via iframe)
        if (node.nodeName === 'IFRAME') {
          const src = node.src?.toLowerCase() || '';
          for (const [vendorKey, patterns] of Object.entries(VENDOR_PATTERNS)) {
            if (patterns.domains?.some(d => src.includes(d))) {
              addVendor(vendorKey, 'iframe', src);
              break;
            }
          }
        }
      }
    }

    // If a tag manager is active and new scripts were found, rescan
    if (foundNewScript && tagManagersDetected.size > 0) {
      setTimeout(scanScripts, 100);
    }
  });

  // Start observing
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Initial detection
  function detect() {
    scanScripts();
  }

  // Run detection at appropriate times
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detect);
  } else {
    detect();
  }

  // Multiple delayed scans to catch lazy-loaded scripts
  setTimeout(detect, 1000);
  setTimeout(detect, 2500);
  setTimeout(detect, 5000);
  setTimeout(detect, 10000);

  console.log('[who-is-watching] Enhanced detector initialized');
})();
