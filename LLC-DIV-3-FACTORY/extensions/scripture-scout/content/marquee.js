// content/marquee.js — [FHG] ScriptureScout marquee capture
// 864zeros LLC | Faith / Heritage pillar | v0.1.0
//
// Listens for START_MARQUEE messages from the service worker, then renders
// a Charcoal+Bronze fullscreen overlay where the user drags a rectangle.
// On mouseup:
//   - If on a supported site, captures the *containers* whose bounding box
//     intersects the marquee. Sends container HTML so the markdown-converter
//     can later strip noise selectors and / or build special tables.
//   - Otherwise, falls back to text extraction across intersecting elements.
//
// MV3 content scripts cannot use ES modules. SCOUT_PROFILES below is a
// duplicate of the relevant subset of `scripts/selectors.js` — KEEP IN SYNC.

(function () {
  'use strict';

  // FHG palette (inlined; cannot import design tokens in content script)
  const FHG_CHARCOAL = '#2D2D2D';
  const FHG_BRONZE = '#A67C52';
  const FHG_WARM_WHITE = '#F5F5F5';
  const FHG_ERROR = '#D4847A';

  // Hostname → profile config (mirror of scripts/selectors.js production profiles).
  // KEEP IN SYNC with scripts/selectors.js.
  const SCOUT_PROFILES = {
    'biblegateway.com': {
      name: 'BibleGateway',
      container: '.passage-content',
      unit: { singular: 'passage', plural: 'passages' },
      metadata: () => ({
        reference: document.querySelector('.passage-display-tab')?.innerText.trim(),
        translation: document.querySelector('.translation-name')?.innerText.replace(/[()]/g, '').trim(),
        timestamp: new Date().toISOString(),
      }),
    },
    'blueletterbible.org': {
      name: 'Blue Letter Bible',
      container: '.verse-text',
      unit: { singular: 'verse', plural: 'verses' },
      metadata: () => ({
        reference: document.querySelector('.verse-ref')?.innerText.trim(),
        translation: document.querySelector('.translation-id')?.innerText || 'KJV',
        timestamp: new Date().toISOString(),
      }),
    },
    'biblehub.com': {
      name: 'Bible Hub',
      // Variant-dependent. detect() decides which container/unit to use
      // based on the URL path.
      detect: () => window.location.pathname.includes('/interlinear/') ? 'interlinear' : 'standard',
      variants: {
        interlinear: {
          container: '.interlinear',
          unit: { singular: 'word', plural: 'words' },
        },
        standard: {
          container: '.chap',
          unit: { singular: 'passage', plural: 'passages' },
        },
      },
      metadata: () => ({
        reference: document.querySelector('.chap')?.innerText.trim() || document.title,
        pageVariant: window.location.pathname.includes('/interlinear/') ? 'interlinear' : 'standard',
        timestamp: new Date().toISOString(),
      }),
    },
  };

  function getActiveProfile() {
    const host = window.location.hostname.toLowerCase();
    for (const [profileHost, profile] of Object.entries(SCOUT_PROFILES)) {
      if (host === profileHost || host.endsWith('.' + profileHost)) {
        // Resolve variants if the profile uses them
        if (typeof profile.detect === 'function' && profile.variants) {
          const variantName = profile.detect();
          const variant = profile.variants[variantName] || profile.variants.standard;
          return {
            profileHost,
            name: profile.name,
            container: variant.container,
            unit: variant.unit,
            pageVariant: variantName,
            metadata: profile.metadata,
          };
        }
        return {
          profileHost,
          name: profile.name,
          container: profile.container,
          unit: profile.unit,
          pageVariant: null,
          metadata: profile.metadata,
        };
      }
    }
    return null;
  }

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
    overlay.id = '__scripture_scout_overlay__';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      background: 'rgba(45, 45, 45, 0.42)',  // FHG Charcoal semi-transparent
      cursor: 'crosshair',
      pointerEvents: 'auto',
    });
    overlay.addEventListener('mousedown', onMouseDown);
    overlay.addEventListener('mousemove', onMouseMove);
    overlay.addEventListener('mouseup', onMouseUp);

    const profile = getActiveProfile();

    const banner = document.createElement('div');
    Object.assign(banner.style, {
      position: 'fixed',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: FHG_CHARCOAL,
      color: FHG_BRONZE,
      padding: '8px 16px',
      borderRadius: '6px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      fontWeight: '600',
      letterSpacing: '0.3px',
      zIndex: '2147483647',
      boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
      border: `1px solid ${FHG_BRONZE}`,
      pointerEvents: 'none',
    });
    if (profile) {
      const variantSuffix = profile.pageVariant && profile.pageVariant !== 'standard'
        ? ` · ${profile.pageVariant}` : '';
      banner.textContent = `ScriptureScout (${profile.name}${variantSuffix}) — drag to select ${profile.unit.plural}. Press ESC to cancel.`;
    } else {
      banner.textContent = 'ScriptureScout — drag to select passage. Press ESC to cancel.';
    }
    overlay.appendChild(banner);

    document.body.appendChild(overlay);
    overlay.focus();
    document.addEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') cleanupMarquee();
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
      border: `2px dashed ${FHG_BRONZE}`,
      background: 'rgba(166, 124, 82, 0.10)',
      pointerEvents: 'none',
      zIndex: '2147483647',
      boxShadow: '0 0 0 1px rgba(45, 45, 45, 0.45)',
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
      cleanupMarquee();
      return;
    }

    const profile = getActiveProfile();
    const captured = profile
      ? extractByContainer(rect, profile)
      : extractByGenericIntersection(rect);

    chrome.runtime.sendMessage(
      {
        type: 'CAPTURE_FROM_CONTENT',
        payload: {
          title: captured.title,
          content: captured.content,
          contentFormat: captured.contentFormat || 'text',
          source_url: window.location.href,
          captureMode: 'marquee',
          bounds: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
          profile_host: profile ? profile.profileHost : null,
          page_variant: profile ? profile.pageVariant : null,
          metadata: captured.metadata || null,
          summary: captured.summary || null,
          source_name: profile ? profile.name : null,
        },
      },
      (response) => {
        if (response && response.ok) {
          showSuccessToast('Scout Success', captured.summary || `${response.count} captures total`);
        } else {
          showSuccessToast('Scout Failed', (response && response.error) || 'No passages found', true);
        }
        cleanupMarquee();
      }
    );
  }

  function extractByContainer(rect, profile) {
    const containers = document.querySelectorAll(profile.container);
    const matchingHtml = [];
    let intersected = 0;

    for (const el of containers) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const overlap = !(
        r.right < rect.left ||
        r.left > rect.right ||
        r.bottom < rect.top ||
        r.top > rect.bottom
      );
      if (!overlap) continue;
      matchingHtml.push(el.outerHTML);
      intersected++;
    }

    const meta = profile.metadata ? profile.metadata() : null;
    const title = (meta && meta.reference) || document.title;
    const unit = intersected === 1 ? profile.unit.singular : profile.unit.plural;
    const summary = intersected
      ? `${intersected} ${unit} from ${profile.name}`
      : `No ${profile.unit.plural} found in selection`;

    return {
      title,
      content: matchingHtml.join('\n\n'),
      contentFormat: 'html',
      metadata: meta,
      summary,
    };
  }

  function extractByGenericIntersection(rect) {
    const all = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, span, div');
    const lines = [];
    const seen = new WeakSet();

    for (const el of all) {
      if (seen.has(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const overlap = !(
        r.right < rect.left ||
        r.left > rect.right ||
        r.bottom < rect.top ||
        r.top > rect.bottom
      );
      if (!overlap) continue;
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
      title: document.title,
      content: lines.join('\n\n'),
      contentFormat: 'text',
      metadata: null,
      summary: lines.length ? `${lines.length} text block(s) captured` : 'No text in selection',
    };
  }

  function showSuccessToast(title, body, isError = false) {
    const t = document.createElement('div');
    Object.assign(t.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: FHG_CHARCOAL,
      padding: '10px 16px',
      borderRadius: '6px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      zIndex: '2147483647',
      boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
      border: `1px solid ${isError ? FHG_ERROR : FHG_BRONZE}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      minWidth: '220px',
    });
    const titleEl = document.createElement('strong');
    titleEl.textContent = title;
    titleEl.style.color = isError ? FHG_ERROR : FHG_BRONZE;
    titleEl.style.fontSize = '13px';
    titleEl.style.fontWeight = '700';
    titleEl.style.letterSpacing = '0.3px';
    t.appendChild(titleEl);
    if (body) {
      const bodyEl = document.createElement('span');
      bodyEl.textContent = body;
      bodyEl.style.color = FHG_WARM_WHITE;
      bodyEl.style.fontSize = '12px';
      t.appendChild(bodyEl);
    }
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
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
