# Chronicle - Deferred Topics

Features and integrations deferred from v1 for future consideration.

---

## 1. Microsoft Copilot Support

**Status:** Deferred
**Reason:** Shadow DOM complexity, frequent DOM changes, anti-bot protections

### The Problem

Microsoft Copilot (copilot.microsoft.com) uses Shadow DOM with custom web components (`cib-serp`, `cib-message`, etc.). Standard `querySelectorAll` cannot penetrate shadow boundaries, making DOM-based capture unreliable.

Additionally:
- Microsoft frequently changes the Copilot interface
- Anti-bot protections may block scraping attempts
- The nested shadow DOM structure requires recursive traversal

### Reference URLs

- [Shadow DOM challenges for scraping](https://axiom.ai/blog/understanding-and-working-with-the-shadow-dom)
- [SerpApi on Copilot scraping complexity](https://serpapi.com/blog/introducing-serpapi-bing-copilot-api/)
- [MDN: Using Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)

### Future Approach

If we add Copilot support, consider:

1. **Modular selector architecture**
   - Externalize platform selectors to a config file or remote endpoint
   - Allow hot-updating selectors without extension update

2. **LLM-assisted DOM analysis**
   - When selectors fail, capture a sanitized DOM snapshot
   - Send to LLM with prompt: "Identify user message and assistant message selectors in this DOM structure"
   - LLM returns updated selector config
   - Cache working selectors locally

3. **Shadow DOM traversal helper**
   ```javascript
   function queryShadowRoot(root, selector) {
     let result = root.querySelector(selector);
     if (result) return result;

     const shadowHosts = root.querySelectorAll('*');
     for (const host of shadowHosts) {
       if (host.shadowRoot) {
         result = queryShadowRoot(host.shadowRoot, selector);
         if (result) return result;
       }
     }
     return null;
   }
   ```

4. **User-reported selector updates**
   - If capture fails, prompt user to report
   - Aggregate reports to identify DOM changes
   - Push selector updates to users

### Effort Estimate

Medium-high. Requires architectural changes for selector modularity and LLM integration.

### Trigger to Revisit

- User requests for Copilot support
- Microsoft stabilizes Copilot DOM structure
- Similar extensions demonstrate reliable Copilot capture

---

## 2. Tagging System

**Status:** Deferred
**Reason:** Platform filter + search + star covers 80% of organization needs

### Notes

- Consider if users explicitly request cross-platform organization
- Keep ADHD-friendly: avoid adding decision overhead
- If added, follow clipboard tagging pattern

---

*Last updated: 2026-03-11*
