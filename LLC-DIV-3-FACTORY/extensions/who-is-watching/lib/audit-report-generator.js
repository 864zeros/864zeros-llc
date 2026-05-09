// ============================================================
// AUDIT REPORT GENERATOR — Who Is Watching
// Generates HTML and JSON reports for audit sessions.
// ============================================================

export class AuditReportGenerator {
  static generateHTML(report) {
    const { summary, details } = report;
    const statusClass = summary.complianceStatus.toLowerCase().replace('_', '-');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Who Is Watching - Audit Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Nunito', system-ui, -apple-system, sans-serif;
      background: #1a1a2e;
      color: #e8e8f0;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      text-align: center;
      border-bottom: 2px solid #7eb09b;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }

    h1 {
      font-size: 1.8rem;
      color: #7eb09b;
      margin-bottom: 0.5rem;
    }

    .meta {
      color: #8888a0;
      font-size: 0.9rem;
    }

    .badge {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.9rem;
      margin-top: 1rem;
    }

    .badge.compliant {
      background: #7eb09b;
      color: #1a1a2e;
    }

    .badge.partial {
      background: #e5a93d;
      color: #1a1a2e;
    }

    .badge.non-compliant {
      background: #e07a5f;
      color: white;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin: 2rem 0;
    }

    .stat {
      text-align: center;
      padding: 1.5rem 1rem;
      background: #232342;
      border-radius: 8px;
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
    }

    .stat-number.blocked { color: #7eb09b; }
    .stat-number.leaked { color: #e07a5f; }
    .stat-number.rate { color: #e5a93d; }

    .stat-label {
      font-size: 0.85rem;
      color: #8888a0;
      margin-top: 0.25rem;
    }

    h2 {
      font-size: 1.2rem;
      color: #e8e8f0;
      margin: 2rem 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #3a3a5a;
    }

    .section {
      background: #232342;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .blocked-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .blocked-tag {
      background: rgba(126, 176, 155, 0.2);
      color: #7eb09b;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
    }

    .leak-item {
      padding: 1rem;
      margin-bottom: 0.75rem;
      background: rgba(224, 122, 95, 0.1);
      border-left: 4px solid #e07a5f;
      border-radius: 0 8px 8px 0;
    }

    .leak-item:last-child {
      margin-bottom: 0;
    }

    .leak-vendor {
      font-weight: 700;
      color: #e07a5f;
    }

    .leak-details {
      font-size: 0.85rem;
      color: #8888a0;
      margin-top: 0.25rem;
    }

    .leak-url {
      font-family: monospace;
      font-size: 0.8rem;
      color: #b0b0c0;
      word-break: break-all;
      margin-top: 0.25rem;
    }

    .no-leaks {
      color: #7eb09b;
      font-style: italic;
    }

    .methods-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .method-tag {
      background: rgba(229, 169, 61, 0.2);
      color: #e5a93d;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
    }

    .footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #3a3a5a;
      text-align: center;
      color: #8888a0;
      font-size: 0.85rem;
    }

    @media print {
      body {
        background: white;
        color: #333;
        padding: 1rem;
      }
      .stat, .section {
        border: 1px solid #ddd;
        background: #f9f9f9;
      }
      .stat-number, h1, h2 {
        color: #333;
      }
    }

    @media (max-width: 600px) {
      .stats {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Audit Report</h1>
    <p class="meta">${new Date(report.timestamp).toLocaleString()}</p>
    <p class="meta">URL: ${this.escapeHtml(report.url || 'Unknown')}</p>
    <span class="badge ${statusClass}">${summary.complianceStatus.replace('_', ' ')}</span>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-number">${summary.attemptedTrackers}</div>
      <div class="stat-label">Attempted</div>
    </div>
    <div class="stat">
      <div class="stat-number blocked">${summary.blockedTrackers}</div>
      <div class="stat-label">Blocked</div>
    </div>
    <div class="stat">
      <div class="stat-number leaked">${summary.leakedTrackers}</div>
      <div class="stat-label">Leaked</div>
    </div>
    <div class="stat">
      <div class="stat-number rate">${summary.blockRate}</div>
      <div class="stat-label">Block Rate</div>
    </div>
  </div>

  <h2>Blocked Vendors</h2>
  <div class="section">
    <div class="blocked-list">
      ${details.blocked.length > 0
        ? details.blocked.map(v => `<span class="blocked-tag">${this.escapeHtml(v)}</span>`).join('')
        : '<span class="no-leaks">No vendors were selected for blocking</span>'
      }
    </div>
  </div>

  <h2>Bypass Detection</h2>
  <div class="section">
    ${details.leaked.length > 0
      ? details.leaked.slice(0, 20).map(l => `
        <div class="leak-item">
          <div class="leak-vendor">${this.escapeHtml(l.vendor || 'Unknown')}</div>
          <div class="leak-details">Method: ${this.escapeHtml(l.method)} | Type: ${this.escapeHtml(l.type || 'unknown')}</div>
          <div class="leak-url">${this.escapeHtml(l.url.substring(0, 120))}${l.url.length > 120 ? '...' : ''}</div>
        </div>
      `).join('')
      : '<p class="no-leaks">No tracking bypasses detected. All selected trackers were successfully blocked.</p>'
    }
    ${details.leaked.length > 20 ? `<p class="leak-details">...and ${details.leaked.length - 20} more leaks</p>` : ''}
  </div>

  ${Object.keys(details.leakMethods || {}).length > 0 ? `
    <h2>Bypass Methods</h2>
    <div class="section">
      <div class="methods-list">
        ${Object.entries(details.leakMethods).map(([method, count]) =>
          `<span class="method-tag">${this.escapeHtml(method)} (${count})</span>`
        ).join('')}
      </div>
    </div>
  ` : ''}

  <div class="footer">
    <p>Generated by Who Is Watching v2.1 - Audit Mode</p>
    <p>Session duration: ${Math.round(summary.sessionDuration / 1000)} seconds</p>
  </div>
</body>
</html>`;
  }

  static generateJSON(report) {
    return JSON.stringify(report, null, 2);
  }

  static escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  static exportHTML(report, domain) {
    const html = this.generateHTML(report);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${domain || 'audit'}-audit-report-${timestamp}.html`;
    this.download(html, filename, 'text/html');
  }

  static exportJSON(report, domain) {
    const json = this.generateJSON(report);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${domain || 'audit'}-audit-report-${timestamp}.json`;
    this.download(json, filename, 'application/json');
  }
}

console.log('[who-is-watching] audit-report-generator.js loaded');
