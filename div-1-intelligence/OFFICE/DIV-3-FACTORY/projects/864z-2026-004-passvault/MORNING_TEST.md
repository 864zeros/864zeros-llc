# PassVault — Morning Test Guide
## Strike: 864z-2026-004

---

## 3-Step Verification

### Step 1: Load Extension
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (toggle top-right)
3. Click "Load unpacked"
4. Select: `864zeros_engine/builds/864z-2026-004-passvault/`

**Expected:** Extension loads without errors. Green shield icon appears in toolbar.

---

### Step 2: Test Import Flow
1. Click the PassVault icon → Side panel opens
2. Complete onboarding (create master password: `TestPass123!`)
3. Click "Import Passwords"
4. Select `test-dashlane.json` from the extension folder

**Expected:**
- Migration Audit UI appears
- Shows: 20 passwords imported
- Shows: 5 reused, 3 weak, 2 compromised
- Shows: "$60/year saved"

---

### Step 3: Verify Security Constraints
1. Open DevTools → Network tab
2. Perform various actions (unlock, search, browse)
3. Check for outbound requests

**Expected:**
- ZERO network calls (except HIBP if breach check triggered)
- All data stored locally in IndexedDB
- Console shows: `[PassVault] Service worker initialized`

---

## Quick Debug Commands

```javascript
// Check vault status (in sidepanel console)
chrome.storage.local.get(null, console.log);

// Check IndexedDB
indexedDB.databases().then(console.log);
```

---

## Known Issues
- Icons need to be generated via `assets/generate-icons.html` if not already done
- First unlock may take 1-2 seconds (PBKDF2 key derivation)

---

**Last Updated:** 2026-03-17
**Status:** Ready for testing
