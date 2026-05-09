# `accordion-record-v1` — Interactive Record Accordion (BRK-UI-004)

**Authority:** [`BUILD_KIT_RULES.md`](../../../references/core/BUILD_KIT_RULES.md) → RULE-004
**Origin:** Strike 012 (ScriptureScout) — sidepanel accordion refactor
**Brick ID:** BRK-UI-004
**Version:** 1.0.0 (first directory-format brick — see "Versioned Directories" below)

---

## What this brick does

Manages an expandable list of records. Each record has an always-visible **Header** (metadata, click-to-toggle) and a hidden **Body** (full content + action row) that expands smoothly via a grid-template-rows transition. A Bronze chevron in the header rotates 90° on expand.

Default behavior is **exclusive** — clicking one record collapses any others (keeps the panel calm for ADHD-friendly focus). Holding **Shift** while clicking switches to **multi-expand "Compare Mode"** — useful for diffing two captures side-by-side.

This pattern is mandated by RULE-004 for any extension with a queue-of-records UI.

---

## Files

```
accordion-record-v1/
├── index.js     — AccordionController class + createChevronSVG() helper
├── styles.css   — Drop-in CSS using --oia-* tokens (pillar-agnostic)
└── usage.md     — This file
```

The brick is **directory-format** (rather than the flat-file format used by BRK-DL-001 / BRK-UI-002 / BRK-UI-003) because it ships JS + CSS + docs as one cohesive unit. Hosts copy the entire directory into their `lib/bricks/`.

---

## Required HTML structure

The brick separates concerns: **the host builds the DOM**, the brick attaches behavior. The contract is minimal — just specific class names and one data attribute.

```html
<div class="accordion-list">

  <!-- One record per row; data-record-id is the brick's lookup key -->
  <div class="accordion-record" data-record-id="42">

    <!-- HEADER (always visible, click-to-toggle) -->
    <div class="accordion-record__header"
         role="button" tabindex="0"
         aria-expanded="false"
         aria-controls="record-body-42">

      <!-- Optional: selection checkbox (RULE-003 pairing).
           Mark with [data-no-toggle] so the brick ignores its clicks. -->
      <label class="accordion-record__select" data-no-toggle>
        <input type="checkbox" class="oia-checkbox">
      </label>

      <!-- Title block (host content) -->
      <div class="accordion-record__title-block">
        <div class="accordion-record__title">John 3:16</div>
        <div class="accordion-record__meta">
          May 8, 7:42 PM · biblegateway.com
        </div>
      </div>

      <!-- Chevron (Bronze, rotates 90° on expand) -->
      <button class="accordion-record__chevron"
              type="button"
              data-no-toggle
              aria-label="Toggle">
        <!-- Use createChevronSVG() — canonical right-arrow that rotates -->
      </button>
    </div>

    <!-- BODY (hidden until expanded; grid-template-rows transition) -->
    <div class="accordion-record__body-wrapper">
      <div class="accordion-record__body" id="record-body-42">

        <!-- Parchment Reading Surface (#F5F5F5 default — see below) -->
        <div class="accordion-record__reading">
          For God so loved the world that he gave his only Son...
        </div>

        <!-- Action Row (View Source · Liberate · Remove · etc.) -->
        <div class="accordion-record__actions">
          <a class="accordion-record__action"
             href="https://biblegateway.com/..." target="_blank"
             rel="noopener noreferrer">View Source</a>
          <button class="accordion-record__action accordion-record__action--primary"
                  type="button">Liberate to Vault</button>
          <button class="accordion-record__action accordion-record__action--danger"
                  type="button">Remove</button>
        </div>
      </div>
    </div>

  </div>
</div>
```

### Required class anatomy
- `.accordion-list` — outer container (flex column, gap)
- `.accordion-record` — one record element; **must have `data-record-id`**
- `.accordion-record__header` — clickable header (role=button + tabindex + aria-expanded)
- `.accordion-record__chevron` — visible toggle indicator
- `.accordion-record__body-wrapper` — grid-template-rows host
- `.accordion-record__body` — `min-height: 0; overflow: hidden`
- `.accordion-record__reading` — Parchment surface (see below)
- `.accordion-record__actions` — flex row of `.accordion-record__action` buttons/links

### `[data-no-toggle]`
Mark any nested control (checkbox, action button, link) with this attribute. The brick will ignore clicks on those elements rather than toggling the accordion.

---

## JS API

```javascript
import {
  AccordionController,
  createChevronSVG,
} from '../lib/bricks/accordion-record-v1/index.js';

const accordion = new AccordionController({
  container: document.querySelector('.accordion-list'),
  exclusive: true,            // default — one open at a time
  shiftMultiExpand: true,     // default — Shift+Click overrides exclusive
  onChange: (expandedIds) => {
    // Called after every state change. Useful for persisting state.
    console.log('expanded:', [...expandedIds]);
  },
});

// Programmatic control
accordion.toggle(42);                  // toggle by ID
accordion.toggle(42, /*shift*/ true);  // multi-expand toggle
accordion.expand(42);
accordion.collapse(42);
accordion.collapseAll();
accordion.isExpanded(42);              // → boolean
accordion.getExpandedIds();            // → number[] (or string[])

// After re-rendering the list, re-sync expansion state to the new DOM:
await renderRecords();
accordion.refresh();

// Tear down (e.g., on page unload):
accordion.destroy();
```

### Construction options

| Option | Type | Default | Purpose |
|---|---|---|---|
| `container` | `HTMLElement` | **required** | The list container element |
| `recordSelector` | `string` | `.accordion-record` | Per-record selector |
| `headerSelector` | `string` | `.accordion-record__header` | Clickable header selector |
| `chevronSelector` | `string` | `.accordion-record__chevron` | Chevron selector (for aria-label sync) |
| `bodyWrapperSelector` | `string` | `.accordion-record__body-wrapper` | Body wrapper (for click-inside detection) |
| `expandedClass` | `string` | `accordion-record--expanded` | Class added when expanded |
| `exclusive` | `boolean` | `true` | One-open-at-a-time |
| `shiftMultiExpand` | `boolean` | `true` | Shift+Click → multi-expand |
| `onChange` | `(Set) => void` | `null` | Callback after every state change |

---

## Required CSS tokens (OIA Design System)

The brick's stylesheet uses **only** `--oia-*` tokens — no hard-coded brand colors. Pillar palettes flow through automatically:

| Token used | OIA value | 864-Flux value | FHG value |
|---|---|---|---|
| `--oia-accent` | sage `#8BA888` | graphite `#374151` | bronze `#A67C52` |
| `--oia-bg-card` | warm-white | dark-graphite-card | charcoal-card |
| `--oia-text-primary` | charcoal | warm-white | warm-white |
| `--oia-text-inverse` | warm-white | charcoal | charcoal |
| `--oia-text-muted` | (theme value) | (theme value) | (theme value) |

The chevron, focus outlines, expanded state, and primary action button all use `--oia-accent`. Drop the brick into any pillar without modification.

---

## Parchment Reading Surface standard

The `.accordion-record__reading` panel is **always a light surface** — even in dark themes. This is the "Kindle sepia card" pattern: when the user is reading captured content, they get high-contrast light text-on-light regardless of the surrounding chrome. Reduces eye strain for long reading sessions and matches the "permanent, sovereign study vault" intent of FHG-pillar products.

Defaults:
- Background: `#F5F5F5` (Parchment / Warm-White)
- Text color: `#2D2419` (Deep brown)
- Inset shadow: `inset 0 1px 4px rgba(0, 0, 0, 0.18)` (visual separation from header)
- Max height: `500px` (CSS variable `--accordion-reading-max-height` — override per host)

### Pillar overrides

Hosts may customize via CSS variables on the parent or `:root`:

```css
:root {
  --oia-reading-surface:    #F5EDD8;  /* deeper Parchment cream */
  --oia-reading-text:       #2D2419;
  --oia-reading-heading:    #1F1A11;
  --oia-reading-link:       #6E5034;
  --accordion-reading-max-height: 500px;
}
```

For FHG products that want the literal Parchment palette: set `--oia-reading-surface: #F5EDD8` to match the FHG light-theme background. Most products keep the default `#F5F5F5` because it provides the highest contrast against any dark or light chrome.

---

## Versioned Directories

This is the **first directory-format brick** in the build-kit. Prior bricks (BRK-DL-001, BRK-UI-002, BRK-UI-003) are flat single files because they ship pure JS with no companion assets.

When a brick ships **JS + CSS + docs** as a unit (or when a major version bump would break existing imports), the directory format is preferred:

```
templates/bricks/
├── headless-download-uri.js          ← flat (single file)
├── tristate-checkbox-list.js         ← flat
├── two-tap-arm-pattern.js            ← flat
└── accordion-record-v1/              ← directory (first of its kind)
    ├── index.js
    ├── styles.css
    └── usage.md
```

The `-v1` suffix anticipates v2 sitting alongside (`accordion-record-v2/`) when a breaking change lands. Hosts pin to a specific version by import path, so v2 doesn't silently replace v1.

---

## Compliance verification (RULE-004)

```
[ ] Extension's queue UI uses .accordion-record class structure
[ ] Each record has data-record-id attribute
[ ] Header has role="button", tabindex="0", aria-expanded
[ ] Chevron rotates on expand (visible visual signal)
[ ] grid-template-rows transition is present (smooth expand/collapse)
[ ] AccordionController constructed with shiftMultiExpand: true (default)
[ ] Action row includes at least one primary action (e.g., "Liberate")
[ ] Reading surface is Parchment (#F5F5F5 or pillar override)
[ ] Inner shadow distinguishes body from header
[ ] prefers-reduced-motion respected (handled by brick CSS)
```

---

## Reference implementation

`LLC-DIV-3-FACTORY/extensions/scripture-scout/sidepanel/main.js` and its companion `sidepanel/styles.css` are the inline reference implementation that this brick was extracted from. The class names there use `capture-card-*` (extension-specific) rather than `accordion-record-*` (brick-canonical) — that's fine for the source extension; new extensions adopting the brick should use the canonical class names.

---

*Brick docs v1.0 · 2026-05-08 · 864zeros LLC · per RULE-004 / RULE-000 sign-off*
