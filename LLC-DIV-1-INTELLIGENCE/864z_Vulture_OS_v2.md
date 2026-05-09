# 864z Vulture Operating System v2

This document outlines the foundational logic for the entire 864z Vulture Factory. It defines the multi-stage process for autonomously discovering, validating, and preparing software opportunities for development.

## 1. The Four-Stage Funnel

The process is a funnel with four distinct stages. Each stage has a specific goal, a set of modular tools (prompts), and a clear data flow.

-   **Stage 1: Discovery (The Hunt)**
    -   **Goal:** Generate a raw list of potential opportunities.
    -   **Process:** This stage has two parallel inputs:
        1.  **Isenberg Scan:** Scans communities (Reddit, Discord) for "laments" and "workaround spreadsheets."
        2.  **Carcass Scan:** Scans app stores and product directories for stagnant, high-volume apps.
    -   **Output:** A list of `Potential Targets`.

-   **Stage 2: Pattern Extraction (The Blueprint)**
    -   **Goal:** For a given target, map the existing success and failure patterns.
    -   **Process:** Uses sources like Indie Hackers and Failory to find the "Growth Stack," "Tech Stack," and critical "Anti-Patterns."
    -   **Output:** A `Pattern Brief` for the target.

-   **Stage 3: Financial Validation (The Gate)**
    -   **Goal:** Score the opportunity using our exit-weighted formula.
    -   **Process:** Calculates the **Rule of 40**, the **Exit Multiplier (χ)**, and the final **864z Score**. This is the automated GO/NO-GO decision point.
    -   **Output:** A `Validation Scorecard`.

-   **Stage 4: Dossier Generation (The Strike Plan)**
    -   **Goal:** If the score is > 8.64, generate a complete strategic build plan.
    -   **Process:** Consolidates all data into a final report, including GTM "Rescue Scripts," target MRR, and projected exit valuation.
    -   **Output:** The `Vulture Strike Dossier` (`README.md`) is created in the `/builds` directory.

-   **Stage 5: Technical Brief Refinement (The Hand-off)**
    -   **Goal:** Transform the strategic dossier into a detailed, actionable, and platform-specific `build_prompt.md` for an AI build agent.
    -   **Process:** A prompt is run to generate the technical specifications (data models, UI flows, API contracts) based on the project's application type (webapp, extension, mobile). This prompt enforces the "Build Block" philosophy by asking the user to confirm the use of the `registry.json` catalog.
    -   **Output:** A complete, two-artifact dossier in the project's `/builds` folder, ready for replication into a dedicated build environment.


## 2. The 864z Opportunity Dossier Structure

The final output data for each opportunity is recorded in `Vulture_Nest.md` using the following structure:

```yaml
- opportunity: "TabVault (ADHD Focus Unbundle)"
  discovery_method: "Isenberg Community Scan"
  source: "r/ADHD - 'Tab Paralysis' threads"
  carcass_competitor: "OneTab (2.1M users)"
  
  blood_analysis:
    lament: "Users lose visual context and forget tasks when OneTab archives tabs."
    lament_intensity: 9.2 # Score out of 10

  pattern_summary:
    growth_stack: "Community Rescue (Reddit) & pSEO ('OneTab alternative')"
    tech_stack: "IndexedDB, Manifest V3, Native Tab Discard"
    anti_patterns_to_avoid: ["Data Fragility (LocalStorage)", "Feature Creep"]

  financials:
    rule_of_40_score: 110 # (25% growth + 85% margin)
    exit_multiplier_chi: 1.5
    conservative_mrr: 2944
    target_exit_valuation: 141312

  final_score:
    864z_score: 15.3 # ULTRA-GREENLIGHT
```
