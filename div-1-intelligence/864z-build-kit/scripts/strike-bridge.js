#!/usr/bin/env node
/**
 * Strike Bridge — Vulture Nest to Extension Scaffold
 * 864zeros Build Kit v2.0
 *
 * Usage:
 *   node strike-bridge.js <vulture-strike.json> [output-dir]
 *
 * Input: Vulture Nest strike JSON with target/opportunity data
 * Output: Complete extension scaffold ready for development
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const TEMPLATE_DIR = path.join(__dirname, '..', 'templates');
const LIB_DIR = path.join(__dirname, '..', 'lib');

const SECURITY_BRICKS = [
  'crypto-vault.js',
  'password-parser.js',
  'breach-checker.js'
];

const UI_BRICKS = [
  'BRK-UI-IMPORT-001.js',
  'BRK-PRICING-001.js'
];

const CORE_BRICKS = [
  '864z-core.js',
  'aether-ui.css'
];

// ============================================
// MAIN
// ============================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
Strike Bridge — Vulture Nest to Extension Scaffold

Usage:
  node strike-bridge.js <vulture-strike.json> [output-dir]

Example:
  node strike-bridge.js ../strikes/864z-2026-004.json ./builds/passvault
`);
    process.exit(1);
  }

  const strikePath = args[0];
  const outputDir = args[1] || './output';

  // Load strike JSON
  console.log(`[Strike Bridge] Loading: ${strikePath}`);
  const strike = JSON.parse(fs.readFileSync(strikePath, 'utf8'));

  // Validate required fields
  validateStrike(strike);

  // Generate scaffold
  console.log(`[Strike Bridge] Generating scaffold: ${outputDir}`);
  await generateScaffold(strike, outputDir);

  console.log(`
[Strike Bridge] Scaffold complete!

Next steps:
  1. cd ${outputDir}
  2. Review manifest.json permissions
  3. Generate icons: open assets/generate-icons.html in browser
  4. Load in Chrome: chrome://extensions → Load unpacked

Build phases:
  Phase 1: Scaffold ✓ (complete)
  Phase 2: Security (implement master password flow)
  Phase 3: Migration (implement import from ${strike.target.name})
  Phase 4: UI Shell (wire up all views)
  Phase 5: Features (vault management)
  Phase 6: Polish (animations, errors)
  Phase 7: Proof (testing, QA)
`);
}

// ============================================
// VALIDATION
// ============================================

function validateStrike(strike) {
  const required = [
    'id',
    'name',
    'slug',
    'target',
    'target.name',
    'description'
  ];

  for (const field of required) {
    const value = field.split('.').reduce((obj, key) => obj?.[key], strike);
    if (!value) {
      console.error(`[Strike Bridge] Missing required field: ${field}`);
      process.exit(1);
    }
  }

  console.log(`[Strike Bridge] Strike validated: ${strike.id}`);
}

// ============================================
// SCAFFOLD GENERATION
// ============================================

async function generateScaffold(strike, outputDir) {
  // Create directory structure
  const dirs = [
    '',
    'assets',
    'background',
    'sidepanel',
    'onboarding',
    'options',
    'lib',
    '_locales/en',
    'test'
  ];

  for (const dir of dirs) {
    const fullPath = path.join(outputDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  // Generate files
  generateManifest(strike, outputDir);
  generateMessages(strike, outputDir);
  generateServiceWorker(strike, outputDir);
  generateConstants(strike, outputDir);
  generateSidepanelHTML(strike, outputDir);
  generateSidepanelApp(strike, outputDir);
  generateOnboarding(strike, outputDir);
  generateOptions(strike, outputDir);
  generateBuildManifest(strike, outputDir);
  generateIconGenerator(strike, outputDir);
  copySecurityBricks(strike, outputDir);
  copyUIBricks(strike, outputDir);
  copyCoreBricks(strike, outputDir);
}

// ============================================
// FILE GENERATORS
// ============================================

function generateManifest(strike, outputDir) {
  const manifest = {
    manifest_version: 3,
    name: "__MSG_extName__",
    version: "1.0.0",
    description: "__MSG_extDescription__",
    author: "864zeros LLC",
    homepage_url: "https://864zeros.com",
    default_locale: "en",
    icons: {
      "16": "assets/icon16.png",
      "32": "assets/icon32.png",
      "48": "assets/icon48.png",
      "128": "assets/icon128.png"
    },
    action: {
      default_title: "__MSG_extName__",
      default_icon: {
        "16": "assets/icon16.png",
        "32": "assets/icon32.png"
      }
    },
    side_panel: {
      default_path: "sidepanel/index.html"
    },
    background: {
      service_worker: "background/service-worker.js"
    },
    permissions: [
      "storage",
      "unlimitedStorage",
      "sidePanel",
      "contextMenus",
      "alarms"
    ],
    optional_permissions: [
      "clipboardWrite"
    ],
    host_permissions: strike.host_permissions || [],
    options_ui: {
      page: "options/options.html",
      open_in_tab: true
    },
    commands: {
      "lock-vault": {
        suggested_key: {
          default: "Alt+Shift+L",
          mac: "Alt+Shift+L"
        },
        description: "__MSG_cmdLockVault__"
      },
      "open-vault": {
        suggested_key: {
          default: "Alt+Shift+P",
          mac: "Alt+Shift+P"
        },
        description: "__MSG_cmdOpenVault__"
      }
    }
  };

  writeJSON(path.join(outputDir, 'manifest.json'), manifest);
}

function generateMessages(strike, outputDir) {
  const messages = {
    extName: {
      message: strike.name,
      description: "Extension name"
    },
    extDescription: {
      message: strike.description,
      description: "Extension description"
    },
    cmdLockVault: {
      message: "Lock vault",
      description: "Lock keyboard shortcut"
    },
    cmdOpenVault: {
      message: `Open ${strike.name}`,
      description: "Open keyboard shortcut"
    }
  };

  writeJSON(path.join(outputDir, '_locales/en/messages.json'), messages);
}

function generateServiceWorker(strike, outputDir) {
  const content = `// service-worker.js - ${strike.name} Background Service Worker
// ${strike.id}
//
// SECURITY CONSTRAINT: NO NETWORK CALLS
// This service worker handles extension lifecycle only.
// All vault operations happen in the sidepanel/content scripts.

// Inline constants (no ES module imports for service worker compatibility)
const MESSAGE_TYPES = {
  VAULT_UNLOCK: 'VAULT_UNLOCK',
  VAULT_LOCK: 'VAULT_LOCK',
  VAULT_STATUS: 'VAULT_STATUS'
};

/**
 * Extension Lifecycle
 */

// On install - open onboarding
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[${strike.name}] Extension installed:', details.reason);

  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('onboarding/index.html')
    });
  }

  setupContextMenus();
  setupAutoLockAlarm();
});

// On startup
chrome.runtime.onStartup.addListener(() => {
  console.log('[${strike.name}] Extension started');
  setupAutoLockAlarm();
});

/**
 * Side Panel Configuration
 */

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

/**
 * Context Menus
 */

function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'open-vault',
      title: 'Open ${strike.name}',
      contexts: ['all']
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-vault') {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

/**
 * Auto-Lock Timer
 */

function setupAutoLockAlarm() {
  chrome.alarms.clear('auto-lock');
  chrome.alarms.create('auto-lock', { periodInMinutes: 15 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'auto-lock') {
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.VAULT_LOCK,
      source: 'auto-lock'
    }).catch(() => {});
  }
});

/**
 * Message Handling
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[${strike.name}] Message received:', message.type);

  switch (message.type) {
    case MESSAGE_TYPES.VAULT_STATUS:
      sendResponse({ locked: true });
      break;

    case MESSAGE_TYPES.VAULT_LOCK:
      broadcastMessage({ type: MESSAGE_TYPES.VAULT_LOCK });
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }

  return true;
});

function broadcastMessage(message) {
  chrome.runtime.sendMessage(message).catch(() => {});
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {});
    }
  });
}

/**
 * Keyboard Commands
 */

chrome.commands.onCommand.addListener((command) => {
  console.log('[${strike.name}] Command:', command);

  switch (command) {
    case 'lock-vault':
      chrome.runtime.sendMessage({ type: MESSAGE_TYPES.VAULT_LOCK });
      break;

    case 'open-vault':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.sidePanel.open({ tabId: tabs[0].id });
        }
      });
      break;
  }
});

console.log('[${strike.name}] Service worker initialized');
`;

  writeFile(path.join(outputDir, 'background/service-worker.js'), content);
}

function generateConstants(strike, outputDir) {
  const content = `// constants.js - ${strike.name} Constants
// ${strike.id}

export const APP_SLUG = '${strike.slug}';
export const APP_NAME = '${strike.name}';
export const STRIKE_ID = '${strike.id}';
export const TARGET_SAAS = '${strike.target.name}';
export const TARGET_PRICE = ${strike.target.price || 60};

export const VAULT_STATE = {
  UNINITIALIZED: 'uninitialized',
  LOCKED: 'locked',
  UNLOCKED: 'unlocked'
};

export const MESSAGE_TYPES = {
  VAULT_UNLOCK: 'VAULT_UNLOCK',
  VAULT_LOCK: 'VAULT_LOCK',
  VAULT_STATUS: 'VAULT_STATUS',
  IMPORT_COMPLETE: 'IMPORT_COMPLETE'
};

export const STORAGE_KEYS = {
  SALT: '${strike.slug}_salt',
  VAULT_ID: '${strike.slug}_vault_id',
  ONBOARDED: '${strike.slug}_onboarded',
  SETTINGS: '${strike.slug}_settings'
};

export const SECURITY = {
  PBKDF2_ITERATIONS: 600000,
  KEY_LENGTH: 256,
  SALT_LENGTH: 32,
  AUTO_LOCK_MINUTES: 15
};

export const COPY = {
  TRUST_MESSAGE: 'Your data never leaves your device',
  SAVINGS_MESSAGE: \`You just saved $\${TARGET_PRICE}/year. Forever.\`,
  ZERO_KNOWLEDGE: 'Zero-knowledge. Unrecoverable by design.'
};
`;

  writeFile(path.join(outputDir, 'lib/constants.js'), content);
}

function generateSidepanelHTML(strike, outputDir) {
  const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${strike.name}</title>
  <link rel="stylesheet" href="../lib/aether-ui.css">
</head>
<body>
  <div class="app-container" id="app">
    <!-- Header -->
    <header class="app-header">
      <div class="app-logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>${strike.name}</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost" id="import-btn" title="Import">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button class="btn btn-ghost" id="lock-btn" title="Lock">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-content" id="main-content">
      <div class="search-container">
        <input type="text" class="search-input" placeholder="Search..." id="search-input">
      </div>

      <div id="content-list"></div>

      <div class="empty-state" id="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h3>Your vault is empty</h3>
        <p class="text-secondary">Import from ${strike.target.name} or add entries manually.</p>
        <button class="btn btn-primary" id="start-import-btn">
          Import from ${strike.target.name}
        </button>
      </div>
    </main>

    <!-- 864zeros Brand Footer -->
    <footer class="brand-footer compact">
      <div class="footer-brand">
        <span class="footer-logo">864</span>
        <span class="footer-company">zeros</span>
      </div>
      <div class="footer-mission">Organize Your Internal Architecture</div>
      <div class="footer-links">
        <a href="https://864zeros.com/privacy" target="_blank" rel="noopener">Privacy</a>
        <span class="footer-divider">·</span>
        <a href="https://864zeros.com/terms" target="_blank" rel="noopener">Terms</a>
        <span class="footer-divider">·</span>
        <a href="#" id="upgrade-link">Upgrade</a>
      </div>
      <div class="footer-copyright">© 2026 864zeros LLC. All rights reserved.</div>
    </footer>
  </div>

  <!-- Import Modal (BRK-UI-IMPORT-001) -->
  <div class="import-modal hidden" id="import-modal">
    <header class="modal-header">
      <h3>Import from ${strike.target.name}</h3>
      <button class="modal-close" id="import-modal-close" title="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </header>
    <div class="import-section p-lg">
      <div class="dropzone" id="import-dropzone">
        <div class="dropzone-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
        <div class="dropzone-text">Drop your ${strike.target.name} export file here</div>
        <div class="dropzone-hint">Or click to browse</div>
      </div>
      <input type="file" id="import-file-input" accept=".csv,.json" class="hidden">
    </div>
  </div>

  <!-- Audit Result Modal (BRK-UI-IMPORT-001) -->
  <div class="audit-modal hidden" id="audit-modal"></div>

  <script type="module" src="./app.js"></script>
</body>
</html>
`;

  writeFile(path.join(outputDir, 'sidepanel/index.html'), content);
}

function generateSidepanelApp(strike, outputDir) {
  const content = `// app.js - ${strike.name} Sidepanel Controller
// ${strike.id}
// Uses BRK-UI-IMPORT-001 Standard Import Flow

import { APP_NAME, TARGET_SAAS, TARGET_PRICE, VAULT_STATE } from '../lib/constants.js';
import { ImportFlowController } from '../lib/BRK-UI-IMPORT-001.js';
import { PricingModalController, injectPricingCSS } from '../lib/BRK-PRICING-001.js';

/**
 * ${strike.name} Application Controller
 */
class App {
  constructor() {
    this.state = VAULT_STATE.UNINITIALIZED;
    this.importFlow = null;
    this.pricingModal = null;
  }

  async init() {
    console.log(\`[\${APP_NAME}] Initializing...\`);

    // Check onboarding status
    const isOnboarded = localStorage.getItem('${strike.slug}_onboarded');

    if (!isOnboarded) {
      window.location.href = '../onboarding/index.html';
      return;
    }

    // Initialize import flow (BRK-UI-IMPORT-001)
    this.importFlow = new ImportFlowController({
      modalId: 'import-modal',
      dropzoneId: 'import-dropzone',
      fileInputId: 'import-file-input',
      auditModalId: 'audit-modal',
      triggerBtnIds: ['start-import-btn', 'import-btn'],
      closeBtnId: 'import-modal-close',
      competitorName: TARGET_SAAS,
      competitorPrice: TARGET_PRICE,
      rescueNoun: 'items',
      onImport: async (file) => {
        return await this._handleImport(file);
      },
      onAuditComplete: () => {
        this._renderContent();
      }
    });

    this.importFlow.init();

    // Initialize pricing modal (BRK-PRICING-001)
    injectPricingCSS();
    this.pricingModal = new PricingModalController({
      productName: APP_NAME,
      currentTier: 'free',
      onUpgrade: (tier) => {
        console.log(\`[\${APP_NAME}] Upgrade to:\`, tier);
      }
    });

    this._attachListeners();

    console.log(\`[\${APP_NAME}] Ready\`);
  }

  _attachListeners() {
    document.getElementById('lock-btn')?.addEventListener('click', () => {
      this._lock();
    });

    // Upgrade link in footer
    document.getElementById('upgrade-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.pricingModal.show();
    });
  }

  async _handleImport(file) {
    console.log(\`[\${APP_NAME}] Processing import:\`, file.name);

    // TODO: Implement actual parsing logic
    const content = await file.text();

    // Return audit result for the Aha Moment display
    return {
      totalImported: 0,
      auditSummary: {
        breached: 0,
        reused: 0,
        weak: 0
      }
    };
  }

  _renderContent() {
    console.log(\`[\${APP_NAME}] Rendering content\`);
    // TODO: Implement content rendering
  }

  _lock() {
    console.log(\`[\${APP_NAME}] Locking vault\`);
    // TODO: Implement lock
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
`;

  writeFile(path.join(outputDir, 'sidepanel/app.js'), content);
}

function generateOnboarding(strike, outputDir) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${strike.name}</title>
  <link rel="stylesheet" href="../lib/aether-ui.css">
</head>
<body>
  <div class="onboarding-container">
    <div class="onboarding-content">
      <h1>Welcome to ${strike.name}</h1>
      <p class="text-secondary">
        Your secure, local-first alternative to ${strike.target.name}.
        No cloud. No subscription. No compromise.
      </p>

      <div class="trust-banner mt-lg">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Zero-knowledge. Unrecoverable by design.
      </div>

      <div class="card mt-xl">
        <h3>Create Master Password</h3>
        <p class="text-secondary">This is the only password you need to remember.</p>

        <form id="master-password-form" class="mt-md">
          <div class="form-group">
            <label class="form-label" for="master-password">Master Password</label>
            <input type="password" id="master-password" required minlength="12">
          </div>

          <div class="form-group">
            <label class="form-label" for="confirm-password">Confirm Password</label>
            <input type="password" id="confirm-password" required>
          </div>

          <div id="error-message" class="text-danger mt-sm"></div>

          <button type="submit" class="btn btn-primary btn-block mt-lg">
            Create Vault
          </button>
        </form>
      </div>

      <p class="text-muted text-center mt-lg" style="font-size: 12px;">
        If you forget this password, your data cannot be recovered.
        This is a security feature, not a bug.
      </p>
    </div>
  </div>

  <script type="module" src="./master-password.js"></script>
</body>
</html>
`;

  const js = `// master-password.js - ${strike.name} Onboarding
// ${strike.id}

import { CryptoVault } from '../lib/crypto-vault.js';
import { STORAGE_KEYS, SECURITY } from '../lib/constants.js';

document.getElementById('master-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const password = document.getElementById('master-password').value;
  const confirm = document.getElementById('confirm-password').value;
  const errorDiv = document.getElementById('error-message');

  errorDiv.textContent = '';

  if (password !== confirm) {
    errorDiv.textContent = 'Passwords do not match';
    return;
  }

  if (password.length < 12) {
    errorDiv.textContent = 'Password must be at least 12 characters';
    return;
  }

  try {
    const vault = new CryptoVault();
    const { salt, vaultId } = await vault.initialize(password);

    // Store salt (not secret) and vault ID
    localStorage.setItem(STORAGE_KEYS.SALT, btoa(String.fromCharCode(...salt)));
    localStorage.setItem(STORAGE_KEYS.VAULT_ID, vaultId);
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');

    // Redirect to sidepanel
    window.location.href = '../sidepanel/index.html';
  } catch (error) {
    errorDiv.textContent = 'Failed to create vault: ' + error.message;
  }
});
`;

  writeFile(path.join(outputDir, 'onboarding/index.html'), html);
  writeFile(path.join(outputDir, 'onboarding/master-password.js'), js);
}

function generateOptions(strike, outputDir) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${strike.name} Settings</title>
  <link rel="stylesheet" href="../lib/aether-ui.css">
</head>
<body>
  <div class="options-container p-xl">
    <h1>${strike.name} Settings</h1>

    <div class="card mt-lg">
      <h3>Security</h3>
      <div class="form-group mt-md">
        <label class="form-label">Auto-lock timeout</label>
        <select id="auto-lock-timeout">
          <option value="5">5 minutes</option>
          <option value="15" selected>15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="60">1 hour</option>
        </select>
      </div>
    </div>

    <div class="card mt-lg">
      <h3>Data</h3>
      <button class="btn btn-secondary mt-md" id="export-btn">Export Vault</button>
      <button class="btn btn-danger mt-sm" id="reset-btn">Reset Vault</button>
    </div>

    <!-- 864zeros Brand Footer -->
    <footer class="brand-footer mt-xl">
      <div class="footer-brand">
        <span class="footer-logo">864</span>
        <span class="footer-company">zeros</span>
      </div>
      <div class="footer-mission">Organize Your Internal Architecture</div>
      <div class="footer-links">
        <a href="https://864zeros.com/privacy" target="_blank" rel="noopener">Privacy</a>
        <span class="footer-divider">·</span>
        <a href="https://864zeros.com/terms" target="_blank" rel="noopener">Terms</a>
        <span class="footer-divider">·</span>
        <a href="https://864zeros.com/support" target="_blank" rel="noopener">Support</a>
      </div>
      <div class="footer-copyright">© 2026 864zeros LLC. All rights reserved.</div>
    </footer>
  </div>

  <script type="module" src="./options.js"></script>
</body>
</html>
`;

  const js = `// options.js - ${strike.name} Settings
// ${strike.id}
// 864zeros LLC

console.log('[${strike.name}] Options loaded');
`;

  writeFile(path.join(outputDir, 'options/options.html'), html);
  writeFile(path.join(outputDir, 'options/options.js'), js);
}

function generateBuildManifest(strike, outputDir) {
  const content = `# ${strike.name} — Build Manifest
## Strike ID: ${strike.id}

### Target
- **SaaS:** ${strike.target.name}
- **Price:** $${strike.target.price || 60}/year
- **Pain:** ${strike.target.pain || 'TBD'}

### Our Angle
${strike.description}

### Security Architecture
- Encryption: AES-256-GCM (BRK-CRYPTO-001)
- Key Derivation: PBKDF2, 600k iterations
- Storage: IndexedDB (encrypted)
- Network: Zero calls${strike.host_permissions?.length ? ` (except: ${strike.host_permissions.join(', ')})` : ''}

### Build Status
- [x] Phase 1: Scaffold
- [ ] Phase 2: Security (master password)
- [ ] Phase 3: Migration (import from ${strike.target.name})
- [ ] Phase 4: UI Shell
- [ ] Phase 5: Features
- [ ] Phase 6: Polish
- [ ] Phase 7: Proof

---
Generated by Strike Bridge
${new Date().toISOString()}
`;

  writeFile(path.join(outputDir, 'BUILD_MANIFEST.md'), content);
}

function generateIconGenerator(strike, outputDir) {
  const content = `<!DOCTYPE html>
<html>
<head>
  <title>${strike.name} Icon Generator</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #1a1a24; color: #fff; }
    .icon-row { display: flex; gap: 20px; align-items: center; margin: 20px 0; }
    canvas { background: transparent; }
    .label { width: 80px; }
  </style>
</head>
<body>
  <h1>${strike.name} Icon Generator</h1>
  <p>Right-click each canvas to save as PNG.</p>

  <div class="icon-row"><span class="label">16x16:</span><canvas id="icon16" width="16" height="16"></canvas></div>
  <div class="icon-row"><span class="label">32x32:</span><canvas id="icon32" width="32" height="32"></canvas></div>
  <div class="icon-row"><span class="label">48x48:</span><canvas id="icon48" width="48" height="48"></canvas></div>
  <div class="icon-row"><span class="label">128x128:</span><canvas id="icon128" width="128" height="128"></canvas></div>

  <script>
    const sizes = [16, 32, 48, 128];

    function drawIcon(ctx, size) {
      const scale = size / 128;
      ctx.scale(scale, scale);

      // Background circle
      ctx.beginPath();
      ctx.arc(64, 64, 60, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a0f';
      ctx.fill();

      // Shield outline
      ctx.beginPath();
      ctx.moveTo(64, 12);
      ctx.lineTo(108, 28);
      ctx.lineTo(108, 58);
      ctx.bezierCurveTo(108, 88, 88, 108, 64, 116);
      ctx.bezierCurveTo(40, 108, 20, 88, 20, 58);
      ctx.lineTo(20, 28);
      ctx.closePath();
      ctx.strokeStyle = '#00d084';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Lock body
      ctx.beginPath();
      ctx.roundRect(44, 58, 40, 32, 4);
      ctx.fillStyle = '#00d084';
      ctx.fill();

      // Lock shackle
      ctx.beginPath();
      ctx.moveTo(52, 58);
      ctx.lineTo(52, 48);
      ctx.bezierCurveTo(52, 38, 56, 32, 64, 32);
      ctx.bezierCurveTo(72, 32, 76, 38, 76, 48);
      ctx.lineTo(76, 58);
      ctx.strokeStyle = '#00d084';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Keyhole
      ctx.beginPath();
      ctx.arc(64, 70, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a0f';
      ctx.fill();
    }

    sizes.forEach(size => {
      const canvas = document.getElementById('icon' + size);
      const ctx = canvas.getContext('2d');
      drawIcon(ctx, size);
    });
  </script>
</body>
</html>
`;

  writeFile(path.join(outputDir, 'assets/generate-icons.html'), content);
}

function copySecurityBricks(strike, outputDir) {
  // Note: In production, copy actual brick files from lib/
  // For scaffold, create placeholder with import structure

  const cryptoVault = `// crypto-vault.js - BRK-CRYPTO-001
// Placeholder - copy from 864z-build-kit/lib/

export class CryptoVault {
  async initialize(password, existingSalt = null) {
    // TODO: Implement PBKDF2 key derivation
    const salt = existingSalt || crypto.getRandomValues(new Uint8Array(32));
    const vaultId = crypto.randomUUID();
    return { salt, vaultId };
  }

  async encrypt(data) {
    // TODO: Implement AES-256-GCM encryption
    return btoa(JSON.stringify(data));
  }

  async decrypt(ciphertext) {
    // TODO: Implement AES-256-GCM decryption
    return JSON.parse(atob(ciphertext));
  }

  isUnlocked() {
    return false;
  }

  lock() {
    // TODO: Clear derived key from memory
  }
}

export class SecureVaultStorage {
  async save(vaultId, name, encrypted) {
    // TODO: Implement IndexedDB storage
  }

  async load(vaultId) {
    // TODO: Implement IndexedDB retrieval
    return null;
  }
}
`;

  writeFile(path.join(outputDir, 'lib/crypto-vault.js'), cryptoVault);
}

function copyUIBricks(strike, outputDir) {
  // Copy UI bricks from build kit
  for (const brick of UI_BRICKS) {
    const sourcePath = path.join(LIB_DIR, brick);
    const destPath = path.join(outputDir, 'lib', brick);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`  Copied: ${brick}`);
    } else {
      console.warn(`[Strike Bridge] ${brick} not found, skipping copy`);
    }
  }
}

function copyCoreBricks(strike, outputDir) {
  // Copy core bricks (864z-core.js, aether-ui.css) from build kit
  for (const brick of CORE_BRICKS) {
    const sourcePath = path.join(LIB_DIR, brick);
    const destPath = path.join(outputDir, 'lib', brick);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`  Copied: ${brick}`);
    } else {
      console.warn(`[Strike Bridge] ${brick} not found, skipping copy`);
    }
  }
}

// ============================================
// UTILITIES
// ============================================

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  Created: ${filePath}`);
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  Created: ${filePath}`);
}

// ============================================
// RUN
// ============================================

main().catch(err => {
  console.error('[Strike Bridge] Fatal error:', err);
  process.exit(1);
});
