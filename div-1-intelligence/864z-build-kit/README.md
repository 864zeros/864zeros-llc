# 864z Build Kit Guide: High-Velocity Product Creation

This document serves as the operational guide for leveraging the `864z-build-kit` to rapidly develop software products, adhering strictly to the 864z philosophy of KISS (Keep It Simple, Stupid), modularity, and rapid deployment. This kit is a foundational component of the 864z Vulture Factory, enabling the transformation of validated market opportunities into shippable products with maximum efficiency.

## 1. The 864z Build Philosophy

The `864z-build-kit` ensures that every product built within the Vulture Factory embodies our core principles:

*   **864z Driven:** Each build is initiated only after passing the `Vulture Capital Validation` stage, ensuring it addresses a high-intensity "lament" (blood in the water) and has a clear path to exit.
*   **KISS (Keep It Simple, Stupid):** The kit promotes minimalist design and focused functionality. Features are isolated, and complexity is rigorously managed to maintain high development velocity and reduce technical debt.
*   **Modular Architecture:** The kit is designed to separate universal rules from platform-specific implementations. This allows for maximum code reuse and straightforward expansion to new platforms (web, mobile) without re-architecting the core.
*   **Autonomous Agent-Friendly:** The structure and content of the kit are optimized for consumption by CLI agents (like Gemini CLI or Claude Code), allowing for significant automation in the build process.

## 2. Kit Architecture & Core Components

The `864z-build-kit` is organized to provide a clear, step-by-step framework for any build.

```
864z-build-kit/
│
├── CLAUDE-base.md                  # Universal agent instructions (Claude)
├── CLAUDE-extension.md             # Extension-specific agent instructions (Claude)
├── GEMINI-base.md                  # Universal agent instructions (Gemini)
├── GEMINI-extension.md             # Extension-specific agent instructions (Gemini)
│
├── references/                     # Standardized code, design systems, and platform rules
│   ├── core/                       # Applies to ALL products (e.g., OIA Design System, lib-core)
│   └── extension/                  # Chrome extension specific (e.g., MV3 standard, lib-extension)
│
├── briefs/                         # Templates for defining product requirements
│   └── extension-brief-template.md # Template for a Chrome extension brief
│
└── phases/                         # Step-by-step build phases for different platforms
    └── extension/                  # Chrome extension specific (Scaffold, UI, Feature, Polish, QA)
```

### Purpose of Each Component:

*   **Agent Instructions (`*-base.md`, `*-extension.md`):** These Markdown files provide the foundational and platform-specific instructions for AI agents, guiding them on universal principles (KISS, privacy, 864z identity) and technical standards (Manifest V3 for extensions).
*   **`references/`:** This directory contains shared assets and documentation:
    *   **`core/`:** Holds universal design tokens, core CSS, and common utility libraries applicable to any product type.
    *   **`extension/`:** Contains Chrome extension-specific references, such as the Manifest V3 standard and IndexedDB helpers.
*   **`briefs/`:** Provides templates for outlining the specific requirements of a new product. After Vulture Capital Validation, the `extension-brief-template.md` is copied and filled out for the specific opportunity (e.g., TabVault).
*   **`phases/`:** Defines a mandatory, sequential build process. Each phase has a clear goal and a "gate" (definition of done) that must be passed before proceeding.

## 3. The 864z Build Workflow: From Dossier to Deployment

Once an opportunity receives an `ULTRA-GREENLIGHT` from the Vulture Capital Validation, the `864z-build-kit` dictates the build process:

1.  **Generate & Refine Brief:**
    *   The `Vulture Strike Dossier` (output of Stage 4 of the Vulture OS) provides all the necessary information.
    *   Copy `briefs/extension-brief-template.md` to a new project-specific brief (e.g., `briefs/tabvault-brief.md`).
    *   Fill out the brief completely, using details from the Dossier for acquisition loops, tech stack, and validation methods. This becomes the primary instruction set for the build agent.

2.  **Initialize Agent & Auto-Load Instructions:**
    *   Launch your preferred CLI agent (Gemini CLI or Claude Code) from the `864z-build-kit` directory.
    *   The relevant universal (`GEMINI-base.md`) and platform-specific (`GEMINI-extension.md`) instructions are auto-loaded, instilling the 864z identity and technical standards into the agent.
    *   Instruct the agent to read the newly created brief (e.g., `briefs/tabvault-brief.md`).

3.  **Execute Phased Development:**
    *   The agent is instructed to follow the `phases/extension/` workflow strictly, never skipping a phase.
    *   **Phase 1: Scaffold:** Create project directory, `manifest.json`, and boilerplate files.
    *   **Phase 2: UI Shell:** Build the core UI (e.g., popup.html, sidepanel.html) using the `oia-design-system.css` from `references/core/`.
    *   **Phase 3: Feature Implementation:** This is an iterative phase. One feature (or "Build Block" integration) is implemented and verified at a time. The agent leverages the `registry.json` to check out existing `Build Blocks`.
    *   **Phase 4: Polish:** Focus on production-quality finishes, including animations, error handling, and accessibility.
    *   **Phase 5: QA & Test:** Implement unit tests, integration tests, and conduct manual QA. **Nothing ships until Phase 5 passes.**

4.  **Publish:**
    *   Replace placeholder assets (icons).
    *   Verify the `manifest.json` version.
    *   Submit the fully tested and polished product to the Chrome Web Store.

## 4. 864z Rules for Kit Usage

*   **No Deviation:** Always follow the defined phases and rules.
*   **Brief First:** A complete brief is mandatory before starting any code.
*   **Modularity:** Prioritize the creation or integration of reusable "Build Blocks" (as defined in `864z-vulture-to-block-build-pattern.md`).
*   **Privacy Baseline:** All products are privacy-first, with no ads, tracking, or telemetry.
*   **Testing is Mandatory:** Phase 5 is a non-negotiable gate.

By adhering to this guide, the 864z Factory ensures consistent, high-quality, and rapid delivery of validated software products.
