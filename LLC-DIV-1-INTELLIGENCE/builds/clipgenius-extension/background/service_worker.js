// background/service_worker.js
import { processUrl } from '../lib/api_client.js';
import { getStorage, setStorage } from '../lib/store.js';

// --- Onboarding ---
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Here you could open a welcome page
        console.log('ClipGenius installed!');
    }
});

// --- Action Button Handler ---
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
});

// --- Main Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'clipArticle') {
        handleClipArticle(message.url)
            .then(response => sendResponse(response))
            .catch(error => sendResponse({ status: `Error: ${error.message}` }));
        return true; // Indicates an async response
    }
});

async function handleClipArticle(url) {
    try {
        // 1. Call our backend to get the cleaned content
        const processedData = await processUrl(url);

        // 2. Here you would integrate with the actual note-taking app's API
        // For now, we'll just save it to local storage as a "recent clip"
        console.log('Simulating save to Notion/Evernote with data:', processedData);

        // 3. Update our list of recent clips in storage
        const recentClips = await getStorage('recentClips', []);
        recentClips.unshift({
            url: url,
            title: processedData.title,
            timestamp: new Date().toISOString()
        });
        await setStorage('recentClips', recentClips.slice(0, 10)); // Keep only the 10 most recent

        // 4. Notify the side panel that the process is complete
        chrome.runtime.sendMessage({ action: 'clipCompleted' });
        
        return { status: 'Clip successful!' };

    } catch (error) {
        console.error('Error handling clip:', error);
        chrome.runtime.sendMessage({ action: 'updateStatus', status: `Failed: ${error.message}` });
        throw error;
    }
}
