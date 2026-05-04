# How to Use the 864z Vulture Agent

This document outlines the primary commands to operate the Vulture agent and its sub-patterns.

## Execution Commands

### 1. Unguided Autonomous Cycle

This is the fully autonomous mode. The agent initiates the entire 4-stage funnel from scratch to find new opportunities.

-   **Command:** `VULTURE_NEST: RUN AUTONOMOUS CYCLE`
-   **Action:** The agent reads `query_log.json` to analyze past performance, mutates a high-performing query, and then executes both the **Isenberg Scan** (for communities) and the **Carcass Scan** (for apps). Any identified targets are automatically run through the full validation and dossier generation process.

### 2. Guided Autonomous Cycle

This is the semi-autonomous mode where you provide the strategic direction.

-   **Command:** `VULTURE_NEST: RUN AUTONOMOUS CYCLE [FOCUS="your target domain"]`
-   **Example:** `VULTURE_NEST: RUN AUTONOMOUS CYCLE [FOCUS="ADHD productivity"]`
-   **Action:** The agent skips the self-directed query and immediately executes the **Isenberg Scan** and **Carcass Scan** within your specified focus area. The rest of the validation funnel proceeds automatically.

### 3. Full Scan (Targeted Analysis)

This command is for deep-due-diligence on a known target, bypassing the broad discovery stage.

-   **Command:** `VULTURE_NEST: RUN FULL SCAN [URL="<target_url>"]`
-   **Example:** `VULTURE_NEST: RUN FULL SCAN [URL="https://chrome.google.com/webstore/detail/onetab/chphlpgkkbolifaimnlloiipkdnihall"]`
-   **Action:** The agent bypasses discovery and immediately begins **Stage 2: Pattern Extraction** on the provided URL. It then proceeds with financial validation and dossier generation.

### 4. Daily Report Generation

This command generates a summary of the agent's recent findings and activities.

-   **Command:** `VULTURE_NEST: GENERATE DAILY REPORT`
-   **Action:** The agent will parse `Vulture_Nest.md` and `query_log.json` to provide a concise summary of new opportunities added in the last 24 hours, their scores, and the performance of recent queries.
