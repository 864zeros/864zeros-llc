# ReadFlow — Morning Test Guide
## Strike: 864z-2026-005

---

## 3-Step Verification

### Step 1: Load Extension
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (toggle top-right)
3. Click "Load unpacked"
4. Select: `864zeros/output/864z-2026-005-readflow/`

**Expected:** Extension loads without errors. Book icon appears in toolbar.

---

### Step 2: Test Instapaper Import
1. Click the ReadFlow icon → Side panel opens
2. Click "Import from Instapaper"
3. Download your Instapaper CSV from: Settings → Export → Download .CSV
4. Drag the CSV file into the import dropzone

**Expected:**
- Rescue Audit UI appears
- Shows: Total articles imported count
- Shows: Articles rescued, reading time saved
- Shows: "$30/year saved" badge
- "Begin Reading" button appears

---

### Step 3: Test Kobo Export
1. After import, click "Export to Kobo"
2. Select 5-10 articles for the digest
3. Click "Generate ePub"
4. Scan QR code with Kobo (or download file directly)

**Expected:**
- ePub downloads as `ReadFlow_Digest_YYYY-MM-DD.epub`
- File opens correctly in Calibre or any ePub reader
- QR code generates for wireless transfer URL

---

### Step 4: Verify Zero-Network
1. Open DevTools → Network tab
2. Perform various actions (import, search, browse articles)
3. Check for outbound requests

**Expected:**
- ZERO network calls during normal operation
- All data stored locally in IndexedDB
- Console shows: `[ReadFlow] Service worker initialized`

---

## Quick Debug Commands

```javascript
// Check library status (in sidepanel console)
chrome.storage.local.get(null, console.log);

// Check IndexedDB for articles
indexedDB.databases().then(console.log);

// Verify article count
const db = await indexedDB.open('ReadFlowLibrary');
// Check 'articles' object store
```

---

## Test CSV Format

If you don't have an Instapaper account, create a test CSV:

```csv
URL,Title,Selection,Folder,Timestamp
https://example.com/article1,Test Article One,,Unread,1710633600
https://example.com/article2,Test Article Two,A highlight,Archive,1710547200
https://example.com/article3,Test Article Three,,Unread,1710460800
```

---

## Known Issues
- First ePub generation may take 2-3 seconds (ZIP compression)
- Large imports (500+ articles) may briefly freeze UI
- QR codes require local server for Kobo wireless transfer

---

## Aha Moment Checklist
- [ ] Import completes without errors
- [ ] Rescue Audit shows meaningful metrics
- [ ] "$30/year saved" badge displays
- [ ] At least one article readable in sidepanel
- [ ] ePub exports successfully

---

**Last Updated:** 2026-03-17
**Status:** Ready for testing
