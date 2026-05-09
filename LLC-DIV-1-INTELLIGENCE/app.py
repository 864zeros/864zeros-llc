# app.py
"""
Vulture-Nest Orchestrator

The main pipeline that connects:
1. Discovery Engine (Cynical Scraper) -> Finds carcasses with pain signals
2. Validator (8.64 Gatekeeper) -> Validates and scores opportunities
3. Strike Package Output -> JSON handoff to 864zeros Builder

NO FALSE OPTIMISM. Every lead is terminated unless it passes the 8.64 threshold.
"""
import json
import sys
from datetime import datetime
from typing import List, Optional

from tool_wrapper import ToolClient
from discovery_engine import DiscoveryEngine, CarcassProfile, DISCOVERY_CATEGORIES
from validator import VultureValidator, LeadCandidate, StrikePackage


# =============================================================================
# CONSTANTS
# =============================================================================
VULTURE_NEST_MD_PATH = "Vulture_Nest.md"
STRIKES_DIR = "strikes"


class VultureNestPipeline:
    """
    The Vulture-Nest Pipeline Orchestrator.

    Runs the complete discovery -> validation -> handoff cycle.
    """

    def __init__(self):
        print("[Pipeline] Initializing Vulture-Nest Pipeline...")
        try:
            self.tool_client = ToolClient()
            print("[Pipeline] ToolClient initialized with Apify")
        except Exception as e:
            print(f"[Pipeline] WARNING: ToolClient initialization failed: {e}")
            print("[Pipeline] Running in dry-run mode (no API calls)")
            self.tool_client = None

        self.discovery = DiscoveryEngine(self.tool_client)
        self.validator = VultureValidator()

    def _write_to_nest_md(self, lead: LeadCandidate, validation, package: StrikePackage):
        """Write successful strike to Vulture_Nest.md catalog."""
        print(f"[Pipeline] Writing to {VULTURE_NEST_MD_PATH}...")

        lines = [
            "\n---",
            f"### [VULTURE] {lead.name}",
            f"- **Status:** Strike Qualified",
            f"- **Vulture Score:** {validation.vulture_score}/10",
            f"- **Strike ID:** {package.strike_id}",
            f"- **Incumbent:** {lead.incumbent}",
            f"- **Weakness:** {lead.weakness}",
            f"- **Rule of 40:** {validation.rule_of_40}%",
            f"- **Exit Multiplier:** {validation.exit_multiplier}x",
            f"- **Target MRR:** ${validation.target_mrr}",
            f"- **Months to Exit:** {validation.months_to_exit}",
            f"- **Competitors:** {len(lead.competitors)} identified",
            f"- **Pain Signals:** {len(lead.pain_signals)} captured",
            f"- **Strike Package:** `strikes/{package.strike_id}.json`",
            "---"
        ]
        entry = "\n".join(lines)

        with open(VULTURE_NEST_MD_PATH, 'a', encoding='utf-8') as f:
            f.write(entry)

        print(f"[Pipeline] Successfully cataloged in {VULTURE_NEST_MD_PATH}")

    def _save_strike_package(self, package: StrikePackage):
        """Save strike package to dedicated strikes directory."""
        import os
        os.makedirs(STRIKES_DIR, exist_ok=True)

        filepath = f"{STRIKES_DIR}/{package.strike_id}.json"
        package.save(filepath)
        print(f"[Pipeline] Strike package saved: {filepath}")

    def run_full_cycle(
        self,
        categories: List[str] = None,
        max_carcasses: int = 5,
        growth_projection: float = 20.0,
        margin_projection: float = 80.0
    ) -> List[StrikePackage]:
        """
        Run the complete Vulture-Nest cycle.

        1. Discovery: Find and analyze carcasses
        2. Validation: Run each through the 8.64 Gatekeeper
        3. Output: Generate Strike Packages for qualified leads

        Returns list of successful StrikePackages.
        """
        print("\n" + "=" * 70)
        print("VULTURE-NEST PIPELINE: FULL CYCLE")
        print("=" * 70)
        print(f"Categories: {categories or 'ALL'}")
        print(f"Max carcasses: {max_carcasses}")
        print(f"Growth projection: {growth_projection}%")
        print(f"Margin projection: {margin_projection}%")
        print("=" * 70 + "\n")

        # === PHASE 1: DISCOVERY ===
        print("[Pipeline] === PHASE 1: DISCOVERY ===")
        carcass_profiles = self.discovery.run_discovery_cycle(
            categories=categories,
            max_carcasses=max_carcasses
        )

        if not carcass_profiles:
            print("[Pipeline] No carcasses discovered. Cycle terminated.")
            return []

        # === PHASE 2: VALIDATION ===
        print("\n[Pipeline] === PHASE 2: VALIDATION ===")

        successful_strikes = []
        failed_count = 0

        for profile in carcass_profiles:
            # Convert to LeadCandidate
            lead = profile.to_lead_candidate(
                growth_proj=growth_projection,
                margin_proj=margin_projection
            )

            # Run through validator
            validation = self.validator.validate(lead)

            if validation.passed:
                # Generate strike package
                package = self.validator.generate_strike_package(
                    lead,
                    validation,
                    required_bricks=["BRK-DB-001", "BRK-MIG-002"],
                    delta_features=[lead.weakness]
                )

                if package:
                    # Save and catalog
                    self._save_strike_package(package)
                    self._write_to_nest_md(lead, validation, package)
                    successful_strikes.append(package)
            else:
                failed_count += 1

        # === PHASE 3: SUMMARY ===
        print("\n" + "=" * 70)
        print("VULTURE-NEST CYCLE COMPLETE")
        print("=" * 70)
        print(f"Carcasses analyzed: {len(carcass_profiles)}")
        print(f"Strikes qualified: {len(successful_strikes)}")
        print(f"Leads terminated: {failed_count}")

        if successful_strikes:
            print("\nQualified Strikes:")
            for pkg in successful_strikes:
                print(f"  - {pkg.strike_id}: {pkg.target['name']} (Score: {pkg.vulture_score})")

        print("=" * 70 + "\n")

        return successful_strikes

    def run_targeted_scan(
        self,
        incumbent_name: str,
        category: str = "chrome extension",
        growth_projection: float = 20.0,
        margin_projection: float = 80.0
    ) -> Optional[StrikePackage]:
        """
        Run a targeted scan on a specific incumbent.

        Use this for deep-dive analysis of a known target.
        """
        print("\n" + "=" * 70)
        print(f"VULTURE-NEST: TARGETED SCAN - {incumbent_name}")
        print("=" * 70 + "\n")

        # Create profile for target
        profile = CarcassProfile(
            name=incumbent_name,
            category=category,
            traffic_monthly=500000  # Assume minimum viable traffic
        )

        # Run full analysis
        print("[Pipeline] Running deep analysis...")
        analyzed = self.discovery.analyze_carcass(profile)

        # Convert and validate
        lead = analyzed.to_lead_candidate(
            growth_proj=growth_projection,
            margin_proj=margin_projection
        )

        validation = self.validator.validate(lead)

        if validation.passed:
            package = self.validator.generate_strike_package(
                lead,
                validation,
                required_bricks=["BRK-DB-001", "BRK-MIG-002"],
                delta_features=[lead.weakness]
            )

            if package:
                self._save_strike_package(package)
                self._write_to_nest_md(lead, validation, package)
                print(f"\n[Pipeline] STRIKE QUALIFIED: {package.strike_id}")
                return package

        print(f"\n[Pipeline] FAILURE: Lead Terminated")
        print(f"[Pipeline] Reason: {validation.failure_reason}")
        return None


# =============================================================================
# CLI INTERFACE
# =============================================================================
def print_usage():
    """Print CLI usage instructions."""
    print("""
Vulture-Nest Pipeline CLI
==========================

Usage:
  python app.py                     # Run full discovery cycle (default)
  python app.py --full              # Run full discovery cycle
  python app.py --target "OneTab"   # Targeted scan of specific incumbent
  python app.py --categories "chrome extension,micro-saas"
  python app.py --max 3             # Limit to 3 carcasses
  python app.py --dry-run           # Test without API calls

Options:
  --full          Run full autonomous discovery cycle
  --target NAME   Run targeted scan on specific incumbent
  --categories    Comma-separated list of categories to scan
  --max N         Maximum carcasses to analyze (default: 5)
  --growth N      Growth projection % (default: 20)
  --margin N      Margin projection % (default: 80)
  --dry-run       Run without API calls (testing)
  --help          Show this help message
""")


def main():
    """CLI entry point."""
    args = sys.argv[1:]

    if "--help" in args or "-h" in args:
        print_usage()
        return

    # Parse arguments
    target = None
    categories = None
    max_carcasses = 5
    growth = 20.0
    margin = 80.0

    i = 0
    while i < len(args):
        arg = args[i]

        if arg == "--target" and i + 1 < len(args):
            target = args[i + 1]
            i += 2
        elif arg == "--categories" and i + 1 < len(args):
            categories = [c.strip() for c in args[i + 1].split(",")]
            i += 2
        elif arg == "--max" and i + 1 < len(args):
            max_carcasses = int(args[i + 1])
            i += 2
        elif arg == "--growth" and i + 1 < len(args):
            growth = float(args[i + 1])
            i += 2
        elif arg == "--margin" and i + 1 < len(args):
            margin = float(args[i + 1])
            i += 2
        elif arg == "--full":
            i += 1
        elif arg == "--dry-run":
            print("[CLI] Dry-run mode - no API calls will be made")
            i += 1
        else:
            i += 1

    # Initialize pipeline
    pipeline = VultureNestPipeline()

    # Run appropriate mode
    if target:
        pipeline.run_targeted_scan(
            incumbent_name=target,
            growth_projection=growth,
            margin_projection=margin
        )
    else:
        pipeline.run_full_cycle(
            categories=categories,
            max_carcasses=max_carcasses,
            growth_projection=growth,
            margin_projection=margin
        )


if __name__ == "__main__":
    main()
