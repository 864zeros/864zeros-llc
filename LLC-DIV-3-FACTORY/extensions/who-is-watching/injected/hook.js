// ============================================================
// HOOK — Behavioral Fingerprinting Engine
// Runs in PAGE CONTEXT with full access to page globals.
// Detects trackers by BEHAVIOR, not just URL patterns.
// Intercepts: fetch, XHR, beacon, pixels, cookies, canvas
// ============================================================

(function() {
  'use strict';

  const SOURCE_ID = 'who-is-watching';

  // --- State ---
  const state = {
    cookies: new Map(),        // Track all cookies set
    requests: [],              // All intercepted requests
    canvasReads: [],           // Canvas fingerprinting attempts
    injectedScripts: [],       // Dynamically injected scripts
    identities: new Map(),     // Detected identity tokens
    behaviorScores: new Map()  // Per-origin behavior scores
  };

  // --- Emit to Extension ---
  function emit(type, payload) {
    window.postMessage({
      source: SOURCE_ID,
      type: type,
      payload: payload
    }, '*');
  }

  // --- Listen for Commands ---
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== SOURCE_ID) return;
    if (event.data.type !== 'COMMAND') return;
    handleCommand(event.data.command, event.data.payload);
  });

  function handleCommand(command, payload) {
    switch (command) {
      case 'SPOOF_ECID':
        spoofECID(payload?.value || 'spoofed-ecid-' + Date.now());
        break;
      case 'BLOCK_ALLOY':
        blockAlloy();
        break;
      case 'FAKE_CONSENT':
        fakeConsent(payload?.groups || 'C0001,C0002,C0003,C0004');
        break;
      case 'GET_DATA_LAYERS':
        sendDataLayers();
        break;
      default:
        console.warn('[who-is-watching] Unknown command:', command);
    }
  }

  // ============================================================
  // BEHAVIORAL SIGNAL ANALYSIS
  // ============================================================

  const BEHAVIOR_SIGNALS = {
    PERSISTENT_ID: { weight: 20, desc: 'Sets persistent identity cookie (1yr+)' },
    SESSION_TRACKING: { weight: 15, desc: 'Session ID persists across pages' },
    INTERACTION_DATA: { weight: 25, desc: 'Collects mouse/click/scroll data' },
    DEVICE_FINGERPRINT: { weight: 30, desc: 'Device fingerprinting detected' },
    EXIT_TRACKING: { weight: 20, desc: 'Beacon sent on page unload' },
    CONVERSION_DATA: { weight: 20, desc: 'Revenue/product tracking' },
    HIGH_RES_TIMING: { weight: 15, desc: 'Microsecond precision timestamps' },
    CROSS_DOMAIN: { weight: 25, desc: 'Cross-domain tracking detected' },
    CANVAS_READ: { weight: 30, desc: 'Canvas fingerprinting detected' },
    FONT_PROBE: { weight: 25, desc: 'Font fingerprinting detected' },
    FORM_CAPTURE: { weight: 25, desc: 'Form field data captured' },
    PII_COLLECTION: { weight: 30, desc: 'Personal data collection' }
  };

  function analyzeRequestBehavior(url, options, body) {
    const signals = [];
    let confidence = 0;
    const urlLower = url.toLowerCase();
    const bodyStr = typeof body === 'string' ? body : safeStringify(body);

    // Check for interaction data
    if (bodyStr && /mouse|click|scroll|touch|keypress|cursor|coordinates|x_pos|y_pos/i.test(bodyStr)) {
      signals.push(BEHAVIOR_SIGNALS.INTERACTION_DATA);
      confidence += BEHAVIOR_SIGNALS.INTERACTION_DATA.weight;
    }

    // Check for device fingerprint data
    if (bodyStr && /screen|resolution|timezone|language|plugins|webgl|canvas|fonts|userAgent|platform|hardware/i.test(bodyStr)) {
      signals.push(BEHAVIOR_SIGNALS.DEVICE_FINGERPRINT);
      confidence += BEHAVIOR_SIGNALS.DEVICE_FINGERPRINT.weight;
    }

    // Check for conversion/revenue data
    if (bodyStr && /revenue|transaction|order|purchase|cart|product|sku|price|currency|conversion/i.test(bodyStr)) {
      signals.push(BEHAVIOR_SIGNALS.CONVERSION_DATA);
      confidence += BEHAVIOR_SIGNALS.CONVERSION_DATA.weight;
    }

    // Check for high-resolution timing
    if (bodyStr && /\d{13,}/.test(bodyStr)) { // Millisecond+ timestamps
      signals.push(BEHAVIOR_SIGNALS.HIGH_RES_TIMING);
      confidence += BEHAVIOR_SIGNALS.HIGH_RES_TIMING.weight;
    }

    // Check for PII
    if (bodyStr && /email|phone|address|firstname|lastname|name=|user_email|customer/i.test(bodyStr)) {
      signals.push(BEHAVIOR_SIGNALS.PII_COLLECTION);
      confidence += BEHAVIOR_SIGNALS.PII_COLLECTION.weight;
    }

    // Check for form data capture
    if (bodyStr && /form|input|field|submit|signup|register|newsletter/i.test(bodyStr)) {
      signals.push(BEHAVIOR_SIGNALS.FORM_CAPTURE);
      confidence += BEHAVIOR_SIGNALS.FORM_CAPTURE.weight;
    }

    // Cross-domain check
    try {
      const reqHost = new URL(url).hostname;
      if (reqHost !== window.location.hostname) {
        signals.push(BEHAVIOR_SIGNALS.CROSS_DOMAIN);
        confidence += BEHAVIOR_SIGNALS.CROSS_DOMAIN.weight;
      }
    } catch (e) {}

    return { signals, confidence, isTracking: confidence >= 20 };
  }

  // ============================================================
  // VENDOR IDENTIFICATION FROM BEHAVIOR
  // ============================================================

  function guessVendorFromBehavior(url, body, cookies, signals) {
    const scores = {};
    const urlLower = url.toLowerCase();
    const bodyStr = typeof body === 'string' ? body : safeStringify(body);

    // --- Adobe Detection ---
    // s_vi cookie, /b/ss/ endpoint, demdex, edge.adobedc.net
    if (urlLower.includes('/b/ss/') || urlLower.includes('adobedc.net') ||
        urlLower.includes('demdex.net') || urlLower.includes('omtrdc.net') ||
        cookies.some(c => c.name === 's_vi' || c.name.startsWith('AMCV_'))) {
      scores.adobe = 90;
    }
    if (bodyStr && /mid|mcid|aamb|aamlh|d_mid/i.test(bodyStr)) {
      scores.adobe = Math.max(scores.adobe || 0, 85);
    }

    // --- Google Analytics Detection ---
    // _ga cookie, collect endpoint, gtag/gtm patterns
    if (urlLower.includes('google-analytics.com') || urlLower.includes('analytics.google.com') ||
        urlLower.includes('/g/collect') || urlLower.includes('/collect?') ||
        cookies.some(c => c.name.startsWith('_ga'))) {
      scores.google_analytics = 90;
    }
    if (bodyStr && /&tid=(?:G-|UA-)|&cid=|&_p=/i.test(bodyStr)) {
      scores.google_analytics = Math.max(scores.google_analytics || 0, 85);
    }

    // --- Google Tag Manager Detection ---
    if (urlLower.includes('googletagmanager.com') || urlLower.includes('gtm.js')) {
      scores.google_tag_manager = 90;
    }

    // --- 6sense Detection ---
    // _6si cookie, company/firmographic data
    if (urlLower.includes('6sense.com') || urlLower.includes('6sc.co') ||
        cookies.some(c => c.name.startsWith('_6s'))) {
      scores._6sense = 95;
    }
    if (bodyStr && /company_name|firmographic|intent_score|buying_stage/i.test(bodyStr)) {
      scores._6sense = Math.max(scores._6sense || 0, 90);
    }

    // --- Bombora Detection ---
    if (urlLower.includes('bombora.com') || urlLower.includes('ml314.com')) {
      scores.bombora = 90;
    }
    if (bodyStr && /"intent"|"topic"|topic_cluster|surge_score/i.test(bodyStr)) {
      scores.bombora = Math.max(scores.bombora || 0, 85);
    }

    // --- Segment Detection ---
    // anonymousId, track/page/identify message types
    if (urlLower.includes('segment.io') || urlLower.includes('segment.com') ||
        urlLower.includes('cdn.segment.com')) {
      scores.segment = 90;
    }
    if (bodyStr && /anonymousId|"type"\s*:\s*"(track|page|identify)"/i.test(bodyStr)) {
      scores.segment = Math.max(scores.segment || 0, 85);
    }

    // --- Mixpanel Detection ---
    if (urlLower.includes('mixpanel.com') || urlLower.includes('api.mixpanel.com')) {
      scores.mixpanel = 90;
    }
    if (bodyStr && /device_id|distinct_id|\$properties|\$set/i.test(bodyStr)) {
      scores.mixpanel = Math.max(scores.mixpanel || 0, 80);
    }

    // --- Amplitude Detection ---
    if (urlLower.includes('amplitude.com') || urlLower.includes('api.amplitude.com')) {
      scores.amplitude = 90;
    }

    // --- Facebook Pixel Detection ---
    if (urlLower.includes('facebook.com/tr') || urlLower.includes('connect.facebook.net')) {
      scores.facebook_pixel = 90;
    }
    if (bodyStr && /fbp|fbclid|_fbp/i.test(bodyStr)) {
      scores.facebook_pixel = Math.max(scores.facebook_pixel || 0, 85);
    }

    // --- LinkedIn Insight Detection ---
    if (urlLower.includes('linkedin.com/px') || urlLower.includes('snap.licdn.com') ||
        urlLower.includes('linkedin.com/li/')) {
      scores.linkedin_insight = 90;
    }

    // --- Marketo Detection ---
    if (urlLower.includes('marketo.com') || urlLower.includes('mktoresp.com') ||
        urlLower.includes('munchkin')) {
      scores.marketo = 90;
    }
    if (cookies.some(c => c.name === '_mkto_trk')) {
      scores.marketo = Math.max(scores.marketo || 0, 85);
    }

    // --- HubSpot Detection ---
    if (urlLower.includes('hubspot.com') || urlLower.includes('hs-scripts.com') ||
        urlLower.includes('hs-analytics.net')) {
      scores.hubspot = 90;
    }
    if (cookies.some(c => c.name.startsWith('hubspot') || c.name === '__hstc')) {
      scores.hubspot = Math.max(scores.hubspot || 0, 85);
    }

    // --- Hotjar Detection ---
    if (urlLower.includes('hotjar.com') || urlLower.includes('static.hotjar.com')) {
      scores.hotjar = 90;
    }
    if (cookies.some(c => c.name.startsWith('_hj'))) {
      scores.hotjar = Math.max(scores.hotjar || 0, 85);
    }

    // --- Heap Detection ---
    if (urlLower.includes('heap.io') || urlLower.includes('heapanalytics.com')) {
      scores.heap = 90;
    }

    // --- FullStory Detection ---
    if (urlLower.includes('fullstory.com') || urlLower.includes('rs.fullstory.com')) {
      scores.fullstory = 90;
    }

    // --- Clearbit Detection ---
    if (urlLower.includes('clearbit.com') || urlLower.includes('x.clearbitjs.com')) {
      scores.clearbit = 90;
    }

    // --- Drift Detection ---
    if (urlLower.includes('drift.com') || urlLower.includes('js.driftt.com')) {
      scores.drift = 90;
    }

    // --- Intercom Detection ---
    if (urlLower.includes('intercom.io') || urlLower.includes('widget.intercom.io')) {
      scores.intercom = 90;
    }

    // --- Consent Platforms ---
    if (urlLower.includes('onetrust.com') || urlLower.includes('cookielaw.org')) {
      scores.onetrust = 90;
    }
    if (urlLower.includes('cookiebot.com')) {
      scores.cookiebot = 90;
    }
    if (urlLower.includes('trustarc.com') || urlLower.includes('truste.com')) {
      scores.trustarc = 90;
    }

    // --- First-Party Proxy Detection ---
    const proxyResult = detectFirstPartyProxy(url, bodyStr);
    if (proxyResult.isProxy) {
      scores['first_party_proxy'] = proxyResult.confidence;
    }

    // If no known vendor but high behavioral confidence
    if (Object.keys(scores).length === 0 && signals.confidence >= 40) {
      return {
        name: 'unknown_behavioral',
        confidence: signals.confidence,
        signals: signals.signals.map(s => s.desc)
      };
    }

    // Return highest scoring vendor
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      return {
        name: sorted[0][0],
        confidence: sorted[0][1],
        signals: signals.signals.map(s => s.desc)
      };
    }

    return null;
  }

  // ============================================================
  // FIRST-PARTY PROXY DETECTION
  // ============================================================

  function detectFirstPartyProxy(url, bodyStr) {
    try {
      const { hostname, pathname } = new URL(url);

      // Suspicious subdomains
      const suspiciousSubdomains = ['metrics', 'analytics', 'tracking', 'events',
        'telemetry', 'stats', 'data', 'insights', 'pixel', 'beacon', 'collect'];

      // Suspicious paths
      const suspiciousPaths = ['/analytics', '/events', '/tracking', '/metrics',
        '/collect', '/beacon', '/px', '/pixel', '/t/', '/e/', '/v1/track', '/v1/page'];

      const hasSubdomain = suspiciousSubdomains.some(sd => hostname.includes(sd));
      const hasPath = suspiciousPaths.some(p => pathname.includes(p));

      if (hasSubdomain || hasPath) {
        // Deep inspect for analytics patterns in payload
        const analyticsPatterns = [
          /event|page_view|pageview|track/i,
          /user_id|userId|anonymous_id|client_id/i,
          /timestamp|ts|time/i,
          /properties|context|traits/i
        ];

        const matchCount = analyticsPatterns.filter(p => p.test(bodyStr)).length;

        if (matchCount >= 2) {
          return {
            isProxy: true,
            confidence: 60 + (matchCount * 10),
            evidence: `Subdomain: ${hasSubdomain}, Path: ${hasPath}, Payload matches: ${matchCount}`
          };
        }
      }
    } catch (e) {}

    return { isProxy: false, confidence: 0 };
  }

  // ============================================================
  // NETWORK INTERCEPTION - FETCH
  // ============================================================

  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [resource, config] = args;
    const url = typeof resource === 'string' ? resource : resource?.url || '';
    const body = config?.body;

    const behavior = analyzeRequestBehavior(url, config, body);
    const recentCookies = Array.from(state.cookies.values()).slice(-10);

    if (behavior.isTracking || isKnownTrackingDomain(url)) {
      const vendor = guessVendorFromBehavior(url, body, recentCookies, behavior);

      emitBehavioralDetection({
        method: 'fetch',
        url: url,
        body: parseBody(body),
        vendor: vendor,
        behavior: behavior,
        timestamp: Date.now()
      });
    }

    return originalFetch.apply(this, args);
  };

  // ============================================================
  // NETWORK INTERCEPTION - XMLHttpRequest
  // ============================================================

  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._wiwMethod = method;
    this._wiwUrl = url;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(body) {
    const url = this._wiwUrl;
    const behavior = analyzeRequestBehavior(url, {}, body);
    const recentCookies = Array.from(state.cookies.values()).slice(-10);

    if (behavior.isTracking || isKnownTrackingDomain(url)) {
      const vendor = guessVendorFromBehavior(url, body, recentCookies, behavior);

      emitBehavioralDetection({
        method: 'xhr',
        url: url,
        body: parseBody(body),
        vendor: vendor,
        behavior: behavior,
        timestamp: Date.now()
      });
    }

    return originalXHRSend.apply(this, [body]);
  };

  // ============================================================
  // NETWORK INTERCEPTION - SendBeacon (Exit Tracking)
  // ============================================================

  const originalSendBeacon = navigator.sendBeacon?.bind(navigator);
  if (originalSendBeacon) {
    navigator.sendBeacon = function(url, data) {
      const behavior = analyzeRequestBehavior(url, {}, data);
      behavior.signals.push(BEHAVIOR_SIGNALS.EXIT_TRACKING);
      behavior.confidence += BEHAVIOR_SIGNALS.EXIT_TRACKING.weight;
      behavior.isTracking = true;

      const recentCookies = Array.from(state.cookies.values()).slice(-10);
      const vendor = guessVendorFromBehavior(url, data, recentCookies, behavior);

      emitBehavioralDetection({
        method: 'beacon',
        url: url,
        body: parseBody(data),
        vendor: vendor,
        behavior: behavior,
        isExitTracking: true,
        timestamp: Date.now()
      });

      return originalSendBeacon(url, data);
    };
  }

  // ============================================================
  // IMAGE PIXEL INTERCEPTION
  // ============================================================

  const originalImageSrc = Object.getOwnPropertyDescriptor(Image.prototype, 'src');
  if (originalImageSrc) {
    Object.defineProperty(Image.prototype, 'src', {
      get: function() {
        return originalImageSrc.get.call(this);
      },
      set: function(url) {
        if (isTrackingPixel(url)) {
          const behavior = analyzeRequestBehavior(url, {}, null);
          const recentCookies = Array.from(state.cookies.values()).slice(-10);
          const vendor = guessVendorFromBehavior(url, null, recentCookies, behavior);

          emitBehavioralDetection({
            method: 'pixel',
            url: url,
            vendor: vendor,
            behavior: behavior,
            timestamp: Date.now()
          });
        }
        return originalImageSrc.set.call(this, url);
      }
    });
  }

  function isTrackingPixel(url) {
    if (!url || typeof url !== 'string') return false;
    const urlLower = url.toLowerCase();

    // Known pixel domains
    const pixelDomains = [
      'facebook.com/tr', 'pixel.facebook', 'connect.facebook',
      'bat.bing.com', 'linkedin.com/px', 'analytics.twitter',
      'ads.linkedin', 't.co', 'px.ads', 'pixel.', 'tr.snapchat',
      'ct.pinterest', 'q.quora.com', 'tiktok.com/i18n'
    ];

    if (pixelDomains.some(d => urlLower.includes(d))) return true;

    // 1x1 pixel heuristic - check URL patterns
    if (/[?&](w|width|h|height)=1[&$]/i.test(url)) return true;
    if (/\/pixel[./]/i.test(url)) return true;
    if (/\/beacon[./]/i.test(url)) return true;
    if (/\/t\.gif|\/b\.gif|\/p\.gif/i.test(url)) return true;

    return false;
  }

  // ============================================================
  // COOKIE INTERCEPTION
  // ============================================================

  const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
  if (originalCookie) {
    Object.defineProperty(Document.prototype, 'cookie', {
      get: function() {
        return originalCookie.get.call(this);
      },
      set: function(value) {
        const analysis = analyzeCookie(value);

        if (analysis.isTracking) {
          state.cookies.set(analysis.name, analysis);

          emit('COOKIE_SET', {
            name: analysis.name,
            value: analysis.value?.substring(0, 100),
            domain: analysis.domain,
            expiry: analysis.expiry,
            isTracking: true,
            signals: analysis.signals,
            timestamp: Date.now()
          });

          // Extract and emit identity from cookie
          const identity = analyzeCookieForIdentity(analysis.name, analysis.value);
          if (identity) {
            const key = identity.type + identity.value;
            if (!state.identities.has(key)) {
              state.identities.set(key, identity);
              emit('IDENTITY_DETECTED', { ...identity, timestamp: Date.now() });
            }
          }
        }

        return originalCookie.set.call(this, value);
      }
    });
  }

  function analyzeCookie(cookieStr) {
    const parts = cookieStr.split(';').map(p => p.trim());
    const [nameValue, ...attributes] = parts;
    const [name, value] = nameValue.split('=');

    const analysis = {
      name: name,
      value: value,
      domain: null,
      expiry: null,
      isTracking: false,
      signals: []
    };

    // Parse attributes
    attributes.forEach(attr => {
      const [key, val] = attr.split('=');
      const keyLower = key.toLowerCase();
      if (keyLower === 'domain') analysis.domain = val;
      if (keyLower === 'expires') analysis.expiry = val;
      if (keyLower === 'max-age') analysis.maxAge = parseInt(val);
    });

    // Known tracking cookie names
    const trackingCookies = [
      '_ga', '_gid', '_gat', '_gcl', // Google
      's_vi', 's_fid', 'AMCV_', 'mbox', // Adobe
      '_fbp', '_fbc', // Facebook
      '_mkto_trk', // Marketo
      '__hstc', 'hubspotutk', // HubSpot
      '_hjid', '_hjSessionUser', // Hotjar
      '_6si', // 6sense
      'li_sugr', // LinkedIn
      'mp_', // Mixpanel
      'ajs_', // Segment
      '_clck', '_clsk' // Clarity
    ];

    if (trackingCookies.some(tc => name.startsWith(tc))) {
      analysis.isTracking = true;
      analysis.signals.push('Known tracking cookie');
    }

    // Check for long expiry (persistent tracking)
    if (analysis.maxAge > 31536000 || // 1 year in seconds
        (analysis.expiry && new Date(analysis.expiry) > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))) {
      analysis.isTracking = true;
      analysis.signals.push(BEHAVIOR_SIGNALS.PERSISTENT_ID.desc);
    }

    // Check for UUID-like values (identity cookies)
    if (value && /^[a-f0-9-]{32,}$/i.test(value.replace(/[.-]/g, ''))) {
      analysis.isTracking = true;
      analysis.signals.push('Contains unique identifier');
    }

    return analysis;
  }

  // ============================================================
  // CANVAS FINGERPRINTING DETECTION
  // ============================================================

  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  let canvasContext2DFillText = null;

  // Track fillText calls for fingerprinting detection
  const originalFillText = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function(...args) {
    this.__wiwLastFillText = args[0];
    this.__wiwFillTextCount = (this.__wiwFillTextCount || 0) + 1;
    return originalFillText.apply(this, args);
  };

  HTMLCanvasElement.prototype.toDataURL = function(...args) {
    if (isLikelyFingerprinting(this)) {
      state.canvasReads.push({
        timestamp: Date.now(),
        size: `${this.width}x${this.height}`
      });

      emit('FINGERPRINT_DETECTED', {
        type: 'canvas',
        method: 'toDataURL',
        canvasSize: `${this.width}x${this.height}`,
        signals: ['Canvas read for fingerprinting'],
        timestamp: Date.now()
      });
    }
    return originalToDataURL.apply(this, args);
  };

  CanvasRenderingContext2D.prototype.getImageData = function(...args) {
    const canvas = this.canvas;
    if (isLikelyFingerprinting(canvas)) {
      emit('FINGERPRINT_DETECTED', {
        type: 'canvas',
        method: 'getImageData',
        canvasSize: `${canvas.width}x${canvas.height}`,
        signals: ['Canvas pixel data read'],
        timestamp: Date.now()
      });
    }
    return originalGetImageData.apply(this, args);
  };

  function isLikelyFingerprinting(canvas) {
    const { width, height } = canvas;
    const ctx = canvas.getContext('2d');

    // Fingerprinting signatures:
    // 1. Small canvas with specific sizes
    const suspiciousSize = (width < 400 && height < 200) ||
                           (width === 300 && height === 150) ||
                           (width === 220 && height === 30);

    // 2. Text was rendered (common fingerprinting technique)
    const hasText = ctx?.__wiwFillTextCount > 0;

    // 3. Not visible on page (hidden canvas)
    const notVisible = canvas.style.display === 'none' ||
                       canvas.offsetParent === null ||
                       canvas.style.visibility === 'hidden';

    // 4. Multiple text renders (pangram technique)
    const multipleTextRenders = ctx?.__wiwFillTextCount >= 2;

    return (suspiciousSize && hasText) || (hasText && notVisible) || multipleTextRenders;
  }

  // ============================================================
  // FONT FINGERPRINTING DETECTION
  // ============================================================

  // Detect font enumeration via canvas measureText
  const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
  let measureTextCalls = 0;
  let measureTextFonts = new Set();

  CanvasRenderingContext2D.prototype.measureText = function(text) {
    measureTextCalls++;

    // Check if font property contains many different fonts
    if (this.font) {
      measureTextFonts.add(this.font);
    }

    // If many different fonts measured quickly, likely fingerprinting
    if (measureTextFonts.size > 20 && measureTextCalls > 50) {
      emit('FINGERPRINT_DETECTED', {
        type: 'font',
        method: 'measureText',
        fontsTested: measureTextFonts.size,
        signals: ['Font enumeration detected'],
        timestamp: Date.now()
      });
      measureTextFonts.clear();
      measureTextCalls = 0;
    }

    return originalMeasureText.apply(this, arguments);
  };

  // ============================================================
  // DATA LAYER WATCHING
  // ============================================================

  function watchDataLayer(name, obj) {
    if (!obj || !Array.isArray(obj) || obj._wiwWatched) return;
    obj._wiwWatched = true;

    const originalPush = obj.push;
    obj.push = function(...args) {
      emit('DATALAYER_PUSH', {
        layer: name,
        data: args,
        timestamp: Date.now()
      });
      return originalPush.apply(this, args);
    };
  }

  // Watch common data layers
  if (window.dataLayer) watchDataLayer('Google dataLayer', window.dataLayer);
  if (window.digitalData) {
    emit('DATALAYER_DETECTED', {
      layer: 'Adobe digitalData',
      data: safeStringify(window.digitalData),
      timestamp: Date.now()
    });
  }
  if (window._6senseData) {
    emit('DATALAYER_DETECTED', {
      layer: '6sense Data',
      data: safeStringify(window._6senseData),
      timestamp: Date.now()
    });
  }
  if (window.utag_data) {
    emit('DATALAYER_DETECTED', {
      layer: 'Tealium utag_data',
      data: safeStringify(window.utag_data),
      timestamp: Date.now()
    });
  }

  // Watch for late-loaded data layers
  const dataLayerCheck = setInterval(() => {
    if (window.dataLayer && !window.dataLayer._wiwWatched) {
      watchDataLayer('Google dataLayer', window.dataLayer);
    }
    if (window.utag_data && !window._wiwUtagWatched) {
      window._wiwUtagWatched = true;
      emit('DATALAYER_DETECTED', {
        layer: 'Tealium utag_data',
        data: safeStringify(window.utag_data),
        timestamp: Date.now()
      });
    }
  }, 1000);
  setTimeout(() => clearInterval(dataLayerCheck), 30000);

  // ============================================================
  // IDENTITY EXTRACTION FROM REQUESTS
  // ============================================================

  function analyzeRequestForIdentity(url, body) {
    const identities = [];
    const bodyStr = typeof body === 'string' ? body : safeStringify(body || '');

    // Google Analytics CID
    const cidMatch = url.match(/[?&]cid=([^&]+)/) || bodyStr.match(/[?&]cid=([^&]+)/);
    if (cidMatch) {
      identities.push({
        type: 'GA_CID',
        value: decodeURIComponent(cidMatch[1]),
        source: 'request',
        vendor: 'google_analytics'
      });
    }

    // Google Analytics User ID
    const uidMatch = url.match(/[?&]uid=([^&]+)/) || bodyStr.match(/[?&]uid=([^&]+)/);
    if (uidMatch) {
      identities.push({
        type: 'USER_ID',
        value: decodeURIComponent(uidMatch[1]),
        source: 'request',
        vendor: 'google_analytics'
      });
    }

    // Adobe Marketing Cloud ID (mid parameter)
    const midMatch = url.match(/[?&]mid=([^&]+)/) || bodyStr.match(/mid[=:]([^&"]+)/i);
    if (midMatch) {
      identities.push({
        type: 'ECID',
        value: decodeURIComponent(midMatch[1]),
        source: 'request',
        vendor: 'adobe'
      });
    }

    // Adobe MCID in payload
    const mcidMatch = bodyStr.match(/mcid[=:]([^&"]+)/i) || bodyStr.match(/marketingCloudVisitorId[=:]"?([^&"]+)/i);
    if (mcidMatch) {
      identities.push({
        type: 'ECID',
        value: decodeURIComponent(mcidMatch[1]),
        source: 'request',
        vendor: 'adobe'
      });
    }

    // Segment anonymousId
    const anonIdMatch = bodyStr.match(/"anonymousId"\s*:\s*"([^"]+)"/);
    if (anonIdMatch) {
      identities.push({
        type: 'SEGMENT_ANON',
        value: anonIdMatch[1],
        source: 'request',
        vendor: 'segment'
      });
    }

    // Segment userId
    const segmentUserMatch = bodyStr.match(/"userId"\s*:\s*"([^"]+)"/);
    if (segmentUserMatch) {
      identities.push({
        type: 'USER_ID',
        value: segmentUserMatch[1],
        source: 'request',
        vendor: 'segment'
      });
    }

    // Mixpanel distinct_id
    const distinctIdMatch = bodyStr.match(/distinct_id[=:]"?([^&"]+)/i);
    if (distinctIdMatch) {
      identities.push({
        type: 'MIXPANEL_ID',
        value: decodeURIComponent(distinctIdMatch[1]),
        source: 'request',
        vendor: 'mixpanel'
      });
    }

    // 6sense company identification
    const sixSenseMatch = bodyStr.match(/company_id[=:]"?([^&"]+)/i);
    if (sixSenseMatch) {
      identities.push({
        type: '6SENSE_COMPANY',
        value: decodeURIComponent(sixSenseMatch[1]),
        source: 'request',
        vendor: '6sense'
      });
    }

    // Facebook fbp/fbc parameters
    const fbpMatch = url.match(/[?&]fbp=([^&]+)/) || bodyStr.match(/fbp[=:]"?([^&"]+)/i);
    if (fbpMatch) {
      identities.push({
        type: 'FB_BROWSER_ID',
        value: decodeURIComponent(fbpMatch[1]),
        source: 'request',
        vendor: 'facebook'
      });
    }

    return identities;
  }

  // ============================================================
  // IDENTITY EXTRACTION FROM COOKIES
  // ============================================================

  function analyzeCookieForIdentity(name, value) {
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

  // ============================================================
  // IDENTITY DETECTION FROM GLOBAL OBJECTS
  // ============================================================

  function detectIdentities() {
    const identities = [];

    // Adobe ECID
    const ecid = window.Visitor?.getInstance?.()?.getMarketingCloudVisitorID?.() ||
                 window._satellite?.getVisitorId?.()?.getMarketingCloudVisitorID?.() ||
                 window.visitor?.getMarketingCloudVisitorID?.();
    if (ecid) {
      identities.push({ type: 'ECID', value: ecid, source: 'Adobe Visitor' });
    }

    // Adobe Customer ID
    if (window.Visitor?.getInstance?.()?.getCustomerIDs) {
      const customerIds = window.Visitor.getInstance().getCustomerIDs();
      if (customerIds) {
        for (const [key, value] of Object.entries(customerIds)) {
          if (value.id) {
            identities.push({ type: 'CUID', key: key, value: value.id, source: 'Adobe Customer IDs' });
          }
        }
      }
    }

    // Google Client ID
    if (window.ga?.getAll) {
      const trackers = window.ga.getAll();
      trackers.forEach(tracker => {
        const clientId = tracker.get('clientId');
        if (clientId) {
          identities.push({ type: 'GA_CID', value: clientId, source: 'Google Analytics' });
        }
      });
    }

    // GTM Data Layer user identification
    if (window.dataLayer) {
      window.dataLayer.forEach(item => {
        if (item.userId) {
          identities.push({ type: 'USER_ID', value: item.userId, source: 'dataLayer' });
        }
        if (item.user_id) {
          identities.push({ type: 'USER_ID', value: item.user_id, source: 'dataLayer' });
        }
      });
    }

    // Segment anonymousId
    if (window.analytics?.user?.()?.anonymousId) {
      identities.push({
        type: 'SEGMENT_ANON',
        value: window.analytics.user().anonymousId(),
        source: 'Segment'
      });
    }

    // Mixpanel distinct_id
    if (window.mixpanel?.get_distinct_id) {
      identities.push({
        type: 'MIXPANEL_ID',
        value: window.mixpanel.get_distinct_id(),
        source: 'Mixpanel'
      });
    }

    if (identities.length > 0) {
      identities.forEach(identity => {
        if (!state.identities.has(identity.type + identity.value)) {
          state.identities.set(identity.type + identity.value, identity);
          emit('IDENTITY_DETECTED', { ...identity, timestamp: Date.now() });
        }
      });
    }
  }

  // Identity checks
  setTimeout(detectIdentities, 1000);
  setTimeout(detectIdentities, 3000);
  setTimeout(detectIdentities, 10000);

  // ============================================================
  // CONSENT DETECTION
  // ============================================================

  function detectConsent() {
    const consent = {
      platform: null,
      state: null,
      groups: null,
      timestamp: Date.now()
    };

    if (window.Optanon || window.OneTrust) {
      consent.platform = 'OneTrust';
      consent.groups = window.OptanonActiveGroups || window.OnetrustActiveGroups;
      consent.state = window.Optanon?.GetDomainData?.()?.ConsentModel || 'unknown';
    } else if (window.truste) {
      consent.platform = 'TrustArc';
      consent.state = window.truste?.eu?.bindMap?.consent || 'unknown';
    } else if (window.Cookiebot) {
      consent.platform = 'Cookiebot';
      consent.state = window.Cookiebot.consent;
      consent.groups = {
        necessary: window.Cookiebot.consent?.necessary,
        preferences: window.Cookiebot.consent?.preferences,
        statistics: window.Cookiebot.consent?.statistics,
        marketing: window.Cookiebot.consent?.marketing
      };
    } else if (window.__tcfapi) {
      consent.platform = 'TCF/IAB';
      window.__tcfapi('getTCData', 2, (tcData, success) => {
        if (success) {
          consent.state = tcData;
          emit('CONSENT_DETECTED', consent);
        }
      });
      return; // Exit early, TCF is async
    }

    if (consent.platform) {
      emit('CONSENT_DETECTED', consent);
    }
  }

  setTimeout(detectConsent, 2000);

  // ============================================================
  // INJECTION COMMANDS
  // ============================================================

  function spoofECID(value) {
    window.visitor = { getMarketingCloudVisitorID: () => value };
    if (window.Visitor?.getInstance) {
      const instance = window.Visitor.getInstance();
      if (instance) instance.getMarketingCloudVisitorID = () => value;
    }
    emit('INJECT_RESULT', { command: 'SPOOF_ECID', success: true, value });
  }

  function blockAlloy() {
    window.alloy = () => Promise.resolve({});
    window.__alloyNS = [];
    emit('INJECT_RESULT', { command: 'BLOCK_ALLOY', success: true });
  }

  function fakeConsent(groups) {
    window.OptanonActiveGroups = groups;
    window.OnetrustActiveGroups = groups;
    if (window.Optanon) window.Optanon.ActiveGroups = groups;
    emit('INJECT_RESULT', { command: 'FAKE_CONSENT', success: true, groups });
  }

  function sendDataLayers() {
    const layers = {};
    if (window.dataLayer) layers.google = window.dataLayer;
    if (window.digitalData) layers.adobe = window.digitalData;
    if (window._6senseData) layers.sixsense = window._6senseData;
    if (window.utag_data) layers.tealium = window.utag_data;
    emit('DATALAYER_SNAPSHOT', { layers: safeStringify(layers), timestamp: Date.now() });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  function emitBehavioralDetection(data) {
    // Emit network request
    emit('NETWORK_REQUEST', {
      url: data.url,
      method: data.method,
      body: data.body,
      timestamp: data.timestamp,
      type: data.vendor?.name || 'behavioral',
      behavioralSignals: data.behavior?.signals?.map(s => s.desc || s) || [],
      confidence: data.behavior?.confidence || 0
    });

    // Emit vendor detection if identified
    if (data.vendor && data.vendor.name !== 'unknown_behavioral') {
      emit('BEHAVIORAL_VENDOR_DETECTED', {
        vendor: data.vendor.name,
        confidence: data.vendor.confidence,
        signals: data.vendor.signals || [],
        method: data.method,
        url: data.url,
        isExitTracking: data.isExitTracking || false,
        timestamp: data.timestamp
      });
    }

    // Extract and emit identities from request
    const bodyStr = typeof data.body === 'string' ? data.body : safeStringify(data.body || '');
    const identities = analyzeRequestForIdentity(data.url, bodyStr);
    identities.forEach(identity => {
      const key = identity.type + identity.value;
      if (!state.identities.has(key)) {
        state.identities.set(key, identity);
        emit('IDENTITY_DETECTED', { ...identity, timestamp: Date.now() });
      }
    });
  }

  function isKnownTrackingDomain(url) {
    if (!url) return false;
    const patterns = [
      'adobedc.net', 'demdex.net', 'omtrdc.net', '2o7.net',
      'google-analytics.com', 'googletagmanager.com', 'doubleclick.net',
      'mktoresp.com', 'marketo.com', 'marketo.net',
      '6sense.com', '6sc.co', 'bombora.com', 'ml314.com',
      'onetrust.com', 'trustarc.com', 'cookiebot.com',
      'segment.io', 'segment.com', 'mixpanel.com', 'amplitude.com',
      'facebook.com/tr', 'connect.facebook.net', 'linkedin.com/px',
      'snap.licdn.com', 'hotjar.com', 'hubspot.com', 'hs-analytics.net',
      'heap.io', 'heapanalytics.com', 'fullstory.com', 'clarity.ms',
      'bat.bing.com', 'ads.twitter.com', 'analytics.twitter.com',
      'intercom.io', 'drift.com', 'clearbit.com', 'zoominfo.com',
      'demandbase.com', 'triblio.com', 'bizible.com', 'engagio.com'
    ];
    return patterns.some(pattern => url.includes(pattern));
  }

  function parseBody(body) {
    if (!body) return null;
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return body.substring(0, 2000);
      }
    }
    if (body instanceof FormData) {
      const obj = {};
      body.forEach((value, key) => { obj[key] = value; });
      return obj;
    }
    return String(body).substring(0, 2000);
  }

  function safeStringify(obj) {
    try {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'function') return '[Function]';
        if (value instanceof HTMLElement) return '[HTMLElement]';
        return value;
      }, 2);
    } catch {
      return '[Unable to stringify]';
    }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  emit('HOOK_READY', { timestamp: Date.now(), version: '2.0-behavioral' });
  console.log('[who-is-watching] Behavioral fingerprinting engine initialized');
})();
