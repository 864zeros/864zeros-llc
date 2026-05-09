// ============================================================
// CAPTURE TYPE SCAFFOLD
// Template for adding new content capture methods.
// Examples: text selection, full page, screenshot, marquee, etc.
// ============================================================
//
// USAGE:
// 1. Copy relevant sections to your files
// 2. Replace all [PLACEHOLDERS] with actual values
// 3. Delete these instruction comments
//
// ============================================================


// ============================================================
// STEP 1: Add to lib/constants.js
// ============================================================

// Add to MESSAGE_TYPES:
export const MESSAGE_TYPES = {
  // ... existing ...
  CAPTURE_[TYPE]: 'CAPTURE_[TYPE]',
};

// Add to FEATURE_TIERS (if gated):
export const FEATURE_TIERS = {
  // ... existing ...
  '[capture-type]-capture': '[tier]', // free | starter | pro | power
};


// ============================================================
// STEP 2: Capture Menu Option (sidepanel/main.js)
// ============================================================

// Add to capture menu HTML:
function showCaptureMenu() {
  const menu = document.createElement('div');
  menu.className = 'capture-menu';
  menu.innerHTML = `
    <div class="capture-menu__overlay"></div>
    <div class="capture-menu__content">
      <div class="capture-menu__header">
        <h3>Capture</h3>
        <button class="capture-menu__close" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="capture-menu__options">
        <!-- Existing options... -->

        <!-- NEW CAPTURE TYPE -->
        <button class="capture-menu__option" data-capture="[type]">
          <div class="capture-menu__option-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <!-- Your icon SVG path -->
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
          </div>
          <div class="capture-menu__option-info">
            <span class="capture-menu__option-name">[Capture Type Name]</span>
            <span class="capture-menu__option-desc">[Description of what it captures]</span>
          </div>
          ${/* Tier badge if gated */ ''}
          <span class="capture-menu__tier-badge">[Tier]</span>
        </button>
      </div>
    </div>
  `;

  // Handle capture type selection
  menu.querySelectorAll('.capture-menu__option').forEach(option => {
    option.addEventListener('click', () => {
      const captureType = option.dataset.capture;
      menu.remove();
      handleCapture(captureType);
    });
  });
}

// Add to handleCapture function:
async function handleCapture(type) {
  switch (type) {
    // ... existing cases ...

    case '[type]':
      await capture[Type]();
      break;
  }
}


// ============================================================
// STEP 3A: Simple Capture (no content script needed)
// ============================================================

// For captures that don't need page interaction (e.g., screenshot)
async function capture[Type]() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.CAPTURE_[TYPE],
      payload: {
        // Any additional data needed
      }
    });

    if (response.success) {
      showToast('[Type] captured!');
      loadClips();
    } else if (response.error === 'tier_required') {
      showUpgradePrompt('[capture-type]-capture', response.requiredTier);
    } else {
      showToast(response.error || 'Capture failed', 'error');
    }
  } catch (error) {
    console.error('Capture error:', error);
    showToast('Capture failed', 'error');
  }
}


// ============================================================
// STEP 3B: Interactive Capture (content script needed)
// ============================================================

// For captures that need page interaction (e.g., marquee selection)
async function capture[Type]() {
  try {
    // First check tier access
    const accessResponse = await chrome.runtime.sendMessage({
      type: 'CHECK_FEATURE_ACCESS',
      payload: { feature: '[capture-type]-capture' }
    });

    if (!accessResponse.hasAccess) {
      showUpgradePrompt('[capture-type]-capture', accessResponse.requiredTier);
      return;
    }

    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject content script to handle selection
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: inject[Type]Selector,
    });

  } catch (error) {
    console.error('Capture error:', error);
    showToast('Capture failed', 'error');
  }
}

// Content script function (runs in page context)
function inject[Type]Selector() {
  // Prevent multiple injections
  if (document.querySelector('.[type]-selector-overlay')) return;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = '[type]-selector-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    cursor: crosshair;
    z-index: 999999;
  `;

  // Create instruction banner
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a1a2e;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    z-index: 1000000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  banner.textContent = '[Instructions for user - e.g., "Click and drag to select area"]';

  document.body.appendChild(overlay);
  document.body.appendChild(banner);

  // State for selection
  let startX, startY;
  let selectionBox = null;

  // Mouse handlers
  overlay.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    startY = e.clientY;

    selectionBox = document.createElement('div');
    selectionBox.style.cssText = `
      position: fixed;
      border: 2px dashed #4ade80;
      background: rgba(74, 222, 128, 0.1);
      pointer-events: none;
      z-index: 1000000;
    `;
    document.body.appendChild(selectionBox);
  });

  overlay.addEventListener('mousemove', (e) => {
    if (!selectionBox) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  });

  overlay.addEventListener('mouseup', (e) => {
    if (!selectionBox) return;

    const rect = {
      x: parseInt(selectionBox.style.left),
      y: parseInt(selectionBox.style.top),
      width: parseInt(selectionBox.style.width),
      height: parseInt(selectionBox.style.height)
    };

    // Clean up UI
    overlay.remove();
    banner.remove();
    selectionBox.remove();

    // Send selection to extension
    if (rect.width > 10 && rect.height > 10) {
      chrome.runtime.sendMessage({
        type: '[TYPE]_SELECTION_COMPLETE',
        payload: { rect }
      });
    }
  });

  // Cancel on Escape
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      banner.remove();
      if (selectionBox) selectionBox.remove();
      document.removeEventListener('keydown', escHandler);
    }
  });
}


// ============================================================
// STEP 4: Service Worker Handler (background/service-worker.js)
// ============================================================

// Add case to message handler:
case MESSAGE_TYPES.CAPTURE_[TYPE]:
  return handleCapture[Type](payload, sender);

// For interactive captures, also handle the completion message:
case '[TYPE]_SELECTION_COMPLETE':
  return handle[Type]Complete(payload, sender);

// Simple capture handler:
async function handleCapture[Type](payload, sender) {
  log('handleCapture[Type] called');

  try {
    // 1. Check tier access (if gated)
    const hasAccess = await getFeatureAccess('[capture-type]-capture');
    if (!hasAccess) {
      return { success: false, error: 'tier_required', requiredTier: '[tier]' };
    }

    // 2. Capture the content
    // Example for screenshot:
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });

    // 3. Get page info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 4. Create clip object
    const clip = {
      id: crypto.randomUUID(),
      clipType: '[type]',
      content: dataUrl, // or text content
      title: tab.title || 'Untitled',
      sourceUrl: tab.url,
      sourceDomain: new URL(tab.url).hostname,
      createdAt: new Date().toISOString(),
      starred: false,
      tags: []
    };

    // 5. Save to database
    await put('clips', clip);

    // 6. Notify sidepanel
    chrome.runtime.sendMessage({
      type: 'CLIP_ADDED',
      payload: clip
    }).catch(() => {});

    return { success: true, clip };

  } catch (error) {
    log('Capture[Type] error:', error);
    return { success: false, error: error.message };
  }
}

// Interactive capture completion handler:
async function handle[Type]Complete(payload, sender) {
  log('handle[Type]Complete called with:', payload);

  try {
    // 1. Capture full screenshot first
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });

    // 2. Crop to selection (if applicable)
    const croppedDataUrl = await cropImage(dataUrl, payload.rect);

    // 3. Get page info
    const tab = await chrome.tabs.get(sender.tab.id);

    // 4. Create clip
    const clip = {
      id: crypto.randomUUID(),
      clipType: '[type]',
      content: croppedDataUrl,
      title: tab.title || 'Untitled',
      sourceUrl: tab.url,
      sourceDomain: new URL(tab.url).hostname,
      createdAt: new Date().toISOString(),
      starred: false,
      tags: [],
      // Store original selection rect for reference
      selectionRect: payload.rect
    };

    // 5. Save and notify
    await put('clips', clip);

    chrome.runtime.sendMessage({
      type: 'CLIP_ADDED',
      payload: clip
    }).catch(() => {});

    return { success: true, clip };

  } catch (error) {
    log('[Type]Complete error:', error);
    return { success: false, error: error.message };
  }
}

// Image cropping helper (for service worker with OffscreenCanvas):
async function cropImage(dataUrl, rect) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  const canvas = new OffscreenCanvas(rect.width, rect.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    imageBitmap,
    rect.x, rect.y, rect.width, rect.height,
    0, 0, rect.width, rect.height
  );

  const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(croppedBlob);
  });
}


// ============================================================
// STEP 5: Render Clip Card (sidepanel/main.js)
// ============================================================

// Add to renderClipCard function:
function renderClipCard(clip) {
  // Check clip type and render accordingly
  if (clip.clipType === '[type]') {
    return render[Type]Card(clip);
  }
  // ... other types ...
}

function render[Type]Card(clip) {
  const card = document.createElement('div');
  card.className = 'clip-card clip-card--[type]';
  card.dataset.clipId = clip.id;

  // For image-based captures:
  const isImage = clip.content.startsWith('data:image');

  card.innerHTML = `
    <div class="clip-card__header">
      <div class="clip-card__meta">
        <span class="clip-card__type-badge clip-card__type-badge--[type]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <!-- Type icon -->
          </svg>
          [Type]
        </span>
        <span class="clip-card__date">${formatDate(clip.createdAt)}</span>
      </div>
      <div class="clip-card__actions">
        <button class="clip-card__action clip-card__star ${clip.starred ? 'clip-card__star--active' : ''}"
                data-clip-id="${clip.id}" title="Star">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${clip.starred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
        <button class="clip-card__action clip-card__delete" data-clip-id="${clip.id}" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>

    ${isImage ? `
      <div class="clip-card__image-container">
        <img src="${clip.content}" alt="Captured [type]" class="clip-card__image" loading="lazy">
      </div>
    ` : `
      <div class="clip-card__content">
        ${escapeHtml(clip.content.substring(0, 300))}${clip.content.length > 300 ? '...' : ''}
      </div>
    `}

    <div class="clip-card__footer">
      <a href="${clip.sourceUrl}" class="clip-card__source" target="_blank" rel="noopener">
        <img src="https://www.google.com/s2/favicons?domain=${clip.sourceDomain}&sz=16"
             alt="" class="clip-card__favicon">
        ${clip.sourceDomain}
      </a>
    </div>
  `;

  return card;
}


// ============================================================
// STEP 6: Styles (sidepanel/styles.css)
// ============================================================

/*
.clip-card--[type] {
  // Type-specific card styles
}

.clip-card__type-badge--[type] {
  background-color: var(--oia-[color]-light);
  color: var(--oia-[color]);
}

.clip-card__image-container {
  margin: 12px 0;
  border-radius: var(--oia-radius-sm);
  overflow: hidden;
  background-color: var(--oia-bg-secondary);
}

.clip-card__image {
  width: 100%;
  height: auto;
  display: block;
}

// Selection overlay styles (for interactive captures)
.[type]-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  cursor: crosshair;
  z-index: 999999;
}
*/


// ============================================================
// TESTING CHECKLIST
// ============================================================
//
// [ ] Capture menu shows new option
// [ ] Tier badge displays correctly (if gated)
// [ ] Capture works on various page types
// [ ] Clip saves to IndexedDB
// [ ] Clip appears in sidepanel list
// [ ] Card renders correctly for this type
// [ ] Source URL and domain display correctly
// [ ] Star/delete actions work
// [ ] Search includes this clip type
// [ ] Export includes this clip type
// [ ] Import restores this clip type correctly
//
// For interactive captures:
// [ ] Overlay appears over page
// [ ] Selection UI is visible and responsive
// [ ] Escape key cancels selection
// [ ] Selection completes and saves correctly
//
