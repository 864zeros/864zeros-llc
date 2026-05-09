"""
Migration Detector - Identify explicit switching/migration intent.

Migration intent signals are GTM GOLD:
- "switching from X" = actively looking for alternatives
- "looking for alternative" = in buying mode
- "left X for Y" = validates competitor products

These signals have the highest conversion potential.
From Enhanced Scoring Spec V2.
"""

import re
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.base import Signal


@dataclass
class MigrationReport:
    """Results of migration intent analysis."""
    total_signals: int
    migration_signals: int
    migration_rate: float  # Percentage of signals with intent

    # By intent type
    active_switching: int      # "switching to", "moving to"
    seeking_alternative: int   # "looking for alternative"
    completed_migration: int   # "left X", "switched from X"
    considering: int           # "thinking about", "considering"

    # Destinations mentioned
    top_destinations: List[Tuple[str, int]]

    # Recent migration signals (for recency weighting)
    recent_7d: int
    recent_30d: int

    # Z-Migration score
    z_migration: float

    def to_dict(self) -> Dict:
        return {
            "total_signals": self.total_signals,
            "migration_signals": self.migration_signals,
            "migration_rate": round(self.migration_rate, 3),
            "active_switching": self.active_switching,
            "seeking_alternative": self.seeking_alternative,
            "completed_migration": self.completed_migration,
            "considering": self.considering,
            "top_destinations": self.top_destinations,
            "recent_7d": self.recent_7d,
            "recent_30d": self.recent_30d,
            "z_migration": round(self.z_migration, 3),
        }


class MigrationDetector:
    """
    Detect and analyze migration intent in signals.

    Migration intent = user actively seeking alternatives = high conversion.
    """

    # Intent patterns by category
    ACTIVE_SWITCHING_PATTERNS = [
        r"(switching|migrating|moving)\s+(to|from|away)",
        r"(switched|migrated|moved)\s+(to|from|away)",
        r"(ditched|dumped|dropped)\s+\w+\s+(for|to)",
        r"(replacing|replaced)\s+\w+\s+with",
        r"(going|went)\s+with\s+\w+\s+instead",
    ]

    SEEKING_ALTERNATIVE_PATTERNS = [
        r"looking\s+for\s+(an?\s+)?(alternative|replacement)",
        r"(need|want)\s+(an?\s+)?(alternative|replacement)",
        r"(any|good)\s+alternatives?\s+to",
        r"what\s+(should|can)\s+I\s+(use|switch|try)",
        r"recommend(ations?)?\s+for\s+(an?\s+)?alternative",
        r"best\s+alternative\s+to",
        r"(free|cheaper|better)\s+alternative",
    ]

    COMPLETED_MIGRATION_PATTERNS = [
        r"(left|quit|abandoned)\s+\w+",
        r"(stopped|quit)\s+using",
        r"(no longer|don\'t)\s+use",
        r"(finally|just)\s+(left|switched|moved)",
        r"made\s+the\s+switch",
        r"never\s+going\s+back",
        r"so\s+glad\s+I\s+(switched|left|moved)",
    ]

    CONSIDERING_PATTERNS = [
        r"(thinking|thought)\s+(about|of)\s+(switching|leaving|moving)",
        r"considering\s+(switching|leaving|moving)",
        r"(might|may|should)\s+(switch|leave|move)",
        r"(tempted|want)\s+to\s+(switch|leave|move)",
        r"on\s+the\s+fence\s+(about|whether)",
    ]

    # Common product name patterns for destination extraction
    PRODUCT_NAME_PATTERN = r"(?:to|for|with|using|try)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?)"

    def __init__(self):
        """Initialize migration detector."""
        # Compile patterns for efficiency
        self._active_patterns = [re.compile(p, re.IGNORECASE) for p in self.ACTIVE_SWITCHING_PATTERNS]
        self._seeking_patterns = [re.compile(p, re.IGNORECASE) for p in self.SEEKING_ALTERNATIVE_PATTERNS]
        self._completed_patterns = [re.compile(p, re.IGNORECASE) for p in self.COMPLETED_MIGRATION_PATTERNS]
        self._considering_patterns = [re.compile(p, re.IGNORECASE) for p in self.CONSIDERING_PATTERNS]
        self._destination_pattern = re.compile(self.PRODUCT_NAME_PATTERN)

    def detect(self, signal: Signal) -> bool:
        """
        Check if a signal contains migration intent.

        Args:
            signal: Signal to check

        Returns:
            True if migration intent detected
        """
        content = signal.content.lower()

        # Check all pattern categories
        for patterns in [self._active_patterns, self._seeking_patterns,
                         self._completed_patterns, self._considering_patterns]:
            for pattern in patterns:
                if pattern.search(content):
                    return True

        return False

    def classify(self, signal: Signal) -> Optional[str]:
        """
        Classify the type of migration intent.

        Args:
            signal: Signal to classify

        Returns:
            Intent type or None
        """
        content = signal.content.lower()

        for pattern in self._active_patterns:
            if pattern.search(content):
                return "active_switching"

        for pattern in self._seeking_patterns:
            if pattern.search(content):
                return "seeking_alternative"

        for pattern in self._completed_patterns:
            if pattern.search(content):
                return "completed_migration"

        for pattern in self._considering_patterns:
            if pattern.search(content):
                return "considering"

        return None

    def extract_destinations(self, signal: Signal) -> List[str]:
        """
        Extract mentioned alternative products.

        Args:
            signal: Signal to extract from

        Returns:
            List of product names mentioned as destinations
        """
        content = signal.content
        matches = self._destination_pattern.findall(content)

        # Filter out common false positives
        stop_words = {"I", "It", "The", "This", "That", "My", "We", "They", "If", "So", "Now"}
        destinations = [m.strip() for m in matches if m.strip() not in stop_words]

        return list(set(destinations))

    def analyze(self, signals: List[Signal]) -> MigrationReport:
        """
        Analyze migration intent across all signals.

        Args:
            signals: Signals to analyze

        Returns:
            MigrationReport with intent analysis
        """
        if not signals:
            return self._empty_report()

        now = datetime.now(timezone.utc)

        migration_signals = []
        active_switching = 0
        seeking_alternative = 0
        completed_migration = 0
        considering = 0
        recent_7d = 0
        recent_30d = 0
        destinations = {}

        for signal in signals:
            intent_type = self.classify(signal)

            if intent_type:
                migration_signals.append(signal)
                signal.is_migration_intent = True

                # Count by type
                if intent_type == "active_switching":
                    active_switching += 1
                elif intent_type == "seeking_alternative":
                    seeking_alternative += 1
                elif intent_type == "completed_migration":
                    completed_migration += 1
                elif intent_type == "considering":
                    considering += 1

                # Count recent
                age = signal.age_days
                if age <= 7:
                    recent_7d += 1
                if age <= 30:
                    recent_30d += 1

                # Extract destinations
                for dest in self.extract_destinations(signal):
                    destinations[dest] = destinations.get(dest, 0) + 1

        # Sort destinations by count
        top_destinations = sorted(destinations.items(), key=lambda x: x[1], reverse=True)[:5]

        # Calculate migration rate
        total = len(signals)
        migration_count = len(migration_signals)
        migration_rate = migration_count / total if total > 0 else 0

        # Calculate Z-Migration
        z_migration = self.calculate_z_migration(
            migration_signals,
            recent_7d,
            recent_30d,
            total
        )

        return MigrationReport(
            total_signals=total,
            migration_signals=migration_count,
            migration_rate=migration_rate,
            active_switching=active_switching,
            seeking_alternative=seeking_alternative,
            completed_migration=completed_migration,
            considering=considering,
            top_destinations=top_destinations,
            recent_7d=recent_7d,
            recent_30d=recent_30d,
            z_migration=z_migration,
        )

    def calculate_z_migration(
        self,
        migration_signals: List[Signal],
        recent_7d: int,
        recent_30d: int,
        total_signals: int
    ) -> float:
        """
        Calculate Z-Migration score for 864z scoring.

        From Enhanced Scoring Spec V2:
        - Weight by recency (recent = more valuable)
        - Weight by engagement

        Returns:
            Z-Migration score (0.0 - 1.0)
        """
        if not migration_signals:
            return 0.0

        # Calculate weighted migration score
        weighted_score = 0.0

        for signal in migration_signals:
            base = 1.0

            # Recency bonus
            age_days = signal.age_days
            if age_days <= 7:
                base *= 3.0  # Very recent
            elif age_days <= 30:
                base *= 2.0  # Recent
            elif age_days <= 90:
                base *= 1.0  # Normal
            else:
                base *= 0.5  # Old

            # Engagement bonus
            base *= signal.engagement_multiplier or 1.0

            weighted_score += base

        # Normalize (expect ~20 weighted signals for strong opportunity)
        return min(weighted_score / 20, 1.0)

    def apply(self, signal: Signal) -> Signal:
        """
        Detect and mark migration intent on a signal.

        Args:
            signal: Signal to process

        Returns:
            Signal with is_migration_intent set
        """
        signal.is_migration_intent = self.detect(signal)
        return signal

    def _empty_report(self) -> MigrationReport:
        """Return empty report when no signals."""
        return MigrationReport(
            total_signals=0,
            migration_signals=0,
            migration_rate=0.0,
            active_switching=0,
            seeking_alternative=0,
            completed_migration=0,
            considering=0,
            top_destinations=[],
            recent_7d=0,
            recent_30d=0,
            z_migration=0.0,
        )

    def get_migration_summary(self, signals: List[Signal]) -> Dict:
        """
        Get detailed migration summary for reporting.

        Args:
            signals: Signals to analyze

        Returns:
            Dict with migration analysis details
        """
        report = self.analyze(signals)

        return {
            "report": report.to_dict(),
            "interpretation": self._interpret_migration(report),
        }

    def _interpret_migration(self, report: MigrationReport) -> str:
        """Generate human-readable interpretation of migration intent."""
        if report.z_migration >= 0.7:
            return f"HIGH MIGRATION INTENT: {report.migration_signals} signals showing active switching behavior"
        elif report.z_migration >= 0.5:
            return f"MODERATE MIGRATION INTENT: {report.migration_signals} signals indicating interest in alternatives"
        elif report.z_migration >= 0.3:
            return f"Some migration intent: {report.migration_signals} signals with alternative-seeking behavior"
        else:
            return f"Low migration intent: {report.migration_signals} signals (limited switching activity)"
