// audit-report.js - Migration Audit UI [DELTA]
// 864zeros Build: 864z-2026-004
//
// THE "AHA!" MOMENT:
// When user imports their passwords, we immediately show them:
// 1. How many are compromised (via HIBP)
// 2. How many are reused
// 3. How many are weak
// 4. How much money they're saving

import { VALUE_COMPARISON } from '../lib/constants.js';

/**
 * Audit Report Controller
 *
 * Renders the Vault Health Report after import.
 * This is the key conversion moment - user sees immediate value.
 */
export class AuditReportController {
  constructor(container) {
    this.container = container;
  }

  /**
   * Render the full audit report.
   *
   * @param {Object} params
   * @param {string} params.source - Import source (e.g., "Dashlane")
   * @param {number} params.totalImported - Total passwords imported
   * @param {Object} params.auditSummary - From PasswordVault.getAuditSummary()
   * @param {Object} params.breachSummary - From breachChecker.auditVault()
   */
  render({ source, totalImported, auditSummary, breachSummary }) {
    const scoreClass = this._getScoreClass(auditSummary.securityScore);
    const scoreMessage = this._getScoreMessage(auditSummary.securityScore);

    this.container.innerHTML = `
      <div class="audit-report">
        <div class="audit-header">
          <h2>Vault Health Report</h2>
          <p class="audit-source">Imported from: ${source} (${totalImported} passwords)</p>
        </div>

        <!-- Security Score Circle -->
        <div class="security-score">
          <div class="score-circle">
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle class="track" cx="60" cy="60" r="52"/>
              <circle
                class="progress ${scoreClass}"
                cx="60" cy="60" r="52"
                stroke-dasharray="326.7"
                stroke-dashoffset="${326.7 - (326.7 * auditSummary.securityScore / 100)}"
              />
            </svg>
            <div class="score-value">${auditSummary.securityScore}</div>
          </div>
          <p class="score-label">${scoreMessage}</p>
        </div>

        <!-- Critical Issues -->
        <div class="audit-issues">
          <h3>Issues Found</h3>

          ${breachSummary.breachedCount > 0 ? `
            <div class="audit-issue danger">
              <div class="issue-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div class="issue-content">
                <div class="issue-title">${breachSummary.breachedCount} COMPROMISED passwords</div>
                <div class="issue-count">Found in known data breaches</div>
                <div class="issue-entries">
                  ${this._formatEntries(breachSummary.getWorstOffenders(3))}
                </div>
              </div>
            </div>
          ` : ''}

          ${auditSummary.reused > 0 ? `
            <div class="audit-issue danger">
              <div class="issue-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div class="issue-content">
                <div class="issue-title">${auditSummary.reused} REUSED passwords</div>
                <div class="issue-count">Same password on multiple sites</div>
                ${auditSummary.worstReuseCount > 1 ? `
                  <div class="issue-entries">
                    Worst offender: 1 password used on ${auditSummary.worstReuseCount} sites!
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${auditSummary.weak > 0 ? `
            <div class="audit-issue warning">
              <div class="issue-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div class="issue-content">
                <div class="issue-title">${auditSummary.weak} WEAK passwords</div>
                <div class="issue-count">Too short or easy to guess</div>
                <div class="issue-entries">
                  ${this._formatIssueEntries(auditSummary.topIssues, 'weak')}
                </div>
              </div>
            </div>
          ` : ''}

          ${this._renderNoIssues(breachSummary, auditSummary)}
        </div>

        <!-- Value Saved -->
        <div class="value-saved">
          <div class="value-label">Estimated Value Saved</div>
          <div class="value-amount">$${VALUE_COMPARISON.DASHLANE_ANNUAL}/year</div>
          <div class="value-period">vs Dashlane Premium</div>
          <div class="value-comparison">
            $${VALUE_COMPARISON.DASHLANE_ANNUAL * 3} over 3 years |
            $${VALUE_COMPARISON.DASHLANE_ANNUAL * 5} over 5 years
          </div>
          <div class="value-tagline">"Your passwords are now free. Forever."</div>
        </div>

        <!-- Actions -->
        <div class="audit-actions mt-lg">
          ${auditSummary.weak > 0 || auditSummary.reused > 0 ? `
            <button class="btn btn-primary btn-block" id="fix-passwords-btn">
              Fix Weak Passwords
            </button>
          ` : ''}
          <button class="btn btn-secondary btn-block mt-sm" id="done-btn">
            Continue to Vault
          </button>
        </div>
      </div>
    `;

    this._attachListeners();
  }

  /**
   * Render compact audit summary (for sidebar).
   */
  renderCompact({ auditSummary, breachSummary }) {
    const scoreClass = this._getScoreClass(auditSummary.securityScore);

    return `
      <div class="audit-compact">
        <div class="audit-compact-header">
          <div class="compact-score ${scoreClass}">
            ${auditSummary.securityScore}
          </div>
          <div class="compact-label">Security Score</div>
        </div>
        <div class="audit-compact-stats">
          ${breachSummary.breachedCount > 0 ? `
            <span class="stat-item danger">${breachSummary.breachedCount} breached</span>
          ` : ''}
          ${auditSummary.reused > 0 ? `
            <span class="stat-item danger">${auditSummary.reused} reused</span>
          ` : ''}
          ${auditSummary.weak > 0 ? `
            <span class="stat-item warning">${auditSummary.weak} weak</span>
          ` : ''}
          ${auditSummary.strong > 0 ? `
            <span class="stat-item secure">${auditSummary.strong} strong</span>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Get score class for styling.
   */
  _getScoreClass(score) {
    if (score >= 80) return 'secure';
    if (score >= 50) return 'warning';
    return 'danger';
  }

  /**
   * Get score message.
   */
  _getScoreMessage(score) {
    if (score >= 90) return 'Excellent! Your vault is very secure.';
    if (score >= 80) return 'Good security posture.';
    if (score >= 60) return 'Good start, but there\'s room to improve.';
    if (score >= 40) return 'Several issues need your attention.';
    return 'Critical issues found. Take action now.';
  }

  /**
   * Format entry names for display.
   */
  _formatEntries(entries) {
    if (!entries || entries.length === 0) return '';

    const names = entries.map(e => e.entry?.title || e.entry?.domain || 'Unknown');
    if (names.length <= 3) {
      return names.join(', ');
    }
    return `${names.slice(0, 3).join(', ')}...`;
  }

  /**
   * Format issue entries.
   */
  _formatIssueEntries(topIssues, type) {
    const issue = topIssues?.find(i => i.type === type);
    if (!issue?.entries) return '';
    return issue.entries.slice(0, 3).join(', ') + (issue.entries.length > 3 ? '...' : '');
  }

  /**
   * Render "no issues" message if vault is clean.
   */
  _renderNoIssues(breachSummary, auditSummary) {
    if (breachSummary.breachedCount === 0 &&
        auditSummary.reused === 0 &&
        auditSummary.weak === 0) {
      return `
        <div class="audit-clean">
          <div class="clean-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--status-secure)" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h3 class="text-secure">All Clear!</h3>
          <p>Your passwords look good. No critical issues found.</p>
        </div>
      `;
    }
    return '';
  }

  /**
   * Attach event listeners.
   */
  _attachListeners() {
    const fixBtn = document.getElementById('fix-passwords-btn');
    const doneBtn = document.getElementById('done-btn');

    if (fixBtn) {
      fixBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('passvault:show-weak-passwords'));
      });
    }

    if (doneBtn) {
      doneBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('passvault:close-audit'));
      });
    }
  }
}

/**
 * Additional CSS for audit report (append to security-theme.css).
 */
export const AUDIT_REPORT_CSS = `
  .audit-report {
    padding: var(--space-lg);
  }

  .audit-header {
    text-align: center;
    margin-bottom: var(--space-lg);
  }

  .audit-header h2 {
    margin-bottom: var(--space-xs);
  }

  .audit-source {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .audit-issues h3 {
    margin-bottom: var(--space-md);
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-secondary);
  }

  .audit-clean {
    text-align: center;
    padding: var(--space-xl) var(--space-lg);
  }

  .audit-clean .clean-icon {
    margin-bottom: var(--space-md);
  }

  .audit-clean h3 {
    margin-bottom: var(--space-sm);
  }

  .audit-compact {
    padding: var(--space-md);
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-md);
  }

  .audit-compact-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
  }

  .compact-score {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
  }

  .compact-score.secure {
    background: var(--status-secure-bg);
    color: var(--status-secure);
  }

  .compact-score.warning {
    background: var(--status-warning-bg);
    color: var(--status-warning);
  }

  .compact-score.danger {
    background: var(--status-danger-bg);
    color: var(--status-danger);
  }

  .audit-compact-stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .stat-item {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
  }

  .stat-item.secure {
    background: var(--status-secure-bg);
    color: var(--status-secure);
  }

  .stat-item.warning {
    background: var(--status-warning-bg);
    color: var(--status-warning);
  }

  .stat-item.danger {
    background: var(--status-danger-bg);
    color: var(--status-danger);
  }
`;
