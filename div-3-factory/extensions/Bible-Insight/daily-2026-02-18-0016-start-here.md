# Bible Insight - Daily Start Here
**Date:** 2026-02-18 00:16
**Session:** Continuing development

---

## What We Accomplished Today

### Bugs Fixed
1. **Save as PDF** - Was erroring because side panel messages don't include `sender.tab`. Fixed by passing `tabId` in payload from panel.js.

2. **Capture Area** - Same issue. Now sends message to content script instead of injecting duplicate function.

3. **Sermon Mode Button** - Made always visible (no YouTube detection needed). Detection was too timing-dependent.

### Features Added
1. **Semantic Verse Detection** (`api.js:414-506`)
   - Uses Gemini to recognize verse CONTENT, not just explicit references like "John 3:16"
   - Example: "For God so loved the world..." → detects as John 3:16
   - Falls back to regex detection if no API key

2. **Token Counter** (`api.js:12-47`, `options.html`, `options.js`)
   - Tracks Gemini API usage (input/output tokens, total calls)
   - View in Settings > Advanced > Token Usage
   - Reset button available

3. **Replaced API.Bible with Gemini** (`api.js:259-336`)
   - KISS approach: Gemini knows the Bible, no need for separate API
   - One API key handles everything
   - Supports any translation (KJV, ESV, NIV, etc.)

4. **PDF Downloads to Local** (`background.js:321-399`)
   - Downloads PDF to user's Downloads folder
   - Stores only JPEG thumbnail in IndexedDB (saves space)
   - Shows thumbnail, filename, file size in panel

---

## Known Bug - FIXED

### YouTube Transcript Extraction Error
**Error:** `Failed to execute 'json' on 'Response': Unexpected end of JSON input`

**Status:** FIXED in same session

**Fix applied (`content.js:303-430`):**
1. Added `fetchCaptionsJson3()` - tries JSON3 format first with proper error handling
2. Added `fetchCaptionsXml()` - fallback to XML format if JSON fails
3. Added `decodeHtmlEntities()` - properly decode XML caption text
4. Better regex patterns for parsing `ytInitialPlayerResponse`
5. Logs response preview on parse failure for debugging
6. Tries multiple English variants (`en`, `en-US`, etc.)

---

## Behaviors to Define (Cross-References)

The new Gemini-powered cross-reference feature works great but needs behavior decisions:

1. **How many cross-refs to show?** Currently 3-5
2. **Should we auto-expand or click to show?**
3. **Cache cross-refs per verse?** (save API calls)
4. **Show relationship type?** (thematic, parallel, prophecy/fulfillment)
5. **Allow user to save cross-refs to their study?**

---

## Key Files Modified Today

| File | Changes |
|------|---------|
| `js/panel.js` | PDF preview, YouTube retries, verse lookup display |
| `js/background.js` | PDF download to local, semantic detection integration |
| `js/lib/api.js` | Token counter, semantic detection, Gemini verse lookup |
| `js/content.js` | YouTube transcript extraction (has bug) |
| `js/options.js` | Token usage display |
| `html/panel.html` | Sermon Mode button always visible |
| `html/options.html` | Token usage section |
| `css/panel.css` | PDF preview styles |
| `css/fhg-theme.css` | YouTube button styling |

---

## Architecture Decisions Made

1. **KISS: Gemini over API.Bible** - One API key handles AI + verse lookup
2. **KISS: No Vector DB** - Gemini has Bible knowledge built-in
3. **PDF: Thumbnail only in IndexedDB** - Full PDF goes to Downloads
4. **Sermon Mode: Always visible** - YouTube detection too fragile

---

## Next Steps Priority

1. ~~**Fix YouTube transcript error**~~ DONE
2. ~~**Verse caching**~~ DONE - 30min TTL, 200 entry max
3. ~~**Cross-reference UX**~~ DONE - loading states, click hints
4. **Test Sermon Mode** with a real YouTube sermon
5. Test semantic verse detection with real sermon content

---

## Session 2 Updates (Morning)

### Additional Fixes
1. **Sermon Mode type preservation** - `handleSavePage` now respects `payload.type` and `payload.meta`
2. **Verse caching** (`api.js:60-140`)
   - In-memory cache for verse lookups and cross-references
   - 30-minute TTL, max 200 entries per cache
   - Console logs cache hits
   - Export `getCacheStats()` and `clearCaches()` for debugging
3. **Cross-reference UX improvements**
   - Loading spinner on button while fetching
   - Button hides after showing results
   - Hint text "Click any verse to read it"
   - Book icon on cross-ref chips
   - Better error recovery with "Try Again" button

---

## How to Test

1. **Semantic Detection:** Save a selection containing verse text (not explicit reference) - check console for "AI detected X verses semantically"

2. **Verse Lookup:** Click any verse pill/bubble - should use Gemini now

3. **PDF:** Click "Save as PDF" - check Downloads folder + see thumbnail in panel

4. **Token Counter:** Open Settings > Advanced to see usage

5. **Sermon Mode:** Click button on any YouTube video page - will error (needs fix)

---

## Console Commands for Debugging

```javascript
// Check if content script is loaded (run in YouTube tab console)
chrome.runtime.sendMessage({ type: 'CHECK_YOUTUBE_VIDEO' }, console.log);

// Check token usage (run in extension pages)
chrome.runtime.sendMessage({ type: 'GET_TOKEN_USAGE' }, console.log);
```

---

*End of daily summary*
