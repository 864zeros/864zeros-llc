// content.js - Content Script
// 864zeros Build Kit - ReadVault Extension
//
// Minimal content script for page interaction.
// Currently used for future enhancements like:
// - Reading mode overlay
// - Article extraction
// - Selection saving

(function() {
  'use strict';

  // Check if already injected
  if (window.__READVAULT_INJECTED__) return;
  window.__READVAULT_INJECTED__ = true;

  console.log('[ReadVault] Content script loaded');

  // Listen for messages from background/popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'GET_PAGE_INFO':
        sendResponse({
          url: window.location.href,
          title: document.title,
          description: getMetaDescription(),
          content: extractMainContent()
        });
        break;

      case 'GET_SELECTION':
        sendResponse({
          selection: window.getSelection().toString()
        });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }

    return true; // Async response
  });

  /**
   * Get page meta description.
   */
  function getMetaDescription() {
    const meta = document.querySelector('meta[name="description"]') ||
                 document.querySelector('meta[property="og:description"]');
    return meta ? meta.getAttribute('content') : '';
  }

  /**
   * Extract main content (basic implementation).
   * Could be enhanced with Readability or similar.
   */
  function extractMainContent() {
    // Try common article selectors
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.length > 200) {
        return el.textContent.substring(0, 500).trim();
      }
    }

    // Fallback to body
    return document.body.textContent.substring(0, 500).trim();
  }
})();
