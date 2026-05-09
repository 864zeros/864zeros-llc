/**
 * Minimal chrome.* API mock for testing ClipBoard extension.
 * Only stubs the APIs our /lib/ and service worker actually call.
 */

const storageData = {};
const changeListeners = [];

export const chrome = {
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
    getURL: (path) => `chrome-extension://test-id/${path}`
  },

  sidePanel: {
    setPanelBehavior: async () => {},
    setOptions: async () => {}
  },

  contextMenus: {
    create: () => {},
    onClicked: {
      addListener: () => {}
    }
  },

  tabs: {
    captureVisibleTab: async () => 'data:image/png;base64,mock',
    query: async () => [{ id: 1, url: 'https://example.com', title: 'Test' }]
  },

  downloads: {
    download: async () => 1
  },

  debugger: {
    attach: async () => {},
    detach: async () => {},
    sendCommand: async () => ({ data: 'mock-pdf-base64' })
  },

  scripting: {
    executeScript: async () => [{ result: { text: 'mock text', url: 'https://example.com', title: 'Test' } }]
  },

  alarms: {
    _alarms: {},
    create: (name, info) => { chrome.alarms._alarms[name] = info; },
    clear: (name) => { delete chrome.alarms._alarms[name]; },
    onAlarm: {
      addListener: () => {}
    }
  },

  identity: {
    getAuthToken: async ({ interactive }) => ({ token: 'mock-token-12345' }),
    removeCachedAuthToken: async () => {}
  }
};

// Reset all state between tests
export function resetChromeMock() {
  Object.keys(storageData).forEach(k => delete storageData[k]);
  changeListeners.length = 0;
  chrome.runtime.onMessage._listeners.length = 0;
  chrome.alarms._alarms = {};
}
