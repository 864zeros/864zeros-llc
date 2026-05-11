# LLC-DIV-3-FACTORY / shared / bricks

**Reusable, dependency-free utility bricks shared across 864zeros extensions and pipelines.**

This directory holds standalone JS modules that follow the 864zeros Build Block protocol — each module exposes a clear `Input → Process → Output` contract, has zero runtime dependencies (Node stdlib only), and is registered in the canonical brick registry at `864zeros-ISD/ISD-DIV-0-CORE/BRICK_REGISTRY.json`.

These differ from per-extension code: extension `lib/` modules are scoped to that product. Bricks here are **product-neutral** — they should be importable into any extension or pipeline without modification.

---

## Conventions

Every brick in this directory:

1. **Has a single, well-defined contract** documented in a header comment block (Input → Process → Output).
2. **Is dependency-free** — uses only Node standard library + ES2020. No npm install required to use a brick.
3. **Is self-testing** — running `node <brick-name>.js` directly executes a built-in test harness. Exit code 0 = pass, non-zero = fail.
4. **Is registered** in `BRICK_REGISTRY.json` with: brick_id, category, source_paths, contract, complexity, dependencies, notes, ROI mapping.
5. **Documents the spec it implements** if it defines one (e.g. `agent-markdown-converter` defines the 864z-metadata YAML frontmatter spec v1.0).

---

## Currently Shipped

| Brick | Category | Complexity | Purpose |
|---|---|---|---|
| [`agent-markdown-converter.js`](./agent-markdown-converter.js) | Export | S (290 LOC) | Convert content + metadata into clean Markdown with 864z YAML frontmatter, with cross-OS-safe filenames |

---

## `agent-markdown-converter.js` — v1.0.0

### Contract

| Phase | Detail |
|---|---|
| **Input** (single) | `{ content, title, source_url, timestamp, tags, note, extra? }` |
| **Input** (batch) | Array of single inputs + `options` |
| **Process** | 1) Strip script/style. 2) Convert HTML tags → Markdown (headings, lists, links, bold/italic, code blocks, blockquotes). 3) Decode HTML entities (named + numeric). 4) Build YAML frontmatter per 864z-metadata spec v1.0. 5) Sanitize filename for Windows + macOS + Linux (handles reserved chars, reserved names like CON/PRN/AUX, control chars, length limits, collision suffixing for duplicates). |
| **Output** (single) | `{ filename: string, markdown: string }` |
| **Output** (batch) | `{ files: Array<{filename, markdown}> }` — one per item by default; combined into single file when `options.combined === true` |

### 864z-metadata spec v1.0

The YAML frontmatter shape this brick produces:

```yaml
---
title: "<string>"
source_url: "<string or '-'>"
captured_at: "<ISO 8601>"
tags:                       # optional — omitted if empty
  - "<string>"
note: "<string>"            # optional — omitted if empty
generator: 864zeros/agent-markdown-converter
generator_version: 1.0.0
---
```

Custom keys can be passed via `meta.extra` in the input — they flow through unchanged.

### Public API

```js
const md = require('./agent-markdown-converter');

// Single conversion
const { filename, markdown } = md.convertItem({
  content: '<p>The thing about <strong>vendor lock-in</strong>...</p>',
  title: 'Vendor Lock-in',
  source_url: 'https://example.com/article',
  timestamp: '2026-05-07T15:30:00Z',
  tags: ['ai', 'rescue'],
  note: 'Quoted from migration manifesto.',
});
// filename: "Vendor-Lock-in-2026-05-07.md"
// markdown: "---\ntitle: ...\n---\n\n# Vendor Lock-in\n\nThe thing about **vendor lock-in**...\n\n*Source: <https://example.com/article>*\n"

// Batch — one file per item (collision-safe via auto-suffix)
const { files } = md.convertBatch(items);

// Batch — single combined file
const { files: [combined] } = md.convertBatch(items, {
  combined: true,
  combinedFilename: 'all-highlights',
  combinedTitle: 'My Web Highlights migration',
});

// Lower-level helpers (also exported)
md.htmlToMarkdown(htmlString)        // -> markdown string
md.buildFrontmatter({title, ...})    // -> "---\n...\n---\n"
md.sanitizeFilename(rawName, opts)   // -> safe filename
md.decodeEntities(htmlEncodedStr)    // -> decoded string
```

### Options

```js
{
  // Frontmatter / body
  includeFrontmatter: bool,        // default true
  includeTitleHeading: bool,       // default true (prepends `# {title}` to body)
  generator: string,               // default '864zeros/agent-markdown-converter'
  generatorVersion: string,        // default '1.0.0'

  // Filename
  dateInFilename: bool,            // default true — appends -YYYY-MM-DD for collision-safety
  filenamePrefix: string,          // optional, e.g. 'wh-' for 'wh-my-highlight.md'
  filenameMaxLength: number,       // default 80

  // Batch-only
  combined: bool,                  // default false — when true, all items are emitted into one file
  combinedFilename: string,        // default 'highlights-YYYY-MM-DD'
  combinedTitle: string,           // frontmatter title for the combined file
  combinedTags: string[],          // frontmatter tags for the combined file
}
```

### Self-Test

```bash
node agent-markdown-converter.js
```

Runs 5 built-in tests:
1. Plain-text highlight with full metadata
2. HTML content with bold/link conversion
3. Title with illegal characters (sanitization stress test)
4. Batch with duplicate titles (collision-protection check)
5. Combined-batch mode

Exit code 0 = pass. Current state: **5/5 pass**.

### Strike 011 Role (MigrationPilot)

This brick was the gating dependency for Strike 011 (Web Highlights → Obsidian/Capacities migration). With it shipped:

- **5 of 5 essential bricks ready** for MigrationPilot v1
- Pairs with `agent-drive-sync` (vault destination) and `agent-local-backup` (JSON intermediate pattern)
- Optional pairing with `agent-anonymizer-pii` (privacy compliance for synced vaults)

### Cross-Product Synergy

The brick is also a **drop-in feature** for existing 864zeros extensions:

| Extension | What it gains |
|---|---|
| **clipboard** | "Export to Obsidian / Capacities" for any saved clip — cross-promo lever |
| **Bible-Insight** | Markdown export of sermon notes / verse cross-references |
| **Chronicle (864z-chronicle)** | Export AI conversation history to Markdown for vault-style archiving |
| **OIA series** (Signal2Noise, oia-focus-note, oia-focus-wall) | "Send to Obsidian" for any captured signal/note/sticky |

---

## Adding a New Brick

When proposing a new brick for this directory:

1. **Check the registry first** — `BRICK_REGISTRY.json` may already have a `missing_bricks[]` entry with proposed contract. If so, use that as your spec.
2. **Match the conventions** in this README: header contract block, zero deps, embedded self-test, public API exposed via `module.exports`.
3. **After building, register it** — move from `missing_bricks` into the `bricks[]` array, update `audit_summary` counts, update `roi_mapping` cross-references, update this README's "Currently Shipped" table.
4. **Document the file in the brick** — every brick should self-document its contract so a reader of the code alone knows how to use it.

---

## Why This Layout Exists

Pre-cleanup, reusable code was duplicated across extensions:
- `clipboard/lib/redactor.js` and `Bible-Insight` (planned to copy it)
- `clipboard/lib/google-drive/drive-client.js` and `webinsights/js/lib/google-drive.js` (separate but functionally equivalent)
- `clipboard/lib/pdf-generator.js` and `webinsights/js/lib/pdf-generator.js` (same)

Migrating those into `LLC-DIV-3-FACTORY/shared/bricks/` lets each extension import a single canonical implementation. Future cycles will harvest the existing brick-equivalents into this directory and update extension `lib/` to import-rather-than-copy.

`agent-markdown-converter` is the first **net-new** brick — it filled a gap rather than consolidating duplicates.

---

*864zeros LLC — LLC-DIV-3-FACTORY shared bricks.*
*Single source of truth for catalog: `864zeros-ISD/ISD-DIV-0-CORE/BRICK_REGISTRY.json`.*
