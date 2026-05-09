# 864z Vulture CLI Quickstart Guide

This guide provides literal, step-by-step instructions for interacting with the 864z Vulture Factory via the Gemini CLI. Follow these steps to initiate discovery cycles, validate opportunities, and manage your autonomous build process.

## 1. Prerequisites

Before you begin, ensure you have:
-   Python 3.9+ installed.
-   Gemini CLI installed and configured.
-   Navigated to the root of your `vulture-nest` project directory.

## 2. Launching the Gemini CLI

1.  **Open your Terminal/Command Prompt.**
2.  **Navigate to your project directory:**
    ```bash
    cd C:\Users\I820965\dev\vulture-nest
    ```
3.  **Launch Gemini CLI:**
    ```bash
    gemini
    ```
    *(Alternatively, if you want Gemini to load base instructions immediately upon launch, you can use: `gemini --system-instruction 864z-build-kit/GEMINI-base.md --system-instruction 864z-build-kit/GEMINI-extension.md`)*

## 3. Initial Setup & Context Loading (Once per session)

Once Gemini is launched, you should load the core protocols and guides into its context. This ensures the agent understands the full 864z Vulture OS.

**Copy and paste the following commands into the Gemini CLI:**

```
read_file(file_path='gemini.md')
read_file(file_path='864z_Vulture_OS_v2.md')
read_file(file_path='docs/864z-vulture-to-block-build-pattern.md')
read_file(file_path='docs/864z-build-kit-guide.md')
```
*(Wait for each `read_file` command to execute and confirm success before proceeding.)*

## 4. Executing Vulture OS Commands

Now that Gemini is fully oriented with the 864z Vulture OS, you can execute the primary operational commands.

**Choose and enter ONE of the following commands into the Gemini CLI:**

### A. Run an Unguided Autonomous Cycle
*(For full, self-directed opportunity discovery.)*

```
VULTURE_NEST: RUN AUTONOMOUS CYCLE
```

### B. Run a Guided Autonomous Cycle
*(To focus discovery on a specific domain.)*

```
VULTURE_NEST: RUN AUTONOMOUS CYCLE [FOCUS="your target domain"]
```
**Example:** `VULTURE_NEST: RUN AUTONOMOUS CYCLE [FOCUS="AI browser automation"]`

### C. Run a Full Scan (Targeted Analysis)
*(For deep-diving on a specific, known URL/product.)*

```
VULTURE_NEST: RUN FULL SCAN [URL="<target_url>"]
```
**Example:** `VULTURE_NEST: RUN FULL SCAN [URL="https://chrome.google.com/webstore/detail/onetab/chphlpgkkbolifaimnlloiipkdnihall"]`

### D. Generate a Daily Report
*(To get a summary of recent Vulture activity and opportunities.)*

```
VULTURE_NEST: GENERATE DAILY REPORT
```

## 5. Reviewing Output and Next Steps

After executing a `VULTURE_NEST` command, the Gemini CLI will:
-   Provide updates on its progress through the 4-stage funnel.
-   Output `Potential Targets`, `Pattern Briefs`, `Validation Scorecards`, or a final `Vulture Strike Dossier`.
-   Write validated opportunities to `Vulture_Nest.md`.
-   Provide prompts for your next action based on the current context.

**Always review the output carefully.** If a `Vulture Strike Dossier` is generated, you will then proceed with the actual build process using the `864z-build-kit` guided by the agent.