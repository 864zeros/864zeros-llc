// ============================================================
// CONTENT SCRIPT — TabVault
// Runs in isolated world on web pages
// Handles scroll position capture and restoration
// ============================================================

// Listen for scroll position requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TABVAULT_GET_SCROLL') {
    sendResponse({
      scrollX: window.scrollX || window.pageXOffset || 0,
      scrollY: window.scrollY || window.pageYOffset || 0
    });
    return false; // Synchronous response
  }

  if (message.type === 'TABVAULT_RESTORE_SCROLL') {
    const { scrollX = 0, scrollY = 0 } = message;

    // Use smooth scrolling for better UX
    window.scrollTo({
      top: scrollY,
      left: scrollX,
      behavior: 'smooth'
    });

    sendResponse({ success: true });
    return false; // Synchronous response
  }

  return false;
});

// Log injection for debugging (can be removed in production)
console.log('[TabVault] Content script loaded.');
