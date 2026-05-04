// lib/store.js
// A simple wrapper for chrome.storage.local for easier state management.

export async function getStorage(key, defaultValue = null) {
    const result = await chrome.storage.local.get(key);
    return result[key] || defaultValue;
}

export async function setStorage(key, value) {
    return chrome.storage.local.set({ [key]: value });
}
