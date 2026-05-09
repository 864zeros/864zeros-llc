// service-worker.js - Extension Service Worker
// 864zeros Build Kit - ReadVault Extension

import { initDB, put, getAll, count } from '../lib/db.js';
import { initializeSettings, isFirstRun, markInitialized } from '../lib/store.js';
import { MESSAGE_TYPES, APP_NAME } from '../lib/constants.js';

// ===== INSTALLATION =====

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log(`[${APP_NAME}] Installed:`, details.reason);

  // Initialize database
  await initDB();

  // Initialize settings
  await initializeSettings();

  // Set up side panel behavior
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Side panel setup error:', error));

  // Create context menu
  createContextMenus();

  // First-run handling
  if (await isFirstRun()) {
    console.log(`[${APP_NAME}] First run - showing welcome`);
    await markInitialized();

    // Open welcome/import page on first install
    if (details.reason === 'install') {
      chrome.tabs.create({
        url: chrome.runtime.getURL('rescue/rescue.html')
      });
    }
  }
});

// ===== CONTEXT MENUS =====

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    // Save current page
    chrome.contextMenus.create({
      id: 'save-page',
      title: 'Save to ReadVault',
      contexts: ['page', 'frame']
    });

    // Save link
    chrome.contextMenus.create({
      id: 'save-link',
      title: 'Save Link to ReadVault',
      contexts: ['link']
    });

    // Save selection (for excerpts)
    chrome.contextMenus.create({
      id: 'save-selection',
      title: 'Save Selection to ReadVault',
      contexts: ['selection']
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'save-page':
      await saveArticle({
        url: tab.url,
        title: tab.title
      });
      break;

    case 'save-link':
      await saveArticle({
        url: info.linkUrl,
        title: info.linkUrl // Will be updated when fetched
      });
      break;

    case 'save-selection':
      await saveArticle({
        url: tab.url,
        title: tab.title,
        excerpt: info.selectionText
      });
      break;
  }
});

// ===== ARTICLE SAVING =====

async function saveArticle(articleData) {
  try {
    const article = {
      url: articleData.url,
      title: articleData.title || articleData.url,
      excerpt: articleData.excerpt || '',
      status: 'unread',
      favorite: false,
      source: 'extension',
      createdAt: new Date().toISOString()
    };

    // Check for duplicates
    const existing = await getAll('articles', 'by-url', article.url);
    if (existing.length > 0) {
      showNotification('Already Saved', 'This article is already in your ReadVault.');
      return;
    }

    // Save to IndexedDB (OFFLINE-FIRST - no network call)
    await put('articles', article);

    // Notify success
    showNotification('Saved!', article.title.substring(0, 50));

    // Broadcast to open panels
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.ARTICLE_SAVED,
      article
    }).catch(() => { /* Panel might not be open */ });

    console.log(`[${APP_NAME}] Article saved:`, article.url);
  } catch (error) {
    console.error(`[${APP_NAME}] Save failed:`, error);
    showNotification('Save Failed', error.message);
  }
}

// ===== NOTIFICATIONS =====

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('assets/icon128.png'),
    title: `${APP_NAME}: ${title}`,
    message: message
  });
}

// ===== MESSAGE HANDLING =====

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_ARTICLE') {
    saveArticle(message.data)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Async response
  }

  if (message.type === 'GET_STATS') {
    count('articles')
      .then((articleCount) => sendResponse({ articles: articleCount }))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }
});

// ===== BADGE UPDATE =====

async function updateBadge() {
  try {
    const unreadCount = (await getAll('articles', 'by-status', 'unread')).length;
    chrome.action.setBadgeText({
      text: unreadCount > 0 ? String(unreadCount) : ''
    });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  } catch (error) {
    console.error('Badge update failed:', error);
  }
}

// Update badge on startup
updateBadge();

// ===== KEYBOARD SHORTCUTS =====

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-current-page') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await saveArticle({
        url: tab.url,
        title: tab.title
      });
    }
  }
});

console.log(`[${APP_NAME}] Service worker initialized`);
