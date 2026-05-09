/**
 * Chronicle Side Panel
 * Simple UI, no ports, sendMessage only
 */

(function() {
  'use strict';

  console.log('[Chronicle Panel] Panel script starting...');

  // State
  let entries = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let selectedEntry = null;

  // DOM elements
  const searchInput = document.getElementById('search');
  const entriesContainer = document.getElementById('entries');
  const emptyState = document.getElementById('empty');
  const detailView = document.getElementById('detail');
  const settingsView = document.getElementById('settings');
  const entryCountEl = document.getElementById('entry-count');

  console.log('[Chronicle Panel] DOM elements found:', {
    searchInput: !!searchInput,
    entriesContainer: !!entriesContainer,
    emptyState: !!emptyState,
    detailView: !!detailView,
    settingsView: !!settingsView,
    entryCountEl: !!entryCountEl
  });

  // Initialize
  async function init() {
    console.log('[Chronicle Panel] Initializing...');
    bindEvents();
    await loadEntries();
    listenForUpdates();
    console.log('[Chronicle Panel] Initialization complete');
  }

  // Bind UI events
  function bindEvents() {
    // Search
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderEntries();
    });

    // Filters
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderEntries();
      });
    });

    // Detail view
    document.getElementById('back-btn').addEventListener('click', closeDetail);
    document.getElementById('star-btn').addEventListener('click', toggleStar);
    document.getElementById('delete-btn').addEventListener('click', deleteEntry);

    // Settings cog opens the new RULE-001 Options page (Strike 013).
    // The inline settings view has been removed from panel.html;
    // settings + tier display + destructive actions all live in options/.
    document.getElementById('settings-btn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Sovereign Link header button: two-tap arm + JSON vault export.
    // Promotes Chronicle's previously-buried export to a first-class
    // operational surface (per SOVEREIGN_LINK_PROPOSAL.md §III.a).
    initLiberateButton();
  }

  // Load entries from service worker
  async function loadEntries() {
    console.log('[Chronicle Panel] Loading entries from service worker...');
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_ENTRIES' });
      console.log('[Chronicle Panel] Got response:', response);
      entries = response.entries || [];
      console.log('[Chronicle Panel] Loaded', entries.length, 'entries');
      renderEntries();
    } catch (err) {
      console.error('[Chronicle Panel] Failed to load entries:', err);
      entries = [];
      renderEntries();
    }
  }

  // Listen for new entries
  function listenForUpdates() {
    console.log('[Chronicle Panel] Setting up message listener for updates...');
    chrome.runtime.onMessage.addListener((msg) => {
      console.log('[Chronicle Panel] Received message:', msg.type);
      if (msg.type === 'ENTRY_RECORDED') {
        console.log('[Chronicle Panel] New entry recorded:', msg.entry?.id);
        // Add or update entry in list
        const idx = entries.findIndex(e => e.id === msg.entry.id);
        if (idx >= 0) {
          entries[idx] = msg.entry;
        } else {
          entries.unshift(msg.entry);
        }
        renderEntries();
      }
    });
  }

  // Get filtered entries
  function getFilteredEntries() {
    let filtered = entries;

    // Apply filter
    if (currentFilter === 'starred') {
      filtered = filtered.filter(e => e.starred);
    } else if (currentFilter !== 'all') {
      filtered = filtered.filter(e => e.scribe === currentFilter);
    }

    // Apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.excerpt && e.excerpt.toLowerCase().includes(q))
      );
    }

    return filtered;
  }

  // Render entry list
  function renderEntries() {
    const filtered = getFilteredEntries();

    entryCountEl.textContent = entries.length + ' entries';

    if (filtered.length === 0) {
      entriesContainer.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    entriesContainer.innerHTML = filtered.map(entry => {
      const chatUrl = entry.metadata?.url || '';
      const domain = chatUrl ? getDomain(chatUrl) : '';
      return `
      <article class="entry-card" data-id="${escapeHtml(entry.id)}">
        <div class="entry-title">${escapeHtml(entry.title || 'Untitled')}</div>
        <div class="entry-excerpt">${escapeHtml(entry.excerpt || '')}</div>
        <div class="entry-card__meta">
          <span class="entry-card__scribe ${escapeHtml(entry.scribe)}">${escapeHtml(entry.scribe)}</span>
          ${chatUrl ? `<a href="${escapeHtml(chatUrl)}" class="entry-card__url" target="_blank" title="${escapeHtml(chatUrl)}">${escapeHtml(domain)}</a>` : ''}
          <span class="entry-card__time">${formatDate(entry.recordedAt)}</span>
          <span class="entry-card__count">${entry.messageCount || 0} messages</span>
        </div>
        <div class="entry-card__actions" role="group" aria-label="Entry actions">
          <button class="entry-card__action entry-card__star ${entry.starred ? 'entry-card__star--active' : ''}" data-id="${escapeHtml(entry.id)}" title="${entry.starred ? 'Remove star' : 'Add star'}" aria-label="${entry.starred ? 'Remove star' : 'Star this entry'}" aria-pressed="${entry.starred}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${entry.starred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
          <button class="entry-card__action entry-card__download" data-id="${escapeHtml(entry.id)}" title="Download as Markdown" aria-label="Download conversation as Markdown">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button class="entry-card__action entry-card__delete" data-id="${escapeHtml(entry.id)}" title="Delete" aria-label="Delete this entry">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </article>
    `;
    }).join('');

    // Bind click events
    entriesContainer.querySelectorAll('.entry-card').forEach(el => {
      el.addEventListener('click', (e) => {
        // Don't open detail if clicking action buttons or URL
        if (e.target.closest('.entry-card__action')) return;
        if (e.target.closest('.entry-card__url')) return;
        openEntry(el.dataset.id);
      });
    });

    // Bind star buttons
    entriesContainer.querySelectorAll('.entry-card__star').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStarFromList(btn.dataset.id);
      });
    });

    // Bind download buttons
    entriesContainer.querySelectorAll('.entry-card__download').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadFullConversation(btn.dataset.id);
      });
    });

    // Bind delete buttons
    entriesContainer.querySelectorAll('.entry-card__delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteEntryFromList(btn.dataset.id);
      });
    });
  }

  // Open entry detail
  async function openEntry(id) {
    selectedEntry = id;
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_ENTRY', id });

      document.getElementById('detail-title').textContent = entry.title || 'Untitled';
      document.getElementById('star-btn').innerHTML = entry.starred ? '&#9733;' : '&#9734;';
      document.getElementById('detail-meta').textContent =
        `${entry.scribe} · ${formatDate(entry.recordedAt)} · ${entry.messageCount} messages`;

      const content = document.getElementById('detail-content');
      const exchanges = response.exchanges || [];

      content.innerHTML = exchanges.map((ex, idx) => `
        <div class="exchange ${escapeHtml(ex.role)}" data-exchange-idx="${idx}">
          <div class="exchange-header">
            <div class="exchange-role">${escapeHtml(ex.role)}</div>
            <button class="exchange-download" data-idx="${idx}" title="Download as Markdown">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
          <div class="exchange-content">${escapeHtml(ex.content)}</div>
        </div>
      `).join('');

      // Bind download buttons
      content.querySelectorAll('.exchange-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.idx);
          downloadExchangeAsMarkdown(exchanges[idx], entry);
        });
      });

      detailView.classList.remove('hidden');
    } catch (err) {
      console.error('Failed to load entry:', err);
    }
  }

  // Close detail view
  function closeDetail() {
    detailView.classList.add('hidden');
    selectedEntry = null;
  }

  // Toggle star from list view
  async function toggleStarFromList(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    entry.starred = !entry.starred;

    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_ENTRY',
        id: id,
        updates: { starred: entry.starred }
      });
      renderEntries();
    } catch (err) {
      console.error('Failed to update entry:', err);
      entry.starred = !entry.starred; // Revert
    }
  }

  // Delete entry from list view
  async function deleteEntryFromList(id) {
    try {
      await chrome.runtime.sendMessage({
        type: 'DELETE_ENTRY',
        id: id
      });
      entries = entries.filter(e => e.id !== id);
      renderEntries();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  }

  // Toggle star
  async function toggleStar() {
    if (!selectedEntry) return;

    const entry = entries.find(e => e.id === selectedEntry);
    if (!entry) return;

    entry.starred = !entry.starred;

    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_ENTRY',
        id: selectedEntry,
        updates: { starred: entry.starred }
      });

      document.getElementById('star-btn').innerHTML = entry.starred ? '&#9733;' : '&#9734;';
      renderEntries();
    } catch (err) {
      console.error('Failed to update entry:', err);
      entry.starred = !entry.starred; // Revert
    }
  }

  // Delete entry
  async function deleteEntry() {
    if (!selectedEntry) return;

    try {
      await chrome.runtime.sendMessage({
        type: 'DELETE_ENTRY',
        id: selectedEntry
      });

      entries = entries.filter(e => e.id !== selectedEntry);
      closeDetail();
      renderEntries();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  }

  // Open settings
  function openSettings() {
    settingsView.classList.remove('hidden');
  }

  // Close settings
  function closeSettings() {
    settingsView.classList.add('hidden');
  }

  // Load settings from storage
  async function loadSettings() {
    try {
      const result = await chrome.storage.local.get('settings');
      const settings = result.settings || {};

      // Default all providers to enabled
      const providers = ['gemini', 'claude', 'chatgpt'];
      providers.forEach(provider => {
        const key = provider + 'Enabled';
        document.getElementById('setting-' + provider).checked = settings[key] !== false;
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  // Save settings to storage
  async function saveSettings() {
    try {
      const settings = {
        geminiEnabled: document.getElementById('setting-gemini').checked,
        claudeEnabled: document.getElementById('setting-claude').checked,
        chatgptEnabled: document.getElementById('setting-chatgpt').checked
      };
      await chrome.storage.local.set({ settings });
      console.log('[Chronicle Panel] Settings saved:', settings);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }

  // Download full conversation as markdown
  async function downloadFullConversation(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_ENTRY', id });
      const exchanges = response.exchanges || [];

      const date = new Date(entry.recordedAt);
      const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const scribeName = {
        gemini: 'Google Gemini',
        claude: 'Anthropic Claude',
        chatgpt: 'OpenAI ChatGPT',
        copilot: 'Microsoft Copilot'
      }[entry.scribe] || entry.scribe;

      // Build conversation content
      const conversationMd = exchanges.map(ex => {
        const role = ex.role === 'user' ? '**User**' : '**Assistant**';
        return `### ${role}\n\n${ex.content}`;
      }).join('\n\n---\n\n');

      const markdown = `# ${entry.title || 'Conversation'}

---

**Source:** ${scribeName}
**Date:** ${dateStr}
**Time:** ${timeStr}
**Messages:** ${exchanges.length}

---

## Conversation

${conversationMd}

---

*Exported from Chronicle by 864zeros*
`;

      // Generate filename
      const fileDate = date.toISOString().split('T')[0];
      const safeTitle = (entry.title || 'conversation').slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase();
      const filename = `chronicle-${entry.scribe}-${safeTitle}-${fileDate}.md`;

      // Trigger download
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      console.log('[Chronicle Panel] Downloaded full conversation:', filename);
    } catch (err) {
      console.error('[Chronicle Panel] Failed to download conversation:', err);
    }
  }

  // Download a single exchange as markdown
  function downloadExchangeAsMarkdown(exchange, entry) {
    const date = new Date(exchange.timestamp || entry.recordedAt);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const scribeName = {
      gemini: 'Google Gemini',
      claude: 'Anthropic Claude',
      chatgpt: 'OpenAI ChatGPT',
      copilot: 'Microsoft Copilot'
    }[entry.scribe] || entry.scribe;

    const roleName = exchange.role === 'user' ? 'User' : 'Assistant';

    const markdown = `# Chronicle Export

---

**Source:** ${scribeName}
**Role:** ${roleName}
**Date:** ${dateStr}
**Time:** ${timeStr}

---

${exchange.content}

---

*Exported from Chronicle by 864zeros*
`;

    // Generate filename
    const fileDate = date.toISOString().split('T')[0];
    const safeTitle = (entry.title || 'conversation').slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const filename = `chronicle-${entry.scribe}-${safeTitle}-${fileDate}.md`;

    // Trigger download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    console.log('[Chronicle Panel] Downloaded exchange as markdown:', filename);
  }

  // Export all data
  async function exportData() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_ENTRIES' });
      const allEntries = response.entries || [];

      // Get exchanges for each entry
      const exportData = [];
      for (const entry of allEntries) {
        const entryResponse = await chrome.runtime.sendMessage({ type: 'GET_ENTRY', id: entry.id });
        exportData.push({
          ...entry,
          exchanges: entryResponse.exchanges || []
        });
      }

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chronicle-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      console.log('[Chronicle Panel] Exported', exportData.length, 'entries');
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  }

  // Clear all data
  async function clearAllData() {
    if (!confirm('Are you sure you want to delete all Chronicle data? This cannot be undone.')) {
      return;
    }

    try {
      await chrome.runtime.sendMessage({ type: 'CLEAR_ALL' });
      entries = [];
      renderEntries();
      closeSettings();
      console.log('[Chronicle Panel] All data cleared');
    } catch (err) {
      console.error('Failed to clear data:', err);
    }
  }

  // Get domain from URL
  function getDomain(url) {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  // Format date
  function formatDate(dateString) {
    const d = new Date(dateString);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';

    return d.toLocaleDateString();
  }

  // Escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================================
  // Sovereign Link — Strike 013 / SOVEREIGN_LINK_PROPOSAL.md §III.a
  // RULE-005-compliant two-tap arm pattern (no alert/confirm/prompt).
  // ============================================================

  function initLiberateButton() {
    const btn = document.getElementById('liberate-btn');
    if (!btn) return;
    let armed = false;
    let armTimer = null;
    let outsideClickHandler = null;

    function disarm(silent = true) {
      armed = false;
      btn.dataset.armed = 'false';
      btn.classList.remove('header-liberate--armed');
      btn.title = 'Liberate Vault — export all conversations as JSON';
      if (armTimer) { clearTimeout(armTimer); armTimer = null; }
      if (outsideClickHandler) {
        document.removeEventListener('click', outsideClickHandler, true);
        outsideClickHandler = null;
      }
      if (!silent) panelToast('Liberation cancelled.');
    }

    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (armed) {
        disarm();
        await liberateVaultJson();
        return;
      }
      const count = entries.length;
      if (count === 0) {
        panelToast('Vault is empty — nothing to liberate.');
        return;
      }
      armed = true;
      btn.dataset.armed = 'true';
      btn.classList.add('header-liberate--armed');
      btn.title = 'Tap again within 4 seconds to confirm';
      panelToast(`Tap again to liberate ${count} entries to JSON.`, 4000);
      armTimer = setTimeout(() => disarm(true), 4000);
      outsideClickHandler = (ev) => {
        if (ev.target !== btn && !btn.contains(ev.target)) disarm(true);
      };
      setTimeout(() => document.addEventListener('click', outsideClickHandler, true), 0);
    });
  }

  async function liberateVaultJson() {
    try {
      panelToast('Building JSON export…');
      const { entries: allEntries = [] } = await chrome.runtime.sendMessage({
        type: 'GET_ENTRIES',
        options: { limit: 10000 }
      });
      // Hydrate every entry with its exchanges
      const fullData = [];
      for (const entry of allEntries) {
        const detail = await chrome.runtime.sendMessage({ type: 'GET_ENTRY', id: entry.id });
        fullData.push({ ...entry, exchanges: detail.exchanges || [] });
      }
      const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chronicle-vault-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      panelToast(`Vault liberated. ${allEntries.length} entries written to your Downloads folder.`, 4000);
    } catch (err) {
      console.error('[Chronicle Panel] Liberation failed:', err);
      panelToast('Liberation failed — see console for details.', 4000);
    }
  }

  // Lightweight in-panel toast (used by Sovereign Link arm + status messages).
  let panelToastTimer = null;
  function panelToast(message, ms = 2400) {
    const el = document.getElementById('panel-toast');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
    if (panelToastTimer) clearTimeout(panelToastTimer);
    panelToastTimer = setTimeout(() => el.classList.add('hidden'), ms);
  }

  // Start
  init();
})();
