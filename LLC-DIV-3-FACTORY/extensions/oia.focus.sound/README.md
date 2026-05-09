# oia.focus.sound (predecessor)

**This extension is a v1.1 iteration that has been superseded by `TuneOut2FocusIn`.**

## Status
**Predecessor / archive.** TuneOut2FocusIn is the canonical version of this product. New work happens there.

## Why Two Versions Exist
The OIA series went through naming iterations. `oia.focus.sound` was the early build (manifest uses dotted-name convention `oia.focus.sound`, has audio MP3 web-accessible resources). TuneOut2FocusIn is the production-ready version with the formal CLAUDE.md spec, offscreen-audio architecture for MV3 service worker reliability, and a clean panel UI.

## What This Extension Does
A Chrome extension that plays loopable background noise (white / pink / brown / gentle rain) via `chrome.offscreen` audio for MV3 reliability. Same core thesis as TuneOut2FocusIn.

| Field | Predecessor (this) | Canonical (TuneOut2FocusIn) |
|---|---|---|
| Name | oia.focus.sound | TuneOut2FocusIn |
| Manifest version | 1.1.0 | 1.0.0 |
| Codename in messages | "oia.focus.sound" | "TuneOut2FocusIn" |
| Has CLAUDE.md spec | No | Yes |
| Audio architecture | Has offscreen.html (in this directory) | Has offscreen + formal MV3-correct pattern documented |
| Lifecycle | Stage 0 | Stage 1 Shovel |

## Recommendation for DIV-4 STUDIO
Do not market or list this extension separately. **Treat as archive.** All GTM activity for the focus-noise thesis routes through TuneOut2FocusIn.

If keeping this directory: rename to `_archive/oia.focus.sound/` to reduce confusion in the Factory listing.

## See Also
- `extensions/TuneOut2FocusIn/README.md` — canonical product
- `BRICK_REGISTRY.json` — bricks shared between predecessor and canonical

---

*OIA — Organize Your Internal Architecture. A 864zeros LLC product.*
*Predecessor — see TuneOut2FocusIn for the canonical product.*
