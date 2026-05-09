// ============================================================
// AUDIT CONTROLLER — Who Is Watching
// Handles tracker blocking and leak detection for audit mode.
// ============================================================

// Vendor to domain mapping for blocking
// Comprehensive list including all known tracking endpoints
const VENDOR_DOMAINS = {
  '6sense': ['b.6sc.co', '6sense.com', '6si.com', 'j.6sc.co', '6sc.co'],
  'Adobe': [
    'omtrdc.net', 'demdex.net', 'adobedtm.com', '2o7.net', 'everesttech.net',
    'sc.omtrdc.net', 'dpm.demdex.net', 'sstats.adobe.com', 'tt.omtrdc.net'
  ],
  'Facebook': ['facebook.com', 'facebook.net', 'fbcdn.net', 'fb.com', 'connect.facebook.net'],
  'Google Analytics': [
    'google-analytics.com', 'analytics.google.com', 'stats.g.doubleclick.net',
    'www.google.com' // For /ccm/collect endpoint - filtered by path
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

// First-party proxy patterns - these are subdomains used for CNAME cloaking
// Format: regex patterns to match against hostnames
const FIRST_PARTY_PROXY_PATTERNS = [
  /^smetrics\./i,      // Adobe first-party (smetrics.sap.com, smetrics.adobe.com)
  /^metrics\./i,       // Generic metrics subdomain
  /^collect\./i,       // Collection endpoints
  /^tracking\./i,      // Tracking subdomains
  /^pixel\./i,         // Pixel subdomains
  /^data\./i,          // Data collection
  /^analytics\./i,     // Analytics subdomains (when not the main site)
  /^t\./i,             // Tracking shorthand (t.company.com)
  /^s\./i,             // Stats shorthand (s.company.com)
];

export class AuditController {
  constructor() {
    this.blockedVendors = new Set();
    this.attemptedRequests = []; // ALL tracking requests (via onBeforeRequest)
    this.blockedRequests = [];   // Confirmed blocked (via onRuleMatchedDebug)
    this.leakedRequests = [];    // Confirmed leaks (via onCompleted)
    this.sessionStart = null;
    this.sessionEnd = null;
    this.auditedUrl = null;
    this.ruleIds = [];
    this.isActive = false;
    this.onLeakDetected = null; // Callback for leak notifications
    this.onBlockDetected = null; // Callback for block notifications
  }

  async startAudit(blockList, tabUrl) {
    if (this.isActive) {
      console.warn('[Audit] Already active, stopping previous audit');
      await this.stopAudit();
    }

    this.blockedVendors = new Set(blockList);
    this.attemptedRequests = []; // Reset all counts
    this.blockedRequests = [];
    this.leakedRequests = [];
    this.sessionStart = Date.now();
    this.sessionEnd = null; // Reset end time
    this.auditedUrl = tabUrl;
    this.isActive = true;
    this.ruleIds = []; // Reset rule IDs

    console.log('[Audit] Starting audit at', new Date(this.sessionStart).toISOString());
    console.log('[Audit] Blocking vendors:', blockList);

    // Inject blocking rules using declarativeNetRequest
    await this.injectBlockingRules(blockList);

    return {
      success: true,
      blockedVendors: Array.from(this.blockedVendors),
      ruleCount: this.ruleIds.length
    };
  }

  async injectBlockingRules(vendors) {
    const rules = [];
    let ruleId = 1000; // Start IDs at 1000 to avoid conflicts

    for (let vendorIndex = 0; vendorIndex < vendors.length; vendorIndex++) {
      const vendor = vendors[vendorIndex];
      const domains = VENDOR_DOMAINS[vendor] || this.guessDomains(vendor);

      for (let domainIndex = 0; domainIndex < domains.length; domainIndex++) {
        const domain = domains[domainIndex];

        // Create unique rule ID: 1000 + (vendorIndex * 100) + domainIndex
        const uniqueRuleId = 1000 + (vendorIndex * 100) + domainIndex;

        // Build urlFilter using || domain anchor format
        // This matches any URL where the domain contains this string
        const urlFilter = `||${domain}`;

        console.log(`[Audit] Rule ${uniqueRuleId}: ${urlFilter} (${vendor})`);

        rules.push({
          id: uniqueRuleId,
          priority: 1,
          action: { type: 'block' },
          condition: {
            urlFilter: urlFilter,
            resourceTypes: ['script', 'xmlhttprequest', 'image', 'sub_frame', 'ping', 'other']
          }
        });
        this.ruleIds.push(uniqueRuleId);
      }
    }

    if (rules.length > 0) {
      try {
        // First, remove any existing rules with these IDs
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: this.ruleIds,
          addRules: []
        });

        // Then add the new rules
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [],
          addRules: rules
        });
        console.log('[Audit] Successfully injected', rules.length, 'blocking rules');
      } catch (err) {
        console.error('[Audit] Failed to inject rules:', err);
        console.error('[Audit] Rules attempted:', JSON.stringify(rules, null, 2));
      }
    }
  }

  // Guess domains for unknown vendors
  guessDomains(vendor) {
    const key = vendor.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    return [
      `${key}.com`,
      `${key}.io`,
      `${key}.net`
    ];
  }

  // Called when a network request is observed (from webRequest API)
  onRequestObserved(details) {
    if (!this.isActive) return;

    const vendor = this.identifyVendorFromUrl(details.url);

    if (vendor) {
      if (this.blockedVendors.has(vendor)) {
        // This shouldn't happen if blocking rules work
        // But it means the request leaked through
        this.recordLeak(details, vendor, 'rule_bypass');
      } else {
        // Vendor not in block list but detected
        this.recordLeak(details, vendor, 'unblocked_vendor');
      }
    }
  }

  // Called when a request is blocked (from webRequest API)
  onRequestBlocked(details) {
    if (!this.isActive) return;

    const vendor = this.identifyVendorFromUrl(details.url);
    if (vendor) {
      this.blockedRequests.push({
        url: details.url,
        vendor: vendor,
        timestamp: Date.now()
      });

      if (this.onBlockDetected) {
        this.onBlockDetected({
          vendor,
          url: details.url,
          timestamp: Date.now()
        });
      }
    }
  }

  recordLeak(details, vendor, method) {
    const leak = {
      url: details.url,
      vendor: vendor,
      type: details.type,
      method: method,
      timestamp: Date.now()
    };

    this.leakedRequests.push(leak);

    if (this.onLeakDetected) {
      this.onLeakDetected(leak);
    }

    console.warn('[Audit] Leak detected:', vendor, method, details.url.substring(0, 60));
  }

  /**
   * Check if hostname matches a domain pattern exactly
   * Handles both exact matches and subdomain matches
   */
  hostMatchesDomain(hostname, domain) {
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
  identifyVendorFromUrl(url) {
    let hostname, pathname;
    try {
      const urlObj = new URL(url);
      hostname = urlObj.hostname.toLowerCase();
      pathname = urlObj.pathname.toLowerCase();
    } catch {
      // Invalid URL
      return null;
    }

    // Check against known vendor domains with proper hostname matching
    for (const [vendor, domains] of Object.entries(VENDOR_DOMAINS)) {
      for (const domain of domains) {
        if (this.hostMatchesDomain(hostname, domain)) {
          return vendor;
        }
      }
    }

    // Check for first-party proxy patterns (CNAME cloaking)
    // These are subdomains like smetrics.company.com that proxy to Adobe, etc.
    for (const pattern of FIRST_PARTY_PROXY_PATTERNS) {
      if (pattern.test(hostname)) {
        // Determine vendor based on URL path patterns
        if (pathname.includes('/b/ss/') || pathname.includes('/id') || pathname.includes('omtrdc')) {
          return 'Adobe'; // Adobe Analytics path patterns
        }
        if (pathname.includes('/collect') || pathname.includes('/__utm')) {
          return 'Google Analytics';
        }
        if (pathname.includes('/tr') || pathname.includes('/pixel')) {
          return 'Facebook';
        }
        // Generic first-party tracker
        return 'First-Party Proxy';
      }
    }

    // Fallback checks for specific path patterns
    if (hostname.includes('facebook.com') && pathname.includes('/tr')) return 'Facebook';
    if (pathname.includes('/b/ss/')) return 'Adobe'; // Adobe Analytics beacon path

    return null;
  }

  async stopAudit() {
    this.sessionEnd = Date.now();
    this.isActive = false;

    console.log('[Audit] Stopping audit at', new Date(this.sessionEnd).toISOString());

    // Clear all blocking rules
    if (this.ruleIds.length > 0) {
      try {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: this.ruleIds,
          addRules: []
        });
        console.log('[Audit] Removed', this.ruleIds.length, 'blocking rules');
      } catch (err) {
        console.error('[Audit] Failed to remove rules:', err);
      }
    }

    this.ruleIds = [];

    return this.generateReport();
  }

  generateReport() {
    // Use attemptedRequests for total count (from onBeforeRequest)
    // Fall back to blocked+leaked if attemptedRequests not populated
    const attempted = this.attemptedRequests?.length || (this.blockedRequests.length + this.leakedRequests.length);
    const blocked = this.blockedRequests.length;
    const leaked = this.leakedRequests.length;
    const blockRate = attempted > 0 ? ((blocked / attempted) * 100).toFixed(1) : '100.0';

    console.log('[Audit] Counts - Attempted:', attempted, 'Blocked:', blocked, 'Leaked:', leaked);

    // Ensure sessionEnd is set for accurate duration
    if (!this.sessionEnd && this.sessionStart) {
      this.sessionEnd = Date.now();
      console.log('[Audit] Setting sessionEnd to now:', this.sessionEnd);
    }

    // Calculate session duration safely
    let sessionDuration = 0;
    if (this.sessionStart && this.sessionEnd) {
      sessionDuration = Math.max(0, this.sessionEnd - this.sessionStart);
    } else if (this.sessionStart) {
      // Fallback: use current time
      sessionDuration = Math.max(0, Date.now() - this.sessionStart);
    }

    console.log('[Audit] Report - Start:', this.sessionStart, 'End:', this.sessionEnd, 'Duration:', sessionDuration, 'ms');

    let complianceStatus;
    if (parseFloat(blockRate) >= 95) {
      complianceStatus = 'COMPLIANT';
    } else if (parseFloat(blockRate) >= 70) {
      complianceStatus = 'PARTIAL';
    } else {
      complianceStatus = 'NON_COMPLIANT';
    }

    return {
      summary: {
        sessionDuration: sessionDuration,
        attemptedTrackers: attempted,
        blockedTrackers: blocked,
        leakedTrackers: leaked,
        blockRate: `${blockRate}%`,
        complianceStatus: complianceStatus
      },
      details: {
        blocked: Array.from(this.blockedVendors),
        blockedRequests: this.blockedRequests.slice(0, 100), // Limit for report size
        leaked: this.leakedRequests,
        leakMethods: this.categorizeLeakMethods()
      },
      timestamp: new Date().toISOString(),
      url: this.auditedUrl
    };
  }

  categorizeLeakMethods() {
    const methods = {};
    this.leakedRequests.forEach(r => {
      methods[r.method] = (methods[r.method] || 0) + 1;
    });
    return methods;
  }

  getStatus() {
    let duration = 0;
    if (this.isActive && this.sessionStart) {
      duration = Math.max(0, Date.now() - this.sessionStart);
    }

    return {
      isActive: this.isActive,
      blockedVendors: Array.from(this.blockedVendors),
      attemptedCount: this.attemptedRequests?.length || 0,
      blockedCount: this.blockedRequests.length,
      leakedCount: this.leakedRequests.length,
      duration: duration
    };
  }
}

// Singleton instance
export const auditController = new AuditController();

console.log('[who-is-watching] audit-controller.js loaded');
