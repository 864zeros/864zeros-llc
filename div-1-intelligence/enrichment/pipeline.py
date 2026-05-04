"""
Enrichment Pipeline - Orchestrate signal enrichment for Quest Engine V2.

The pipeline runs all enrichment steps in sequence:
1. Engagement multiplier calculation
2. Author authority scoring
3. Migration intent detection
4. Crisis event detection
5. Velocity analysis (aggregate level)

From Enhanced Scoring Spec V2.
"""

from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime, timezone
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.base import Signal
from .engagement import EngagementCalculator
from .authority import AuthorityCalculator
from .velocity import VelocityAnalyzer
from .migration import MigrationDetector, MigrationReport
from .crisis import CrisisDetector, CrisisReport, CrisisType


@dataclass
class EnrichmentReport:
    """Complete enrichment analysis report."""
    # Signal counts
    total_signals: int
    enriched_signals: int

    # Velocity analysis
    velocity: Dict

    # Migration analysis
    migration: Dict

    # Crisis analysis
    crisis: Dict

    # Aggregate scores
    z_velocity: float
    z_migration: float
    z_crisis: float

    # Top signals (highest weighted)
    top_signals: List[Dict]

    # Processing metadata
    processed_at: datetime
    processing_time_ms: float

    def to_dict(self) -> Dict:
        return {
            "total_signals": self.total_signals,
            "enriched_signals": self.enriched_signals,
            "velocity": self.velocity,
            "migration": self.migration,
            "crisis": self.crisis,
            "z_velocity": round(self.z_velocity, 3),
            "z_migration": round(self.z_migration, 3),
            "z_crisis": round(self.z_crisis, 3),
            "top_signals": self.top_signals,
            "processed_at": self.processed_at.isoformat(),
            "processing_time_ms": round(self.processing_time_ms, 2),
        }


class EnrichmentPipeline:
    """
    Orchestrate signal enrichment through all processing stages.

    Usage:
        pipeline = EnrichmentPipeline()
        enriched_signals = pipeline.enrich(raw_signals)
        report = pipeline.analyze(enriched_signals)
    """

    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize enrichment pipeline.

        Args:
            config: Optional configuration overrides
        """
        self.config = config or {}

        # Initialize enrichment components
        self.engagement_calc = EngagementCalculator()
        self.authority_calc = AuthorityCalculator()
        self.velocity_analyzer = VelocityAnalyzer()
        self.migration_detector = MigrationDetector()
        self.crisis_detector = CrisisDetector()

    def enrich(self, signals: List[Signal]) -> List[Signal]:
        """
        Run all enrichment steps on signals.

        Args:
            signals: Raw signals to enrich

        Returns:
            Enriched signals with multipliers and classifications
        """
        enriched = []

        for signal in signals:
            # Step 1: Calculate engagement multiplier
            signal = self.engagement_calc.apply(signal)

            # Step 2: Calculate author authority
            signal = self.authority_calc.apply(signal)

            # Step 3: Detect migration intent
            signal = self.migration_detector.apply(signal)

            # Step 4: Detect crisis events
            signal = self.crisis_detector.apply(signal)

            # Step 5: Calculate combined weight
            signal.combined_weight = self._calculate_combined_weight(signal)

            enriched.append(signal)

        return enriched

    def _calculate_combined_weight(self, signal: Signal) -> float:
        """
        Calculate combined signal weight from all multipliers.

        Combined weight = base × engagement × authority × crisis_bonus

        Args:
            signal: Enriched signal

        Returns:
            Combined weight multiplier
        """
        base = 1.0

        # Engagement multiplier
        engagement = signal.engagement_multiplier or 1.0
        base *= engagement

        # Author authority
        authority = signal.author_authority or 1.0
        base *= authority

        # Crisis bonus (if crisis detected)
        if signal.crisis_type:
            try:
                crisis_type = CrisisType(signal.crisis_type)
                crisis_mult = self.crisis_detector.get_severity_multiplier(crisis_type)
                base *= crisis_mult
            except ValueError:
                pass

        # Migration intent bonus
        if signal.is_migration_intent:
            base *= 1.5  # 50% bonus for migration signals

        # Recency decay (older signals worth less)
        age_days = signal.age_days
        if age_days <= 7:
            recency_factor = 1.0
        elif age_days <= 30:
            recency_factor = 0.8
        elif age_days <= 90:
            recency_factor = 0.5
        elif age_days <= 365:
            recency_factor = 0.3
        else:
            recency_factor = 0.1

        base *= recency_factor

        return round(base, 3)

    def analyze(self, signals: List[Signal]) -> EnrichmentReport:
        """
        Generate complete enrichment analysis report.

        Args:
            signals: Enriched signals to analyze

        Returns:
            EnrichmentReport with all analyses
        """
        start_time = datetime.now(timezone.utc)

        # Run velocity analysis
        velocity_report = self.velocity_analyzer.analyze(signals)
        z_velocity = self.velocity_analyzer.calculate_z_velocity(velocity_report)

        # Run migration analysis
        migration_report = self.migration_detector.analyze(signals)
        z_migration = migration_report.z_migration

        # Run crisis analysis
        crisis_report = self.crisis_detector.analyze(signals)
        z_crisis = crisis_report.z_crisis

        # Get top signals by weight
        top_signals = self._get_top_signals(signals, limit=10)

        # Calculate processing time
        end_time = datetime.now(timezone.utc)
        processing_time_ms = (end_time - start_time).total_seconds() * 1000

        return EnrichmentReport(
            total_signals=len(signals),
            enriched_signals=len([s for s in signals if s.combined_weight and s.combined_weight > 0]),
            velocity=velocity_report.to_dict(),
            migration=migration_report.to_dict(),
            crisis=crisis_report.to_dict(),
            z_velocity=z_velocity,
            z_migration=z_migration,
            z_crisis=z_crisis,
            top_signals=top_signals,
            processed_at=end_time,
            processing_time_ms=processing_time_ms,
        )

    def _get_top_signals(self, signals: List[Signal], limit: int = 10) -> List[Dict]:
        """
        Get top signals by combined weight.

        Args:
            signals: Signals to rank
            limit: Number of top signals to return

        Returns:
            List of signal summaries
        """
        # Sort by combined weight
        sorted_signals = sorted(
            signals,
            key=lambda s: s.combined_weight or 0,
            reverse=True
        )

        top_signals = []
        for signal in sorted_signals[:limit]:
            summary = {
                "id": signal.id,
                "platform": signal.platform.value,
                "content_preview": signal.content[:200] + "..." if len(signal.content) > 200 else signal.content,
                "url": signal.url,
                "combined_weight": signal.combined_weight,
                "engagement_multiplier": signal.engagement_multiplier,
                "author_authority": signal.author_authority,
                "is_migration_intent": signal.is_migration_intent,
                "crisis_type": signal.crisis_type,
                "age_days": signal.age_days,
                "timestamp": signal.timestamp.isoformat() if signal.timestamp else None,
            }
            top_signals.append(summary)

        return top_signals

    def get_z_scores(self, signals: List[Signal]) -> Dict[str, float]:
        """
        Get all Z-scores for 864z scoring.

        Args:
            signals: Enriched signals

        Returns:
            Dict with z_velocity, z_migration, z_crisis
        """
        velocity_report = self.velocity_analyzer.analyze(signals)
        migration_report = self.migration_detector.analyze(signals)
        crisis_report = self.crisis_detector.analyze(signals)

        return {
            "z_velocity": self.velocity_analyzer.calculate_z_velocity(velocity_report),
            "z_migration": migration_report.z_migration,
            "z_crisis": crisis_report.z_crisis,
        }

    def get_summary(self, signals: List[Signal]) -> Dict:
        """
        Get quick summary of enrichment results.

        Args:
            signals: Enriched signals

        Returns:
            Summary dict
        """
        # Count by category
        migration_count = sum(1 for s in signals if s.is_migration_intent)
        crisis_count = sum(1 for s in signals if s.crisis_type)
        high_engagement = sum(1 for s in signals if (s.engagement_multiplier or 0) >= 3.0)
        high_authority = sum(1 for s in signals if (s.author_authority or 0) >= 2.0)

        # Get Z-scores
        z_scores = self.get_z_scores(signals)

        return {
            "total_signals": len(signals),
            "migration_intent": migration_count,
            "crisis_events": crisis_count,
            "high_engagement": high_engagement,
            "high_authority": high_authority,
            "z_scores": z_scores,
            "signal_quality": self._assess_quality(signals, z_scores),
        }

    def _assess_quality(self, signals: List[Signal], z_scores: Dict[str, float]) -> str:
        """
        Assess overall signal quality for GTM opportunity.

        Args:
            signals: Enriched signals
            z_scores: Z-scores dict

        Returns:
            Quality assessment string
        """
        avg_z = sum(z_scores.values()) / len(z_scores) if z_scores else 0

        if avg_z >= 0.7:
            return "EXCELLENT - High activity, migration intent, and/or crisis events detected"
        elif avg_z >= 0.5:
            return "GOOD - Strong signals with notable activity patterns"
        elif avg_z >= 0.3:
            return "MODERATE - Some activity but limited crisis/migration indicators"
        else:
            return "LOW - Limited signal activity or engagement"

    def enrich_and_analyze(self, signals: List[Signal]) -> tuple:
        """
        Convenience method to enrich and analyze in one call.

        Args:
            signals: Raw signals

        Returns:
            Tuple of (enriched_signals, report)
        """
        enriched = self.enrich(signals)
        report = self.analyze(enriched)
        return enriched, report


# Convenience function for quick enrichment
def quick_enrich(signals: List[Signal]) -> List[Signal]:
    """
    Quick enrichment without full analysis.

    Args:
        signals: Raw signals

    Returns:
        Enriched signals
    """
    pipeline = EnrichmentPipeline()
    return pipeline.enrich(signals)


def full_analysis(signals: List[Signal]) -> Dict:
    """
    Full enrichment and analysis.

    Args:
        signals: Raw signals

    Returns:
        Complete analysis report dict
    """
    pipeline = EnrichmentPipeline()
    enriched = pipeline.enrich(signals)
    report = pipeline.analyze(enriched)
    return report.to_dict()
