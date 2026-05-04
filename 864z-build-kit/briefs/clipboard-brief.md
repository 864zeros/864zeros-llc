# App Brief — ClipBoard

---

## 1. Identity

| Field | Value |
|-------|-------|
| App Name | ClipBoard |
| App Slug | `clipboard` |
| Description | Capture anything from the web — text, pages, screenshots — organized and private. |
| Brand | `864zeros` |
| Template | `panel` |
| Version | 1.0.0 |

---

## 2. Permissions

| Permission | Reason |
|------------|--------|
| `sidePanel` | Panel extension — primary UI surface |
| `storage` | State persistence, settings, tier info |
| `activeTab` | Access current tab content on user action (not passively) |
| `scripting` | Inject content script for capture operations |
| `contextMenus` | Right-click "Clip to ClipBoard" menu item |
| `offscreen` | Screenshot capture via offscreen document |

**Host permissions:**

```json
"host_permissions": [
  "<all_urls>"
]
```

Required for content script injection on any page. Only activates on explicit user action (click or context menu).

---

## 3. Screens / Views

| View ID | View Name | Purpose | Nav Icon/Label |
|---------|-----------|---------|----------------|
| `clips` | My Clips | Main list of all captured content, sorted newest first | 📋 Clips |
| `tags` | Tags | Browse and manage tags, tap a tag to filter clips | 🏷️ Tags |
| `search` | Search | Full-text search across all clips | 🔍 Search |

**Options page sections:**
- General settings (default capture type, auto-tag preferences)
- AI Settings (provider, model — advanced users only)
- Your Plan (tier display + upgrade)
- Data (export / import / Google Drive sync)
- Fuel the Build

---

## 4. Features (Priority Order)

| # | Feature Name | Description | View | Tier | /lib/ Modules |
|---|-------------|-------------|------|------|---------------|
| 1 | Text Selection Capture | Select text on any page → right-click "Clip to ClipBoard" or click panel FAB → saves selection + source URL + page title + timestamp | clips | free | db, store, constants |
| 2 | Full Page Capture | Capture entire page text content (cleaned, readable) via panel button | clips | free | db, store, constants |
| 3 | Tag Management | Create, rename, delete tags. Assign tags to clips at capture or later. Filter clips by tag. | clips, tags | free | db, store |
| 4 | Search | Full-text search across clip content, source URL, page title, tags | search | free | db |
| 5 | Screenshot Capture | Capture visible tab as PNG screenshot, stored in IndexedDB as base64 | clips | starter | db, store |
| 6 | AI Quick Summary | One-tap summarize any clip (text or page capture) via AI. Summary stored alongside original. | clips | starter | db, api-client, redactor |
| 7 | AI Auto-Tag | AI suggests 2-3 tags for a new clip based on content. User confirms or dismisses. | clips | starter | api-client, redactor |
| 8 | Marquee Selection | Click-drag to select a region of the page, captures that area as screenshot | clips | pro | db, store |
| 9 | AI Vision Analysis | Send a screenshot clip to AI vision model, get a text description/analysis back | clips | pro | api-client, redactor |
| 10 | Bulk Operations | Select multiple clips → bulk tag, bulk delete, bulk export | clips | pro | db |
| 11 | Google Drive Sync | Auto-sync IndexedDB snapshots to user's Google Drive on schedule | options | pro | backup |
| 12 | Export to InsightForge | Push selected clips to InsightForge for synthesis (if installed). Cross-extension messaging. | clips | power | store |

---

## 5. Data Model

### IndexedDB Schema

**Database name:** `clipboard_db`  
**Version:** 1

**Store: `clips`**

```javascript
{
  keyPath: 'id',
  indexes: [
    { name: 'by-created', field: 'createdAt', unique: false },
    { name: 'by-type', field: 'clipType', unique: false },
    { name: 'by-url', field: 'sourceUrl', unique: false },
    { name: 'by-starred', field: 'starred', unique: false }
  ]
}
```

**Record shape:**

```javascript
{
  id: '',                // crypto.randomUUID()
  clipType: '',          // 'selection' | 'page' | 'screenshot' | 'marquee'
  content: '',           // text content or base64 image data
  sourceUrl: '',         // URL of the page it was captured from
  sourceTitle: '',       // document.title of the source page
  summary: '',           // AI-generated summary (null if not generated)
  starred: false,        // boolean — quick-access flag
  createdAt: '',         // ISO string
  updatedAt: ''          // ISO string
}
```

**Store: `tags`**

```javascript
{
  keyPath: 'id',
  indexes: [
    { name: 'by-name', field: 'name', unique: true },
    { name: 'by-color', field: 'color', unique: false }
  ]
}
```

**Record shape:**

```javascript
{
  id: '',                // crypto.randomUUID()
  name: '',              // tag display name
  color: '',             // OIA palette color key (e.g., 'sage', 'coral', 'lavender')
  createdAt: ''          // ISO string
}
```

**Store: `clip_tags`** (junction table)

```javascript
{
  keyPath: 'id',
  indexes: [
    { name: 'by-clip', field: 'clipId', unique: false },
    { name: 'by-tag', field: 'tagId', unique: false }
  ]
}
```

**Record shape:**

```javascript
{
  id: '',                // crypto.randomUUID()
  clipId: '',            // FK → clips.id
  tagId: ''              // FK → tags.id
}
```

---

## 6. AI Integration

| Field | Value |
|-------|-------|
| Default Provider | `gemini` |
| Default Model | `gemini-2.0-flash` |
| PPI Redaction | `required` |
| No-Log API Tier | `required` |

### AI Call Points

| Trigger | Input | Instruction | Expected Output | Tier |
|---------|-------|-------------|-----------------|------|
| "Summarize" button on clip card | Clip text content (redacted) | "Summarize the following content in 2-3 concise sentences. Focus on key facts and actionable information." | 2-3 sentence summary string | starter |
| Auto-tag on new clip | First 500 chars of clip content (redacted) | "Suggest exactly 3 short tags (1-2 words each) for this content. Return only the tags as a JSON array of strings." | `["tag1", "tag2", "tag3"]` | starter |
| Vision analysis on screenshot | Base64 image | "Describe what you see in this screenshot. Identify key text, UI elements, data, or visual content. Be concise." | Text description string | pro |

---

## 7. Content Script Behavior

| Field | Value |
|-------|-------|
| Needed | `yes` |
| Match Pattern | `<all_urls>` (injected via `chrome.scripting.executeScript` on user action, NOT auto-injected) |
| Actions | Capture selected text, capture full page text, marquee selection overlay |
| Injects CSS | `yes` — marquee selection overlay, highlight animation on capture |

**Content script specifics:**

- **Text selection capture:** On context menu click or panel FAB, reads `window.getSelection().toString()`, sends to service worker via `chrome.runtime.sendMessage`.
- **Full page capture:** Extracts readable text from `document.body`, strips scripts/styles/nav, sends cleaned text to service worker.
- **Marquee selection:** Injects transparent overlay, user draws rectangle, captures that region via `chrome.tabs.captureVisibleTab` + crop logic. Pro tier only.
- **Capture feedback:** Brief green border pulse animation on the captured element/area (OIA accent color, 300ms, respects `prefers-reduced-motion`).

---

## 8. Monetization

### Tier Structure

| Tier | Price | What Unlocks |
|------|-------|-------------|
| Free | $0 | Text selection capture, full page capture, tags, search, local storage, export |
| Starter | $1.99 | Screenshots, AI quick summary, AI auto-tag |
| Pro | $3.99 | Marquee selection, AI vision, bulk operations, Google Drive sync |
| Power | $5.99 | Export to InsightForge, priority model access, future features |

### Feature-to-Tier Mapping

```javascript
FEATURE_TIERS = {
  'text-capture': 'free',
  'page-capture': 'free',
  'tag-management': 'free',
  'search': 'free',
  'local-export': 'free',
  'local-import': 'free',
  'screenshot-capture': 'starter',
  'ai-summary': 'starter',
  'ai-auto-tag': 'starter',
  'marquee-capture': 'pro',
  'ai-vision': 'pro',
  'bulk-operations': 'pro',
  'google-drive-sync': 'pro',
  'export-to-insightforge': 'power'
};
```

### Fuel the Build

| Field | Value |
|-------|-------|
| Coffee button | Options page + empty state on first launch |
| Payment link | _(Stripe link — add when created)_ |

---

## 9. Chrome Web Store Listing

| Field | Value |
|-------|-------|
| Category | Productivity |
| Tagline | Capture anything from the web. Private by default. |
| Key Selling Points | 1. One-click capture — text, pages, screenshots 2. AI summaries and auto-tagging 3. No ads, no tracking, your data stays yours |
| Privacy Highlight | "No ads. No tracking. Your data stays yours." |

---

## 10. Testing Notes

### Critical Paths to Test

| # | Flow Description | Touches |
|---|-----------------|---------|
| 1 | Select text → right-click → "Clip to ClipBoard" → clip appears in panel | context menu → content script → service worker → IndexedDB → panel |
| 2 | Click "Summarize" on a clip → AI processes → summary appears on card | panel → service worker → redactor → api-client → fetch → panel update |
| 3 | Create tag → assign to clip → filter by tag → clip appears in filtered view | panel → IndexedDB (tags + clip_tags stores) → query → render |
| 4 | Export data → clear all → import data → everything restored | db.exportAll → download → db.importAll → verify counts match |
| 5 | Free user taps "Screenshot" → upgrade prompt appears (not error) | panel → tiers.js check → upgrade card render |

### Known Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Capture on `chrome://` page | Content script silently skips; toast: "Can't capture from this page" |
| Capture on PDF viewer | Extract visible text or show "PDFs coming soon" message |
| Page with iframes | Capture from top-level document only (iframe content not guaranteed) |
| Very long page (50,000+ words) | Truncate at 20,000 words, note truncation in clip metadata |
| Image-heavy page with little text | Page capture gets what text exists; suggest screenshot instead |
| Clip content is entirely PPI | Redactor replaces everything; AI summary says "insufficient content" |

### AI Test Scenarios

| Input with PPI | Expected Redaction | AI Instruction |
|----------------|-------------------|----------------|
| "Report by john@acme.com about Q3" | "Report by [EMAIL_REDACTED] about Q3" | Summarize |
| "Call 555-123-4567 for SSN 111-22-3333" | "Call [PHONE_REDACTED] for [SSN_REDACTED]" | Summarize |
| "Invoice to 123 Main St, card 4111111111111111" | "Invoice to [ADDRESS_REDACTED], card [CC_REDACTED]" | Auto-tag |

---

## 11. Future Lego Bricks

| Module / Feature | Reuse Potential |
|-----------------|-----------------|
| Text extraction / readability engine | Any future extension that needs clean page text |
| Tag management system | Universal — tags work the same everywhere |
| Screenshot + crop pipeline | Any extension needing visual capture |
| Context menu integration pattern | Reusable right-click menu scaffold |
| Cross-extension messaging (InsightForge) | Pattern for any future 864z extension interop |

---

_Brief completed by: Jeff  
_Date: February 2026  
_Ready for build: [ ] Yes  [x] Needs review_
