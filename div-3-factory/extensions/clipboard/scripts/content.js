// ============================================================
// CONTENT SCRIPT — ClipBoard
// Runs in the context of web pages (isolated world).
// Handles text selection capture, page capture, marquee selection.
// ============================================================

const DEBUG = false;

// Listen for messages from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {
    case 'GET_SELECTION':
      const selectedText = window.getSelection().toString().trim();
      sendResponse({
        success: true,
        payload: {
          text: selectedText,
          url: window.location.href,
          title: document.title
        }
      });
      break;

    case 'GET_PAGE_CONTENT':
      sendResponse({
        success: true,
        payload: {
          text: document.body?.innerText || '',
          url: window.location.href,
          title: document.title
        }
      });
      break;

    case 'PING':
      sendResponse({ success: true, from: 'content' });
      break;

    default:
      return false;
  }

  return true;
});
