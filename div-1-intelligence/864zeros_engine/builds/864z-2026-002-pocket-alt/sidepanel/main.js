// main.js - Side Panel Logic
// 864zeros Build Kit - ReadVault Extension

import { getAll, put, remove, count } from '../lib/db.js';
import { getSettings } from '../lib/store.js';
import { MESSAGE_TYPES } from '../lib/constants.js';

// ===== STATE =====

let articles = [];
let currentFilter = 'all';
let searchQuery = '';

// ===== DOM ELEMENTS =====

const articleList = document.getElementById('article-list');
const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');
const statTotal = document.getElementById('stat-total');
const statUnread = document.getElementById('stat-unread');
const btnImport = document.getElementById('btn-import');
const btnImportEmpty = document.getElementById('btn-import-empty');
const btnSettings = document.getElementById('btn-settings');

// ===== INITIALIZATION =====

async function init() {
  console.log('[ReadVault] Panel initializing...');

  // Load articles
  await loadArticles();

  // Set up event listeners
  setupEventListeners();

  // Listen for updates from service worker
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === MESSAGE_TYPES.ARTICLE_SAVED) {
      loadArticles();
    }
    if (message.type === MESSAGE_TYPES.IMPORT_COMPLETE) {
      loadArticles();
    }
  });

  console.log('[ReadVault] Panel ready');
}

// ===== DATA LOADING =====

async function loadArticles() {
  try {
    articles = await getAll('articles');

    // Sort by date (newest first)
    articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    updateStats();
    renderArticles();
  } catch (error) {
    console.error('[ReadVault] Failed to load articles:', error);
    showError('Failed to load articles');
  }
}

// ===== RENDERING =====

function renderArticles() {
  const filtered = filterArticles();

  if (filtered.length === 0) {
    articleList.innerHTML = `
      <div class="empty-state">
        <p class="oia-body">${searchQuery ? 'No matching articles.' : 'No articles yet.'}</p>
        <p class="oia-body-small">Save articles with the context menu or import from Pocket.</p>
        <button id="btn-import-empty" class="oia-btn-primary">Import from Pocket</button>
      </div>
    `;
    document.getElementById('btn-import-empty')?.addEventListener('click', openImportPage);
    return;
  }

  articleList.innerHTML = filtered.map(article => `
    <article class="article-card ${article.status === 'archived' ? 'archived' : ''}" data-id="${article.id}">
      <div class="article-content">
        <h3 class="article-title">${escapeHtml(article.title)}</h3>
        <p class="article-url">${getDomain(article.url)}</p>
        ${article.excerpt ? `<p class="article-excerpt">${escapeHtml(article.excerpt.substring(0, 100))}...</p>` : ''}
        <div class="article-meta">
          <span class="article-date">${formatDate(article.createdAt)}</span>
          ${article.tags?.length > 0 ? `<span class="article-tags">${article.tags.slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}</span>` : ''}
        </div>
      </div>
      <div class="article-actions">
        <button class="btn-action btn-open" title="Open" data-action="open">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
            <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
          </svg>
        </button>
        <button class="btn-action btn-favorite ${article.favorite ? 'active' : ''}" title="Favorite" data-action="favorite">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
          </svg>
        </button>
        <button class="btn-action btn-archive" title="${article.status === 'archived' ? 'Unarchive' : 'Archive'}" data-action="archive">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1V2zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5H2zm13-3H1v2h14V2zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
          </svg>
        </button>
        <button class="btn-action btn-delete" title="Delete" data-action="delete">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
          </svg>
        </button>
      </div>
    </article>
  `).join('');

  // Add event listeners to action buttons
  articleList.querySelectorAll('.btn-action').forEach(btn => {
    btn.addEventListener('click', handleArticleAction);
  });
}

function filterArticles() {
  let filtered = [...articles];

  // Apply status filter
  if (currentFilter === 'unread') {
    filtered = filtered.filter(a => a.status !== 'archived');
  } else if (currentFilter === 'archived') {
    filtered = filtered.filter(a => a.status === 'archived');
  } else if (currentFilter === 'favorites') {
    filtered = filtered.filter(a => a.favorite);
  }

  // Apply search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(query) ||
      a.url.toLowerCase().includes(query) ||
      a.tags?.some(t => t.toLowerCase().includes(query))
    );
  }

  return filtered;
}

function updateStats() {
  const total = articles.length;
  const unread = articles.filter(a => a.status !== 'archived').length;

  statTotal.textContent = `${total} article${total !== 1 ? 's' : ''}`;
  statUnread.textContent = `${unread} unread`;
}

// ===== EVENT HANDLERS =====

function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderArticles();
  });

  // Filter
  filterStatus.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderArticles();
  });

  // Import buttons
  btnImport.addEventListener('click', openImportPage);
  btnImportEmpty?.addEventListener('click', openImportPage);

  // Settings
  btnSettings.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

async function handleArticleAction(e) {
  const btn = e.currentTarget;
  const action = btn.dataset.action;
  const card = btn.closest('.article-card');
  const articleId = card.dataset.id;
  const article = articles.find(a => a.id === articleId);

  if (!article) return;

  switch (action) {
    case 'open':
      chrome.tabs.create({ url: article.url });
      break;

    case 'favorite':
      article.favorite = !article.favorite;
      await put('articles', article);
      btn.classList.toggle('active', article.favorite);
      break;

    case 'archive':
      article.status = article.status === 'archived' ? 'unread' : 'archived';
      await put('articles', article);
      renderArticles();
      updateStats();
      break;

    case 'delete':
      if (confirm('Delete this article?')) {
        await remove('articles', articleId);
        await loadArticles();
      }
      break;
  }
}

function openImportPage() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('rescue/rescue.html')
  });
}

// ===== HELPERS =====

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}

function showError(message) {
  articleList.innerHTML = `
    <div class="error-state">
      <p class="oia-body">${message}</p>
    </div>
  `;
}

// ===== INIT =====

init();
