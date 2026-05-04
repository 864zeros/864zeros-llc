/**
 * Chrome API Mock for 864zeros Extension Testing
 *
 * A lightweight mock that covers the APIs our /lib/ and service worker use.
 * Copy to your extension's tests/ directory and import in setup.js.
 *
 * Covers: storage, runtime, sidePanel, contextMenus, tabs, downloads,
 *         debugger, scripting, alarms, identity
 *
 * Usage:
 *   import { chrome, resetChromeMock } from './chrome-mock.js';
 *   globalThis.chrome = chrome;
 *   beforeEach(() => resetChromeMock());
 */

const storageData = {};
const changeListeners = [];

export const chrome = {
  // --- Storage API ---
  storage: {
    local: {
      get: async (keys) => {
        if (typeof keys === 'string') {
          return { [keys]: storageData[keys] ?? undefined };
        }
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(k => { result[k] = storageData[k] ?? undefined; });
          return result;
        }
        // No args = return all
        return { ...storageData };
      },
      set: async (items) => {
        const oldValues = {};
        const changes = {};
        Object.entries(items).forEach(([key, value]) => {
          oldValues[key] = storageData[key];
          storageData[key] = value;
          changes[key] = { oldValue: oldValues[key], newValue: value };
        });
        // Notify listeners
        changeListeners.forEach(fn => fn(changes, 'local'));
      },
      remove: async (keys) => {
        const toRemove = Array.isArray(keys) ? keys : [keys];
        const changes = {};
        toRemove.forEach(k => {
          changes[k] = { oldValue: storageData[k] };
          delete storageData[k];
        });
        changeListeners.forEach(fn => fn(changes, 'local'));
      },
      clear: async () => {
        Object.keys(storageData).forEach(k => delete storageData[k]);
      }
    },
    onChanged: {
      addListener: (fn) => changeListeners.push(fn),
      removeListener: (fn) => {
        const idx = changeListeners.indexOf(fn);
        if (idx >= 0) changeListeners.splice(idx, 1);
      }
    }
  },

  // --- Runtime API ---
  runtime: {
    sendMessage: async (message) => message,
    onMessage: {
      _listeners: [],
      addListener: (fn) => chrome.runtime.onMessage._listeners.push(fn),
      removeListener: (fn) => {
        const idx = chrome.runtime.onMessage._listeners.indexOf(fn);
        if (idx >= 0) chrome.runtime.onMessage._listeners.splice(idx, 1);
      }
    },
    onInstalled: {
      addListener: (fn) => fn({ reason: 'install' })
    },
    getURL: (path) => `chrome-extension://test-extension-id/${path}`
  },

  // --- Side Panel API ---
  sidePanel: {
    setPanelBehavior: async () => {},
    setOptions: async () => {}
  },

  // --- Context Menus API ---
  contextMenus: {
    create: () => {},
    update: () => {},
    remove: () => {},
    onClicked: {
      addListener: () => {}
    }
  },

  // --- Tabs API ---
  tabs: {
    captureVisibleTab: async (windowId, options) => 'data:image/png;base64,mockImageData',
    query: async (queryInfo) => [{
      id: 1,
      url: 'https://example.com/page',
      title: 'Example Page',
      active: true
    }],
    sendMessage: async (tabId, message) => ({ success: true }),
    create: async (createProperties) => ({ id: 2, ...createProperties })
  },

  // --- Downloads API ---
  downloads: {
    download: async (options) => 1, // Returns download ID
    onChanged: {
      addListener: () => {}
    }
  },

  // --- Debugger API (for PDF capture) ---
  debugger: {
    attach: async (target, requiredVersion) => {},
    detach: async (target) => {},
    sendCommand: async (target, method, params) => {
      if (method === 'Page.printToPDF') {
        return { data: 'bW9jay1wZGYtZGF0YQ==' }; // "mock-pdf-data" in base64
      }
      return {};
    }
  },

  // --- Scripting API ---
  scripting: {
    executeScript: async (injection) => [{
      result: {
        text: 'Mock captured text',
        url: 'https://example.com',
        title: 'Example Page'
      }
    }]
  },

  // --- Alarms API ---
  alarms: {
    _alarms: {},
    create: (name, alarmInfo) => {
      chrome.alarms._alarms[name] = alarmInfo;
    },
    get: async (name) => chrome.alarms._alarms[name],
    clear: async (name) => {
      delete chrome.alarms._alarms[name];
      return true;
    },
    onAlarm: {
      addListener: () => {}
    }
  },

  // --- Identity API (for OAuth) ---
  identity: {
    getAuthToken: async (options) => ({ token: 'mock-oauth-token-12345' }),
    removeCachedAuthToken: async (details) => {},
    launchWebAuthFlow: async (details) => 'https://callback.url?code=mock-auth-code'
  },

  // --- Action API (toolbar icon) ---
  action: {
    setIcon: async (details) => {},
    setBadgeText: async (details) => {},
    setBadgeBackgroundColor: async (details) => {}
  }
};

/**
 * Reset all mock state between tests.
 * Call this in beforeEach() to ensure test isolation.
 */
export function resetChromeMock() {
  // Clear storage
  Object.keys(storageData).forEach(k => delete storageData[k]);

  // Clear listeners
  changeListeners.length = 0;
  chrome.runtime.onMessage._listeners.length = 0;

  // Clear alarms
  chrome.alarms._alarms = {};
}

/**
 * Helper to simulate a storage change event.
 * Useful for testing reactive storage patterns.
 */
export function simulateStorageChange(key, newValue, oldValue) {
  const changes = {
    [key]: { newValue, oldValue }
  };
  changeListeners.forEach(fn => fn(changes, 'local'));
}

/**
 * Helper to get raw storage data for assertions.
 */
export function getStorageData() {
  return { ...storageData };
}
