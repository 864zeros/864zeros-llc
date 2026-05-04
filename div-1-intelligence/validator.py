# validator.py
"""
The 8.64 Gatekeeper - Vulture-Nest Validation Engine

This module implements the cynical validation logic that determines if a lead
qualifies as a Strike Package. NO FALSE OPTIMISM. Every lead is assumed to be
a failure until proven otherwise by the math.

Score < 8.64 = FAILURE: Lead Terminated
Score >= 8.64 = Strike Package Generated
"""
import json
import os
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any, List


# =============================================================================
# CONSTANTS - The Vulture Capital Math
# =============================================================================
TARGET_EXIT_VALUATION = 141312  # The sacred number
RULE_OF_40_THRESHOLD = 40  # Growth% + Margin% must meet this
SCARCITY_THRESHOLD = 3  # Max competitors before discard
SCORE_THRESHOLD = 8.64  # The gatekeeper threshold

# Weights for 864z scoring
WEIGHTS = {
    "z_convergence": 0.45,  # Signal strength across sources
    "z_velocity": 0.35,     # Speed/recency of pain signals
    "z_scarcity": 0.20      # Lack of modern solutions
}


@dataclass
class LeadCandidate:
    """A potential opportunity being evaluated."""
    name: str
    incumbent: str
    weakness: str
    export_format: Optional[str] = None
    traffic_monthly: int = 0
    last_update_months: int = 0
    sentiment_score: float = 50.0  # 0-100, lower = more negative
    pain_signals: List[str] = None
    competitors: List[str] = None
    growth_projection: float = 0.0  # Percentage
    margin_projection: float = 0.0  # Percentage

    def __post_init__(self):
        if self.pain_signals is None:
            self.pain_signals = []
        if self.competitors is None:
            self.competitors = []


@dataclass
class ValidationResult:
    """The output of the validation process."""
    lead_name: str
    passed: bool
    vulture_score: float
    rule_of_40: float
    exit_multiplier: float
    scarcity_index: int
    target_mrr: float
    months_to_exit: int
    failure_reason: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class StrikePackage:
    """The handoff contract to the 864zeros Builder Engine."""
    strike_id: str
    vulture_score: float
    target: Dict[str, str]
    builder_specs: Dict[str, Any]
    validation_timestamp: str

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2)

    def save(self, path: str = "strike_package.json"):
        with open(path, 'w', encoding='utf-8') as f:
            f.write(self.to_json())
        print(f"[Validator] Strike Package saved to {path}")


class VultureValidator:
    """
    The 8.64 Gatekeeper.

    Implements cynical validation logic:
    - Rule of 40 audit
    - Exit target reverse-engineering
    - Scarcity index check
    - Final 864z score calculation
    """

    def __init__(self, archive_path: str = "_archive/terminated_leads"):
        self.archive_path = archive_path
        self._strike_counter = self._load_strike_counter()

    def _load_strike_counter(self) -> int:
        """Load the running strike ID counter."""
        counter_file = "strike_counter.txt"
        if os.path.exists(counter_file):
            with open(counter_file, 'r') as f:
                return int(f.read().strip())
        return 0

    def _save_strike_counter(self):
        """Persist the strike counter."""
        with open("strike_counter.txt", 'w') as f:
            f.write(str(self._strike_counter))

    def _generate_strike_id(self) -> str:
        """Generate unique strike ID."""
        self._strike_counter += 1
        self._save_strike_counter()
        year = datetime.now().year
        return f"864z-{year}-{self._strike_counter:03d}"

    # =========================================================================
    # CORE VALIDATION MATH
    # =========================================================================

    def calculate_rule_of_40(self, growth_pct: float, margin_pct: float) -> float:
        """
        Rule of 40: Growth% + Margin% should be >= 40%.
        Used by VCs to evaluate SaaS health.
        """
        return growth_pct + margin_pct

    def calculate_exit_multiplier(self, rule_of_40: float) -> float:
        """
        Exit Multiplier (Chi): Premium applied when Rule of 40 is met.
        - Chi = 1.5 if Rule of 40 >= 40%
        - Chi = 1.0 otherwise
        """
        return 1.5 if rule_of_40 >= RULE_OF_40_THRESHOLD else 1.0

    def calculate_scarcity_index(self, competitors: List[str]) -> int:
        """
        Scarcity Index: Number of modern competitors.
        If > 3, the opportunity is too crowded.
        Returns the count (0 = best, >3 = discard).
        """
        # Filter for "modern" competitors (not abandoned)
        modern_competitors = [c for c in competitors if c.strip()]
        return len(modern_competitors)

    def calculate_months_to_exit(self, target_mrr: float, growth_rate: float) -> int:
        """
        Reverse-engineer months needed to reach exit valuation.
        Exit valuation = ARR * multiplier (typically 3-5x for micro-SaaS)
        """
        if target_mrr <= 0 or growth_rate <= 0:
            return 999  # Impossible

        # ARR needed for exit (assuming 4x multiple)
        target_arr = TARGET_EXIT_VALUATION / 4
        target_mrr_for_exit = target_arr / 12

        # Compound growth calculation
        current_mrr = target_mrr
        months = 0
        monthly_growth = 1 + (growth_rate / 100 / 12)  # Convert annual to monthly

        while current_mrr < target_mrr_for_exit and months < 120:
            current_mrr *= monthly_growth
            months += 1

        return months if months < 120 else 999

    def calculate_z_convergence(self, lead: LeadCandidate) -> float:
        """
        Z-Convergence: How many independent signals confirm the pain?
        Score 0.0 - 1.0
        """
        signals = 0
        max_signals = 5

        # Traffic signal
        if lead.traffic_monthly > 500000:
            signals += 1
        elif lead.traffic_monthly > 100000:
            signals += 0.5

        # Stagnation signal
        if lead.last_update_months > 24:
            signals += 1
        elif lead.last_update_months > 12:
            signals += 0.5

        # Sentiment signal
        if lead.sentiment_score < 40:
            signals += 1
        elif lead.sentiment_score < 60:
            signals += 0.5

        # Pain signal volume
        pain_count = len(lead.pain_signals)
        if pain_count >= 10:
            signals += 1
        elif pain_count >= 5:
            signals += 0.5

        # Weakness clarity
        if lead.weakness and len(lead.weakness) > 20:
            signals += 1

        return min(signals / max_signals, 1.0)

    def calculate_z_velocity(self, lead: LeadCandidate) -> float:
        """
        Z-Velocity: How recent/urgent are the pain signals?
        Score 0.0 - 1.0
        """
        # Base velocity from stagnation (inverted - older = more opportunity)
        stagnation_score = min(lead.last_update_months / 36, 1.0)

        # Pain signal recency boost
        pain_boost = min(len(lead.pain_signals) / 20, 0.5)

        # Sentiment urgency (lower sentiment = higher velocity)
        sentiment_factor = (100 - lead.sentiment_score) / 100

        velocity = (stagnation_score * 0.4) + (pain_boost * 0.3) + (sentiment_factor * 0.3)
        return min(velocity, 1.0)

    def calculate_z_scarcity(self, lead: LeadCandidate) -> float:
        """
        Z-Scarcity: Is there a gap in the market?
        Score 0.0 - 1.0 (higher = more scarce = better opportunity)
        """
        competitor_count = len(lead.competitors)

        if competitor_count == 0:
            return 1.0  # Blue ocean
        elif competitor_count == 1:
            return 0.8
        elif competitor_count == 2:
            return 0.6
        elif competitor_count == 3:
            return 0.4
        else:
            return 0.0  # Too crowded, automatic fail

    def calculate_864z_score(self, lead: LeadCandidate) -> tuple:
        """
        Calculate the final 864z score.

        Returns: (score, z_convergence, z_velocity, z_scarcity, rule_of_40, exit_multiplier)
        """
        # Calculate Z-factors
        z_conv = self.calculate_z_convergence(lead)
        z_vel = self.calculate_z_velocity(lead)
        z_scar = self.calculate_z_scarcity(lead)

        # Calculate Rule of 40
        rule_of_40 = self.calculate_rule_of_40(
            lead.growth_projection,
            lead.margin_projection
        )

        # Calculate Exit Multiplier
        exit_mult = self.calculate_exit_multiplier(rule_of_40)

        # Base weighted score
        base_score = (
            (z_conv * WEIGHTS["z_convergence"]) +
            (z_vel * WEIGHTS["z_velocity"]) +
            (z_scar * WEIGHTS["z_scarcity"])
        ) * 10  # Scale to 0-10

        # Apply exit multiplier
        final_score = base_score * exit_mult

        return (final_score, z_conv, z_vel, z_scar, rule_of_40, exit_mult)

    # =========================================================================
    # MAIN VALIDATION ENTRY POINT
    # =========================================================================

    def validate(self, lead: LeadCandidate) -> ValidationResult:
        """
        Validate a lead candidate against the 8.64 threshold.

        This is the CYNICAL SCRAPER logic:
        - Assume failure until proven otherwise
        - Apply all gatekeeping checks
        - Return ValidationResult with pass/fail
        """
        print(f"\n[Validator] Evaluating lead: {lead.name}")
        print(f"[Validator] Incumbent: {lead.incumbent}")
        print(f"[Validator] Weakness: {lead.weakness}")

        # === GATEKEEPER CHECK 1: Scarcity Index ===
        scarcity = self.calculate_scarcity_index(lead.competitors)
        if scarcity > SCARCITY_THRESHOLD:
            return self._terminate_lead(
                lead,
                f"SCARCITY_EXCEEDED: {scarcity} competitors > {SCARCITY_THRESHOLD} threshold"
            )
        print(f"[Validator] Scarcity Check: PASSED ({scarcity} competitors)")

        # === GATEKEEPER CHECK 2: Rule of 40 ===
        rule_of_40 = self.calculate_rule_of_40(
            lead.growth_projection,
            lead.margin_projection
        )
        if rule_of_40 < RULE_OF_40_THRESHOLD:
            print(f"[Validator] Rule of 40: WARNING ({rule_of_40:.1f}% < {RULE_OF_40_THRESHOLD}%)")
            # Don't terminate, but this affects the exit multiplier
        else:
            print(f"[Validator] Rule of 40: PASSED ({rule_of_40:.1f}%)")

        # === CALCULATE FULL 864z SCORE ===
        score, z_conv, z_vel, z_scar, r40, exit_mult = self.calculate_864z_score(lead)

        print(f"[Validator] Z-Convergence: {z_conv:.2f}")
        print(f"[Validator] Z-Velocity: {z_vel:.2f}")
        print(f"[Validator] Z-Scarcity: {z_scar:.2f}")
        print(f"[Validator] Exit Multiplier: {exit_mult:.1f}x")
        print(f"[Validator] FINAL SCORE: {score:.2f}")

        # === GATEKEEPER CHECK 3: The 8.64 Threshold ===
        if score < SCORE_THRESHOLD:
            return self._terminate_lead(
                lead,
                f"SCORE_BELOW_THRESHOLD: {score:.2f} < {SCORE_THRESHOLD}"
            )

        # Calculate projected MRR and months to exit
        # Assume conservative starting MRR based on Rule of 40 health
        target_mrr = 2500 if rule_of_40 >= 40 else 1500
        months_to_exit = self.calculate_months_to_exit(
            target_mrr,
            lead.growth_projection
        )

        # === SUCCESS: Create validation result ===
        print(f"[Validator] === STRIKE QUALIFIED ===")
        print(f"[Validator] Target MRR: ${target_mrr}")
        print(f"[Validator] Months to Exit: {months_to_exit}")

        return ValidationResult(
            lead_name=lead.name,
            passed=True,
            vulture_score=round(score, 2),
            rule_of_40=round(rule_of_40, 1),
            exit_multiplier=exit_mult,
            scarcity_index=scarcity,
            target_mrr=target_mrr,
            months_to_exit=months_to_exit
        )

    def _terminate_lead(self, lead: LeadCandidate, reason: str) -> ValidationResult:
        """
        Terminate a lead that failed validation.
        Log to archive and return failure result.
        """
        print(f"[Validator] === FAILURE: Lead Terminated ===")
        print(f"[Validator] Reason: {reason}")

        # Archive the terminated lead
        self._archive_terminated_lead(lead, reason)

        return ValidationResult(
            lead_name=lead.name,
            passed=False,
            vulture_score=0.0,
            rule_of_40=0.0,
            exit_multiplier=0.0,
            scarcity_index=len(lead.competitors),
            target_mrr=0.0,
            months_to_exit=0,
            failure_reason=reason
        )

    def _archive_terminated_lead(self, lead: LeadCandidate, reason: str):
        """Archive a terminated lead for future reference."""
        os.makedirs(self.archive_path, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{self.archive_path}/terminated_{lead.name.replace(' ', '_')}_{timestamp}.json"

        archive_data = {
            "lead": asdict(lead),
            "termination_reason": reason,
            "timestamp": timestamp
        }

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(archive_data, f, indent=2)

        print(f"[Validator] Archived to: {filename}")

    # =========================================================================
    # STRIKE PACKAGE GENERATION
    # =========================================================================

    def generate_strike_package(
        self,
        lead: LeadCandidate,
        validation: ValidationResult,
        required_bricks: List[str] = None,
        delta_features: List[str] = None
    ) -> Optional[StrikePackage]:
        """
        Generate the Strike Package JSON for handoff to 864zeros Builder.
        Only called if validation passed.
        """
        if not validation.passed:
            print("[Validator] Cannot generate Strike Package for failed lead")
            return None

        strike_id = self._generate_strike_id()

        package = StrikePackage(
            strike_id=strike_id,
            vulture_score=validation.vulture_score,
            target={
                "name": lead.incumbent,
                "weakness": lead.weakness,
                "export_format": lead.export_format or "JSON"
            },
            builder_specs={
                "required_bricks": required_bricks or ["BRK-DB-001"],
                "delta_features": delta_features or [lead.weakness],
                "projection": {
                    "target_mrr": validation.target_mrr,
                    "months_to_exit": validation.months_to_exit,
                    "rule_of_40_match": validation.rule_of_40 >= RULE_OF_40_THRESHOLD
                }
            },
            validation_timestamp=datetime.now().isoformat()
        )

        return package


# =============================================================================
# TEST HARNESS
# =============================================================================
if __name__ == "__main__":
    print("=" * 60)
    print("VULTURE VALIDATOR TEST HARNESS")
    print("=" * 60)

    validator = VultureValidator()

    # Test Case 1: A GOOD lead (should pass)
    print("\n--- TEST 1: Strong Lead ---")
    good_lead = LeadCandidate(
        name="TabVault",
        incumbent="OneTab",
        weakness="No cloud sync, data loss on uninstall",
        export_format="JSON",
        traffic_monthly=2100000,
        last_update_months=36,
        sentiment_score=35,
        pain_signals=[
            "Lost all my tabs when Chrome updated",
            "Why no sync across devices?",
            "Data disappeared after reinstall",
            "Wish I could organize tabs into groups",
            "No backup option is ridiculous",
            "Been using workarounds with bookmarks",
            "Switched to competitor but it's paid",
            "OneTab hasn't been updated in years",
            "Privacy concerns with cloud alternatives",
            "Need local-first solution"
        ],
        competitors=["Session Buddy", "Workona"],
        growth_projection=25,
        margin_projection=85
    )

    result = validator.validate(good_lead)
    print(f"\nResult: {'PASSED' if result.passed else 'FAILED'}")

    if result.passed:
        package = validator.generate_strike_package(
            good_lead,
            result,
            required_bricks=["BRK-DB-001", "BRK-MIG-002"],
            delta_features=["Cloud sync with E2E encryption", "ADHD-focus grouping UI"]
        )
        if package:
            print(f"\nStrike Package:\n{package.to_json()}")
            package.save()

    # Test Case 2: A BAD lead (should fail - too many competitors)
    print("\n--- TEST 2: Crowded Market ---")
    bad_lead = LeadCandidate(
        name="NoteTaker Pro",
        incumbent="Evernote",
        weakness="Slow and bloated",
        traffic_monthly=5000000,
        last_update_months=6,
        sentiment_score=55,
        pain_signals=["App is slow", "Too many features"],
        competitors=["Notion", "Obsidian", "Roam", "Bear", "Apple Notes"],
        growth_projection=15,
        margin_projection=70
    )

    result2 = validator.validate(bad_lead)
    print(f"\nResult: {'PASSED' if result2.passed else 'FAILED'}")

    # Test Case 3: Marginal lead (should fail - score below threshold)
    print("\n--- TEST 3: Marginal Lead ---")
    marginal_lead = LeadCandidate(
        name="CalendarSync",
        incumbent="Calendly",
        weakness="No offline mode",
        traffic_monthly=300000,
        last_update_months=8,
        sentiment_score=60,
        pain_signals=["Wish it worked offline", "Mobile app crashes"],
        competitors=["Cal.com", "SavvyCal"],
        growth_projection=10,
        margin_projection=20
    )

    result3 = validator.validate(marginal_lead)
    print(f"\nResult: {'PASSED' if result3.passed else 'FAILED'}")

    print("\n" + "=" * 60)
    print("TEST HARNESS COMPLETE")
    print("=" * 60)
