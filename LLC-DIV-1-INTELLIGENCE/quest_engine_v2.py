#!/usr/bin/env python3
"""
Quest Engine V2 - Enhanced Social Signal Scoring System

The sovereign research engine for 864zeros strike qualification.
V2 features:
- Multi-platform scraping (Twitter, Reddit, HN, G2, Capterra)
- Engagement-weighted signal scoring
- Velocity spike detection
- Migration intent tracking
- Crisis event detection

From Enhanced Scoring Spec V2.

Usage:
    python quest_engine_v2.py --target "Instapaper" --mode deep
    python quest_engine_v2.py --target "1Password" --mode quick
    python quest_engine_v2.py --list-quests
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import List, Dict, Optional, Tuple
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers import ScraperManager, Signal, Platform
from enrichment import EnrichmentPipeline


# ============================================================================
# CONSTANTS
# ============================================================================

class StrikeStatus(Enum):
    """Quest verdict status."""
    STRIKE = "STRIKE"
    HANGAR = "HANGAR"
    REJECT = "REJECT"


class TShirtSize(Enum):
    """Build complexity sizing."""
    XS = "XS"  # < 24 hours
    S = "S"    # 2-4 days
    M = "M"    # 1-2 weeks
    L = "L"    # 1+ month (AVOID)


# Scoring thresholds
SCORE_THRESHOLD = 8.64
HANGAR_THRESHOLD = 7.0
RULE_OF_40_THRESHOLD = 40

# V2 Weights (from Enhanced Scoring Spec V2)
WEIGHTS_V2 = {
    "z_convergence": 0.35,
    "z_velocity": 0.25,
    "z_scarcity": 0.15,
    "z_migration": 0.25,
}

# Platform authority multipliers
PLATFORM_AUTHORITY = {
    Platform.HACKER_NEWS: 1.5,
    Platform.TWITTER: 1.2,
    Platform.REDDIT: 1.0,
    Platform.G2: 1.3,
    Platform.CAPTERRA: 1.1,
    Platform.PRODUCT_HUNT: 1.0,
    Platform.LINKEDIN: 0.8,
    Platform.TRUSTPILOT: 0.7,
}

# Severity weights
SEVERITY_WEIGHTS = {
    "critical": 5.0,
    "high": 3.0,
    "medium": 1.5,
    "low": 1.0,
    "noise": 0.0,
}


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class Competitor:
    """Competitor information for scarcity calculation."""
    name: str
    funding: str = "unknown"  # seed, series_a, series_b, series_c, public, bootstrapped, dead
    last_update_months: int = 12
    positioning: str = "direct"  # direct, adjacent, tangential


@dataclass
class QuestScores:
    """Z-factor scores."""
    z_convergence: float = 0.0
    z_velocity: float = 0.0
    z_scarcity: float = 0.0
    z_migration: float = 0.0

    base_score: float = 0.0
    exit_multiplier: float = 1.0
    crisis_multiplier: float = 1.0
    vulture_score: float = 0.0

    effective_threshold: float = SCORE_THRESHOLD


@dataclass
class QuestVerdict:
    """Final quest verdict."""
    status: StrikeStatus
    confidence: float
    rationale: List[str]
    tshirt_size: TShirtSize


@dataclass
class QuestReport:
    """Complete quest report."""
    quest_id: str
    version: str = "2.0.0"
    target_name: str = ""
    generated_at: str = ""

    # Signal summary
    total_signals: int = 0
    total_weighted: float = 0.0
    by_platform: Dict = field(default_factory=dict)
    by_severity: Dict = field(default_factory=dict)

    # Enrichment results
    velocity: Dict = field(default_factory=dict)
    migration: Dict = field(default_factory=dict)
    crisis: Dict = field(default_factory=dict)

    # Scores
    scores: QuestScores = field(default_factory=QuestScores)

    # Verdict
    verdict: Optional[QuestVerdict] = None

    # Top signals
    top_signals: List[Dict] = field(default_factory=list)

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON export."""
        result = {
            "quest_id": self.quest_id,
            "version": self.version,
            "target_name": self.target_name,
            "generated_at": self.generated_at,
            "signals": {
                "total_raw": self.total_signals,
                "total_weighted": round(self.total_weighted, 2),
                "by_platform": self.by_platform,
                "by_severity": self.by_severity,
            },
            "velocity": self.velocity,
            "migration": self.migration,
            "crisis": self.crisis,
            "scores": {
                "z_convergence": round(self.scores.z_convergence, 3),
                "z_velocity": round(self.scores.z_velocity, 3),
                "z_scarcity": round(self.scores.z_scarcity, 3),
                "z_migration": round(self.scores.z_migration, 3),
                "base_score": round(self.scores.base_score, 3),
                "exit_multiplier": self.scores.exit_multiplier,
                "crisis_multiplier": round(self.scores.crisis_multiplier, 2),
                "vulture_score": round(self.scores.vulture_score, 2),
                "effective_threshold": self.scores.effective_threshold,
            },
            "verdict": {
                "status": self.verdict.status.value if self.verdict else "UNKNOWN",
                "confidence": round(self.verdict.confidence, 2) if self.verdict else 0,
                "rationale": self.verdict.rationale if self.verdict else [],
                "tshirt_size": self.verdict.tshirt_size.value if self.verdict else "M",
            },
            "top_signals": self.top_signals[:10],
        }
        return result


# ============================================================================
# QUEST ENGINE V2
# ============================================================================

class QuestEngineV2:
    """
    Quest Engine V2 - Enhanced social signal scoring.

    The sovereign research engine that:
    1. Scrapes multi-platform signals
    2. Enriches with engagement/authority/velocity
    3. Calculates Z-factors
    4. Produces strike verdicts
    """

    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize Quest Engine V2.

        Args:
            config: Optional configuration overrides
        """
        self.config = config or {}

        # Initialize components
        self.scraper_manager = ScraperManager()
        self.enrichment = EnrichmentPipeline()

        # Quest counter
        self.quest_counter_path = Path(__file__).parent / "OFFICE" / "DIV-1-VULTURE" / "quests" / ".quest_counter"

    def run_quest(
        self,
        target: str,
        mode: str = "deep",
        competitors: Optional[List[Competitor]] = None,
        rule_of_40: float = 0.0,
    ) -> QuestReport:
        """
        Run a complete quest on a target.

        Args:
            target: Target SaaS product name
            mode: "quick" (Google fallback) or "deep" (full API scraping)
            competitors: List of competitor info for scarcity
            rule_of_40: Rule of 40 metric if known

        Returns:
            QuestReport with full analysis
        """
        print(f"\n{'='*60}")
        print(f"QUEST ENGINE V2 - Target: {target}")
        print(f"Mode: {mode.upper()}")
        print(f"{'='*60}\n")

        # Generate quest ID
        quest_id = self._get_next_quest_id()

        # Phase 1: Scrape signals
        print("[Phase 1/5] Scraping signals...")
        use_google = (mode == "quick")
        raw_signals = self.scraper_manager.scrape_all(target, use_google_fallback=use_google)
        print(f"  → Found {len(raw_signals)} raw signals")

        if not raw_signals:
            print("  ⚠ No signals found - returning empty report")
            return self._empty_report(quest_id, target)

        # Phase 2: Enrich signals
        print("[Phase 2/5] Enriching signals...")
        enriched_signals = self.enrichment.enrich(raw_signals)
        enrichment_report = self.enrichment.analyze(enriched_signals)
        print(f"  → Enriched {len(enriched_signals)} signals")

        # Phase 3: Calculate Z-factors
        print("[Phase 3/5] Calculating Z-factors...")
        scores = self._calculate_scores(
            enriched_signals,
            enrichment_report,
            competitors or [],
            rule_of_40,
        )
        print(f"  → Z-Convergence: {scores.z_convergence:.3f}")
        print(f"  → Z-Velocity: {scores.z_velocity:.3f}")
        print(f"  → Z-Scarcity: {scores.z_scarcity:.3f}")
        print(f"  → Z-Migration: {scores.z_migration:.3f}")
        print(f"  → Vulture Score: {scores.vulture_score:.2f}")

        # Phase 4: Determine verdict
        print("[Phase 4/5] Determining verdict...")
        tshirt = self._estimate_tshirt_size(target, enriched_signals)
        verdict = self._determine_verdict(scores, tshirt, competitors or [])
        print(f"  → Verdict: {verdict.status.value}")
        print(f"  → Confidence: {verdict.confidence:.0%}")
        print(f"  → T-Shirt Size: {verdict.tshirt_size.value}")

        # Phase 5: Generate report
        print("[Phase 5/5] Generating report...")
        report = self._build_report(
            quest_id,
            target,
            enriched_signals,
            enrichment_report,
            scores,
            verdict,
        )

        # Save report
        self._save_report(report)

        print(f"\n{'='*60}")
        print(f"QUEST COMPLETE: {quest_id}")
        print(f"Verdict: {verdict.status.value} | Score: {scores.vulture_score:.2f}")
        print(f"{'='*60}\n")

        return report

    def _calculate_scores(
        self,
        signals: List[Signal],
        enrichment_report,
        competitors: List[Competitor],
        rule_of_40: float,
    ) -> QuestScores:
        """Calculate all Z-factor scores."""
        scores = QuestScores()

        # Z-Convergence: Engagement-weighted signal strength
        scores.z_convergence = self._calculate_z_convergence(signals)

        # Z-Velocity: From enrichment pipeline
        scores.z_velocity = enrichment_report.z_velocity

        # Z-Scarcity: Competitor threat analysis
        scores.z_scarcity = self._calculate_z_scarcity(competitors)

        # Z-Migration: From enrichment pipeline
        scores.z_migration = enrichment_report.z_migration

        # Base score (0-10 scale)
        scores.base_score = (
            (scores.z_convergence * WEIGHTS_V2["z_convergence"]) +
            (scores.z_velocity * WEIGHTS_V2["z_velocity"]) +
            (scores.z_scarcity * WEIGHTS_V2["z_scarcity"]) +
            (scores.z_migration * WEIGHTS_V2["z_migration"])
        ) * 10

        # Exit multiplier (Rule of 40)
        scores.exit_multiplier = 1.5 if rule_of_40 >= RULE_OF_40_THRESHOLD else 1.0

        # Crisis multiplier
        crisis_data = enrichment_report.crisis
        if crisis_data.get("z_crisis", 0) >= 0.5:
            scores.crisis_multiplier = 1.3
        elif crisis_data.get("z_crisis", 0) >= 0.3:
            scores.crisis_multiplier = 1.15
        else:
            scores.crisis_multiplier = 1.0

        # Final Vulture Score
        scores.vulture_score = scores.base_score * scores.exit_multiplier * scores.crisis_multiplier

        # Effective threshold (lowered by high migration)
        if scores.z_migration >= 0.7:
            scores.effective_threshold = 7.5
        elif scores.z_migration >= 0.5:
            scores.effective_threshold = 8.0
        else:
            scores.effective_threshold = SCORE_THRESHOLD

        return scores

    def _calculate_z_convergence(self, signals: List[Signal]) -> float:
        """
        Calculate Z-Convergence: Engagement-weighted, authority-aware.

        From Enhanced Scoring Spec V2.
        """
        if not signals:
            return 0.0

        total_weighted_strength = 0.0
        platforms_seen = set()
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}

        for signal in signals:
            # Base weight from severity
            severity = signal.severity.value if signal.severity else "low"
            severity_weight = SEVERITY_WEIGHTS.get(severity, 1.0)
            severity_counts[severity] = severity_counts.get(severity, 0) + 1

            # Engagement multiplier
            engagement_mult = signal.engagement_multiplier or 1.0

            # Authority multiplier
            authority_mult = signal.author_authority or 1.0

            # Platform authority
            platform_mult = PLATFORM_AUTHORITY.get(signal.platform, 0.8)
            platforms_seen.add(signal.platform)

            # Combined weight
            signal_weight = severity_weight * engagement_mult * authority_mult * platform_mult
            total_weighted_strength += signal_weight

        # Normalize to 0-1 scale (expect ~500 weighted points for strong target)
        normalized = min(total_weighted_strength / 500, 1.0)

        # Platform diversity bonus (max 0.15)
        diversity_bonus = min(len(platforms_seen) * 0.03, 0.15)

        # Critical signal bonus (max 0.15)
        critical_bonus = min(severity_counts.get("critical", 0) * 0.03, 0.15)

        # High signal bonus (max 0.10)
        high_bonus = min(severity_counts.get("high", 0) * 0.01, 0.10)

        return min(normalized + diversity_bonus + critical_bonus + high_bonus, 1.0)

    def _calculate_z_scarcity(self, competitors: List[Competitor]) -> float:
        """
        Calculate Z-Scarcity: Weighted by competitor threat.

        No competitors = maximum opportunity.
        Well-funded competitors = lower opportunity.
        """
        if not competitors:
            return 1.0  # No competitors = maximum opportunity

        total_threat = 0.0

        for comp in competitors:
            threat = 1.0  # Base threat

            # Funding status
            funding_mult = {
                "series_c": 3.0, "series_d": 3.0, "public": 3.0,
                "series_a": 2.0, "series_b": 2.0,
                "seed": 1.2, "angel": 1.2,
                "bootstrapped": 1.0,
                "dead": 0.1,
            }
            threat *= funding_mult.get(comp.funding, 1.0)

            # Recency
            if comp.last_update_months <= 3:
                threat *= 1.5
            elif comp.last_update_months <= 6:
                threat *= 1.2
            elif comp.last_update_months <= 12:
                threat *= 1.0
            else:
                threat *= 0.5

            # Market positioning
            position_mult = {"direct": 1.5, "adjacent": 1.0, "tangential": 0.5}
            threat *= position_mult.get(comp.positioning, 1.0)

            total_threat += threat

        # Convert threat to scarcity (inverse)
        scarcity = max(0.1, 1.0 - (total_threat / 15))

        return scarcity

    def _estimate_tshirt_size(self, target: str, signals: List[Signal]) -> TShirtSize:
        """
        Estimate build complexity based on signal analysis.

        This is a heuristic - real sizing requires manual review.
        """
        # Look for complexity indicators in signals
        complexity_keywords = {
            "enterprise": 2,
            "api": 1,
            "integration": 1,
            "complex": 2,
            "security": 1,
            "compliance": 2,
            "encryption": 1,
            "sync": 1,
        }

        complexity_score = 0
        for signal in signals[:50]:  # Sample first 50
            content_lower = signal.content.lower()
            for keyword, weight in complexity_keywords.items():
                if keyword in content_lower:
                    complexity_score += weight

        # Determine size based on complexity
        if complexity_score <= 5:
            return TShirtSize.XS
        elif complexity_score <= 15:
            return TShirtSize.S
        elif complexity_score <= 30:
            return TShirtSize.M
        else:
            return TShirtSize.L

    def _determine_verdict(
        self,
        scores: QuestScores,
        tshirt: TShirtSize,
        competitors: List[Competitor],
    ) -> QuestVerdict:
        """
        Determine final verdict based on scores and constraints.
        """
        rationale = []

        # Check for crisis + migration override
        has_crisis = scores.crisis_multiplier > 1.0
        high_migration = scores.z_migration >= 0.5

        if has_crisis and high_migration and scores.vulture_score >= 7.0:
            rationale.append(f"Crisis event active with {scores.crisis_multiplier:.1f}x multiplier")
            rationale.append(f"High migration intent ({scores.z_migration:.2f})")
            rationale.append(f"Score {scores.vulture_score:.2f} >= 7.0 threshold")

            if tshirt == TShirtSize.L:
                return QuestVerdict(
                    status=StrikeStatus.HANGAR,
                    confidence=0.75,
                    rationale=rationale + ["L-size build exceeds capacity - HANGAR"],
                    tshirt_size=tshirt,
                )

            return QuestVerdict(
                status=StrikeStatus.STRIKE,
                confidence=0.85,
                rationale=rationale,
                tshirt_size=tshirt,
            )

        # Standard verdict logic
        if scores.vulture_score >= scores.effective_threshold:
            rationale.append(f"Vulture Score {scores.vulture_score:.2f} >= threshold {scores.effective_threshold}")

            # L-size veto
            if tshirt == TShirtSize.L:
                rationale.append("L-size build exceeds capacity - HANGAR")
                return QuestVerdict(
                    status=StrikeStatus.HANGAR,
                    confidence=0.70,
                    rationale=rationale,
                    tshirt_size=tshirt,
                )

            # Competitor threat check
            competitor_threat = sum(1 for c in competitors if c.funding in ["series_c", "series_d", "public"])
            if competitor_threat >= 3:
                rationale.append(f"{competitor_threat} well-funded competitors - high risk")
                return QuestVerdict(
                    status=StrikeStatus.HANGAR,
                    confidence=0.65,
                    rationale=rationale,
                    tshirt_size=tshirt,
                )

            # STRIKE qualified
            confidence = min(0.95, 0.70 + scores.z_migration * 0.15 + scores.z_convergence * 0.10)
            return QuestVerdict(
                status=StrikeStatus.STRIKE,
                confidence=confidence,
                rationale=rationale,
                tshirt_size=tshirt,
            )

        elif scores.vulture_score >= HANGAR_THRESHOLD:
            rationale.append(f"Vulture Score {scores.vulture_score:.2f} in HANGAR range (7.0-{scores.effective_threshold})")
            return QuestVerdict(
                status=StrikeStatus.HANGAR,
                confidence=0.60,
                rationale=rationale,
                tshirt_size=tshirt,
            )

        else:
            rationale.append(f"Vulture Score {scores.vulture_score:.2f} below threshold 7.0")
            return QuestVerdict(
                status=StrikeStatus.REJECT,
                confidence=0.80,
                rationale=rationale,
                tshirt_size=tshirt,
            )

    def _build_report(
        self,
        quest_id: str,
        target: str,
        signals: List[Signal],
        enrichment_report,
        scores: QuestScores,
        verdict: QuestVerdict,
    ) -> QuestReport:
        """Build complete quest report."""

        # Count by platform
        by_platform = {}
        for signal in signals:
            platform_name = signal.platform.value
            if platform_name not in by_platform:
                by_platform[platform_name] = {"count": 0, "weighted": 0.0}
            by_platform[platform_name]["count"] += 1
            by_platform[platform_name]["weighted"] += signal.combined_weight or 0

        # Count by severity
        by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for signal in signals:
            severity = signal.severity.value if signal.severity else "low"
            by_severity[severity] = by_severity.get(severity, 0) + 1

        # Total weighted
        total_weighted = sum(s.combined_weight or 0 for s in signals)

        # Top signals
        sorted_signals = sorted(signals, key=lambda s: s.combined_weight or 0, reverse=True)
        top_signals = []
        for s in sorted_signals[:10]:
            top_signals.append({
                "platform": s.platform.value,
                "content_preview": s.content[:150] + "..." if len(s.content) > 150 else s.content,
                "url": s.url,
                "weight": round(s.combined_weight or 0, 2),
                "engagement_mult": round(s.engagement_multiplier or 0, 2),
                "is_migration": s.is_migration_intent,
                "crisis_type": s.crisis_type,
            })

        return QuestReport(
            quest_id=quest_id,
            target_name=target,
            generated_at=datetime.now(timezone.utc).isoformat(),
            total_signals=len(signals),
            total_weighted=total_weighted,
            by_platform=by_platform,
            by_severity=by_severity,
            velocity=enrichment_report.velocity,
            migration=enrichment_report.migration,
            crisis=enrichment_report.crisis,
            scores=scores,
            verdict=verdict,
            top_signals=top_signals,
        )

    def _get_next_quest_id(self) -> str:
        """Get next quest ID from counter."""
        try:
            if self.quest_counter_path.exists():
                counter = int(self.quest_counter_path.read_text().strip())
            else:
                counter = 0

            counter += 1

            # Ensure directory exists
            self.quest_counter_path.parent.mkdir(parents=True, exist_ok=True)
            self.quest_counter_path.write_text(str(counter))

            return f"VN-2026-Q{counter:03d}"
        except Exception:
            return f"VN-2026-Q{datetime.now().strftime('%H%M%S')}"

    def _save_report(self, report: QuestReport) -> None:
        """Save quest report to file."""
        try:
            quests_dir = Path(__file__).parent / "OFFICE" / "DIV-1-VULTURE" / "quests"
            quests_dir.mkdir(parents=True, exist_ok=True)

            # Save JSON
            json_path = quests_dir / f"{report.quest_id}.json"
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(report.to_dict(), f, indent=2)

            # Save Markdown summary
            md_path = quests_dir / f"{report.quest_id}.md"
            md_content = self._generate_markdown(report)
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(md_content)

            print(f"  → Saved: {json_path}")
            print(f"  → Saved: {md_path}")

        except Exception as e:
            print(f"  ⚠ Failed to save report: {e}")

    def _generate_markdown(self, report: QuestReport) -> str:
        """Generate markdown summary of quest."""
        v = report.verdict
        s = report.scores

        md = f"""# {report.quest_id}: {report.target_name}

**Generated:** {report.generated_at}
**Version:** {report.version}

---

## VERDICT: {v.status.value if v else 'UNKNOWN'}

| Metric | Value |
|--------|-------|
| Vulture Score | **{s.vulture_score:.2f}** |
| Confidence | {v.confidence:.0%} if v else 'N/A' |
| T-Shirt Size | {v.tshirt_size.value if v else 'M'} |
| Effective Threshold | {s.effective_threshold} |

### Rationale
{chr(10).join(f"- {r}" for r in (v.rationale if v else []))}

---

## Z-FACTOR SCORES

| Factor | Score | Weight | Contribution |
|--------|-------|--------|--------------|
| Z-Convergence | {s.z_convergence:.3f} | 35% | {s.z_convergence * 0.35:.3f} |
| Z-Velocity | {s.z_velocity:.3f} | 25% | {s.z_velocity * 0.25:.3f} |
| Z-Scarcity | {s.z_scarcity:.3f} | 15% | {s.z_scarcity * 0.15:.3f} |
| Z-Migration | {s.z_migration:.3f} | 25% | {s.z_migration * 0.25:.3f} |

**Base Score:** {s.base_score:.3f}
**Exit Multiplier:** {s.exit_multiplier}x
**Crisis Multiplier:** {s.crisis_multiplier:.2f}x
**Final Score:** {s.vulture_score:.2f}

---

## SIGNAL SUMMARY

| Metric | Value |
|--------|-------|
| Total Signals | {report.total_signals} |
| Weighted Total | {report.total_weighted:.2f} |

### By Platform
"""
        for platform, data in report.by_platform.items():
            md += f"- **{platform}**: {data['count']} signals ({data['weighted']:.1f} weighted)\n"

        md += """
### By Severity
"""
        for severity, count in report.by_severity.items():
            md += f"- **{severity}**: {count}\n"

        md += f"""
---

## VELOCITY

- **24h Count:** {report.velocity.get('count_24h', 0)}
- **7d Count:** {report.velocity.get('count_7d', 0)}
- **30d Count:** {report.velocity.get('count_30d', 0)}
- **Is Spiking:** {'Yes' if report.velocity.get('is_spiking', False) else 'No'}
- **Spike Severity:** {report.velocity.get('spike_severity', 0):.2f}x

---

## MIGRATION INTENT

- **Migration Signals:** {report.migration.get('migration_signals', 0)}
- **Migration Rate:** {report.migration.get('migration_rate', 0):.1%}
- **Z-Migration:** {report.migration.get('z_migration', 0):.3f}

---

## CRISIS DETECTION

- **Crisis Signals:** {report.crisis.get('crisis_signals', 0)}
- **Primary Crisis:** {report.crisis.get('primary_crisis', 'None')}
- **Z-Crisis:** {report.crisis.get('z_crisis', 0):.3f}

---

## TOP SIGNALS

"""
        for i, sig in enumerate(report.top_signals[:5], 1):
            md += f"""### {i}. [{sig['platform']}] (Weight: {sig['weight']})
> {sig['content_preview']}

- URL: {sig.get('url', 'N/A')}
- Migration Intent: {'Yes' if sig.get('is_migration') else 'No'}
- Crisis Type: {sig.get('crisis_type', 'None')}

"""

        md += """---

*Generated by Quest Engine V2*
"""
        return md

    def _empty_report(self, quest_id: str, target: str) -> QuestReport:
        """Return empty report when no signals found."""
        return QuestReport(
            quest_id=quest_id,
            target_name=target,
            generated_at=datetime.now(timezone.utc).isoformat(),
            verdict=QuestVerdict(
                status=StrikeStatus.REJECT,
                confidence=1.0,
                rationale=["No signals found - insufficient data"],
                tshirt_size=TShirtSize.M,
            ),
        )


# ============================================================================
# CLI
# ============================================================================

def list_quests():
    """List all quest reports."""
    quests_dir = Path(__file__).parent / "OFFICE" / "DIV-1-VULTURE" / "quests"

    if not quests_dir.exists():
        print("No quests found.")
        return

    print("\nEXISTING QUESTS:")
    print("="*60)

    json_files = sorted(quests_dir.glob("VN-*.json"))

    for json_file in json_files:
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            quest_id = data.get("quest_id", "Unknown")
            target = data.get("target_name", "Unknown")
            verdict = data.get("verdict", {}).get("status", "Unknown")
            score = data.get("scores", {}).get("vulture_score", 0)

            print(f"  {quest_id}: {target}")
            print(f"    Verdict: {verdict} | Score: {score:.2f}")
            print()

        except Exception as e:
            print(f"  {json_file.name}: Error reading - {e}")

    print("="*60)


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Quest Engine V2 - Enhanced Social Signal Scoring",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python quest_engine_v2.py --target "Instapaper" --mode deep
    python quest_engine_v2.py --target "1Password" --mode quick
    python quest_engine_v2.py --list-quests
        """
    )

    parser.add_argument("--target", "-t", help="Target SaaS product name")
    parser.add_argument(
        "--mode", "-m",
        choices=["quick", "deep"],
        default="quick",
        help="Scan mode: quick (Google fallback) or deep (full API)"
    )
    parser.add_argument("--list-quests", action="store_true", help="List existing quests")
    parser.add_argument("--rule-of-40", type=float, default=0.0, help="Rule of 40 metric")

    args = parser.parse_args()

    if args.list_quests:
        list_quests()
        return

    if not args.target:
        parser.print_help()
        print("\nError: --target is required")
        sys.exit(1)

    # Run quest
    engine = QuestEngineV2()
    report = engine.run_quest(
        target=args.target,
        mode=args.mode,
        rule_of_40=args.rule_of_40,
    )

    # Print final verdict
    if report.verdict:
        status = report.verdict.status.value
        score = report.scores.vulture_score

        if status == "STRIKE":
            print(f"\n✅ STRIKE QUALIFIED: {args.target} (Score: {score:.2f})")
        elif status == "HANGAR":
            print(f"\n⏸️  HANGAR: {args.target} (Score: {score:.2f})")
        else:
            print(f"\n❌ REJECT: {args.target} (Score: {score:.2f})")

    # Exit code based on verdict
    if report.verdict and report.verdict.status == StrikeStatus.STRIKE:
        sys.exit(0)
    elif report.verdict and report.verdict.status == StrikeStatus.HANGAR:
        sys.exit(1)
    else:
        sys.exit(2)


if __name__ == "__main__":
    main()
