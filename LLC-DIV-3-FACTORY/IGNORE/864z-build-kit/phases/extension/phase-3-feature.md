# Phase 3 — Feature Build

**Goal:** Implement one feature at a time from the app brief's feature list. This phase is repeated for each feature, in priority order.

**Time estimate:** 15-45 minutes per feature (varies by complexity)  
**Prerequisite:** Phase 2 checkpoint passed.

---

## Process

### 3.0 Select the Feature

Read the app brief's **Features** list. Build them in the numbered priority order. For each feature, identify:

- **What it does** (from the brief)
- **Which view it belongs to** (built in Phase 2)
- **Which `/lib/` modules it needs** (db.js, api-client.js, etc)
- **Which tier it requires** (free, starter, pro, power)
- **What user action triggers it** (button click, page load, content script event)

---

### 3.1 Data Model First

Before writing any UI code, define the data model for this feature.

**If the feature stores data:**
- Define the IndexedDB record shape
- Add any new object stores or indexes to the schema in the service worker's `onInstalled`
- Use `lib/db.js` for all CRUD operations

```javascript
// Example record shape (define in a comment block at top of relevant file)
// Record: capture
// {
//   id: string (crypto.randomUUID),
//   contentType: 'text' | 'page' | 'screenshot' | 'selection',
//   content: string | base64,
//   sourceUrl: string,
//   sourceTitle: string,
//   createdAt: ISO string,
//   tags: string[]
// }
```

**If the feature uses AI:**
- Define the prompt template
- Identify what content gets sent (always via `api-client.js` which auto-redacts)
- Define the expected response format

**If the feature is tier-gated:**
- Wrap the trigger with a `tiers.js` check
- Show upgrade prompt if user's tier is too low

---

### 3.2 Service Worker Wiring

If the feature requires background processing or cross-script communication:

1. Add a new message type to `lib/constants.js`:
   ```javascript
   MESSAGE_TYPES.CAPTURE_CONTENT = 'CAPTURE_CONTENT';
   ```

2. Add the handler in `background/service-worker.js`:
   ```javascript
   case 'CAPTURE_CONTENT':
     handleCapture(payload, sendResponse);
     return true;
   ```

3. Implement the handler function:
   ```javascript
   async function handleCapture(payload, sendResponse) {
     try {
       const { put } = await import('../lib/db.js');
       const record = { id: crypto.randomUUID(), ...payload, createdAt: new Date().toISOString() };
       await put('content', record);
       sendResponse({ success: true, id: record.id });
     } catch (error) {
       sendResponse({ success: false, error: error.message });
     }
   }
   ```

---

### 3.3 Content Script Wiring (if needed)

If the feature reads or modifies the host page:

1. Add the DOM interaction logic to `scripts/content.js`
2. Send results to service worker via `chrome.runtime.sendMessage`
3. Never write directly to IndexedDB from the content script — always relay through the service worker

```javascript
// Example: capture selected text
document.addEventListener('mouseup', () => {
  const selection = window.getSelection().toString().trim();
  if (selection.length > 0) {
    chrome.runtime.sendMessage({
      type: 'CAPTURE_CONTENT',
      payload: {
        contentType: 'selection',
        content: selection,
        sourceUrl: location.href,
        sourceTitle: document.title
      }
    });
  }
});
```

---

### 3.4 Panel UI Wiring

Connect the feature to the UI built in Phase 2:

1. Replace the empty state with the feature's actual UI
2. Load existing data from IndexedDB on panel open
3. Listen for storage changes to update reactively
4. Show loading states (`.oia-spinner` or `.oia-skeleton`) during async operations
5. Show success/error feedback (`.oia-toast`)

**Loading pattern:**

```javascript
async function loadContent() {
  // Show skeleton
  container.innerHTML = '<div class="oia-skeleton oia-skeleton--card"></div>'.repeat(3);

  const items = await getAll('content');

  if (items.length === 0) {
    container.innerHTML = `
      <div class="oia-empty">
        <div class="oia-empty__headline">Nothing here yet</div>
        <div class="oia-empty__subtext">Ready when you are.</div>
      </div>`;
    return;
  }

  container.innerHTML = items.map(item => renderCard(item)).join('');
}
```

**Toast pattern:**

```javascript
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `oia-toast oia-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('oia-toast--dismiss');
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}
```

---

### 3.5 Tier Gating (if applicable)

If this feature requires a paid tier:

```javascript
import { requiresTier, openCheckout } from '../lib/tiers.js';

async function handlePaidFeature() {
  if (!await requiresTier('pro')) {
    showUpgradePrompt('pro');
    return;
  }
  // Feature logic here
}

function showUpgradePrompt(tier) {
  // Show a card with the feature benefit and upgrade button
  // Use OIA components — card, body text, primary button
  // Copy: "Unlock [feature] with [tier name]" — never "You need to pay"
}
```

---

### 3.6 Test This Feature

Before moving to the next feature, verify:

- [ ] The feature works end-to-end (trigger → process → display)
- [ ] Data persists in IndexedDB (close and reopen panel — data still there)
- [ ] Error states are handled (network failure, empty input, etc)
- [ ] Loading states display correctly
- [ ] Tier gating works (if applicable) — free user sees upgrade prompt, paid user gets feature
- [ ] Dark mode renders correctly for all new UI elements
- [ ] Content script (if used) works on at least 3 different websites
- [ ] No console errors in any context (panel, service worker, content script)

---

## Checkpoint (per feature)

```
CHECKPOINT: Phase 3 — Feature: [FEATURE_NAME]
VERIFY:
  1. Feature triggers correctly from user action
  2. Data persists across panel close/reopen
  3. Error handling works (test with network off, empty input)
  4. Loading and success feedback displays correctly
  5. Tier gating works if applicable
  6. Dark mode renders correctly
  7. No console errors
FEATURES COMPLETED: [X of Y]
STATUS: [ready for next feature / ready for Phase 4 / blocked on ___]
```

**Repeat Phase 3 for each feature in priority order. Do not start Phase 4 until all features pass.**
