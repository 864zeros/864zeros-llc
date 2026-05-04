# Google Drive Feature Brick — Build Specification

## Overview

A reusable module for 864zeros extensions that provides Google Drive backup/sync functionality. Drop-in integration for any extension's Pro tier.

---

## Architecture

```
864z-build-kit/
└── lib/
    └── google-drive/
        ├── drive-client.js      # OAuth + Drive API wrapper
        ├── drive-ui.js          # UI components (connect button, status)
        ├── drive-styles.css     # Styling for UI components
        └── README.md            # Integration guide
```

---

## Core API

### drive-client.js

```javascript
// Connection
connect()              // OAuth flow → returns { success, email }
disconnect()           // Revoke token, clear state
isConnected()          // Returns boolean
getConnectionInfo()    // Returns { connected, email, lastSync }

// Backup Operations
backup(data, appSlug)           // Upload JSON to app folder
restore(appSlug)                // Download latest backup
listBackups(appSlug)            // List available backup files with timestamps
deleteBackup(appSlug, fileId)   // Remove a specific backup

// Sync
syncNow(data, appSlug)          // Backup with timestamp update
getLastSyncTime(appSlug)        // Return last successful sync timestamp
enableAutoSync(appSlug, intervalMinutes)  // Set up periodic sync
disableAutoSync(appSlug)        // Stop auto-sync
```

### drive-ui.js

```javascript
// UI Components (returns HTML string or DOM element)
renderConnectButton(options)     // Connect/Disconnect button
renderSyncStatus(options)        // "Last synced: 5 min ago" or "Not connected"
renderSyncButton(options)        // Manual sync trigger
renderBackupList(backups)        // List of available backups with restore buttons
```

---

## OAuth Implementation

### Method: `chrome.identity.launchWebAuthFlow()`

**Why not `getAuthToken()`?**
- `getAuthToken()` requires user to be signed into Chrome
- `launchWebAuthFlow()` allows any Google account
- More flexibility for users with multiple accounts

### Required Scopes

```
https://www.googleapis.com/auth/drive.appdata
email
```

- `drive.appdata` grants access ONLY to a hidden app folder — user's Drive files are never touched
- `email` is required to fetch user email for display in the UI

### manifest.json additions

```json
{
  "permissions": ["identity", "storage", "alarms"],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": ["https://www.googleapis.com/auth/drive.appdata", "email"]
  }
}
```

### Google Cloud Console Setup (Developer Task — Before Publishing)

**This is done by 864zeros once per extension. Users never see or do any of this.**

**IMPORTANT: Use "Web application" OAuth client type, NOT "Chrome Extension"**

1. Load extension in Chrome, copy extension ID from `chrome://extensions`
2. Create project in Google Cloud Console (e.g., "864zeros-clipboard")
3. Enable Google Drive API
4. Configure OAuth consent screen (External, add yourself as test user)
5. Create OAuth 2.0 credentials:
   - Type: **Web application** (NOT Chrome Extension!)
   - Authorized redirect URI: `https://[EXTENSION-ID].chromiumapp.org/`
6. Copy client ID to manifest.json before publishing

**User experience:** Click "Connect to Google Drive" → Google popup → Authorize → Done.

See `864z-build-kit/lib/google-drive/README.md` for detailed step-by-step instructions.

---

## Storage Structure on Google Drive

```
Google Drive/
└── [Hidden App Data Folder]/
    └── 864zeros/
        ├── tabvault/
        │   ├── backup-2024-02-16T10-30-00.json
        │   └── backup-2024-02-15T08-00-00.json
        └── clipboard/
            ├── backup-2024-02-16T10-30-00.json
            └── backup-2024-02-14T15-45-00.json
```

- App data folder is hidden from user (not cluttering their Drive)
- Each extension gets its own subfolder
- Multiple backups retained (configurable limit, default: 5)
- Oldest backups auto-deleted when limit reached

---

## Backup File Format

```json
{
  "meta": {
    "app": "tabvault",
    "version": "1.0.0",
    "createdAt": "2024-02-16T10:30:00.000Z",
    "deviceId": "abc123",
    "itemCount": 42
  },
  "data": {
    // Extension-specific data structure
  }
}
```

---

## Chrome Storage Keys

```javascript
const DRIVE_STORAGE_KEYS = {
  ACCESS_TOKEN: 'drive_access_token',
  REFRESH_TOKEN: 'drive_refresh_token',
  TOKEN_EXPIRY: 'drive_token_expiry',
  USER_EMAIL: 'drive_user_email',
  LAST_SYNC: 'drive_last_sync_{appSlug}',
  AUTO_SYNC_ENABLED: 'drive_auto_sync_{appSlug}',
  AUTO_SYNC_INTERVAL: 'drive_auto_sync_interval_{appSlug}'
};
```

---

## UI Components

### Connect Button States

```
[Not Connected]     →  "Connect to Google Drive"  (primary button)
[Connecting...]     →  "Connecting..."            (disabled, spinner)
[Connected]         →  "user@gmail.com ✓"         (success state)
[Error]             →  "Connection failed"        (error state, retry)
```

### Sync Status Display

```
Connected:    "Last synced: 5 minutes ago"
              "Last synced: Feb 16, 2024"

Not synced:   "Never synced"
              "Sync now to backup your data"

Syncing:      "Syncing..." (with spinner)

Error:        "Sync failed. Tap to retry."
```

### Sync Button

```
[Idle]        →  "Sync Now"
[Syncing]     →  "Syncing..." (disabled, spinner)
[Success]     →  "Synced ✓" (brief, then back to idle)
[Error]       →  "Retry Sync"
```

---

## Error Handling

| Error | User Message | Action |
|-------|--------------|--------|
| `auth_failed` | "Please sign in again" | Clear tokens, show connect |
| `network_error` | "No internet connection" | Retry button |
| `quota_exceeded` | "Drive storage full" | Link to manage storage |
| `file_not_found` | "No backup found" | Offer to create first backup |
| `parse_error` | "Backup file corrupted" | Offer older backups |

---

## Security Considerations

### Token Storage
- Access tokens stored in `chrome.storage.local` (encrypted by Chrome)
- Refresh tokens handled by Chrome Identity API
- Tokens never exposed to content scripts

### Data Privacy
- App data folder is invisible to user and other apps
- Optional: Client-side encryption before upload
- "Your data is encrypted before leaving your device"

### Future: Encryption Layer

```javascript
// Optional encryption (Phase 2)
encrypt(data, userPassphrase)    // AES-256-GCM
decrypt(encryptedData, userPassphrase)
```

---

## Integration Guide (for developers building extensions)

### 1. Copy the lib

```bash
cp -r 864z-build-kit/lib/google-drive extensions/my-app/lib/
```

### 2. Add to manifest.json (with real client ID from Cloud Console)

```json
{
  "permissions": ["identity", "storage", "alarms"],
  "oauth2": {
    "client_id": "123456789-abc.apps.googleusercontent.com",
    "scopes": ["https://www.googleapis.com/auth/drive.appdata", "email"]
  }
}
```

Note: Replace with actual client ID before publishing. Users never configure this.

### 3. Add stylesheet to HTML

```html
<link rel="stylesheet" href="../lib/google-drive/drive-styles.css">
```

### 4. Wire up in options.js

```javascript
import { init as initDrive } from '../lib/google-drive/drive-client.js';
import { initUI as initDriveUI, renderDriveSection } from '../lib/google-drive/drive-ui.js';
import { exportAll, importAll } from './db.js';

async function setupGoogleDrive() {
  const clientId = chrome.runtime.getManifest().oauth2.client_id;
  initDrive(clientId);

  let section = null;

  initDriveUI({
    appSlug: 'your-app-slug',
    onConnect: (result) => { if (section) section._refresh(); },
    onDisconnect: () => { if (section) section._refresh(); },
    onSync: async () => await exportAll(),
    onRestore: async (data) => { await importAll(data); if (section) section._refresh(); }
  });

  section = renderDriveSection({ container: document.getElementById('drive-section') });
}

setupGoogleDrive();
```

### 5. Add container to HTML

```html
<div id="drive-section"></div>
```

---

## Implementation Phases

### Phase 1: Core Client (MVP)
- [ ] OAuth flow with `launchWebAuthFlow`
- [ ] Token storage and refresh
- [ ] `connect()`, `disconnect()`, `isConnected()`
- [ ] `backup()`, `restore()` basic operations
- [ ] Error handling

### Phase 2: UI Components
- [ ] Connect button component
- [ ] Sync status component
- [ ] Sync button with loading states
- [ ] CSS styling (OIA design system)

### Phase 3: Advanced Features
- [ ] `listBackups()` with restore picker
- [ ] Auto-sync with `chrome.alarms`
- [ ] Backup retention (keep last N)
- [ ] Multi-device conflict resolution

### Phase 4: Encryption (Optional)
- [ ] Client-side encryption with user passphrase
- [ ] Key derivation (PBKDF2)
- [ ] Secure passphrase entry UI

---

## Testing Checklist

- [ ] OAuth flow completes successfully
- [ ] Token refresh works after expiry
- [ ] Backup uploads to correct folder
- [ ] Restore downloads and parses correctly
- [ ] Disconnect clears all tokens
- [ ] Error states display correctly
- [ ] Works offline (graceful degradation)
- [ ] Works across multiple devices (same account)

---

## Dependencies

- Chrome Extension APIs: `identity`, `storage`, `alarms`
- Google APIs: Drive API v3
- No external npm packages required

---

## Files to Create

```
864z-build-kit/lib/google-drive/
├── drive-client.js      # ~300 lines
├── drive-ui.js          # ~150 lines
├── drive-styles.css     # ~100 lines
└── README.md            # Integration guide
```

---

## Next Steps

1. Set up Google Cloud project and OAuth credentials
2. Implement `drive-client.js` core functions
3. Test with ClipBoard extension
4. Build UI components
5. Document integration process
6. Copy to TabVault

---

*Created: 2024-02-16*
*Status: Specification Complete — Ready for Implementation*
