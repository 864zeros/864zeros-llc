# LLM Integrity Rules for 864zeros

This document exists because of a specific failure. An LLM assistant:

1. Said it would follow 864zeros patterns and reference existing extensions
2. Claimed it had looked at examples
3. Built something completely different (DevTools extension instead of side panel)
4. Continued to claim it was following patterns while clearly not doing so
5. Only corrected course after the user repeatedly pointed out the errors

This is unacceptable behavior.

---

## Rule 1: Do Not Lie About Your Process

If you say "I will check the reference files" — actually check them and apply what you learn.

If you say "I looked at the clipboard extension" — your output should reflect what's in that extension.

If your output contradicts what you claimed to reference, you lied.

---

## Rule 2: Actually Use the Reference Material

The 864zeros workspace has:
- `864z-build-kit/` — Build standards and patterns
- `extensions/clipboard/` — A working side panel extension
- `extensions/webinsights/` — Another reference implementation

**All extensions in this workspace are SIDE PANEL extensions.**

There are no DevTools extensions. There are no popup extensions. If you build something other than a side panel extension, you ignored the examples.

Before building anything:
1. Read `864z-build-kit/CLAUDE-base.md`
2. Read `864z-build-kit/CLAUDE-extension.md`
3. Open `extensions/clipboard/manifest.json` and understand the pattern
4. Match that pattern in your implementation

---

## Rule 3: When Specs Conflict with Patterns, Ask

If a spec says "DevTools panel" but all existing extensions are side panels — ASK THE USER.

Do not assume. Do not guess. Do not build something that contradicts the established patterns without explicit confirmation.

Say: "The spec mentions DevTools but your existing extensions all use side panels. Which approach do you want?"

---

## Rule 4: Do Not Claim Expertise You Don't Have

If you're uncertain about Chrome extension architecture, say so.

If you don't understand the difference between a side panel and a DevTools panel, say so.

Pretending to know and then building the wrong thing wastes the user's time and erodes trust.

---

## Rule 5: The Pattern is Obvious — Use It

Look at what exists:
```
extensions/
├── clipboard/        ← Side panel extension
├── webinsights/      ← Side panel extension
├── who-is-watching/  ← Should be side panel extension
```

The pattern is not hidden. It is the only pattern available. If you build something different, you ignored the most obvious signal possible.

---

## The Side Panel Pattern (Reference)

From `clipboard/manifest.json`:
```json
{
  "permissions": ["sidePanel", ...],
  "side_panel": {
    "default_path": "sidepanel/index.html"
  },
  "action": {
    "default_title": "Open [App Name]"
  }
}
```

From `clipboard/background/service-worker.js`:
```javascript
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
```

This is the pattern. Use it.

---

## Summary

1. Don't say you'll do something and then not do it
2. Don't claim to have referenced files you didn't apply
3. When patterns exist, follow them
4. When uncertain, ask
5. Be honest about what you know and don't know

Trust is built through consistent honest behavior, not through claiming expertise.
