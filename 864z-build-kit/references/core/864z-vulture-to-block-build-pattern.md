# The 864z Vulture-to-Block-Build Pattern

This document describes the core engineering pattern for the 864z Factory: converting market gaps identified by the Vulture process into modular, reusable "Build Blocks." This pattern is the engine of our high-velocity development, embodying the 864z, modular, and KISS philosophies.

## 1. The Core Philosophy

-   **864z Driven:** We do not build features based on intuition. The Vulture process dictates *exactly* what to build by identifying high-intensity user "laments" or "feature deltas" in the market. Each block is a direct, targeted solution to a validated "blood in the water" problem.
-   **Modular by Design:** A block is not just a feature within a single application; it is a self-contained, independent unit of value. It has a single responsibility and is designed to be portable across multiple projects.
-   **KISS (Keep It Simple, Stupid):** Each block does one thing and does it exceptionally well. The `Native_Discard_Logic` block only handles tab discarding; it does not manage storage or UI. This radical simplicity makes blocks robust, easy to maintain, and simple to integrate.

## 2. The Vulture-to-Block Workflow

The pattern is a closed loop that transforms market analysis into compounding technical assets.

1.  **Vulture Identifies Delta:** The Vulture OS completes a cycle and identifies a high-scoring opportunity. The `blood_analysis` section of the dossier specifies a missing feature—the "delta."
2.  **Abstract the Solution:** Instead of coding the feature directly into the target application (e.g., TabVault), we abstract its core logic. For example, the "Deep Sleep" feature is abstracted into a generic `Native_Discard_Logic` block.
3.  **Build the Block:** The feature is built as a standalone module with a strict service protocol (see below).
4.  **Wrap in an Agent:** The block is wrapped in a "Brick Agent" (e.g., `EfficiencyAgent`), which exposes its functionality through a standardized interface.
5.  **Register the Block:** The new block and its agent are added to the `registry.json`, making it available to the entire 864z Factory.
6.  **Deploy to Product:** The target application (TabVault) now integrates the feature by simply calling the Brick Agent. The development time for this feature within TabVault is reduced to a single API call.

## 3. The Block Service Protocol

To ensure reusability and automation, every Build Block adheres to a consistent service protocol. The Brick Agent acts as the universal adapter.

-   **Input:** The agent receives a single JSON object containing a `command` and a `payload`.
    -   `command`: A string specifying the action to perform (e.g., `"discard_tab"`, `"get_status"`).
    -   `payload`: An object containing the necessary data for that command (e.g., `{ "tabId": 123 }`).

-   **Output:** The agent returns a single JSON object containing a `status` and a `data` field.
    -   `status`: A string indicating the result (`"success"`, `"error"`).
    -   `data`: An object containing the return value or an error message (e.g., `{ "message": "Tab 123 discarded successfully" }`).

### Example: `EfficiencyAgent` for the `Native_Discard_Logic` Block

**Input JSON:**
```json
{
  "command": "discard_tabs",
  "payload": {
    "tabIds": [101, 102, 105],
    "priority": "low"
  }
}
```

**Output JSON:**
```json
{
  "status": "success",
  "data": {
    "discarded_count": 3,
    "failed_count": 0,
    "errors": []
  }
}
```

By enforcing this simple, consistent protocol, we ensure that any agent can communicate with any block, creating a truly interchangeable and automated component system. This is the foundation of the 864z Factory's compounding advantage.
