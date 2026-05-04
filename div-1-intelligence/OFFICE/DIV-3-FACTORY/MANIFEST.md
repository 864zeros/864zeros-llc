# DIV-3-FACTORY — Technical Operations Manifest

> **Division:** 3 (Factory Floor)
> **Purpose:** Code development, testing, and technical polish
> **Scope:** Technical operations ONLY. No marketing, no GTM, no copy.

---

## Division Rules

1. **Code Only** — This division handles source code, builds, and technical documentation.
2. **No Marketing** — GTM assets, landing pages, and promotional copy belong in DIV-4-STUDIO.
3. **Test Before Exit** — All projects must pass validation before moving to HALLWAY/.
4. **Document Changes** — Every modification requires a BUILD_MANIFEST.md update.

---

## Folder Structure

```
DIV-3-FACTORY/
├── projects/           # Active development projects
│   └── {strike-id}/    # Individual project folders
├── testing/            # QA and validation staging
├── archives/           # Completed projects (read-only)
└── MANIFEST.md         # This file
```

---

## Project Lifecycle

```
INTAKE → DEVELOPMENT → TESTING → HALLWAY → RELEASE
   ↓          ↓            ↓          ↓
 Recon    DIV-3       DIV-3      Gatekeeper
          Factory     Factory    Approval
```

### Entry Criteria
- [ ] Strike ID assigned (864z-YYYY-NNN)
- [ ] BUILD_MANIFEST.md present
- [ ] Target SaaS identified
- [ ] Core purpose defined

### Exit Criteria
- [ ] All phases complete (scaffold → polish)
- [ ] Zero console errors
- [ ] Chrome extension loads without warnings
- [ ] Manual smoke test passed
- [ ] BUILD_MANIFEST.md updated with final status

---

## Current Projects

| Strike ID | Name | Status | Location |
|-----------|------|--------|----------|
| 864z-2026-004 | PassVault | Testing | `projects/864z-2026-004-passvault/` |

---

## Technical Standards

### Chrome Extension (MV3)
- Service worker: No ES module imports
- Side panel: ES modules allowed
- Permissions: Minimal required set
- Storage: IndexedDB for data, chrome.storage for settings

### Code Style
- ES6+ syntax
- Async/await over callbacks
- JSDoc comments for public functions
- No console.log in production (use debug flags)

### Security
- Zero network calls without user consent
- No telemetry or analytics
- Local-first architecture
- AES-GCM for sensitive data (PassVault only)

---

## Build Kit Integration

All projects MUST use standard bricks from `864z-build-kit/`:

| Brick | Purpose | Required |
|-------|---------|----------|
| `864z-core.js` | Brand constants | Yes |
| `aether-ui.css` | Design system | Yes |
| `BRK-PRICING-001.js` | Pricing modal | If monetized |
| `BRK-UI-IMPORT-001.js` | Import modal | If importing |

---

## Handoff Protocol

When a project is ready for release:

1. Run final validation
2. Update BUILD_MANIFEST.md with "Division 3 Complete"
3. Move project folder to `HALLWAY/`
4. Gatekeeper logs "WAITING FOR HUMAN SIGNATURE"
5. Await human approval before DIV-4 handoff

---

*864zeros Factory Division | Technical Operations*
*Last updated: 2026-03-18*
