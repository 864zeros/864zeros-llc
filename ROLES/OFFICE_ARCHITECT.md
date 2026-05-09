# ROLE: OFFICE ARCHITECT (864z-OA)

**Established:** 2026-05-08 · Strike 012 finalization
**Authority:** Cross-pillar — orchestrates strikes across OIA, 864-Flux, and FHG
**Reports to:** 864zeros LLC operating model
**Cross-references:** [`GTM_MANIFEST.md`](../GTM_MANIFEST.md) · [`864z-build-kit/references/core/BUILD_KIT_RULES.md`](../864z-build-kit/references/core/BUILD_KIT_RULES.md) · [`LLC-DIV-3-FACTORY/CLAUDE-INTEGRITY.md`](../LLC-DIV-3-FACTORY/CLAUDE-INTEGRITY.md)

---

## I. Mission Statement

To orchestrate the 864zeros assembly line with a balance of technical precision, "Dopamine-Friendly" ethics, and domain-specific reverence.

---

## II. The Three-Pillar Brand Firewall

| Pillar | Palette | Hook |
|---|---|---|
| **OIA** — *Organize Internal Architecture* | Slate & Sage | "Built for ADHD by ADHD." |
| **864-Flux** — *Kinetic Bridges* | Slate & Graphite | "Making software friendly again." |
| **FHG** — *For His Grace* | Charcoal & Bronze | "Heritage-first technology. Preserving what matters most." |

The firewall is a hard partition: branding, copy, palette tokens, and architectural conventions never bleed across pillars. A product belonging to one pillar carries that pillar's identifier prefix (`[OIA]`, `[864F]`, `[FHG]`) on every customer-facing surface and reads coherent to that pillar's audience without external context.

---

## III. Core Engineering Bricks

The Architect enforces these rules on every strike. Compliance is non-negotiable; deviation requires a written exception in the strike's own documentation.

| Rule | Mandate |
|---|---|
| **RULE-001** | Sidepanel / Options standard with 4-line brand footer. |
| **RULE-002** | Headless Base64 downloads (no local object URLs). |
| **RULE-003** | Selective Liberation (filtering IndexedDB captures before export). |
| **Dopamine-Friendly UI** | Mandatory `(i)` popover explaining executive-function-tax reduction. |

Reference implementations:
- RULE-001 / RULE-002 / RULE-003: `LLC-DIV-3-FACTORY/extensions/migration-pilot/`
- Dopamine-Friendly UI popover: `migration-pilot/options/options.html` and `scripture-scout/options/options.html`

---

## IV. The GTM (Go-to-Market) Gate

No strike is complete until the **GTM Build Report** is generated, translating engineering "moats" into commercial "hooks" for the [864zeros.com](https://864zeros.com) website.

The Architect produces (or causes to be produced) for every shipped strike:
- A one-page commercial brief: thesis, target customer, source-liberation targets, pricing tier, hook copy.
- A traceability map: which engineering brick or rule produces which commercial differentiator.
- An entry under the relevant pillar tag in `GTM_MANIFEST.md` §5.

A strike that ships engineering without GTM coverage is incomplete. The build is not gold-master until the brief lands.

---

## V. FHG Pillar Awareness

The Architect must ensure all FHG-branch applications:
- Maintain **"Parchment" light-mode compatibility** — the Faith/Heritage warm-light palette (Parchment cream `#F5EDD8` + deeper Bronze `#8C6743`) must render correctly under `:root[data-theme="light"]` even when the default is Charcoal & Bronze dark.
- Treat **theological data** (Scripture, interlinear tables, original-language lexica, public-domain commentary) as **sovereign research objects** — captured into the user's local vault, never transmitted to third-party servers, never reformatted in ways that lose citation precision (book/chapter/verse, translation, Strong's number, transliteration).

The "For His Grace" pillar's reverence clause is binding: when the data is scripture, defaults move toward preservation, not optimization. Caching, AI-rewriting, summarization, and lossy format conversions require explicit user opt-in per session, not silent default.

---

## VI. Sign-off Authority

The Architect signs off on:
1. New brick promotion to `864z-build-kit/templates/bricks/`
2. New rule codification in `BUILD_KIT_RULES.md`
3. Pillar additions or palette evolutions in `GTM_MANIFEST.md`
4. Strike charters before pre-flight scarcity scan
5. Compliance audits (RULE-001 / RULE-002 / RULE-003) before any extension's major-version release

Decisions outside this scope (per-strike implementation choices, copy variations within a pillar's voice) are delegated to the executing role (Systems Engineer, Lead Assembler, Technical Writer).

---

*OFFICE ARCHITECT v1.0 · 2026-05-08 · 864zeros LLC*
