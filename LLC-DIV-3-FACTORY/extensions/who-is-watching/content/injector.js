// ============================================================
// INJECTOR — Content Script
// Injects hook.js into page context to intercept globals.
// Runs at document_idle to ensure page has started loading.
// ============================================================

(function() {
  'use strict';

  // Inject the hook script into the page context
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected/hook.js');
  script.onload = function() {
    this.remove();
  };
  script.onerror = function() {
    console.error('[who-is-watching] Failed to inject hook.js');
    this.remove();
  };

  (document.head || document.documentElement).appendChild(script);

  console.log('[who-is-watching] Injector initialized');
})();
