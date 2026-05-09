// content/marquee.js — MigrationPilot marquee text capture
// 864zeros LLC | OIA pillar | v0.1.0
//
// Listens for START_MARQUEE messages from the service worker, then renders
// a fullscreen overlay where the user can drag a rectangle. On mouse-up,
// extracts text from elements within the rectangle and sends to the SW.
//
// MV3 content scripts cannot use ES modules. This file is plain script.

(function () {
  'use strict';

  let overlay = null;
  let selectionBox = null;
  let startX = 0;
  let startY = 0;
  let isSelecting = false;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_MARQUEE') {
      try {
        startMarqueeMode();
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
      return true;
    }
    return false;
  });

  function startMarqueeMode() {
    if (overlay) return;
    document.body.style.cursor = 'crosshair';
    overlay = document.createElement('div');
    overlay.id = '__migration_pilot_overlay__';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      background: 'rgba(0, 0, 0, 0.18)',
      cursor: 'crosshair',
      pointerEvents: 'auto',
    });
    overlay.addEventListener('mousedown', onMouseDown);
    overlay.addEventListener('mousemove', onMouseMove);
    overlay.addEventListener('mouseup', onMouseUp);
    overlay.addEventListener('keydown', onKeyDown);

    // Header banner so the user knows what to do
    const banner = document.createElement('div');
    Object.assign(banner.style, {
      position: 'fixed',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#0a0a0f',
      color: '#00d084',
      padding: '8px 16px',
      borderRadius: '6px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      fontWeight: '500',
      zIndex: '2147483647',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      pointerEvents: 'none',
    });
    banner.textContent = 'MigrationPilot — drag to select region. Press ESC to cancel.';
    overlay.appendChild(banner);

    document.body.appendChild(overlay);
    overlay.focus();
    // Allow ESC even if overlay isn't focused
    document.addEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      cleanupMarquee();
    }
  }

  function onMouseDown(e) {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    if (selectionBox) selectionBox.remove();
    selectionBox = document.createElement('div');
    Object.assign(selectionBox.style, {
      position: 'fixed',
      left: startX + 'px',
      top: startY + 'px',
      width: '0',
      height: '0',
      border: '2px solid #00d084',
      background: 'rgba(0, 208, 132, 0.15)',
      pointerEvents: 'none',
      zIndex: '2147483647',
    });
    overlay.appendChild(selectionBox);
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!isSelecting || !selectionBox) return;
    const x = Math.min(e.clientX, startX);
    const y = Math.min(e.clientY, startY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    Object.assign(selectionBox.style, {
      left: x + 'px',
      top: y + 'px',
      width: w + 'px',
      height: h + 'px',
    });
  }

  function onMouseUp(e) {
    if (!isSelecting || !selectionBox) return;
    isSelecting = false;

    const rect = selectionBox.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
      // Too small — treat as click-cancel
      cleanupMarquee();
      return;
    }

    // Extract text from elements within the rectangle
    const captured = extractTextWithinRect(rect);

    // Send to service worker
    chrome.runtime.sendMessage(
      {
        type: 'CAPTURE_FROM_CONTENT',
        payload: {
          title: captured.title,
          content: captured.content,
          source_url: window.location.href,
          captureMode: 'marquee',
          bounds: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        },
      },
      (response) => {
        if (response && response.ok) {
          showToast(`Saved (${response.count} captures total)`);
        } else {
          showToast(`Save failed: ${response && response.error}`);
        }
        cleanupMarquee();
      }
    );
  }

  function extractTextWithinRect(rect) {
    // Find all element nodes whose bounding box intersects the marquee.
    // For each intersecting element, gather its visible text.
    const all = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, span, div');
    const lines = [];
    const seen = new WeakSet();

    for (const el of all) {
      if (seen.has(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // Intersection test
      const overlap = !(
        r.right < rect.left ||
        r.left > rect.right ||
        r.bottom < rect.top ||
        r.top > rect.bottom
      );
      if (!overlap) continue;
      // Skip elements that are descendants of an already-captured ancestor
      // (avoid duplicate text from nested div→p).
      let parent = el.parentElement;
      let skip = false;
      while (parent) {
        if (seen.has(parent)) { skip = true; break; }
        parent = parent.parentElement;
      }
      if (skip) continue;
      seen.add(el);

      const text = (el.innerText || '').trim();
      if (text) lines.push(text);
    }

    return {
      content: lines.join('\n\n'),
      title: document.title,
    };
  }

  function showToast(msg) {
    const t = document.createElement('div');
    Object.assign(t.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#0a0a0f',
      color: '#00d084',
      padding: '10px 18px',
      borderRadius: '6px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      zIndex: '2147483647',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    });
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.remove(); }, 2200);
  }

  function cleanupMarquee() {
    document.removeEventListener('keydown', onKeyDown);
    document.body.style.cursor = '';
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    selectionBox = null;
    isSelecting = false;
  }
})();
