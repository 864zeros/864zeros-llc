# 864zeros Monolith: Architectural Map
**Project Owner:** 864zeros LLC / Jeff Conn
**Design Philosophy:** KISS (Keep It Simple, Stupid), Modular, Human-in-the-Loop.
**Core Framework:** AETHER (Adaptive Embodied Thinking : Holistic Evolutionary Runtime).

## 1. Directory Structure & Logic
The project is organized into "Divisions" to separate research, manufacturing, and execution.

- `div-1-intelligence/`: **The Brain.** Contains AETHER core papers, modular agent theory, and knowledge graph verification logic.
- `div-3-factory/`: **The Workshop.** Where code is built and refined.
    - `aether-pulse-x/`: (Child Repo) The GTM Engine. Scans social intent and drafts replies.
    - `extensions/`: Chrome extensions and AI-powered browser tools.
    - `micro-saas/`: Standalone agentic utilities (e.g., GloveBox for vehicle data).
- `div-4-gtm/`: **The Field.** Go-To-Market strategy. Contains social playbooks, conversion metrics (18% CTR benchmark), and engagement logs.
- `migration-stuff/`: Archive of legacy data from the previous King of Prussia (KoP) node. Do not use for active builds.

## 2. Core Concepts for the AI
- **The Capsule:** The fundamental unit of AETHER. A 5-file folder containing Identity, Knowledge, and Behavior. 
- **The Skill:** In this project, "agents are skills, not code." The intelligence is intrinsic to the capsule, not the LLM model used.
- **The Monolith:** This repository is a unified enterprise. Division-3 builds the tools that Division-4 uses to distribute Division-1's intelligence.

## 3. High-Priority Tech Stack
- **Languages:** Python (Back-end/CLI), JavaScript/Node (Extensions/Web).
- **Integrations:** Anthropic Claude API (Scoring/Drafting), Apify (X Scraping), Telegram Bot API (Notification), SQLite (Logging/Deduplication).
- **Hardware:** Always-On PC (Cresco Node).

## 4. Operational Safety
- Strictly **Human-in-the-Loop**. 
- The system drafts; Jeff posts.
- No auto-post logic is permitted in the codebase.