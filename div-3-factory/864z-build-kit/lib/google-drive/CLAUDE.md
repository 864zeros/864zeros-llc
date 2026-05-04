# Google Drive Feature Brick

## What This Is

Reusable Google Drive backup/sync module for 864zeros Chrome extensions. Drop-in integration for any extension's Pro tier.

## Integration Steps

When integrating this brick into an extension:

### 1. Copy Files

```
cp -r 864z-build-kit/lib/google-drive extensions/[app-slug]/lib/
```

### 2. Update manifest.json

Add permissions and OAuth config:

```json
{
  "permissions": ["identity", "storage", "alarms"],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": ["https://www.googleapis.com/auth/drive.appdata", "email"]
  }
}
```

### 3. Update options.html

Add stylesheet and container:

```html
<link rel="stylesheet" href="../lib/google-drive/drive-styles.css">
<!-- In body -->
<div id="drive-section"></div>
```

### 4. Update options.js

```javascript
import { init as initDrive } from '../lib/google-drive/drive-client.js';
import { initUI as initDriveUI, renderDriveSection } from '../lib/google-drive/drive-ui.js';
import { exportAll, importAll } from './db.js';

async function initGoogleDrive() {
  const clientId = chrome.runtime.getManifest().oauth2.client_id;
  initDrive(clientId);

  let section = null;

  initDriveUI({
    appSlug: 'your-app-slug',
    onConnect: (result) => { if (section) section._refresh(); },
    onDisconnect: () => { if (section) section._refresh(); },
    onSync: async () => await exportAll(),
    onRestore: async (data, meta) => {
      await importAll(data);
      if (section) section._refresh();
    }
  });

  section = renderDriveSection({ container: document.getElementById('drive-section') });
}

initGoogleDrive();
```

## OAuth Setup (Developer Task)

Before publishing, create OAuth credentials in Google Cloud Console:

1. Load extension, copy ID from `chrome://extensions`
2. Create project in Google Cloud Console
3. Enable Google Drive API
4. Configure OAuth consent screen (External, add yourself as test user)
5. Create OAuth client: **Web application** type (NOT Chrome Extension)
6. Add redirect URI: `https://[EXTENSION-ID].chromiumapp.org/`
7. Copy client ID to manifest.json

See `README.md` for detailed step-by-step instructions with troubleshooting.

## Key Requirements

- OAuth client must be **Web application** type
- Scopes must include both `drive.appdata` AND `email`
- Redirect URI must include trailing slash
- Extension needs `identity`, `storage`, `alarms` permissions

## Tier Gating

This feature requires Pro tier. Check before rendering:

```javascript
const hasSyncAccess = await requiresTier('pro');
if (!hasSyncAccess) {
  // Show upgrade prompt
  return;
}
```
