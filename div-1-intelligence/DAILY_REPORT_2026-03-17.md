# Vulture Nest Daily Diagnostic Report
**Date:** 2026-03-17
**Status:** CRITICAL SYSTEM FAILURE - Code Audit Required

---

## Executive Summary

The Vulture Nest system is fundamentally broken. It repeatedly returns "OneTab" because of **hardcoded logic** and **missing protocol implementation**. This report traces EVERY step and condition in the current codebase to identify all failures.

---

## PHASE 1: V_Trendspotter.find_host() - CRITICAL FAILURES

### Current Code Flow (agents.py lines 10-33):

```
Step 1: Build query
  Query: '"most popular chrome extensions 2026" OR "top chrome extensions"'

Step 2: Execute Google search via Apify

Step 3: Parse results with THIS condition (LINE 25):
  if '**' in line and 'Tab' in line:
      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      CRITICAL BUG #1: Hardcoded to ONLY find extensions with "Tab" in name!

Step 4: If no match found, return fallback (LINE 33):
  return "OneTab"
  ^^^^^^^^^^^^^^^
  CRITICAL BUG #2: Hardcoded fallback to OneTab!
```

### Bug Analysis:

| Bug ID | Location | Issue | Impact |
|--------|----------|-------|--------|
| BUG-001 | agents.py:25 | `'Tab' in line` hardcoded filter | System can ONLY find tab-related extensions |
| BUG-002 | agents.py:33 | `return "OneTab"` fallback | Always defaults to OneTab when parsing fails |
| BUG-003 | agents.py:19 | Generic query with no strategy | Ignores gemini.md discovery methods |
| BUG-004 | MISSING | No exclusion list | No memory of previously analyzed hosts |
| BUG-005 | MISSING | No query_log.json integration | Protocol Step 1 requires reading past query performance |

### What gemini.md Protocol REQUIRES (but is NOT implemented):

```
STEP 1: Find Carcass (Strategic Hunt)
  - Read query_log.json           <-- NOT IMPLEMENTED
  - Select Discovery Method:
    1. Interface Arbitrage        <-- NOT IMPLEMENTED
    2. Niche Ecosystems           <-- NOT IMPLEMENTED
    3. Proactive AI Assistance    <-- NOT IMPLEMENTED
    4. B2B Intelligence Gaps      <-- NOT IMPLEMENTED
    5. MV3 Gaps                   <-- NOT IMPLEMENTED
    6. Social Moat Validation     <-- NOT IMPLEMENTED
  - Mutate query based on method  <-- NOT IMPLEMENTED
```

---

## PHASE 2: V_Scout.find_wounds() - PARTIAL IMPLEMENTATION

### Current Code Flow (agents.py lines 36-223):

```
Step 1: Initialize wounds dict
  wounds = {host, pain_points, sources, urls, raw_wounds}

Step 2: Phase 1 - Reddit Search (if deep_scan=True)
  Calls: _search_reddit() -> tool_client.search_reddit_via_google()
  Method: Google site search "site:reddit.com {host} problem|frustrating..."
  Status: WORKING (but limited - no engagement scores)

Step 3: Phase 2 - Review Sites Search
  Calls: _search_review_sites() -> tool_client.search_review_sites()
  Method: Google site search for G2, Capterra, TrustRadius, AlternativeTo
  Status: PARTIAL (403 blocks on actual content fetch)

Step 4: Phase 3 - General Google Search
  Calls: _search_google_frustrations()
  Method: Google search for frustration keywords
  Status: WORKING

Step 5: Deduplicate pain points (max 20)
  Status: WORKING
```

### Missing from Protocol:

| Missing Feature | Protocol Reference | Impact |
|-----------------|-------------------|--------|
| Chrome Web Store reviews | gemini.md "Blood in the Water" | Missing primary source of extension complaints |
| Product Hunt discussions | Protocol Step 2 | Missing startup/tool community signals |
| Twitter/X complaints | Protocol Step 2 | Missing real-time frustration signals |
| Indie Hackers threads | Discovery Method 6 | Missing builder community validation |
| HackerNews discussions | "Social Moat" validation | Missing tech community signals |

---

## PHASE 3: V_Analyst.calculate_score() - BROKEN INPUTS

### Current Code Flow (agents.py lines 226-293):

```
Step 1: Calculate z_convergence
  Formula: min(sources_with_data / 3.0, 1.0)
  Boost: +0.2 if total_wounds >= 10
  Status: WORKING but depends on broken V_Scout output

Step 2: Calculate z_velocity
  Formula: Based on Reddit post engagement scores
  BUG-006: Reddit engagement scores NOT AVAILABLE via Google site search!
  Result: Always returns base 0.5 (50% of potential)

Step 3: Calculate z_scarcity
  Formula: Based on scarcity keywords in pain_points
  Keywords: "wish", "need", "want", "no way to", "can't find", "doesn't exist"
  Status: WORKING but limited keyword set

Step 4: Calculate final score
  Formula: (convergence * 0.45) + (velocity * 0.35) + (scarcity * 0.20) * 10

  With broken velocity (always 0.5):
  Best possible: (1.0 * 0.45) + (0.5 * 0.35) + (1.0 * 0.20) * 10 = 8.25
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  BUG-007: Maximum achievable score is 8.25, but threshold is 8.64!
           SYSTEM CAN NEVER PASS THRESHOLD WITH CURRENT SCORING!
```

---

## PHASE 4: Orchestrator (app.py) - INCOMPLETE

### Current Code Flow:

```
Step 1: Initialize ToolClient with Apify
  Status: WORKING

Step 2: Call trendspotter.find_host()
  Status: BROKEN (see Phase 1)

Step 3: Call scout.find_wounds()
  Status: PARTIAL (see Phase 2)

Step 4: Call analyst.calculate_score()
  Status: BROKEN (see Phase 3)

Step 5: Compare score to threshold (8.64)
  Status: IMPOSSIBLE TO PASS (BUG-007)

Step 6: Write to Vulture_Nest.md
  Status: NEVER REACHED
```

### Missing from Protocol:

| Missing Feature | Protocol Reference | Impact |
|-----------------|-------------------|--------|
| FOCUS parameter support | gemini.md Section 4 | Cannot guide discovery |
| Full Scan mode | gemini.md Section 4 | Cannot analyze specific URLs |
| query_log.json writing | Protocol Step 5 | No learning loop |
| Size validation | Protocol Step 3 | No L-size rejection |

---

## COMPLETE BUG REGISTRY

| ID | Severity | Location | Description |
|----|----------|----------|-------------|
| BUG-001 | CRITICAL | agents.py:25 | Hardcoded `'Tab' in line` filter |
| BUG-002 | CRITICAL | agents.py:33 | Hardcoded `return "OneTab"` fallback |
| BUG-003 | HIGH | agents.py:19 | Generic query ignores discovery methods |
| BUG-004 | HIGH | MISSING | No exclusion list for analyzed hosts |
| BUG-005 | HIGH | MISSING | No query_log.json integration |
| BUG-006 | CRITICAL | agents.py:258-266 | z_velocity relies on unavailable Reddit engagement data |
| BUG-007 | CRITICAL | agents.py:282-286 | Max score 8.25 < threshold 8.64 (IMPOSSIBLE TO PASS) |
| BUG-008 | MEDIUM | MISSING | No Chrome Web Store review scraping |
| BUG-009 | MEDIUM | MISSING | No Product Hunt integration |
| BUG-010 | MEDIUM | MISSING | No Twitter/X integration |
| BUG-011 | MEDIUM | MISSING | No Indie Hackers/HN integration |
| BUG-012 | LOW | MISSING | No FOCUS parameter support |
| BUG-013 | LOW | MISSING | No Full Scan mode |

---

## ROOT CAUSE ANALYSIS

### Why OneTab Every Time:

```
1. Query returns list of popular extensions
2. Code parses looking for '**' AND 'Tab' in same line
3. "OneTab" or "Tab Manager" matches
4. Other extensions (Grammarly, Honey, LastPass) are IGNORED
5. If parsing fails entirely, hardcoded "OneTab" fallback
6. Result: ALWAYS OneTab
```

### Why Score Never Passes:

```
1. z_velocity requires Reddit engagement scores
2. Google site search doesn't return engagement scores
3. z_velocity stuck at base 0.5
4. Maximum possible score: 8.25
5. Threshold: 8.64
6. Result: MATHEMATICALLY IMPOSSIBLE TO PASS
```

---

## REQUIRED FIXES (Priority Order)

### P0 - Critical (System Non-Functional):

1. **Remove hardcoded 'Tab' filter** - Parse ALL extensions from search results
2. **Remove 'OneTab' fallback** - Implement proper host selection logic
3. **Fix z_velocity calculation** - Use alternative signals (comment count, post recency, upvote indicators in text)
4. **Add exclusion list** - Track already-analyzed hosts in `analyzed_hosts.json`

### P1 - High (Protocol Compliance):

5. **Implement discovery methods** - Interface Arbitrage, Niche Ecosystems, etc.
6. **Integrate query_log.json** - Read/write for learning loop
7. **Add FOCUS parameter** - Allow guided discovery

### P2 - Medium (Signal Quality):

8. **Add Chrome Web Store scraping** - Primary source for extension complaints
9. **Add Product Hunt search** - Startup community signals
10. **Add Twitter/X search** - Real-time complaint detection

---

## RECOMMENDED IMMEDIATE ACTION

The V_Trendspotter agent needs complete rewrite. Current implementation is a placeholder that only works for tab-related extensions. The scoring algorithm needs z_velocity fix or the threshold will NEVER be reached.

**Do NOT run the system again until these fixes are implemented.**

---

---

## APPENDIX: FORENSIC CODE LOSS ANALYSIS

### Evidence of Lost Code

**Source:** `_archive\full-conversation-2-4-26.txt` (1.6MB conversation log)

The conversation log from February 4, 2026 shows the ORIGINAL working implementation:

### ORIGINAL V_Trendspotter (Working - Feb 4, 2026):

```python
def find_hosts(self, categories: list[str] = None) -> list[str]:
    print(f"[V-Trendspotter] Searching for popular hosts across categories: {categories or ['all']}...")
    if categories is None:
        categories = ['micro-saas', 'mobile app', 'web app', 'chrome extension']

    all_hosts = set()
    for category in categories:
        query = f'"popular {category} tools 2026" OR "trending {category}"'
        search_results = default_api.google_web_search(query = query)

        # Simple parsing: look for product names that appear capitalized and in quotes
        for result in search_results.get('google_web_search_response', {}).get('output', '').split('\n'):
            if '**' in result:
                # Extract text within bold markdown, e.g., **GitHub Copilot**
                host_name = result.split('**')[1].strip()
                if len(host_name.split()) > 1 and host_name not in ['GitHub Copilot', 'Amazon CodeWhisperer', 'Gemini Code Assist']:
                    all_hosts.add(host_name)

    identified_hosts = list(all_hosts)[:5]  # Limit to top 5
    print(f"[V-Trendspotter] Identified potential hosts: {identified_hosts}")
    return identified_hosts
```

### CURRENT BROKEN V_Trendspotter (agents.py):

```python
def find_host(self, category='chrome extension'):  # <-- SINGULAR, not plural
    print(f"[V-Trendspotter] Searching for a popular {category}...")
    query = f'"most popular {category}s 2026" OR "top {category}s"'
    search_results = self._tool_client.google_web_search_wrapper(query=query)

    for line in search_output.split('\n'):
        if '**' in line and 'Tab' in line:  # <-- HARDCODED "Tab" FILTER!
            host_name = line.split('**')[1].strip()
            if len(host_name.split()) < 3:
                return host_name
    return "OneTab"  # <-- HARDCODED FALLBACK!
```

### KEY DIFFERENCES (Code Regression):

| Feature | ORIGINAL (Working) | CURRENT (Broken) |
|---------|-------------------|------------------|
| Method name | `find_hosts()` (plural) | `find_host()` (singular) |
| Return type | `list[str]` (multiple hosts) | `str` (single host) |
| Categories | 4 categories searched | 1 category only |
| Parse filter | `len() > 1` (multi-word) | `'Tab' in line` (HARDCODED!) |
| Fallback | None (returns empty list) | `return "OneTab"` (HARDCODED!) |
| Exclusions | AI tools excluded | None |
| Host limit | 5 hosts returned | 1 host returned |

### ADDITIONAL LOST FEATURES:

1. **864z_Vulture_OS_v2.md** defines TWO parallel discovery inputs:
   - **Isenberg Scan**: Reddit/Discord communities for "laments"
   - **Carcass Scan**: App stores for stagnant, high-volume apps
   - **NEITHER IS IMPLEMENTED** in current code

2. **query_log.json Learning Loop**:
   - Protocol requires reading past query performance
   - Protocol requires writing new queries with scores
   - **NEITHER IS IMPLEMENTED** in current code

3. **Analyzed Hosts Exclusion List**:
   - No file exists to track already-analyzed hosts
   - System re-analyzes same hosts repeatedly

### ROOT CAUSE OF CODE LOSS:

The `main.py` file that contained the original working implementation was replaced with `app.py` + `agents.py` split at some point. During this refactoring:

1. `find_hosts()` was renamed to `find_host()` (breaking multi-host discovery)
2. Multi-category search was reduced to single category
3. A `'Tab' in line` filter was added (possibly as a debug hack that was never removed)
4. A `return "OneTab"` fallback was added (possibly as a test stub)

The `864z_criteria.json` in the archive shows this was specifically configured for the **TabVault validation run** (target_node: "OneTab", vault_destination: "TabVault"), NOT for general autonomous discovery. The current code is locked into that targeted validation mode.

---

*Report generated by Claude Code diagnostic audit*
*Next action: Await approval to implement P0 fixes - RESTORE ORIGINAL find_hosts() IMPLEMENTATION*
