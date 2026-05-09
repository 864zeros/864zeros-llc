// ============================================================
// SERVICE WORKER — Who Is Watching (Side Panel Extension)
// Message router between content scripts and side panel.
// Extracts identities from network requests and cookies.
// All listeners at TOP LEVEL per MV3 requirements.
// ============================================================

// --- Event Deduplication ---
// Prevents duplicate events from being broadcast within a short window
const dedupCache = new Map();
const DEDUP_WINDOW_MS = 3000; // 3 second window

function isDuplicate(message) {
  // Create a unique key from message content
  const key = `${message.type}-${message.payload?.vendor || message.payload?.vendorKey || ''}-${message.payload?.name || message.payload?.url?.substring(0, 50) || ''}`;
  const now = Date.now();

  // Clean old entries periodically
  if (dedupCache.size > 100) {
    for (const [k, v] of dedupCache) {
      if (now - v > DEDUP_WINDOW_MS) dedupCache.delete(k);
    }
  }

  // Check if we've seen this recently
  if (dedupCache.has(key) && now - dedupCache.get(key) < DEDUP_WINDOW_MS) {
    return true;
  }

  dedupCache.set(key, now);
  return false;
}

// --- Panel Behavior ---
// Opens the side panel when the user clicks the toolbar icon.
// REQUIRED: This cannot be set in the manifest — only via API.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[who-is-watching] Panel behavior error:', error));

// --- Install / Update ---
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.local.set({
      wiw_initialized: true,
      wiw_settings: {
        captureNetwork: true,
        captureIdentity: true,
        captureDataLayer: true
      }
    });
    console.log('[who-is-watching] Extension installed. Default state set.');
  }
  if (reason === 'update') {
    console.log('[who-is-watching] Extension updated.');
  }
});

// ============================================================
// IDENTITY EXTRACTION
// ============================================================

/**
 * Extract identity from network request URL/body
 */
function extractIdentitiesFromRequest(msg) {
  const identities = [];
  const body = msg.payload?.body || msg.body || '';
  const url = msg.payload?.url || msg.url || '';
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body || '');

  // Google Analytics CID (Client ID)
  const cidMatch = url.match(/[?&]cid=([^&]+)/) || bodyStr.match(/[?&]cid=([^&]+)/);
  if (cidMatch) {
    identities.push({
      type: 'GA_CID',
      value: decodeURIComponent(cidMatch[1]),
      source: 'network_request',
      vendor: 'google_analytics'
    });
  }

  // Google Analytics User ID
  const uidMatch = url.match(/[?&]uid=([^&]+)/) || bodyStr.match(/[?&]uid=([^&]+)/);
  if (uidMatch) {
    identities.push({
      type: 'USER_ID',
      value: decodeURIComponent(uidMatch[1]),
      source: 'network_request',
      vendor: 'google_analytics'
    });
  }

  // Adobe MID (Marketing Cloud ID / ECID)
  const midMatch = url.match(/[?&]mid=([^&]+)/) || bodyStr.match(/mid[=:]([^&"]+)/i);
  if (midMatch) {
    identities.push({
      type: 'ECID',
      value: decodeURIComponent(midMatch[1]),
      source: 'network_request',
      vendor: 'adobe'
    });
  }

  // Adobe MCID in payload
  const mcidMatch = bodyStr.match(/mcid[=:]([^&"]+)/i) || bodyStr.match(/marketingCloudVisitorId[=:]"?([^&"]+)/i);
  if (mcidMatch) {
    identities.push({
      type: 'ECID',
      value: decodeURIComponent(mcidMatch[1]),
      source: 'network_request',
      vendor: 'adobe'
    });
  }

  // Segment anonymousId
  const anonIdMatch = bodyStr.match(/"anonymousId"\s*:\s*"([^"]+)"/);
  if (anonIdMatch) {
    identities.push({
      type: 'SEGMENT_ANON',
      value: anonIdMatch[1],
      source: 'network_request',
      vendor: 'segment'
    });
  }

  // Segment userId
  const segmentUserMatch = bodyStr.match(/"userId"\s*:\s*"([^"]+)"/);
  if (segmentUserMatch) {
    identities.push({
      type: 'USER_ID',
      value: segmentUserMatch[1],
      source: 'network_request',
      vendor: 'segment'
    });
  }

  // Mixpanel distinct_id
  const distinctIdMatch = bodyStr.match(/distinct_id[=:]"?([^&"]+)/i);
  if (distinctIdMatch) {
    identities.push({
      type: 'MIXPANEL_ID',
      value: decodeURIComponent(distinctIdMatch[1]),
      source: 'network_request',
      vendor: 'mixpanel'
    });
  }

  // 6sense company ID
  const sixSenseMatch = bodyStr.match(/company_id[=:]"?([^&"]+)/i);
  if (sixSenseMatch) {
    identities.push({
      type: '6SENSE_COMPANY',
      value: decodeURIComponent(sixSenseMatch[1]),
      source: 'network_request',
      vendor: '6sense'
    });
  }

  // Facebook fbp/fbc parameters
  const fbpMatch = url.match(/[?&]fbp=([^&]+)/) || bodyStr.match(/fbp[=:]"?([^&"]+)/i);
  if (fbpMatch) {
    identities.push({
      type: 'FB_BROWSER_ID',
      value: decodeURIComponent(fbpMatch[1]),
      source: 'network_request',
      vendor: 'facebook'
    });
  }

  return identities;
}

/**
 * Extract identity from cookie
 */
function extractIdentityFromCookie(msg) {
  const name = msg.payload?.name || msg.name || '';
  const value = msg.payload?.value || msg.value || '';

  if (!name || !value) return null;

  // Google Analytics _ga cookie
  if (name === '_ga' || name.startsWith('_ga_')) {
    // _ga format: GA1.2.XXXXXXXXXX.XXXXXXXXXX
    const parts = value.split('.');
    if (parts.length >= 4) {
      const cid = parts.slice(-2).join('.');
      return {
        type: 'GA_CID',
        value: cid,
        source: 'cookie',
        vendor: 'google_analytics'
      };
    }
  }

  // Google Analytics _gid cookie
  if (name === '_gid') {
    const parts = value.split('.');
    if (parts.length >= 4) {
      const gid = parts.slice(-2).join('.');
      return {
        type: 'GA_GID',
        value: gid,
        source: 'cookie',
        vendor: 'google_analytics'
      };
    }
  }

  // Adobe ECID - s_vi cookie
  if (name === 's_vi') {
    // s_vi format: [CS]v1|XXXXXXXX-XXXXXXXX[CE]
    const match = value.match(/\|([A-F0-9-]+)/i);
    if (match) {
      return {
        type: 'ECID',
        value: match[1],
        source: 'cookie',
        vendor: 'adobe'
      };
    }
  }

  // Adobe AMCV_ cookie (contains ECID)
  if (name.startsWith('AMCV_')) {
    // AMCV contains MCID in format MCID|XXXXXXXX
    const match = value.match(/MCMID\|(\d+)/);
    if (match) {
      return {
        type: 'ECID',
        value: match[1],
        source: 'cookie',
        vendor: 'adobe'
      };
    }
  }

  // 6sense _6si cookie
  if (name.startsWith('_6si')) {
    return {
      type: '6SENSE_ID',
      value: value,
      source: 'cookie',
      vendor: '6sense'
    };
  }

  // Facebook _fbp cookie
  if (name === '_fbp') {
    return {
      type: 'FB_BROWSER_ID',
      value: value,
      source: 'cookie',
      vendor: 'facebook'
    };
  }

  // Facebook _fbc cookie (click ID)
  if (name === '_fbc') {
    return {
      type: 'FB_CLICK_ID',
      value: value,
      source: 'cookie',
      vendor: 'facebook'
    };
  }

  // HubSpot hubspotutk
  if (name === 'hubspotutk') {
    return {
      type: 'HUBSPOT_UTK',
      value: value,
      source: 'cookie',
      vendor: 'hubspot'
    };
  }

  // Marketo _mkto_trk
  if (name === '_mkto_trk') {
    return {
      type: 'MARKETO_ID',
      value: value,
      source: 'cookie',
      vendor: 'marketo'
    };
  }

  // LinkedIn li_sugr
  if (name === 'li_sugr') {
    return {
      type: 'LINKEDIN_ID',
      value: value,
      source: 'cookie',
      vendor: 'linkedin'
    };
  }

  // Hotjar _hjid
  if (name === '_hjid') {
    return {
      type: 'HOTJAR_ID',
      value: value,
      source: 'cookie',
      vendor: 'hotjar'
    };
  }

  // Segment ajs_user_id
  if (name === 'ajs_user_id') {
    return {
      type: 'USER_ID',
      value: value,
      source: 'cookie',
      vendor: 'segment'
    };
  }

  // Segment ajs_anonymous_id
  if (name === 'ajs_anonymous_id') {
    return {
      type: 'SEGMENT_ANON',
      value: value.replace(/^"|"$/g, ''), // Remove quotes
      source: 'cookie',
      vendor: 'segment'
    };
  }

  return null;
}

/**
 * Broadcast identity detection to panel
 */
function broadcastIdentity(identity, tabId) {
  chrome.runtime.sendMessage({
    type: 'IDENTITY_DETECTED',
    payload: identity,
    tabId: tabId
  }).catch(() => {
    // Panel might not be open
  });
}

// ============================================================
// MESSAGE ROUTING
// ============================================================

// --- Content Script Messages ---
// Route messages from content scripts to the side panel via storage
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  const tabUrl = sender.tab?.url;

  // Skip deduplication for request/response messages
  const skipDedupTypes = ['GET_SETTINGS', 'INJECT_COMMAND'];

  // Check for duplicate event messages (not request/response types)
  if (message.type && !skipDedupTypes.includes(message.type) && isDuplicate(message)) {
    return false; // Skip duplicate
  }

  // Store the message for the panel to pick up
  if (message.type && tabId) {
    // Broadcast to any open panel
    chrome.runtime.sendMessage({
      ...message,
      tabId: tabId,
      tabUrl: tabUrl
    }).catch(() => {
      // Panel might not be open, that's ok
    });
  }

  // Extract identities from network requests
  if (message.type === 'NETWORK_REQUEST') {
    const identities = extractIdentitiesFromRequest(message);
    identities.forEach(identity => {
      broadcastIdentity(identity, tabId);
    });
  }

  // Extract identities from cookies
  if (message.type === 'COOKIE_SET') {
    const identity = extractIdentityFromCookie(message);
    if (identity) {
      broadcastIdentity(identity, tabId);
    }
  }

  // Handle settings request
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.local.get('wiw_settings', (result) => {
      sendResponse(result.wiw_settings || {});
    });
    return true;
  }

  // Handle inject commands from panel to content script
  if (message.type === 'INJECT_COMMAND' && message.tabId) {
    chrome.tabs.sendMessage(message.tabId, message).catch(err => {
      console.warn('[who-is-watching] Could not send to tab:', err);
    });
    sendResponse({ success: true });
    return true;
  }

  return false;
});

// ============================================================
// AUDIT MODE - Blocked Request Tracking
// ============================================================

// Vendor domain mapping (mirrors audit-controller.js)
// Comprehensive list including all known tracking endpoints
const AUDIT_VENDOR_DOMAINS = {
  '6sense': ['b.6sc.co', '6sense.com', '6si.com', 'j.6sc.co', '6sc.co'],
  'Adobe': [
    'omtrdc.net', 'demdex.net', 'adobedtm.com', '2o7.net', 'everesttech.net',
    'sc.omtrdc.net', 'dpm.demdex.net', 'sstats.adobe.com', 'tt.omtrdc.net'
  ],
  'Facebook': ['facebook.com', 'facebook.net', 'fbcdn.net', 'fb.com', 'connect.facebook.net'],
  'Google Analytics': [
    'google-analytics.com', 'analytics.google.com', 'stats.g.doubleclick.net',
    'www.google.com' // For /ccm/collect endpoint - will filter by path
  ],
  'Google Ads': ['doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'g.doubleclick.net'],
  'Google Tag Manager': ['googletagmanager.com'],
  'LinkedIn': ['ads.linkedin.com', 'licdn.com', 'linkedin.com', 'snap.licdn.com', 'px.ads.linkedin.com'],
  'Microsoft': ['clarity.ms', 'bat.bing.com', 'bat.bing.net', 'c.clarity.ms', 'o.clarity.ms', 'bing.com'],
  'Marketo': ['marketo.net', 'mktoresp.com', 'munchkin.marketo.net', 'mkto-ab.com'],
  'Hotjar': ['hotjar.com', 'hotjar.io', 'static.hotjar.com', 'vars.hotjar.com', 'script.hotjar.com'],
  'HubSpot': ['hubspot.com', 'hs-analytics.net', 'hsforms.com', 'hs-scripts.com', 'forms.hubspot.com'],
  'Segment': ['segment.io', 'segment.com', 'api.segment.io', 'cdn.segment.com'],
  'Mixpanel': ['mixpanel.com', 'api.mixpanel.com', 'cdn.mxpnl.com'],
  'Heap': ['heap-api.com', 'heapanalytics.com', 'cdn.heapanalytics.com'],
  'Amplitude': ['amplitude.com', 'api.amplitude.com', 'cdn.amplitude.com'],
  'Qualtrics': ['qualtrics.com', 'siteintercept.qualtrics.com', 'zn.qualtrics.com'],
  'Twitter/X Pixel': ['ads-twitter.com', 'analytics.twitter.com', 'static.ads-twitter.com'],
  'TrustArc': ['trustarc.com', 'truste.com', 'consensu.org', 'consent.trustarc.com'],
  'Akamai': ['akstat.io', 'go-mpulse.net', 'mpulse.net'],
  'Demandbase': ['demandbase.com', 'company-target.com', 'b2b-cdn.com'],
  'Bombora': ['bombora.com', 'ml314.com']
};

// First-party proxy patterns - subdomains used for CNAME cloaking
const FIRST_PARTY_PROXY_PATTERNS = [
  /^smetrics\./i,      // Adobe first-party
  /^metrics\./i,       // Generic metrics
  /^collect\./i,       // Collection endpoints
  /^tracking\./i,      // Tracking subdomains
  /^pixel\./i,         // Pixel subdomains
  /^data\./i,          // Data collection
  /^analytics\./i,     // Analytics subdomains
  /^t\./i,             // Tracking shorthand
  /^s\./i,             // Stats shorthand
];

/**
 * Check if hostname matches a domain pattern exactly
 * Handles both exact matches (hostname === domain) and subdomain matches (hostname.endsWith('.' + domain))
 */
function hostMatchesDomain(hostname, domain) {
  hostname = hostname.toLowerCase();
  domain = domain.toLowerCase();

  // Exact match
  if (hostname === domain) return true;

  // Subdomain match (e.g., 'www.facebook.com' matches 'facebook.com')
  if (hostname.endsWith('.' + domain)) return true;

  return false;
}

/**
 * Identify vendor from URL using proper hostname matching
 * Fixes false positives like 't.co' matching 'chatgpt.com'
 * Also detects first-party proxies (CNAME cloaking)
 */
function identifyVendorFromUrl(url) {
  let hostname, pathname;
  try {
    const urlObj = new URL(url);
    hostname = urlObj.hostname.toLowerCase();
    pathname = urlObj.pathname.toLowerCase();
  } catch {
    // Invalid URL
    return null;
  }

  // Check against known vendor domains
  for (const [vendor, domains] of Object.entries(AUDIT_VENDOR_DOMAINS)) {
    for (const domain of domains) {
      if (hostMatchesDomain(hostname, domain)) {
        return vendor;
      }
    }
  }

  // Check for first-party proxy patterns (CNAME cloaking)
  for (const pattern of FIRST_PARTY_PROXY_PATTERNS) {
    if (pattern.test(hostname)) {
      // Determine vendor based on URL path patterns
      if (pathname.includes('/b/ss/') || pathname.includes('/id') || pathname.includes('omtrdc')) {
        return 'Adobe';
      }
      if (pathname.includes('/collect') || pathname.includes('/__utm')) {
        return 'Google Analytics';
      }
      if (pathname.includes('/tr') || pathname.includes('/pixel')) {
        return 'Facebook';
      }
      return 'First-Party Proxy';
    }
  }

  // Fallback for Adobe path patterns
  if (pathname.includes('/b/ss/')) return 'Adobe';

  return null;
}

// Listen for blocked requests via declarativeNetRequest
// This fires when a rule from our audit mode blocks a request
if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    // Only process rules in our audit range (1000+)
    if (info.rule.ruleId >= 1000) {
      const vendor = identifyVendorFromUrl(info.request.url);

      console.log('[Audit] Rule matched:', info.rule.ruleId, vendor, info.request.url.substring(0, 60));

      // Broadcast to sidepanel
      chrome.runtime.sendMessage({
        type: 'AUDIT_BLOCK',
        payload: {
          ruleId: info.rule.ruleId,
          url: info.request.url,
          vendor: vendor,
          type: info.request.type,
          tabId: info.request.tabId,
          timestamp: Date.now()
        }
      }).catch(() => {
        // Panel might not be open
      });
    }
  });
  console.log('[who-is-watching] Audit mode: onRuleMatchedDebug listener registered');
} else {
  console.warn('[who-is-watching] Audit mode: onRuleMatchedDebug not available (requires unpacked extension or declarativeNetRequestFeedback permission)');
}

// ============================================================
// AUDIT MODE - Comprehensive Request Counting
// ============================================================

// Track all requests BEFORE they're blocked or completed
// This gives us accurate "attempted" counts
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const vendor = identifyVendorFromUrl(details.url);
    if (vendor) {
      console.log('[Audit] Request attempted:', vendor, details.url.substring(0, 60));

      // Broadcast to sidepanel - this counts as an "attempted" request
      chrome.runtime.sendMessage({
        type: 'AUDIT_ATTEMPT',
        payload: {
          url: details.url,
          vendor: vendor,
          type: details.type,
          tabId: details.tabId,
          timestamp: Date.now()
        }
      }).catch(() => {
        // Panel might not be open
      });
    }
  },
  { urls: ['<all_urls>'] },
  [] // No extra info needed
);

// Monitor for leak detection - requests that completed successfully
// This helps identify requests that bypassed blocking
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const vendor = identifyVendorFromUrl(details.url);
    if (vendor) {
      // This request completed successfully - potential leak if it should have been blocked
      chrome.runtime.sendMessage({
        type: 'AUDIT_LEAK_CHECK',
        payload: {
          url: details.url,
          vendor: vendor,
          type: details.type,
          tabId: details.tabId,
          statusCode: details.statusCode,
          timestamp: Date.now()
        }
      }).catch(() => {
        // Panel might not be open
      });
    }
  },
  { urls: ['<all_urls>'] }
);

console.log('[who-is-watching] Service worker loaded');
