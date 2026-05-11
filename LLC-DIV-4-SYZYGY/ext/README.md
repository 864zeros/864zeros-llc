# SYZYGY · `/ext` — Chrome Skin

**Status:** Scaffold (SYZYGY Strike 001). Implementation deferred to Strike 002+.

## Purpose

Hosts the Chrome extension Skin — DOM/React UI that consumes the platform-agnostic `lib/core-engine.js` Bone. Loads core-engine as a classic script:

```html
<!-- options.html -->
<script src="../lib/core-engine.js"></script>
<script type="module" src="options.js"></script>
```

Inside options.js / panel.js / popup.js, access the engine via `globalThis.SyzygyCoreEngine`:

```js
const engine = globalThis.SyzygyCoreEngine;
const tier = await engine.getBillingTier();
const tree = await engine.driveListDirectory(accessToken, folderId);
```

## Planned structure (Strike 002+)

```
ext/
├── manifest.json               # Chrome MV3 manifest (storage + identity + drive scopes)
├── options/
│   ├── options.html            # imports ../lib/core-engine.js as classic script
│   ├── options.js              # ES module; consumes engine via globalThis
│   └── options.css             # Obsidian/Sage themed via Strike-033 tokens
├── service-worker.js           # background coordinator (token refresh, alarms)
└── sidepanel/                  # (optional) Drive Vault browser panel
```

## Brand

Reuses the Strike-033 fleet token system:
- `--864z-bg` / `--864z-text` / `--864z-border` (theme-aware via `<html data-theme>`)
- `--864z-accent` pillar-mapped (SYZYGY pillar TBD — operator decision in a later strike)

## Cross-references

- [`../lib/core-engine.js`](../lib/core-engine.js) — the Bone (load via classic script tag)
- [`../addon/Code.gs`](../addon/Code.gs) — Workspace sibling Skin
- [`../README.md`](../README.md) — project overview
