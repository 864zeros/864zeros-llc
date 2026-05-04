// sidepanel/main.js
import { getStorage, setStorage } from '../lib/store.js';

const clipButton = document.getElementById('clip-article-btn');
const statusDiv = document.getElementById('status');
const recentClipsContainer = document.getElementById('recent-clips-container');

// Main action: message the service worker to start the clipping process
clipButton.addEventListener('click', async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            statusDiv.textContent = 'Clipping...';
            const response = await chrome.runtime.sendMessage({
                action: 'clipArticle',
                tabId: tab.id,
                url: tab.url
            });
            statusDiv.textContent = response.status;
            await renderRecentClips();
        }
    } catch (error) {
        statusDiv.textContent = `Error: ${error.message}`;
    }
});

// Render the list of recent clips from storage
async function renderRecentClips() {
    const clips = await getStorage('recentClips', []);
    if (clips.length === 0) {
        recentClipsContainer.innerHTML = '<p>No clips yet.</p>';
        return;
    }

    recentClipsContainer.innerHTML = '';
    const list = document.createElement('ul');
    clips.slice(0, 5).forEach(clip => { // Show last 5 clips
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = clip.url;
        link.textContent = clip.title || clip.url;
        link.target = '_blank';
        item.appendChild(link);
        list.appendChild(item);
    });
    recentClipsContainer.appendChild(list);
}

// Listen for updates from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateStatus') {
        statusDiv.textContent = message.status;
    }
    if (message.action === 'clipCompleted') {
        renderRecentClips();
    }
});

// Initial render on load
renderRecentClips();
