# Archived Extensions

Extensions in this directory are **frozen** and not part of the active fleet. They are preserved here (rather than deleted) for git-history continuity, reference value, and potential salvage of patterns or code.

**Archived 2026-05-09 (Strike 016):**

| Extension | Reason |
|---|---|
| `oia.focus.signal` | Legacy `oia.focus.*` dot-namespace family — superseded by the active OIA portfolio (Focus Note, Focus Wall, Time2Focus, etc.). |
| `oia.focus.sound` | Same. |
| `oia-focus-timer` | Legacy timer; functional overlap with Time2Focus. Operator's Strike 016 directive named `oia.focus.timer` (no dot-form sibling exists); archived the kebab-form `oia-focus-timer` as the closest match. **Operator-confirmed correct target in Strike 017** — the archived extension's `_locales/en/messages.json` extName reads `[OIA] oia.focus` with description "Simple focus timer with preset intervals", confirming this is the legacy timer extension intended for archival. |

## Policy

- **Do NOT load archived extensions** in Chrome's developer mode.
- **Do NOT publish** archived extensions to the Web Store.
- **Do NOT cite** archived extensions in marketing or RAG-ingestion documents (TECH_STACK_AUDIT, PILLAR_STRATEGY, FACTORY_MANIFEST should treat the archive as out-of-scope).
- **Restoration**: any extension may be moved back to `extensions/{name}/` via `git mv` if its concept becomes relevant again. If restored, must pass full RULE-001 through RULE-008 compliance audit before re-entering the active fleet.

## Active Fleet (as of Strike 016)

12 extensions across 3 pillars:

- **OIA (8):** `864z-chronical`, `DataNap` (was TabVault), `oia-focus-note` (Focus Note), `oia-focus-wall` (Focus Wall), `Signal2Noise`, `Time2Focus`, `TuneOut2FocusIn`, `who-is-watching`
- **864-Flux (2):** `clipboard`, `migration-pilot`
- **FHG (2):** `Bible-Insight`, `scripture-scout`

See [`ISD-DIV-6-KNOWLEDGE/864zeros_FACTORY_MANIFEST.md`](../../../../864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_FACTORY_MANIFEST.md) for per-extension Tier-0.5 readiness status.

---

*Archive README v1.0 · 2026-05-09 · 864zeros LLC · DIV-3-FACTORY internal.*
