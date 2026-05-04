// ============================================================
// MAIN — Side Panel UI Logic
// Main UI controller for the Who Is Watching panel.
// Timeline-first architecture with IndexedDB persistence.
// ============================================================

import {
  initDB,
  getOrCreateSession,
  addEvent,
  getSessionTimeline,
  addIdentity,
  autoLinkIdentities,
  getIdentityGraph,
  updateSessionActivity,
  clearAllData,
  clearSession
} from '../lib/db.js';

import { BatchRenderer } from '../lib/batch-renderer.js';
import { generateReport } from '../lib/report-generator.js';
import { auditController } from '../lib/audit-controller.js';
import { AuditReportGenerator } from '../lib/audit-report-generator.js';

// ============================================================
// VENDOR NORMALIZATION
// Map variant names to canonical vendor names
// ============================================================

const VENDOR_ALIASES = {
  '6sense': ['6sense', '6sense Intent', '6sense Insights', '_6sense', '6sc'],
  'Adobe': ['Adobe', 'Adobe Analytics', 'Adobe Launch', 'Adobe Web SDK', 'Adobe Experience Platform', 'Adobe Target', 'omniture', 'demdex'],
  'Facebook': ['Facebook Pixel', 'Facebook', 'Meta Pixel', 'fbq', 'Meta'],
  'Google Analytics': ['Google Analytics', 'Google Analytics 4', 'GA4', 'gtag', 'analytics.js', 'ga.js'],
  'Google Tag Manager': ['Google Tag Manager', 'GTM', 'googletagmanager'],
  'LinkedIn': ['LinkedIn Insight', 'LinkedIn', 'li_sugr'],
  'Microsoft': ['Microsoft Ads', 'Microsoft Clarity', 'Bing Ads', 'clarity'],
  'Marketo': ['Marketo Munchkin', 'Marketo', 'munchkin', 'mktoresp']
};

function normalizeVendorKey(rawKey) {
  if (!rawKey) return rawKey;
  const lowerKey = rawKey.toLowerCase();

  for (const [canonical, aliases] of Object.entries(VENDOR_ALIASES)) {
    if (aliases.some(alias => lowerKey.includes(alias.toLowerCase()))) {
      return canonical.toLowerCase().replace(/\s+/g, '_');
    }
  }
  return rawKey;
}

function normalizeVendorName(rawName) {
  if (!rawName) return rawName;
  const lowerName = rawName.toLowerCase();

  for (const [canonical, aliases] of Object.entries(VENDOR_ALIASES)) {
    if (aliases.some(alias => lowerName.includes(alias.toLowerCase()))) {
      return canonical;
    }
  }
  return rawName;
}

(async function() {
  'use strict';

  // --- State ---
  const state = {
    session: null,
    events: [],
    filter: 'all',
    vendors: [],
    identities: [],
    network: [],
    dataLayers: {},
    consent: null,
    cookies: [],
    fingerprints: [],
    behavioralSignals: new Map(),
    currentTabId: null,
    currentView: 'timeline',
    expandedVendors: new Set(),
    expandedTimeline: new Set(),
    expandedBursts: new Set(),
    userScrolledUp: false,
    messageQueue: [] // Queue messages until session is ready
  };

  // --- DOM References ---
  const dom = {
    sessionDomain: document.getElementById('session-domain'),
    eventCount: document.getElementById('event-count'),
    timelineList: document.getElementById('timeline-list'),
    timelineEmpty: document.getElementById('timeline-empty'),
    vendorList: document.getElementById('vendor-list'),
    vendorsEmpty: document.getElementById('vendors-empty'),
    networkList: document.getElementById('network-list'),
    networkEmpty: document.getElementById('network-empty'),
    identityDetails: document.getElementById('identity-details'),
    dataLayerView: document.getElementById('datalayer-view'),
    injectLog: document.getElementById('inject-log'),
    // Settings modal
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    settingsClose: document.getElementById('settings-close'),
    clearAllDataBtn: document.getElementById('clear-all-data'),
    clearSessionDataBtn: document.getElementById('clear-session-data'),
    // Export buttons
    exportHtmlBtn: document.getElementById('export-html'),
    exportMarkdownBtn: document.getElementById('export-markdown'),
    // Zoom controls
    zoomIn: document.getElementById('zoom-in'),
    zoomOut: document.getElementById('zoom-out'),
    zoomReset: document.getElementById('zoom-reset'),
    // Audit mode
    modeMonitor: document.getElementById('mode-monitor'),
    modeAudit: document.getElementById('mode-audit'),
    monitorPanel: document.getElementById('monitor-panel'),
    auditPanel: document.getElementById('audit-panel'),
    auditActivePanel: document.getElementById('audit-active-panel'),
    trackerChecklist: document.getElementById('tracker-checklist'),
    startAuditBtn: document.getElementById('start-audit'),
    selectAllTrackers: document.getElementById('select-all-trackers'),
    stopAuditBtn: document.getElementById('stop-audit'),
    exportAuditBtn: document.getElementById('export-audit'),
    auditBlockedCount: document.getElementById('audit-blocked-count'),
    auditStatAttempted: document.getElementById('audit-stat-attempted'),
    auditStatBlocked: document.getElementById('audit-stat-blocked'),
    auditStatLeaked: document.getElementById('audit-stat-leaked'),
    auditLeaks: document.getElementById('audit-leaks')
  };

  // Store zoom behavior reference for button controls
  let identityGraphZoom = null;

  // --- Batch Renderer ---
  const timelineRenderer = new BatchRenderer(renderTimelineBatch, {
    batchMs: 100,
    maxBatch: 50,
    velocityThreshold: 30
  });

  // Track scroll position for auto-scroll behavior
  dom.timelineList?.addEventListener('scroll', () => {
    const el = dom.timelineList;
    // User scrolled up if not at bottom (within 50px threshold)
    state.userScrolledUp = el.scrollHeight - el.scrollTop - el.clientHeight > 50;
  });

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async function init() {
    try {
      await initDB();
      console.log('[who-is-watching] IndexedDB initialized');

      const tab = await getCurrentTab();
      if (tab) {
        state.currentTabId = tab.id;
        state.session = await getOrCreateSession(tab.url);
        updateSessionUI();
        await loadTimeline();
        console.log('[who-is-watching] Session:', state.session.id);

        // Process any messages that arrived before session was ready
        await processQueuedMessages();
      }
    } catch (error) {
      console.error('[who-is-watching] Init error:', error);
    }
  }

  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  function updateSessionUI() {
    if (state.session) {
      dom.sessionDomain.textContent = state.session.domain;
    }
  }

  // ============================================================
  // TIMELINE
  // ============================================================

  async function loadTimeline() {
    if (!state.session) return;

    const category = state.filter === 'all' ? undefined : state.filter;
    state.events = await getSessionTimeline(state.session.id, { category });
    renderTimeline();
    updateEventCount();
  }

  function renderTimeline() {
    if (state.events.length === 0) {
      dom.timelineEmpty.style.display = 'block';
      dom.timelineList.innerHTML = '';
      return;
    }

    dom.timelineEmpty.style.display = 'none';

    dom.timelineList.innerHTML = state.events.map(event => {
      const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const icon = getEventIcon(event.type);
      const variantClass = getEventVariantClass(event);
      const isExpanded = state.expandedTimeline.has(event.id);

      return `
        <div class="timeline-item ${variantClass} ${isExpanded ? 'timeline-item--expanded' : ''}" data-event-id="${event.id}">
          <span class="timeline-time">${time}</span>
          <span class="timeline-icon">${icon}</span>
          <div class="timeline-content">
            <div class="timeline-title">${getEventTitle(event)}</div>
            <div class="timeline-detail">${getEventDetail(event)}</div>
            ${isExpanded ? renderTimelineExpanded(event) : ''}
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers
    dom.timelineList.querySelectorAll('.timeline-item').forEach(item => {
      item.addEventListener('click', () => {
        const eventId = parseInt(item.dataset.eventId);
        toggleTimelineExpand(eventId);
      });
    });
  }

  function toggleTimelineExpand(eventId) {
    if (state.expandedTimeline.has(eventId)) {
      state.expandedTimeline.delete(eventId);
    } else {
      state.expandedTimeline.add(eventId);
    }
    renderTimeline();
  }

  function renderTimelineExpanded(event) {
    const data = { ...event };
    delete data.id;
    delete data.sessionId;
    delete data.timestamp;

    return `
      <div class="timeline-expand">
        <pre class="timeline-expand__data">${JSON.stringify(data, null, 2)}</pre>
      </div>
    `;
  }

  function getEventIcon(type) {
    const icons = {
      vendor_detected: '📡',
      network_request: '📤',
      identity_detected: '🆔',
      cookie_set: '🍪',
      consent_violation: '⚠️',
      fingerprint_detected: '👆',
      consent_detected: '✓',
      datalayer_push: '📊'
    };
    return icons[type] || '•';
  }

  function getEventVariantClass(event) {
    const variants = {
      vendor_detected: 'timeline-item--vendor',
      identity_detected: 'timeline-item--identity',
      consent_violation: 'timeline-item--violation',
      fingerprint_detected: 'timeline-item--warning'
    };
    return variants[event.type] || '';
  }

  function getEventTitle(event) {
    switch (event.type) {
      case 'vendor_detected':
        return `${event.vendorName || event.vendor?.name || 'Unknown'} detected`;
      case 'network_request':
        return `Data sent${event.vendorName ? ` to ${event.vendorName}` : ''}`;
      case 'identity_detected':
        return `${event.identityType || 'Identity'} captured`;
      case 'cookie_set':
        return `Cookie: ${event.cookieName || event.name || 'unknown'}`;
      case 'consent_violation':
        return 'Consent Violation';
      case 'fingerprint_detected':
        return `${event.fingerprintType || 'Fingerprint'} detected`;
      case 'consent_detected':
        return `Consent: ${event.platform || 'detected'}`;
      case 'datalayer_push':
        return 'Data layer push';
      default:
        return event.type.replace(/_/g, ' ');
    }
  }

  function getEventDetail(event) {
    switch (event.type) {
      case 'vendor_detected':
        return event.confidence ? `Confidence: ${event.confidence}%` : event.detectionMethod || '';
      case 'network_request':
        return event.behavioralSignals?.slice(0, 3).join(', ') || truncateUrl(event.url || '', 50);
      case 'identity_detected':
        const val = event.identityValue || event.value || '';
        return `${event.identityType || ''}: ${val.substring(0, 20)}${val.length > 20 ? '...' : ''}`;
      case 'cookie_set':
        return event.isTracking ? 'Tracking cookie' : '';
      case 'consent_violation':
        return event.description || '';
      case 'fingerprint_detected':
        return event.method || '';
      default:
        return '';
    }
  }

  function updateEventCount() {
    dom.eventCount.textContent = `${state.events.length} event${state.events.length !== 1 ? 's' : ''}`;
  }

  // ============================================================
  // BATCH RENDERING (High-Performance)
  // ============================================================

  /**
   * Render a batch of timeline events (called by BatchRenderer)
   */
  function renderTimelineBatch(batch, meta) {
    if (!dom.timelineList) return;

    // Show/hide empty state
    if (batch.length > 0) {
      dom.timelineEmpty.style.display = 'none';
    }

    // Show velocity indicator if high velocity
    if (meta.highVelocity) {
      showVelocityIndicator(`${meta.velocity} events/sec`);
    }

    // Filter batch based on current filter
    const filteredBatch = batch.filter(event => {
      if (state.filter === 'all') return true;
      return event.category === state.filter;
    });

    if (filteredBatch.length === 0) return;

    // Render batch items
    const html = filteredBatch.map(event => {
      if (event._burst) {
        return renderBurstItem(event);
      }
      return renderStreamingTimelineItem(event);
    }).join('');

    // Append instead of replace to avoid flicker
    dom.timelineList.insertAdjacentHTML('beforeend', html);

    // Add to state.events for count tracking
    state.events.push(...filteredBatch);
    updateEventCount();

    // Limit DOM size to prevent bloat
    trimTimelineDOM();

    // Auto-scroll to bottom if user hasn't scrolled up
    if (!state.userScrolledUp) {
      dom.timelineList.scrollTop = dom.timelineList.scrollHeight;
    }

    // Attach click handlers to new items
    attachBatchClickHandlers();
  }

  /**
   * Render a single timeline item for streaming (no expand state tracking)
   */
  function renderStreamingTimelineItem(event) {
    const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const icon = getEventIcon(event.type);
    const variantClass = getEventVariantClass(event);

    return `
      <div class="timeline-item ${variantClass}" data-event-id="${event.id || 'new'}">
        <span class="timeline-time">${time}</span>
        <span class="timeline-icon">${icon}</span>
        <div class="timeline-content">
          <div class="timeline-title">${getEventTitle(event)}</div>
          <div class="timeline-detail">${getEventDetail(event)}</div>
        </div>
      </div>
    `;
  }

  /**
   * Render a burst item (collapsed rapid events)
   */
  function renderBurstItem(event) {
    const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const vendorName = event._burstVendor || event.vendorName || 'Unknown';
    const isExpanded = state.expandedBursts.has(event.id);

    return `
      <div class="timeline-item burst ${isExpanded ? 'burst--expanded' : ''}" data-burst-id="${event.id || Date.now()}">
        <span class="timeline-time">${time}</span>
        <span class="timeline-icon">📦</span>
        <div class="timeline-content">
          <div class="timeline-title">${escapeHtml(vendorName)} <span class="burst-count">(${event._burstCount} events)</span></div>
          <div class="timeline-detail">High activity burst - click to expand</div>
          ${isExpanded ? renderBurstExpanded(event._burstEvents) : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render expanded burst events
   */
  function renderBurstExpanded(events) {
    if (!events || events.length === 0) return '';

    const items = events.slice(0, 20).map(evt => {
      const time = new Date(evt.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      return `
        <div class="burst-event">
          <span class="burst-event__time">${time}</span>
          <span class="burst-event__type">${evt.type?.replace(/_/g, ' ') || 'event'}</span>
        </div>
      `;
    }).join('');

    const moreCount = events.length - 20;

    return `
      <div class="burst-expand">
        ${items}
        ${moreCount > 0 ? `<div class="burst-event__more">+${moreCount} more events</div>` : ''}
      </div>
    `;
  }

  /**
   * Attach click handlers to batch-rendered items
   */
  function attachBatchClickHandlers() {
    // Handle burst item clicks
    dom.timelineList.querySelectorAll('.timeline-item.burst:not([data-handler])').forEach(item => {
      item.setAttribute('data-handler', 'true');
      item.addEventListener('click', () => {
        const burstId = item.dataset.burstId;
        item.classList.toggle('burst--expanded');
        // Note: For streaming items, we don't track expand state in memory
        // as they get trimmed. Just toggle the class.
      });
    });
  }

  /**
   * Trim timeline DOM to prevent memory bloat
   */
  function trimTimelineDOM() {
    const maxItems = 200;
    while (dom.timelineList.children.length > maxItems) {
      dom.timelineList.removeChild(dom.timelineList.firstElementChild);
    }
  }

  /**
   * Show velocity indicator in header
   */
  function showVelocityIndicator(text) {
    let indicator = document.getElementById('velocity-indicator');

    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'velocity-indicator';
      indicator.className = 'velocity-indicator';
      document.querySelector('.panel-header')?.appendChild(indicator);
    }

    indicator.textContent = text;
    indicator.classList.add('active');

    // Hide after 2 seconds of no high velocity
    clearTimeout(indicator._hideTimeout);
    indicator._hideTimeout = setTimeout(() => {
      indicator.classList.remove('active');
    }, 2000);
  }

  /**
   * Push event to batch renderer (for real-time streaming)
   */
  function pushToTimeline(event) {
    if (state.currentView === 'timeline') {
      timelineRenderer.push(event);
    }
  }

  // Timeline filter handlers
  document.querySelectorAll('.timeline-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.timeline-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      // Clear batch buffer and reload from DB with new filter
      timelineRenderer.clear();
      loadTimeline();
    });
  });

  // ============================================================
  // MESSAGE HANDLING + DB PERSISTENCE
  // ============================================================

  chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    // Queue messages if session not ready yet
    if (!state.session) {
      state.messageQueue.push(msg);
      console.log('[WIW] Queued message (session not ready):', msg.type);
      return;
    }

    await processMessage(msg);
  });

  async function processMessage(msg) {
    // Update session activity
    updateSessionActivity(state.session.id);

    switch (msg.type) {
      case 'VENDOR_DETECTED':
        await handleVendorDetected(msg.payload);
        break;
      case 'BEHAVIORAL_VENDOR_DETECTED':
        await handleBehavioralVendorDetected(msg.payload);
        break;
      case 'IDENTITY_DETECTED':
        await handleIdentityDetected(msg.payload);
        break;
      case 'NETWORK_REQUEST':
        await handleNetworkRequest(msg.payload);
        break;
      case 'COOKIE_SET':
        await handleCookieSet(msg.payload);
        break;
      case 'FINGERPRINT_DETECTED':
        await handleFingerprintDetected(msg.payload);
        break;
      case 'DATALAYER_PUSH':
      case 'DATALAYER_DETECTED':
      case 'DATALAYER_SNAPSHOT':
        handleDataLayer(msg.type, msg.payload);
        break;
      case 'CONSENT_DETECTED':
        await handleConsentDetected(msg.payload);
        break;
      case 'INJECT_RESULT':
        handleInjectResult(msg.payload);
        break;
      case 'HOOK_READY':
        logInject('Hook script ready (v2.0 behavioral)');
        break;
      case 'AUDIT_ATTEMPT':
        handleAuditAttempt(msg.payload);
        break;
      case 'AUDIT_BLOCK':
        handleAuditBlock(msg.payload);
        break;
      case 'AUDIT_LEAK_CHECK':
        handleAuditLeakCheck(msg.payload);
        break;
    }
  }

  // Process queued messages after session init
  async function processQueuedMessages() {
    if (state.messageQueue.length > 0) {
      console.log('[WIW] Processing', state.messageQueue.length, 'queued messages');
      for (const msg of state.messageQueue) {
        await processMessage(msg);
      }
      state.messageQueue = [];
    }
  }

  // ============================================================
  // EVENT HANDLERS WITH DB PERSISTENCE
  // ============================================================

  async function handleVendorDetected(vendor) {
    // Normalize vendor key and name to canonical form
    const normalizedKey = normalizeVendorKey(vendor.key);
    const normalizedName = normalizeVendorName(vendor.name);

    // Store event to timeline
    const event = await addEvent(state.session.id, {
      type: 'vendor_detected',
      category: 'vendor',
      vendorName: normalizedName,
      vendorKey: normalizedKey,
      vendorCategory: vendor.category,
      detectionMethod: vendor.detectionMethod || 'script',
      confidence: vendor.confidence || 100
    });

    // Update in-memory state - use normalized key for matching
    const exists = state.vendors.find(v => v.key === normalizedKey);
    if (exists) {
      if (vendor.scripts) {
        exists.scripts = [...new Set([...(exists.scripts || []), ...vendor.scripts])];
      }
      // Track original variant names if different
      if (vendor.name !== normalizedName && !exists.variants?.includes(vendor.name)) {
        exists.variants = exists.variants || [normalizedName];
        exists.variants.push(vendor.name);
      }
    } else {
      state.vendors.push({
        ...vendor,
        key: normalizedKey,
        name: normalizedName,
        variants: vendor.name !== normalizedName ? [normalizedName, vendor.name] : [normalizedName],
        scripts: vendor.scripts || [],
        requests: [],
        behavioralSignals: [],
        confidence: vendor.confidence || 0
      });
    }

    renderVendors();
    // Push to batch renderer for real-time streaming
    pushToTimeline(event);
  }

  async function handleBehavioralVendorDetected(payload) {
    // Normalize vendor key and name
    const normalizedKey = normalizeVendorKey(payload.vendor);
    const normalizedName = normalizeVendorName(formatVendorName(payload.vendor));

    // Store event
    const event = await addEvent(state.session.id, {
      type: 'vendor_detected',
      category: 'vendor',
      vendorName: normalizedName,
      vendorKey: normalizedKey,
      vendorCategory: guessCategory(payload.vendor),
      detectionMethod: 'behavioral',
      confidence: payload.confidence || 0,
      behavioralSignals: payload.signals
    });

    // Update in-memory state - use normalized key for matching
    let vendor = state.vendors.find(v => v.key === normalizedKey);

    if (!vendor) {
      vendor = {
        name: normalizedName,
        key: normalizedKey,
        category: guessCategory(payload.vendor),
        detectionMethod: 'behavioral',
        variants: [normalizedName],
        scripts: [],
        requests: [],
        behavioralSignals: payload.signals || [],
        confidence: payload.confidence || 0,
        timestamp: payload.timestamp
      };
      state.vendors.push(vendor);
    } else {
      vendor.behavioralSignals = [...new Set([...(vendor.behavioralSignals || []), ...(payload.signals || [])])];
      vendor.confidence = Math.max(vendor.confidence || 0, payload.confidence || 0);
    }

    if (!state.behavioralSignals.has(normalizedKey)) {
      state.behavioralSignals.set(normalizedKey, []);
    }
    state.behavioralSignals.get(normalizedKey).push(...(payload.signals || []));

    renderVendors();
    // Push to batch renderer for real-time streaming
    pushToTimeline(event);
  }

  async function handleIdentityDetected(identity) {
    // Store identity to DB
    const identityId = await addIdentity(state.session.id, {
      type: identity.type,
      value: identity.value,
      source: identity.source,
      vendor: identity.vendor
    });

    // Auto-link identities
    await autoLinkIdentities(state.session.id);

    // Store event
    const event = await addEvent(state.session.id, {
      type: 'identity_detected',
      category: 'identity',
      identityType: identity.type,
      identityValue: identity.value,
      identitySource: identity.source,
      vendor: identity.vendor,
      identityId
    });

    // Update in-memory state
    const exists = state.identities.find(i => i.type === identity.type && i.value === identity.value);
    if (!exists) {
      state.identities.push(identity);
    }

    if (state.currentView === 'identity') {
      renderIdentityGraph();
    }
    // Push to batch renderer for real-time streaming
    pushToTimeline(event);
  }

  async function handleNetworkRequest(request) {
    // Store event
    const event = await addEvent(state.session.id, {
      type: 'network_request',
      category: 'network',
      url: request.url,
      method: request.method,
      vendorName: request.vendor?.name,
      vendorKey: request.vendor?.key,
      behavioralSignals: request.behavioralSignals,
      confidence: request.confidence
    });

    // Update in-memory state
    state.network.unshift(request);
    if (state.network.length > 100) state.network.pop();

    associateRequestWithVendor(request);
    renderNetwork();

    // Push to batch renderer for real-time streaming
    pushToTimeline(event);
  }

  async function handleCookieSet(payload) {
    // Store event
    const event = await addEvent(state.session.id, {
      type: 'cookie_set',
      category: 'network', // Group with network for filtering
      cookieName: payload.name,
      cookieDomain: payload.domain,
      isTracking: payload.isTracking,
      signals: payload.signals
    });

    // Update in-memory state
    const exists = state.cookies.find(c => c.name === payload.name);
    if (!exists) {
      state.cookies.push(payload);
    }

    const vendorKey = guessCookieVendor(payload.name);
    if (vendorKey) {
      const vendor = state.vendors.find(v => v.key === vendorKey);
      if (vendor) {
        vendor.cookies = vendor.cookies || [];
        if (!vendor.cookies.find(c => c.name === payload.name)) {
          vendor.cookies.push(payload);
        }
      }
    }

    // Push to batch renderer for real-time streaming
    pushToTimeline(event);
  }

  async function handleFingerprintDetected(payload) {
    // Store event
    const event = await addEvent(state.session.id, {
      type: 'fingerprint_detected',
      category: 'violation',
      fingerprintType: payload.type,
      method: payload.method,
      signals: payload.signals
    });

    state.fingerprints.push(payload);
    logInject(`Fingerprinting detected: ${payload.type} (${payload.method})`);

    // Push to batch renderer for real-time streaming
    pushToTimeline(event);
  }

  async function handleConsentDetected(consent) {
    // Store event
    const event = await addEvent(state.session.id, {
      type: 'consent_detected',
      category: 'vendor',
      platform: consent.platform,
      state: consent.state,
      groups: consent.groups
    });

    state.consent = consent;
    renderConsent();

    // Push to batch renderer for real-time streaming
    pushToTimeline(event);
  }

  // ============================================================
  // IDENTITY GRAPH (FIXED - uses IndexedDB)
  // ============================================================

  async function renderIdentityGraph() {
    if (!state.session) {
      console.log('[WIW] renderIdentityGraph: No session active');
      dom.identityDetails.innerHTML = '<p class="oia-empty__subtext">No session active</p>';
      return;
    }

    console.log('[WIW] Rendering identity graph for session:', state.session.id);

    const { nodes, links } = await getIdentityGraph(state.session.id);

    console.log('[WIW] Identity nodes:', nodes.length, 'Links:', links.length);
    if (nodes.length > 0) {
      console.log('[WIW] Nodes:', nodes.map(n => ({ type: n.type, value: n.value?.substring(0, 20), vendor: n.vendor })));
    }
    if (links.length > 0) {
      console.log('[WIW] Links:', links.map(l => ({ source: l.source, target: l.target, reason: l.reason })));
    }

    const svg = d3.select('#identity-graph');
    svg.selectAll('*').remove();

    if (nodes.length === 0) {
      // Show helpful empty state message
      svg.append('text')
        .attr('x', '50%')
        .attr('y', '40%')
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--oia-text-muted)')
        .attr('font-size', '14px')
        .text('No identities detected yet');

      svg.append('text')
        .attr('x', '50%')
        .attr('y', '55%')
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--oia-text-muted)')
        .attr('font-size', '12px')
        .text('Navigate to a site with analytics tracking');

      dom.identityDetails.innerHTML = '<p class="oia-empty__subtext">Identity nodes will appear when tracking cookies or analytics IDs are detected.</p>';
      return;
    }

    const container = svg.node().parentElement;
    const width = container.clientWidth || 400;
    const height = 300;

    svg.attr('width', width).attr('height', height);

    // Create zoom behavior
    identityGraphZoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        svg.select('g.graph-content').attr('transform', event.transform);
      });

    svg.call(identityGraphZoom);

    // Create a group for all graph content (will be transformed by zoom)
    const graphContent = svg.append('g').attr('class', 'graph-content');

    const simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50))
      .force('link', d3.forceLink(links).id(d => d.id).distance(100));

    const link = graphContent.selectAll('.link')
      .data(links)
      .enter().append('line')
      .attr('class', 'link')
      .attr('stroke', 'var(--oia-sage)')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    const node = graphContent.selectAll('.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => showIdentityDetails(d))
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append('circle')
      .attr('r', 25)
      .attr('fill', d => getIdentityColor(d.type))
      .attr('stroke', 'var(--oia-bg)')
      .attr('stroke-width', 2);

    node.append('text')
      .text(d => d.type.substring(0, 6))
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('fill', '#fff')
      .attr('font-size', '9px')
      .attr('font-weight', '600');

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    dom.identityDetails.innerHTML = `
      <p class="identity-summary"><strong>${nodes.length}</strong> identity node${nodes.length !== 1 ? 's' : ''}, <strong>${links.length}</strong> link${links.length !== 1 ? 's' : ''}. Click a node for details.</p>
    `;
  }

  function getIdentityColor(type) {
    const colors = {
      ECID: 'var(--oia-error)',
      GA_CID: 'var(--oia-mustard)',
      GA_GID: 'var(--oia-mustard)',
      CUID: 'var(--oia-primary)',
      USER_ID: 'var(--oia-success)',
      SEGMENT_ANON: 'var(--oia-sage)',
      MIXPANEL_ID: 'var(--oia-coral)',
      '6SENSE_ID': 'var(--oia-dusty-blue)',
      '6SENSE_COMPANY': 'var(--oia-dusty-blue)',
      FB_BROWSER_ID: '#4267B2',
      FB_CLICK_ID: '#4267B2',
      HUBSPOT_UTK: '#FF7A59',
      MARKETO_ID: '#5C4C9F',
      LINKEDIN_ID: '#0A66C2',
      HOTJAR_ID: '#FD3A5C'
    };
    return colors[type] || 'var(--oia-text-muted)';
  }

  function showIdentityDetails(identity) {
    dom.identityDetails.innerHTML = `
      <div class="identity-detail-card">
        <h4 class="identity-detail-type">${identity.type}</h4>
        <code class="identity-detail-value">${escapeHtml(identity.value)}</code>
        <p class="identity-detail-source">
          Source: ${identity.sources?.join(', ') || 'unknown'}
          ${identity.vendor ? ` | Vendor: ${identity.vendor}` : ''}
        </p>
      </div>
    `;
  }

  // ============================================================
  // BOTTOM NAVIGATION
  // ============================================================

  document.querySelectorAll('.oia-bottom-nav__item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });

  function switchView(viewName) {
    state.currentView = viewName;

    document.querySelectorAll('.oia-bottom-nav__item').forEach(b => {
      b.classList.toggle('oia-bottom-nav__item--active', b.dataset.view === viewName);
    });

    document.querySelectorAll('.panel-view').forEach(v => {
      v.classList.toggle('active', v.id === `view-${viewName}`);
    });

    if (viewName === 'identity') {
      renderIdentityGraph();
    }
    if (viewName === 'timeline') {
      // Clear batch buffer and reload from DB
      timelineRenderer.clear();
      loadTimeline();
    }
  }

  // ============================================================
  // VENDOR RENDERING (preserved from original)
  // ============================================================

  function renderVendors() {
    if (state.vendors.length === 0) {
      dom.vendorsEmpty.style.display = 'block';
      dom.vendorList.innerHTML = '';
      return;
    }

    dom.vendorsEmpty.style.display = 'none';

    const grouped = {};
    state.vendors.forEach(v => {
      if (!grouped[v.category]) grouped[v.category] = [];
      grouped[v.category].push(v);
    });

    dom.vendorList.innerHTML = Object.entries(grouped).map(([category, vendors]) => `
      <div class="vendor-category-group">
        <h3 class="vendor-category-title">${formatCategory(category)}</h3>
        ${vendors.map(v => renderVendorCard(v)).join('')}
      </div>
    `).join('');

    dom.vendorList.querySelectorAll('.vendor-card').forEach(card => {
      const header = card.querySelector('.vendor-card__header');
      header.addEventListener('click', () => {
        const vendorKey = card.dataset.vendorKey;
        toggleVendorExpansion(vendorKey, card);
      });
    });
  }

  function renderVendorCard(vendor) {
    const isExpanded = state.expandedVendors.has(vendor.key);
    const expandedClass = isExpanded ? 'vendor-card--expanded' : '';
    const vendorRequests = getVendorRequests(vendor);

    return `
      <div class="vendor-card ${expandedClass}" data-vendor-key="${vendor.key}">
        <div class="vendor-card__header">
          <div class="vendor-card__info">
            <span class="vendor-card__name">${escapeHtml(vendor.name)}</span>
            <span class="vendor-card__badge vendor-card__badge--${vendor.category}">${vendor.category}</span>
          </div>
          <div class="vendor-card__meta">
            ${vendor.scripts?.length ? `<span class="vendor-card__stat">${vendor.scripts.length} script${vendor.scripts.length !== 1 ? 's' : ''}</span>` : ''}
            ${vendorRequests.length ? `<span class="vendor-card__stat">${vendorRequests.length} req</span>` : ''}
          </div>
          <svg class="vendor-card__expand" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div class="vendor-card__body">
          ${renderVendorDetails(vendor, vendorRequests)}
        </div>
      </div>
    `;
  }

  function renderVendorDetails(vendor, requests) {
    const sections = [];

    const signals = vendor.behavioralSignals || state.behavioralSignals.get(vendor.key) || [];
    if (signals.length > 0 || vendor.confidence > 0) {
      sections.push(`
        <div class="vendor-detail-section vendor-detail-section--behavioral">
          <h4 class="vendor-detail-title">
            Detection Evidence
            ${vendor.confidence ? `<span class="confidence-badge confidence-${getConfidenceLevel(vendor.confidence)}">${vendor.confidence}%</span>` : ''}
          </h4>
          <ul class="behavioral-signals">
            ${[...new Set(signals)].map(signal => `
              <li class="behavioral-signal">
                <span class="behavioral-signal__icon">!</span>
                ${escapeHtml(signal)}
              </li>
            `).join('')}
          </ul>
        </div>
      `);
    }

    const vendorCookies = vendor.cookies || state.cookies.filter(c => guessCookieVendor(c.name) === vendor.key);
    if (vendorCookies.length > 0) {
      sections.push(`
        <div class="vendor-detail-section">
          <h4 class="vendor-detail-title">Tracking Cookies</h4>
          <ul class="vendor-detail-list">
            ${vendorCookies.map(cookie => `
              <li class="vendor-detail-item vendor-detail-item--cookie">
                <span class="cookie-name">${escapeHtml(cookie.name)}</span>
                <code class="cookie-value">${escapeHtml(truncateValue(cookie.value || ''))}</code>
              </li>
            `).join('')}
          </ul>
        </div>
      `);
    }

    if (requests.length > 0) {
      sections.push(`
        <details class="vendor-detail-section vendor-detail-section--requests">
          <summary class="vendor-detail-title vendor-detail-title--clickable">
            Network Requests
            <span class="vendor-detail-count">${requests.length}</span>
          </summary>
          <ul class="vendor-detail-list">
            ${requests.slice(0, 10).map(req => `
              <li class="vendor-detail-item vendor-detail-item--request">
                <span class="vendor-detail-method">${req.method}</span>
                <span class="vendor-detail-url">${escapeHtml(truncateUrl(req.url, 60))}</span>
              </li>
            `).join('')}
            ${requests.length > 10 ? `<li class="vendor-detail-more">+${requests.length - 10} more</li>` : ''}
          </ul>
        </details>
      `);
    }

    if (vendor.scripts && vendor.scripts.length > 0) {
      sections.push(`
        <details class="vendor-detail-section">
          <summary class="vendor-detail-title vendor-detail-title--clickable">
            Scripts
            <span class="vendor-detail-count">${vendor.scripts.length}</span>
          </summary>
          <ul class="vendor-detail-list">
            ${vendor.scripts.map(script => `
              <li class="vendor-detail-item">${escapeHtml(truncateUrl(script, 60))}</li>
            `).join('')}
          </ul>
        </details>
      `);
    }

    if (sections.length === 0) {
      sections.push(`
        <div class="vendor-detail-empty">
          <p>Vendor detected but no details captured yet.</p>
        </div>
      `);
    }

    return sections.join('');
  }

  function toggleVendorExpansion(vendorKey, cardElement) {
    if (state.expandedVendors.has(vendorKey)) {
      state.expandedVendors.delete(vendorKey);
      cardElement.classList.remove('vendor-card--expanded');
    } else {
      state.expandedVendors.add(vendorKey);
      cardElement.classList.add('vendor-card--expanded');
    }
  }

  function getVendorRequests(vendor) {
    const patterns = getVendorPatterns(vendor.key);
    return state.network.filter(req => patterns.some(p => req.url.includes(p)));
  }

  function getVendorPatterns(vendorKey) {
    const patterns = {
      adobe_launch: ['assets.adobedtm.com', 'launch-'],
      adobe_alloy: ['edge.adobedc.net', 'alloy'],
      adobe_analytics: ['omtrdc.net', '2o7.net'],
      google_gtm: ['googletagmanager.com', 'gtm.js'],
      google_analytics: ['google-analytics.com', 'collect?'],
      google_ga4: ['analytics.google.com', 'gtag', 'google-analytics.com/g/collect'],
      onetrust: ['onetrust.com', 'optanon'],
      cookiebot: ['cookiebot.com', 'CookieConsent'],
      hotjar: ['hotjar.com', 'static.hotjar.com'],
      segment: ['segment.com', 'segment.io', 'api.segment.io'],
      mixpanel: ['mixpanel.com', 'api.mixpanel.com'],
      amplitude: ['amplitude.com', 'api.amplitude.com'],
      facebook_pixel: ['facebook.com/tr', 'connect.facebook.net'],
      linkedin_insight: ['linkedin.com/px', 'snap.licdn.com']
    };
    return patterns[vendorKey] || [vendorKey];
  }

  function associateRequestWithVendor(request) {
    state.vendors.forEach(vendor => {
      const patterns = getVendorPatterns(vendor.key);
      if (patterns.some(p => request.url.includes(p))) {
        vendor.requests = vendor.requests || [];
        vendor.requests.push(request);
      }
    });
  }

  // ============================================================
  // NETWORK RENDERING
  // ============================================================

  function renderNetwork() {
    if (state.network.length === 0) {
      dom.networkEmpty.style.display = 'block';
      dom.networkList.innerHTML = '';
      return;
    }

    dom.networkEmpty.style.display = 'none';
    dom.networkList.innerHTML = state.network.slice(0, 50).map(req => `
      <div class="network-card">
        <div class="network-card__header">
          <span class="network-card__method network-card__method--${req.method?.toLowerCase()}">${req.method}</span>
          <span class="network-card__type">${req.type || 'request'}</span>
          <span class="network-card__time">${formatTime(req.timestamp)}</span>
        </div>
        <div class="network-card__url">${escapeHtml(truncateUrl(req.url, 60))}</div>
        ${req.body ? `
          <details class="network-card__payload">
            <summary>Payload</summary>
            <pre>${escapeHtml(typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2))}</pre>
          </details>
        ` : ''}
      </div>
    `).join('');
  }

  // ============================================================
  // DATA LAYER
  // ============================================================

  function handleDataLayer(type, payload) {
    if (type === 'DATALAYER_PUSH') {
      if (!state.dataLayers.pushes) state.dataLayers.pushes = [];
      state.dataLayers.pushes.push(payload);
    } else if (type === 'DATALAYER_DETECTED') {
      state.dataLayers[payload.layer] = payload.data;
    } else if (type === 'DATALAYER_SNAPSHOT') {
      state.dataLayers.snapshot = payload.layers;
    }
    renderDataLayer();
  }

  function renderDataLayer() {
    dom.dataLayerView.textContent = JSON.stringify(state.dataLayers, null, 2) || 'No data layer activity';
  }

  // ============================================================
  // CONSENT
  // ============================================================

  function renderConsent() {
    // No longer showing consent in header, just in timeline
  }

  // ============================================================
  // INJECTION CONTROLS
  // ============================================================

  document.getElementById('spoof-ecid')?.addEventListener('click', async () => {
    const value = document.getElementById('spoof-ecid-value').value.trim() || undefined;
    await sendCommand('SPOOF_ECID', { value });
  });

  document.getElementById('block-alloy')?.addEventListener('click', async () => {
    await sendCommand('BLOCK_ALLOY');
  });

  document.getElementById('fake-consent')?.addEventListener('click', async () => {
    const groups = document.getElementById('fake-consent-groups').value.trim() || undefined;
    await sendCommand('FAKE_CONSENT', { groups });
  });

  document.getElementById('snapshot-datalayer')?.addEventListener('click', async () => {
    await sendCommand('GET_DATA_LAYERS');
  });

  document.getElementById('clear-network')?.addEventListener('click', () => {
    state.network = [];
    renderNetwork();
  });

  document.getElementById('refresh-vendors')?.addEventListener('click', async () => {
    const tab = await getCurrentTab();
    if (tab) {
      chrome.tabs.reload(tab.id);
      state.vendors = [];
      state.identities = [];
      state.network = [];
      state.dataLayers = {};
      state.consent = null;
      state.expandedVendors.clear();
      renderVendors();
      renderNetwork();
      renderDataLayer();
    }
  });

  document.getElementById('refresh-timeline')?.addEventListener('click', async () => {
    const tab = await getCurrentTab();
    if (tab) {
      chrome.tabs.reload(tab.id);
    }
  });

  document.getElementById('refresh-identity')?.addEventListener('click', async () => {
    console.log('[WIW] Manual identity graph refresh triggered');
    await renderIdentityGraph();
  });

  async function sendCommand(command, payload = {}) {
    const tab = await getCurrentTab();
    if (!tab) {
      logInject('No active tab');
      return;
    }

    chrome.runtime.sendMessage({
      type: 'INJECT_COMMAND',
      tabId: tab.id,
      command: command,
      payload: payload
    });
    logInject(`Sent: ${command}`);
  }

  function handleInjectResult(result) {
    logInject(`${result.command}: ${result.success ? 'Success' : 'Failed'}${result.value ? ` (${result.value})` : ''}`);
  }

  function logInject(message) {
    const timestamp = new Date().toLocaleTimeString();
    if (dom.injectLog) {
      dom.injectLog.textContent = `[${timestamp}] ${message}\n` + dom.injectLog.textContent;
    }
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  function formatVendorName(key) {
    const names = {
      'adobe': 'Adobe', 'adobe_analytics': 'Adobe Analytics', 'adobe_launch': 'Adobe Launch',
      'adobe_alloy': 'Adobe Web SDK',
      'google_analytics': 'Google Analytics', 'google_ga4': 'Google Analytics 4',
      'google_tag_manager': 'Google Tag Manager',
      'facebook_pixel': 'Facebook Pixel', 'linkedin_insight': 'LinkedIn Insight',
      'marketo': 'Marketo', 'hubspot': 'HubSpot',
      'sixsense': '6sense', '_6sense': '6sense', 'bombora': 'Bombora',
      'segment': 'Segment', 'mixpanel': 'Mixpanel', 'amplitude': 'Amplitude',
      'hotjar': 'Hotjar', 'fullstory': 'FullStory', 'clarity': 'Microsoft Clarity',
      'onetrust': 'OneTrust', 'cookiebot': 'Cookiebot', 'trustarc': 'TrustArc',
      'intercom': 'Intercom', 'drift': 'Drift',
      'first_party_proxy': 'First-Party Proxy',
      'unknown_behavioral': 'Unknown Tracker'
    };
    return names[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  function guessCategory(vendorKey) {
    const categories = {
      'adobe': 'analytics', 'adobe_analytics': 'analytics', 'adobe_launch': 'analytics',
      'adobe_alloy': 'analytics',
      'google_analytics': 'analytics', 'google_ga4': 'analytics',
      'google_tag_manager': 'tag_manager',
      'facebook_pixel': 'advertising', 'linkedin_insight': 'advertising',
      'marketo': 'marketing', 'hubspot': 'marketing',
      'sixsense': 'intent', '_6sense': 'intent', 'bombora': 'intent',
      'segment': 'analytics', 'mixpanel': 'analytics', 'amplitude': 'analytics',
      'hotjar': 'analytics', 'fullstory': 'analytics', 'clarity': 'analytics',
      'onetrust': 'consent', 'cookiebot': 'consent', 'trustarc': 'consent',
      'intercom': 'chat', 'drift': 'chat',
      'first_party_proxy': 'proxy',
      'unknown_behavioral': 'unknown'
    };
    return categories[vendorKey] || 'unknown';
  }

  function formatCategory(category) {
    const labels = {
      analytics: 'Analytics',
      marketing: 'Marketing',
      intent: 'Intent Data',
      consent: 'Consent',
      tag_manager: 'Tag Managers',
      advertising: 'Advertising',
      chat: 'Chat & Support',
      proxy: 'First-Party Proxies',
      unknown: 'Unknown'
    };
    return labels[category] || category;
  }

  function guessCookieVendor(cookieName) {
    const cookieVendorMap = {
      '_ga': 'google_analytics', '_gid': 'google_analytics', '_gat': 'google_analytics',
      's_vi': 'adobe_analytics', 'AMCV_': 'adobe_analytics', 's_fid': 'adobe_analytics',
      '_fbp': 'facebook_pixel', '_fbc': 'facebook_pixel',
      '_mkto_trk': 'marketo',
      '__hstc': 'hubspot', 'hubspotutk': 'hubspot',
      '_hjid': 'hotjar', '_hjSessionUser': 'hotjar',
      '_6si': 'sixsense',
      'li_sugr': 'linkedin_insight',
      'mp_': 'mixpanel',
      'ajs_': 'segment'
    };

    for (const [prefix, vendor] of Object.entries(cookieVendorMap)) {
      if (cookieName.startsWith(prefix)) {
        return vendor;
      }
    }
    return null;
  }

  function getConfidenceLevel(confidence) {
    if (confidence >= 90) return 'high';
    if (confidence >= 70) return 'medium';
    return 'low';
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }

  function truncateUrl(url, maxLen = 60) {
    if (!url) return '';
    if (url.length > maxLen) {
      return url.substring(0, maxLen - 3) + '...';
    }
    return url;
  }

  function truncateValue(value) {
    if (!value) return '';
    if (value.length > 24) {
      return value.substring(0, 21) + '...';
    }
    return value;
  }

  function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================================
  // IDENTITY GRAPH ZOOM CONTROLS
  // ============================================================

  dom.zoomIn?.addEventListener('click', () => {
    if (identityGraphZoom) {
      const svg = d3.select('#identity-graph');
      svg.transition().duration(300).call(identityGraphZoom.scaleBy, 1.3);
    }
  });

  dom.zoomOut?.addEventListener('click', () => {
    if (identityGraphZoom) {
      const svg = d3.select('#identity-graph');
      svg.transition().duration(300).call(identityGraphZoom.scaleBy, 0.7);
    }
  });

  dom.zoomReset?.addEventListener('click', () => {
    if (identityGraphZoom) {
      const svg = d3.select('#identity-graph');
      svg.transition().duration(300).call(identityGraphZoom.transform, d3.zoomIdentity);
    }
  });

  // ============================================================
  // SETTINGS MODAL
  // ============================================================

  dom.settingsBtn?.addEventListener('click', () => {
    dom.settingsModal?.classList.add('active');
  });

  dom.settingsClose?.addEventListener('click', () => {
    dom.settingsModal?.classList.remove('active');
  });

  // Close modal when clicking outside
  dom.settingsModal?.addEventListener('click', (e) => {
    if (e.target === dom.settingsModal) {
      dom.settingsModal.classList.remove('active');
    }
  });

  // Clear all data
  dom.clearAllDataBtn?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear ALL stored data? This will remove all sessions, events, identities, and links.')) {
      await clearAllData();

      // Reset in-memory state
      state.session = null;
      state.events = [];
      state.vendors = [];
      state.identities = [];
      state.network = [];
      state.dataLayers = {};
      state.consent = null;
      state.cookies = [];
      state.fingerprints = [];
      state.behavioralSignals.clear();
      state.expandedVendors.clear();
      state.expandedTimeline.clear();
      state.expandedBursts.clear();
      state.messageQueue = [];

      // Re-initialize with current tab
      const tab = await getCurrentTab();
      if (tab) {
        state.session = await getOrCreateSession(tab.url);
        updateSessionUI();
      }

      // Clear UI
      renderTimeline();
      renderVendors();
      renderNetwork();
      renderDataLayer();
      renderIdentityGraph();

      dom.settingsModal?.classList.remove('active');
      console.log('[WIW] All data cleared');
    }
  });

  // Clear current session only
  dom.clearSessionDataBtn?.addEventListener('click', async () => {
    if (!state.session) {
      alert('No active session to clear.');
      return;
    }

    if (confirm(`Clear all data for session "${state.session.domain}"?`)) {
      await clearSession(state.session.id);

      // Reset in-memory state
      state.events = [];
      state.vendors = [];
      state.identities = [];
      state.network = [];
      state.dataLayers = {};
      state.consent = null;
      state.cookies = [];
      state.fingerprints = [];
      state.behavioralSignals.clear();
      state.expandedVendors.clear();
      state.expandedTimeline.clear();
      state.expandedBursts.clear();

      // Create new session for same URL
      const tab = await getCurrentTab();
      if (tab) {
        state.session = await getOrCreateSession(tab.url);
        updateSessionUI();
      }

      // Clear UI
      renderTimeline();
      renderVendors();
      renderNetwork();
      renderDataLayer();
      renderIdentityGraph();

      dom.settingsModal?.classList.remove('active');
      console.log('[WIW] Session data cleared');
    }
  });

  // ============================================================
  // REPORT EXPORT
  // ============================================================

  dom.exportHtmlBtn?.addEventListener('click', async () => {
    await exportReport('html');
  });

  dom.exportMarkdownBtn?.addEventListener('click', async () => {
    await exportReport('markdown');
  });

  async function exportReport(format) {
    if (!state.session) {
      alert('No active session to export.');
      return;
    }

    try {
      console.log('[WIW] Generating', format, 'report...');
      const content = await generateReport(state.session.id, format);

      const ext = format === 'html' ? 'html' : 'md';
      const mimeType = format === 'html' ? 'text/html' : 'text/markdown';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${state.session.domain}-report-${timestamp}.${ext}`;

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      dom.settingsModal?.classList.remove('active');
      console.log('[WIW] Report exported:', filename);
    } catch (err) {
      console.error('[WIW] Export error:', err);
      alert('Error generating report: ' + err.message);
    }
  }

  // ============================================================
  // AUDIT MODE
  // ============================================================

  // Mode toggle
  dom.modeMonitor?.addEventListener('click', () => {
    dom.modeMonitor?.classList.add('active');
    dom.modeAudit?.classList.remove('active');
    dom.monitorPanel?.classList.remove('hidden');
    dom.auditPanel?.classList.add('hidden');
    dom.auditActivePanel?.classList.add('hidden');
  });

  dom.modeAudit?.addEventListener('click', () => {
    dom.modeAudit?.classList.add('active');
    dom.modeMonitor?.classList.remove('active');
    dom.monitorPanel?.classList.add('hidden');

    // Check if audit is active
    const status = auditController.getStatus();
    if (status.isActive) {
      dom.auditPanel?.classList.add('hidden');
      dom.auditActivePanel?.classList.remove('hidden');
    } else {
      dom.auditPanel?.classList.remove('hidden');
      dom.auditActivePanel?.classList.add('hidden');
      loadTrackerChecklist();
    }
  });

  // Common trackers that can always be blocked, even if not detected
  const COMMON_TRACKERS = [
    { name: '6sense', key: '6sense', category: 'intent' },
    { name: 'Adobe', key: 'adobe', category: 'analytics' },
    { name: 'Facebook', key: 'facebook', category: 'advertising' },
    { name: 'Google Analytics', key: 'google_analytics', category: 'analytics' },
    { name: 'Google Tag Manager', key: 'google_tag_manager', category: 'tag_manager' },
    { name: 'LinkedIn', key: 'linkedin', category: 'advertising' },
    { name: 'Microsoft', key: 'microsoft', category: 'analytics' },
    { name: 'Marketo', key: 'marketo', category: 'marketing' },
    { name: 'Hotjar', key: 'hotjar', category: 'analytics' },
    { name: 'HubSpot', key: 'hubspot', category: 'marketing' },
    { name: 'Segment', key: 'segment', category: 'analytics' },
    { name: 'Mixpanel', key: 'mixpanel', category: 'analytics' },
    { name: 'Heap', key: 'heap', category: 'analytics' },
    { name: 'Amplitude', key: 'amplitude', category: 'analytics' },
    { name: 'Qualtrics', key: 'qualtrics', category: 'analytics' },
    { name: 'Twitter/X Pixel', key: 'twitter', category: 'advertising' },
    { name: 'TrustArc', key: 'trustarc', category: 'consent' },
    { name: 'Akamai', key: 'akamai', category: 'analytics' },
    { name: 'First-Party Proxy', key: 'first_party_proxy', category: 'proxy' }
  ];

  function loadTrackerChecklist() {
    if (!dom.trackerChecklist) return;

    const detectedKeys = new Set(state.vendors.map(v => v.key));
    const detectedVendors = state.vendors;

    // Get common trackers not already detected
    const additionalTrackers = COMMON_TRACKERS.filter(t => !detectedKeys.has(t.key));

    let html = '';

    // Section 1: Detected on this page (checked by default)
    if (detectedVendors.length > 0) {
      html += `<div class="tracker-section">
        <h4 class="tracker-section__title">Detected on this page</h4>
        ${detectedVendors.map(v => `
          <label class="tracker-option tracker-option--detected">
            <input type="checkbox" value="${escapeHtml(v.key)}" data-name="${escapeHtml(v.name)}" checked>
            <span>${escapeHtml(v.name)}</span>
            <small>${v.requests?.length || 0} req</small>
          </label>
        `).join('')}
      </div>`;
    }

    // Section 2: Common trackers (unchecked by default)
    if (additionalTrackers.length > 0) {
      html += `<div class="tracker-section">
        <h4 class="tracker-section__title">Common trackers</h4>
        ${additionalTrackers.map(t => `
          <label class="tracker-option">
            <input type="checkbox" value="${escapeHtml(t.key)}" data-name="${escapeHtml(t.name)}">
            <span>${escapeHtml(t.name)}</span>
            <small>${t.category}</small>
          </label>
        `).join('')}
      </div>`;
    }

    // Empty state
    if (detectedVendors.length === 0 && additionalTrackers.length === 0) {
      html = '<p class="audit-loading">No trackers available. Try browsing a website first.</p>';
    }

    dom.trackerChecklist.innerHTML = html;
  }

  dom.selectAllTrackers?.addEventListener('click', () => {
    const checkboxes = dom.trackerChecklist?.querySelectorAll('input[type="checkbox"]');
    const allChecked = Array.from(checkboxes || []).every(cb => cb.checked);
    checkboxes?.forEach(cb => cb.checked = !allChecked);
  });

  dom.startAuditBtn?.addEventListener('click', async () => {
    const selected = Array.from(dom.trackerChecklist?.querySelectorAll('input:checked') || [])
      .map(cb => cb.dataset.name);

    if (selected.length === 0) {
      alert('Please select at least one vendor to block.');
      return;
    }

    const tab = await getCurrentTab();
    const result = await auditController.startAudit(selected, tab?.url);

    if (result.success) {
      // Set up leak detection callback
      auditController.onLeakDetected = (leak) => {
        updateAuditStats();
        addLeakToUI(leak);
      };

      auditController.onBlockDetected = () => {
        updateAuditStats();
      };

      // Switch to active panel
      dom.auditPanel?.classList.add('hidden');
      dom.auditActivePanel?.classList.remove('hidden');
      dom.auditBlockedCount.textContent = `Blocking ${selected.length} trackers`;

      updateAuditStats();
      console.log('[WIW] Audit started');
    }
  });

  function updateAuditStats() {
    const status = auditController.getStatus();
    if (dom.auditStatAttempted) dom.auditStatAttempted.textContent = status.attemptedCount;
    if (dom.auditStatBlocked) dom.auditStatBlocked.textContent = status.blockedCount;
    if (dom.auditStatLeaked) dom.auditStatLeaked.textContent = status.leakedCount;
  }

  function addLeakToUI(leak) {
    if (!dom.auditLeaks) return;

    const item = document.createElement('div');
    item.className = 'audit-leak-item';
    item.innerHTML = `
      <strong>${escapeHtml(leak.vendor || 'Unknown')}</strong>
      <div>Method: ${escapeHtml(leak.method)}</div>
      <div>${escapeHtml(leak.url.substring(0, 60))}...</div>
    `;
    dom.auditLeaks.insertBefore(item, dom.auditLeaks.firstChild);
  }

  // Handle blocked request from background.js onRuleMatchedDebug
  // Handle ALL tracking requests (before blocking decision)
  function handleAuditAttempt(payload) {
    if (!auditController.isActive) return;

    // Only count if this vendor is in our block list
    if (!payload.vendor) return;

    // Initialize attemptedRequests if needed
    if (!auditController.attemptedRequests) {
      auditController.attemptedRequests = [];
    }

    // Dedupe by URL (same request might fire multiple times)
    const exists = auditController.attemptedRequests.some(
      r => r.url === payload.url && Math.abs(r.timestamp - payload.timestamp) < 1000
    );
    if (exists) return;

    // Record the attempted request
    auditController.attemptedRequests.push({
      url: payload.url,
      vendor: payload.vendor,
      type: payload.type,
      timestamp: payload.timestamp
    });

    console.log('[WIW] Audit attempt:', payload.vendor, payload.url.substring(0, 50));

    // Update UI with new counts
    updateAuditStats();
  }

  // Handle blocked requests (confirmed by onRuleMatchedDebug)
  function handleAuditBlock(payload) {
    if (!auditController.isActive) return;

    // Record the blocked request
    auditController.blockedRequests.push({
      url: payload.url,
      vendor: payload.vendor,
      type: payload.type,
      timestamp: payload.timestamp
    });

    console.log('[WIW] Audit block recorded:', payload.vendor, payload.url.substring(0, 50));

    // Update UI
    updateAuditStats();

    // Call the callback if set
    if (auditController.onBlockDetected) {
      auditController.onBlockDetected(payload);
    }
  }

  // Handle potential leak check from background.js webRequest
  function handleAuditLeakCheck(payload) {
    if (!auditController.isActive) return;

    // Check if this vendor was supposed to be blocked
    if (payload.vendor && auditController.blockedVendors.has(payload.vendor)) {
      // This request completed successfully but should have been blocked - it's a leak!
      const leak = {
        url: payload.url,
        vendor: payload.vendor,
        type: payload.type,
        method: 'bypass',
        timestamp: payload.timestamp
      };

      auditController.leakedRequests.push(leak);
      console.warn('[WIW] Audit leak detected:', payload.vendor, payload.url.substring(0, 50));

      // Update UI
      updateAuditStats();
      addLeakToUI(leak);

      // Call the callback if set
      if (auditController.onLeakDetected) {
        auditController.onLeakDetected(leak);
      }
    }
  }

  dom.stopAuditBtn?.addEventListener('click', async () => {
    const report = await auditController.stopAudit();
    state.lastAuditReport = report;

    // Switch back to setup panel
    dom.auditActivePanel?.classList.add('hidden');
    dom.auditPanel?.classList.remove('hidden');

    // Show results
    alert(`Audit Complete!\n\nBlock Rate: ${report.summary.blockRate}\nBlocked: ${report.summary.blockedTrackers}\nLeaked: ${report.summary.leakedTrackers}\nStatus: ${report.summary.complianceStatus}`);

    console.log('[WIW] Audit stopped, report:', report);
  });

  dom.exportAuditBtn?.addEventListener('click', async () => {
    let report = state.lastAuditReport;

    // If audit is still active, stop it first to get accurate report
    if (!report && auditController.isActive) {
      report = await auditController.stopAudit();
      state.lastAuditReport = report;

      // Switch back to setup panel since audit ended
      dom.auditActivePanel?.classList.add('hidden');
      dom.auditPanel?.classList.remove('hidden');
    } else if (!report) {
      // Generate report with current data
      report = auditController.generateReport();
    }

    const domain = state.session?.domain || 'audit';
    AuditReportGenerator.exportHTML(report, domain);
  });

  // ============================================================
  // TAB CHANGE LISTENER (domain update fix)
  // ============================================================

  // Listen for tab URL changes to update domain badge
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only care about URL changes in the current tab
    if (tabId !== state.currentTabId || !changeInfo.url) return;

    const newDomain = new URL(changeInfo.url).hostname;
    const currentDomain = state.session?.domain;

    console.log('[WIW] Tab URL changed:', currentDomain, '->', newDomain);

    // If domain changed, create new session
    if (newDomain !== currentDomain) {
      state.session = await getOrCreateSession(changeInfo.url);
      updateSessionUI();

      // Clear in-memory state for fresh start
      state.events = [];
      state.vendors = [];
      state.identities = [];
      state.network = [];
      state.dataLayers = {};
      state.consent = null;
      state.cookies = [];
      state.fingerprints = [];
      state.behavioralSignals.clear();
      state.expandedVendors.clear();
      state.expandedTimeline.clear();
      state.expandedBursts.clear();
      state.messageQueue = [];

      // Reload timeline from new session
      await loadTimeline();
      renderVendors();
      renderNetwork();
      renderDataLayer();

      console.log('[WIW] Session switched to:', state.session.domain);
    }
  });

  // Also listen for tab activation (switching tabs)
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url || tab.url.startsWith('chrome://')) return;

    state.currentTabId = tab.id;
    const newDomain = new URL(tab.url).hostname;
    const currentDomain = state.session?.domain;

    if (newDomain !== currentDomain) {
      console.log('[WIW] Tab switched, domain change:', currentDomain, '->', newDomain);

      state.session = await getOrCreateSession(tab.url);
      updateSessionUI();

      // Clear in-memory state
      state.events = [];
      state.vendors = [];
      state.identities = [];
      state.network = [];
      state.dataLayers = {};
      state.consent = null;
      state.cookies = [];
      state.fingerprints = [];
      state.behavioralSignals.clear();
      state.expandedVendors.clear();
      state.expandedTimeline.clear();
      state.expandedBursts.clear();

      // Reload from session
      await loadTimeline();
      renderVendors();
      renderNetwork();
      renderDataLayer();
    }
  });

  // ============================================================
  // START
  // ============================================================

  init();
  renderVendors();
  renderNetwork();
  renderDataLayer();

  console.log('[who-is-watching] Side panel loaded');
})();
