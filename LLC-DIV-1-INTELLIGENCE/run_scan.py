#!/usr/bin/env python3
"""
run_scan.py - Vulture Nest Full Cycle Scan
Scans for unbundling opportunities in Browser Extension / Micro-SaaS categories.
Focus: Evernote, LastPass, Grammarly - cloud subscriptions replaceable by local-first.
"""

import json
import os
from datetime import datetime
from discovery_engine import DiscoveryEngine, KNOWN_CARCASSES, ExclusionList
from validator import VultureValidator, LeadCandidate

# Configuration
SCORE_THRESHOLD = 8.64
CATEGORIES = ["chrome extension", "micro-saas"]
MAX_TARGETS = 10
OUTPUT_DIR = "scan_results"

def run_full_scan():
    """Execute full discovery and validation cycle."""
    print("=" * 70)
    print("VULTURE NEST - FULL CYCLE SCAN")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Threshold: {SCORE_THRESHOLD}")
    print(f"Categories: {CATEGORIES}")
    print("=" * 70)

    # Initialize components
    exclusions = ExclusionList()
    validator = VultureValidator()

    print(f"\n[SCAN] Active exclusions: {len(exclusions.exclusions)}")
    for exc in exclusions.exclusions:
        print(f"  - {exc}")

    # Filter targets
    print(f"\n[SCAN] Filtering targets...")
    targets = []
    for carcass in KNOWN_CARCASSES:
        name = carcass["name"]
        category = carcass["category"]

        if category not in CATEGORIES:
            continue

        if exclusions.is_excluded(name):
            print(f"  [SKIP] {name} - excluded")
            continue

        # Prioritize unbundling targets
        unbundle = carcass.get("unbundle_potential", "low")
        local_viable = carcass.get("local_first_viable", False)

        targets.append({
            **carcass,
            "priority": 1 if unbundle == "high" and local_viable else 2
        })

    # Sort by priority
    targets.sort(key=lambda x: (x["priority"], -x["estimated_traffic"]))
    targets = targets[:MAX_TARGETS]

    print(f"\n[SCAN] Targets to analyze: {len(targets)}")
    for t in targets:
        unbundle = t.get("unbundle_potential", "standard")
        print(f"  - {t['name']} ({t['category']}) - {t['estimated_traffic']:,} traffic - unbundle: {unbundle}")

    # Simulated analysis results
    # In production, this would call actual web search APIs
    SIMULATED_ANALYSIS = {
        "Evernote": {
            "pain_signals": 35,
            "sentiment": 32,
            "competitors": ["Notion", "Obsidian", "Bear", "Apple Notes"],
            "weakness": "export, sync, pricing, bloat",
            "last_update_months": 6
        },
        "LastPass": {
            "pain_signals": 48,
            "sentiment": 25,
            "competitors": ["1Password", "Bitwarden", "Dashlane"],
            "weakness": "security breaches, pricing, free tier gutted",
            "last_update_months": 2
        },
        "Grammarly": {
            "pain_signals": 22,
            "sentiment": 45,
            "competitors": ["LanguageTool", "ProWritingAid", "Hemingway"],
            "weakness": "pricing, privacy, aggressive upselling",
            "last_update_months": 1
        },
        "1Password": {
            "pain_signals": 15,
            "sentiment": 55,
            "competitors": ["Bitwarden", "LastPass", "Dashlane", "KeePass"],
            "weakness": "subscription model, no lifetime option",
            "last_update_months": 1
        },
        "Raindrop.io": {
            "pain_signals": 12,
            "sentiment": 52,
            "competitors": ["Pocket", "Instapaper", "Pinboard"],
            "weakness": "sync issues, mobile app, offline access",
            "last_update_months": 3
        },
        "Instapaper": {
            "pain_signals": 18,
            "sentiment": 40,
            "competitors": ["Pocket", "Raindrop", "Matter"],
            "weakness": "stagnant development, limited features",
            "last_update_months": 18
        },
        "Todoist": {
            "pain_signals": 20,
            "sentiment": 48,
            "competitors": ["TickTick", "Things 3", "Any.do"],
            "weakness": "pricing tiers, feature gating",
            "last_update_months": 2
        },
        "Roam Research": {
            "pain_signals": 25,
            "sentiment": 38,
            "competitors": ["Obsidian", "Logseq", "Notion"],
            "weakness": "pricing ($15/mo), performance, no offline",
            "last_update_months": 4
        },
        "OneTab": {
            "pain_signals": 30,
            "sentiment": 35,
            "competitors": ["Session Buddy", "Tab Manager Plus", "Workona"],
            "weakness": "no sync, no cloud backup, data loss",
            "last_update_months": 36
        },
        "Bitwarden": {
            "pain_signals": 8,
            "sentiment": 65,
            "competitors": ["1Password", "LastPass"],
            "weakness": "UI complexity, premium features locked",
            "last_update_months": 1
        }
    }

    # Run validation
    print("\n" + "=" * 70)
    print("VALIDATION PHASE")
    print("=" * 70)

    results = []
    qualified_strikes = []

    for target in targets:
        name = target["name"]
        print(f"\n[VALIDATE] {name}...")

        # Get simulated or default data
        sim = SIMULATED_ANALYSIS.get(name, {
            "pain_signals": 10,
            "sentiment": 50,
            "competitors": [],
            "weakness": "Unknown",
            "last_update_months": 0
        })

        # Build lead candidate
        lead = LeadCandidate(
            name=f"{name} Alternative",
            incumbent=name,
            weakness=f"Users frustrated with: {sim['weakness']}",
            export_format="Unknown",
            traffic_monthly=target["estimated_traffic"],
            last_update_months=sim["last_update_months"],
            sentiment_score=sim["sentiment"],
            pain_signals=[f"Signal {i+1}" for i in range(sim["pain_signals"])],
            competitors=sim["competitors"],
            growth_projection=25.0,  # Conservative
            margin_projection=85.0   # Local-first = high margin
        )

        # Validate
        result = validator.validate(lead)

        results.append({
            "name": name,
            "score": result.vulture_score,
            "qualified": result.passed,
            "disqualify_reason": result.failure_reason,
            "rule_of_40": result.rule_of_40,
            "exit_multiplier": result.exit_multiplier,
            "competitors": len(sim["competitors"]),
            "weakness": sim["weakness"]
        })

        if result.passed:
            qualified_strikes.append({
                "target": name,
                "score": result.vulture_score,
                "weakness": sim["weakness"],
                "competitors": sim["competitors"]
            })

        status = "[QUALIFIED]" if result.passed else f"[FAIL] {result.failure_reason or 'Below threshold'}"
        print(f"  Score: {result.vulture_score:.2f} - {status}")

    # Sort results by score
    results.sort(key=lambda x: x["score"], reverse=True)
    qualified_strikes.sort(key=lambda x: x["score"], reverse=True)

    # Output results
    print("\n" + "=" * 70)
    print("SCAN RESULTS")
    print("=" * 70)

    print("\n[LEADERBOARD]")
    print(f"{'Rank':<5} {'Target':<20} {'Score':<8} {'Status':<15} {'Weakness'}")
    print("-" * 80)

    for i, r in enumerate(results, 1):
        status = "STRIKE" if r["qualified"] else "BELOW"
        weakness_short = r['weakness'][:30] if r['weakness'] else ''
        print(f"{i:<5} {r['name']:<20} {r['score']:<8.2f} {status:<15} {weakness_short}")

    # Save results
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    scan_file = f"{OUTPUT_DIR}/scan_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    scan_output = {
        "timestamp": datetime.now().isoformat(),
        "threshold": SCORE_THRESHOLD,
        "categories": CATEGORIES,
        "targets_scanned": len(results),
        "qualified_count": len(qualified_strikes),
        "results": results,
        "qualified_strikes": qualified_strikes
    }

    with open(scan_file, 'w') as f:
        json.dump(scan_output, f, indent=2)

    print(f"\n[SCAN] Results saved to: {scan_file}")

    # Report qualified strikes
    print("\n" + "=" * 70)
    if qualified_strikes:
        print(f">>> QUALIFIED STRIKES: {len(qualified_strikes)}")
        print("=" * 70)
        for strike in qualified_strikes:
            print(f"\n  TARGET: {strike['target']}")
            print(f"  SCORE: {strike['score']:.2f}/10")
            print(f"  WEAKNESS: {strike['weakness']}")
            print(f"  COMPETITORS: {len(strike['competitors'])}")
    else:
        print("NO QUALIFIED STRIKES (Score >= 8.64)")
        print("=" * 70)
        print("\nNest entering IDLE mode. Will re-scan on next cycle.")

    return qualified_strikes


if __name__ == "__main__":
    strikes = run_full_scan()

    if strikes:
        print("\n" + "=" * 70)
        print(">>> INTERRUPT: High-value strikes detected!")
        print("Review qualified targets before proceeding.")
        print("=" * 70)
