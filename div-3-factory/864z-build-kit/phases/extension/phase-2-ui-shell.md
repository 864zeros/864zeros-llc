# Phase 2 — UI Shell

**Goal:** A fully styled panel with all screens/views stubbed out, navigation working, empty states displayed, and OIA design system applied. No functional features yet — just the complete visual shell.

**Time estimate:** 20-30 minutes  
**Prerequisite:** Phase 1 checkpoint passed.

---

## Inputs Required

- [ ] The **app brief** — specifically the **Screens/Views** section
- [ ] `references/oia-design-system.css` — already copied into `lib/` in Phase 1
- [ ] `references/oia-design-system-full.md` — for component specs, spacing, and UX rules

---

## Steps

### 2.1 Build Panel Layout Structure

The panel is a single `index.html` with views toggled via JavaScript. Do NOT use multiple HTML files or iframes.

```html
<body>
  <header class="panel-header">
    <!-- App title, minimal navigation -->
  </header>

  <main class="panel-content">
    <!-- Only ONE view visible at a time -->
    <section id="view-__NAME__" class="panel-view active">...</section>
    <section id="view-__NAME__" class="panel-view">...</section>
    <section id="view-__NAME__" class="panel-view">...</section>
  </main>

  <nav class="panel-nav">
    <!-- Tab bar or bottom navigation (if multiple views) -->
  </nav>
</body>
```

**View switching pattern:**

```javascript
function showView(viewId) {
  document.querySelectorAll('.panel-view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${viewId}`).classList.add('active');

  document.querySelectorAll('.panel-nav__item').forEach(n => n.classList.remove('oia-bottom-nav__item--active'));
  document.querySelector(`[data-view="${viewId}"]`)?.classList.add('oia-bottom-nav__item--active');
}
```

### 2.2 Apply OIA Design System

Every element uses OIA classes. Reference the component list:

| Element | OIA Class |
|---------|-----------|
| Primary button | `.oia-btn .oia-btn-primary` |
| Secondary button | `.oia-btn .oia-btn-secondary` |
| Text input | `.oia-input` |
| Card container | `.oia-card` |
| Heading | `.oia-h1`, `.oia-h2` |
| Body text | `.oia-body`, `.oia-body-sm` |
| Muted text | `.oia-caption` |
| Badge | `.oia-badge .oia-badge--completed` (etc) |
| Progress bar | `.oia-progress` > `.oia-progress__fill` |
| Checkbox | `.oia-checkbox` |
| Spinner | `.oia-spinner` |
| Toast | `.oia-toast .oia-toast--success` (etc) |
| Empty state | `.oia-empty` |
| FAB | `.oia-fab` |

### 2.3 Panel-Specific CSS

Write app-specific overrides in `sidepanel/styles.css`. This file handles:

- Panel width constraints (side panels are typically 300-400px wide)
- View show/hide logic
- Navigation active states
- Scroll behavior for content areas
- Any layout not covered by OIA utility classes

```css
/* Panel dimensions */
body {
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
}

/* View switching */
.panel-view {
  display: none;
}

.panel-view.active {
  display: block;
}

/* Scrollable content area */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--oia-space-md);
}

/* Fixed header */
.panel-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--oia-bg-card);
  padding: var(--oia-space-md);
  border-bottom: 1px solid rgba(166, 148, 133, 0.2);
}

/* Fixed bottom nav (if used) */
.panel-nav {
  position: sticky;
  bottom: 0;
  z-index: 10;
}
```

### 2.4 Build Empty States

Every view starts with an empty state. This is what the user sees before they've used any features. Follow the OIA empty state pattern:

```html
<div class="oia-empty">
  <div class="oia-empty__headline">Nothing here yet</div>
  <div class="oia-empty__subtext">Ready when you are.</div>
  <button class="oia-btn oia-btn-primary">Get started</button>
</div>
```

**Copy rules from the design system:**
- Never say "You haven't done X yet" → Say "Nothing here yet" or "Ready when you are"
- Never guilt. Never pressure. Always inviting.
- Include a single clear action button.

### 2.5 Build Options Page Shell

The options page uses the same OIA CSS but has a full-page layout:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>__APP_NAME__ Settings</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../lib/oia-design-system.css">
</head>
<body>
  <div class="oia-screen" style="max-width: 600px; margin: 0 auto;">
    <h1 class="oia-h1">Settings</h1>

    <div class="oia-card oia-mb-md">
      <h2 class="oia-h2 oia-mb-sm">General</h2>
      <!-- Settings fields here -->
    </div>

    <div class="oia-card oia-mb-md">
      <h2 class="oia-h2 oia-mb-sm">Your Plan</h2>
      <!-- Tier display + upgrade button -->
      <p class="oia-body" id="current-tier">Free</p>
      <button class="oia-btn oia-btn-secondary" id="upgrade-btn">Upgrade</button>
    </div>

    <div class="oia-card oia-mb-md">
      <h2 class="oia-h2 oia-mb-sm">Data</h2>
      <!-- Export / Import / Google Drive sync -->
      <button class="oia-btn oia-btn-secondary" id="export-btn">Export my data</button>
      <button class="oia-btn oia-btn-secondary oia-mt-sm" id="import-btn">Import data</button>
    </div>

    <div class="oia-card oia-mb-md">
      <h2 class="oia-h2 oia-mb-sm">Fuel the Build</h2>
      <p class="oia-body-sm">Love this tool? Help us build the next feature.</p>
      <button class="oia-btn oia-btn-primary" id="fuel-btn">Buy us a coffee ☕</button>
    </div>

    <p class="oia-caption" style="text-align: center;">
      No ads. No tracking. Your data stays yours.<br>
      Made by 864zeros LLC
    </p>
  </div>
  <script type="module" src="options.js"></script>
</body>
</html>
```

### 2.6 Wire Up Navigation

Connect the tab/nav buttons to the `showView()` function. No data loading yet — just view switching.

### 2.7 Test Dark Mode

Open the panel. Toggle your OS to dark mode. Verify:
- Background switches from Cream to Dark BG
- Text switches from Charcoal to Off-White
- Cards switch from Warm White to Dark Card
- Buttons, badges, inputs all adapt
- No white flashes, no unthemed elements

---

## Checkpoint

```
CHECKPOINT: Phase 2 — UI Shell
VERIFY:
  1. Panel opens and shows the first view with an empty state
  2. All navigation tabs/buttons switch views correctly
  3. OIA design system classes render correctly (fonts, colors, spacing)
  4. Dark mode works — toggle OS theme and verify all views
  5. Options page loads and displays all sections (settings, plan, data, fuel)
  6. No horizontal scroll in the panel at any standard width
  7. All text follows OIA copy rules (no guilt, no pressure, inviting tone)
  8. DevTools console shows no errors
STATUS: [ready for Phase 3 / blocked on ___]
```

**Do not proceed to Phase 3 until all 8 checks pass.**
