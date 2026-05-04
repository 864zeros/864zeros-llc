// ============================================================
// PANEL — DevTools Panel UI Logic
// Main UI controller for the Who Is Watching panel.
// Receives data from background via port connection.
// ============================================================

(function() {
  'use strict';

  // --- State ---
  const state = {
    vendors: [],
    identities: [],
    network: [],
    dataLayers: {},
    consent: null
  };

  // --- Connection to Background ---
  const port = chrome.runtime.connect({ name: 'devtools' });
  const tabId = chrome.devtools.inspectedWindow.tabId;

  // Initialize connection with tab ID
  port.postMessage({ type: 'INIT', tabId: tabId });

  // Listen for messages from background
  port.onMessage.addListener((msg) => {
    switch (msg.type) {
      case 'VENDOR_DETECTED':
        handleVendorDetected(msg.payload);
        break;
      case 'IDENTITY_DETECTED':
        handleIdentityDetected(msg.payload);
        break;
      case 'NETWORK_REQUEST':
        handleNetworkRequest(msg.payload);
        break;
      case 'DATALAYER_PUSH':
      case 'DATALAYER_DETECTED':
      case 'DATALAYER_SNAPSHOT':
        handleDataLayer(msg.type, msg.payload);
        break;
      case 'CONSENT_DETECTED':
        handleConsentDetected(msg.payload);
        break;
      case 'INJECT_RESULT':
        handleInjectResult(msg.payload);
        break;
      case 'HOOK_READY':
        logInject('Hook script ready');
        break;
    }
  });

  // --- Tab Navigation ---
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all tabs and buttons
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

      // Activate clicked tab
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById(tabId).classList.add('active');

      // Re-render identity graph if switching to it
      if (tabId === 'identity') {
        renderIdentityGraph();
      }
    });
  });

  // --- Vendor Handling ---
  function handleVendorDetected(vendor) {
    // Deduplicate by vendor key
    const exists = state.vendors.find(v => v.key === vendor.key);
    if (exists) return;

    state.vendors.push(vendor);
    renderVendors();
  }

  function renderVendors() {
    const list = document.getElementById('vendor-list');
    const count = document.getElementById('vendor-count');

    if (state.vendors.length === 0) {
      list.innerHTML = '<li class="empty-state">No vendors detected yet</li>';
      count.textContent = '0 vendors';
      return;
    }

    count.textContent = `${state.vendors.length} vendor${state.vendors.length !== 1 ? 's' : ''}`;

    // Group by category
    const grouped = {};
    state.vendors.forEach(v => {
      if (!grouped[v.category]) grouped[v.category] = [];
      grouped[v.category].push(v);
    });

    list.innerHTML = Object.entries(grouped).map(([category, vendors]) => `
      <li class="vendor-group">
        <h4 class="vendor-category">${formatCategory(category)}</h4>
        ${vendors.map(v => `
          <div class="vendor-item vendor--${v.category}">
            <span class="vendor-name">${escapeHtml(v.name)}</span>
            <span class="vendor-badge">${v.category}</span>
          </div>
        `).join('')}
      </li>
    `).join('');
  }

  function formatCategory(category) {
    const labels = {
      analytics: 'Analytics',
      marketing: 'Marketing Automation',
      intent: 'Intent Data',
      consent: 'Consent Management'
    };
    return labels[category] || category;
  }

  // --- Identity Handling ---
  function handleIdentityDetected(identity) {
    // Deduplicate by type + value
    const exists = state.identities.find(i => i.type === identity.type && i.value === identity.value);
    if (exists) return;

    state.identities.push(identity);
    renderIdentityGraph();
  }

  function renderIdentityGraph() {
    const svg = d3.select('#identity-graph');
    svg.selectAll('*').remove();

    if (state.identities.length === 0) {
      document.getElementById('identity-details').innerHTML =
        '<p class="empty-state">No identities detected yet. Visit a page with Adobe, Google Analytics, or similar tracking.</p>';
      return;
    }

    const container = svg.node().parentElement;
    const width = container.clientWidth || 400;
    const height = 350;

    svg.attr('width', width).attr('height', height);

    // Create nodes from identities
    const nodes = state.identities.map((id, i) => ({
      id: `${id.type}-${id.value}`,
      type: id.type,
      value: id.value,
      source: id.source,
      index: i
    }));

    // Create links between identities from the same source
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        // Link identities that share a source or represent user stitching
        if (nodes[i].source === nodes[j].source ||
            (nodes[i].type === 'ECID' && nodes[j].type === 'CUID') ||
            (nodes[i].type === 'ECID' && nodes[j].type === 'USER_ID')) {
          links.push({ source: nodes[i], target: nodes[j] });
        }
      }
    }

    // D3 Force Simulation
    const simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50))
      .force('link', d3.forceLink(links).distance(100));

    // Draw links
    const link = svg.selectAll('.link')
      .data(links)
      .enter().append('line')
      .attr('class', 'link')
      .attr('stroke', '#555')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    // Draw nodes
    const node = svg.selectAll('.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => showIdentityDetails(d));

    node.append('circle')
      .attr('r', 25)
      .attr('fill', d => getIdentityColor(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    node.append('text')
      .text(d => d.type)
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('font-weight', '600');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Show details panel with summary
    document.getElementById('identity-details').innerHTML = `
      <p><strong>${nodes.length}</strong> identity node${nodes.length !== 1 ? 's' : ''} detected. Click a node for details.</p>
    `;
  }

  function getIdentityColor(type) {
    const colors = {
      ECID: '#FF4444',
      CUID: '#4285F4',
      GA_CID: '#FBBC05',
      USER_ID: '#34A853'
    };
    return colors[type] || '#888';
  }

  function showIdentityDetails(identity) {
    document.getElementById('identity-details').innerHTML = `
      <div class="identity-detail">
        <h4>${identity.type}</h4>
        <p class="identity-value">${escapeHtml(identity.value)}</p>
        <p class="identity-source">Source: ${escapeHtml(identity.source)}</p>
      </div>
    `;
  }

  // --- Network Handling ---
  function handleNetworkRequest(request) {
    state.network.unshift(request); // Add to front
    if (state.network.length > 100) state.network.pop(); // Keep last 100
    renderNetwork();
  }

  function renderNetwork() {
    const log = document.getElementById('network-log');

    if (state.network.length === 0) {
      log.innerHTML = '<li class="empty-state">No tracking requests captured yet</li>';
      return;
    }

    log.innerHTML = state.network.slice(0, 50).map(req => `
      <li class="network-item network--${req.type}">
        <div class="network-header">
          <span class="network-method">${req.method}</span>
          <span class="network-type">${req.type}</span>
          <span class="network-time">${formatTime(req.timestamp)}</span>
        </div>
        <div class="network-url">${escapeHtml(truncateUrl(req.url))}</div>
        ${req.body ? `<details class="network-body"><summary>Payload</summary><pre>${escapeHtml(typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2))}</pre></details>` : ''}
      </li>
    `).join('');
  }

  // --- Data Layer Handling ---
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
    const view = document.getElementById('datalayer-view');
    view.textContent = JSON.stringify(state.dataLayers, null, 2) || 'No data layer activity';
  }

  // --- Consent Handling ---
  function handleConsentDetected(consent) {
    state.consent = consent;
    renderConsent();
  }

  function renderConsent() {
    const badge = document.getElementById('consent-status');
    if (!state.consent) {
      badge.textContent = 'No consent platform';
      badge.className = 'badge badge--pending';
      return;
    }

    badge.textContent = state.consent.platform;
    badge.className = `badge badge--consent`;
  }

  // --- Injection Controls ---
  document.getElementById('spoof-ecid').addEventListener('click', () => {
    const value = document.getElementById('spoof-ecid-value').value.trim() || undefined;
    sendCommand('SPOOF_ECID', { value });
  });

  document.getElementById('block-alloy').addEventListener('click', () => {
    sendCommand('BLOCK_ALLOY');
  });

  document.getElementById('fake-consent').addEventListener('click', () => {
    const groups = document.getElementById('fake-consent-groups').value.trim() || undefined;
    sendCommand('FAKE_CONSENT', { groups });
  });

  document.getElementById('snapshot-datalayer').addEventListener('click', () => {
    sendCommand('GET_DATA_LAYERS');
  });

  document.getElementById('clear-network').addEventListener('click', () => {
    state.network = [];
    renderNetwork();
  });

  document.getElementById('refresh-vendors').addEventListener('click', () => {
    chrome.devtools.inspectedWindow.reload();
  });

  function sendCommand(command, payload = {}) {
    port.postMessage({
      type: 'INJECT_COMMAND',
      command: command,
      payload: payload
    });
    logInject(`Sent: ${command}`);
  }

  function handleInjectResult(result) {
    logInject(`${result.command}: ${result.success ? 'Success' : 'Failed'}${result.value ? ` (${result.value})` : ''}`);
  }

  function logInject(message) {
    const log = document.getElementById('inject-log');
    const timestamp = new Date().toLocaleTimeString();
    log.textContent = `[${timestamp}] ${message}\n` + log.textContent;
  }

  // --- Utilities ---
  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }

  function truncateUrl(url) {
    if (url.length > 80) {
      return url.substring(0, 77) + '...';
    }
    return url;
  }

  function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- Initial Render ---
  renderVendors();
  renderNetwork();
  renderDataLayer();

  console.log('[who-is-watching] Panel initialized for tab', tabId);
})();
