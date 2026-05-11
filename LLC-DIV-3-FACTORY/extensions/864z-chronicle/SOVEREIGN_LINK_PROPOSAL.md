# Chronicle: Sovereign Link Proposal [v1.0]

**Authority:** 864z-OA (Office Architect) per RULE-000.
**Loaded:** Engineering proposal — review by Operator + Systems Engineer before any code changes.
**Authored:** 2026-05-09 by 864z-OA per RULE-000.
**Update protocol:** Append revisions; supersession marked. This is an *engineering proposal*, not a strike charter — it identifies injection points and recommends mechanics. The decision to build, defer, or reject lives with the Operator.
**Sources synthesized:** [`extensions/864z-chronicle/lib/db.js`](./lib/db.js) (lines 1-193) · [`extensions/864z-chronicle/sidepanel/panel.js`](./sidepanel/panel.js) (lines 1-611) · [`864zeros_SOVEREIGN_GAP_REPORT.md`](../../../../864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_SOVEREIGN_GAP_REPORT.md) §IX.1.
**Format note:** Follows the `864z-markdown-standard` (RULE-008).

---

## I. Audit Correction — Sovereign Gap Report §IX.1 was partially wrong

The Sovereign Gap Report v1.0 §IX.1 claimed:

> *"Chronicle has zero Liberation path — captures full AI conversation history from gemini.google.com / claude.ai / chatgpt.com / aistudio.google.com / chat.openai.com to local IndexedDB, but has NO export action."*

**That claim is false.** A close read of `sidepanel/panel.js` reveals **three** existing Liberation paths:

| Function | Lines | Output | UI binding | Visibility |
|---|---|---|---|---|
| `downloadFullConversation(id)` | 397–469 | Single conversation as Markdown with frontmatter | Per-card download icon (panel.js:172–178) | ✅ Visible on every entry card |
| `downloadExchangeAsMarkdown(exchange, entry)` | 472–527 | Single message as Markdown | Per-message download button (panel.js:246–252, in detail view) | ⚪ Visible only after opening an entry |
| `exportData()` | 530–558 | Full database — every entry + every exchange — as one JSON file | Settings → "Export my data" button (`#export-btn`) | 🟡 Buried in Settings |

The export mechanism uses the standard sidepanel-context `Blob + URL.createObjectURL + <a>.click()` pattern (RULE-002 does not apply because this runs in the sidepanel document context, not the service worker — the rule scopes to SW downloads only).

**Why the audit was wrong:** the audit agent searched for `chrome.downloads.download` calls (the canonical RULE-002 brick pattern) and missed the sidepanel `Blob + a.click()` pattern. Chronicle's exports are real but use a different download mechanic. The Sovereign Gap Report should be amended in v1.1 to reflect this correction.

**What the audit got *right*:** Chronicle's Liberation paths are **buried** and not promoted as a sovereignty feature. A user who never opens Settings or never notices the per-card download icon WILL lose 100% of their data on uninstall — not because the export is missing, but because they never knew to use it. The risk gap is therefore **discoverability**, not capability.

---

## II. Existing IndexedDB Schema (the "Vault" we are protecting)

`lib/db.js` defines a single IndexedDB at version 1 with two object stores:

```javascript
const DB_NAME = 'chronicle';
const DB_VERSION = 1;
```

| Object store | Key path | Indexes | Purpose |
|---|---|---|---|
| `entries` | `id` | `by-date` (recordedAt), `by-scribe` (scribe), `by-starred` (starred) | Conversation metadata (one per captured AI session) |
| `exchanges` | `id` | `by-entry` (entryId) | Individual messages — one per turn within a conversation |

**Public API surface** (5 functions used by `panel.js` via `chrome.runtime.sendMessage` to the SW, which presumably re-exports them):
- `openDB()` — lazy singleton open
- `saveEntry(entry, exchanges)` — atomic write of an entry + its exchanges
- `getEntries({ limit, scribe, starred })` — paginated read with filters
- `getEntry(id)` — single entry + its exchanges
- `deleteEntry(id)` — entry + cascade-delete its exchanges
- `updateEntry(id, updates)` — partial update with `updatedAt` stamp
- `searchEntries(query)` — client-side substring search over title + excerpt
- `clearAll()` — wipe both stores (the destructive home for RULE-005 two-tap)

**The whole vault is two object stores.** A complete export is straightforward — already implemented at `panel.js:530-558` via `exportData()`.

---

## III. Recommended Injection Points — "Promote, Don't Rebuild"

The Sovereign Link feature should be a **promotion + UX hardening** of the existing `exportData()` path, NOT a parallel implementation. Two injection points:

### III.a — Primary injection point: Sidepanel header

**File:** `sidepanel/panel.html` (header region — likely near the search box and settings cog)
**Mechanism:** A persistent **"Liberate Vault"** button or downward-arrow icon, visible always (not buried in Settings).
**Wiring:** Calls a new `liberateVault()` function in `panel.js` that wraps the existing `exportData()` logic but with:
- A "Tap again to confirm" two-tap arm pattern (per RULE-005)
- A pre-export entry-count toast: *"Exporting N entries (M messages) as JSON to your Downloads folder."*
- Post-export success toast: *"Vault liberated. {N} entries written to chronicle-export-{date}.json"*

**Why the header (not Settings):** the header is the surface the user sees on every panel open. Settings is a destination they navigate TO, only when something is wrong. Sovereignty deserves the operational surface, not the meta surface.

### III.b — Secondary injection point: First-run nudge

**File:** New — `sidepanel/panel.js → showSovereigntyOnboarding()` triggered on first-ever entry capture.
**Mechanism:** A one-time toast or banner: *"Chronicle stores your captures locally on this device. Export anytime via the ⬇ icon in the header — your data never leaves you."*
**Storage:** A `chrome.storage.local.sovereignty_onboarded = true` flag prevents re-display.
**Why:** users learn what's available. Discoverability is the actual P0 the audit was pointing at.

### III.c — Tertiary injection point (Tier-0.5): Multi-format export

**File:** `sidepanel/panel.js` — extend the new `liberateVault()` with a format selector (JSON / Markdown-vault-folder / both).
**Gating:** Multi-format export gates behind the Tier-0.5 unlock (see `TIER_0_5_BLUEPRINT.md`). Free tier gets JSON. Tier-0.5 ($2.99) unlocks the **Markdown-vault-folder export** — one `.md` per conversation in an Obsidian-friendly folder structure (`chronicle/{scribe}/{date}-{title}.md`).
**Why this monetizes well:** the JSON export is technically sovereign (data leaves the extension) but operationally clunky for vault-native users. Markdown-folder export is the actual *useful* form for Obsidian/Logseq users. That's the Founding-100-tier customer. They will pay $2.99 to skip writing their own JSON-to-Markdown converter.

---

## IV. RULE-001 Compliance Side-Effect (Free Win)

Chronicle currently has NO `options_ui` page (per `TECH_STACK_AUDIT.md` §IV.a — confirmed RULE-001 violation). Settings live inside the sidepanel under a `settingsView` div toggled via `openSettings()` (panel.js:67-79, 356-363).

The Tier-0.5 Blueprint (companion document `TIER_0_5_BLUEPRINT.md`) introduces a proper RULE-001-compliant Options page. **Building the Sovereign Link feature alongside the Options page closes both gaps in one strike** — the new Options page is the natural home for:
- Tier disclosure (Free vs Tier-0.5 Vault)
- Vault export controls (with Tier-0.5 gating)
- Data Management section (with two-tap RULE-005 destructive controls — the existing `clearAllData()` at panel.js:561 currently uses `confirm()`, which is RULE-005-forbidden — needs migration in the same strike)

---

## V. Defects to Fix in the Same Strike (Honest Inventory)

While reading the code for this proposal, I noticed three additional issues that should be addressed alongside the Sovereign Link work:

| Issue | Location | Severity | Fix |
|---|---|---|---|
| **`confirm()` used for destructive action** (RULE-005 violation) | `panel.js:562` — `clearAllData()` | MEDIUM | Migrate to two-tap arm pattern (BRK-UI-003) |
| **No brand-prefix pill on sidepanel header** (RULE-006 v1.0 violation) | `panel.html` (header) | MEDIUM | Add `<span class="brand-prefix brand-prefix--oia">[OIA]</span>` |
| **No `[OIA]` prefix in `extName`** (RULE-006 v1.1 violation — codified 2026-05-09) | `_locales/{en or default}/messages.json` (or manifest.json `name` directly) | MEDIUM | Update `extName.message` to `[OIA] Chronicle` |

These defects pre-date the Sovereign Link work but should be bundled into its strike charter — same surface, same review pass.

---

## VI. Proposed Strike Charter Outline

| Item | Effort | Pre-req |
|---|---|---|
| Promote Sovereign Link to header (III.a) | ~2h | None |
| Add first-run sovereignty nudge (III.b) | ~1h | III.a complete |
| Build RULE-001 Options page for Chronicle | ~2-3h | None (parallel-safe) |
| Migrate `clearAllData` to two-tap (RULE-005) | ~30 min | None |
| Add brand-prefix pill to sidepanel header (RULE-006 v1.0) | ~15 min | None |
| Update `extName` to `[OIA] Chronicle` (RULE-006 v1.1) | ~5 min | None |
| Tier-0.5 Markdown-vault-folder export (III.c) | ~3-4h | RULE-001 Options page complete (for tier display) |
| Tier-0.5 paywall + ExtPay integration (or equivalent) | ~2h | Tier-0.5 export complete |
| **Total** | **~10-12h** | Sequential dependencies as noted |

This is well within a single Strike scope. Recommend charter as Strike 013 (Chronicle Sovereign Vault).

---

## VII. Cross-References

- [`SOVEREIGN_GAP_REPORT.md` §IX.1](../../../../864zeros-ISD/ISD-DIV-6-KNOWLEDGE/864zeros_SOVEREIGN_GAP_REPORT.md) — the (partially incorrect) audit finding this proposal corrects.
- [`TIER_0_5_BLUEPRINT.md`](./TIER_0_5_BLUEPRINT.md) — companion document; designs the Options page + Tier-0.5 Vault tier.
- [`864z-build-kit/references/core/BUILD_KIT_RULES.md`](../../../864z-build-kit/references/core/BUILD_KIT_RULES.md) — RULE-001 (Options structure), RULE-005 (two-tap), RULE-006 v1.1 (brand-prefix + extName), RULE-007 (secret sovereignty — Chronicle is RULE-007 compliant: zero secrets, BYOK not applicable).
- [`864z-build-kit/templates/bricks/two-tap-arm-pattern.js`](../../../864z-build-kit/templates/bricks/two-tap-arm-pattern.js) — BRK-UI-003 for the `clearAllData` migration.
- [`extensions/scripture-scout/`](../scripture-scout/) — reference impl for RULE-001 Options + brand-prefix pill (Charcoal/Bronze; Chronicle would use Sage/Slate per OIA pillar).

---

## VIII. Versioning

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-09 | Initial. Audit-finding correction + 3 injection points (header promotion / first-run nudge / Tier-0.5 multi-format) + bundled defect inventory + proposed Strike 013 charter outline. |

---

*Chronicle Sovereign Link Proposal v1.0 · 2026-05-09 · 864zeros LLC · DIV-3-FACTORY engineering proposal.*
