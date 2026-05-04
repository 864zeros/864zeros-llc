/**
 * app.js - ReadFlow Sidepanel Controller
 * Strike: 864z-2026-005
 *
 * Main application logic for the sidepanel UI.
 * Handles article import, reading list, and Kobo bridge.
 */

import { parseInstapaperCSV, ArticleLibrary, INSTAPAPER_PREMIUM_PRICE } from '../lib/instapaper-parser.js';
import { generateEpub, generateDigestFilename, downloadEpub, createDownloadUrl } from '../lib/epub-builder.js';
import { generateQRCodeSVG } from '../lib/qr-generator.js';
import { APP_NAME, TARGET_SAAS, TARGET_PRICE, STORAGE_KEYS } from '../lib/constants.js';
import { PricingModalController, injectPricingCSS } from '../lib/BRK-PRICING-001.js';

/**
 * ReadFlow Application Controller
 */
class ReadFlowApp {
  constructor() {
    this.library = new ArticleLibrary();
    this.currentView = 'reading-list';
    this.searchQuery = '';
    this.pricingModal = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log(`[${APP_NAME}] Initializing...`);

    // Initialize library
    await this.library.init();
    await this.library.load();

    // Cache DOM elements
    this._cacheElements();

    // Attach event listeners
    this._attachListeners();

    // Initialize pricing modal (864zeros branding)
    injectPricingCSS();
    this.pricingModal = new PricingModalController({
      productName: 'ReadFlow',
      currentTier: 'free',
      onUpgrade: (tier) => {
        console.log(`[${APP_NAME}] Upgrade requested:`, tier);
        // TODO: Handle upgrade flow
      }
    });

    // Render initial state
    this._render();

    console.log(`[${APP_NAME}] Ready - ${this.library.articles.length} articles loaded`);
  }

  /**
   * Cache DOM elements
   */
  _cacheElements() {
    this.elements = {
      mainContent: document.getElementById('main-content'),
      contentList: document.getElementById('content-list'),
      emptyState: document.getElementById('empty-state'),
      searchInput: document.getElementById('search-input'),
      importBtn: document.getElementById('import-btn'),
      startImportBtn: document.getElementById('start-import-btn'),
      menuBtn: document.getElementById('menu-btn'),
      statsBar: document.getElementById('stats-bar'),
      statTotal: document.getElementById('stat-total'),
      statUnread: document.getElementById('stat-unread'),
      statTime: document.getElementById('stat-time'),
      koboAction: document.getElementById('kobo-action'),
      generateKoboBtn: document.getElementById('generate-kobo-btn')
    };
  }

  /**
   * Attach event listeners
   */
  _attachListeners() {
    // Import buttons
    this.elements.importBtn?.addEventListener('click', () => this._showImportModal());
    this.elements.startImportBtn?.addEventListener('click', () => this._showImportModal());

    // Search
    this.elements.searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this._renderArticleList();
    });

    // Menu button
    this.elements.menuBtn?.addEventListener('click', () => this._showOptionsMenu());

    // Generate Kobo Digest (primary action)
    this.elements.generateKoboBtn?.addEventListener('click', () => this._showKoboBridge());

    // Upgrade link (864zeros pricing modal)
    document.getElementById('upgrade-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.pricingModal?.show();
    });
  }

  /**
   * Main render method
   */
  _render() {
    // Update stats bar
    this._updateStats();

    if (this.library.articles.length === 0) {
      this.elements.emptyState?.classList.remove('hidden');
      this.elements.koboAction?.classList.add('hidden');
      this.elements.contentList.innerHTML = '';
    } else {
      this.elements.emptyState?.classList.add('hidden');
      this.elements.koboAction?.classList.remove('hidden');
      this._renderArticleList();
    }
  }

  /**
   * Update stats bar
   */
  _updateStats() {
    const stats = this.library.getStats ? this.library.getStats() : {
      total: this.library.articles.length,
      unread: this.library.articles.filter(a => a.status !== 'read').length,
      totalReadingTime: this.library.articles.reduce((sum, a) => sum + (a.readingTimeMinutes || 5), 0)
    };

    if (this.elements.statTotal) {
      this.elements.statTotal.textContent = `${stats.total} articles`;
    }
    if (this.elements.statUnread) {
      this.elements.statUnread.textContent = `${stats.unread} unread`;
    }
    if (this.elements.statTime) {
      const hours = Math.round(stats.totalReadingTime / 60);
      this.elements.statTime.textContent = `${hours}h reading`;
    }
  }

  /**
   * Render article list
   */
  _renderArticleList() {
    let articles = this.library.articles;

    // Apply search filter
    if (this.searchQuery) {
      articles = this.library.search(this.searchQuery);
    }

    // Sort by timestamp (newest first)
    articles = [...articles].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    if (articles.length === 0) {
      this.elements.contentList.innerHTML = `
        <div class="empty-search">
          <p class="text-secondary">No articles found</p>
        </div>
      `;
      return;
    }

    const html = articles.map(article => this._renderArticleCard(article)).join('');
    this.elements.contentList.innerHTML = html;

    // Attach click handlers
    this.elements.contentList.querySelectorAll('.article-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        this._openArticle(id);
      });
    });
  }

  /**
   * Render single article card
   */
  _renderArticleCard(article) {
    const statusClass = article.status === 'read' ? 'read' : '';
    const readTime = article.readingTimeMinutes || 5;

    return `
      <div class="article-card ${statusClass}" data-id="${article.id}">
        <div class="article-favicon">${this._getFavicon(article.domain)}</div>
        <div class="article-info">
          <div class="article-title">${this._escapeHtml(article.title)}</div>
          <div class="article-meta">
            <span class="article-domain">${this._escapeHtml(article.domain)}</span>
            <span class="article-time">${readTime} min read</span>
          </div>
        </div>
        <div class="article-folder">${this._escapeHtml(article.folder)}</div>
      </div>
    `;
  }

  /**
   * Get favicon emoji for domain
   */
  _getFavicon(domain) {
    if (!domain) return '📄';

    const d = domain.toLowerCase();
    const emojiMap = {
      'medium.com': '📝',
      'nytimes.com': '📰',
      'theguardian.com': '📰',
      'washingtonpost.com': '📰',
      'wired.com': '⚡',
      'arstechnica.com': '🔬',
      'github.com': '🐙',
      'dev.to': '👩‍💻',
      'reddit.com': '🤖',
      'twitter.com': '🐦',
      'youtube.com': '▶️',
      'wikipedia.org': '📚',
      'hackernews': '🟠',
      'substack.com': '✉️'
    };

    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (d.includes(key)) return emoji;
    }

    return '📄';
  }

  /**
   * Show import modal
   */
  _showImportModal() {
    const modalHTML = `
      <div class="modal-overlay" id="import-modal">
        <div class="modal">
          <div class="modal-header">
            <h2>Import Articles</h2>
            <button class="btn btn-ghost modal-close" id="close-import-modal">✕</button>
          </div>

          <div class="modal-content">
            <div class="dropzone" id="import-dropzone">
              <div class="dropzone-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <div class="dropzone-text">Drop your Instapaper CSV here</div>
              <div class="dropzone-hint">Or click to select file</div>
            </div>

            <input type="file" id="import-file-input" accept=".csv" class="hidden">

            <div class="import-info">
              <h4>How to export from Instapaper:</h4>
              <ol>
                <li>Go to instapaper.com/user</li>
                <li>Click "Download .CSV file"</li>
                <li>Drop the file here</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Attach handlers
    const modal = document.getElementById('import-modal');
    const dropzone = document.getElementById('import-dropzone');
    const fileInput = document.getElementById('import-file-input');
    const closeBtn = document.getElementById('close-import-modal');

    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) this._handleImport(file, modal);
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this._handleImport(file, modal);
    });
  }

  /**
   * Handle file import
   */
  async _handleImport(file, modal) {
    console.log(`[${APP_NAME}] Importing: ${file.name}`);

    try {
      const content = await file.text();
      const { articles, audit, errors } = parseInstapaperCSV(content);

      if (errors.length > 0) {
        console.warn(`[${APP_NAME}] Import warnings:`, errors);
      }

      if (articles.length === 0) {
        this._showToast('No articles found in file', 'error');
        return;
      }

      // Import to library
      const result = await this.library.importArticles({ articles, audit });

      // Close import modal
      modal.remove();

      // Show rescue audit (THE AHA MOMENT!)
      this._showRescueAudit(audit, result);

    } catch (error) {
      console.error(`[${APP_NAME}] Import failed:`, error);
      this._showToast('Import failed: ' + error.message, 'error');
    }
  }

  /**
   * Show rescue audit modal (THE AHA MOMENT!)
   */
  _showRescueAudit(audit, importResult) {
    const modalHTML = `
      <div class="modal-overlay" id="rescue-audit-modal">
        <div class="modal modal-large">
          <div class="modal-content">
            <!-- Hero Section -->
            <div class="rescue-hero">
              <div class="rescue-checkmark">✓</div>
              <h1 class="rescue-title">Articles Rescued!</h1>
              <p class="rescue-subtitle">Your reading list is now free. Forever.</p>
            </div>

            <!-- Stats Grid -->
            <div class="rescue-stats">
              <div class="stat-card">
                <div class="stat-value">${audit.totalArticles}</div>
                <div class="stat-label">Articles Rescued</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${audit.totalReadingTimeHours}h</div>
                <div class="stat-label">Reading Time Saved</div>
              </div>
              <div class="stat-card accent">
                <div class="stat-value">$${audit.savingsAnnual}</div>
                <div class="stat-label">Saved Per Year</div>
              </div>
            </div>

            <!-- Breakdown -->
            <div class="rescue-breakdown">
              <div class="breakdown-row">
                <span>Unread articles</span>
                <span>${audit.unreadCount}</span>
              </div>
              <div class="breakdown-row">
                <span>Archived articles</span>
                <span>${audit.archivedCount}</span>
              </div>
              <div class="breakdown-row">
                <span>Folders imported</span>
                <span>${audit.folders.length}</span>
              </div>
              ${importResult.duplicatesSkipped > 0 ? `
              <div class="breakdown-row">
                <span>Duplicates skipped</span>
                <span>${importResult.duplicatesSkipped}</span>
              </div>
              ` : ''}
            </div>

            <!-- Savings Banner -->
            <div class="savings-banner">
              <div class="savings-amount">$${audit.savingsLifetime}</div>
              <div class="savings-label">Lifetime savings vs ${TARGET_SAAS} Premium</div>
              <div class="savings-tagline">"Read without ransom."</div>
            </div>

            <!-- Trust Badge -->
            <div class="trust-banner mt-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Your articles stay on your device
            </div>

            <!-- Actions -->
            <div class="rescue-actions">
              <button class="btn btn-primary btn-block" id="start-reading-btn">
                Start Reading
              </button>
              <button class="btn btn-secondary btn-block mt-sm" id="generate-kobo-btn">
                📚 Generate Kobo Digest
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Attach handlers
    const modal = document.getElementById('rescue-audit-modal');

    document.getElementById('start-reading-btn').addEventListener('click', () => {
      modal.remove();
      this._render();
    });

    document.getElementById('generate-kobo-btn').addEventListener('click', () => {
      modal.remove();
      this._showKoboBridge();
    });
  }

  /**
   * Show Kobo Bridge modal
   */
  async _showKoboBridge() {
    const unread = this.library.getUnread(10);

    if (unread.length === 0) {
      this._showToast('No unread articles to export', 'warning');
      return;
    }

    // Generate ePub
    this._showToast('Generating digest...', 'info');

    try {
      const epubBlob = await generateEpub(unread, {
        title: 'ReadFlow Digest',
        maxArticles: 10
      });

      const filename = generateDigestFilename();
      const downloadUrl = createDownloadUrl(epubBlob, filename);

      // Generate QR code for the URL
      // Note: For local transfer, we use a placeholder
      // In production, this would be a local server URL
      const qrSvg = generateQRCodeSVG(downloadUrl, {
        size: 200,
        darkColor: '#00d084',
        lightColor: '#0a0a0f'
      });

      const modalHTML = `
        <div class="modal-overlay" id="kobo-bridge-modal">
          <div class="modal">
            <div class="modal-header">
              <h2>📚 Kobo Sync Bridge</h2>
              <button class="btn btn-ghost modal-close" id="close-kobo-modal">✕</button>
            </div>

            <div class="modal-content text-center">
              <div class="kobo-digest-info">
                <div class="digest-count">${unread.length}</div>
                <div class="digest-label">Articles Ready</div>
              </div>

              <div class="kobo-qr mt-lg">
                ${qrSvg}
              </div>

              <p class="text-secondary mt-md" style="font-size: 13px;">
                Scan with your Kobo's browser to download your digest wirelessly.
              </p>

              <div class="kobo-filename mt-md">
                <code>${filename}</code>
              </div>

              <div class="kobo-actions mt-lg">
                <button class="btn btn-primary btn-block" id="download-epub-btn">
                  Download ePub
                </button>
                <button class="btn btn-secondary btn-block mt-sm" id="copy-link-btn">
                  Copy Link
                </button>
              </div>

              <div class="kobo-help mt-lg">
                <details>
                  <summary class="text-secondary">How to transfer to Kobo</summary>
                  <ol class="text-secondary" style="text-align: left; padding: 12px 20px; font-size: 13px;">
                    <li>Download the ePub file</li>
                    <li>Connect your Kobo via USB</li>
                    <li>Copy the file to the Kobo's root folder</li>
                    <li>Eject and enjoy!</li>
                  </ol>
                </details>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);

      const modal = document.getElementById('kobo-bridge-modal');

      document.getElementById('close-kobo-modal').addEventListener('click', () => {
        URL.revokeObjectURL(downloadUrl);
        modal.remove();
      });

      document.getElementById('download-epub-btn').addEventListener('click', () => {
        downloadEpub(epubBlob, filename);
        this._showToast('Downloading digest...', 'success');
      });

      document.getElementById('copy-link-btn').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(downloadUrl);
          this._showToast('Link copied!', 'success');
        } catch (e) {
          this._showToast('Failed to copy link', 'error');
        }
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          URL.revokeObjectURL(downloadUrl);
          modal.remove();
        }
      });

    } catch (error) {
      console.error(`[${APP_NAME}] ePub generation failed:`, error);
      this._showToast('Failed to generate digest: ' + error.message, 'error');
    }
  }

  /**
   * Open article for reading
   */
  _openArticle(id) {
    const article = this.library.articles.find(a => a.id === id);
    if (!article) return;

    // Mark as read
    this.library.markRead(id);

    // Open in new tab (for now)
    // TODO: Implement reader view
    window.open(article.url, '_blank');

    // Re-render list
    this._renderArticleList();
  }

  /**
   * Show options menu
   */
  _showOptionsMenu() {
    const stats = this.library.getStats();

    const menuHTML = `
      <div class="modal-overlay" id="options-modal">
        <div class="modal">
          <div class="modal-header">
            <h2>ReadFlow</h2>
            <button class="btn btn-ghost modal-close" id="close-options-modal">✕</button>
          </div>

          <div class="modal-content">
            <!-- Stats -->
            <div class="options-stats">
              <div class="stat-row">
                <span>Total articles</span>
                <span>${stats.total}</span>
              </div>
              <div class="stat-row">
                <span>Unread</span>
                <span>${stats.unread}</span>
              </div>
              <div class="stat-row">
                <span>Read</span>
                <span>${stats.read}</span>
              </div>
              <div class="stat-row">
                <span>Archived</span>
                <span>${stats.archived}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="options-actions mt-lg">
              <button class="btn btn-secondary btn-block" id="import-more-btn">
                Import More Articles
              </button>
              <button class="btn btn-secondary btn-block mt-sm" id="generate-digest-btn">
                📚 Generate Kobo Digest
              </button>
              <button class="btn btn-ghost btn-block mt-sm" id="export-data-btn">
                Export Library
              </button>
            </div>

            <!-- Trust -->
            <div class="trust-banner mt-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              100% Local · Zero Cloud · Your Data
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', menuHTML);

    const modal = document.getElementById('options-modal');

    document.getElementById('close-options-modal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.getElementById('import-more-btn').addEventListener('click', () => {
      modal.remove();
      this._showImportModal();
    });

    document.getElementById('generate-digest-btn').addEventListener('click', () => {
      modal.remove();
      this._showKoboBridge();
    });

    document.getElementById('export-data-btn').addEventListener('click', () => {
      this._exportLibrary();
    });
  }

  /**
   * Export library as JSON
   */
  _exportLibrary() {
    const data = {
      exportedAt: new Date().toISOString(),
      articles: this.library.articles,
      metadata: this.library.metadata
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readflow-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this._showToast('Library exported!', 'success');
  }

  /**
   * Show toast notification
   */
  _showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  /**
   * Escape HTML
   */
  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Additional styles for dynamically created modals (rescue audit, options menu)
// Core styles are in aether-ui.css
const additionalStyles = `
  /* Modal variant for larger content */
  .modal-large {
    max-width: 480px;
  }

  /* Rescue Audit Modal - "Aha Moment" */
  .rescue-hero {
    text-align: center;
    padding: var(--space-lg) 0;
  }

  .rescue-checkmark {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--status-secure-bg);
    color: var(--status-secure);
    font-size: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--space-md);
  }

  .rescue-title {
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    margin: 0 0 var(--space-xs);
  }

  .rescue-subtitle {
    color: var(--text-secondary);
    margin: 0;
  }

  .rescue-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-sm);
    margin: var(--space-lg) 0;
  }

  .stat-card {
    background: var(--bg-tertiary);
    padding: var(--space-md);
    border-radius: var(--radius-md);
    text-align: center;
  }

  .stat-card.accent {
    background: var(--accent-subtle);
    border: 1px solid var(--accent-primary);
  }

  .stat-value {
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
  }

  .stat-card.accent .stat-value {
    color: var(--accent-primary);
  }

  .stat-label {
    font-size: var(--text-xs);
    color: var(--text-muted);
    margin-top: var(--space-xs);
  }

  .rescue-breakdown {
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    padding: var(--space-md);
  }

  .breakdown-row {
    display: flex;
    justify-content: space-between;
    padding: var(--space-xs) 0;
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .breakdown-row + .breakdown-row {
    border-top: 1px solid var(--border-subtle);
  }

  .rescue-actions {
    margin-top: var(--space-lg);
  }

  /* Options Menu Modal */
  .options-stats {
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    padding: var(--space-md);
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    padding: var(--space-xs) 0;
    font-size: var(--text-sm);
  }

  .stat-row + .stat-row {
    border-top: 1px solid var(--border-subtle);
  }

  .options-actions {
    margin-top: var(--space-lg);
  }
`;

// Inject additional styles
const styleEl = document.createElement('style');
styleEl.textContent = additionalStyles;
document.head.appendChild(styleEl);

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  const app = new ReadFlowApp();
  app.init();
});
