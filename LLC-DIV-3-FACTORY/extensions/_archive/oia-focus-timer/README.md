# oia.focus.timer (predecessor)

**This extension is a v1.1 iteration that has been superseded by `Time2Focus`.**

## Status
**Predecessor / archive.** Time2Focus is the canonical version of this product. New work happens there.

## Why Two Versions Exist
The OIA series went through naming iterations. `oia.focus.timer` was the early build (manifest still has `oia.focus` as appName, dotted-name convention). Time2Focus is the production-ready version with the formal CLAUDE.md spec, expanded sound library, color flash system, and persistent endTime via `chrome.alarms` API.

## What This Extension Does
A Chrome side-panel focus timer for ADHD users. Set a duration, name your focus topic, get a soft alert when time's up. Same core thesis as Time2Focus.

| Field | Predecessor (this) | Canonical (Time2Focus) |
|---|---|---|
| Name | oia.focus.timer | Time2Focus |
| Manifest version | 1.1.0 | 1.0 |
| Codename in messages | "oia.focus" | "Time2Focus" |
| Has CLAUDE.md spec | No | Yes |
| Sound options | Limited | Chime / Bowl / Raindrop / Soft Bell |
| Color flash system | No | 5 colors |
| Lifecycle | Stage 0 | Stage 1 Shovel |

## Recommendation for DIV-4 STUDIO
Do not market or list this extension separately. **Treat as archive.** All GTM activity for the focus-timer thesis routes through Time2Focus.

If keeping this directory: rename to `_archive/oia-focus-timer/` to reduce confusion in the Factory listing.

## See Also
- `extensions/Time2Focus/README.md` — canonical product
- `BRICK_REGISTRY.json` — bricks shared between predecessor and canonical
- `STRIKE_HISTORY_MASTER.md` — strategic context on OIA-series rollout

---

*OIA — Organize Your Internal Architecture. A 864zeros LLC product.*
*Predecessor — see Time2Focus for the canonical product.*
