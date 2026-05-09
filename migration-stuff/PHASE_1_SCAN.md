# Phase 1: Monolith Migration Scan & Audit

## 1. Inventory Summary
Comprehensive scan of `LLC-DIV-1-INTELLIGENCE` and `LLC-DIV-3-FACTORY` completed.

### Division 1: Intelligence
- **Environment:** Python (Scouts/Agents) & Next.js (PlannerPress WebApp).
- **Key Manifests:**
  - `LLC-DIV-1-INTELLIGENCE/requirements.txt`: Python dependencies (`apify-client`, `python-dotenv`).
  - `LLC-DIV-1-INTELLIGENCE/plannerpress-webapp/package.json`: Next.js frontend dependencies.
- **Protocol:** Vulture Nest Capitol Protocol (v7) active.

### Division 3: Factory
- **Environment:** Node.js (Extensions/Workers) & Micro-SaaS.
- **Key Manifests:**
  - `LLC-DIV-3-FACTORY/workers/clipboard-864z/package.json`: Cloudflare Wrangler.
  - `LLC-DIV-3-FACTORY/extensions/clipboard/package.json`: WebExtension polyfill.
  - `LLC-DIV-3-FACTORY/micro-saas/GloveBox/package.json`: Node.js backend.
- **Redundancy:** Nested `864z-build-kit` found within `LLC-DIV-3-FACTORY`, mirroring the root version.

---

## 2. Dependency Audit
Core API keys and environment variables required for full functionality:

| Key/Variable | Usage | Found In |
|---|---|---|
| `APIFY_TOKEN` | Web scraping/search (Google, Reddit) | `LLC-DIV-1-INTELLIGENCE/.env` |
| `ANTHROPIC_API_KEY` | AI Model (Claude) | `LLC-DIV-3-FACTORY/micro-saas/GloveBox/.env.example` |
| `OPENAI_API_KEY` | AI Model (GPT) - Optional | `.env.example` |
| `CARMD_API_KEY` | Vehicle Data - Optional | `.env.example` |
| `NMVTIS_API_KEY` | Vehicle History - Optional | `.env.example` |
| `WRANGLER_AUTH` | Cloudflare Worker deployment | Inferred from `package.json` |
| `EXTPAY_PUBLIC_KEY` | Extension payments | Inferred from `clipboard` extension |

---

## 3. Infrastructure Check: Centralization Plan
The `864z-build-kit` in the root is the intended source of truth.

### Shared Utilities for Centralization:
1. **Logging:** Standardize `console-helper.js` from `build-kit/templates` for both Node.js and Python (via a compatible logger).
2. **AI Model Calling:**
   - Migrate `LLC-DIV-1-INTELLIGENCE/tool_wrapper.py` logic (Apify + Stealth pauses) into a central `lib/scrapers` in the build-kit.
   - Standardize AI prompt templates using `864z-build-kit/templates/ai-feature.js` logic.
3. **Error Handling:** Implement a shared error boundary/protocol defined in `build-kit`.
4. **UI Components:** Both `div-1` and `div-3` should pull from `864z-build-kit/lib/aether-ui.css` for design consistency.

### Recommendations:
- Delete `LLC-DIV-3-FACTORY/864z-build-kit` to avoid "source of truth" confusion.
- Update `LLC-DIV-1-INTELLIGENCE` scripts to reference shared assets if needed.

---

## 4. Cleanup & Purge List
The following residual build/temp folders were identified and should be purged:

- `LLC-DIV-1-INTELLIGENCE/plannerpress-webapp/.next` (Next.js build artifacts)
- `LLC-DIV-3-FACTORY/webinsights/venv` (Local Python virtual environment)
- `LLC-DIV-3-FACTORY/webinsights/venv/Lib/site-packages/pip/_internal/operations/build` (Pip temp build files)

---
**Scan completed on:** 2026-05-04
**Status:** Monolith mapped. Ready for Phase 2 (Centralization).
