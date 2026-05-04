#!/usr/bin/env python3
"""
quest_engine.py - The Vulture Nest Strike Quest Engine

STANDALONE HIGH-DEPTH RESEARCH SYSTEM
======================================
This engine is RESEARCH ONLY. No Factory logic. No Builder specs.
Its sole purpose is to generate complete Strike Quest documents.

A Strike Quest is only complete if it contains:
1. THE RANSOM - Pricing/subscription pain analysis
2. THE FRICTION - Export lock-in, feature walls, migration barriers
3. THE MATH OF THE KILL - 864z score, Rule of 40, TAM, MMR projections
4. THE TECHNICAL RESCUE BLUEPRINT - Architecture recommendations

Output: Full Strike Quest Document (Markdown + JSON)

Usage:
    python quest_engine.py --target "Knak" --mode deep
    python quest_engine.py --target "Calendly" --mode quick
    python quest_engine.py --list-quests
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
from enum import Enum

# =============================================================================
# CONSTANTS - The Vulture Capital Math
# =============================================================================
TARGET_EXIT_VALUATION = 141312  # The sacred number ($141,312)
RULE_OF_40_THRESHOLD = 40      # Growth% + Margin% minimum
SCARCITY_THRESHOLD = 3         # Max competitors before red flag
SCORE_THRESHOLD = 8.64         # The gatekeeper threshold
LAMENT_THRESHOLD = 7           # Minimum pain intensity

# T-Shirt Sizing (Build Complexity Gates)
TSHIRT_SIZES = {
    "XS": {"hours": 24, "description": "Single-script / Automation", "max_complexity": 2},
    "S": {"hours": 96, "description": "Basic UI + API logic", "max_complexity": 4},
    "M": {"hours": 336, "description": "Frontend + Database + Auth", "max_complexity": 7},
    "L": {"hours": 720, "description": "Multi-platform / Agentic AI", "max_complexity": 10}
}

# Z-Factor Weights for 864z Scoring
WEIGHTS = {
    "z_convergence": 0.45,  # Signal strength across sources
    "z_velocity": 0.35,     # Speed/recency of pain signals
    "z_scarcity": 0.20      # Lack of modern solutions
}


class StrikeStatus(Enum):
    """Three-state verdict system for Strike Quests."""
    STRIKE = "STRIKE"   # Score >= 8.64 AND tshirt != "L" - Proceed to build
    HANGAR = "HANGAR"   # Score 7.0-8.63 OR L-size with high score - Shelved for later
    REJECT = "REJECT"   # Score < 7.0 - Not viable

# Output paths
QUEST_OUTPUT_DIR = Path(__file__).parent / "OFFICE" / "DIV-1-VULTURE" / "quests"


@dataclass
class RansomAnalysis:
    """THE RANSOM - Pricing/subscription pain analysis."""
    pricing_model: str  # "subscription", "per-seat", "freemium", "one-time"
    price_range: str    # "$X/month", "$X/year", "custom"
    free_tier_exists: bool
    free_tier_limits: List[str]
    price_increase_history: List[str]
    enterprise_wall: bool  # Requires sales call
    ransom_signals: List[Dict[str, str]]
    ransom_severity: int  # 1-10

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class FrictionAnalysis:
    """THE FRICTION - Export lock-in, migration barriers."""
    export_formats: List[str]
    export_limitations: List[str]
    api_restrictions: List[str]
    data_portability_score: int  # 1-10, higher = more portable
    lock_in_mechanisms: List[str]
    migration_complexity: str  # "trivial", "moderate", "difficult", "nightmare"
    friction_signals: List[Dict[str, str]]
    friction_severity: int  # 1-10

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class MathOfTheKill:
    """THE MATH OF THE KILL - Financial validation."""
    # 864z Score Components
    z_convergence: float
    z_velocity: float
    z_scarcity: float
    vulture_score: float

    # Rule of 40
    growth_projection: float  # Percentage
    margin_projection: float  # Percentage
    rule_of_40: float
    exit_multiplier: float

    # TAM/SAM/SOM
    tam_estimate: int  # Total Addressable Market (users)
    sam_estimate: int  # Serviceable Addressable Market
    som_estimate: int  # Serviceable Obtainable Market

    # MMR Projections
    target_mrr: float
    months_to_exit: int
    exit_valuation: int
    price_point: float

    # T-Shirt Sizing
    tshirt_size: str
    complexity_score: int
    build_hours_estimate: int

    # Verdict
    strike_qualified: bool
    strike_status: StrikeStatus  # Three-state: STRIKE, HANGAR, REJECT
    kill_rationale: str

    def to_dict(self) -> Dict:
        d = asdict(self)
        # Convert Enum to string for JSON serialization
        d['strike_status'] = self.strike_status.value
        return d


@dataclass
class TechnicalBlueprint:
    """THE TECHNICAL RESCUE BLUEPRINT - Architecture recommendations."""
    product_codename: str
    tagline: str
    architecture_type: str  # "chrome_extension", "web_app", "desktop", "mobile"
    offline_first: bool
    cloud_dependency: str  # "none", "optional", "required"
    storage_strategy: str

    # Core rescue capabilities
    rescue_capabilities: List[str]
    delta_features: List[Dict[str, Any]]

    # Technical requirements
    required_technologies: List[str]
    integration_points: List[str]

    # North Star metrics
    primary_metric: Dict[str, str]
    secondary_metric: Dict[str, str]

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class StrikeQuest:
    """Complete Strike Quest Document."""
    quest_id: str
    target_name: str
    generated_at: str
    mode: str  # "deep" or "quick"

    # Target Profile
    target_category: str
    target_traffic: int
    stagnation_months: int
    primary_weakness: str
    secondary_weakness: str

    # The Four Pillars
    ransom: RansomAnalysis
    friction: FrictionAnalysis
    math: MathOfTheKill
    blueprint: TechnicalBlueprint

    # Pain Signal Synthesis
    pain_signals: Dict[str, Any]
    sentiment_synthesis: str

    # Competitor Landscape
    competitors: List[Dict[str, str]]

    # GTM Strategy
    gtm_channels: List[str]
    positioning: str

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2, default=str)

    def to_dict(self) -> Dict:
        return {
            "quest_id": self.quest_id,
            "target_name": self.target_name,
            "generated_at": self.generated_at,
            "mode": self.mode,
            "target": {
                "category": self.target_category,
                "traffic": self.target_traffic,
                "stagnation_months": self.stagnation_months,
                "primary_weakness": self.primary_weakness,
                "secondary_weakness": self.secondary_weakness
            },
            "ransom": self.ransom.to_dict(),
            "friction": self.friction.to_dict(),
            "math": self.math.to_dict(),
            "blueprint": self.blueprint.to_dict(),
            "pain_signals": self.pain_signals,
            "sentiment_synthesis": self.sentiment_synthesis,
            "competitors": self.competitors,
            "gtm": {
                "channels": self.gtm_channels,
                "positioning": self.positioning
            }
        }

    def to_markdown(self) -> str:
        """Generate the full Strike Quest Markdown document."""
        md = f"""# STRIKE QUEST: {self.target_name.upper()}

**Quest ID:** `{self.quest_id}`
**Generated:** {self.generated_at}
**Mode:** {self.mode.upper()}
**Vulture Score:** {self.math.vulture_score:.2f} | **Verdict:** {self.math.strike_status.value}

---

## TARGET PROFILE

| Attribute | Value |
|-----------|-------|
| **Category** | {self.target_category} |
| **Monthly Traffic** | {self.target_traffic:,} |
| **Stagnation** | {self.stagnation_months} months |
| **Primary Weakness** | {self.primary_weakness} |
| **Secondary Weakness** | {self.secondary_weakness} |

---

## 1. THE RANSOM

> *What is the pricing pain? How are users held hostage?*

### Pricing Model
- **Type:** {self.ransom.pricing_model}
- **Price Range:** {self.ransom.price_range}
- **Free Tier:** {'Yes' if self.ransom.free_tier_exists else 'No'}
- **Enterprise Wall:** {'Yes (requires sales call)' if self.ransom.enterprise_wall else 'No'}

### Free Tier Limitations
{chr(10).join(f'- {limit}' for limit in self.ransom.free_tier_limits) if self.ransom.free_tier_limits else '- None documented'}

### Price Increase History
{chr(10).join(f'- {increase}' for increase in self.ransom.price_increase_history) if self.ransom.price_increase_history else '- No increases documented'}

### Ransom Signals ({len(self.ransom.ransom_signals)} detected)
{self._format_signals(self.ransom.ransom_signals)}

**Ransom Severity:** {self.ransom.ransom_severity}/10

---

## 2. THE FRICTION

> *How are users locked in? What are the migration barriers?*

### Export Capabilities
- **Available Formats:** {', '.join(self.friction.export_formats) if self.friction.export_formats else 'Unknown'}
- **Data Portability Score:** {self.friction.data_portability_score}/10
- **Migration Complexity:** {self.friction.migration_complexity.upper()}

### Export Limitations
{chr(10).join(f'- {limit}' for limit in self.friction.export_limitations) if self.friction.export_limitations else '- None documented'}

### Lock-in Mechanisms
{chr(10).join(f'- {mechanism}' for mechanism in self.friction.lock_in_mechanisms) if self.friction.lock_in_mechanisms else '- None documented'}

### API Restrictions
{chr(10).join(f'- {restriction}' for restriction in self.friction.api_restrictions) if self.friction.api_restrictions else '- None documented'}

### Friction Signals ({len(self.friction.friction_signals)} detected)
{self._format_signals(self.friction.friction_signals)}

**Friction Severity:** {self.friction.friction_severity}/10

---

## 3. THE MATH OF THE KILL

> *Does the opportunity pass the 8.64 threshold?*

### 864z Score Breakdown

| Factor | Score | Weight | Contribution |
|--------|-------|--------|--------------|
| Z-Convergence | {self.math.z_convergence:.2f} | {WEIGHTS['z_convergence']} | {self.math.z_convergence * WEIGHTS['z_convergence']:.3f} |
| Z-Velocity | {self.math.z_velocity:.2f} | {WEIGHTS['z_velocity']} | {self.math.z_velocity * WEIGHTS['z_velocity']:.3f} |
| Z-Scarcity | {self.math.z_scarcity:.2f} | {WEIGHTS['z_scarcity']} | {self.math.z_scarcity * WEIGHTS['z_scarcity']:.3f} |
| **Exit Multiplier** | {self.math.exit_multiplier:.1f}x | - | - |
| **FINAL SCORE** | **{self.math.vulture_score:.2f}** | - | {'PASS' if self.math.vulture_score >= SCORE_THRESHOLD else 'FAIL'} |

### Rule of 40 Analysis

| Metric | Value |
|--------|-------|
| Growth Projection | {self.math.growth_projection}% |
| Margin Projection | {self.math.margin_projection}% |
| **Rule of 40** | **{self.math.rule_of_40}%** {'(PASS)' if self.math.rule_of_40 >= RULE_OF_40_THRESHOLD else '(FAIL)'} |

### Market Sizing (TAM/SAM/SOM)

| Tier | Estimate |
|------|----------|
| TAM (Total Addressable) | {self.math.tam_estimate:,} users |
| SAM (Serviceable) | {self.math.sam_estimate:,} users |
| SOM (Obtainable) | {self.math.som_estimate:,} users |

### MMR Projections

| Metric | Value |
|--------|-------|
| Target MRR | ${self.math.target_mrr:,.0f} |
| Price Point | ${self.math.price_point}/unit |
| Months to Exit | {self.math.months_to_exit} |
| Exit Valuation | ${self.math.exit_valuation:,} |

### Build Complexity (T-Shirt Sizing)

| Metric | Value |
|--------|-------|
| T-Shirt Size | **{self.math.tshirt_size}** |
| Complexity Score | {self.math.complexity_score}/10 |
| Estimated Build Hours | {self.math.build_hours_estimate} |
| Size Description | {TSHIRT_SIZES.get(self.math.tshirt_size, {}).get('description', 'N/A')} |

### Kill Decision

**VERDICT:** {self.math.strike_status.value}

> {self.math.kill_rationale}

---

## 4. THE TECHNICAL RESCUE BLUEPRINT

> *How do we build the alternative?*

### Product Overview
- **Codename:** {self.blueprint.product_codename}
- **Tagline:** *"{self.blueprint.tagline}"*
- **Architecture:** {self.blueprint.architecture_type}
- **Offline-First:** {'Yes' if self.blueprint.offline_first else 'No'}
- **Cloud Dependency:** {self.blueprint.cloud_dependency}
- **Storage Strategy:** {self.blueprint.storage_strategy}

### Rescue Capabilities (What We Fix)
{chr(10).join(f'- {cap}' for cap in self.blueprint.rescue_capabilities)}

### Delta Features (Our Advantages)
{self._format_delta_features(self.blueprint.delta_features)}

### Technical Requirements
{chr(10).join(f'- {tech}' for tech in self.blueprint.required_technologies)}

### Integration Points
{chr(10).join(f'- {point}' for point in self.blueprint.integration_points)}

### North Star Metrics

**Primary:** {self.blueprint.primary_metric.get('name', 'N/A')}
> {self.blueprint.primary_metric.get('description', 'N/A')}
> Target: {self.blueprint.primary_metric.get('target', 'N/A')}

**Secondary:** {self.blueprint.secondary_metric.get('name', 'N/A')}
> {self.blueprint.secondary_metric.get('description', 'N/A')}
> Target: {self.blueprint.secondary_metric.get('target', 'N/A')}

---

## PAIN SIGNAL SYNTHESIS

> *What are users screaming about?*

### Signal Summary
- **Total Signals:** {self.pain_signals.get('total', 0)}
- **Critical:** {len(self.pain_signals.get('critical', []))}
- **High:** {len(self.pain_signals.get('high', []))}
- **Medium:** {len(self.pain_signals.get('medium', []))}
- **Sources:** {', '.join(self.pain_signals.get('sources', []))}

### Critical Pain Points
{chr(10).join(f'- {signal}' for signal in self.pain_signals.get('critical', [])) if self.pain_signals.get('critical') else '- None'}

### High Priority Pain Points
{chr(10).join(f'- {signal}' for signal in self.pain_signals.get('high', [])) if self.pain_signals.get('high') else '- None'}

### Sentiment Synthesis
{self.sentiment_synthesis}

---

## COMPETITOR LANDSCAPE

| Competitor | Category | Threat Level |
|------------|----------|--------------|
{self._format_competitors_table()}

---

## GTM STRATEGY

### Target Channels
{chr(10).join(f'- {channel}' for channel in self.gtm_channels)}

### Positioning Statement
> {self.positioning}

---

*Generated by Vulture Nest Quest Engine v1.0.0*
*Quest ID: {self.quest_id}*
"""
        return md

    def _format_signals(self, signals: List[Dict]) -> str:
        if not signals:
            return "- No signals detected"
        lines = []
        for s in signals[:10]:  # Limit to 10
            source = s.get('source', 'web')
            content = s.get('content', '')[:200]
            lines.append(f"- **[{source}]** {content}")
        if len(signals) > 10:
            lines.append(f"- *...and {len(signals) - 10} more signals*")
        return chr(10).join(lines)

    def _format_delta_features(self, features: List[Dict]) -> str:
        if not features:
            return "- None defined"
        lines = []
        for f in features:
            name = f.get('name', 'Feature')
            desc = f.get('description', '')
            priority = f.get('priority', 'P2')
            lines.append(f"\n**{name}** ({priority})")
            lines.append(f"> {desc}")
        return chr(10).join(lines)

    def _format_competitors_table(self) -> str:
        if not self.competitors:
            return "| None identified | - | - |"
        lines = []
        for c in self.competitors:
            name = c.get('name', 'Unknown')
            cat = c.get('category', 'Unknown')
            threat = c.get('threat_level', 'Medium')
            lines.append(f"| {name} | {cat} | {threat} |")
        return chr(10).join(lines)


class QuestEngine:
    """
    The Vulture Nest Quest Engine.

    Generates complete Strike Quest documents through deep research synthesis.
    STANDALONE - No Factory dependencies.
    """

    def __init__(self):
        self.output_dir = QUEST_OUTPUT_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self._quest_counter = self._load_quest_counter()

    def _load_quest_counter(self) -> int:
        counter_file = self.output_dir / ".quest_counter"
        if counter_file.exists():
            return int(counter_file.read_text().strip())
        return 0

    def _save_quest_counter(self):
        counter_file = self.output_dir / ".quest_counter"
        counter_file.write_text(str(self._quest_counter))

    def _generate_quest_id(self) -> str:
        self._quest_counter += 1
        self._save_quest_counter()
        year = datetime.now().year
        return f"VN-{year}-Q{self._quest_counter:03d}"

    # =========================================================================
    # MATH CALCULATIONS
    # =========================================================================

    def calculate_z_convergence(self, signals: Dict) -> float:
        """Z-Convergence: How many independent signals confirm the pain?"""
        score = 0.0
        max_score = 5.0

        total = signals.get('total', 0)
        critical = len(signals.get('critical', []))
        sources = len(signals.get('sources', []))

        if total >= 20:
            score += 1.5
        elif total >= 10:
            score += 1.0
        elif total >= 5:
            score += 0.5

        if critical >= 5:
            score += 1.5
        elif critical >= 3:
            score += 1.0
        elif critical >= 1:
            score += 0.5

        if sources >= 4:
            score += 1.0
        elif sources >= 2:
            score += 0.5

        # Severity bonus
        ransom_sev = signals.get('ransom_severity', 5)
        friction_sev = signals.get('friction_severity', 5)
        if ransom_sev >= 8 or friction_sev >= 8:
            score += 1.0

        return min(score / max_score, 1.0)

    def calculate_z_velocity(self, stagnation_months: int, signal_count: int) -> float:
        """Z-Velocity: How recent/urgent are the pain signals?"""
        stagnation_score = min(stagnation_months / 36, 1.0)
        signal_boost = min(signal_count / 30, 0.5)
        return min((stagnation_score * 0.6) + (signal_boost * 0.4), 1.0)

    def calculate_z_scarcity(self, competitor_count: int) -> float:
        """Z-Scarcity: Is there a gap in the market?"""
        if competitor_count == 0:
            return 1.0
        elif competitor_count == 1:
            return 0.8
        elif competitor_count == 2:
            return 0.6
        elif competitor_count == 3:
            return 0.4
        else:
            return 0.1

    def calculate_rule_of_40(self, growth: float, margin: float) -> float:
        return growth + margin

    def calculate_864z_score(
        self,
        z_conv: float,
        z_vel: float,
        z_scar: float,
        rule_of_40: float
    ) -> tuple:
        """Calculate the final 864z score."""
        exit_mult = 1.5 if rule_of_40 >= RULE_OF_40_THRESHOLD else 1.0

        base_score = (
            (z_conv * WEIGHTS['z_convergence']) +
            (z_vel * WEIGHTS['z_velocity']) +
            (z_scar * WEIGHTS['z_scarcity'])
        ) * 10

        return base_score * exit_mult, exit_mult

    def calculate_tshirt_size(self, complexity: int) -> str:
        """Map complexity score to T-shirt size."""
        if complexity <= 2:
            return "XS"
        elif complexity <= 4:
            return "S"
        elif complexity <= 7:
            return "M"
        else:
            return "L"

    def calculate_tam(self, traffic: int, category: str) -> tuple:
        """Estimate TAM/SAM/SOM from traffic data."""
        # Rough heuristics based on category
        tam = traffic * 5  # Assume 5x potential market
        sam = int(tam * 0.3)  # 30% serviceable
        som = int(sam * 0.05)  # 5% obtainable in year 1
        return tam, sam, som

    def calculate_months_to_exit(
        self,
        som: int,
        price_point: float,
        conversion_rate: float = 0.02
    ) -> int:
        """Calculate months to reach exit valuation."""
        if som <= 0 or price_point <= 0:
            return 999

        paying_users = int(som * conversion_rate)
        mrr = paying_users * price_point

        if mrr <= 0:
            return 999

        # ARR needed for exit (assuming 4x multiple)
        target_arr = TARGET_EXIT_VALUATION / 4
        target_mrr = target_arr / 12

        if mrr >= target_mrr:
            return 1

        # Assume 10% monthly growth
        months = 0
        current_mrr = mrr
        while current_mrr < target_mrr and months < 120:
            current_mrr *= 1.10
            months += 1

        return months if months < 120 else 999

    # =========================================================================
    # QUEST GENERATION
    # =========================================================================

    def generate_quest(
        self,
        target_name: str,
        mode: str = "deep",
        search_results: Dict = None
    ) -> StrikeQuest:
        """
        Generate a complete Strike Quest document.

        Args:
            target_name: Name of the target product/service
            mode: "deep" for full research, "quick" for synthesis only
            search_results: Pre-fetched search results (optional)
        """
        print(f"\n{'='*70}")
        print(f"STRIKE QUEST: {target_name.upper()}")
        print(f"Mode: {mode.upper()}")
        print(f"{'='*70}")

        quest_id = self._generate_quest_id()

        # Initialize tool client if available
        tool_client = None
        try:
            from tool_wrapper import ToolClient
            tool_client = ToolClient()
            print("[QuestEngine] ToolClient initialized - live search enabled")
        except ImportError:
            print("[QuestEngine] WARNING: ToolClient not available - using provided data only")

        # Phase 1: Gather signals
        print("\n[Phase 1] THE RANSOM - Analyzing pricing pain...")
        ransom = self._analyze_ransom(target_name, tool_client)

        print("\n[Phase 2] THE FRICTION - Analyzing lock-in mechanisms...")
        friction = self._analyze_friction(target_name, tool_client)

        print("\n[Phase 3] PAIN SYNTHESIS - Aggregating signals...")
        pain_signals, sentiment = self._synthesize_pain(target_name, ransom, friction, tool_client)

        print("\n[Phase 4] COMPETITOR SCAN - Mapping landscape...")
        competitors = self._scan_competitors(target_name, tool_client)

        print("\n[Phase 5] THE MATH - Calculating 864z score...")
        math = self._calculate_math(target_name, pain_signals, ransom, friction, competitors)

        print("\n[Phase 6] BLUEPRINT - Designing rescue architecture...")
        blueprint = self._design_blueprint(target_name, pain_signals, math)

        # Assemble Quest
        quest = StrikeQuest(
            quest_id=quest_id,
            target_name=target_name,
            generated_at=datetime.now().isoformat(),
            mode=mode,
            target_category=self._infer_category(target_name),
            target_traffic=pain_signals.get('traffic_estimate', 500000),
            stagnation_months=pain_signals.get('stagnation_months', 12),
            primary_weakness=self._extract_primary_weakness(pain_signals),
            secondary_weakness=self._extract_secondary_weakness(pain_signals),
            ransom=ransom,
            friction=friction,
            math=math,
            blueprint=blueprint,
            pain_signals=pain_signals,
            sentiment_synthesis=sentiment,
            competitors=competitors,
            gtm_channels=self._suggest_gtm_channels(target_name, pain_signals),
            positioning=self._generate_positioning(target_name, math.strike_status)
        )

        # Save outputs
        self._save_quest(quest)

        print(f"\n{'='*70}")
        print("STRIKE QUEST COMPLETE")
        print(f"{'='*70}")
        print(f"\n  Quest ID:     {quest_id}")
        print(f"  Target:       {target_name}")
        print(f"  Vulture Score: {math.vulture_score:.2f}")
        print(f"  T-Shirt Size: {math.tshirt_size}")
        print(f"  Verdict:      {math.strike_status.value}")
        print(f"  Output:       {self.output_dir / f'{quest_id}.md'}")

        return quest

    def _analyze_ransom(self, target: str, tool_client) -> RansomAnalysis:
        """Analyze THE RANSOM - pricing/subscription pain."""
        signals = []
        price_range = "Unknown"
        pricing_model = "subscription"
        enterprise_wall = False
        free_limits = []
        price_history = []

        if tool_client:
            # Search for pricing information
            queries = [
                f'"{target}" pricing expensive OR overpriced',
                f'"{target}" free tier limitations',
                f'"{target}" price increase',
            ]

            for query in queries:
                try:
                    result = tool_client.google_web_search(query, max_results=5)
                    output = result.get("output", "")
                    for line in output.split('\n'):
                        line = line.strip()
                        if line and any(kw in line.lower() for kw in
                            ["pricing", "price", "cost", "expensive", "$", "per"]):
                            signals.append({"source": "web", "content": line[:300]})

                            # Extract price info
                            if "$" in line:
                                price_range = self._extract_price(line)
                            if "enterprise" in line.lower() or "contact" in line.lower():
                                enterprise_wall = True
                            if "free" in line.lower() and ("limit" in line.lower() or "only" in line.lower()):
                                free_limits.append(line[:100])
                except Exception as e:
                    print(f"    [Ransom] Search error: {e}")

        severity = min(10, len(signals) + (3 if enterprise_wall else 0))

        return RansomAnalysis(
            pricing_model=pricing_model,
            price_range=price_range,
            free_tier_exists=len(free_limits) > 0,
            free_tier_limits=free_limits[:5],
            price_increase_history=price_history,
            enterprise_wall=enterprise_wall,
            ransom_signals=signals,
            ransom_severity=severity
        )

    def _analyze_friction(self, target: str, tool_client) -> FrictionAnalysis:
        """Analyze THE FRICTION - lock-in mechanisms."""
        signals = []
        export_formats = []
        export_limits = []
        api_limits = []
        lock_mechanisms = []

        if tool_client:
            queries = [
                f'"{target}" export data OR "how to export"',
                f'"{target}" lock-in OR migration',
                f'"{target}" API limits OR restrictions',
            ]

            for query in queries:
                try:
                    result = tool_client.google_web_search(query, max_results=5)
                    output = result.get("output", "")
                    for line in output.split('\n'):
                        line = line.strip()
                        if line and any(kw in line.lower() for kw in
                            ["export", "lock", "migrate", "api", "limit"]):
                            signals.append({"source": "web", "content": line[:300]})

                            if "csv" in line.lower():
                                export_formats.append("CSV")
                            if "json" in line.lower():
                                export_formats.append("JSON")
                            if "limit" in line.lower():
                                export_limits.append(line[:100])
                except Exception as e:
                    print(f"    [Friction] Search error: {e}")

        export_formats = list(set(export_formats)) or ["Unknown"]
        portability = max(1, 10 - len(signals))
        migration = "moderate" if len(signals) < 5 else "difficult"
        severity = min(10, len(signals))

        return FrictionAnalysis(
            export_formats=export_formats,
            export_limitations=export_limits[:5],
            api_restrictions=api_limits[:5],
            data_portability_score=portability,
            lock_in_mechanisms=lock_mechanisms,
            migration_complexity=migration,
            friction_signals=signals,
            friction_severity=severity
        )

    def _synthesize_pain(self, target: str, ransom: RansomAnalysis,
                         friction: FrictionAnalysis, tool_client) -> tuple:
        """Synthesize all pain signals into structured analysis."""
        critical = []
        high = []
        medium = []
        sources = ["web"]

        if tool_client:
            # Search Reddit for pain
            try:
                result = tool_client.google_web_search(
                    f'site:reddit.com "{target}" frustrating OR broken OR slow',
                    max_results=5
                )
                output = result.get("output", "")
                for line in output.split('\n'):
                    if line.strip():
                        if any(kw in line.lower() for kw in ["broken", "crash", "lost data"]):
                            critical.append(line[:150])
                        elif any(kw in line.lower() for kw in ["frustrating", "slow", "annoying"]):
                            high.append(line[:150])
                        else:
                            medium.append(line[:150])
                sources.append("reddit")
            except:
                pass

            # G2 reviews
            try:
                result = tool_client.google_web_search(
                    f'site:g2.com "{target}" cons OR negative',
                    max_results=5
                )
                output = result.get("output", "")
                for line in output.split('\n'):
                    if line.strip() and "cons" in line.lower():
                        high.append(line[:150])
                sources.append("g2")
            except:
                pass

        # Add ransom and friction signals
        for s in ransom.ransom_signals[:3]:
            high.append(s.get('content', '')[:100])
        for s in friction.friction_signals[:3]:
            high.append(s.get('content', '')[:100])

        total = len(critical) + len(high) + len(medium)

        pain_signals = {
            "total": total,
            "critical": critical[:5],
            "high": high[:10],
            "medium": medium[:10],
            "sources": list(set(sources)),
            "traffic_estimate": 500000,
            "stagnation_months": 18,
            "ransom_severity": ransom.ransom_severity,
            "friction_severity": friction.friction_severity
        }

        # Generate sentiment synthesis
        sentiment = f"Analysis of {total} pain signals across {len(sources)} sources indicates "
        if total >= 15:
            sentiment += "significant user frustration with active migration discussions."
        elif total >= 8:
            sentiment += "moderate user dissatisfaction with documented workarounds."
        else:
            sentiment += "limited public complaints, suggesting either niche usage or adequate satisfaction."

        if ransom.ransom_severity >= LAMENT_THRESHOLD:
            sentiment += f" Pricing concerns are prominent (severity {ransom.ransom_severity}/10)."
        if friction.friction_severity >= LAMENT_THRESHOLD:
            sentiment += f" Export/lock-in friction is significant (severity {friction.friction_severity}/10)."

        return pain_signals, sentiment

    def _scan_competitors(self, target: str, tool_client) -> List[Dict]:
        """Scan competitor landscape."""
        competitors = []

        if tool_client:
            try:
                result = tool_client.google_web_search(
                    f'"{target}" alternatives 2026 OR "better than {target}"',
                    max_results=10
                )
                output = result.get("output", "")

                # Extract competitor names
                seen = set()
                for line in output.split('\n'):
                    if '**' in line:
                        try:
                            name = line.split('**')[1].strip()
                            if (name.lower() != target.lower() and
                                len(name) > 2 and len(name.split()) <= 3 and
                                name not in seen):
                                seen.add(name)
                                competitors.append({
                                    "name": name,
                                    "category": "direct",
                                    "threat_level": "Medium"
                                })
                        except:
                            pass
            except:
                pass

        return competitors[:5]

    def _calculate_math(self, target: str, pain_signals: Dict,
                        ransom: RansomAnalysis, friction: FrictionAnalysis,
                        competitors: List) -> MathOfTheKill:
        """Calculate THE MATH OF THE KILL."""
        # Z-factors
        z_conv = self.calculate_z_convergence(pain_signals)
        z_vel = self.calculate_z_velocity(
            pain_signals.get('stagnation_months', 12),
            pain_signals.get('total', 0)
        )
        z_scar = self.calculate_z_scarcity(len(competitors))

        # Projections (conservative)
        growth = 25.0
        margin = 85.0
        rule_of_40 = self.calculate_rule_of_40(growth, margin)

        # 864z Score
        vulture_score, exit_mult = self.calculate_864z_score(z_conv, z_vel, z_scar, rule_of_40)

        # TAM/SAM/SOM
        traffic = pain_signals.get('traffic_estimate', 500000)
        tam, sam, som = self.calculate_tam(traffic, self._infer_category(target))

        # MMR projections
        price_point = 9.0
        target_mrr = som * 0.02 * price_point
        months_to_exit = self.calculate_months_to_exit(som, price_point)

        # T-Shirt sizing
        complexity = min(10, 5 + len(competitors))  # Base + competitor pressure
        tshirt = self.calculate_tshirt_size(complexity)
        build_hours = TSHIRT_SIZES.get(tshirt, {}).get("hours", 336)

        # Strike decision - Three-state system (STRIKE / HANGAR / REJECT)
        # STRIKE: score >= 8.64 AND tshirt != "L" AND competitors <= 3
        # HANGAR: (7.0 <= score < 8.64) OR (score >= 8.64 AND tshirt == "L")
        # REJECT: score < 7.0

        rationale = []

        if vulture_score >= SCORE_THRESHOLD:
            if tshirt != "L" and len(competitors) <= SCARCITY_THRESHOLD:
                strike_status = StrikeStatus.STRIKE
                strike_qualified = True
                rationale.append(f"STRIKE: 864z score {vulture_score:.2f} exceeds {SCORE_THRESHOLD} threshold")
            else:
                # High score but L-size or too many competitors -> HANGAR
                strike_status = StrikeStatus.HANGAR
                strike_qualified = False
                rationale.append(f"HANGAR: 864z score {vulture_score:.2f} qualifies but blocked by constraints")
                if tshirt == "L":
                    rationale.append("L-size veto: High-scoring project shelved due to complexity")
                if len(competitors) > SCARCITY_THRESHOLD:
                    rationale.append(f"Scarcity veto: {len(competitors)} competitors exceeds limit of {SCARCITY_THRESHOLD}")
        elif vulture_score >= LAMENT_THRESHOLD:
            # Near-threshold: 7.0 <= score < 8.64 -> HANGAR
            strike_status = StrikeStatus.HANGAR
            strike_qualified = False
            rationale.append(f"HANGAR: 864z score {vulture_score:.2f} near-threshold ({LAMENT_THRESHOLD}-{SCORE_THRESHOLD})")
            rationale.append("Re-validate when new pain signals emerge")
        else:
            # Below 7.0 -> REJECT
            strike_status = StrikeStatus.REJECT
            strike_qualified = False
            rationale.append(f"REJECT: 864z score {vulture_score:.2f} below minimum threshold {LAMENT_THRESHOLD}")

        if rule_of_40 >= RULE_OF_40_THRESHOLD:
            rationale.append(f"Rule of 40 ({rule_of_40}%) qualifies for 1.5x exit multiplier")

        return MathOfTheKill(
            z_convergence=z_conv,
            z_velocity=z_vel,
            z_scarcity=z_scar,
            vulture_score=round(vulture_score, 2),
            growth_projection=growth,
            margin_projection=margin,
            rule_of_40=rule_of_40,
            exit_multiplier=exit_mult,
            tam_estimate=tam,
            sam_estimate=sam,
            som_estimate=som,
            target_mrr=target_mrr,
            months_to_exit=months_to_exit,
            exit_valuation=TARGET_EXIT_VALUATION,
            price_point=price_point,
            tshirt_size=tshirt,
            complexity_score=complexity,
            build_hours_estimate=build_hours,
            strike_qualified=strike_qualified,
            strike_status=strike_status,
            kill_rationale=" | ".join(rationale)
        )

    def _design_blueprint(self, target: str, pain_signals: Dict,
                          math: MathOfTheKill) -> TechnicalBlueprint:
        """Design THE TECHNICAL RESCUE BLUEPRINT."""
        # Generate codename
        codename = f"{target}Rescue"

        # Infer architecture
        arch = "chrome_extension_mv3"

        # Extract rescue capabilities from pain
        capabilities = [
            f"Import from {target} (full data migration)",
            "Local-first storage (no cloud required)",
            "Export to multiple formats (JSON, CSV, Markdown)",
            "Zero-knowledge architecture"
        ]

        # Delta features
        delta = [
            {
                "name": "One-Click Migration",
                "description": f"Guided import wizard for {target} refugees",
                "priority": "P0"
            },
            {
                "name": "Offline-First",
                "description": "Works without internet, syncs optionally",
                "priority": "P0"
            },
            {
                "name": "Data Portability",
                "description": "Export your data anytime, no restrictions",
                "priority": "P1"
            }
        ]

        return TechnicalBlueprint(
            product_codename=codename,
            tagline=f"The local-first {target} alternative that respects your data.",
            architecture_type=arch,
            offline_first=True,
            cloud_dependency="none",
            storage_strategy="IndexedDB",
            rescue_capabilities=capabilities,
            delta_features=delta,
            required_technologies=["Chrome Extension MV3", "IndexedDB", "Service Worker"],
            integration_points=[f"{target} export format", "Chrome Storage API"],
            primary_metric={
                "name": "Successful Migrations",
                "description": f"Users who completed {target} data import",
                "target": "1000 in 30 days"
            },
            secondary_metric={
                "name": "Retention Rate",
                "description": "Users active after 7 days",
                "target": "70%"
            }
        )

    def _infer_category(self, target: str) -> str:
        return "micro-saas"

    def _extract_primary_weakness(self, signals: Dict) -> str:
        critical = signals.get('critical', [])
        if critical:
            return critical[0][:100]
        return "Pricing and lock-in concerns"

    def _extract_secondary_weakness(self, signals: Dict) -> str:
        high = signals.get('high', [])
        if high:
            return high[0][:100]
        return "User experience friction"

    def _extract_price(self, text: str) -> str:
        import re
        match = re.search(r'\$[\d,]+(?:\.\d{2})?(?:/(?:mo|month|year|yr))?', text, re.I)
        if match:
            return match.group(0)
        return "Unknown"

    def _suggest_gtm_channels(self, target: str, signals: Dict) -> List[str]:
        return [
            f"r/{target.lower().replace(' ', '')}",
            "r/selfhosted",
            "Indie Hackers",
            "Hacker News (Show HN)",
            "Product Hunt"
        ]

    def _generate_positioning(self, target: str, strike_status: StrikeStatus) -> str:
        if strike_status == StrikeStatus.STRIKE:
            return f"The local-first {target} alternative that puts your data first. No subscriptions, no cloud lock-in, no ransom."
        elif strike_status == StrikeStatus.HANGAR:
            return f"A near-qualified alternative to {target}. Shelved pending new pain signals or resource availability."
        else:  # REJECT
            return f"Insufficient signals to justify building a {target} alternative at this time."

    def _save_quest(self, quest: StrikeQuest):
        """Save quest to JSON and Markdown files."""
        # JSON output
        json_path = self.output_dir / f"{quest.quest_id}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            f.write(quest.to_json())

        # Markdown output
        md_path = self.output_dir / f"{quest.quest_id}.md"
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(quest.to_markdown())

        print(f"\n    Saved: {json_path}")
        print(f"    Saved: {md_path}")


# =============================================================================
# CLI ENTRY POINT
# =============================================================================
def main():
    parser = argparse.ArgumentParser(
        description="Vulture Nest Quest Engine - Standalone Research System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python quest_engine.py --target "Knak" --mode deep
  python quest_engine.py --target "Calendly" --mode quick
  python quest_engine.py --list-quests
        """
    )

    parser.add_argument(
        "--target", "-t",
        type=str,
        help="Target product/service to research"
    )

    parser.add_argument(
        "--mode", "-m",
        type=str,
        choices=["deep", "quick"],
        default="deep",
        help="Research mode: 'deep' for full analysis, 'quick' for rapid synthesis"
    )

    parser.add_argument(
        "--list-quests",
        action="store_true",
        help="List all generated quests"
    )

    args = parser.parse_args()

    engine = QuestEngine()

    if args.list_quests:
        print("\n" + "="*60)
        print("GENERATED STRIKE QUESTS")
        print("="*60)

        quests = list(QUEST_OUTPUT_DIR.glob("*.json"))
        if not quests:
            print("\n  No quests generated yet.")
        else:
            for q in sorted(quests):
                with open(q) as f:
                    data = json.load(f)
                    print(f"\n  {data['quest_id']}: {data['target_name']}")
                    print(f"    Score: {data['math']['vulture_score']}")
                    print(f"    Verdict: {data['math']['strike_status']}")
        print()
        return

    if not args.target:
        print("ERROR: --target is required")
        print("Usage: python quest_engine.py --target 'Knak' --mode deep")
        sys.exit(1)

    quest = engine.generate_quest(args.target, args.mode)
    # Exit codes: 0 = STRIKE, 1 = HANGAR, 2 = REJECT
    if quest.math.strike_status == StrikeStatus.STRIKE:
        sys.exit(0)
    elif quest.math.strike_status == StrikeStatus.HANGAR:
        sys.exit(1)
    else:
        sys.exit(2)


if __name__ == "__main__":
    main()
