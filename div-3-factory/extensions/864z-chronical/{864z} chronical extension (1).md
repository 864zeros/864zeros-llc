I'll update the complete specification with \*\*Chronicle\*\* as the product name.

\---

\`\`\`markdown  
\# Chronicle  
\#\# Complete Technical Specification v1.0

\---

\#\# 1\. Product Overview

\*\*Mission:\*\* Turn ephemeral AI conversations into a searchable, actionable knowledge base.

\*\*Core Value Proposition:\*\* Never lose an insight. Capture automatically, find instantly, integrate seamlessly.

\*\*Target User:\*\* Knowledge workers using 2+ AI platforms (Claude, ChatGPT, Gemini) who reference past conversations weekly.

\*\*UI Paradigm:\*\* Side panel only. No popups. Persistent sidebar interface docked to browser window.

\---

\#\# 2\. Technical Architecture

\#\#\# 2.1 System Diagram

\`\`\`  
┌─────────────────────────────────────────────────────────────────────────┐  
│                           BROWSER WINDOW                                 │  
│  ┌─────────────────────────────────────────────────────────────────┐    │  
│  │                         CHRONICLE SIDE PANEL                     │    │  
│  │  ┌─────────────────────────────────────────────────────────┐    │    │  
│  │  │  Search Bar                                             │    │    │  
│  │  │  \[🔍 Search your chronicle...\]                         │    │    │  
│  │  └─────────────────────────────────────────────────────────┘    │    │  
│  │  ┌─────────────────────────────────────────────────────────┐    │    │  
│  │  │  Stats & Filters                                        │    │    │  
│  │  │  📜 247 entries │ 🕐 30 days │ ⚡ 12 today            │    │    │  
│  │  │  \[All\] \[Claude\] \[Gemini\] \[Tagged\] \[Starred\]           │    │    │  
│  │  └─────────────────────────────────────────────────────────┘    │    │  
│  │  ┌─────────────────────────────────────────────────────────┐    │    │  
│  │  │  Live Capture Indicator                                 │    │    │  
│  │  │  ● Recording from Claude...                             │    │    │  
│  │  └─────────────────────────────────────────────────────────┘    │    │  
│  │  ┌─────────────────────────────────────────────────────────┐    │    │  
│  │  │  Chronicle Entries (Virtual Scrolled)                   │    │    │  
│  │  │  ┌─ 🔴 Now: Project architecture... (Claude)           │    │    │  
│  │  │  ├─ React performance tuning (Gemini)                  │    │    │  
│  │  │  ├─ ⭐ API design patterns (Claude)                    │    │    │  
│  │  │  └─ ...                                               │    │    │  
│  │  └─────────────────────────────────────────────────────────┘    │    │  
│  │  ┌─────────────────────────────────────────────────────────┐    │    │  
│  │  │  Entry Detail (Slide-over)                              │    │    │  
│  │  │  \[Full conversation, export, annotate, delete\]         │    │    │  
│  │  └─────────────────────────────────────────────────────────┘    │    │  
│  │  ┌─────────────────────────────────────────────────────────┐    │    │  
│  │  │  Bottom Toolbar                                         │    │    │  
│  │  │  \[⚙️\] \[📤 Export\] \[☁️ Sync\] \[?\]                       │    │    │  
│  │  └─────────────────────────────────────────────────────────┘    │    │  
│  └─────────────────────────────────────────────────────────────────┘    │  
│                              │                                          │  
│                              │ chrome.runtime.connect()                 │  
│                              ▼                                          │  
│  ┌─────────────────────────────────────────────────────────────────┐    │  
│  │  CONTENT SCRIPT (per tab)                                        │    │  
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │    │  
│  │  │ Scribe      │  │ Page        │  │ Chronicle               │  │    │  
│  │  │ (Provider   │──│ Observer    │──│ Stream                  │  │    │  
│  │  │  Adapter)   │  │ (Mutation)  │  │ (to Side Panel)         │  │    │  
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │    │  
│  └─────────────────────────────────────────────────────────────────┘    │  
│                              │                                          │  
│                              │ chrome.runtime.sendMessage               │  
│                              ▼                                          │  
│  ┌─────────────────────────────────────────────────────────────────┐    │  
│  │  SERVICE WORKER (The Archive Keeper)                             │    │  
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │    │  
│  │  │ Chronicle   │  │ IndexDB     │  │ Vault                   │  │    │  
│  │  │ Clock       │──│ (The        │──│ (Cloud                  │  │    │  
│  │  │ (Alarms)    │  │  Library)   │  │  Sync)                  │  │    │  
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │    │  
│  └─────────────────────────────────────────────────────────────────┘    │  
└─────────────────────────────────────────────────────────────────────────┘  
\`\`\`

\#\#\# 2.2 Side Panel Communication Flow

\`\`\`  
User clicks Chronicle icon or presses Cmd+Shift+Y  
         │  
         ▼  
┌─────────────────┐  
│ chrome.sidePanel │─── Opens Chronicle side panel  
│ .open()         │  
└─────────────────┘  
         │  
         ▼  
┌─────────────────┐  
│ Chronicle loads │─── Establishes persistent port: "chronicle-stream"  
│ sidepanel.html  │  
└─────────────────┘  
         │  
         ▼  
┌─────────────────┐  
│ Port-based      │─── Real-time bi-directional communication  
│ messaging       │  
└─────────────────┘  
         │  
    ┌────┴────┐  
    ▼         ▼  
┌───────┐  ┌────────┐  
│ Query │  │ Live   │  
│ The   │  │ scribe │  
│Library│  │ updates│  
└───────┘  └────────┘  
\`\`\`

\---

\#\# 3\. Manifest V3 Configuration

\`\`\`json  
{  
  "manifest\_version": 3,  
  "name": "Chronicle",  
  "version": "1.0.0",  
  "description": "Your complete AI conversation history. Automatically captured, instantly searchable.",  
  "permissions": \[  
    "storage",  
    "activeTab",  
    "alarms",  
    "identity",  
    "sidePanel"  
  \],  
  "host\_permissions": \[  
    "https://claude.ai/\*",  
    "https://gemini.google.com/\*",  
    "https://aistudio.google.com/\*",  
    "https://chat.openai.com/\*",  
    "https://chatgpt.com/\*"  
  \],  
  "background": {  
    "service\_worker": "background.js",  
    "type": "module"  
  },  
  "content\_scripts": \[  
    {  
      "matches": \[  
        "https://claude.ai/\*",  
        "https://gemini.google.com/\*",  
        "https://aistudio.google.com/\*",  
        "https://chat.openai.com/\*",  
        "https://chatgpt.com/\*"  
      \],  
      "js": \["content.js"\],  
      "run\_at": "document\_idle"  
    }  
  \],  
  "side\_panel": {  
    "default\_path": "sidepanel.html"  
  },  
  "action": {  
    "default\_title": "Open Chronicle",  
    "default\_icon": {  
      "16": "icons/chronicle-16.png",  
      "48": "icons/chronicle-48.png",  
      "128": "icons/chronicle-128.png"  
    }  
  },  
  "commands": {  
    "\_execute\_action": {  
      "suggested\_key": {  
        "default": "Ctrl+Shift+Y",  
        "mac": "Command+Shift+Y"  
      }  
    }  
  },  
  "icons": {  
    "16": "icons/chronicle-16.png",  
    "48": "icons/chronicle-48.png",  
    "128": "icons/chronicle-128.png"  
  }  
}  
\`\`\`

\---

\#\# 4\. Side Panel Implementation

\#\#\# 4.1 Side Panel HTML (sidepanel.html)

\`\`\`html  
\<\!DOCTYPE html\>  
\<html\>  
\<head\>  
  \<meta charset="UTF-8"\>  
  \<meta name="viewport" content="width=device-width, initial-scale=1.0"\>  
  \<title\>Chronicle\</title\>  
  \<link rel="stylesheet" href="sidepanel.css"\>  
\</head\>  
\<body\>  
  \<div id="chronicle-app"\>  
    \<\!-- Header \--\>  
    \<header class="chronicle-header"\>  
      \<div class="brand"\>  
        \<span class="logo"\>📜\</span\>  
        \<h1\>Chronicle\</h1\>  
      \</div\>  
      \<div class="library-stats"\>  
        \<span id="entry-count"\>0\</span\> entries  
        \<span class="separator"\>•\</span\>  
        \<span id="retention-badge" class="badge apprentice"\>30 days\</span\>  
      \</div\>  
    \</header\>

    \<\!-- Search & Filters \--\>  
    \<section class="discovery"\>  
      \<div class="search-wells"\>  
        \<input   
          type="search"   
          id="chronicle-search"   
          placeholder="Search your chronicle..."  
          autocomplete="off"  
        \>  
        \<button id="search-clear" class="icon-btn" hidden\>×\</button\>  
      \</div\>  
        
      \<div class="scribe-filters"\>  
        \<button class="filter-btn active" data-filter="all"\>All\</button\>  
        \<button class="filter-btn" data-filter="claude"\>Claude\</button\>  
        \<button class="filter-btn" data-filter="gemini"\>Gemini\</button\>  
        \<button class="filter-btn" data-filter="starred"\>Starred\</button\>  
      \</div\>  
    \</section\>

    \<\!-- Live Scribe Indicator \--\>  
    \<div id="scribe-active" class="scribe-indicator hidden"\>  
      \<span class="pulse"\>\</span\>  
      \<span id="scribe-text"\>Recording from Claude...\</span\>  
    \</div\>

    \<\!-- Chronicle Entries \--\>  
    \<section class="the-library"\>  
      \<div id="chronicle-entries" class="entries-list"\>  
        \<\!-- Virtual scrolled chronicle entries \--\>  
      \</div\>  
      \<div id="empty-library" class="empty-state hidden"\>  
        \<div class="empty-icon"\>📭\</div\>  
        \<p\>Your chronicle is empty.\</p\>  
        \<p class="sub"\>Visit Claude, ChatGPT, or Gemini to begin recording.\</p\>  
      \</div\>  
    \</section\>

    \<\!-- Entry Detail View \--\>  
    \<div id="entry-detail" class="detail-pane hidden"\>  
      \<div class="detail-header"\>  
        \<button id="detail-back" class="icon-btn"\>←\</button\>  
        \<h2 id="detail-title"\>Entry\</h2\>  
        \<div class="detail-actions"\>  
          \<button id="detail-star" class="icon-btn"\>☆\</button\>  
          \<button id="detail-annotate" class="icon-btn"\>📝\</button\>  
          \<button id="detail-export" class="icon-btn"\>📤\</button\>  
          \<button id="detail-delete" class="icon-btn danger"\>🗑\</button\>  
        \</div\>  
      \</div\>  
      \<div id="detail-scroll" class="detail-scroll"\>  
        \<div id="detail-content" class="detail-content"\>  
          \<\!-- Message thread \--\>  
        \</div\>  
      \</div\>  
      \<div class="detail-provenance"\>  
        \<span id="detail-scribe"\>\</span\>  
        \<span id="detail-timestamp"\>\</span\>  
        \<span id="detail-model"\>\</span\>  
      \</div\>  
    \</div\>

    \<\!-- Bottom Toolbar \--\>  
    \<footer class="chronicle-tools"\>  
      \<button id="tool-settings" class="tool-btn" title="Settings"\>⚙️\</button\>  
      \<button id="tool-export" class="tool-btn" title="Export Chronicle"\>📤\</button\>  
      \<button id="tool-sync" class="tool-btn vault" title="Vault Sync"\>☁️\</button\>  
      \<button id="tool-help" class="tool-btn" title="Help"\>?\</button\>  
    \</footer\>  
  \</div\>

  \<\!-- Settings Modal \--\>  
  \<div id="settings-modal" class="modal hidden"\>  
    \<div class="modal-content"\>  
      \<h2\>Chronicle Settings\</h2\>  
        
      \<section\>  
        \<h3\>Library Access\</h3\>  
        \<label class="tier-option"\>  
          \<input type="radio" name="tier" value="apprentice" checked\>  
          \<div\>  
            \<strong\>Apprentice\</strong\>  
            \<span\>30 days • 500 entries • Local only\</span\>  
          \</div\>  
        \</label\>  
        \<label class="tier-option"\>  
          \<input type="radio" name="tier" value="scribe" disabled\>  
          \<div\>  
            \<strong\>Scribe\</strong\>  
            \<span\>Unlimited • Vault sync • Advanced search\</span\>  
            \<button class="upgrade-btn"\>Upgrade\</button\>  
          \</div\>  
        \</label\>  
      \</section\>  
        
      \<section\>  
        \<h3\>Recording\</h3\>  
        \<label\>  
          \<input type="checkbox" id="auto-scribe" checked\>  
          Automatically record conversations  
        \</label\>  
        \<label\>  
          \<input type="checkbox" id="capture-code" checked\>  
          Preserve code blocks  
        \</label\>  
        \<label\>  
          \<input type="checkbox" id="capture-attachments"\>  
          Record attachments (images, files)  
        \</label\>  
      \</section\>  
        
      \<section\>  
        \<h3\>Scribes\</h3\>  
        \<label\>\<input type="checkbox" checked\> Claude.ai\</label\>  
        \<label\>\<input type="checkbox" checked\> Gemini\</label\>  
        \<label\>\<input type="checkbox"\> ChatGPT (beta)\</label\>  
      \</section\>  
        
      \<div class="modal-actions"\>  
        \<button id="settings-close"\>Close\</button\>  
        \<button id="settings-save" class="primary"\>Save\</button\>  
      \</div\>  
    \</div\>  
  \</div\>

  \<script src="sidepanel.js" type="module"\>\</script\>  
\</body\>  
\</html\>  
\`\`\`

\#\#\# 4.2 Side Panel JavaScript (sidepanel.js)

\`\`\`javascript  
// sidepanel.js \- Chronicle Library Interface

const chronicleStream \= chrome.runtime.connect({ name: 'chronicle-stream' });

class ChronicleLibrary {  
  constructor() {  
    this.entries \= \[\];  
    this.filteredEntries \= \[\];  
    this.currentFilter \= 'all';  
    this.searchQuery \= '';  
    this.selectedEntry \= null;  
    this.activeScribe \= null;  
      
    this.init();  
  }  
    
  async init() {  
    this.bindEvents();  
    this.setupStreamListeners();  
    await this.loadLibrary();  
    this.checkActiveScribe();  
  }  
    
  bindEvents() {  
    // Search  
    const searchInput \= document.getElementById('chronicle-search');  
    const searchClear \= document.getElementById('search-clear');  
      
    searchInput.addEventListener('input', (e) \=\> {  
      this.searchQuery \= e.target.value;  
      searchClear.hidden \= \!this.searchQuery;  
      this.applyFilters();  
    });  
      
    searchClear.addEventListener('click', () \=\> {  
      searchInput.value \= '';  
      this.searchQuery \= '';  
      searchClear.hidden \= true;  
      this.applyFilters();  
    });  
      
    // Filter tabs  
    document.querySelectorAll('.scribe-filters .filter-btn').forEach(btn \=\> {  
      btn.addEventListener('click', () \=\> {  
        document.querySelectorAll('.scribe-filters .filter-btn').forEach(b \=\> b.classList.remove('active'));  
        btn.classList.add('active');  
        this.currentFilter \= btn.dataset.filter;  
        this.applyFilters();  
      });  
    });  
      
    // Toolbar  
    document.getElementById('tool-settings').addEventListener('click', () \=\> {  
      document.getElementById('settings-modal').classList.remove('hidden');  
    });  
      
    document.getElementById('settings-close').addEventListener('click', () \=\> {  
      document.getElementById('settings-modal').classList.add('hidden');  
    });  
      
    document.getElementById('tool-export').addEventListener('click', () \=\> {  
      this.exportChronicle();  
    });  
      
    // Detail view  
    document.getElementById('detail-back').addEventListener('click', () \=\> {  
      this.closeDetail();  
    });  
  }  
    
  setupStreamListeners() {  
    chronicleStream.onMessage.addListener((msg) \=\> {  
      switch (msg.type) {  
        case 'ENTRY\_RECORDED':  
          this.handleNewEntry(msg.data);  
          break;  
        case 'SCRIBE\_STARTED':  
          this.showActiveScribe(msg.scribe);  
          break;  
        case 'SCRIBE\_ENDED':  
          this.hideActiveScribe();  
          break;  
        case 'SYNC\_STATUS':  
          this.updateVaultStatus(msg.status);  
          break;  
      }  
    });  
  }  
    
  async loadLibrary() {  
    chronicleStream.postMessage({ type: 'GET\_LIBRARY' });  
      
    const response \= await chrome.runtime.sendMessage({ type: 'QUERY\_LIBRARY' });  
    this.entries \= response.entries || \[\];  
    this.applyFilters();  
  }  
    
  applyFilters() {  
    let filtered \= this.entries;  
      
    // Scribe filter  
    if (this.currentFilter \!== 'all') {  
      if (this.currentFilter \=== 'starred') {  
        filtered \= filtered.filter(e \=\> e.starred);  
      } else {  
        filtered \= filtered.filter(e \=\> e.scribe \=== this.currentFilter);  
      }  
    }  
      
    // Search filter  
    if (this.searchQuery) {  
      const query \= this.searchQuery.toLowerCase();  
      filtered \= filtered.filter(e \=\>   
        e.title?.toLowerCase().includes(query) ||  
        e.excerpt?.toLowerCase().includes(query)  
      );  
    }  
      
    this.filteredEntries \= filtered;  
    this.renderLibrary();  
  }  
    
  renderLibrary() {  
    const list \= document.getElementById('chronicle-entries');  
    const empty \= document.getElementById('empty-library');  
      
    if (this.filteredEntries.length \=== 0\) {  
      list.innerHTML \= '';  
      empty.classList.remove('hidden');  
      return;  
    }  
      
    empty.classList.add('hidden');  
      
    list.innerHTML \= this.filteredEntries.map(entry \=\> \`  
      \<article class="chronicle-entry" data-id="${entry.id}"\>  
        \<header class="entry-header"\>  
          \<span class="entry-scribe ${entry.scribe}"\>${entry.scribe}\</span\>  
          ${entry.starred ? '\<span class="star"\>★\</span\>' : ''}  
          \<time class="entry-date"\>${this.formatDate(entry.recordedAt)}\</time\>  
        \</header\>  
        \<h3 class="entry-title"\>${this.escapeHtml(entry.title || 'Untitled Entry')}\</h3\>  
        \<p class="entry-excerpt"\>${this.escapeHtml(entry.excerpt || '')}\</p\>  
        \<footer class="entry-meta"\>  
          \<span\>${entry.messageCount} exchanges\</span\>  
          ${entry.model ? \`\<span class="model"\>${entry.model}\</span\>\` : ''}  
        \</footer\>  
      \</article\>  
    \`).join('');  
      
    list.querySelectorAll('.chronicle-entry').forEach(article \=\> {  
      article.addEventListener('click', () \=\> {  
        this.openEntry(article.dataset.id);  
      });  
    });  
  }  
    
  async openEntry(id) {  
    this.selectedEntry \= id;  
    const entry \= this.entries.find(e \=\> e.id \=== id);  
    if (\!entry) return;  
      
    const response \= await chrome.runtime.sendMessage({  
      type: 'GET\_ENTRY',  
      entryId: id  
    });  
      
    document.getElementById('detail-title').textContent \= entry.title || 'Untitled Entry';  
    document.getElementById('detail-scribe').textContent \= entry.scribe;  
    document.getElementById('detail-timestamp').textContent \= this.formatDate(entry.recordedAt);  
    document.getElementById('detail-model').textContent \= entry.model || '';  
      
    const content \= document.getElementById('detail-content');  
    content.innerHTML \= response.exchanges.map(ex \=\> \`  
      \<div class="exchange ${ex.role}"\>  
        \<header class="exchange-header"\>${ex.role}\</header\>  
        \<div class="exchange-body"\>${this.formatExchange(ex.content)}\</div\>  
      \</div\>  
    \`).join('');  
      
    document.getElementById('entry-detail').classList.remove('hidden');  
  }  
    
  closeDetail() {  
    document.getElementById('entry-detail').classList.add('hidden');  
    this.selectedEntry \= null;  
  }  
    
  handleNewEntry(entry) {  
    const idx \= this.entries.findIndex(e \=\> e.id \=== entry.id);  
    if (idx \>= 0\) {  
      this.entries\[idx\] \= entry;  
    } else {  
      this.entries.unshift(entry);  
    }  
    this.applyFilters();  
    document.getElementById('entry-count').textContent \= this.entries.length;  
  }  
    
  showActiveScribe(scribe) {  
    this.activeScribe \= scribe;  
    const indicator \= document.getElementById('scribe-active');  
    document.getElementById('scribe-text').textContent \= \`Recording from ${scribe}...\`;  
    indicator.classList.remove('hidden');  
  }  
    
  hideActiveScribe() {  
    this.activeScribe \= null;  
    document.getElementById('scribe-active').classList.add('hidden');  
  }  
    
  checkActiveScribe() {  
    chrome.tabs.query({ active: true, currentWindow: true }, tabs \=\> {  
      if (tabs\[0\]) {  
        chrome.tabs.sendMessage(tabs\[0\].id, { type: 'CHECK\_SCRIBE\_STATUS' });  
      }  
    });  
  }  
    
  async exportChronicle() {  
    const format \= 'json';  
    const response \= await chrome.runtime.sendMessage({  
      type: 'EXPORT\_CHRONICLE',  
      format,  
      ids: this.filteredEntries.map(e \=\> e.id)  
    });  
      
    if (response.blob) {  
      const url \= URL.createObjectURL(await (await fetch(response.blob)).blob());  
      const a \= document.createElement('a');  
      a.href \= url;  
      a.download \= \`chronicle-export-${new Date().toISOString().split('T')\[0\]}.json\`;  
      a.click();  
      URL.revokeObjectURL(url);  
    }  
  }  
    
  formatDate(dateString) {  
    const d \= new Date(dateString);  
    const now \= new Date();  
    const diff \= now \- d;  
      
    if (diff \< 60000\) return 'just now';  
    if (diff \< 3600000\) return \`${Math.floor(diff / 60000)}m ago\`;  
    if (diff \< 86400000\) return \`${Math.floor(diff / 3600000)}h ago\`;  
    if (diff \< 604800000\) return \`${Math.floor(diff / 86400000)}d ago\`;  
      
    return d.toLocaleDateString();  
  }  
    
  formatExchange(content) {  
    return this.escapeHtml(content)  
      .replace(/\\n/g, '\<br\>')  
      .replace(/\`\`\`(\\w+)?\\n(\[\\s\\S\]\*?)\`\`\`/g, '\<pre\>\<code\>$2\</code\>\</pre\>');  
  }  
    
  escapeHtml(text) {  
    const div \= document.createElement('div');  
    div.textContent \= text;  
    return div.innerHTML;  
  }  
}

// Initialize Chronicle  
new ChronicleLibrary();  
\`\`\`

\---

\#\# 5\. Universal Data Schema (The Chronicle Format)

\`\`\`typescript  
// Types shared across all components

interface ChronicleEntry {  
  id: string;                    // UUID v4  
  scribe: 'claude' | 'gemini' | 'chatgpt';  // The platform recorded  
  sourceId: string;              // Original platform conversation ID  
  title: string | null;          // Auto-generated or user-edited  
  excerpt: string | null;        // First 200 chars for list view  
  recordedAt: string;            // ISO 8601  
  updatedAt: string;  
  starred: boolean;  
  tags: string\[\];  
  annotation: string | null;     // User notes about this entry  
  messageCount: number;  
  model?: string;                // AI model used  
  metadata: {  
    url: string;                 // Source URL  
    captureMethod: 'dom';  
    version: '1.0';  
  };  
}

interface Exchange {  
  id: string;  
  entryId: string;  
  role: 'user' | 'assistant' | 'system';  
  content: string;               // Markdown preserved  
  timestamp: string;  
  sequence: number;              // Order in conversation  
  citations?: string\[\];          // Web sources, references  
  attachments?: Attachment\[\];  
}

interface Attachment {  
  type: 'image' | 'file' | 'code';  
  name?: string;  
  mimeType?: string;  
  contentRef?: string;           // Local blob URL or vault reference  
}

interface ChronicleIndex {  
  term: string;  
  entries: string\[\];             // Entry IDs containing term  
  exchanges: Record\<string, number\[\]\>; // exchangeId \-\> positions  
  lastIndexed: string;  
}  
\`\`\`

\---

\#\# 6\. Scribe Adapters (Platform-Specific Recorders)

\#\#\# 6.1 Base Scribe Interface

\`\`\`typescript  
interface ScribeAdapter {  
  readonly name: 'claude' | 'gemini' | 'chatgpt';  
  readonly domains: string\[\];  
    
  recognizes(url: string): boolean;  
  identifySource(): string | null;     // Extract conversation ID  
  readTitle(): string | null;  
  readModel(): string | null;  
  recordExchanges(): Exchange\[\];  
  watch(callback: (event: ScribeEvent) \=\> void): () \=\> void;  
}

type ScribeEvent \=   
  | { type: 'exchanges\_added'; sourceId: string; count: number }  
  | { type: 'source\_changed'; sourceId: string | null };  
\`\`\`

\#\#\# 6.2 The Claude Scribe

\`\`\`typescript  
// src/scribes/claude.ts

export const ClaudeScribe: ScribeAdapter \= {  
  name: 'claude',  
  domains: \['claude.ai'\],  
    
  recognizes(url: string): boolean {  
    return url.includes('claude.ai');  
  },  
    
  identifySource(): string | null {  
    const match \= window.location.pathname.match(/\\/chat\\/(\[a-f0-9-\]{36})/);  
    return match ? match\[1\] : null;  
  },  
    
  readTitle(): string | null {  
    const firstUser \= document.querySelector('\[data-testid="user-message"\]');  
    if (firstUser) {  
      const text \= firstUser.textContent?.slice(0, 100\) || 'Untitled';  
      return text.length \> 100 ? text \+ '...' : text;  
    }  
    return null;  
  },  
    
  readModel(): string | null {  
    const badge \= document.querySelector('\[data-testid="model-badge"\]');  
    return badge?.textContent || null;  
  },  
    
  recordExchanges(): Exchange\[\] {  
    const turns \= document.querySelectorAll('\[data-testid="conversation-turn"\]');  
    const exchanges: Exchange\[\] \= \[\];  
      
    turns.forEach((turn, idx) \=\> {  
      const isUser \= turn.querySelector('\[data-testid="user-message"\]') \!== null;  
      const contentEl \= isUser   
        ? turn.querySelector('.whitespace-pre-wrap')  
        : turn.querySelector('.font-claude-message');  
        
      if (\!contentEl) return;  
        
      const citations: string\[\] \= \[\];  
      turn.querySelectorAll('a\[href^="https://"\]').forEach(a \=\> {  
        citations.push((a as HTMLAnchorElement).href);  
      });  
        
      exchanges.push({  
        id: \`${this.identifySource()}-${idx}\`,  
        entryId: this.identifySource() || 'unknown',  
        role: isUser ? 'user' : 'assistant',  
        content: this.transcribe(contentEl),  
        timestamp: new Date().toISOString(),  
        sequence: idx,  
        citations  
      });  
    });  
      
    return exchanges;  
  },  
    
  watch(callback: (event: ScribeEvent) \=\> void): () \=\> void {  
    let lastCount \= 0;  
    let debounceTimer: number;  
      
    const observer \= new MutationObserver(() \=\> {  
      const currentCount \= document.querySelectorAll('\[data-testid="conversation-turn"\]').length;  
        
      if (currentCount \!== lastCount) {  
        lastCount \= currentCount;  
        clearTimeout(debounceTimer);  
        debounceTimer \= window.setTimeout(() \=\> {  
          callback({  
            type: 'exchanges\_added',  
            sourceId: this.identifySource(),  
            count: currentCount  
          });  
        }, 1000);  
      }  
    });  
      
    const container \= document.querySelector('\[data-testid="conversation-container"\]')   
      || document.body;  
      
    observer.observe(container, { childList: true, subtree: true });  
      
    let lastUrl \= location.href;  
    const navObserver \= new MutationObserver(() \=\> {  
      if (location.href \!== lastUrl) {  
        lastUrl \= location.href;  
        callback({  
          type: 'source\_changed',  
          sourceId: this.identifySource()  
        });  
      }  
    });  
      
    navObserver.observe(document, { subtree: true, childList: true });  
      
    return () \=\> {  
      observer.disconnect();  
      navObserver.disconnect();  
    };  
  },  
    
  transcribe(el: Element): string {  
    const clone \= el.cloneNode(true) as Element;  
    clone.querySelectorAll('button, .copy-button, \[aria-hidden="true"\]').forEach(e \=\> e.remove());  
      
    let content \= '';  
      
    clone.querySelectorAll('pre').forEach(pre \=\> {  
      const code \= pre.querySelector('code');  
      const lang \= code?.className.match(/language-(\\w+)/)?.\[1\] || '';  
      content \+= \`\\\`\\\`\\\`${lang}\\n${code?.textContent || pre.textContent}\\n\\\`\\\`\\\`\\n\\n\`;  
      pre.remove();  
    });  
      
    content \+= clone.innerText;  
    return content.trim();  
  }  
};  
\`\`\`

\#\#\# 6.3 The Gemini Scribe

\`\`\`typescript  
// src/scribes/gemini.ts

export const GeminiScribe: ScribeAdapter \= {  
  name: 'gemini',  
  domains: \['gemini.google.com', 'aistudio.google.com'\],  
    
  recognizes(url: string): boolean {  
    return url.includes('gemini.google.com') || url.includes('aistudio.google.com');  
  },  
    
  identifySource(): string | null {  
    const url \= new URL(window.location.href);  
    return url.searchParams.get('conversation')   
      || window.location.hash.slice(1)  
      || this.generateTempId();  
  },  
    
  generateTempId(): string {  
    const firstMsg \= document.querySelector('\[data-message-id\]');  
    if (\!firstMsg) return 'temp-' \+ Date.now();  
      
    const text \= firstMsg.textContent?.slice(0, 50\) || '';  
    let hash \= 0;  
    for (let i \= 0; i \< text.length; i++) {  
      hash \= ((hash \<\< 5\) \- hash) \+ text.charCodeAt(i);  
    }  
    return 'temp-' \+ Math.abs(hash).toString(16);  
  },  
    
  readTitle(): string | null {  
    const firstUser \= document.querySelector('\[data-message-author="user"\]');  
    return firstUser?.textContent?.slice(0, 100\) || null;  
  },  
    
  readModel(): string | null {  
    const indicator \= document.querySelector('.model-name');  
    return indicator?.textContent || 'gemini-pro';  
  },  
    
  recordExchanges(): Exchange\[\] {  
    const exchanges: Exchange\[\] \= \[\];  
    const messages \= document.querySelectorAll('\[data-message-id\]');  
      
    messages.forEach((el, idx) \=\> {  
      const author \= el.getAttribute('data-message-author');  
      const contentEl \= el.querySelector('.message-content');  
        
      if (\!contentEl) return;  
        
      const hasCode \= el.querySelector('code-block') \!== null;  
        
      exchanges.push({  
        id: el.getAttribute('data-message-id') || \`${this.identifySource()}-${idx}\`,  
        entryId: this.identifySource() || 'unknown',  
        role: author \=== 'user' ? 'user' : 'assistant',  
        content: this.transcribe(contentEl, hasCode),  
        timestamp: new Date().toISOString(),  
        sequence: idx,  
        attachments: this.detectAttachments(el)  
      });  
    });  
      
    return exchanges;  
  },  
    
  watch(callback: (event: ScribeEvent) \=\> void): () \=\> void {  
    let lastCount \= 0;  
    let debounceTimer: number;  
      
    const observer \= new MutationObserver(() \=\> {  
      const currentCount \= document.querySelectorAll('\[data-message-id\]').length;  
        
      if (currentCount \> lastCount) {  
        lastCount \= currentCount;  
        clearTimeout(debounceTimer);  
        debounceTimer \= window.setTimeout(() \=\> {  
          callback({  
            type: 'exchanges\_added',  
            sourceId: this.identifySource(),  
            count: currentCount  
          });  
        }, 800);  
      }  
    });  
      
    const container \= document.querySelector('main') || document.body;  
    observer.observe(container, { childList: true, subtree: true });  
      
    let scrollTimeout: number;  
    window.addEventListener('scroll', () \=\> {  
      clearTimeout(scrollTimeout);  
      scrollTimeout \= window.setTimeout(() \=\> {  
        const newCount \= document.querySelectorAll('\[data-message-id\]').length;  
        if (newCount \> lastCount) {  
          lastCount \= newCount;  
          callback({  
            type: 'exchanges\_added',  
            sourceId: this.identifySource(),  
            count: newCount  
          });  
        }  
      }, 500);  
    }, { passive: true });  
      
    return () \=\> observer.disconnect();  
  },  
    
  transcribe(el: Element, hasCode: boolean): string {  
    if (\!hasCode) return el.innerText.trim();  
      
    let content \= '';  
    el.querySelectorAll('code-block').forEach(block \=\> {  
      const code \= block.shadowRoot?.querySelector('code')?.textContent   
        || block.textContent   
        || '';  
      const lang \= block.getAttribute('language') || '';  
      content \+= \`\\\`\\\`\\\`${lang}\\n${code}\\n\\\`\\\`\\\`\\n\\n\`;  
    });  
      
    const clone \= el.cloneNode(true) as Element;  
    clone.querySelectorAll('code-block').forEach(b \=\> b.remove());  
    content \+= clone.innerText;  
      
    return content.trim();  
  },  
    
  detectAttachments(el: Element): Attachment\[\] | undefined {  
    const images \= el.querySelectorAll('img');  
    if (images.length \=== 0\) return undefined;  
      
    return Array.from(images).map(img \=\> ({  
      type: 'image',  
      present: true,  
      name: img.alt || 'image'  
    }));  
  }  
};  
\`\`\`

\#\#\# 6.4 Scribe Registry

\`\`\`typescript  
// src/scribes/index.ts

import { ClaudeScribe } from './claude.js';  
import { GeminiScribe } from './gemini.js';

const scribes \= \[ClaudeScribe, GeminiScribe\];

export function findScribe(url: string): ScribeAdapter | null {  
  return scribes.find(s \=\> s.recognizes(url)) || null;  
}

export function getAllScribes(): ScribeAdapter\[\] {  
  return scribes;  
}  
\`\`\`

\---

\#\# 7\. The Library (Core Infrastructure)

\#\#\# 7.1 The Archive (IndexDB)

\`\`\`typescript  
// src/archive/database.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ArchiveSchema extends DBSchema {  
  entries: {  
    key: string;  
    value: ChronicleEntry;  
    indexes: {  
      'by-scribe': string;  
      'by-date': string;  
      'by-starred': number;  
    };  
  };  
  exchanges: {  
    key: string;  
    value: Exchange;  
    indexes: {  
      'by-entry': string;  
      'by-sequence': string;  
    };  
  };  
  index: {  
    key: string;  
    value: ChronicleIndex;  
  };  
}

class TheArchive {  
  private db: IDBPDatabase\<ArchiveSchema\> | null \= null;  
    
  async open(): Promise\<void\> {  
    this.db \= await openDB\<ArchiveSchema\>('chronicle-archive', 1, {  
      upgrade(db) {  
        const entryStore \= db.createObjectStore('entries', { keyPath: 'id' });  
        entryStore.createIndex('by-scribe', 'scribe');  
        entryStore.createIndex('by-date', 'recordedAt');  
        entryStore.createIndex('by-starred', 'starred');  
          
        const exchangeStore \= db.createObjectStore('exchanges', { keyPath: 'id' });  
        exchangeStore.createIndex('by-entry', 'entryId');  
        exchangeStore.createIndex('by-sequence', 'sequence');  
          
        db.createObjectStore('index', { keyPath: 'term' });  
      }  
    });  
  }  
    
  async record(entry: ChronicleEntry, exchanges: Exchange\[\]): Promise\<void\> {  
    if (\!this.db) throw new Error('Archive not open');  
      
    const tx \= this.db.transaction(\['entries', 'exchanges'\], 'readwrite');  
      
    await tx.objectStore('entries').put(entry);  
      
    for (const exchange of exchanges) {  
      await tx.objectStore('exchanges').put(exchange);  
    }  
      
    await tx.done;  
    await this.indexEntry(entry, exchanges);  
    await this.enforceApprenticeLimits();  
  }  
    
  async readEntry(id: string): Promise\<{ entry: ChronicleEntry; exchanges: Exchange\[\] } | null\> {  
    if (\!this.db) return null;  
      
    const entry \= await this.db.get('entries', id);  
    if (\!entry) return null;  
      
    const exchanges \= await this.db.getAllFromIndex('exchanges', 'by-entry', id);  
    exchanges.sort((a, b) \=\> a.sequence \- b.sequence);  
      
    return { entry, exchanges };  
  }  
    
  async browse(options: {  
    scribe?: string;  
    starred?: boolean;  
    limit?: number;  
    offset?: number;  
  } \= {}): Promise\<ChronicleEntry\[\]\> {  
    if (\!this.db) return \[\];  
      
    let entries: ChronicleEntry\[\];  
      
    if (options.scribe) {  
      entries \= await this.db.getAllFromIndex('entries', 'by-scribe', options.scribe);  
    } else if (options.starred) {  
      entries \= await this.db.getAllFromIndex('entries', 'by-starred', 1);  
    } else {  
      entries \= await this.db.getAll('entries');  
    }  
      
    entries.sort((a, b) \=\> new Date(b.recordedAt).getTime() \- new Date(a.recordedAt).getTime());  
      
    if (options.offset || options.limit) {  
      const start \= options.offset || 0;  
      const end \= options.limit ? start \+ options.limit : undefined;  
      entries \= entries.slice(start, end);  
    }  
      
    return entries;  
  }  
    
  async search(query: string): Promise\<ChronicleEntry\[\]\> {  
    if (\!this.db || \!query) return \[\];  
      
    const terms \= this.tokenize(query);  
    if (terms.length \=== 0\) return \[\];  
      
    const entryIds \= new Set\<string\>();  
      
    for (const term of terms) {  
      const index \= await this.db.get('index', term);  
      if (index) {  
        index.entries.forEach(id \=\> entryIds.add(id));  
      }  
    }  
      
    const entries \= await Promise.all(  
      Array.from(entryIds).map(id \=\> this.db\!.get('entries', id))  
    );  
      
    return entries.filter((e): e is ChronicleEntry \=\> e \!== undefined);  
  }  
    
  private async indexEntry(entry: ChronicleEntry, exchanges: Exchange\[\]): Promise\<void\> {  
    if (\!this.db) return;  
      
    const tx \= this.db.transaction('index', 'readwrite');  
      
    for (const exchange of exchanges) {  
      const terms \= this.tokenize(exchange.content);  
        
      for (const term of \[...new Set(terms)\]) {  
        const existing \= await tx.store.get(term);  
          
        if (existing) {  
          if (\!existing.entries.includes(entry.id)) {  
            existing.entries.push(entry.id);  
            await tx.store.put(existing);  
          }  
        } else {  
          await tx.store.add({  
            term,  
            entries: \[entry.id\],  
            exchanges: {},  
            lastIndexed: new Date().toISOString()  
          });  
        }  
      }  
    }  
      
    await tx.done;  
  }  
    
  private tokenize(text: string): string\[\] {  
    return text  
      .toLowerCase()  
      .replace(/\[^\\w\\s\]/g, ' ')  
      .split(/\\s+/)  
      .filter(t \=\> t.length \>= 3 && t.length \<= 20);  
  }  
    
  private async enforceApprenticeLimits(): Promise\<void\> {  
    const tier \= await this.getTier();  
    if (tier \!== 'apprentice') return;  
      
    const thirtyDaysAgo \= new Date();  
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() \- 30);  
      
    const allEntries \= await this.db\!.getAll('entries');  
    const toArchive: string\[\] \= \[\];  
      
    const sorted \= allEntries.sort((a, b) \=\>   
      new Date(b.recordedAt).getTime() \- new Date(a.recordedAt).getTime()  
    );  
      
    if (sorted.length \> 500\) {  
      toArchive.push(...sorted.slice(500).map(e \=\> e.id));  
    }  
      
    sorted.forEach(entry \=\> {  
      if (new Date(entry.recordedAt) \< thirtyDaysAgo && \!toArchive.includes(entry.id)) {  
        toArchive.push(entry.id);  
      }  
    });  
      
    for (const id of toArchive) {  
      await this.remove(id);  
    }  
  }  
    
  async remove(id: string): Promise\<void\> {  
    if (\!this.db) return;  
      
    const tx \= this.db.transaction(\['entries', 'exchanges', 'index'\], 'readwrite');  
      
    const exchanges \= await tx.objectStore('exchanges').index('by-entry').getAll(id);  
    for (const ex of exchanges) {  
      await tx.objectStore('exchanges').delete(ex.id);  
    }  
      
    await tx.objectStore('entries').delete(id);  
      
    const cursor \= await tx.objectStore('index').openCursor();  
    while (cursor) {  
      const idx \= cursor.value;  
      idx.entries \= idx.entries.filter(eid \=\> eid \!== id);  
      if (idx.entries.length \=== 0\) {  
        await cursor.delete();  
      } else {  
        await cursor.update(idx);  
      }  
      await cursor.continue();  
    }  
      
    await tx.done;  
  }  
    
  private async getTier(): Promise\<'apprentice' | 'scribe'\> {  
    const result \= await chrome.storage.sync.get('chronicleTier');  
    return result.chronicleTier || 'apprentice';  
  }  
    
  async compile(format: 'json' | 'markdown', ids?: string\[\]): Promise\<Blob\> {  
    let entries: ChronicleEntry\[\];  
      
    if (ids) {  
      entries \= await Promise.all(  
        ids.map(id \=\> this.db\!.get('entries', id))  
      ).then(results \=\> results.filter((e): e is ChronicleEntry \=\> e \!== undefined));  
    } else {  
      entries \= await this.browse();  
    }  
      
    if (format \=== 'json') {  
      return new Blob(\[JSON.stringify({  
        chronicle: true,  
        version: '1.0',  
        exportedAt: new Date().toISOString(),  
        entries  
      }, null, 2)\], { type: 'application/json' });  
    }  
      
    let md \= '\# Chronicle Export\\n\\n';  
    for (const entry of entries) {  
      md \+= \`\#\# ${entry.title || 'Untitled'}\\n\`;  
      md \+= \`\*${entry.scribe} • ${entry.recordedAt}\*\\n\\n\`;  
        
      const { exchanges } \= await this.readEntry(entry.id) || { exchanges: \[\] };  
      for (const ex of exchanges) {  
        md \+= \`\*\*${ex.role}:\*\*\\n${ex.content}\\n\\n\`;  
      }  
        
      md \+= '---\\n\\n';  
    }  
      
    return new Blob(\[md\], { type: 'text/markdown' });  
  }  
}

export const archive \= new TheArchive();  
\`\`\`

\#\#\# 7.2 The Keeper (Service Worker)

\`\`\`typescript  
// src/keeper.ts

import { archive } from './archive/database.js';

// Initialize the archive  
archive.open();

// Side panel behavior  
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Message routing  
chrome.runtime.onMessage.addListener((message, sender, sendResponse) \=\> {  
  handleMessage(message, sender).then(sendResponse).catch(err \=\> {  
    sendResponse({ error: err.message });  
  });  
  return true;  
});

async function handleMessage(msg: any, sender: chrome.runtime.MessageSender) {  
  switch (msg.type) {  
    case 'RECORD\_ENTRY':  
      return await recordEntry(msg.data, sender.tab?.id);  
      
    case 'QUERY\_LIBRARY':  
      return { entries: await archive.browse(msg.options) };  
      
    case 'GET\_ENTRY':  
      return await archive.readEntry(msg.entryId);  
      
    case 'SEARCH\_CHRONICLE':  
      return { entries: await archive.search(msg.query) };  
      
    case 'EXPORT\_CHRONICLE':  
      const blob \= await archive.compile(msg.format, msg.ids);  
      return { blob: await blobToBase64(blob) };  
      
    case 'REMOVE\_ENTRY':  
      await archive.remove(msg.id);  
      return { success: true };  
      
    case 'CHECK\_TIER':  
      return { tier: await getTier() };  
      
    default:  
      throw new Error(\`Unknown chronicle message: ${msg.type}\`);  
  }  
}

async function recordEntry(data: any, tabId?: number) {  
  const { entry, exchanges } \= data;  
    
  await archive.record(entry, exchanges);  
    
  // Notify side panel  
  notifyChronicle({  
    type: 'ENTRY\_RECORDED',  
    data: entry  
  });  
    
  // Confirm to content script  
  if (tabId) {  
    chrome.tabs.sendMessage(tabId, {  
      type: 'RECORDING\_CONFIRMED',  
      entryId: entry.id  
    });  
  }  
    
  return { success: true, id: entry.id };  
}

function notifyChronicle(message: any) {  
  chrome.runtime.sendMessage(message).catch(() \=\> {  
    // Side panel closed, ignore  
  });  
}

// Chronicle maintenance  
chrome.alarms.create('archive-maintenance', { periodInMinutes: 60 });  
chrome.alarms.create('vault-sync', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) \=\> {  
  if (alarm.name \=== 'archive-maintenance') {  
    // Limits enforced on record, but verify integrity  
  }  
    
  if (alarm.name \=== 'vault-sync') {  
    const tier \= await getTier();  
    if (tier \=== 'scribe') {  
      await syncToVault();  
    }  
  }  
});

async function syncToVault() {  
  // Implementation for cloud sync  
}

async function getTier(): Promise\<string\> {  
  const result \= await chrome.storage.sync.get('chronicleTier');  
  return result.chronicleTier || 'apprentice';  
}

function blobToBase64(blob: Blob): Promise\<string\> {  
  return new Promise((resolve, reject) \=\> {  
    const reader \= new FileReader();  
    reader.onloadend \= () \=\> resolve(reader.result as string);  
    reader.onerror \= reject;  
    reader.readAsDataURL(blob);  
  });  
}  
\`\`\`

\#\#\# 7.3 The Scribe (Content Script)

\`\`\`typescript  
// src/scribe.ts

import { findScribe } from './scribes/index.js';  
import { archive } from './archive/database.js';

class TheScribe {  
  private scribe: ScribeAdapter | null \= null;  
  private unwatch: (() \=\> void) | null \= null;  
  private currentSource: string | null \= null;  
    
  constructor() {  
    this.begin();  
  }  
    
  begin() {  
    this.recognizePlatform();  
      
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) \=\> {  
      if (msg.type \=== 'CHECK\_SCRIBE\_STATUS') {  
        sendResponse({  
          active: \!\!this.scribe,  
          source: this.currentSource,  
          scribe: this.scribe?.name  
        });  
      }  
      return true;  
    });  
  }  
    
  recognizePlatform() {  
    const scribe \= findScribe(window.location.href);  
    if (\!scribe) return;  
      
    this.scribe \= scribe;  
    this.startRecording();  
      
    chrome.runtime.sendMessage({  
      type: 'SCRIBE\_STARTED',  
      scribe: scribe.name  
    });  
  }  
    
  startRecording() {  
    if (\!this.scribe) return;  
      
    this.record();  
      
    this.unwatch \= this.scribe.watch((event) \=\> {  
      if (event.type \=== 'source\_changed') {  
        this.currentSource \= event.sourceId;  
        setTimeout(() \=\> this.record(), 500);  
      } else if (event.type \=== 'exchanges\_added') {  
        this.record();  
      }  
    });  
      
    document.addEventListener('visibilitychange', () \=\> {  
      if (\!document.hidden) this.record();  
    });  
  }  
    
  async record() {  
    if (\!this.scribe) return;  
      
    const sourceId \= this.scribe.identifySource();  
    if (\!sourceId) return;  
      
    this.currentSource \= sourceId;  
      
    const exchanges \= this.scribe.recordExchanges();  
    if (exchanges.length \=== 0\) return;  
      
    const entry: ChronicleEntry \= {  
      id: sourceId,  
      scribe: this.scribe.name,  
      sourceId,  
      title: this.scribe.readTitle(),  
      excerpt: exchanges\[exchanges.length \- 1\]?.content.slice(0, 200),  
      recordedAt: exchanges\[0\]?.timestamp || new Date().toISOString(),  
      updatedAt: new Date().toISOString(),  
      starred: false,  
      tags: \[\],  
      annotation: null,  
      messageCount: exchanges.length,  
      model: this.scribe.readModel() || undefined,  
      metadata: {  
        url: window.location.href,  
        captureMethod: 'dom',  
        version: '1.0'  
      }  
    };  
      
    chrome.runtime.sendMessage({  
      type: 'RECORD\_ENTRY',  
      data: { entry, exchanges }  
    });  
  }  
    
  cease() {  
    if (this.unwatch) {  
      this.unwatch();  
      this.unwatch \= null;  
    }  
      
    chrome.runtime.sendMessage({ type: 'SCRIBE\_ENDED' });  
  }  
}

// Begin chronicle  
const theScribe \= new TheScribe();

window.addEventListener('beforeunload', () \=\> {  
  theScribe.cease();  
});  
\`\`\`

\---

\#\# 8\. Build Configuration

\#\#\# 8.1 Package.json

\`\`\`json  
{  
  "name": "chronicle",  
  "version": "1.0.0",  
  "type": "module",  
  "scripts": {  
    "dev": "vite",  
    "build": "tsc && vite build",  
    "preview": "vite preview"  
  },  
  "devDependencies": {  
    "@crxjs/vite-plugin": "^2.0.0-beta.21",  
    "@types/chrome": "^0.0.246",  
    "typescript": "^5.2.2",  
    "vite": "^5.0.0"  
  },  
  "dependencies": {  
    "idb": "^7.1.1"  
  }  
}  
\`\`\`

\#\#\# 8.2 Vite Config

\`\`\`typescript  
// vite.config.ts

import { defineConfig } from 'vite';  
import { crx } from '@crxjs/vite-plugin';  
import manifest from './manifest.json' assert { type: 'json' };

export default defineConfig({  
  plugins: \[crx({ manifest })\],  
  build: {  
    rollupOptions: {  
      input: {  
        sidepanel: 'sidepanel.html'  
      }  
    }  
  }  
});  
\`\`\`

\---

\#\# 9\. Development Phases

| Phase | Duration | Deliverables |  
|-------|----------|--------------|  
| \*\*1. The Library\*\* | Week 1 | Archive (IndexDB), keeper (service worker), side panel shell |  
| \*\*2. The Claude Scribe\*\* | Week 1-2 | Claude adapter, recording flow, basic search |  
| \*\*3. The Gemini Scribe\*\* | Week 2-3 | Gemini adapter, multi-scribe UI |  
| \*\*4. The Binding\*\* | Week 3-4 | Export, annotations, settings, error handling |  
| \*\*5. The Vault\*\* | Week 4-5 | Cloud sync, scribe tier, payments |

\---

\#\# 10\. File Structure

\`\`\`  
chronicle/  
├── src/  
│   ├── scribes/  
│   │   ├── claude.ts  
│   │   ├── gemini.ts  
│   │   └── index.ts  
│   ├── archive/  
│   │   └── database.ts  
│   ├── keeper.ts  
│   ├── scribe.ts  
│   ├── sidepanel.js  
│   └── types.ts  
├── sidepanel.html  
├── sidepanel.css  
├── manifest.json  
├── vite.config.ts  
├── tsconfig.json  
└── package.json  
\`\`\`

\---

\*\*Status:\*\* Ready for chronicle-keeping    
\*\*Next Action:\*\* Initialize with \`npm create vite@latest chronicle \--template vanilla-ts\`  
\`\`\`  
