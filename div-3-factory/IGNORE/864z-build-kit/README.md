# 864zeros Build Kit

**Version:** 2.0  
**Purpose:** Autonomous product development using CLI agents (Claude Code, Gemini CLI).  
**Maintained by:** 864zeros LLC

---

## Architecture

The kit separates **universal rules** (apply to everything we build) from **platform rules** (Chrome extension, web app, mobile). This means one brief + one CLI session = one shippable product.

```
864z-build-kit/
│
├── CLAUDE-base.md                  # Universal 864zeros DNA — every project
├── CLAUDE-extension.md             # Chrome extension overlay
├── GEMINI-base.md                  # Universal — Gemini CLI variant
├── GEMINI-extension.md             # Chrome extension — Gemini CLI variant
│
├── references/
│   ├── core/                       # Applies to ALL products
│   │   ├── oia-design-system.css       # CSS implementation (web/extension)
│   │   ├── oia-design-system-full.md   # Tokens, components, ADHD UX rules
│   │   └── lib-core.md                 # api-client, redactor, tiers, constants
│   │
│   └── extension/                  # Chrome extension only
│       ├── chrome-extension-standard-2026.md  # MV3 scaffold standard
│       └── lib-extension.md                   # db.js, store.js, backup.js
│
├── briefs/
│   └── extension-brief-template.md # Copy + fill per extension project
│
├── phases/
│   └── extension/                  # Chrome extension build phases
│       ├── phase-1-scaffold.md         # Directory + manifest + boilerplate
│       ├── phase-2-ui-shell.md         # Panel UI + OIA styling + empty states
│       ├── phase-3-feature.md          # One feature at a time (repeated)
│       ├── phase-4-polish.md           # Animations, errors, accessibility
│       └── phase-5-qa-test.md          # Unit tests, integration, manual QA
│
└── README.md
```

### What's Universal vs Platform-Specific

| Layer | Universal (core/) | Extension-Specific |
|-------|-------------------|--------------------|
| **Identity** | Brand voice, KISS, privacy, no-ads, ADHD UX | — |
| **Design System** | OIA CSS, tokens, components | Side panel layout constraints |
| **Shared Code** | api-client, redactor, tiers, constants | db.js (IndexedDB), store.js (chrome.storage), backup.js (Drive) |
| **Standards** | — | MV3 manifest, service worker rules |
| **Phases** | — | Scaffold → UI → Features → Polish → Test |
| **Briefs** | — | Extension-specific template |

Adding a new platform (web app, mobile) means adding: `references/web/`, `phases/web/`, `briefs/web-brief-template.md`, `CLAUDE-web.md`. Core stays untouched.

---

## How to Build an Extension

### 1. Write the Brief

```bash
cp briefs/extension-brief-template.md briefs/clipboard-brief.md
# Fill out every section
```

### 2. Start the CLI

**Claude Code:**
```bash
cd 864z-build-kit
claude
# CLAUDE-base.md + CLAUDE-extension.md auto-load
# "Build the extension from briefs/clipboard-brief.md. Start with Phase 1."
```

**Gemini CLI:**
```bash
gemini --system-instruction GEMINI-base.md --system-instruction GEMINI-extension.md
# "Read references/ and briefs/clipboard-brief.md. Start Phase 1."
```

### 3. Follow Phases (Never Skip)

| Phase | What | Gate |
|-------|------|------|
| 1. Scaffold | Directory + manifest | Loads in Chrome, no errors |
| 2. UI Shell | Panel + OIA styling | All views render, dark mode works |
| 3. Features | One at a time | Each verified before the next |
| 4. Polish | Animations, errors, tiers | Production-quality finish |
| 5. QA & Test | Unit tests, manual QA | All tests pass, checklist complete |

**Nothing ships until Phase 5 passes.**

### 4. Publish

Replace placeholder icons. Verify version. Submit to Chrome Web Store.

---

## Rules

- Never modify files in `references/` for a specific project
- Always fill the brief completely before starting
- One feature per Phase 3 cycle
- Privacy is the baseline, not a feature
- No ads, no tracking, no telemetry — ever
- Test before ship — Phase 5 is mandatory

---

## Future Platforms

The kit is designed to grow:

| Platform | Status | Adds |
|----------|--------|------|
| Chrome Extension | ✅ Complete | `references/extension/`, `phases/extension/` |
| Web App / SaaS | 🔜 Planned | `references/web/`, `phases/web/`, `CLAUDE-web.md` |
| Mobile (React Native) | 🔜 Planned | `references/mobile/`, `phases/mobile/`, `CLAUDE-mobile.md` |

Core references and CLAUDE-base.md stay the same for all platforms. That's the point.
