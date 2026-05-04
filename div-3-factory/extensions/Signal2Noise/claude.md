# CLAUDE.MD — Signal2Noise Chrome Extension

## Project Identity

**Name:** Signal2Noise
**Type:** Chrome Extension (Manifest V3)
**Brand:** OIA (Organize your Internal Architecture)
**Tagline:** "Built for people with ADHD by someone with ADHD"
**Target:** ADHD adults experiencing daily task overwhelm
**Core Message:** "What is today's signal?" — tune out the noise, focus in on the signal.

---

## What This File Is

This is the build specification for the Panel Chrome Extension. The OIA Design System and 864zeros Build Kit are already established — this document covers **what to build**, not how to style it. Every feature below maps to a functional requirement. No ambiguity, no interpretation needed.

---

## Architecture

```
follow 864build kit structure
```

**Storage:** `chrome.storage.local` — all state persists across sessions.
**Data Model:** Array of signal objects stored under key `signals`.

```json
{
  "id": "timestamp_or_uuid",
  "text": "Full signal note content",
  "isMarked": false
}
```

Additional stored value: `selectedRatio` (string: "80" | "70" | "60").

---

## Features to Build

### FEAT-01: Signal Pill Display

**Location:** Top of popup, above all other elements.
**Container ID:** `signalPillContainer`

- Renders a horizontal pill-shaped bar showing the user's marked (priority) signals.
- Dynamically populated — only shows signals where `isMarked === true`.
- Displays **2 to 4** marked signals. If fewer than 2 are marked, pill is empty/hidden. If more than 4 are marked, show first 4 only.
- Each marked signal occupies equal width within the pill (2 signals = 50% each, 3 = 33%, 4 = 25%).
- Content of each segment: bolded title (first ~30 chars of signal text, truncated).
- **Refreshes on:** signal add, signal delete, mark/unmark toggle.

---

### FEAT-02: Signal-to-Noise Ratio Selector

**Location:** Below the pill, above the input area.

- Three horizontal radio buttons: `80`, `70`, `60`.
- Input name: `s_n_ratio`
- IDs: `ratio80`, `ratio70`, `ratio60`
- On change: store selected value to `chrome.storage.local` under key `selectedRatio`.
- Default: `80` (pre-selected on first load).
- Value is persisted and restored on popup reopen.
- **Note:** This value is stored for future use (potential AI integration or signal filtering logic). No visual effect beyond selection state in v1.0.

---

### FEAT-03: Daily Signal Input

**Location:** Below ratio selector.

- Label text: `"What is today's signal?"`
- Single `<textarea>` element. ID: `signalInput`.
- No character limit on input.
- Cleared automatically after successful save.

---

### FEAT-04: Save Signal

**Trigger:** Click on "Save Signal" button. ID: `saveSignalBtn`.

**Logic:**
1. Read `signalInput.value`. If empty/whitespace-only, do nothing (or show brief alert).
2. Check current signal count in storage.
3. **If count >= 10:** Alert user — "You've reached the maximum of 10 signals. Delete one to add a new one." Do NOT save.
4. **If count < 10:** Create signal object `{ id: Date.now(), text: trimmedInput, isMarked: false }`.
5. Append to stored signals array in `chrome.storage.local`.
6. Clear textarea.
7. Render new accordion note in `accordionContainer`.
8. Refresh pill display.

---

### FEAT-05: Accordion Signal List

**Location:** Below action buttons. Container ID: `accordionContainer`.

Each saved signal renders as a collapsible accordion note:

**Collapsed state (default):**
- Header shows **bolded title** (first line or first ~50 chars of signal text).
- Delete button ("X") in top-right corner of header.

**Expanded state (on header click):**
- Full signal text visible below header.
- "Mark as Signal" toggle (button or checkbox). State reflects current `isMarked` value.

**Behaviors:**
- Click header → toggle expand/collapse of that note's content.
- Click "X" → delete signal (see FEAT-06).
- Click "Mark as Signal" → toggle mark (see FEAT-07).
- All notes collapsed by default on popup open.
- Notes rendered in order stored (newest at bottom, or newest at top — choose one, be consistent).

**Dynamic IDs:** Each accordion note's header and content divs must have unique IDs incorporating the signal's `id` (e.g., `accordionHeader_{id}`, `accordionContent_{id}`).

---

### FEAT-06: Delete Signal

**Trigger:** Click "X" on any accordion note.

**Logic:**
1. Remove signal object from storage array by `id`.
2. Save updated array to `chrome.storage.local`.
3. Remove the accordion note DOM element.
4. Refresh pill display (in case deleted signal was marked).

---

### FEAT-07: Mark as Signal (Priority Toggle)

**Trigger:** Click "Mark as Signal" button/checkbox within expanded accordion note.

**Logic:**
1. Toggle `isMarked` boolean for that signal in storage.
2. Save to `chrome.storage.local`.
3. Refresh pill display.
4. **Cap enforcement:** If marking would result in more than 4 marked signals, either alert the user or silently allow storage but only display first 4 in the pill.

---

### FEAT-08: Copy All Signals

**Trigger:** Click "Copy All Signals" button. ID: `copyAllSignalsBtn`.

**Logic:**
1. Retrieve all signals from storage.
2. Concatenate all `.text` values, separated by `\n`.
3. Write to clipboard via `navigator.clipboard.writeText()`.
4. Handle errors gracefully (alert on failure).
5. Optional: brief confirmation feedback ("Copied!" text flash).

---

### FEAT-09: Download Signals

**Trigger:** Click "Download Signals" button. ID: `downloadSignalsBtn`.

**Logic:**
1. Retrieve all signals from storage.
2. Concatenate all `.text` values, separated by `\n`.
3. Create `Blob` with type `text/plain`.
4. Generate object URL.
5. Create temporary `<a>` element with `href` = object URL, `download` = `"signal2noise_signals.txt"`.
6. Programmatic click to trigger download.
7. Revoke object URL after download.

---

## Initialization Flow (on `DOMContentLoaded`)

```
1. Load signals array from chrome.storage.local
2. Load selectedRatio from chrome.storage.local
3. Set correct radio button checked state
4. Render all signals as accordion notes in accordionContainer
5. Refresh pill display based on marked signals
6. Attach all event listeners (save, copy, download, radio change)
```

---

## Constraints

| Rule | Detail |
|---|---|
| Max signals | 10 active at any time |
| Max displayed in pill | 4 marked signals |
| Min displayed in pill | 2 marked signals (pill empty/hidden below 2) |
| Storage engine | `chrome.storage.local` only |
| Clipboard | `navigator.clipboard.writeText()` with error handling |
| Permissions | `storage`, `clipboardWrite` |
| Manifest | Version 3 |
| CSS | Separate file — do not inline. Apply OIA Design System tokens. |
| No external dependencies | Vanilla JS only. No frameworks, no CDN imports. |

---

## Data Flow Summary

```
User Input → Save → chrome.storage.local → Re-render Accordion + Pill
           → Mark  → chrome.storage.local → Re-render Pill
           → Delete → chrome.storage.local → Re-render Accordion + Pill
           → Copy  → clipboard
           → Download → .txt file
```

---

## Element ID Reference

| Element | ID |
|---|---|
| Signal pill container | `signalPillContainer` |
| Ratio radio 80 | `ratio80` |
| Ratio radio 70 | `ratio70` |
| Ratio radio 60 | `ratio60` |
| Signal input textarea | `signalInput` |
| Save button | `saveSignalBtn` |
| Copy all button | `copyAllSignalsBtn` |
| Download button | `downloadSignalsBtn` |
| Accordion container | `accordionContainer` |
| Per-note header | `accordionHeader_{signal.id}` |
| Per-note content | `accordionContent_{signal.id}` |
| Per-note mark toggle | `markAsSignal_{signal.id}` |
| Per-note delete button | `deleteSignal_{signal.id}` |

---

## Out of Scope for v1.0

- AI-powered signal suggestions
- Signal-to-noise ratio affecting UI behavior (stored only)
- Cross-device sync
- Signal categories or tags
- Drag-and-drop reordering
- Dark mode toggle (handled by OIA Design System if needed)
- Analytics or usage tracking

---

## Build Notes

- This is a **Shovel** (Stage 1 micro-SaaS) in the Reverse-Build Assembly Line.
- Standalone Chrome Extension. No backend. No API calls. Pure client-side.
- If v1.0 validates (daily retention > 30%), evaluate Stage 2 (Sidekick) expansion with cloud sync and AI signal suggestions via Claude API.
- B2B hedge: extension source code is packageable for Gumroad sale ($200-$500).
- Manifest description: "Signal2Noise — Built for people with ADHD by someone with ADHD. Tune out the noise, focus in on your signal."
