# Google Drive Feature Brick

Reusable Google Drive backup/sync module for 864zeros Chrome extensions.

## Features

- OAuth via `chrome.identity.launchWebAuthFlow()` (any Google account)
- Hidden app data folder (`drive.appdata` scope) - no clutter in user's Drive
- App-specific backup organization
- Automatic backup retention (keeps last 5)
- Auto-sync support via `chrome.alarms`

## User Experience

Users just click "Connect to Google Drive" → Google auth popup → done.
No configuration, no API keys, no setup. It just works.

---

## Developer Setup (One-Time Per Extension)

This is done by 864zeros before publishing each extension. Users never see this.

### Step 1: Get Your Extension ID

1. Open Chrome → go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked** → select your extension folder
4. Copy the **ID** shown under your extension name (32-character string like `amnnmecoloclpobnihaindincdkgcpld`)

### Step 2: Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Click the project dropdown (top left) → **New Project**
3. Name it `864zeros-[app-slug]` (e.g., `864zeros-clipboard`)
4. Click **Create**
5. Make sure the new project is selected in the dropdown

### Step 3: Enable Google Drive API

1. In the left sidebar → **APIs & Services** → **Library**
2. Search for **Google Drive API**
3. Click on it → click **Enable**

### Step 4: Configure OAuth Consent Screen

1. Left sidebar → **APIs & Services** → **OAuth consent screen**
2. Click **Get Started** or **Configure Consent Screen**

**App Information:**
- App name: `[Your Extension Name]` (e.g., `ClipBoard`)
- User support email: your email

**Audience:**
- Select **External**

**Contact Information:**
- Developer contact email: your email

3. Click through to finish (skip optional fields like logo, privacy policy for now)

### Step 5: Add Yourself as Test User

While your app is in "Testing" mode, only test users can authorize.

1. Left sidebar → **APIs & Services** → **OAuth consent screen**
2. Look for **Audience** tab (or scroll to Test users section)
3. Click **+ Add Users**
4. Enter your Google email address
5. Click **Save**

### Step 6: Create OAuth Client ID

**IMPORTANT: Use "Web application" type, NOT "Chrome Extension"**

1. Left sidebar → **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application** (NOT Chrome Extension!)
4. Name: `[App Name] Web` (e.g., `ClipBoard Web`)
5. Under **Authorized redirect URIs**, click **+ Add URI**
6. Enter: `https://[YOUR-EXTENSION-ID].chromiumapp.org/`
   - Example: `https://amnnmecoloclpobnihaindincdkgcpld.chromiumapp.org/`
   - Replace with YOUR extension ID from Step 1
   - Include the trailing slash!
7. Click **Create**
8. Copy the **Client ID** (looks like `123456789-xxxxx.apps.googleusercontent.com`)

### Step 7: Update manifest.json

Add to your extension's `manifest.json`:

```json
{
  "permissions": ["identity", "storage", "alarms"],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
    "scopes": ["https://www.googleapis.com/auth/drive.appdata", "email"]
  }
}
```

Replace `YOUR_CLIENT_ID_HERE` with the client ID from Step 6.

### Step 8: Test

1. `chrome://extensions` → click refresh on your extension
2. Open your extension's Options page
3. Click **Connect to Google Drive**
4. Google auth popup appears → click through warnings → Authorize
5. You should see "Connected" with your email

### Troubleshooting

**"redirect_uri_mismatch" error:**
- You created a "Chrome Extension" OAuth client instead of "Web application"
- Or the redirect URI doesn't match exactly (check trailing slash)

**"This app's request is invalid" error:**
- Wait 5 minutes for Google to propagate settings
- Double-check the redirect URI matches your extension ID

**"Google hasn't verified this app" warning:**
- This is normal during testing
- Click "Advanced" → "Continue" to proceed
- Goes away after you publish and verify the app

**401 error on userinfo:**
- Missing `email` scope in manifest.json
- Scope should be: `["https://www.googleapis.com/auth/drive.appdata", "email"]`

---

## Integration Guide

### 1. Copy the lib

```bash
cp -r 864z-build-kit/lib/google-drive extensions/my-app/lib/
```

### 2. Add stylesheet to your HTML

```html
<link rel="stylesheet" href="../lib/google-drive/drive-styles.css">
```

### 3. Wire up in options.js

```javascript
import { init as initDrive } from '../lib/google-drive/drive-client.js';
import { initUI as initDriveUI, renderDriveSection } from '../lib/google-drive/drive-ui.js';
import { exportAll, importAll } from './db.js';  // your data functions

async function setupGoogleDrive() {
  // Get client ID from manifest
  const clientId = chrome.runtime.getManifest().oauth2.client_id;

  // Initialize Drive client
  initDrive(clientId);

  // Section reference for refresh callbacks
  let section = null;

  // Initialize UI with callbacks
  initDriveUI({
    appSlug: 'your-app-slug',
    onConnect: (result) => {
      console.log('Connected:', result.email);
      if (section) section._refresh();
    },
    onDisconnect: () => {
      console.log('Disconnected');
      if (section) section._refresh();
    },
    onSync: async () => {
      // Return your app's data to sync
      return await exportAll();
    },
    onRestore: async (data, meta) => {
      // Import restored data
      await importAll(data);
      if (section) section._refresh();
    }
  });

  // Render the Drive section
  const container = document.getElementById('drive-section');
  section = renderDriveSection({ container });
}

setupGoogleDrive();
```

### 4. Add container to your HTML

```html
<div id="drive-section"></div>
```

---

## API Reference

### Connection

| Function | Description |
|----------|-------------|
| `init(clientId)` | Initialize with OAuth client ID (required first) |
| `connect()` | Start OAuth flow, returns `{success, email}` |
| `disconnect()` | Revoke token and clear stored credentials |
| `isConnected()` | Check if connected (async, returns boolean) |
| `getConnectionInfo(appSlug)` | Get `{connected, email, lastSync}` |

### Backup Operations

| Function | Description |
|----------|-------------|
| `backup(data, appSlug, version?)` | Upload JSON backup, returns `{success, fileId, fileName}` |
| `restore(appSlug)` | Download latest backup, returns `{success, data, meta}` |
| `listBackups(appSlug)` | List available backups with timestamps |
| `deleteBackup(appSlug, fileId)` | Remove a specific backup |

### Sync

| Function | Description |
|----------|-------------|
| `syncNow(data, appSlug)` | Backup with timestamp update |
| `getLastSyncTime(appSlug)` | Get last sync timestamp |
| `enableAutoSync(appSlug, minutes)` | Set up periodic sync via alarms |
| `disableAutoSync(appSlug)` | Stop auto-sync |

## Error Handling

```javascript
try {
  await backup(data, 'myapp');
} catch (error) {
  switch (error.code) {
    case 'auth_failed':
      showMessage('Please sign in again');
      break;
    case 'network_error':
      showMessage('No internet connection');
      break;
    case 'quota_exceeded':
      showMessage('Drive storage full');
      break;
    case 'file_not_found':
      showMessage('No backup found');
      break;
    default:
      showMessage(error.message);
  }
}
```

## Storage Structure

Backups are stored in a hidden app data folder (invisible to user):

```
[Hidden App Data]/
└── 864zeros/
    ├── clipboard/
    │   └── backup-2024-02-16T10-30-00.json
    └── tabvault/
        └── backup-2024-02-16T10-30-00.json
```

## Privacy

- Uses `drive.appdata` scope: only accesses hidden app folder
- User's Drive files are never touched
- Data flows directly between browser and user's Drive
- 864zeros has zero access to backed-up data

## Files

```
864z-build-kit/lib/google-drive/
├── drive-client.js    # OAuth + Drive API
├── drive-ui.js        # UI components
├── drive-styles.css   # OIA styling
└── README.md          # This file
```

## Backoffice

Store OAuth credentials JSON files in:
```
IGNORE/[app-slug]-backoffice/client_secret_[client-id].json
```

Archive old credentials in `arch/` subdirectory.
