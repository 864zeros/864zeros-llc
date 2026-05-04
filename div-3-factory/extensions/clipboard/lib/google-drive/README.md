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

## Developer Setup (One-Time, Before Publishing)

This is done by 864zeros before publishing each extension. Users never see this.

### 1. Google Cloud Console (once per extension)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (e.g., "864zeros-clipboard")
3. Enable **Google Drive API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Select **Chrome Extension** as application type
6. Add the extension ID (from Chrome Web Store or `chrome://extensions`)
7. Copy the client ID

### 2. Add to manifest.json (build-time config)

```json
{
  "permissions": ["identity", "storage", "alarms"],
  "oauth2": {
    "client_id": "123456789-abc.apps.googleusercontent.com",
    "scopes": ["https://www.googleapis.com/auth/drive.appdata"]
  }
}
```

The client ID is baked into the extension at build time. Users never see or configure it.

### 3. Publish

The OAuth credentials are now part of the extension. When users install from Chrome Web Store and click "Connect", Google handles the auth flow automatically.

---

## Integration Guide

### 1. Copy the lib

```bash
cp -r 864z-build-kit/lib/google-drive extensions/my-app/lib/
```

### 2. Import and Initialize

```javascript
import { init, connect, backup, restore, isConnected } from '../lib/google-drive/drive-client.js';

// Initialize with your OAuth client ID (from manifest or storage)
const clientId = chrome.runtime.getManifest().oauth2.client_id;
init(clientId);
```

### 4. Connect User

```javascript
// In your options/settings page
async function handleConnect() {
  try {
    const result = await connect();
    if (result.success) {
      console.log('Connected as:', result.email);
    }
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}
```

### 5. Backup and Restore

```javascript
// Backup
const myData = await getMyExtensionData();
await backup(myData, 'my-extension-slug', '1.0.0');

// Restore
const { data, meta } = await restore('my-extension-slug');
await importData(data);
```

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

All functions throw categorized errors with `code` and `message`:

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

Backups are stored in a hidden app data folder:

```
[Hidden App Data]/
└── 864zeros/
    ├── clipboard/
    │   └── backup-2024-02-16T10-30-00.json
    └── tabvault/
        └── backup-2024-02-16T10-30-00.json
```

## Backup File Format

```json
{
  "meta": {
    "app": "clipboard",
    "version": "1.0.0",
    "createdAt": "2024-02-16T10:30:00.000Z",
    "deviceId": "abc123",
    "itemCount": 42
  },
  "data": {
    // Your extension's data
  }
}
```

## Auto-Sync with Alarms

```javascript
// In service worker - enable auto-sync every hour
await enableAutoSync('myapp', 60);

// Handle alarm in service worker
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('drive-sync-')) {
    const appSlug = alarm.name.replace('drive-sync-', '');
    const data = await getAppData(appSlug);
    await syncNow(data, appSlug);
  }
});
```

## Privacy

- Uses `drive.appdata` scope: only accesses hidden app folder
- User's Drive files are never touched
- Data flows directly between browser and user's Drive
- 864zeros has zero access to backed-up data

## UI Components

Pre-built UI components with OIA design system styling.

### Setup

Add the stylesheet to your HTML:

```html
<link rel="stylesheet" href="../lib/google-drive/drive-styles.css">
```

Import and initialize the UI:

```javascript
import { initUI, renderDriveSection } from '../lib/google-drive/drive-ui.js';
import { init } from '../lib/google-drive/drive-client.js';

// Initialize client first
const clientId = chrome.runtime.getManifest().oauth2.client_id;
init(clientId);

// Initialize UI with callbacks
initUI({
  appSlug: 'my-extension',
  onConnect: (result) => console.log('Connected:', result.email),
  onDisconnect: () => console.log('Disconnected'),
  onSync: async () => {
    // Return data to sync
    return await getMyExtensionData();
  },
  onRestore: async (data, meta) => {
    // Handle restored data
    await importData(data);
    showMessage('Restored from ' + meta.createdAt);
  }
});
```

### Complete Section

Render a full Drive settings section:

```javascript
// In options.js
const container = document.getElementById('drive-settings');
const section = renderDriveSection({ container });

// Refresh all components when needed
section._refresh();
```

### Individual Components

```javascript
import {
  renderConnectButton,
  renderSyncStatus,
  renderSyncButton,
  renderBackupList
} from '../lib/google-drive/drive-ui.js';

// Connect/Disconnect button
const connectBtn = renderConnectButton({
  container: document.getElementById('connect-area')
});

// Sync status ("Last synced: 5 min ago")
const status = renderSyncStatus({
  container: document.getElementById('status-area')
});

// Manual sync button
const syncBtn = renderSyncButton({
  container: document.getElementById('sync-area')
});

// Backup list with restore buttons
const backups = renderBackupList({
  container: document.getElementById('backups-area')
});
```

### Component States

**Connect Button:**
- Not connected → "Connect to Google Drive" (primary button)
- Connecting → spinner + "Connecting..."
- Connected → email + checkmark (secondary button, click to disconnect)

**Sync Status:**
- Disconnected → "Not connected"
- Never synced → "Never synced"
- Synced → "Last synced: 5 min ago"

**Sync Button:**
- Idle → "Sync Now"
- Syncing → spinner + "Syncing..."
- Success → checkmark + "Synced" (2s, then idle)
- Error → "Retry Sync"

### Styling

Components use OIA design system tokens. Override with CSS custom properties:

```css
/* Example: Custom accent color */
.drive-connect-btn--connected {
  border-color: var(--my-custom-color);
  color: var(--my-custom-color);
}
```

## Files

```
864z-build-kit/lib/google-drive/
├── drive-client.js    # OAuth + Drive API (~350 lines)
├── drive-ui.js        # UI components (~300 lines)
├── drive-styles.css   # OIA styling (~200 lines)
└── README.md          # This file
```
