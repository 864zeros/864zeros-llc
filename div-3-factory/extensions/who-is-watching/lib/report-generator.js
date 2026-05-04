// ============================================================
// REPORT GENERATOR — Who Is Watching
// Generates HTML and Markdown reports from session data.
// ============================================================

import {
  getSession,
  getSessionTimeline,
  getSessionIdentities,
  getSessionLinks
} from './db.js';

import { JourneyAnalyzer } from './journey.js';

// ============================================================
// MAIN EXPORT
// ============================================================

export async function generateReport(sessionId, format = 'html') {
  const data = await gatherReportData(sessionId);

  switch (format) {
    case 'html':
      return generateHTMLReport(data);
    case 'markdown':
      return generateMarkdownReport(data);
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

// ============================================================
// DATA GATHERING
// ============================================================

async function gatherReportData(sessionId) {
  const session = await getSession(sessionId);
  const events = await getSessionTimeline(sessionId, { limit: 10000 });
  const identities = await getSessionIdentities(sessionId);
  const links = await getSessionLinks(sessionId);

  // Compute vendor summaries from events
  const vendors = computeVendorSummaries(events, identities);

  // Compute statistics
  const stats = computeStats(events, identities, links, vendors);

  // Generate findings
  const findings = generateFindings(stats, vendors, identities);

  // Generate journey narrative
  const journeyAnalyzer = new JourneyAnalyzer(events, identities, vendors);
  const journey = journeyAnalyzer.generateNarrative();

  return {
    session,
    events,
    identities,
    links,
    vendors,
    stats,
    findings,
    journey
  };
}

function computeVendorSummaries(events, identities) {
  const vendorMap = new Map();

  events.forEach(event => {
    const vendorKey = event.vendorKey || event.vendor;
    if (!vendorKey) return;

    if (!vendorMap.has(vendorKey)) {
      vendorMap.set(vendorKey, {
        name: event.vendorName || formatVendorName(vendorKey),
        key: vendorKey,
        category: event.vendorCategory || guessCategory(vendorKey),
        confidence: 0,
        detectionMethod: event.detectionMethod || 'unknown',
        eventCount: 0,
        cookies: [],
        requests: [],
        identities: [],
        behavioralSignals: new Set()
      });
    }

    const vendor = vendorMap.get(vendorKey);
    vendor.eventCount++;

    if (event.confidence) {
      vendor.confidence = Math.max(vendor.confidence, event.confidence);
    }

    if (event.type === 'cookie_set' && event.cookieName) {
      if (!vendor.cookies.find(c => c.name === event.cookieName)) {
        vendor.cookies.push({ name: event.cookieName, isTracking: event.isTracking });
      }
    }

    if (event.type === 'network_request' && event.url) {
      vendor.requests.push({ url: event.url, method: event.method });
    }

    if (event.behavioralSignals) {
      event.behavioralSignals.forEach(s => vendor.behavioralSignals.add(s));
    }
  });

  // Add identities to vendors
  identities.forEach(id => {
    if (id.vendor && vendorMap.has(id.vendor)) {
      const vendor = vendorMap.get(id.vendor);
      if (!vendor.identities.find(i => i.type === id.type && i.value === id.value)) {
        vendor.identities.push({ type: id.type, value: id.value });
      }
    }
  });

  // Convert to array and convert Sets to arrays
  return Array.from(vendorMap.values()).map(v => ({
    ...v,
    behavioralSignals: Array.from(v.behavioralSignals)
  })).sort((a, b) => b.eventCount - a.eventCount);
}

function computeStats(events, identities, links, vendors) {
  const categoryBreakdown = { vendor: 0, identity: 0, network: 0, violation: 0 };

  events.forEach(event => {
    const cat = event.category || 'unknown';
    if (categoryBreakdown[cat] !== undefined) {
      categoryBreakdown[cat]++;
    }
  });

  const violationCount = events.filter(e =>
    e.type === 'consent_violation' || e.type === 'fingerprint_detected'
  ).length;

  const identityTypes = [...new Set(identities.map(i => i.type))];

  const topVendors = vendors.slice(0, 5).map(v => ({
    name: v.name,
    eventCount: v.eventCount
  }));

  return {
    totalEvents: events.length,
    vendorCount: vendors.length,
    identityCount: identities.length,
    linkCount: links.length,
    categoryBreakdown,
    topVendors,
    identityTypes,
    violationCount
  };
}

function generateFindings(stats, vendors, identities) {
  const findings = [];

  // Vendor density
  if (stats.vendorCount > 10) {
    findings.push(`High tracker density: ${stats.vendorCount} vendors detected on this site`);
  } else if (stats.vendorCount > 5) {
    findings.push(`${stats.vendorCount} tracking vendors detected`);
  }

  // Identity stitching
  if (stats.linkCount > 0) {
    findings.push(`Identity stitching detected: ${stats.linkCount} cross-vendor identity links found`);
  }

  // Violations
  if (stats.violationCount > 0) {
    findings.push(`Privacy concerns: ${stats.violationCount} potential violation${stats.violationCount > 1 ? 's' : ''} detected (fingerprinting, consent issues)`);
  }

  // Top tracker
  if (stats.topVendors.length > 0) {
    const top = stats.topVendors[0];
    findings.push(`Most active tracker: ${top.name} with ${top.eventCount} events`);
  }

  // Cross-platform tracking
  const hasAdobe = stats.identityTypes.some(t => ['ECID', 'CUID'].includes(t));
  const hasGoogle = stats.identityTypes.some(t => ['GA_CID', 'GA_GID'].includes(t));
  if (hasAdobe && hasGoogle) {
    findings.push('Cross-platform tracking: Both Adobe and Google identity tokens are present');
  }

  // Intent data vendors
  const intentVendors = vendors.filter(v => v.category === 'intent');
  if (intentVendors.length > 0) {
    findings.push(`B2B intent tracking: ${intentVendors.map(v => v.name).join(', ')}`);
  }

  // High confidence behavioral detection
  const highConfidence = vendors.filter(v => v.confidence >= 90 && v.detectionMethod === 'behavioral');
  if (highConfidence.length > 0) {
    findings.push(`Stealth trackers: ${highConfidence.length} vendor(s) detected through behavioral analysis`);
  }

  return findings;
}

// ============================================================
// HTML REPORT GENERATOR
// ============================================================

function generateHTMLReport(data) {
  const { session, events, identities, links, vendors, stats, findings, journey } = data;

  const duration = formatDuration(session.lastActivity - session.startTime);
  const generatedDate = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Who Is Watching Report - ${escapeHtml(session.domain)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #1a1a2e;
      --bg-card: #232342;
      --bg-elevated: #2a2a4a;
      --text: #e8e8f0;
      --text-muted: #8888a0;
      --text-secondary: #b0b0c0;
      --sage: #7eb09b;
      --mustard: #e5a93d;
      --coral: #e07a5f;
      --primary: #6c63ff;
      --border: #3a3a5a;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Nunito', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1, h2, h3, h4 { font-weight: 700; margin-bottom: 1rem; }
    h1 { font-size: 2rem; color: var(--sage); }
    h2 { font-size: 1.5rem; color: var(--text); border-bottom: 2px solid var(--sage); padding-bottom: 0.5rem; margin-top: 2rem; }
    h3 { font-size: 1.1rem; color: var(--text-secondary); }

    .report-header { margin-bottom: 2rem; }
    .report-meta { color: var(--text-muted); font-size: 0.9rem; }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .stat-card {
      background: var(--bg-card);
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
      border: 1px solid var(--border);
    }

    .stat-card .value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--sage);
    }

    .stat-card .label {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .findings {
      background: var(--bg-card);
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      border-left: 4px solid var(--mustard);
    }

    .findings ul { list-style: none; }
    .findings li {
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border);
      color: var(--text-secondary);
    }
    .findings li:last-child { border-bottom: none; }
    .findings li::before {
      content: "→ ";
      color: var(--mustard);
      font-weight: 600;
    }

    .vendor-card {
      background: var(--bg-card);
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1rem 0;
      border: 1px solid var(--border);
    }

    .vendor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .vendor-name { font-weight: 700; font-size: 1.1rem; }
    .vendor-badge {
      background: var(--primary);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .vendor-stats {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .vendor-details { font-size: 0.85rem; color: var(--text-secondary); }
    .vendor-details strong { color: var(--text); }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 0.9rem;
    }

    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    th {
      background: var(--bg-card);
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
    }

    td { color: var(--text-secondary); }

    .identity-type {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .identity-type.ga { background: var(--mustard); color: #1a1a2e; }
    .identity-type.adobe { background: var(--coral); color: white; }
    .identity-type.other { background: var(--primary); color: white; }

    .timeline-type {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      background: var(--bg-elevated);
    }

    code {
      background: var(--bg-elevated);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      word-break: break-all;
    }

    /* Journey Narrative */
    .journey-narrative {
      background: var(--bg-card);
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      border-left: 4px solid var(--sage);
    }

    .journey-narrative p {
      font-size: 1.05rem;
      line-height: 1.8;
      color: var(--text);
      margin: 0;
    }

    /* ASCII Flow Diagram */
    .ascii-flow {
      background: #0d0d1a;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      overflow-x: auto;
      font-family: 'Courier New', Consolas, monospace;
      font-size: 13px;
      line-height: 1.5;
      color: #7ee787;
      white-space: pre;
      border: 1px solid var(--border);
    }

    /* Milestone Cards */
    .milestone-grid {
      display: grid;
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .milestone {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-elevated);
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .milestone-icon {
      font-size: 1.5rem;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-card);
      border-radius: 50%;
      flex-shrink: 0;
    }

    .milestone-content {
      flex: 1;
    }

    .milestone-time {
      color: var(--sage);
      font-family: monospace;
      font-size: 0.85rem;
      display: block;
      margin-bottom: 0.25rem;
    }

    .milestone-content h4 {
      margin: 0 0 0.25rem 0;
      color: var(--text);
      font-size: 1rem;
    }

    .milestone-content p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .milestone.violation {
      border-left: 3px solid var(--coral);
    }

    .milestone.violation .milestone-icon {
      background: var(--coral);
    }

    footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    @media print {
      body { background: white; color: black; padding: 1rem; }
      .stat-card, .vendor-card, .findings { border: 1px solid #ccc; background: #f9f9f9; }
      .stat-card .value { color: #333; }
      h1, h2 { color: #333; }
      th { background: #eee; }
    }
  </style>
</head>
<body>
  <header class="report-header">
    <h1>Tracking Report: ${escapeHtml(session.domain)}</h1>
    <p class="report-meta">
      Generated: ${generatedDate} | Session Duration: ${duration} | URL: ${escapeHtml(session.startUrl)}
    </p>
  </header>

  <section id="executive-summary">
    <h2>Executive Summary</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="value">${stats.vendorCount}</div>
        <div class="label">Vendors Detected</div>
      </div>
      <div class="stat-card">
        <div class="value">${stats.identityCount}</div>
        <div class="label">Identity Tokens</div>
      </div>
      <div class="stat-card">
        <div class="value">${stats.totalEvents}</div>
        <div class="label">Total Events</div>
      </div>
      <div class="stat-card">
        <div class="value">${stats.violationCount}</div>
        <div class="label">Violations</div>
      </div>
    </div>

    ${findings.length > 0 ? `
    <div class="findings">
      <h3>Key Findings</h3>
      <ul>
        ${findings.map(f => `<li>${escapeHtml(f)}</li>`).join('\n        ')}
      </ul>
    </div>
    ` : ''}
  </section>

  ${journey.story ? `
  <section id="journey-narrative">
    <h2>Your Tracking Story</h2>
    <div class="journey-narrative">
      <p>${escapeHtml(journey.story)}</p>
    </div>
  </section>
  ` : ''}

  ${journey.ascii ? `
  <section id="journey-flow">
    <h2>Journey Flow</h2>
    <div class="ascii-flow">${escapeHtml(journey.ascii)}</div>
  </section>
  ` : ''}

  ${journey.milestones && journey.milestones.length > 0 ? `
  <section id="milestones">
    <h2>Key Moments</h2>
    <div class="milestone-grid">
      ${journey.milestones.map(m => `
      <div class="milestone ${m.type === 'violation' ? 'violation' : ''}">
        <div class="milestone-icon">${m.icon}</div>
        <div class="milestone-content">
          <span class="milestone-time">${escapeHtml(m.time)}</span>
          <h4>${escapeHtml(m.title)}</h4>
          <p>${escapeHtml(m.detail)}</p>
        </div>
      </div>
      `).join('')}
    </div>
  </section>
  ` : ''}

  <section id="identity-graph">
    <h2>Identity Graph</h2>
    ${identities.length > 0 ? `
    <h3>Identity Nodes (${identities.length})</h3>
    <table>
      <thead>
        <tr><th>Type</th><th>Value</th><th>Vendor</th><th>Source</th></tr>
      </thead>
      <tbody>
        ${identities.map(id => `
        <tr>
          <td><span class="identity-type ${getIdentityClass(id.type)}">${escapeHtml(id.type)}</span></td>
          <td><code>${escapeHtml(truncate(id.value, 40))}</code></td>
          <td>${escapeHtml(id.vendor || '-')}</td>
          <td>${escapeHtml(id.source || '-')}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    ${(() => {
      const validLinks = links.filter(l => l.source !== l.target);
      return validLinks.length > 0 ? `
    <h3>Identity Links (${validLinks.length})</h3>
    <table>
      <thead>
        <tr><th>Source</th><th>Target</th><th>Reason</th></tr>
      </thead>
      <tbody>
        ${validLinks.map(link => `
        <tr>
          <td><code>${escapeHtml(truncate(link.source, 30))}</code></td>
          <td><code>${escapeHtml(truncate(link.target, 30))}</code></td>
          <td>${escapeHtml(link.reason)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p style="color: var(--text-muted);">No identity links detected.</p>';
    })()}
    ` : '<p style="color: var(--text-muted);">No identities detected in this session.</p>'}
  </section>

  <section id="vendor-breakdown">
    <h2>Vendor Analysis</h2>
    ${vendors.length > 0 ? vendors.map(vendor => `
    <div class="vendor-card">
      <div class="vendor-header">
        <span class="vendor-name">${escapeHtml(vendor.name)}</span>
        <span class="vendor-badge">${escapeHtml(vendor.category)}</span>
      </div>
      <div class="vendor-stats">
        <span>${vendor.eventCount} events</span>
        ${vendor.confidence > 0 ? `<span>${vendor.confidence}% confidence</span>` : ''}
        <span>Detection: ${escapeHtml(vendor.detectionMethod)}</span>
      </div>
      <div class="vendor-details">
        ${vendor.cookies.length > 0 ? `<p><strong>Cookies:</strong> ${vendor.cookies.map(c => escapeHtml(c.name)).join(', ')}</p>` : ''}
        ${vendor.identities.length > 0 ? `<p><strong>Identities:</strong> ${vendor.identities.map(i => `${i.type}`).join(', ')}</p>` : ''}
        ${vendor.behavioralSignals.length > 0 ? `<p><strong>Signals:</strong> ${vendor.behavioralSignals.join(', ')}</p>` : ''}
        ${vendor.requests.length > 0 ? `<p><strong>Requests:</strong> ${vendor.requests.length} tracked</p>` : ''}
      </div>
    </div>
    `).join('') : '<p style="color: var(--text-muted);">No vendors detected in this session.</p>'}
  </section>

  <section id="timeline">
    <h2>Activity Timeline</h2>
    ${events.length > 0 ? `
    <details>
      <summary style="cursor: pointer; padding: 0.75rem; background: var(--bg-card); border-radius: 8px; margin-bottom: 1rem;">
        Show ${events.length} raw events
      </summary>
      <table>
        <thead>
          <tr><th>Time</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          ${events.slice(0, 200).map(event => `
          <tr>
            <td>${formatTime(event.timestamp)}</td>
            <td><span class="timeline-type">${escapeHtml(event.type.replace(/_/g, ' '))}</span></td>
            <td>${escapeHtml(getEventDescription(event))}</td>
          </tr>
          `).join('')}
          ${events.length > 200 ? `
          <tr><td colspan="3" style="text-align: center; color: var(--text-muted);">... and ${events.length - 200} more events</td></tr>
          ` : ''}
        </tbody>
      </table>
    </details>
    ` : '<p style="color: var(--text-muted);">No events recorded in this session.</p>'}
  </section>

  <footer>
    <p>Generated by Who Is Watching v2.0</p>
  </footer>
</body>
</html>`;
}

// ============================================================
// MARKDOWN REPORT GENERATOR
// ============================================================

function generateMarkdownReport(data) {
  const { session, events, identities, links, vendors, stats, findings, journey } = data;

  const duration = formatDuration(session.lastActivity - session.startTime);
  const generatedDate = new Date().toLocaleString();

  let md = `# Tracking Report: ${session.domain}

**Generated:** ${generatedDate}
**Session Duration:** ${duration}
**URL:** ${session.startUrl}

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Vendors Detected | ${stats.vendorCount} |
| Identity Tokens | ${stats.identityCount} |
| Total Events | ${stats.totalEvents} |
| Privacy Violations | ${stats.violationCount} |

`;

  if (findings.length > 0) {
    md += `### Key Findings

${findings.map(f => `- ${f}`).join('\n')}

`;
  }

  // Journey Story
  if (journey.story) {
    md += `---

## Your Tracking Story

${journey.story}

`;
  }

  // ASCII Flow
  if (journey.ascii) {
    md += `---

## Journey Flow

\`\`\`
${journey.ascii}
\`\`\`

`;
  }

  // Key Moments
  if (journey.milestones && journey.milestones.length > 0) {
    md += `---

## Key Moments

${journey.milestones.map(m => `### ${m.icon} ${m.time} — ${m.title}

${m.detail}
`).join('\n')}

`;
  }

  md += `---

## Identity Graph

### Nodes (${identities.length})

`;

  if (identities.length > 0) {
    md += `| Type | Value | Vendor | Source |
|------|-------|--------|--------|
${identities.map(id => `| ${id.type} | \`${truncate(id.value, 30)}\` | ${id.vendor || '-'} | ${id.source || '-'} |`).join('\n')}

`;
  } else {
    md += `*No identities detected.*

`;
  }

  const validLinks = links.filter(l => l.source !== l.target);

  md += `### Links (${validLinks.length})

`;

  if (validLinks.length > 0) {
    md += `| Source | Target | Reason |
|--------|--------|--------|
${validLinks.map(l => `| \`${truncate(l.source, 25)}\` | \`${truncate(l.target, 25)}\` | ${l.reason} |`).join('\n')}

`;
  } else {
    md += `*No identity links detected.*

`;
  }

  md += `---

## Vendor Analysis

`;

  if (vendors.length > 0) {
    vendors.forEach(vendor => {
      md += `### ${vendor.name} (${vendor.category})

- **Events:** ${vendor.eventCount}
- **Detection:** ${vendor.detectionMethod}${vendor.confidence > 0 ? ` (${vendor.confidence}% confidence)` : ''}
`;

      if (vendor.cookies.length > 0) {
        md += `- **Cookies:** ${vendor.cookies.map(c => c.name).join(', ')}
`;
      }

      if (vendor.identities.length > 0) {
        md += `- **Identities:** ${vendor.identities.map(i => i.type).join(', ')}
`;
      }

      if (vendor.behavioralSignals.length > 0) {
        md += `- **Signals:** ${vendor.behavioralSignals.join(', ')}
`;
      }

      if (vendor.requests.length > 0) {
        md += `- **Requests:** ${vendor.requests.length} tracked
`;
      }

      md += `
`;
    });
  } else {
    md += `*No vendors detected.*

`;
  }

  md += `---

## Activity Timeline

`;

  if (events.length > 0) {
    md += `| Time | Type | Description |
|------|------|-------------|
${events.slice(0, 200).map(e => `| ${formatTime(e.timestamp)} | ${e.type.replace(/_/g, ' ')} | ${getEventDescription(e)} |`).join('\n')}
`;

    if (events.length > 200) {
      md += `
*... and ${events.length - 200} more events*
`;
    }
  } else {
    md += `*No events recorded.*
`;
  }

  md += `
---

*Generated by Who Is Watching v2.0*
`;

  return md;
}

// ============================================================
// UTILITIES
// ============================================================

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

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
    'onetrust': 'OneTrust', 'cookiebot': 'Cookiebot', 'trustarc': 'TrustArc'
  };
  return names[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function guessCategory(vendorKey) {
  const categories = {
    'adobe': 'analytics', 'adobe_analytics': 'analytics', 'adobe_launch': 'analytics',
    'google_analytics': 'analytics', 'google_ga4': 'analytics',
    'google_tag_manager': 'tag_manager',
    'facebook_pixel': 'advertising', 'linkedin_insight': 'advertising',
    'marketo': 'marketing', 'hubspot': 'marketing',
    'sixsense': 'intent', '_6sense': 'intent', 'bombora': 'intent',
    'onetrust': 'consent', 'cookiebot': 'consent'
  };
  return categories[vendorKey] || 'unknown';
}

function getIdentityClass(type) {
  if (['GA_CID', 'GA_GID'].includes(type)) return 'ga';
  if (['ECID', 'CUID'].includes(type)) return 'adobe';
  return 'other';
}

function getEventDescription(event) {
  switch (event.type) {
    case 'vendor_detected':
      return `${event.vendorName || event.vendorKey || 'Unknown'} detected`;
    case 'network_request':
      return `Request to ${truncate(event.url || '', 50)}`;
    case 'identity_detected':
      return `${event.identityType}: ${truncate(event.identityValue || '', 20)}`;
    case 'cookie_set':
      return `Cookie: ${event.cookieName}`;
    case 'consent_detected':
      return `Consent platform: ${event.platform}`;
    case 'fingerprint_detected':
      return `Fingerprinting: ${event.fingerprintType || event.method}`;
    default:
      return event.type.replace(/_/g, ' ');
  }
}

function truncate(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

function escapeHtml(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

console.log('[who-is-watching] report-generator.js loaded');
