# 864zeros LLC Monolith — Project Intelligence (Gemini)

## 1. Structure
This is the **864zeros-llc** project monolith, co-locating all intelligence and factory assets on the Always-On PC.

- `864z-build-kit/`: Central source of truth for all shared utilities (scrapers, AI clients, UI tokens).
- `LLC-DIV-1-INTELLIGENCE/`: Discovery and scouting division. Home of the Vulture Nest protocol.
- `LLC-DIV-3-FACTORY/`: Production and shipping division. Home of extensions and micro-SaaS builds.
- `migration-stuff/`: Migration logs and scan reports.

---

## 2. Centralized Utilities (`864z-build-kit/lib`)

### JavaScript / Node.js
All production JS assets (extensions, web apps) must pull from or sync with these "Gold Standard" versions:
- `redactor.js`: Automatic PPI stripping (BRK-PRIVACY-001).
- `api-client.js`: Multi-provider AI wrapper with vision and usage tracking (BRK-AI-001).
- `aether-ui.css`: Core design tokens and styles.

### Python
All intelligence agents must utilize the centralized scraper:
- `python/vulture_tools.py`: Apify-powered "Stealthfox" scraper with residential proxy rotation.

---

## 3. Maintenance Protocols
- **Sync Rule:** When updating `redactor.js` or `api-client.js` in a project, sync the changes back to the build-kit and then out to other divisions.
- **Hygiene:** Build folders (`.next`, `dist`, `venv`) are excluded from source control and should be purged periodically.

---

## 4. Current State (Phase 1 Complete)
The monolith migration was completed on **May 4, 2026**.
- [x] Scan & Inventory (See `migration-stuff/PHASE_1_SCAN.md`)
- [x] Cleanup of redundant build kits.
- [x] Centralization of AI and Privacy utilities.
- [x] Integration of centralized kit into Div-1 and Div-3.
