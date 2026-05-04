// ============================================================
// DEVTOOLS — Panel Creator
// Creates the "Who Is Watching" panel in Chrome DevTools.
// This runs in the DevTools context, not the page context.
// ============================================================

chrome.devtools.panels.create(
  'Who Is Watching',
  '../icons/icon16.png',
  'panel.html',
  (panel) => {
    console.log('[who-is-watching] DevTools panel created');
  }
);
