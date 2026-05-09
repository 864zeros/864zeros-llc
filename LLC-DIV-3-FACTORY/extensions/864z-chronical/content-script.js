/**
 * Chronicle Content Script - Multi-Platform
 * Records conversations from Gemini, Claude, ChatGPT, and Copilot
 */

(function() {
  'use strict';

  // Detect which platform we're on
  const hostname = window.location.hostname;
  let platform = null;

  if (hostname.includes('gemini.google.com') || hostname.includes('aistudio.google.com')) {
    platform = 'gemini';
  } else if (hostname.includes('claude.ai')) {
    platform = 'claude';
  } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    platform = 'chatgpt';
  }

  if (!platform) {
    return;
  }


  let lastMessageCount = 0;
  let debounceTimer = null;
  let currentSourceId = null;

  // Platform-specific extraction configs
  const PLATFORMS = {
    gemini: {
      name: 'Gemini',
      scribe: 'gemini',
      getUserMessages: () => document.querySelectorAll('user-query, USER-QUERY'),
      getAssistantMessages: () => document.querySelectorAll('model-response, MODEL-RESPONSE'),
      extractUserContent: (el) => {
        const textEl = el.querySelector('.query-text-line, .query-text, p');
        return textEl ? textEl.innerText.trim() : el.innerText.trim();
      },
      extractAssistantContent: (el) => {
        const markdown = el.querySelector('.markdown, .message-content');
        const contentEl = markdown || el;
        const codeBlocks = contentEl.querySelectorAll('code-block, pre code, pre');

        if (codeBlocks.length === 0) {
          return contentEl.innerText.trim();
        }

        let content = '';
        codeBlocks.forEach(block => {
          const code = block.shadowRoot?.querySelector('code')?.textContent || block.textContent || '';
          const lang = block.getAttribute('language') || '';
          content += '```' + lang + '\n' + code + '\n```\n\n';
        });

        const clone = contentEl.cloneNode(true);
        clone.querySelectorAll('code-block, pre').forEach(b => b.remove());
        content += clone.innerText.trim();
        return content.trim();
      },
      getContainer: () => document.querySelector('main, .conversation-container, infinite-scroller') || document.body
    },

    claude: {
      name: 'Claude',
      scribe: 'claude',
      getUserMessages: () => {
        // Claude uses [data-testid] attributes
        // Human messages don't have the feedback button
        const actionGroups = document.querySelectorAll('[role="group"][aria-label="Message actions"]');
        const humanGroups = [];
        actionGroups.forEach(group => {
          if (!group.querySelector('button[aria-label="Give positive feedback"]')) {
            humanGroups.push(group);
          }
        });
        // Find the parent message containers
        return Array.from(humanGroups).map(g => g.closest('[data-test-render-count], .font-user-message, [class*="human"]') || g.parentElement?.parentElement);
      },
      getAssistantMessages: () => {
        // Claude responses have the feedback button
        const actionGroups = document.querySelectorAll('[role="group"][aria-label="Message actions"]');
        const assistantGroups = [];
        actionGroups.forEach(group => {
          if (group.querySelector('button[aria-label="Give positive feedback"]')) {
            assistantGroups.push(group);
          }
        });
        return Array.from(assistantGroups).map(g => g.closest('[data-test-render-count], .font-claude-message, [class*="assistant"]') || g.parentElement?.parentElement);
      },
      extractUserContent: (el) => {
        if (!el) return '';
        // Try to find the text content div
        const textDiv = el.querySelector('[class*="whitespace-pre-wrap"], [class*="message-content"], p');
        return textDiv ? textDiv.innerText.trim() : el.innerText.trim();
      },
      extractAssistantContent: (el) => {
        if (!el) return '';
        const markdown = el.querySelector('[class*="markdown"], [class*="prose"]');
        return markdown ? markdown.innerText.trim() : el.innerText.trim();
      },
      getContainer: () => document.querySelector('[class*="conversation"], main, [role="main"]') || document.body
    },

    chatgpt: {
      name: 'ChatGPT',
      scribe: 'chatgpt',
      getUserMessages: () => document.querySelectorAll('[data-message-author-role="user"]'),
      getAssistantMessages: () => document.querySelectorAll('[data-message-author-role="assistant"]'),
      extractUserContent: (el) => {
        const content = el.querySelector('[data-message-content], .whitespace-pre-wrap, .markdown, .prose');
        return content ? content.innerText.trim() : el.innerText.trim();
      },
      extractAssistantContent: (el) => {
        const content = el.querySelector('[data-message-content], .markdown, .prose');
        return content ? content.innerText.trim() : el.innerText.trim();
      },
      getContainer: () => document.querySelector('main, [role="main"], [class*="conversation"]') || document.body
    }
  };

  const config = PLATFORMS[platform];

  // Generate a source ID from the conversation
  function getSourceId() {
    const url = new URL(window.location.href);
    const pathId = url.pathname.split('/').filter(p => p && p.length > 8).pop();
    if (pathId) return platform + '-' + pathId;

    const convId = url.searchParams.get('conversation') || url.hash.slice(1);
    if (convId) return platform + '-' + convId;

    // Generate from first user message content
    const userMsgs = config.getUserMessages();
    if (userMsgs.length > 0) {
      const text = (config.extractUserContent(userMsgs[0]) || '').slice(0, 50);
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
      }
      return platform + '-' + Math.abs(hash).toString(16);
    }

    return platform + '-' + Date.now();
  }

  // Get conversation title from first user message
  function getTitle() {
    const userMsgs = config.getUserMessages();
    if (userMsgs.length > 0) {
      const content = config.extractUserContent(userMsgs[0]);
      return content ? content.slice(0, 100).trim() : null;
    }
    return null;
  }

  // Get DOM order of element for sorting
  function getElementOrder(el) {
    if (!el) return 0;
    let order = 0;
    let node = el;
    while (node.previousElementSibling) {
      order++;
      node = node.previousElementSibling;
    }
    if (el.parentElement) {
      order += getElementOrder(el.parentElement) * 1000;
    }
    return order;
  }

  // Get all messages
  function getMessages() {
    const userMsgs = config.getUserMessages();
    const assistantMsgs = config.getAssistantMessages();


    const messages = [];

    Array.from(userMsgs).forEach(el => {
      if (el) {
        messages.push({ element: el, role: 'user', order: getElementOrder(el) });
      }
    });

    Array.from(assistantMsgs).forEach(el => {
      if (el) {
        messages.push({ element: el, role: 'assistant', order: getElementOrder(el) });
      }
    });

    messages.sort((a, b) => a.order - b.order);
    return messages;
  }

  // Record all messages in the conversation
  function recordConversation() {

    const messages = getMessages();

    if (messages.length === 0) {
      return;
    }

    const sourceId = getSourceId();
    currentSourceId = sourceId;

    const exchanges = [];
    messages.forEach((msg, idx) => {
      const content = msg.role === 'user'
        ? config.extractUserContent(msg.element)
        : config.extractAssistantContent(msg.element);

      if (content) {
        exchanges.push({
          id: sourceId + '-' + idx,
          entryId: sourceId,
          role: msg.role,
          content: content,
          timestamp: new Date().toISOString(),
          sequence: idx
        });
      }
    });

    if (exchanges.length === 0) return;

    const entry = {
      id: sourceId,
      scribe: config.scribe,
      sourceId: sourceId,
      title: getTitle(),
      excerpt: exchanges[exchanges.length - 1]?.content.slice(0, 200),
      recordedAt: exchanges[0]?.timestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      starred: false,
      tags: [],
      messageCount: exchanges.length,
      metadata: {
        url: window.location.href,
        platform: platform,
        captureMethod: 'dom'
      }
    };

    chrome.runtime.sendMessage({
      type: 'RECORD_ENTRY',
      entry: entry,
      exchanges: exchanges
    }).then(response => {
    }).catch(err => {
      console.error('[Chronicle CS] Could not send to service worker:', err);
    });
  }

  // Count current messages
  function countMessages() {
    const userMsgs = config.getUserMessages();
    const assistantMsgs = config.getAssistantMessages();
    return userMsgs.length + assistantMsgs.length;
  }

  // Debounced record function
  function scheduleRecord() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const currentCount = countMessages();
      if (currentCount > 0 && currentCount !== lastMessageCount) {
        lastMessageCount = currentCount;
        recordConversation();
      } else if (currentCount === 0) {
      }
    }, 1500);
  }

  // Watch for new messages
  function startObserver() {

    const observer = new MutationObserver(() => {
      scheduleRecord();
    });

    const container = config.getContainer();

    observer.observe(container, {
      childList: true,
      subtree: true
    });

    // Initial record after page load
    setTimeout(scheduleRecord, 3000);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

})();
