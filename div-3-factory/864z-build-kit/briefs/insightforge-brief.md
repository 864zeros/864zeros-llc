# App Brief — InsightForge

---

## 1. Identity

| Field | Value |
|-------|-------|
| App Name | InsightForge |
| App Slug | `insightforge` |
| Description | Turn scattered clips and notes into polished summaries, reports, and LLM-ready exports. |
| Brand | `864zeros` |
| Template | `panel` |
| Version | 1.0.0 |

---

## 2. Permissions

| Permission | Reason |
|------------|--------|
| `sidePanel` | Panel extension — primary UI surface |
| `storage` | State persistence, settings, tier info |
| `activeTab` | Read current page content for "Forge from this page" action |
| `downloads` | Trigger file downloads for PDF/JSON/Markdown exports |

**Host permissions:**

```json
"host_permissions": []
```

InsightForge does not inject content scripts or modify pages. It works entirely with user-provided content (manual paste, import, or clips received from ClipBoard).

---

## 3. Screens / Views

| View ID | View Name | Purpose | Nav Icon/Label |
|---------|-----------|---------|----------------|
| `inbox` | Inbox | Incoming content — pasted text, ClipBoard imports, active page captures. Staging area before forging. | 📥 Inbox |
| `forges` | Forges | Created documents — summaries, reports, syntheses. Each is a "forge" with a title, content, and export options. | 🔥 Forges |
| `exports` | Export | Export hub — choose format (PDF, Markdown, JSON, LLM-ready), configure, download | 📤 Export |

**Options page sections:**
- General settings (default AI instructions, export preferences)
- AI Settings (provider, model, custom system prompts for advanced users)
- Your Plan (tier display + upgrade)
- Data (export / import / Google Drive sync)
- Fuel the Build

---

## 4. Features (Priority Order)

| # | Feature Name | Description | View | Tier | /lib/ Modules |
|---|-------------|-------------|------|------|---------------|
| 1 | Manual Content Input | Paste or type text directly into the inbox. Each paste becomes an inbox item with timestamp. | inbox | free | db, store |
| 2 | Active Page Import | "Forge from this page" button — captures current tab's readable text into inbox | inbox | free | db, store |
| 3 | Single Source Summary | Select one inbox item → AI generates a key-point summary → becomes a forge | inbox → forges | free | db, api-client, redactor |
| 4 | Multi-Source Synthesis | Select 2+ inbox items → AI synthesizes into one cohesive forge with key themes, agreements, and contradictions | inbox → forges | starter | db, api-client, redactor |
| 5 | Forge Editor | View and edit forge content inline. Rename, restructure, add notes. Auto-saves. | forges | free | db, store |
| 6 | Markdown Export | Export any forge as a `.md` file | exports | free | db |
| 7 | JSON Export | Export any forge as structured JSON (raw content + metadata) | exports | free | db |
| 8 | LLM-Ready Export | Export a forge as an optimized prompt package — system context + content + instruction template — ready to paste into any AI chat | exports | starter | db |
| 9 | PDF Export | Generate a clean, branded PDF from a forge. Uses OIA typography and layout. | exports | pro | db |
| 10 | Custom AI Instructions | User writes custom AI instructions that apply to all synthesis operations. Saved in settings. | options | pro | store, api-client |
| 11 | Receive from ClipBoard | Accept clips pushed from ClipBoard extension via cross-extension messaging. Clips land in inbox. | inbox | pro | store, db |
| 12 | Google Drive Sync | Auto-sync database snapshots to user's Google Drive | options | pro | backup |
| 13 | Batch Forge | Select all inbox items → one-tap "Forge All" → AI processes and organizes everything into themed forges | inbox → forges | power | db, api-client, redactor |
| 14 | Template Library | Pre-built forge templates: meeting notes, research brief, competitive analysis, decision log. AI follows template structure. | forges | power | db, api-client |

---

## 5. Data Model

### IndexedDB Schema

**Database name:** `insightforge_db`  
**Version:** 1

**Store: `inbox_items`**

```javascript
{
  keyPath: 'id',
  indexes: [
    { name: 'by-created', field: 'createdAt', unique: false },
    { name: 'by-source', field: 'sourceType', unique: false },
    { name: 'by-status', field: 'status', unique: false }
  ]
}
```

**Record shape:**

```javascript
{
  id: '',                // crypto.randomUUID()
  sourceType: '',        // 'paste' | 'page-capture' | 'clipboard-import'
  content: '',           // raw text content
  sourceUrl: '',         // URL if captured from page or ClipBoard (null if pasted)
  sourceTitle: '',       // page title if captured (null if pasted)
  status: '',            // 'pending' | 'forged' | 'archived'
  createdAt: '',         // ISO string
  updatedAt: ''          // ISO string
}
```

**Store: `forges`**

```javascript
{
  keyPath: 'id',
  indexes: [
    { name: 'by-created', field: 'createdAt', unique: false },
    { name: 'by-type', field: 'forgeType', unique: false },
    { name: 'by-starred', field: 'starred', unique: false }
  ]
}
```

**Record shape:**

```javascript
{
  id: '',                // crypto.randomUUID()
  title: '',             // user-editable title (AI suggests default)
  forgeType: '',         // 'summary' | 'synthesis' | 'batch' | 'template'
  content: '',           // the generated/edited text (Markdown format)
  sourceItemIds: [],     // array of inbox_item IDs that fed this forge
  templateId: '',        // ID of template used (null if freeform)
  aiInstruction: '',     // the instruction sent to AI for this forge
  starred: false,        // boolean — quick-access flag
  createdAt: '',         // ISO string
  updatedAt: ''          // ISO string
}
```

**Store: `templates`**

```javascript
{
  keyPath: 'id',
  indexes: [
    { name: 'by-name', field: 'name', unique: true },
    { name: 'by-category', field: 'category', unique: false }
  ]
}
```

**Record shape:**

```javascript
{
  id: '',                // crypto.randomUUID() or predefined for built-in templates
  name: '',              // "Meeting Notes", "Research Brief", etc.
  category: '',          // 'work' | 'research' | 'decision' | 'custom'
  instruction: '',       // AI instruction template with {content} placeholder
  outputStructure: '',   // Expected output structure description
  builtIn: true,         // true for shipped templates, false for user-created
  createdAt: ''          // ISO string
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
| "Summarize" on single inbox item | Item content (redacted) | "Summarize the following content. Extract key points as a brief, scannable document. Use Markdown formatting. Keep it under 300 words." | Markdown summary string | free |
| "Forge" on 2+ selected inbox items | Concatenated content (redacted), separated by source markers | "Synthesize the following sources into one cohesive analysis. Identify key themes, where sources agree, where they contradict, and what conclusions can be drawn. Use Markdown. Cite sources by their [Source N] marker." | Markdown synthesis document | starter |
| "Forge All" batch | All pending inbox items (redacted) | "Organize the following content into themed groups. For each group, create a titled summary. Output as Markdown with H2 headings for each theme." | Markdown multi-section document | power |
| Template-based forge | Selected items + template instruction | Template-specific instruction (e.g., "Structure as meeting notes: Attendees, Decisions, Action Items, Open Questions") | Structured Markdown per template | power |
| LLM-ready export | Forge content | "Reformat the following content as an optimized prompt package. Include: a system context paragraph, the core content, and 3 suggested follow-up instructions." | JSON `{ system, content, instructions[] }` | starter |

### AI Token Management

- Single source summary: ~500 input tokens, ~300 output tokens
- Multi-source synthesis: varies by input count. Cap at 8,000 input tokens (truncate oldest content first).
- Batch forge: cap at 12,000 input tokens. If inbox exceeds this, process in batches and merge.

---

## 7. Content Script Behavior

| Field | Value |
|-------|-------|
| Needed | `yes` — minimal, only for "Forge from this page" |
| Match Pattern | Injected on-demand via `chrome.scripting.executeScript` (not auto-injected) |
| Actions | Extract readable text from current page (strip scripts, styles, nav) |
| Injects CSS | `no` |

**Implementation:** Same readability extraction pattern as ClipBoard's full page capture. Candidate for `/lib/` shared module.

---

## 8. Monetization

### Tier Structure

| Tier | Price | What Unlocks |
|------|-------|-------------|
| Free | $0 | Manual input, page capture, single-source summary, forge editor, Markdown export, JSON export |
| Starter | $2.99 | Multi-source synthesis, LLM-ready export |
| Pro | $4.99 | PDF export, custom AI instructions, receive from ClipBoard, Google Drive sync |
| Power | $6.99 | Batch forge, template library, future templates, priority model access |

### Feature-to-Tier Mapping

```javascript
FEATURE_TIERS = {
  'manual-input': 'free',
  'page-capture': 'free',
  'single-summary': 'free',
  'forge-editor': 'free',
  'markdown-export': 'free',
  'json-export': 'free',
  'multi-synthesis': 'starter',
  'llm-ready-export': 'starter',
  'pdf-export': 'pro',
  'custom-instructions': 'pro',
  'receive-from-clipboard': 'pro',
  'google-drive-sync': 'pro',
  'batch-forge': 'power',
  'template-library': 'power'
};
```

### Fuel the Build

| Field | Value |
|-------|-------|
| Coffee button | Options page + first forge success screen |
| Payment link | _(Stripe link — add when created)_ |

---

## 9. Chrome Web Store Listing

| Field | Value |
|-------|-------|
| Category | Productivity |
| Tagline | Turn scattered notes into polished insights. Private by default. |
| Key Selling Points | 1. Multi-source AI synthesis — combine any content into one clear document 2. Export anywhere — Markdown, PDF, JSON, or LLM-ready prompts 3. No ads, no tracking, your data stays yours |
| Privacy Highlight | "No ads. No tracking. Your data stays yours." |

---

## 10. Testing Notes

### Critical Paths to Test

| # | Flow Description | Touches |
|---|-----------------|---------|
| 1 | Paste text → appears in inbox → tap "Summarize" → forge created with summary → appears in Forges view | panel input → IndexedDB → service worker → redactor → api-client → IndexedDB → panel render |
| 2 | Select 3 inbox items → "Forge" → synthesis document created with source citations | panel selection → service worker → redactor → api-client (multi-source prompt) → IndexedDB → panel |
| 3 | Open forge → edit title and content → close panel → reopen → edits persisted | panel → IndexedDB auto-save → panel reload → read |
| 4 | Export forge as Markdown → file downloads → content matches forge | forge content → Markdown formatter → downloads API → file verification |
| 5 | Free user taps "Multi-Source Synthesis" → upgrade prompt (not error) | panel → tiers.js check → upgrade card |

### Known Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Paste extremely long text (100,000+ chars) | Accept and store full text; truncate AI input to token limit; note truncation to user |
| Forge from empty inbox | "Forge" button disabled; empty state says "Add some content first" |
| AI returns malformed JSON (LLM-ready export) | Catch parse error; show forge as plain text with note: "Couldn't structure this one — here's the raw content" |
| Synthesis with contradictory sources | AI should explicitly call out contradictions (instruction requires this) |
| User edits a forge then re-runs AI | Offer choice: "Replace current content?" with cancel option. Never silently overwrite. |
| Cross-extension message from unknown sender | Reject silently. Only accept from known 864zeros extension IDs. |
| PDF export with very long forge (50+ pages) | Paginate properly; show progress spinner; warn if unusually long |

### AI Test Scenarios

| Input with PPI | Expected Redaction | AI Instruction |
|----------------|-------------------|----------------|
| "Meeting with john@acme.com about salary ranges $85k-$120k" | "Meeting with [EMAIL_REDACTED] about salary ranges $85k-$120k" (dollar amounts NOT redacted — they're content, not PPI) | Summarize |
| "Ship to 742 Evergreen Terrace, SSN 123-45-6789" | "Ship to [ADDRESS_REDACTED], [SSN_REDACTED]" | Synthesize |
| Multi-source: Source 1 has email, Source 2 has phone | Both redacted independently before concatenation | Multi-source synthesis |

---

## 11. Future Lego Bricks

| Module / Feature | Reuse Potential |
|-----------------|-----------------|
| Multi-source synthesis engine | Any product that combines content from multiple inputs |
| Markdown generation pipeline | Universal export capability |
| PDF generation pipeline | Universal — reports, invoices, documents |
| LLM-ready export format | Unique differentiator — reusable for any AI-adjacent tool |
| Template system (instruction + structure) | Reusable for any AI-powered content generation |
| Cross-extension receiving pattern | Pattern for future 864z extension interop |
| Readability text extraction | Shared with ClipBoard via /lib/ |

---

## 12. Cross-Extension Protocol (ClipBoard ↔ InsightForge)

### Message Format

ClipBoard sends clips to InsightForge via `chrome.runtime.sendMessage` with the InsightForge extension ID.

```javascript
// ClipBoard sends:
chrome.runtime.sendMessage(INSIGHTFORGE_EXTENSION_ID, {
  type: 'CLIPBOARD_EXPORT',
  payload: {
    senderExtension: 'clipboard',
    senderVersion: '1.0.0',
    items: [
      {
        content: '...',
        clipType: 'selection',
        sourceUrl: '...',
        sourceTitle: '...',
        tags: ['tag1', 'tag2'],
        createdAt: '...'
      }
    ]
  }
});

// InsightForge receives in service worker:
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  // Validate sender is a known 864zeros extension
  if (!KNOWN_EXTENSION_IDS.includes(sender.id)) {
    sendResponse({ success: false, error: 'unknown_sender' });
    return;
  }

  if (message.type === 'CLIPBOARD_EXPORT') {
    handleClipBoardImport(message.payload, sendResponse);
    return true;
  }
});
```

### Security Rules

- Only accept messages from known 864zeros extension IDs (hardcoded allowlist)
- Validate payload structure before processing
- Treat imported content as untrusted — sanitize HTML, validate field types
- Never auto-execute AI on imported content — always require user action
- Log import in inbox with `sourceType: 'clipboard-import'`

### Discovery

InsightForge checks if ClipBoard is installed:

```javascript
// On panel load, check for ClipBoard
chrome.management.get(CLIPBOARD_EXTENSION_ID, (info) => {
  if (chrome.runtime.lastError || !info?.enabled) {
    // ClipBoard not installed — don't show import option
  } else {
    // Show "Import from ClipBoard" in inbox
  }
});
```

Requires `management` permission — add only if this feature is being built.

---

_Brief completed by: Jeff  
_Date: February 2026  
_Ready for build: [x] Yes  [ ] Needs review_
