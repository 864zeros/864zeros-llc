# Phase 4 — Polish

**Goal:** Production-quality finish. Animations, edge case handling, error boundaries, performance, and final QA before Chrome Web Store submission.

**Time estimate:** 30-60 minutes  
**Prerequisite:** All Phase 3 features pass their checkpoints.

---

## Steps

### 4.1 Animations & Transitions

Apply OIA motion system to all interactive elements:

| Action | Animation | OIA Class / CSS |
|--------|-----------|----------------|
| Card appears (list loads) | Fade in + slide up 8px | `.oia-animate-slide-up` |
| Card removed | Fade out + slide down | `.oia-animate-slide-down` |
| Button press | Scale to 0.97 | Already in `.oia-btn` |
| Toast appears | Slide up from bottom | Already in `.oia-toast` |
| Toast dismisses | Fade out | `.oia-toast--dismiss` |
| View switch | Fade transition | Add to `.panel-view` |
| Checkbox complete | Fill + checkmark | Already in `.oia-checkbox` |
| Spinner | Continuous rotation | Already in `.oia-spinner` |

**Add view transition:**

```css
.panel-view {
  display: none;
  opacity: 0;
}

.panel-view.active {
  display: block;
  animation: oia-fade-in var(--oia-duration-normal) var(--oia-ease-enter) forwards;
}
```

**Stagger list items on load:**

```javascript
function renderList(items, container) {
  container.innerHTML = '';
  items.forEach((item, i) => {
    const el = createCard(item);
    el.style.animationDelay = `${i * 50}ms`;
    el.classList.add('oia-animate-slide-up');
    container.appendChild(el);
  });
}
```

---

### 4.2 Error Boundaries

Every async operation needs a try/catch with user-visible feedback:

```javascript
async function safeAction(action, errorMessage = 'Something went wrong') {
  try {
    return await action();
  } catch (error) {
    console.error(`[${APP_SLUG}]`, error);
    showToast(errorMessage, 'error');
    return null;
  }
}

// Usage
await safeAction(
  () => analyze(content, 'Summarize this'),
  'Could not reach AI — try again?'
);
```

**Error copy rules (from OIA design system):**
- Never: "Error", "Failed", "Invalid"
- Use: "Something went wrong", "That didn't work — try again?", "Let's try that again"
- Always offer a retry path or dismiss option

### 4.2.1 Copy Audit

Before declaring polish complete, audit ALL user-facing strings:

```bash
# Find OIA copy violations in JS files
grep -rn "Failed\|Error:\|Invalid\|error'" --include="*.js" | grep -v "test\|node_modules\|\.error\|error\."

# Common violations to find and fix:
# - "Failed to save" → "Couldn't save — try again?"
# - "Error loading" → "Couldn't load — try refreshing"
# - "Invalid input" → "Let's try that again"
```

**Checklist:**
- [ ] No "Failed to..." messages
- [ ] No "Error:" prefixes in user-facing text
- [ ] No "Invalid" in form validation
- [ ] All error toasts offer retry or dismiss
- [ ] Empty states use inviting language

---

### 4.3 Edge Cases

Test and handle these scenarios:

| Scenario | Expected behavior |
|----------|-------------------|
| Panel opened with no data | Empty state displays (built in Phase 2) |
| Panel opened offline | Features that need network show "Offline — your data is still safe" message. Local features work normally. |
| Content script on restricted page (`chrome://`, `chrome-extension://`) | Content script silently skips. No errors. |
| Very long content captured | Truncate display with "Show more" toggle. Store full content in IndexedDB. |
| Rapid button clicks | Debounce all action buttons (300ms). Disable button during async operations. |
| Service worker restarts mid-operation | All state is in IndexedDB/storage. Panel re-reads on visibility change. |
| User downgrades tier (future edge case) | Features gate on current tier. Previously created content stays accessible. |
| IndexedDB storage full (rare, ~500MB) | Catch QuotaExceededError. Show: "Storage is full — export and clear some data to make room." |

**Debounce pattern:**

```javascript
function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Apply to buttons
captureBtn.addEventListener('click', debounce(handleCapture));
```

**Disable during async:**

```javascript
async function handleWithButton(btn, action) {
  btn.disabled = true;
  btn.textContent = 'Working...';
  try {
    await action();
  } finally {
    btn.disabled = false;
    btn.textContent = btn.dataset.label; // Restore original label
  }
}
```

---

### 4.3.1 MV3 Service Worker Gotchas

Service workers run in a different context than content scripts or popups. These DOM/browser APIs **do not exist** in service workers:

| API | Issue | Solution |
|-----|-------|----------|
| `URL.createObjectURL()` | DOM API, not available | Use data URLs: `data:application/pdf;base64,${base64}` |
| `URL.revokeObjectURL()` | DOM API, not available | Not needed with data URLs |
| `document`, `window` | No DOM in service worker | Use message passing to content scripts |
| `localStorage` | Not available | Use `chrome.storage.local` |
| `XMLHttpRequest` | Deprecated in SW | Use `fetch()` |
| `Blob` constructor | Works, but can't create URLs | Use data URLs for downloads |
| `Image`, `Canvas` | No DOM | Use OffscreenCanvas (limited) or content script |

**Common patterns that fail:**

```javascript
// ❌ FAILS in service worker
const blob = new Blob([data], { type: 'application/pdf' });
const url = URL.createObjectURL(blob); // TypeError!
chrome.downloads.download({ url });

// ✅ WORKS in service worker
const dataUrl = `data:application/pdf;base64,${base64Data}`;
chrome.downloads.download({ url: dataUrl, filename: 'file.pdf' });
```

**Checklist:**
- [ ] No `URL.createObjectURL()` in service worker
- [ ] No direct DOM access in service worker
- [ ] All storage uses `chrome.storage`, not `localStorage`
- [ ] Image processing delegated to content script or offscreen document

---

### 4.4 Performance

| Check | Standard |
|-------|----------|
| Panel open to first paint | < 200ms |
| Panel open to content loaded | < 1s for up to 100 items |
| AI analysis round trip | Show spinner immediately, result within provider latency |
| IndexedDB reads | < 50ms for standard queries |
| Skeleton → real content swap | No layout shift (skeleton matches content dimensions) |

**If panel is slow to open:**
- Defer non-visible view rendering
- Paginate long lists (show 20, "Load more" button)
- Use skeleton loaders for all async content

---

### 4.5 Accessibility Final Pass

- [ ] All buttons have accessible labels (text content or `aria-label`)
- [ ] All images/icons have `alt` text or `aria-hidden="true"` (decorative)
- [ ] Tab order is logical (header → content → nav)
- [ ] Focus is visible on keyboard navigation (`:focus-visible` from OIA CSS)
- [ ] Toast messages have `role="status"` for screen reader announcement
- [ ] Color is never the only indicator (badges have text + dot, not just color)
- [ ] `prefers-reduced-motion` is respected (OIA CSS handles this automatically)

---

### 4.6 Monetization Integration

- [ ] Free tier limits enforced (e.g., AI calls per day)
- [ ] Upgrade prompts use OIA components and friendly copy
- [ ] Options page "Your Plan" section shows current tier
- [ ] Upgrade button triggers Stripe/ExtensionPay checkout
- [ ] "Fuel the Build" coffee button linked to Stripe payment link
- [ ] Post-purchase: tier updates immediately in chrome.storage, features unlock without restart
- [ ] "No ads. No tracking. Your data stays yours." visible in options page footer

---

### 4.7 Chrome Web Store Readiness

- [ ] All placeholder icons replaced with real brand icons (16, 48, 128 PNG)
- [ ] `_locales/en/messages.json` has final copy
- [ ] Description is under 132 characters
- [ ] No `console.log` statements left in production code (or gated behind debug flag)
- [ ] No unused permissions in manifest
- [ ] `content_scripts.matches` is narrowed if possible (not `<all_urls>` unless needed)
- [ ] Test on Chrome stable (not just Canary or Beta)
- [ ] Test fresh install (uninstall → reinstall → verify onInstalled flow)
- [ ] Test update path (change version → reload → verify no data loss)

---

## Final Checkpoint

```
CHECKPOINT: Phase 4 — Polish
VERIFY:
  1. All animations play correctly (card appear, toast, view switch)
  2. All error states show friendly messages with retry options
  3. Copy audit passed — no "Failed", "Error", "Invalid" in UI
  4. MV3 gotchas checked — no DOM APIs in service worker
  5. Offline mode degrades gracefully
  6. Rapid clicks are debounced, buttons disable during async
  7. Dark mode is flawless across all views and states
  8. Accessibility: keyboard nav, focus states, screen reader labels
  9. Tier gating works end-to-end including upgrade flow
  10. Options page complete: settings, plan, data export, fuel button
  11. No console errors in any context
  12. Performance: panel opens in <200ms, content loads in <1s
  13. Real icons in place (not placeholders)
  14. Fresh install test passes
  15. No unused permissions in manifest
STATUS: [ready for Phase 5 — Proof / blocked on ___]
```

**Do not declare production-ready until Phase 5 (Proof) passes.**
