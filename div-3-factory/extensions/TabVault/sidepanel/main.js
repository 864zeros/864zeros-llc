// ============================================================
// MAIN — TabVault Side Panel
// UI logic, event handling, view switching
// ============================================================

import { MESSAGE_TYPES } from '../lib/constants.js';

// --- DOM Elements ---
// Vault View
const captureButton = document.getElementById('captureCurrentTab');
const captureAllButton = document.getElementById('captureAllTabs');
const vaultedTabsList = document.getElementById('vaultedTabsList');
const emptyState = document.getElementById('emptyState');
const vaultCount = document.getElementById('vaultCount');
const vaultSearch = document.getElementById('vaultSearch');

// Sleep View
const sleepAllButton = document.getElementById('sleepAllTabs');
const sleepExceptActiveButton = document.getElementById('sleepExceptActive');
const openTabsList = document.getElementById('openTabsList');
const sleepEmptyState = document.getElementById('sleepEmptyState');
const openTabsCount = document.getElementById('openTabsCount');
const memoryIndicator = document.getElementById('memoryIndicator');

// Navigation
const navButtons = document.querySelectorAll('.oia-bottom-nav__item');
const views = document.querySelectorAll('.panel-view');
const openOptionsButton = document.getElementById('open-options');

// State
let currentView = 'vault';
let vaultedTabs = [];
let searchQuery = '';
let collapsedGroups = new Set();  // Track which groups are collapsed

// --- Message Helper ---
function sendMessage(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      if (!response.success) {
        return reject(new Error(response.error || 'Unknown error'));
      }
      resolve(response);
    });
  });
}

// --- Toast Notifications ---
function showToast(message, type = 'success') {
  document.querySelectorAll('.vault-toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `vault-toast oia-toast oia-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, 2500);
}

// --- View Switching ---
function switchView(viewName) {
  currentView = viewName;

  // Update nav buttons
  navButtons.forEach(btn => {
    const isActive = btn.dataset.view === viewName;
    btn.classList.toggle('oia-bottom-nav__item--active', isActive);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  // Update views
  views.forEach(view => {
    const isActive = view.id === `view-${viewName}`;
    view.classList.toggle('active', isActive);
  });

  // Refresh content for the active view
  if (viewName === 'vault') {
    renderVaultedTabs();
  } else if (viewName === 'sleep') {
    renderOpenTabs();
  }
}

// --- Capture Scroll Position from Tab ---
async function getScrollPosition(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: MESSAGE_TYPES.GET_SCROLL
    });
    return { scrollX: response.scrollX || 0, scrollY: response.scrollY || 0 };
  } catch (err) {
    console.log('[main] Could not get scroll position:', err.message);
    return { scrollX: 0, scrollY: 0 };
  }
}

// ============================================================
// VAULT VIEW FUNCTIONS
// ============================================================

// --- Capture Current Tab ---
async function vaultCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url) {
      showToast('No tab to vault', 'warning');
      return;
    }

    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showToast('Cannot vault this page', 'warning');
      return;
    }

    const scroll = await getScrollPosition(tab.id);

    await sendMessage(MESSAGE_TYPES.VAULT_TAB, {
      url: tab.url,
      title: tab.title,
      favIconUrl: tab.favIconUrl || '',
      windowId: tab.windowId,
      tabId: tab.id,
      scrollX: scroll.scrollX,
      scrollY: scroll.scrollY,
      vaultedAt: Date.now()
    });

    await chrome.tabs.remove(tab.id);
    showToast('Tab vaulted');
    renderVaultedTabs();
  } catch (err) {
    console.error('[main] Vault error:', err);
    showToast('Something went wrong', 'error');
  }
}

// --- Generate Group Name from timestamp ---
function generateGroupName() {
  const now = new Date();
  return now.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// --- Capture All Tabs in Window (creates a session group) ---
async function vaultAllTabs() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });

    const vaultableTabs = tabs.filter(t =>
      t.url &&
      !t.url.startsWith('chrome://') &&
      !t.url.startsWith('chrome-extension://')
    );

    if (vaultableTabs.length === 0) {
      showToast('No tabs to vault', 'warning');
      return;
    }

    // Generate a session group for "Vault All"
    const groupId = `session_${Date.now()}`;
    const groupName = generateGroupName();

    const tabsData = [];
    for (const tab of vaultableTabs) {
      const scroll = await getScrollPosition(tab.id);
      tabsData.push({
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl || '',
        windowId: tab.windowId,
        tabId: tab.id,
        scrollX: scroll.scrollX,
        scrollY: scroll.scrollY,
        vaultedAt: Date.now()
      });
    }

    await sendMessage('TABVAULT_VAULT_MULTIPLE', {
      tabs: tabsData,
      groupId,
      groupName
    });
    await chrome.tabs.remove(vaultableTabs.map(t => t.id));

    showToast(`${vaultableTabs.length} tabs vaulted as "${groupName}"`);
    renderVaultedTabs();
  } catch (err) {
    console.error('[main] Vault all error:', err);
    showToast('Something went wrong', 'error');
  }
}

// --- Restore Tab ---
async function restoreTab(vaultedTab) {
  try {
    const newTab = await chrome.tabs.create({ url: vaultedTab.url });

    if (vaultedTab.scrollY > 0 || vaultedTab.scrollX > 0) {
      const listener = (tabId, changeInfo) => {
        if (tabId === newTab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(() => {
            chrome.tabs.sendMessage(newTab.id, {
              type: MESSAGE_TYPES.RESTORE_SCROLL,
              scrollX: vaultedTab.scrollX,
              scrollY: vaultedTab.scrollY
            }).catch(() => {});
          }, 500);
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    }

    await sendMessage(MESSAGE_TYPES.DELETE_TAB, { id: vaultedTab.id });
    renderVaultedTabs();
  } catch (err) {
    console.error('[main] Restore error:', err);
    showToast('Could not restore tab', 'error');
  }
}

// --- Delete Vaulted Tab ---
async function deleteVaultedTab(id) {
  try {
    await sendMessage(MESSAGE_TYPES.DELETE_TAB, { id });
    renderVaultedTabs();
  } catch (err) {
    console.error('[main] Delete error:', err);
    showToast('Could not delete', 'error');
  }
}

// --- Render Vault List with Groups ---
async function renderVaultedTabs() {
  try {
    const response = await sendMessage(MESSAGE_TYPES.GET_CONTENTS);
    vaultedTabs = response.data || [];

    // Filter by search query
    let filteredTabs = vaultedTabs;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredTabs = vaultedTabs.filter(tab =>
        tab.title?.toLowerCase().includes(query) ||
        tab.url?.toLowerCase().includes(query)
      );
    }

    // Update count
    if (vaultCount) {
      vaultCount.textContent = vaultedTabs.length > 0 ? `(${vaultedTabs.length})` : '';
    }

    // Show empty state or list
    if (filteredTabs.length === 0) {
      vaultedTabsList.innerHTML = '';
      if (emptyState) {
        if (searchQuery && vaultedTabs.length > 0) {
          emptyState.style.display = 'none';
          vaultedTabsList.innerHTML = '<p class="oia-body-sm" style="color: var(--oia-text-muted); text-align: center; padding: var(--oia-space-lg);">No tabs match your search</p>';
        } else {
          emptyState.style.display = 'flex';
        }
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Organize tabs: grouped vs ungrouped
    const groups = new Map();  // groupId -> { name, tabs }
    const ungroupedTabs = [];

    for (const tab of filteredTabs) {
      if (tab.groupId) {
        if (!groups.has(tab.groupId)) {
          groups.set(tab.groupId, { name: tab.groupName || 'Session', tabs: [] });
        }
        groups.get(tab.groupId).tabs.push(tab);
      } else {
        ungroupedTabs.push(tab);
      }
    }

    // Build HTML
    let html = '';

    // Render groups first (sorted by newest first based on first tab's vaultedAt)
    const sortedGroups = Array.from(groups.entries())
      .sort((a, b) => b[1].tabs[0]?.vaultedAt - a[1].tabs[0]?.vaultedAt);

    for (const [groupId, group] of sortedGroups) {
      const isCollapsed = collapsedGroups.has(groupId);
      const tabCount = group.tabs.length;

      html += `
        <div class="vault-group" data-group-id="${groupId}">
          <div class="vault-group__header ${isCollapsed ? 'vault-group__header--collapsed' : ''}">
            <button class="vault-group__toggle" aria-expanded="${!isCollapsed}" aria-label="Toggle group">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" class="vault-group__chevron">
                <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" stroke-width="1.5" fill="none"/>
              </svg>
            </button>
            <span class="vault-group__name">${escapeHtml(group.name)}</span>
            <span class="vault-group__count">${tabCount} tab${tabCount !== 1 ? 's' : ''}</span>
            <div class="vault-group__actions">
              <button class="vault-group__action vault-group__action--open" title="Open all tabs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </button>
              <button class="vault-group__action vault-group__action--delete" title="Delete group">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="vault-group__tabs ${isCollapsed ? 'vault-group__tabs--collapsed' : ''}">
            ${group.tabs.map(tab => renderTabItem(tab)).join('')}
          </div>
        </div>
      `;
    }

    // Render ungrouped tabs
    if (ungroupedTabs.length > 0) {
      html += ungroupedTabs.map(tab => renderTabItem(tab)).join('');
    }

    vaultedTabsList.innerHTML = html;

    // Attach event listeners
    attachVaultListeners(filteredTabs, sortedGroups);
  } catch (err) {
    console.error('[main] Render error:', err);
    vaultedTabsList.innerHTML = '<p class="oia-body-sm" style="color: var(--oia-text-muted);">Could not load vault</p>';
  }
}

// --- Render a single tab item ---
function renderTabItem(tab) {
  return `
    <div class="vault-item" data-id="${tab.id}">
      <img
        class="vault-item__favicon"
        src="${tab.favIconUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><rect fill=%22%23888%22 width=%2216%22 height=%2216%22 rx=%222%22/></svg>'}"
        alt=""
        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><rect fill=%22%23888%22 width=%2216%22 height=%2216%22 rx=%222%22/></svg>'"
      />
      <span class="vault-item__title" title="${escapeHtml(tab.url)}">${escapeHtml(tab.title)}</span>
      <button class="vault-item__delete" title="Remove from vault" aria-label="Remove ${escapeHtml(tab.title)} from vault">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>
    </div>
  `;
}

// --- Attach Event Listeners for Vault List ---
function attachVaultListeners(filteredTabs, sortedGroups) {
  // Individual tab listeners
  vaultedTabsList.querySelectorAll('.vault-item').forEach(item => {
    const id = parseInt(item.dataset.id, 10);
    const tab = filteredTabs.find(t => t.id === id);

    item.querySelector('.vault-item__title').addEventListener('click', () => {
      if (tab) restoreTab(tab);
    });

    item.querySelector('.vault-item__delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteVaultedTab(id);
    });
  });

  // Group listeners
  vaultedTabsList.querySelectorAll('.vault-group').forEach(groupEl => {
    const groupId = groupEl.dataset.groupId;
    const group = sortedGroups.find(([id]) => id === groupId)?.[1];

    // Toggle collapse
    const toggleBtn = groupEl.querySelector('.vault-group__toggle');
    const header = groupEl.querySelector('.vault-group__header');
    if (toggleBtn && header) {
      const handleToggle = () => {
        if (collapsedGroups.has(groupId)) {
          collapsedGroups.delete(groupId);
        } else {
          collapsedGroups.add(groupId);
        }
        renderVaultedTabs();
      };
      toggleBtn.addEventListener('click', handleToggle);
      // Also toggle when clicking on header (but not action buttons)
      header.addEventListener('click', (e) => {
        if (!e.target.closest('.vault-group__actions')) {
          handleToggle();
        }
      });
    }

    // Open all tabs in group
    const openBtn = groupEl.querySelector('.vault-group__action--open');
    if (openBtn && group) {
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        restoreGroup(groupId, group.tabs);
      });
    }

    // Delete group
    const deleteBtn = groupEl.querySelector('.vault-group__action--delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteGroupTabs(groupId);
      });
    }
  });
}

// --- Restore All Tabs in a Group (keeps group in vault) ---
async function restoreGroup(groupId, tabs) {
  try {
    // Open all tabs (but keep them in the vault)
    for (const tab of tabs) {
      const newTab = await chrome.tabs.create({ url: tab.url, active: false });

      // Restore scroll position
      if (tab.scrollY > 0 || tab.scrollX > 0) {
        const listener = (tabId, changeInfo) => {
          if (tabId === newTab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            setTimeout(() => {
              chrome.tabs.sendMessage(newTab.id, {
                type: MESSAGE_TYPES.RESTORE_SCROLL,
                scrollX: tab.scrollX,
                scrollY: tab.scrollY
              }).catch(() => {});
            }, 500);
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
      }
    }

    // Don't delete — keep the group so user can return to it
    showToast(`Opened ${tabs.length} tabs`);
  } catch (err) {
    console.error('[main] Restore group error:', err);
    showToast('Could not restore group', 'error');
  }
}

// --- Delete All Tabs in a Group ---
async function deleteGroupTabs(groupId) {
  try {
    await sendMessage('TABVAULT_DELETE_GROUP', { groupId });
    collapsedGroups.delete(groupId);  // Clean up state
    showToast('Group deleted');
    renderVaultedTabs();
  } catch (err) {
    console.error('[main] Delete group error:', err);
    showToast('Could not delete group', 'error');
  }
}

// ============================================================
// SLEEP VIEW FUNCTIONS
// ============================================================

// --- Render Open Tabs ---
async function renderOpenTabs() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });

    // Filter out extension pages
    const openTabs = tabs.filter(t =>
      t.url &&
      !t.url.startsWith('chrome://') &&
      !t.url.startsWith('chrome-extension://')
    );

    // Count sleeping tabs
    const sleepingCount = openTabs.filter(t => t.discarded).length;
    const awakeCount = openTabs.length - sleepingCount;

    // Update counts
    if (openTabsCount) {
      openTabsCount.textContent = openTabs.length > 0 ? `(${openTabs.length})` : '';
    }

    // Update memory indicator
    if (memoryIndicator) {
      if (sleepingCount > 0) {
        memoryIndicator.textContent = `${sleepingCount} sleeping`;
        memoryIndicator.className = 'memory-indicator memory-indicator--good';
      } else if (awakeCount > 5) {
        memoryIndicator.textContent = `${awakeCount} active`;
        memoryIndicator.className = 'memory-indicator';
      } else {
        memoryIndicator.textContent = '';
      }
    }

    // Show empty state if all tabs are sleeping
    if (awakeCount === 0 && sleepingCount > 0) {
      openTabsList.innerHTML = '';
      if (sleepEmptyState) sleepEmptyState.style.display = 'flex';
    } else {
      if (sleepEmptyState) sleepEmptyState.style.display = 'none';
    }

    if (openTabs.length === 0) {
      openTabsList.innerHTML = '<p class="oia-body-sm" style="color: var(--oia-text-muted); text-align: center;">No tabs to manage</p>';
      return;
    }

    // Build list
    openTabsList.innerHTML = openTabs.map(tab => `
      <div class="open-tab-item ${tab.discarded ? 'open-tab-item--sleeping' : ''} ${tab.active ? 'open-tab-item--active' : ''}" data-id="${tab.id}">
        <img
          class="open-tab-item__favicon"
          src="${tab.favIconUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><rect fill=%22%23888%22 width=%2216%22 height=%2216%22 rx=%222%22/></svg>'}"
          alt=""
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><rect fill=%22%23888%22 width=%2216%22 height=%2216%22 rx=%222%22/></svg>'"
        />
        <div class="open-tab-item__info">
          <div class="open-tab-item__title" title="${escapeHtml(tab.url)}">${escapeHtml(tab.title)}</div>
          <div class="open-tab-item__status">
            ${tab.active ? '<span class="open-tab-item__badge">Active</span>' : ''}
            ${tab.discarded ? '<span class="open-tab-item__badge open-tab-item__badge--sleeping">Sleeping</span>' : ''}
          </div>
        </div>
        <div class="open-tab-item__actions">
          <button
            class="open-tab-item__action open-tab-item__action--sleep"
            title="${tab.discarded ? 'Already sleeping' : 'Put to sleep'}"
            ${tab.discarded || tab.active ? 'disabled' : ''}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>
            </svg>
          </button>
          <button
            class="open-tab-item__action open-tab-item__action--vault"
            title="Vault this tab"
            ${tab.active ? 'disabled' : ''}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    // Attach event listeners
    openTabsList.querySelectorAll('.open-tab-item').forEach(item => {
      const tabId = parseInt(item.dataset.id, 10);
      const tab = openTabs.find(t => t.id === tabId);

      // Sleep button
      item.querySelector('.open-tab-item__action--sleep')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (tab && !tab.discarded && !tab.active) {
          await sleepTab(tabId);
        }
      });

      // Vault button
      item.querySelector('.open-tab-item__action--vault')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (tab && !tab.active) {
          await vaultOpenTab(tab);
        }
      });
    });
  } catch (err) {
    console.error('[main] Render open tabs error:', err);
    openTabsList.innerHTML = '<p class="oia-body-sm" style="color: var(--oia-text-muted);">Could not load tabs</p>';
  }
}

// --- Sleep a Single Tab ---
async function sleepTab(tabId) {
  try {
    await chrome.tabs.discard(tabId);
    showToast('Tab put to sleep');
    renderOpenTabs();
  } catch (err) {
    console.error('[main] Sleep error:', err);
    showToast('Could not sleep tab', 'error');
  }
}

// --- Sleep All Tabs ---
async function sleepAllTabs() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const sleepableTabs = tabs.filter(t =>
      !t.active &&
      !t.discarded &&
      t.url &&
      !t.url.startsWith('chrome://') &&
      !t.url.startsWith('chrome-extension://')
    );

    if (sleepableTabs.length === 0) {
      showToast('No tabs to sleep', 'warning');
      return;
    }

    let sleepCount = 0;
    for (const tab of sleepableTabs) {
      try {
        await chrome.tabs.discard(tab.id);
        sleepCount++;
      } catch (err) {
        console.log(`Could not sleep tab ${tab.id}:`, err.message);
      }
    }

    showToast(`${sleepCount} tabs put to sleep`);
    renderOpenTabs();
  } catch (err) {
    console.error('[main] Sleep all error:', err);
    showToast('Something went wrong', 'error');
  }
}

// --- Sleep All Except Active ---
async function sleepExceptActive() {
  // Same as sleepAllTabs since we already filter out active tabs
  await sleepAllTabs();
}

// --- Vault an Open Tab ---
async function vaultOpenTab(tab) {
  try {
    const scroll = await getScrollPosition(tab.id);

    await sendMessage(MESSAGE_TYPES.VAULT_TAB, {
      url: tab.url,
      title: tab.title,
      favIconUrl: tab.favIconUrl || '',
      windowId: tab.windowId,
      tabId: tab.id,
      scrollX: scroll.scrollX,
      scrollY: scroll.scrollY,
      vaultedAt: Date.now()
    });

    await chrome.tabs.remove(tab.id);
    showToast('Tab vaulted');
    renderOpenTabs();
  } catch (err) {
    console.error('[main] Vault open tab error:', err);
    showToast('Could not vault tab', 'error');
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// EVENT LISTENERS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Initial render
  renderVaultedTabs();

  // Navigation
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view && view !== currentView) {
        switchView(view);
      }
    });
  });

  // Vault actions
  if (captureButton) {
    captureButton.addEventListener('click', vaultCurrentTab);
  }
  if (captureAllButton) {
    captureAllButton.addEventListener('click', vaultAllTabs);
  }

  // Sleep actions
  if (sleepAllButton) {
    sleepAllButton.addEventListener('click', sleepAllTabs);
  }
  if (sleepExceptActiveButton) {
    sleepExceptActiveButton.addEventListener('click', sleepExceptActive);
  }

  // Search
  if (vaultSearch) {
    vaultSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderVaultedTabs();
    });
  }

  // Open options page
  if (openOptionsButton) {
    openOptionsButton.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }
});

// --- Listen for Tab Changes (reactive UI) ---
chrome.tabs.onUpdated.addListener(() => {
  if (currentView === 'sleep') {
    renderOpenTabs();
  }
});

chrome.tabs.onRemoved.addListener(() => {
  if (currentView === 'sleep') {
    renderOpenTabs();
  }
});

chrome.tabs.onActivated.addListener(() => {
  if (currentView === 'sleep') {
    renderOpenTabs();
  }
});

// --- Listen for Storage Changes (reactive updates from import/other tabs) ---
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    // Check if vault was updated (from import or other windows)
    if ('tabvault_vault_updated' in changes) {
      if (currentView === 'vault') {
        renderVaultedTabs();
      }
    }
    // Also refresh if settings changed
    if ('tabvault_settings' in changes) {
      // Settings changed, could affect UI
    }
  }
});
