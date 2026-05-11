# AEC: LLM Platform DOM Selectors Status

**Type:** Architecture/Engineering/Configuration
**Created:** 2026-03-09
**Updated:** 2026-03-09
**Check Interval:** Monthly (or when recording fails)
**Owner:** 864zeros / Chronicle Extension

---

## Purpose

This document tracks the DOM selectors used to capture conversations from major LLM platforms. Since these are web apps with no public DOM APIs, selectors may change without notice.

---

## Platform Status Overview

| Platform | Status | Last Verified | Notes |
|----------|--------|---------------|-------|
| Gemini | 🟢 VERIFIED | 2026-03-09 | Working |
| Claude | 🟡 UNTESTED | 2026-03-09 | Based on research |
| ChatGPT | 🟡 UNTESTED | 2026-03-09 | Based on research |
| Copilot | 🟡 UNTESTED | 2026-03-09 | Uses fallback selectors |

---

## Gemini (gemini.google.com)

### User Messages
```css
user-query, USER-QUERY
```
- **Type:** Custom HTML element
- **Content selectors:** `.query-text-line`, `.query-text`, `p`

### Assistant Messages
```css
model-response, MODEL-RESPONSE
```
- **Type:** Custom HTML element
- **Content selectors:** `.markdown`, `.message-content`

### Containers
```css
main
.conversation-container
infinite-scroller
```

### Reference Sources
- [Louisjo/gemini-chat-exporter](https://github.com/Louisjo/gemini-chat-exporter)
- [RuDeeVelops/gemini-exporter](https://github.com/RuDeeVelops/gemini-exporter)

---

## Claude (claude.ai)

### Message Detection Strategy
Claude doesn't use simple user/assistant element selectors. Instead:
1. Find all `[role="group"][aria-label="Message actions"]` elements
2. **Human messages:** Action groups WITHOUT feedback button
3. **Claude messages:** Action groups WITH `button[aria-label="Give positive feedback"]`

### User Messages
```css
[role="group"][aria-label="Message actions"]
/* Filter: groups WITHOUT button[aria-label="Give positive feedback"] */
```
- Navigate to parent container for content

### Assistant Messages
```css
[role="group"][aria-label="Message actions"]
/* Filter: groups WITH button[aria-label="Give positive feedback"] */
```

### Content Extraction
```css
[class*="whitespace-pre-wrap"]
[class*="markdown"]
[class*="prose"]
```

### Reference Sources
- [agarwalvishal/claude-chat-exporter](https://github.com/agarwalvishal/claude-chat-exporter)
- [socketteer/Claude-Conversation-Exporter](https://github.com/socketteer/Claude-Conversation-Exporter)

---

## ChatGPT (chatgpt.com / chat.openai.com)

### User Messages
```css
[data-message-author-role="user"]
```

### Assistant Messages
```css
[data-message-author-role="assistant"]
```

### Content Extraction
```css
[data-message-content]
.whitespace-pre-wrap
.markdown
.prose
```

### Containers
```css
main
[role="main"]
```

### Reference Sources
- [pionxzh/chatgpt-exporter](https://github.com/pionxzh/chatgpt-exporter)
- [LukasMFR's Gist](https://gist.github.com/LukasMFR/6865ef67aee37a8c677928234072bfbf)

---

## Copilot (copilot.microsoft.com)

### Notes
Copilot's DOM structure varies by tenant and version. Multiple fallback selectors are used.

### User Messages (fallback chain)
```css
[data-content="user"]
cib-message[source="user"]
[class*="user-message"]
.user-request
[data-testid*="user"]
```

### Assistant Messages (fallback chain)
```css
[data-content="ai"]
cib-message[source="bot"]
[class*="bot-message"]
.bot-response
[data-testid*="assistant"]
[data-testid*="bot"]
```

### Containers
```css
main
[role="main"]
#app
cib-serp
```

### Reference Sources
- [RobAMills/copilot-chat-saver](https://github.com/RobAMills/copilot-chat-saver)
- [NoahTheGinger/CopilotWebChatExporter](https://github.com/NoahTheGinger/CopilotWebChatExporter)

---

## Validation Procedure

### Manual Check (DevTools Console)

For each platform, open DevTools (F12) → Console and run:

**Gemini:**
```javascript
console.log('user-query:', document.querySelectorAll('user-query').length);
console.log('model-response:', document.querySelectorAll('model-response').length);
```

**Claude:**
```javascript
const groups = document.querySelectorAll('[role="group"][aria-label="Message actions"]');
const human = [...groups].filter(g => !g.querySelector('button[aria-label="Give positive feedback"]'));
const claude = [...groups].filter(g => g.querySelector('button[aria-label="Give positive feedback"]'));
console.log('Human messages:', human.length);
console.log('Claude messages:', claude.length);
```

**ChatGPT:**
```javascript
console.log('User:', document.querySelectorAll('[data-message-author-role="user"]').length);
console.log('Assistant:', document.querySelectorAll('[data-message-author-role="assistant"]').length);
```

**Copilot:**
```javascript
// Try multiple selectors
['[data-content="user"]', 'cib-message[source="user"]', '[class*="user-message"]'].forEach(s => {
  const count = document.querySelectorAll(s).length;
  if (count > 0) console.log(s + ':', count);
});
```

---

## Failure Indicators

Signs that selectors need updating:

1. Content script logs show `0 user messages` and `0 assistant messages`
2. Side panel shows empty even after conversations
3. Manual validation returns 0 for all selectors
4. Reference repos show different selectors in their code

---

## Update Procedure

When selectors break:

1. Check reference repos (listed above) for updated selectors
2. Manual DOM inspection on the platform
3. Update `content-script.js` PLATFORMS config
4. Update this AEC document
5. Test and verify
6. Update status table at top

---

## Selector History

| Date | Platform | Change | Reason |
|------|----------|--------|--------|
| 2026-03-09 | All | Multi-platform support added | New feature |
| 2026-03-09 | Gemini | Selectors VERIFIED WORKING | Tested on gemini.google.com |
| 2026-03-09 | Claude | Initial selectors documented | Based on research |
| 2026-03-09 | ChatGPT | Initial selectors documented | Based on research |
| 2026-03-09 | Copilot | Initial selectors documented | Based on research |

---

*Next scheduled check: 2026-04-09*
