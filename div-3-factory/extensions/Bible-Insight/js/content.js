/**
 * content.js — Bible Insight Content Script
 *
 * Injected into web pages to:
 * - Handle area selection for screenshot capture
 * - Detect Bible verse references (future)
 * - Provide verse tooltips (future)
 *
 * Content scripts run in an isolated world — they share the DOM with the
 * host page but NOT the JavaScript environment.
 */

// ============================================================
// MESSAGE LISTENER
// ============================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {
    case 'INITIATE_AREA_SELECTION':
      initiateAreaSelection();
      sendResponse({ success: true });
      break;

    case 'GET_PAGE_CONTENT':
      const content = getPageContent();
      sendResponse({ success: true, content });
      break;

    case 'GET_SELECTION':
      const selection = window.getSelection().toString();
      sendResponse({ success: true, selection });
      break;

    case 'HIGHLIGHT_VERSES':
      highlightVersesOnPage();
      sendResponse({ success: true });
      break;

    case 'EXTRACT_YOUTUBE_TRANSCRIPT':
      extractYouTubeTranscript()
        .then(transcript => sendResponse({ success: true, transcript }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Async response

    case 'CHECK_YOUTUBE_VIDEO':
      const videoId = getYouTubeVideoId();
      sendResponse({
        success: true,
        isYouTube: isYouTubePage(),
        videoId: videoId,
        title: videoId ? getYouTubeVideoTitle() : null
      });
      break;

    // ========== SCROLL POSITION CAPTURE & RESTORATION ==========
    // TODO: Scroll restoration not working reliably - revisit later
    // case 'BI_GET_SCROLL':
    //   sendResponse({
    //     success: true,
    //     scrollX: window.scrollX || window.pageXOffset || 0,
    //     scrollY: window.scrollY || window.pageYOffset || 0,
    //     scrollHeight: document.documentElement.scrollHeight
    //   });
    //   break;

    // case 'BI_RESTORE_SCROLL':
    //   const { scrollY = 0, scrollPercent = 0 } = payload || {};
    //   const targetY = scrollY > 0
    //     ? scrollY
    //     : document.documentElement.scrollHeight * scrollPercent;
    //   window.scrollTo({
    //     top: targetY,
    //     left: 0,
    //     behavior: 'smooth'
    //   });
    //   sendResponse({ success: true, scrolledTo: targetY });
    //   break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true; // Keep channel open for async
});

// ============================================================
// AREA SELECTION
// ============================================================

function initiateAreaSelection() {
  // Remove any existing overlay
  removeAreaOverlay();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'bible-insight-overlay';
  overlay.className = 'bible-insight-overlay';

  const selectionBox = document.createElement('div');
  selectionBox.id = 'bible-insight-selection';
  selectionBox.className = 'bible-insight-selection-box';
  selectionBox.style.display = 'none';

  const infoBox = document.createElement('div');
  infoBox.id = 'bible-insight-info';
  infoBox.className = 'bible-insight-selection-info';
  infoBox.style.display = 'none';
  infoBox.textContent = 'Click and drag to select area';

  document.body.appendChild(overlay);
  document.body.appendChild(selectionBox);
  document.body.appendChild(infoBox);

  let startX, startY, isSelecting = false;

  // Show info initially
  infoBox.style.display = 'block';
  infoBox.style.left = '50%';
  infoBox.style.top = '50%';
  infoBox.style.transform = 'translate(-50%, -50%)';

  overlay.addEventListener('mousedown', (e) => {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;

    selectionBox.style.display = 'block';
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0';
    selectionBox.style.height = '0';

    infoBox.style.display = 'none';
  });

  overlay.addEventListener('mousemove', (e) => {
    if (!isSelecting) {
      // Update info position
      infoBox.style.left = (e.clientX + 10) + 'px';
      infoBox.style.top = (e.clientY + 10) + 'px';
      infoBox.style.transform = 'none';
      return;
    }

    const width = e.clientX - startX;
    const height = e.clientY - startY;

    selectionBox.style.left = (width < 0 ? e.clientX : startX) + 'px';
    selectionBox.style.top = (height < 0 ? e.clientY : startY) + 'px';
    selectionBox.style.width = Math.abs(width) + 'px';
    selectionBox.style.height = Math.abs(height) + 'px';

    // Update info with dimensions
    infoBox.style.display = 'block';
    infoBox.style.left = (e.clientX + 10) + 'px';
    infoBox.style.top = (e.clientY + 10) + 'px';
    infoBox.style.transform = 'none';
    infoBox.textContent = `${Math.abs(width)} × ${Math.abs(height)} px`;
  });

  overlay.addEventListener('mouseup', (e) => {
    if (!isSelecting) return;
    isSelecting = false;

    const rect = {
      x: parseInt(selectionBox.style.left),
      y: parseInt(selectionBox.style.top),
      width: parseInt(selectionBox.style.width),
      height: parseInt(selectionBox.style.height),
      devicePixelRatio: window.devicePixelRatio || 1
    };

    // Clean up
    removeAreaOverlay();

    // Send selection back to background if valid
    if (rect.width > 10 && rect.height > 10) {
      chrome.runtime.sendMessage({
        type: 'CAPTURE_AREA',
        payload: { rect }
      });
    }
  });

  // ESC to cancel
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      removeAreaOverlay();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function removeAreaOverlay() {
  const overlay = document.getElementById('bible-insight-overlay');
  const selection = document.getElementById('bible-insight-selection');
  const info = document.getElementById('bible-insight-info');

  if (overlay) overlay.remove();
  if (selection) selection.remove();
  if (info) info.remove();
}

// ============================================================
// PAGE CONTENT EXTRACTION
// ============================================================

function getPageContent() {
  return {
    title: document.title,
    url: window.location.href,
    content: document.body.innerText,
    htmlContent: document.body.innerHTML,
    meta: extractMetadata()
  };
}

function extractMetadata() {
  const meta = {
    description: '',
    author: '',
    publishDate: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: ''
  };

  // Standard meta tags
  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) meta.description = descEl.content;

  const authorEl = document.querySelector('meta[name="author"]');
  if (authorEl) meta.author = authorEl.content;

  // OpenGraph
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) meta.ogTitle = ogTitle.content;

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) meta.ogDescription = ogDesc.content;

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) meta.ogImage = ogImage.content;

  // Schema.org datePublished
  const schemaEl = document.querySelector('script[type="application/ld+json"]');
  if (schemaEl) {
    try {
      const schema = JSON.parse(schemaEl.textContent);
      if (schema.datePublished) meta.publishDate = schema.datePublished;
    } catch (e) {
      // Ignore parse errors
    }
  }

  return meta;
}

// ============================================================
// VERSE HIGHLIGHTING (Future Feature)
// ============================================================

function highlightVersesOnPage() {
  // This will be implemented in Phase 2
  // Uses verse-detector.js to find references and wrap them in spans
  console.log('[content] Verse highlighting not yet implemented');
}

// ============================================================
// YOUTUBE DETECTION & TRANSCRIPT (TR-06)
// ============================================================

function isYouTubePage() {
  return window.location.hostname.includes('youtube.com');
}

function getYouTubeVideoId() {
  if (!isYouTubePage()) return null;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

function getYouTubeVideoTitle() {
  // Try multiple selectors for video title
  const titleEl = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string') ||
                  document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
                  document.querySelector('#title h1') ||
                  document.querySelector('meta[name="title"]');

  if (titleEl) {
    return titleEl.textContent || titleEl.content || '';
  }
  return document.title.replace(' - YouTube', '').trim();
}

/**
 * Extract transcript/captions from the current YouTube video.
 * This parses YouTube's player response to find caption tracks.
 */
async function extractYouTubeTranscript() {
  const videoId = getYouTubeVideoId();
  if (!videoId) {
    throw new Error('Not on a YouTube video page');
  }

  try {
    // Method 1: Try to get captions from the page's player response
    const scripts = document.querySelectorAll('script');
    let playerResponse = null;

    for (const script of scripts) {
      const text = script.textContent || '';
      if (text.includes('ytInitialPlayerResponse')) {
        // Try multiple regex patterns (YouTube changes format occasionally)
        let match = text.match(/ytInitialPlayerResponse\s*=\s*({.+?});[\s]*(?:var|const|let|<\/script>)/s);
        if (!match) {
          match = text.match(/ytInitialPlayerResponse\s*=\s*({.+});/s);
        }
        if (match) {
          try {
            playerResponse = JSON.parse(match[1]);
            break;
          } catch (parseError) {
            console.warn('[content] Failed to parse player response:', parseError);
          }
        }
      }
    }

    if (!playerResponse) {
      throw new Error('Could not find video data. Try refreshing the page.');
    }

    // Find caption tracks
    const captions = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captions || captions.length === 0) {
      throw new Error('No captions available for this video. The video may not have subtitles.');
    }

    // Prefer English captions, fall back to first available
    let captionTrack = captions.find(c => c.languageCode === 'en') ||
                       captions.find(c => c.languageCode?.startsWith('en')) ||
                       captions[0];
    const captionUrl = captionTrack.baseUrl;

    console.log('[content] Found caption track:', captionTrack.languageCode, captionUrl?.substring(0, 100));

    // Try JSON3 format first, fall back to XML
    let segments = [];

    try {
      segments = await fetchCaptionsJson3(captionUrl);
    } catch (jsonError) {
      console.warn('[content] JSON3 format failed, trying XML:', jsonError.message);
      segments = await fetchCaptionsXml(captionUrl);
    }

    if (segments.length === 0) {
      throw new Error('Could not parse caption data');
    }

    return {
      videoId,
      title: getYouTubeVideoTitle(),
      language: captionTrack.languageCode,
      segments,
      fullText: segments.map(s => s.text).join(' ')
    };
  } catch (error) {
    console.error('[content] Transcript extraction error:', error);
    throw error;
  }
}

/**
 * Fetch captions in JSON3 format
 */
async function fetchCaptionsJson3(baseUrl) {
  const response = await fetch(baseUrl + '&fmt=json3');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();
  if (!text || text.trim().length === 0) {
    throw new Error('Empty response');
  }

  let captionData;
  try {
    captionData = JSON.parse(text);
  } catch (e) {
    console.error('[content] JSON parse failed. Response preview:', text.substring(0, 200));
    throw new Error('Invalid JSON');
  }

  const segments = [];
  if (captionData.events) {
    for (const event of captionData.events) {
      if (event.segs) {
        const segText = event.segs.map(s => s.utf8 || '').join('').trim();
        if (segText) {
          const startMs = event.tStartMs || 0;
          const durationMs = event.dDurationMs || 0;
          segments.push({
            text: segText,
            startTime: startMs / 1000,
            endTime: (startMs + durationMs) / 1000,
            timestamp: formatTimestamp(startMs / 1000)
          });
        }
      }
    }
  }

  return segments;
}

/**
 * Fetch captions in XML format (fallback)
 */
async function fetchCaptionsXml(baseUrl) {
  const response = await fetch(baseUrl); // Default is XML
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();
  if (!text || text.trim().length === 0) {
    throw new Error('Empty response');
  }

  // Parse XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');
  const textElements = xmlDoc.querySelectorAll('text');

  const segments = [];
  for (const el of textElements) {
    const segText = el.textContent?.trim();
    if (segText) {
      const start = parseFloat(el.getAttribute('start') || '0');
      const dur = parseFloat(el.getAttribute('dur') || '0');
      segments.push({
        text: decodeHtmlEntities(segText),
        startTime: start,
        endTime: start + dur,
        timestamp: formatTimestamp(start)
      });
    }
  }

  return segments;
}

/**
 * Decode HTML entities in caption text
 */
function decodeHtmlEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================
// INITIALIZATION
// ============================================================

// Log that content script is loaded
console.log('[content] Bible Insight content script loaded.');

// Check if this is a YouTube page and notify background
if (isYouTubePage()) {
  const videoId = getYouTubeVideoId();
  if (videoId) {
    console.log('[content] YouTube video detected:', videoId);
    // Notify background to show Sermon Mode button
    chrome.runtime.sendMessage({
      type: 'YOUTUBE_VIDEO_DETECTED',
      payload: { videoId, title: getYouTubeVideoTitle() }
    }).catch(() => {
      // Extension context may not be ready, ignore
    });
  }
}
