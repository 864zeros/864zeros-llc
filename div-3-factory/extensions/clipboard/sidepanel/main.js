// ============================================================
// SIDE PANEL — ClipBoard
// UI logic, navigation, clip/tag rendering, search.
// ============================================================

import { MESSAGE_TYPES } from '../lib/constants.js';

// --- Debug Mode ---
const DEBUG = false; // Set to true for development logging
function log(...args) {
  if (DEBUG) console.log('[ClipBoard]', ...args);
}

log('Panel loaded.');

// --- Button State Management ---
const pendingActions = new Set();

function disableButton(button, actionKey) {
  if (!button || pendingActions.has(actionKey)) return false;
  pendingActions.add(actionKey);
  button.disabled = true;
  button.classList.add('oia-loading');
  return true;
}

function enableButton(button, actionKey) {
  if (!button) return;
  pendingActions.delete(actionKey);
  button.disabled = false;
  button.classList.remove('oia-loading');
}

// --- State ---
let currentView = 'clips';
let clips = [];
let tags = [];
let selectedTagId = null;
let filterStarred = false;
let selectMode = false;
let selectedClipIds = new Set();

// --- DOM Elements ---
const navItems = document.querySelectorAll('.oia-bottom-nav__item');
const views = document.querySelectorAll('.panel-view');
const fabCapture = document.getElementById('fab-capture');
const searchInput = document.getElementById('search-input');
const clipsList = document.getElementById('clips-list');
const tagsList = document.getElementById('tags-list');
const searchResults = document.getElementById('search-results');
const searchEmpty = document.getElementById('search-empty');

// --- View Switching ---
function showView(viewId) {
  currentView = viewId;

  // Hide all views
  views.forEach(v => v.classList.remove('active'));

  // Show target view
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Update nav active state
  navItems.forEach(n => {
    n.classList.remove('oia-bottom-nav__item--active');
    n.removeAttribute('aria-current');
  });
  const activeNav = document.querySelector(`[data-view="${viewId}"]`);
  if (activeNav) {
    activeNav.classList.add('oia-bottom-nav__item--active');
    activeNav.setAttribute('aria-current', 'page');
  }

  // Focus search input if switching to search view
  if (viewId === 'search' && searchInput) {
    setTimeout(() => searchInput.focus(), 100);
  }

  // Reset filters when switching to clips view
  if (viewId === 'clips') {
    selectedTagId = null;
    filterStarred = false;
    if (filterStarredBtn) {
      filterStarredBtn.classList.remove('filter-chip--active');
      filterStarredBtn.setAttribute('aria-pressed', 'false');
    }
    if (filterClearBtn) {
      filterClearBtn.style.display = 'none';
    }
    loadClips();
  }

  log(`Switched to view: ${viewId}`);
}

// --- Navigation Event Listeners ---
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const viewId = item.dataset.view;
    if (viewId) {
      showView(viewId);
    }
  });
});

// --- Filter Bar ---
const filterStarredBtn = document.getElementById('filter-starred');
const filterClearBtn = document.getElementById('filter-clear');

if (filterStarredBtn) {
  filterStarredBtn.addEventListener('click', () => {
    filterStarred = !filterStarred;
    filterStarredBtn.classList.toggle('filter-chip--active', filterStarred);
    filterStarredBtn.setAttribute('aria-pressed', filterStarred);
    filterClearBtn.style.display = filterStarred ? 'inline-flex' : 'none';
    loadClips();
  });
}

if (filterClearBtn) {
  filterClearBtn.addEventListener('click', () => {
    filterStarred = false;
    selectedTagId = null;
    filterStarredBtn.classList.remove('filter-chip--active');
    filterStarredBtn.setAttribute('aria-pressed', 'false');
    filterClearBtn.style.display = 'none';
    loadClips();
  });
}

// --- Select Mode ---
const toggleSelectModeBtn = document.getElementById('toggle-select-mode');
const bulkActionBar = document.getElementById('bulk-action-bar');
const bulkCountEl = document.getElementById('bulk-count');
const bulkTagBtn = document.getElementById('bulk-tag');
const bulkDeleteBtn = document.getElementById('bulk-delete');
const bulkCancelBtn = document.getElementById('bulk-cancel');

if (toggleSelectModeBtn) {
  toggleSelectModeBtn.addEventListener('click', async () => {
    // Check tier access first
    const response = await chrome.runtime.sendMessage({
      type: 'CHECK_FEATURE_ACCESS',
      payload: { feature: 'bulk-operations' }
    }).catch(() => ({ hasAccess: false }));

    // If no response or no access, show upgrade prompt
    if (!response?.hasAccess) {
      showUpgradePrompt('bulk-operations', 'pro');
      return;
    }

    toggleSelectMode();
  });
}

function toggleSelectMode() {
  selectMode = !selectMode;
  selectedClipIds.clear();

  toggleSelectModeBtn?.classList.toggle('filter-chip--active', selectMode);
  bulkActionBar.style.display = selectMode ? 'flex' : 'none';
  fabCapture.style.display = selectMode ? 'none' : 'flex';

  updateBulkCount();
  renderClips(); // Re-render to show/hide checkboxes
}

function updateBulkCount() {
  if (bulkCountEl) {
    const count = selectedClipIds.size;
    bulkCountEl.textContent = `${count} selected`;
  }
}

if (bulkCancelBtn) {
  bulkCancelBtn.addEventListener('click', () => {
    toggleSelectMode();
  });
}

if (bulkDeleteBtn) {
  bulkDeleteBtn.addEventListener('click', async () => {
    if (selectedClipIds.size === 0) return;

    const count = selectedClipIds.size;
    bulkDeleteBtn.disabled = true;
    bulkDeleteBtn.textContent = 'Deleting...';

    try {
      for (const clipId of selectedClipIds) {
        await chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.DELETE_CLIP,
          payload: { clipId }
        });
      }

      showToast(`${count} clip${count > 1 ? 's' : ''} deleted`, 'success');
      selectedClipIds.clear();
      await loadClips();
      toggleSelectMode();
    } catch (error) {
      showToast("Couldn't delete some clips — try again?", 'error');
    } finally {
      bulkDeleteBtn.disabled = false;
      bulkDeleteBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Delete
      `;
    }
  });
}

if (bulkTagBtn) {
  bulkTagBtn.addEventListener('click', () => {
    if (selectedClipIds.size === 0) return;
    showBulkTagDialog();
  });
}

function showBulkTagDialog() {
  const dialog = document.createElement('div');
  dialog.className = 'tag-dialog';
  dialog.innerHTML = `
    <div class="tag-dialog__content oia-card">
      <h3 class="oia-h2 oia-mb-md">Add tag to ${selectedClipIds.size} clips</h3>
      <input type="text" class="oia-input oia-mb-sm" id="bulk-tag-name" placeholder="Tag name">
      <div class="bulk-tag-list oia-mb-md" id="bulk-tag-list"></div>
      <div class="tag-dialog__actions">
        <button class="oia-btn oia-btn-secondary" id="bulk-tag-cancel">Cancel</button>
        <button class="oia-btn oia-btn-primary" id="bulk-tag-apply">Apply</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  // Load existing tags
  chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_TAGS }).then(response => {
    const tagList = dialog.querySelector('#bulk-tag-list');
    if (response.success && response.tags.length > 0) {
      tagList.innerHTML = response.tags.map(tag => `
        <button class="bulk-tag-option" data-tag-id="${tag.id}" data-tag-name="${escapeHtml(tag.name)}">
          ${escapeHtml(tag.name)}
        </button>
      `).join('');

      tagList.querySelectorAll('.bulk-tag-option').forEach(btn => {
        btn.addEventListener('click', () => {
          dialog.querySelector('#bulk-tag-name').value = btn.dataset.tagName;
          tagList.querySelectorAll('.bulk-tag-option').forEach(b => b.classList.remove('bulk-tag-option--selected'));
          btn.classList.add('bulk-tag-option--selected');
        });
      });
    } else {
      tagList.innerHTML = '<p class="oia-caption">No existing tags. Type a name to create one.</p>';
    }
  });

  const input = dialog.querySelector('#bulk-tag-name');
  input.focus();

  dialog.querySelector('#bulk-tag-cancel').addEventListener('click', () => dialog.remove());

  dialog.querySelector('#bulk-tag-apply').addEventListener('click', async () => {
    const tagName = input.value.trim();
    if (!tagName) {
      showToast('Enter a tag name', 'warning');
      return;
    }

    const applyBtn = dialog.querySelector('#bulk-tag-apply');
    applyBtn.disabled = true;
    applyBtn.textContent = 'Applying...';

    try {
      // Create or get tag
      let tagId;
      const createResponse = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.CREATE_TAG,
        payload: { name: tagName }
      });

      if (createResponse.success) {
        tagId = createResponse.tag.id;
      } else {
        // Tag might exist, find it
        const tagsResponse = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_TAGS });
        const existingTag = tagsResponse.tags?.find(t => t.name.toLowerCase() === tagName.toLowerCase());
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          showToast("Couldn't create tag — try again?", 'error');
          return;
        }
      }

      // Link tag to all selected clips
      for (const clipId of selectedClipIds) {
        await chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.LINK_TAG,
          payload: { clipId, tagId }
        });
      }

      showToast(`Tagged ${selectedClipIds.size} clips with "${tagName}"`, 'success');
      dialog.remove();
      await loadTags();
      toggleSelectMode();
    } catch (error) {
      showToast("Couldn't apply tag — try again?", 'error');
      applyBtn.disabled = false;
      applyBtn.textContent = 'Apply';
    }
  });
}

// --- FAB Click Handler ---
fabCapture.addEventListener('click', async () => {
  log('FAB clicked — showing capture menu');
  showCaptureMenu();
});

// --- Settings Button ---
const openOptionsBtn = document.getElementById('open-options');
if (openOptionsBtn) {
  openOptionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// --- Capture Menu ---
function showCaptureMenu() {
  // Remove existing menu
  const existing = document.querySelector('.capture-menu');
  if (existing) {
    existing.remove();
    return;
  }

  const menu = document.createElement('div');
  menu.className = 'capture-menu';
  menu.innerHTML = `
    <button class="capture-menu__item" data-action="selection">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3"/>
        <rect x="7" y="7" width="10" height="10" rx="1"/>
      </svg>
      <span>Clip selection</span>
    </button>
    <button class="capture-menu__item" data-action="page">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      <span>Clip entire page</span>
    </button>
    <button class="capture-menu__item capture-menu__item--premium" data-action="screenshot">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <span>Screenshot</span>
      <span class="capture-menu__badge">Starter</span>
    </button>
    <button class="capture-menu__item capture-menu__item--premium" data-action="marquee">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3"/>
        <rect x="6" y="6" width="12" height="12" rx="1" stroke-dasharray="3 2"/>
      </svg>
      <span>Marquee select</span>
      <span class="capture-menu__badge">Pro</span>
    </button>
    <button class="capture-menu__item capture-menu__item--premium" data-action="pdf">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <path d="M9 15h6"/>
        <path d="M9 11h6"/>
      </svg>
      <span>Save as PDF</span>
      <span class="capture-menu__badge">Starter</span>
    </button>
  `;

  document.body.appendChild(menu);

  // Handle menu clicks
  menu.querySelectorAll('.capture-menu__item').forEach(item => {
    item.addEventListener('click', async () => {
      const action = item.dataset.action;
      const actionKey = `capture-${action}`;

      if (!disableButton(item, actionKey)) return;
      menu.remove();

      try {
        await captureFromPage(action);
      } finally {
        enableButton(item, actionKey);
      }
    });
  });

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && e.target !== fabCapture) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 10);
}

// --- Capture from Page ---
async function captureFromPage(type) {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      showToast('No active tab found', 'error');
      return;
    }

    // Check if we can inject into this page
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showToast("Can't capture from this page", 'warning');
      return;
    }

    // Handle screenshot capture separately
    if (type === 'screenshot') {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.CAPTURE_SCREENSHOT,
        payload: {
          sourceUrl: tab.url,
          sourceTitle: tab.title
        }
      });

      if (response.success) {
        showToast('Screenshot captured!', 'success');
        await loadClips();
        showView('clips');
      } else if (response.error === 'tier_required') {
        showUpgradePrompt('screenshot-capture', response.requiredTier);
      } else {
        showToast(response.error || "Couldn't capture screenshot — try again?", 'error');
      }
      return;
    }

    // Handle marquee capture
    if (type === 'marquee') {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.CAPTURE_MARQUEE,
        payload: {
          tabId: tab.id,
          sourceUrl: tab.url,
          sourceTitle: tab.title
        }
      });

      if (response.success) {
        showToast('Starting marquee selection...', 'info');
        // The actual capture happens after user makes selection
        // We listen for CLIP_ADDED message
      } else if (response.error === 'tier_required') {
        showUpgradePrompt('marquee-capture', response.requiredTier);
      } else {
        showToast(response.error || "Couldn't start selection — try again?", 'error');
      }
      return;
    }

    // Handle PDF capture
    if (type === 'pdf') {
      showToast('Generating PDF...', 'info');
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.CAPTURE_PDF,
        payload: {
          tabId: tab.id,
          sourceUrl: tab.url,
          sourceTitle: tab.title
        }
      });

      if (response.success) {
        showToast('PDF downloaded to your Downloads folder', 'success');
        await loadClips();
        showView('clips');
      } else if (response.error === 'tier_required') {
        showUpgradePrompt('pdf-capture', response.requiredTier);
      } else {
        showToast(response.error || "Couldn't capture PDF — try again?", 'error');
      }
      return;
    }

    // Inject and capture text
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (captureType) => {
        if (captureType === 'selection') {
          const text = window.getSelection().toString().trim();
          if (!text) {
            return { error: 'No text selected' };
          }
          return {
            content: text,
            url: window.location.href,
            title: document.title
          };
        } else {
          // Extract main content, stripping nav/footer/sidebar
          function extractMainContent() {
            // Priority 1: Look for article or main element
            const article = document.querySelector('article');
            if (article) return article.innerText;

            const main = document.querySelector('main');
            if (main) return main.innerText;

            // Priority 2: Clone body and remove noise elements
            const clone = document.body.cloneNode(true);

            const noiseSelectors = [
              'nav', 'header', 'footer', 'aside',
              '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
              '.nav', '.navbar', '.navigation', '.header', '.footer', '.sidebar',
              '#nav', '#navbar', '#navigation', '#header', '#footer', '#sidebar',
              '.menu', '.ad', '.ads', '.advertisement', '.social', '.share',
              '.comments', '.comment-section', '.related', '.recommended'
            ];

            noiseSelectors.forEach(selector => {
              clone.querySelectorAll(selector).forEach(el => el.remove());
            });

            return clone.innerText || document.body?.innerText || '';
          }

          return {
            content: extractMainContent(),
            url: window.location.href,
            title: document.title
          };
        }
      },
      args: [type]
    });

    if (result.result.error) {
      showToast(result.result.error, 'warning');
      return;
    }

    // Send to service worker
    const messageType = type === 'selection'
      ? MESSAGE_TYPES.CAPTURE_SELECTION
      : MESSAGE_TYPES.CAPTURE_PAGE;

    const response = await chrome.runtime.sendMessage({
      type: messageType,
      payload: {
        content: result.result.content,
        sourceUrl: result.result.url,
        sourceTitle: result.result.title
      }
    });

    if (response.success) {
      showToast('Clipped!', 'success');
      await loadClips();
      showView('clips');
    } else {
      showToast("Couldn't save clip — try again?", 'error');
    }
  } catch (error) {
    log('Capture error:', error);
    showToast("Couldn't capture from this page — try refreshing", 'error');
  }
}

// --- Show Upgrade Prompt ---
function showUpgradePrompt(feature, requiredTier) {
  const featureNames = {
    'screenshot-capture': 'Screenshots',
    'ai-summary': 'AI Summaries',
    'ai-auto-tag': 'AI Auto-Tagging',
    'ai-vision': 'AI Vision',
    'bulk-operations': 'Bulk Operations',
    'marquee-capture': 'Marquee Selection',
    'pdf-capture': 'PDF Capture',
    // InsightForge features
    'synthesize-clips': 'Synthesize Clips',
    'ask-clips': 'Ask Your Clips',
    'research-report': 'Research Reports'
  };

  const featureDescriptions = {
    'screenshot-capture': 'Capture visible page as an image',
    'ai-summary': 'Get quick AI-powered summaries of your clips',
    'ai-auto-tag': 'Let AI suggest tags for your content',
    'ai-vision': 'Let AI describe and analyze your screenshots',
    'bulk-operations': 'Select multiple clips to tag or delete at once',
    'marquee-capture': 'Click and drag to capture a specific area',
    'pdf-capture': 'Save any webpage as a high-quality PDF',
    // InsightForge features
    'synthesize-clips': 'Analyze multiple clips to find themes, insights, and connections',
    'ask-clips': 'Query your clips with natural language questions',
    'research-report': 'Generate comprehensive reports from your clips'
  };

  const tierPrices = {
    'starter': '$1.99',
    'pro': '$3.99',
    'power': '$5.99'
  };

  const dialog = document.createElement('div');
  dialog.className = 'upgrade-dialog';
  dialog.innerHTML = `
    <div class="upgrade-dialog__content oia-card">
      <div class="upgrade-dialog__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
      <h3 class="oia-h2">Unlock ${featureNames[feature] || feature}</h3>
      <p class="oia-body-sm">${featureDescriptions[feature] || 'This feature is available with an upgrade.'}</p>
      <div class="upgrade-dialog__actions">
        <button class="oia-btn oia-btn-secondary" id="upgrade-dismiss">Maybe later</button>
        <button class="oia-btn oia-btn-primary" id="upgrade-action">
          Get ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} · ${tierPrices[requiredTier]}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  dialog.querySelector('#upgrade-dismiss').addEventListener('click', () => dialog.remove());
  dialog.querySelector('#upgrade-action').addEventListener('click', () => {
    // TODO: Open checkout
    showToast('Checkout coming soon!', 'info');
    dialog.remove();
  });
}

// --- Load Clips ---
async function loadClips() {
  const clipsView = document.getElementById('view-clips');
  const emptyState = clipsView.querySelector('.oia-empty');

  // Show loading
  clipsList.innerHTML = '<div class="oia-skeleton oia-skeleton--card"></div>'.repeat(3);
  if (emptyState) emptyState.style.display = 'none';
  clipsList.style.display = 'block';

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.GET_CLIPS,
      payload: selectedTagId ? { tagId: selectedTagId } : {}
    });

    if (response.success) {
      clips = response.clips;
      renderClips();
    }
  } catch (error) {
    log('Load clips error:', error);
    showToast("Couldn't load your clips — try refreshing", 'error');
  }
}

// --- Render Clips ---
function renderClips() {
  const clipsView = document.getElementById('view-clips');
  const emptyState = clipsView.querySelector('.oia-empty');

  // Apply starred filter
  let displayClips = clips;
  if (filterStarred) {
    displayClips = clips.filter(c => c.starred);
  }

  // Update filter clear button visibility
  if (filterClearBtn) {
    filterClearBtn.style.display = (filterStarred || selectedTagId) ? 'inline-flex' : 'none';
  }

  if (displayClips.length === 0) {
    clipsList.style.display = 'none';
    if (emptyState) {
      emptyState.style.display = 'flex';
      // Update empty state text based on active filter
      if (filterStarred) {
        emptyState.querySelector('.oia-empty__headline').textContent = 'No starred clips';
        emptyState.querySelector('.oia-empty__subtext').textContent = 'Star your favorite clips to find them quickly.';
      } else if (selectedTagId) {
        emptyState.querySelector('.oia-empty__headline').textContent = 'No clips with this tag';
        emptyState.querySelector('.oia-empty__subtext').textContent = 'Clips you tag will appear here.';
      } else {
        emptyState.querySelector('.oia-empty__headline').textContent = 'Nothing clipped yet';
        emptyState.querySelector('.oia-empty__subtext').textContent = 'Select text on any page and click the capture button to save it here.';
      }
    }
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  clipsList.style.display = 'flex';

  // Render with staggered animation
  clipsList.innerHTML = displayClips.map((clip, index) => renderClipCard(clip, null, index)).join('');

  // Attach event listeners
  clipsList.querySelectorAll('.clip-card').forEach(card => {
    const clipId = card.dataset.clipId;
    const clip = displayClips.find(c => c.id === clipId);

    // Checkbox for select mode
    const checkbox = card.querySelector('.clip-card__checkbox input');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        if (e.target.checked) {
          selectedClipIds.add(clipId);
          card.classList.add('clip-card--selected');
        } else {
          selectedClipIds.delete(clipId);
          card.classList.remove('clip-card--selected');
        }
        updateBulkCount();
      });

      // Also toggle on card click in select mode
      card.addEventListener('click', (e) => {
        if (selectMode && !e.target.closest('.clip-card__action') && !e.target.closest('.clip-card__checkbox')) {
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event('change'));
        }
      });
    }

    // Expand button
    const expandBtn = card.querySelector('.clip-card__expand');
    expandBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = card.classList.toggle('clip-card--expanded');
      expandBtn.setAttribute('aria-expanded', isExpanded);
      const icon = expandBtn.querySelector('svg');
      if (icon) {
        icon.style.transform = isExpanded ? 'rotate(180deg)' : '';
      }
    });

    // Copy button
    const copyBtn = card.querySelector('.clip-card__copy');
    copyBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const actionKey = `copy-${clipId}`;
      if (!disableButton(copyBtn, actionKey)) return;
      try {
        if (clip) {
          await navigator.clipboard.writeText(clip.content);
          showToast('Copied to clipboard', 'success');
        }
      } finally {
        enableButton(copyBtn, actionKey);
      }
    });

    // Delete button
    const deleteBtn = card.querySelector('.clip-card__delete');
    deleteBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const actionKey = `delete-${clipId}`;
      if (!disableButton(deleteBtn, actionKey)) return;
      try {
        await deleteClip(clipId);
      } finally {
        enableButton(deleteBtn, actionKey);
      }
    });

    // Star button
    const starBtn = card.querySelector('.clip-card__star');
    starBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const actionKey = `star-${clipId}`;
      if (!disableButton(starBtn, actionKey)) return;
      try {
        await toggleStar(clipId);
      } finally {
        enableButton(starBtn, actionKey);
      }
    });

    // Tag button
    card.querySelector('.clip-card__tag')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTagSection(clipId, card);
    });

    // Summarize button
    const summarizeBtn = card.querySelector('.clip-card__summarize');
    summarizeBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const actionKey = `summarize-${clipId}`;
      if (!disableButton(summarizeBtn, actionKey)) return;
      try {
        await summarizeClip(clipId, card);
      } finally {
        enableButton(summarizeBtn, actionKey);
      }
    });

    // AI Vision button
    const visionBtn = card.querySelector('.clip-card__vision');
    visionBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const actionKey = `vision-${clipId}`;
      if (!disableButton(visionBtn, actionKey)) return;
      try {
        await analyzeScreenshot(clipId);
      } finally {
        enableButton(visionBtn, actionKey);
      }
    });

    // PDF card click - open source URL
    if (card.dataset.clipType === 'pdf') {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.clip-card__action') || e.target.closest('.clip-card__checkbox')) return;
        const clip = clips.find(c => c.id === clipId);
        if (clip && clip.sourceUrl) {
          chrome.tabs.create({ url: clip.sourceUrl });
        }
      });
    }
  });
}

// --- Summarize Clip ---
async function summarizeClip(clipId, card) {
  try {
    showToast('Generating summary...', 'info');

    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.SUMMARIZE_CLIP,
      payload: { clipId }
    });

    if (response.success) {
      showToast('Summary generated!', 'success');
      await loadClips(); // Refresh to show new summary
    } else if (response.error === 'tier_required') {
      showUpgradePrompt('ai-summary', response.requiredTier);
    } else if (response.error === 'no_api_key') {
      showToast('Set up your API key in Options to use AI features', 'warning');
    } else {
      showToast(response.error || "Couldn't generate summary — try again?", 'error');
    }
  } catch (error) {
    log('Summarize error:', error);
    showToast("Couldn't generate summary — try again", 'error');
  }
}

// --- Analyze Screenshot with AI Vision ---
async function analyzeScreenshot(clipId) {
  try {
    showToast('Analyzing screenshot...', 'info');

    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.ANALYZE_IMAGE,
      payload: { clipId }
    });

    if (response.success) {
      showToast('Analysis complete!', 'success');
      await loadClips(); // Refresh to show analysis
    } else if (response.error === 'tier_required') {
      showUpgradePrompt('ai-vision', response.requiredTier);
    } else if (response.error === 'no_api_key') {
      showToast('Set up your API key in Options to use AI features', 'warning');
    } else {
      showToast(response.error || "Couldn't analyze screenshot — try again?", 'error');
    }
  } catch (error) {
    log('Vision analysis error:', error);
    showToast("Couldn't analyze screenshot — try again", 'error');
  }
}

// --- Render Single Clip Card ---
function renderClipCard(clip, searchQuery = null, animationIndex = 0) {
  const typeLabel = {
    selection: 'Selection',
    page: 'Page',
    screenshot: 'Screenshot',
    marquee: 'Marquee',
    pdf: 'PDF'
  }[clip.clipType] || 'Clip';

  const timeAgo = formatTimeAgo(clip.createdAt);
  const domain = getDomain(clip.sourceUrl);
  const isScreenshot = clip.clipType === 'screenshot' || clip.clipType === 'marquee';
  const isPDF = clip.clipType === 'pdf';
  const animationDelay = animationIndex * 50;
  const isSelected = selectedClipIds.has(clip.id);

  // Checkbox for select mode
  const checkboxHtml = selectMode ? `
    <label class="clip-card__checkbox">
      <input type="checkbox" ${isSelected ? 'checked' : ''} data-clip-id="${clip.id}">
      <span class="clip-card__checkbox-mark"></span>
    </label>
  ` : '';

  let contentHtml = '';
  let expandButtonHtml = '';

  if (isPDF) {
    // Render PDF with thumbnail preview
    const fileSizeKB = clip.fileSize ? Math.round(clip.fileSize / 1024) : '?';
    const fileSizeMB = clip.fileSize ? (clip.fileSize / (1024 * 1024)).toFixed(1) : '?';
    const sizeLabel = clip.fileSize > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;
    contentHtml = `
      <div class="clip-card__pdf-container">
        <div class="clip-card__pdf-thumb">
          <img src="${clip.content}" alt="PDF preview" class="clip-card__pdf-thumb-img" loading="lazy">
          <div class="clip-card__pdf-badge">PDF</div>
        </div>
        <div class="clip-card__pdf-info">
          <span class="clip-card__pdf-filename">${escapeHtml(clip.pdfFilename || 'document.pdf')}</span>
          <span class="clip-card__pdf-size">${sizeLabel} · Saved to Downloads</span>
        </div>
      </div>
    `;
  } else if (isScreenshot) {
    // Render screenshot as image
    contentHtml = `
      <div class="clip-card__image-container">
        <img src="${clip.content}" alt="Screenshot from ${escapeHtml(clip.sourceTitle)}" class="clip-card__image" loading="lazy">
      </div>
    `;
  } else {
    // Render text content
    const preview = clip.content.substring(0, 200) + (clip.content.length > 200 ? '...' : '');
    const hasMore = clip.content.length > 200;
    const previewHtml = searchQuery ? highlightMatches(preview, searchQuery) : escapeHtml(preview);
    const fullHtml = searchQuery ? highlightMatches(clip.content, searchQuery) : escapeHtml(clip.content);

    contentHtml = `
      <div class="clip-card__content clip-card__content--preview">${previewHtml}</div>
      ${hasMore ? `<div class="clip-card__content clip-card__content--full">${fullHtml}</div>` : ''}
    `;

    // Always show expand button for text clips
    expandButtonHtml = `
      <button class="clip-card__action clip-card__expand ${!hasMore ? 'clip-card__expand--disabled' : ''}" title="${hasMore ? 'Expand' : 'Full content shown'}" aria-label="Expand clip content" aria-expanded="false" ${!hasMore ? 'disabled' : ''}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    `;
  }

  // Summary section (if exists)
  const summaryHtml = clip.summary ? `
    <div class="clip-card__summary">
      <div class="clip-card__summary-label">AI Summary</div>
      <div class="clip-card__summary-text">${escapeHtml(clip.summary)}</div>
    </div>
  ` : '';

  // Summarize button (only for text clips without summary)
  const summarizeButtonHtml = (!isScreenshot && !clip.summary) ? `
    <button class="clip-card__action clip-card__summarize" title="Summarize with AI" aria-label="Generate AI summary">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    </button>
  ` : '';

  // AI Vision button (only for screenshots without analysis)
  const visionButtonHtml = (isScreenshot && !clip.summary) ? `
    <button class="clip-card__action clip-card__vision" title="Describe with AI" aria-label="Analyze screenshot with AI">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </button>
  ` : '';

  return `
    <div class="clip-card ${isScreenshot ? 'clip-card--screenshot' : ''} ${isPDF ? 'clip-card--pdf' : ''} ${selectMode ? 'clip-card--selectable' : ''} ${isSelected ? 'clip-card--selected' : ''}" data-clip-id="${clip.id}" data-clip-type="${clip.clipType}" style="animation-delay: ${animationDelay}ms">
      ${checkboxHtml}
      ${contentHtml}
      ${summaryHtml}
      <div class="clip-card__meta">
        <span class="clip-card__type">${typeLabel}</span>
        <span class="clip-card__source" title="${escapeHtml(clip.sourceUrl)}">
          ${escapeHtml(domain)}
        </span>
        <span class="clip-card__time">${timeAgo}</span>
      </div>
      <div class="clip-card__actions" role="group" aria-label="Clip actions">
        ${expandButtonHtml}
        <button class="clip-card__action clip-card__copy" title="Copy" aria-label="Copy clip to clipboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        ${summarizeButtonHtml}
        ${visionButtonHtml}
        <button class="clip-card__action clip-card__star ${clip.starred ? 'clip-card__star--active' : ''}" title="${clip.starred ? 'Remove star' : 'Add star'}" aria-label="${clip.starred ? 'Remove star from clip' : 'Star this clip'}" aria-pressed="${clip.starred}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${clip.starred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
        <button class="clip-card__action clip-card__tag" title="Add tag" aria-label="Manage tags for this clip">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
        </button>
        <button class="clip-card__action clip-card__delete" title="Delete" aria-label="Delete this clip">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}

// --- Delete Clip ---
async function deleteClip(clipId) {
  try {
    // Animate removal
    const card = clipsList.querySelector(`[data-clip-id="${clipId}"]`);
    if (card) {
      card.classList.add('removing');
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.DELETE_CLIP,
      payload: { clipId }
    });

    if (response.success) {
      showToast('Clip deleted', 'success');
      await loadClips();
    }
  } catch (error) {
    showToast("Couldn't delete — try again?", 'error');
  }
}

// --- Toggle Star ---
async function toggleStar(clipId) {
  const clip = clips.find(c => c.id === clipId);
  if (!clip) return;

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.UPDATE_CLIP,
      payload: {
        clipId,
        updates: { starred: !clip.starred }
      }
    });

    if (response.success) {
      await loadClips();
    }
  } catch (error) {
    showToast("Couldn't update — try again?", 'error');
  }
}

// --- Toggle Tag Section (inline in card) ---
async function toggleTagSection(clipId, card) {
  // Check if section already exists
  const existingSection = card.querySelector('.clip-card__tags');
  if (existingSection) {
    existingSection.remove();
    return;
  }

  // Load tags
  const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_TAGS });
  const allTags = response.success ? response.tags : [];

  // Get clip's current tags
  const clipTagsResponse = await chrome.runtime.sendMessage({
    type: 'GET_CLIP_TAGS',
    payload: { clipId }
  });
  const clipTags = clipTagsResponse.success ? clipTagsResponse.tags : [];
  const clipTagIds = new Set(clipTags.map(t => t.id));

  const section = document.createElement('div');
  section.className = 'clip-card__tags';

  section.innerHTML = `
    <div class="clip-card__tags-header">
      <input type="text" class="clip-card__tags-input oia-input" placeholder="New tag...">
      <button class="clip-card__tags-add oia-btn oia-btn-primary">Add</button>
      <button class="clip-card__tags-close" title="Close" aria-label="Close tag section">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>
    </div>
    <div class="clip-card__tags-list">
      ${allTags.map(tag => `
        <label class="clip-card__tags-item">
          <input type="checkbox" class="oia-checkbox" data-tag-id="${tag.id}" ${clipTagIds.has(tag.id) ? 'checked' : ''}>
          <span class="clip-card__tags-name">${escapeHtml(tag.name)}</span>
        </label>
      `).join('')}
      ${allTags.length === 0 ? '<p class="oia-caption" style="margin: 0;">No tags yet — create one above</p>' : ''}
    </div>
  `;

  // Insert after actions
  card.appendChild(section);

  // Handle new tag creation
  const newTagInput = section.querySelector('.clip-card__tags-input');
  const addTagBtn = section.querySelector('.clip-card__tags-add');
  const closeBtn = section.querySelector('.clip-card__tags-close');

  // Close button
  closeBtn.addEventListener('click', () => {
    section.remove();
  });

  addTagBtn.addEventListener('click', async () => {
    const name = newTagInput.value.trim();
    if (!name) return;

    const createResponse = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.CREATE_TAG,
      payload: { name }
    });

    if (createResponse.success) {
      // Link the new tag to this clip
      await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.LINK_TAG,
        payload: { clipId, tagId: createResponse.tag.id }
      });

      showToast(`Tag "${name}" added`, 'success');
      newTagInput.value = '';

      // Refresh the tag section
      section.remove();
      await toggleTagSection(clipId, card);
      await loadTags();
    } else {
      showToast(createResponse.error || "Couldn't create tag — try again?", 'error');
    }
  });

  // Enter key to add
  newTagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addTagBtn.click();
    }
  });

  // Handle tag toggle
  section.querySelectorAll('.clip-card__tags-item input').forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
      const tagId = checkbox.dataset.tagId;
      const type = checkbox.checked ? MESSAGE_TYPES.LINK_TAG : MESSAGE_TYPES.UNLINK_TAG;

      await chrome.runtime.sendMessage({
        type,
        payload: { clipId, tagId }
      });

      await loadTags();
    });
  });

  // Focus input
  newTagInput.focus();
}

// --- Load Tags ---
async function loadTags() {
  const tagsView = document.getElementById('view-tags');
  const emptyState = tagsView.querySelector('.oia-empty');

  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_TAGS });

    if (response.success) {
      tags = response.tags;
      renderTags();
    }
  } catch (error) {
    log('Load tags error:', error);
    showToast("Couldn't load tags — try again", 'error');
  }
}

// --- Render Tags ---
function renderTags() {
  const tagsView = document.getElementById('view-tags');
  const emptyState = tagsView.querySelector('.oia-empty');

  if (tags.length === 0) {
    tagsList.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  tagsList.style.display = 'flex';

  tagsList.innerHTML = tags.map(tag => `
    <div class="tag-chip" data-tag-id="${tag.id}">
      <span class="tag-chip__name">${escapeHtml(tag.name)}</span>
      <span class="tag-chip__count">${tag.clipCount}</span>
    </div>
  `).join('') + `
    <button class="tag-chip tag-chip--add" id="add-new-tag">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <span>New tag</span>
    </button>
  `;

  // Tag click to filter
  tagsList.querySelectorAll('.tag-chip:not(.tag-chip--add)').forEach(chip => {
    chip.addEventListener('click', () => {
      selectedTagId = chip.dataset.tagId;
      showView('clips');
      loadClips();
      const tagName = tags.find(t => t.id === selectedTagId)?.name;
      showToast(`Showing clips tagged "${tagName}"`, 'info');
    });
  });

  // Add new tag button
  document.getElementById('add-new-tag')?.addEventListener('click', showNewTagDialog);
}

// --- New Tag Dialog ---
function showNewTagDialog() {
  const dialog = document.createElement('div');
  dialog.className = 'tag-dialog';
  dialog.innerHTML = `
    <div class="tag-dialog__content oia-card">
      <h3 class="oia-h2 oia-mb-md">Create tag</h3>
      <input type="text" class="oia-input oia-mb-md" id="new-tag-name" placeholder="Tag name">
      <div class="tag-dialog__actions">
        <button class="oia-btn oia-btn-secondary" id="cancel-tag">Cancel</button>
        <button class="oia-btn oia-btn-primary" id="create-tag">Create</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  const input = dialog.querySelector('#new-tag-name');
  input.focus();

  dialog.querySelector('#cancel-tag').addEventListener('click', () => dialog.remove());
  dialog.querySelector('#create-tag').addEventListener('click', async () => {
    const name = input.value.trim();
    if (!name) return;

    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.CREATE_TAG,
      payload: { name }
    });

    if (response.success) {
      showToast(`Tag "${name}" created`, 'success');
      dialog.remove();
      await loadTags();
    } else {
      showToast(response.error || "Couldn't create tag — try again?", 'error');
    }
  });

  // Enter key to create
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      dialog.querySelector('#create-tag').click();
    }
  });
}

// --- Search ---
let searchTimeout = null;

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(query), 300);
  });
}

async function performSearch(query) {
  if (!query) {
    searchResults.style.display = 'none';
    searchEmpty.style.display = 'flex';
    return;
  }

  searchResults.innerHTML = '<div class="oia-skeleton oia-skeleton--card"></div>'.repeat(2);
  searchResults.style.display = 'flex';
  searchEmpty.style.display = 'none';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SEARCH_CLIPS',
      payload: { query }
    });

    if (response.success) {
      if (response.clips.length === 0) {
        searchResults.innerHTML = `
          <div class="oia-empty" style="padding: var(--oia-space-lg) 0;">
            <div class="oia-empty__headline">No results</div>
            <div class="oia-empty__subtext">Try a different search term.</div>
          </div>
        `;
      } else {
        const query = response.query || '';
        searchResults.innerHTML = response.clips.map(clip => renderClipCard(clip, query)).join('');

        // Attach handlers for search results
        searchResults.querySelectorAll('.clip-card').forEach(card => {
          const clipId = card.dataset.clipId;
          const clip = response.clips.find(c => c.id === clipId);

          // Expand button
          card.querySelector('.clip-card__expand')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = card.classList.toggle('clip-card--expanded');
            const icon = card.querySelector('.clip-card__expand svg');
            if (icon) {
              icon.style.transform = isExpanded ? 'rotate(180deg)' : '';
            }
          });

          // Copy button
          card.querySelector('.clip-card__copy')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (clip) {
              await navigator.clipboard.writeText(clip.content);
              showToast('Copied to clipboard', 'success');
            }
          });
        });
      }
    }
  } catch (error) {
    log('Search error:', error);
    showToast("Search hit a snag — try again", 'error');
  }
}

// --- Toast Notifications ---
function showToast(message, type = 'info') {
  const existing = document.querySelector('.oia-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `oia-toast oia-toast--${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('oia-toast--dismiss');
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

// --- Utility Functions ---
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightMatches(text, query) {
  if (!query || !text) return escapeHtml(text);

  const escaped = escapeHtml(text);
  const escapedQuery = escapeHtml(query);

  // Case-insensitive replace with highlight span
  const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
}

// --- Message Listener (for CLIP_ADDED from service worker) ---
chrome.runtime.onMessage.addListener((message) => {
  log('Received message:', message.type, message.payload);

  if (message.type === 'CLIP_ADDED') {
    log('CLIP_ADDED received, clipType:', message.payload?.clipType);
    if (currentView === 'clips') {
      loadClips();
    }
    // Trigger auto-tag for text-based clips (not screenshots, marquee, or PDF)
    if (message.payload?.clipType !== 'screenshot' && message.payload?.clipType !== 'marquee' && message.payload?.clipType !== 'pdf') {
      log('Triggering auto-tag for clip:', message.payload.id);
      triggerAutoTag(message.payload.id);
    }
  }

  // Refresh data after import from options page
  if (message.type === MESSAGE_TYPES.DATA_IMPORTED) {
    log('DATA_IMPORTED received, refreshing all data');
    loadClips();
    loadTags();
  }
});

// --- Auto-Tag Feature ---
async function triggerAutoTag(clipId) {
  log('triggerAutoTag called with clipId:', clipId);

  // Don't show if banner is already visible
  if (document.querySelector('.autotag-banner')) {
    log('Auto-tag banner already visible, skipping');
    return;
  }

  try {
    log('Sending AUTO_TAG_CLIP message...');
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.AUTO_TAG_CLIP,
      payload: { clipId }
    });

    log('Auto-tag response:', response);

    if (response.success && response.suggestedTags?.length > 0) {
      log('Showing auto-tag banner with tags:', response.suggestedTags);
      showAutoTagBanner(clipId, response.suggestedTags);
    } else {
      log('Auto-tag not showing banner. success:', response.success, 'error:', response.error);
    }
  } catch (error) {
    log('Auto-tag error:', error);
  }
}

function showAutoTagBanner(clipId, suggestedTags) {
  // Remove any existing banner
  document.querySelector('.autotag-banner')?.remove();

  const selectedTags = new Set();

  const banner = document.createElement('div');
  banner.className = 'autotag-banner';
  banner.innerHTML = `
    <div class="autotag-banner__header">
      <span class="autotag-banner__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        Suggested tags
      </span>
      <button class="autotag-banner__close" aria-label="Dismiss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="autotag-banner__tags">
      ${suggestedTags.map(tag => `
        <button class="autotag-banner__tag" data-tag="${escapeHtml(tag)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          ${escapeHtml(tag)}
        </button>
      `).join('')}
    </div>
    <div class="autotag-banner__actions">
      <button class="oia-btn oia-btn-secondary oia-btn-sm" id="autotag-skip">Skip</button>
      <button class="oia-btn oia-btn-primary oia-btn-sm" id="autotag-apply">Apply selected</button>
    </div>
  `;

  document.body.appendChild(banner);

  // Tag selection
  banner.querySelectorAll('.autotag-banner__tag').forEach(tagBtn => {
    tagBtn.addEventListener('click', () => {
      const tag = tagBtn.dataset.tag;
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        tagBtn.classList.remove('autotag-banner__tag--selected');
      } else {
        selectedTags.add(tag);
        tagBtn.classList.add('autotag-banner__tag--selected');
      }
    });
  });

  // Close button
  banner.querySelector('.autotag-banner__close').addEventListener('click', () => {
    banner.remove();
  });

  // Skip button
  banner.querySelector('#autotag-skip').addEventListener('click', () => {
    banner.remove();
  });

  // Apply button
  banner.querySelector('#autotag-apply').addEventListener('click', async () => {
    if (selectedTags.size === 0) {
      banner.remove();
      return;
    }

    const applyBtn = banner.querySelector('#autotag-apply');
    applyBtn.disabled = true;
    applyBtn.textContent = 'Applying...';

    try {
      for (const tagName of selectedTags) {
        // Create tag if it doesn't exist
        const createResponse = await chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.CREATE_TAG,
          payload: { name: tagName }
        });

        // Link to clip
        const tagId = createResponse.success ? createResponse.tag.id : null;
        if (tagId) {
          await chrome.runtime.sendMessage({
            type: MESSAGE_TYPES.LINK_TAG,
            payload: { clipId, tagId }
          });
        } else {
          // Tag might already exist, try to find it
          const tagsResponse = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_TAGS });
          const existingTag = tagsResponse.tags?.find(t => t.name.toLowerCase() === tagName.toLowerCase());
          if (existingTag) {
            await chrome.runtime.sendMessage({
              type: MESSAGE_TYPES.LINK_TAG,
              payload: { clipId, tagId: existingTag.id }
            });
          }
        }
      }

      showToast(`${selectedTags.size} tag${selectedTags.size > 1 ? 's' : ''} added`, 'success');
      await loadTags();
      banner.remove();
    } catch (error) {
      log('Apply auto-tags error:', error);
      showToast("Couldn't apply tags — try again?", 'error');
      applyBtn.disabled = false;
      applyBtn.textContent = 'Apply selected';
    }
  });

  // Auto-dismiss after 15 seconds
  setTimeout(() => {
    if (document.body.contains(banner)) {
      banner.remove();
    }
  }, 15000);
}

// --- Bulk Synthesize (InsightForge) ---
const bulkSynthesizeBtn = document.getElementById('bulk-synthesize');
let selectedTemplate = null;

if (bulkSynthesizeBtn) {
  bulkSynthesizeBtn.addEventListener('click', async () => {
    if (selectedClipIds.size < 2) {
      showToast('Select at least 2 clips to synthesize', 'warning');
      return;
    }

    // Check tier access
    const tierResponse = await chrome.runtime.sendMessage({
      type: 'CHECK_FEATURE_ACCESS',
      payload: { feature: 'synthesize-clips' }
    }).catch(() => ({ hasAccess: false }));

    if (!tierResponse?.hasAccess) {
      showUpgradePrompt('synthesize-clips', 'power');
      return;
    }

    // Show template selector
    showTemplateSelector();
  });
}

// Show template selector modal
async function showTemplateSelector() {
  const modal = document.getElementById('template-modal');
  const balanceEl = document.getElementById('template-balance');

  if (!modal) return;

  // Get current balance
  const creditResponse = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.GET_CREDITS
  }).catch(() => ({ balance: 0 }));

  if (balanceEl) {
    balanceEl.textContent = creditResponse.balance;
  }

  modal.style.display = 'flex';

  // Handle template selection
  const templateOptions = modal.querySelectorAll('.template-option');
  templateOptions.forEach(option => {
    option.onclick = async () => {
      const template = option.dataset.template;
      const cost = parseInt(option.dataset.cost, 10);

      // Check if user has enough credits
      if (creditResponse.balance < cost) {
        modal.style.display = 'none';
        showCreditsPrompt(cost, creditResponse.balance);
        return;
      }

      // Close modal and start synthesis
      modal.style.display = 'none';
      selectedTemplate = template;
      await performSynthesis(template, cost);
    };
  });

  // Close handlers
  const closeBtn = document.getElementById('template-close');
  closeBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
  }, { once: true });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  }, { once: true });
}

async function performSynthesis(template = 'quick-summary', cost = 3) {
  const synthesizeBtn = document.getElementById('bulk-synthesize');
  if (synthesizeBtn) {
    synthesizeBtn.disabled = true;
    synthesizeBtn.innerHTML = `
      <svg class="oia-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/>
      </svg>
      Analyzing...
    `;
  }

  try {
    // Get selected clip IDs
    const clipIds = Array.from(selectedClipIds);

    const templateName = template === 'research-dossier' ? 'Research Dossier' : 'Quick Summary';
    showToast(`Creating ${templateName}...`, 'info');

    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.SYNTHESIZE_CLIPS,
      payload: { clipIds, template }
    });

    if (response.success) {
      showSynthesisResults(response.synthesis, response.newBalance, clipIds.length, template);
      toggleSelectMode();
    } else if (response.error === 'tier_required') {
      showUpgradePrompt('synthesize-clips', response.requiredTier);
    } else if (response.error === 'insufficient_credits') {
      showCreditsPrompt(response.cost, response.balance);
    } else if (response.error === 'no_api_key') {
      showToast('Set up your API key in Options to use AI features', 'warning');
    } else {
      showToast(response.error || "Couldn't analyze clips — try again?", 'error');
    }
  } catch (error) {
    log('Synthesis error:', error);
    showToast("Couldn't analyze clips — try again", 'error');
  } finally {
    if (synthesizeBtn) {
      synthesizeBtn.disabled = false;
      synthesizeBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
          <path d="M8 12h8"/>
        </svg>
        Synthesize
      `;
    }
  }
}

// Store last synthesis for copy/export
let lastSynthesis = null;
let lastSynthesisClipCount = 0;
let lastSynthesisTemplate = 'quick-summary';

function showSynthesisResults(synthesis, newBalance, clipCount = 0, template = 'quick-summary') {
  const modal = document.getElementById('synthesis-modal');
  const resultsContainer = document.getElementById('synthesis-results');
  const creditsDisplay = document.getElementById('synthesis-credits');
  const metaDisplay = document.getElementById('synthesis-meta');

  if (!modal || !resultsContainer) return;

  // Store for copy/export
  lastSynthesis = synthesis;
  lastSynthesisClipCount = clipCount || selectedClipIds.size;
  lastSynthesisTemplate = template;

  // Update meta info
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const templateName = template === 'research-dossier' ? 'Research Dossier' : 'Quick Summary';
  if (metaDisplay) {
    metaDisplay.textContent = `${templateName} · ${lastSynthesisClipCount} sources · ${dateStr}`;
  }

  // Render based on template type
  if (template === 'research-dossier') {
    resultsContainer.innerHTML = renderResearchDossier(synthesis, dateStr);
  } else {
    resultsContainer.innerHTML = renderQuickSummary(synthesis, dateStr);
  }

  // Update credits display
  if (creditsDisplay && newBalance !== undefined) {
    creditsDisplay.textContent = `${newBalance} credits remaining`;
  }

  // Show modal
  modal.style.display = 'flex';

  // Close handlers
  const closeBtn = document.getElementById('synthesis-close');
  const doneBtn = document.getElementById('synthesis-done');
  const copyBtn = document.getElementById('synthesis-copy');
  const downloadBtn = document.getElementById('synthesis-download');

  const closeModal = () => {
    modal.style.display = 'none';
  };

  closeBtn?.addEventListener('click', closeModal, { once: true });
  doneBtn?.addEventListener('click', closeModal, { once: true });

  // Copy to clipboard
  copyBtn?.addEventListener('click', () => {
    const text = synthesisToText(lastSynthesis);
    navigator.clipboard.writeText(text).then(() => {
      showToast('Report copied to clipboard', 'success');
    }).catch(() => {
      showToast("Couldn't copy — try again?", 'error');
    });
  }, { once: true });

  // Download PDF (print dialog)
  downloadBtn?.addEventListener('click', () => {
    downloadSynthesisPDF();
  }, { once: true });

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  }, { once: true });
}

function renderQuickSummary(synthesis, dateStr) {
  return `
    ${synthesis.summary ? `
    <div class="synthesis-section synthesis-section--summary">
      <div class="synthesis-section__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        Summary
      </div>
      <div class="synthesis-section__content">
        <p>${escapeHtml(synthesis.summary)}</p>
      </div>
    </div>
    ` : ''}

    <div class="synthesis-section synthesis-section--themes">
      <div class="synthesis-section__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        Key Themes
      </div>
      <div class="synthesis-section__content">
        ${synthesis.themes?.length ? `<ul class="synthesis-section__list">${synthesis.themes.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : '<p>No themes identified.</p>'}
      </div>
    </div>

    <div class="synthesis-section synthesis-section--insights">
      <div class="synthesis-section__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        Insights
      </div>
      <div class="synthesis-section__content">
        ${synthesis.insights?.length ? `<ul class="synthesis-section__list">${synthesis.insights.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '<p>No insights generated.</p>'}
      </div>
    </div>

    <div class="synthesis-section synthesis-section--connections">
      <div class="synthesis-section__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Connections
      </div>
      <div class="synthesis-section__content">
        ${synthesis.connections?.length ? `<ul class="synthesis-section__list">${synthesis.connections.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>` : '<p>No connections found.</p>'}
      </div>
    </div>

    <div class="synthesis-sources">
      <div class="synthesis-sources__title">Generated by ClipBoard InsightForge</div>
      <div class="synthesis-sources__list">Powered by AI · ${dateStr}</div>
    </div>
  `;
}

function renderResearchDossier(synthesis, dateStr) {
  // Render source clips
  let sourcesHtml = '';
  if (synthesis.sources?.length) {
    sourcesHtml = `
    <div class="synthesis-section synthesis-section--sources">
      <div class="synthesis-section__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        Source Materials
      </div>
      <div class="synthesis-sources-list">
        ${synthesis.sources.map((src, i) => {
          const captureDate = src.createdAt ? new Date(src.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          return `
          <div class="source-card">
            <div class="source-card__header">
              <span class="source-card__num">${i + 1}</span>
              <span class="source-card__title">${escapeHtml(src.title)}</span>
              ${src.type === 'screenshot' || src.type === 'marquee' ? '<span class="source-card__badge">Image</span>' : ''}
            </div>
            ${src.thumbnail ? `
              <div class="source-card__img-wrap">
                <img class="source-card__thumb" src="${src.thumbnail}" alt="Screenshot">
                <div class="source-card__caption">${escapeHtml(src.url || 'Local capture')}${captureDate ? ` · ${captureDate}` : ''}</div>
              </div>
            ` : ''}
            ${src.content ? `<div class="source-card__content">${escapeHtml(src.content.substring(0, 300))}${src.content.length > 300 ? '...' : ''}</div>` : ''}
            ${!src.thumbnail && src.url ? `<div class="source-card__url">${escapeHtml(src.url)}</div>` : ''}
          </div>
        `}).join('')}
      </div>
    </div>
    `;
  }

  return `
    ${synthesis.executive_summary ? `
    <div class="synthesis-section synthesis-section--summary">
      <div class="synthesis-section__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="9" x2="15" y2="9"/>
          <line x1="9" y1="13" x2="15" y2="13"/>
          <line x1="9" y1="17" x2="12" y2="17"/>
        </svg>
        Executive Summary
      </div>
      <div class="synthesis-section__content">
        <p>${escapeHtml(synthesis.executive_summary)}</p>
      </div>
    </div>
    ` : ''}

    <div class="synthesis-section synthesis-section--themes">
      <div class="synthesis-section__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        Major Themes
      </div>
      <div class="synthesis-section__content">
        ${synthesis.themes?.length ? `<ul class="synthesis-section__list">${synthesis.themes.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : '<p>No themes identified.</p>'}
      </div>
    </div>

    ${synthesis.key_findings?.length ? `
    <div class="synthesis-section synthesis-section--findings">
      <div class="synthesis-section__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Key Findings
      </div>
      <div class="synthesis-section__content">
        <ul class="synthesis-section__list">${synthesis.key_findings.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
      </div>
    </div>
    ` : ''}

    <div class="synthesis-section synthesis-section--insights">
      <div class="synthesis-section__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
        Analytical Insights
      </div>
      <div class="synthesis-section__content">
        ${synthesis.insights?.length ? `<ul class="synthesis-section__list">${synthesis.insights.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '<p>No insights generated.</p>'}
      </div>
    </div>

    <div class="synthesis-section synthesis-section--connections">
      <div class="synthesis-section__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Cross-Source Connections
      </div>
      <div class="synthesis-section__content">
        ${synthesis.connections?.length ? `<ul class="synthesis-section__list">${synthesis.connections.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>` : '<p>No connections found.</p>'}
      </div>
    </div>

    ${synthesis.questions?.length ? `
    <div class="synthesis-section synthesis-section--questions">
      <div class="synthesis-section__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Open Questions
      </div>
      <div class="synthesis-section__content">
        <ul class="synthesis-section__list">${synthesis.questions.map(q => `<li>${escapeHtml(q)}</li>`).join('')}</ul>
      </div>
    </div>
    ` : ''}

    ${synthesis.summary ? `
    <div class="synthesis-section synthesis-section--conclusion">
      <div class="synthesis-section__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Conclusion
      </div>
      <div class="synthesis-section__content">
        <p>${escapeHtml(synthesis.summary)}</p>
      </div>
    </div>
    ` : ''}

    ${sourcesHtml}

    ${synthesis.tags?.length ? `
    <div class="synthesis-section synthesis-section--tags">
      <div class="synthesis-section__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        Tags
      </div>
      <div class="synthesis-tags-list">
        ${synthesis.tags.map(tag => `<span class="synthesis-tag" style="background-color: ${tag.color}20; color: ${tag.color}; border: 1px solid ${tag.color}40;">${escapeHtml(tag.name)}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    <div class="synthesis-sources">
      <div class="synthesis-sources__title">Research Dossier by ClipBoard InsightForge</div>
      <div class="synthesis-sources__list">Powered by AI · ${dateStr}</div>
    </div>
  `;
}

// Convert synthesis to plain text
function synthesisToText(synthesis) {
  const isDossier = lastSynthesisTemplate === 'research-dossier';
  const title = isDossier ? 'RESEARCH DOSSIER' : 'QUICK SUMMARY';

  let text = `${title}\n`;
  text += `Generated: ${new Date().toLocaleDateString()}\n`;
  text += `${'='.repeat(40)}\n\n`;

  if (isDossier) {
    // Research Dossier format
    if (synthesis.executive_summary) {
      text += `EXECUTIVE SUMMARY\n${synthesis.executive_summary}\n\n`;
    }

    if (synthesis.themes?.length) {
      text += `MAJOR THEMES\n`;
      synthesis.themes.forEach((t, i) => text += `${i + 1}. ${t}\n`);
      text += '\n';
    }

    if (synthesis.key_findings?.length) {
      text += `KEY FINDINGS\n`;
      synthesis.key_findings.forEach((f, i) => text += `${i + 1}. ${f}\n`);
      text += '\n';
    }

    if (synthesis.insights?.length) {
      text += `ANALYTICAL INSIGHTS\n`;
      synthesis.insights.forEach((t, i) => text += `${i + 1}. ${t}\n`);
      text += '\n';
    }

    if (synthesis.connections?.length) {
      text += `CROSS-SOURCE CONNECTIONS\n`;
      synthesis.connections.forEach((t, i) => text += `${i + 1}. ${t}\n`);
      text += '\n';
    }

    if (synthesis.questions?.length) {
      text += `OPEN QUESTIONS\n`;
      synthesis.questions.forEach((q, i) => text += `${i + 1}. ${q}\n`);
      text += '\n';
    }

    if (synthesis.summary) {
      text += `CONCLUSION\n${synthesis.summary}\n\n`;
    }

    if (synthesis.sources?.length) {
      text += `SOURCE MATERIALS\n`;
      synthesis.sources.forEach((src, i) => {
        text += `[${i + 1}] ${src.title || 'Untitled'}\n`;
        if (src.content) text += `    ${src.content.substring(0, 200)}${src.content.length > 200 ? '...' : ''}\n`;
        if (src.url) text += `    URL: ${src.url}\n`;
        text += '\n';
      });
    }

    if (synthesis.tags?.length) {
      text += `TAGS\n`;
      text += synthesis.tags.map(t => t.name).join(', ') + '\n\n';
    }
  } else {
    // Quick Summary format
    if (synthesis.summary) {
      text += `SUMMARY\n${synthesis.summary}\n\n`;
    }

    if (synthesis.themes?.length) {
      text += `KEY THEMES\n`;
      synthesis.themes.forEach((t, i) => text += `${i + 1}. ${t}\n`);
      text += '\n';
    }

    if (synthesis.insights?.length) {
      text += `INSIGHTS\n`;
      synthesis.insights.forEach((t, i) => text += `${i + 1}. ${t}\n`);
      text += '\n';
    }

    if (synthesis.connections?.length) {
      text += `CONNECTIONS\n`;
      synthesis.connections.forEach((t, i) => text += `${i + 1}. ${t}\n`);
      text += '\n';
    }
  }

  text += `${'='.repeat(40)}\n`;
  text += `Generated by ClipBoard InsightForge\n`;

  return text;
}

// Download synthesis as PDF via print
function downloadSynthesisPDF() {
  const reportEl = document.getElementById('synthesis-report');
  if (!reportEl) return;

  // Create print-friendly version
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Please allow popups to download PDF', 'warning');
    return;
  }

  const isDossier = lastSynthesisTemplate === 'research-dossier';
  const title = isDossier ? 'Research Dossier' : 'Quick Summary';

  const styles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 650px; margin: 0 auto; color: #333; }
      h1 { font-size: 24px; margin-bottom: 8px; color: #6B6B5E; }
      .meta { font-size: 12px; color: #888; margin-bottom: 24px; }
      .section { margin-bottom: 20px; padding: 16px; background: #f9f9f7; border-left: 3px solid #6B6B5E; border-radius: 4px; }
      .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6B5E; margin-bottom: 8px; }
      .section ul { margin: 0; padding-left: 20px; }
      .section li { margin: 8px 0; line-height: 1.5; }
      .section p { margin: 0; line-height: 1.6; }
      .executive { background: linear-gradient(135deg, #f0f0ed 0%, #f9f9f7 100%); border-left-color: #C17F59; }
      .findings { border-left-color: #D4A574; }
      .questions { border-left-color: #9B8AA6; }
      .conclusion { background: linear-gradient(135deg, #f5f5f0 0%, #fafaf8 100%); border-left-color: #7A8B6E; }
      .source { margin-bottom: 16px; padding: 12px; background: #fff; border: 1px solid #e5e5e0; border-radius: 4px; }
      .source-num { display: inline-block; width: 20px; height: 20px; background: #6B6B5E; color: #fff; border-radius: 50%; text-align: center; font-size: 11px; line-height: 20px; margin-right: 8px; vertical-align: middle; }
      .source-title { font-weight: 600; color: #333; vertical-align: middle; }
      .source-img-wrap { margin: 10px 0; text-align: center; }
      .source-img-wrap img { width: 100%; max-width: 400px; height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e5e0; }
      .source-content { font-size: 13px; color: #666; line-height: 1.5; margin-top: 8px; }
      .source-url { margin-top: 8px; font-size: 10px; color: #999; word-break: break-all; }
      .source-caption { font-size: 10px; color: #888; margin-top: 4px; text-align: center; }
      .tags { margin-top: 24px; padding: 16px; background: #fafaf8; border-radius: 4px; }
      .tags-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6B5E; margin-bottom: 12px; }
      .tags-list { display: flex; flex-wrap: wrap; gap: 8px; }
      .tag { display: inline-block; padding: 4px 10px; font-size: 11px; border-radius: 12px; background: #e8e8e3; color: #555; }
      .footer { margin-top: 32px; padding-top: 16px; border-top: 1px dashed #ddd; font-size: 11px; color: #888; }
    </style>
  `;

  const s = lastSynthesis;
  let contentHtml = '';

  if (isDossier) {
    // Research Dossier format
    contentHtml = `
      ${s.executive_summary ? `<div class="section executive"><div class="section-title">Executive Summary</div><p>${escapeHtml(s.executive_summary)}</p></div>` : ''}

      ${s.themes?.length ? `<div class="section"><div class="section-title">Major Themes</div><ul>${s.themes.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul></div>` : ''}

      ${s.key_findings?.length ? `<div class="section findings"><div class="section-title">Key Findings</div><ul>${s.key_findings.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul></div>` : ''}

      ${s.insights?.length ? `<div class="section"><div class="section-title">Analytical Insights</div><ul>${s.insights.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul></div>` : ''}

      ${s.connections?.length ? `<div class="section"><div class="section-title">Cross-Source Connections</div><ul>${s.connections.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul></div>` : ''}

      ${s.questions?.length ? `<div class="section questions"><div class="section-title">Open Questions</div><ul>${s.questions.map(q => `<li>${escapeHtml(q)}</li>`).join('')}</ul></div>` : ''}

      ${s.summary ? `<div class="section conclusion"><div class="section-title">Conclusion</div><p>${escapeHtml(s.summary)}</p></div>` : ''}

      ${s.sources?.length ? `
        <div class="section">
          <div class="section-title">Source Materials</div>
          ${s.sources.map((src, i) => {
            const captureDate = src.createdAt ? new Date(src.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            return `
            <div class="source">
              <span class="source-num">${i + 1}</span>
              <span class="source-title">${escapeHtml(src.title || 'Untitled')}</span>
              ${src.thumbnail ? `
                <div class="source-img-wrap">
                  <img src="${src.thumbnail}" alt="Screenshot">
                  <div class="source-caption">Source: ${escapeHtml(src.url || 'Local capture')}${captureDate ? ` · ${captureDate}` : ''}</div>
                </div>
              ` : ''}
              ${src.content ? `<div class="source-content">${escapeHtml(src.content.substring(0, 300))}${src.content.length > 300 ? '...' : ''}</div>` : ''}
              ${!src.thumbnail && src.url ? `<div class="source-url">${escapeHtml(src.url)}</div>` : ''}
            </div>
          `}).join('')}
        </div>
      ` : ''}

      ${s.tags?.length ? `
        <div class="tags">
          <div class="tags-title">Tags</div>
          <div class="tags-list">
            ${s.tags.map(tag => `<span class="tag" style="background-color: ${tag.color}20; color: ${tag.color}; border: 1px solid ${tag.color}40;">${escapeHtml(tag.name)}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    `;
  } else {
    // Quick Summary format
    contentHtml = `
      ${s.summary ? `<div class="section executive"><div class="section-title">Summary</div><p>${escapeHtml(s.summary)}</p></div>` : ''}

      ${s.themes?.length ? `<div class="section"><div class="section-title">Key Themes</div><ul>${s.themes.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul></div>` : ''}

      ${s.insights?.length ? `<div class="section"><div class="section-title">Insights</div><ul>${s.insights.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul></div>` : ''}

      ${s.connections?.length ? `<div class="section"><div class="section-title">Connections</div><ul>${s.connections.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul></div>` : ''}
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>${title}</title>${styles}</head>
    <body>
      <h1>${title}</h1>
      <div class="meta">${lastSynthesisClipCount} sources analyzed · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>

      ${contentHtml}

      <div class="footer">Generated by ClipBoard InsightForge · 864zeros LLC</div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

function showCreditsPrompt(needed, balance) {
  const modal = document.getElementById('credits-modal');
  const neededEl = document.getElementById('credits-needed');
  const balanceEl = document.getElementById('credits-balance');
  const packsContainer = document.getElementById('credits-packs');

  if (!modal) return;

  // Update values
  if (neededEl) neededEl.textContent = needed;
  if (balanceEl) balanceEl.textContent = balance;

  // Render credit packs
  const packs = [
    { id: 'pack-20', credits: 20, price: '$1.99', label: '20 credits' },
    { id: 'pack-50', credits: 50, price: '$3.99', label: '50 credits', popular: true },
    { id: 'pack-100', credits: 100, price: '$6.99', label: '100 credits' }
  ];

  if (packsContainer) {
    packsContainer.innerHTML = packs.map(pack => `
      <button class="credits-pack ${pack.popular ? 'credits-pack--popular' : ''}" data-pack-id="${pack.id}">
        <span class="credits-pack__label">${pack.label}</span>
        <span class="credits-pack__price">${pack.price}</span>
      </button>
    `).join('');

    // Pack click handlers
    packsContainer.querySelectorAll('.credits-pack').forEach(btn => {
      btn.addEventListener('click', () => {
        // TODO: Open Stripe checkout
        showToast('Credit packs coming soon!', 'info');
        modal.style.display = 'none';
      });
    });
  }

  // Show modal
  modal.style.display = 'flex';

  // Close handlers
  const cancelBtn = document.getElementById('credits-cancel');
  cancelBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
  }, { once: true });

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  }, { once: true });
}

// Update upgrade prompt to include InsightForge features
const insightForgeFeatures = {
  'synthesize-clips': {
    name: 'Synthesize Clips',
    description: 'Analyze multiple clips to find themes, insights, and connections'
  },
  'ask-clips': {
    name: 'Ask Your Clips',
    description: 'Query your clips with natural language questions'
  },
  'research-report': {
    name: 'Research Reports',
    description: 'Generate comprehensive reports from your clips'
  }
};

// Extend the existing featureNames and featureDescriptions
Object.assign(window, { insightForgeFeatures });

// --- Initialize ---
async function init() {
  log('Initializing panel...');

  // Load initial data
  await Promise.all([
    loadClips(),
    loadTags()
  ]);

  showView('clips');
}

// Start
init();

// --- Debug Console Helper ---
// Usage: cb.credits() | cb.tier() | cb.setTier('power') | cb.setCredits(100)
window.cb = {
  async credits() {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_CREDITS });
    console.log(`💰 Credits: ${response.balance}`);
    return response.balance;
  },

  async tier() {
    const result = await chrome.storage.local.get('clipboard_tier');
    const tier = result.clipboard_tier || 'free';
    console.log(`🎫 Tier: ${tier}`);
    return tier;
  },

  async setTier(tier) {
    const valid = ['free', 'starter', 'pro', 'power'];
    if (!valid.includes(tier)) {
      console.log(`❌ Invalid tier. Use: ${valid.join(', ')}`);
      return;
    }
    await chrome.storage.local.set({ 'clipboard_tier': tier });
    console.log(`✅ Tier set to: ${tier}`);
  },

  async setCredits(amount) {
    await chrome.storage.local.set({ 'clipboard_credits': amount });
    console.log(`✅ Credits set to: ${amount}`);
  },

  async addCredits(amount) {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.ADD_CREDITS,
      payload: { amount, source: 'debug' }
    });
    console.log(`✅ Added ${amount} credits. New balance: ${response.newBalance}`);
    return response.newBalance;
  },

  async tokens() {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_TOKEN_USAGE });
    const u = response.usage;
    // Gemini Flash pricing: $0.15/1M input, $0.60/1M output
    const inputCost = u.promptTokens * 0.00000015;
    const outputCost = u.completionTokens * 0.0000006;
    const totalCost = inputCost + outputCost;
    console.log(`
🔢 Token Usage (Session)
────────────────────────
📥 Input:   ${u.promptTokens.toLocaleString()} tokens  ($${inputCost.toFixed(6)})
📤 Output:  ${u.completionTokens.toLocaleString()} tokens  ($${outputCost.toFixed(6)})
📊 Total:   ${u.totalTokens.toLocaleString()} tokens  ($${totalCost.toFixed(6)})
🔄 Calls:   ${u.calls}
💵 Cost:    $${totalCost.toFixed(4)} (Gemini Flash)
    `);
    return { ...u, cost: totalCost };
  },

  async resetTokens() {
    await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.RESET_TOKEN_USAGE });
    console.log('✅ Token counters reset');
  },

  async storage() {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const pct = quota > 0 ? ((used / quota) * 100).toFixed(2) : 0;
    const formatBytes = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    };
    console.log(`
💾 Storage Usage
────────────────
📦 Used:      ${formatBytes(used)}
📊 Quota:     ${formatBytes(quota)}
📈 Percent:   ${pct}%
    `);
    return { used, quota, percent: parseFloat(pct) };
  },

  async status() {
    const tier = await this.tier();
    const credits = await this.credits();
    const tokenResponse = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_TOKEN_USAGE });
    const t = tokenResponse.usage;
    // Gemini Flash pricing: $0.15/1M input, $0.60/1M output
    const cost = (t.promptTokens * 0.00000015) + (t.completionTokens * 0.0000006);
    const estimate = await navigator.storage.estimate();
    const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(1);
    const quotaMB = ((estimate.quota || 0) / (1024 * 1024)).toFixed(0);
    const pct = estimate.quota > 0 ? ((estimate.usage / estimate.quota) * 100).toFixed(1) : 0;
    const clipsCount = clips.length;
    const tagsCount = tags.length;
    console.log(`
📋 ClipBoard Status
───────────────────
🎫 Tier:     ${tier}
💰 Credits:  ${credits}
📎 Clips:    ${clipsCount}
🏷️  Tags:     ${tagsCount}
💾 Storage:  ${usedMB} MB / ${quotaMB} MB (${pct}%)

🔢 Session Tokens
─────────────────
📥 Input:   ${t.promptTokens.toLocaleString()}
📤 Output:  ${t.completionTokens.toLocaleString()}
📊 Total:   ${t.totalTokens.toLocaleString()}
🔄 Calls:   ${t.calls}
💵 Cost:    $${cost.toFixed(4)}
    `);
  },

  synthesis() {
    if (!lastSynthesis) {
      console.log('❌ No synthesis data. Run a synthesis first.');
      return null;
    }
    console.log(`
🧪 Last Synthesis
─────────────────
📝 Template:  ${lastSynthesisTemplate}
📎 Sources:   ${lastSynthesisClipCount}
📦 Has sources array: ${!!lastSynthesis.sources}
🖼️  Source count: ${lastSynthesis.sources?.length || 0}
    `);
    if (lastSynthesis.sources?.length) {
      console.log('📋 Sources:', lastSynthesis.sources.map((s, i) => ({
        index: i + 1,
        type: s.type,
        title: s.title?.substring(0, 30),
        hasThumb: !!s.thumbnail,
        hasContent: !!s.content
      })));
    }
    console.log('📄 Full synthesis:', lastSynthesis);
    return lastSynthesis;
  },

  help() {
    console.log(`
📋 ClipBoard Debug Commands
───────────────────────────
cb.status()         → Show all status info
cb.credits()        → Show credit balance
cb.tier()           → Show current tier
cb.setTier('power') → Set tier (free|starter|pro|power)
cb.setCredits(100)  → Set credit balance
cb.addCredits(50)   → Add credits to balance
cb.tokens()         → Show LLM tokens + cost (session)
cb.resetTokens()    → Reset token counters
cb.storage()        → Show IndexedDB storage usage
cb.synthesis()      → Inspect last synthesis result
cb.help()           → Show this help
    `);
  }
};

// Show help hint on load (only in debug mode)
if (DEBUG) {
  console.log('💡 ClipBoard debug: Type cb.help() for commands');
}
