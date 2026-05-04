# Side Panel Template

Standard responsive structure for 864zeros Chrome extension side panels.

---

## Key Principle: Responsive Panel Width

Chrome side panels can be resized by users. The panel must adapt gracefully from **280px (minimum)** to **1000px+ (maximized)**.

**Breakpoints:**
| Width | Columns | Layout |
|-------|---------|--------|
| 280px (min) | 1 | Single column, stacked cards |
| 480px+ | 2 | Two-column grid |
| 640px+ | 3 | Three-column grid, more padding |
| 800px+ | 4 | Four-column grid, centered content |
| 1000px+ | 5 | Five-column grid (rare but supported) |

---

## Required Structure

```html
<body>
  <!-- 1. HEADER — Sticky, always visible -->
  <header class="panel-header">
    <h2>App Name</h2>
    <button class="panel-header__settings">Settings</button>
  </header>

  <!-- 2. CONTENT — Scrollable, flexible height -->
  <main class="panel-content">
    <!-- Views switch here -->
    <div class="panel-view active" id="view-list">...</div>
    <div class="panel-view" id="view-tags">...</div>
    <div class="panel-view" id="view-search">...</div>
  </main>

  <!-- 3. FAB — Fixed position, above nav -->
  <button class="oia-fab">+</button>

  <!-- 4. BOTTOM NAV — Fixed, always visible -->
  <nav class="oia-bottom-nav">...</nav>

  <!-- 5. PRIVACY FOOTER — Optional, below nav -->
  <footer class="privacy-footer">
    No ads. No tracking. Your data stays yours.
  </footer>
</body>
```

---

## CSS Requirements

### Base Layout (Copy These)

```css
html, body {
  height: 100%;
  margin: 0;
  overflow: hidden;
}

body {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 280px;
  /* No max-width — panel expands freely */
}

.panel-header {
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}
```

### Responsive Grid (Copy These)

```css
/* Medium panel (480px+) */
@media (min-width: 480px) {
  .clips-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--oia-space-md);
  }
}

/* Wide panel (640px+) */
@media (min-width: 640px) {
  .clips-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Extra wide (800px+) */
@media (min-width: 800px) {
  .clips-list {
    grid-template-columns: repeat(4, 1fr);
  }

  /* Center content for readability */
  .panel-content {
    max-width: 1000px;
    margin: 0 auto;
  }
}
```

---

## Component Guidelines

### Cards

- Use `width: 100%` and `box-sizing: border-box`
- Never use fixed widths — let grid control sizing
- Content should truncate gracefully (use `-webkit-line-clamp`)

### Images/Screenshots

- Use `width: 100%; height: auto;` for responsive images
- Set `max-height` to prevent overly tall cards
- Use `object-fit: cover` for thumbnails

### Dialogs/Modals

- Scale `max-width` with panel width
- Mobile: 280px → Wide panel: 600px+
- Always center with flexbox

### FAB Position

```css
.oia-fab {
  position: fixed;
  bottom: calc(var(--oia-bottom-nav-h) + var(--oia-space-md));
  right: var(--oia-space-md);
  z-index: 50;
}
```

---

## Files

```
sidepanel/
├── index.html     # Panel structure
├── styles.css     # Panel-specific styles + responsive
├── main.js        # Panel logic
└── views/         # Optional: separate view templates
```

---

## Checklist

Before shipping, verify at these widths:

- [ ] **280px** — Minimum width, single column, no horizontal scroll
- [ ] **360px** — Typical narrow panel
- [ ] **480px** — Two columns appear, cards reflow
- [ ] **640px** — Three columns, more breathing room
- [ ] **800px** — Four columns, content centered
- [ ] **1000px** — Ultra-wide, still looks good

Test by dragging the panel edge in Chrome DevTools or the actual extension.

---

## Anti-Patterns

**Don't do this:**
```css
/* Fixed widths break responsiveness */
.card { width: 300px; }

/* Horizontal scroll is bad UX */
.container { min-width: 500px; }

/* Hard-coded columns ignore panel width */
.grid { grid-template-columns: repeat(3, 1fr); }
```

**Do this instead:**
```css
/* Fluid widths */
.card { width: 100%; }

/* Let content determine minimum */
.container { min-width: 280px; }

/* Responsive columns via media queries */
@media (min-width: 480px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}
```

---

*Template version: 1.0.0*
