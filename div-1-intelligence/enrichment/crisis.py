"""
Crisis Detector - Identify crisis events that create GTM opportunities.

Crisis events = sudden pain = high conversion window:
- Service outages (downtime, broken features)
- Price increases (billing shock)
- Data breaches (trust destruction)
- Acquisition/shutdown announcements
- Feature removals / enshittification

From Enhanced Scoring Spec V2.
"""

import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.base import Signal


class CrisisType(Enum):
    """Types of crisis events."""
    OUTAGE = "outage"              # Service down, broken
    PRICE_HIKE = "price_hike"      # Price increase, billing change
    DATA_BREACH = "data_breach"    # Security incident, leak
    ACQUISITION = "acquisition"    # Bought, acquired, merger
    SHUTDOWN = "shutdown"          # Closing, sunsetting, EOL
    FEATURE_REMOVAL = "feature_removal"  # Removed, deprecated
    ENSHITTIFICATION = "enshittification"  # General quality decline
    POLICY_CHANGE = "policy_change"  # TOS, privacy, licensing change
    UNKNOWN = "unknown"


@dataclass
class CrisisReport:
    """Results of crisis event analysis."""
    total_signals: int
    crisis_signals: int
    crisis_rate: float  # Percentage of signals with crisis events

    # By crisis type
    by_type: Dict[str, int]

    # Most severe crisis detected
    primary_crisis: Optional[CrisisType]
    primary_crisis_count: int

    # Timing
    crisis_first_seen: Optional[datetime]
    crisis_peak: Optional[datetime]  # Day with most crisis signals

    # Z-Crisis score
    z_crisis: float

    def to_dict(self) -> Dict:
        return {
            "total_signals": self.total_signals,
            "crisis_signals": self.crisis_signals,
            "crisis_rate": round(self.crisis_rate, 3),
            "by_type": self.by_type,
            "primary_crisis": self.primary_crisis.value if self.primary_crisis else None,
            "primary_crisis_count": self.primary_crisis_count,
            "crisis_first_seen": self.crisis_first_seen.isoformat() if self.crisis_first_seen else None,
            "crisis_peak": self.crisis_peak.isoformat() if self.crisis_peak else None,
            "z_crisis": round(self.z_crisis, 3),
        }


class CrisisDetector:
    """
    Detect and classify crisis events in signals.

    Crisis events create urgent GTM windows - users actively seeking alternatives.
    """

    # Crisis detection patterns by type
    OUTAGE_PATTERNS = [
        r"\b(down|outage|offline|broken|not working)\b",
        r"\b(can't (access|login|connect|use))\b",
        r"\b(service (unavailable|down|broken))\b",
        r"\b(error|crash|bug|glitch)s?\b.{0,30}\b(constant|every|always|keeps)\b",
        r"\b(maintenance|downtime)\b",
        r"\bstatus\s*page\b",
        r"\b503|500|502\b.{0,20}error",
    ]

    PRICE_HIKE_PATTERNS = [
        r"\b(price|pricing)\s+(increase|hike|raise|went up|doubled|tripled)\b",
        r"\b(raised|increased|hiked)\s+(price|pricing|cost|fee)s?\b",
        r"\b(more expensive|costs more|paying more)\b",
        r"\b(subscription|plan)\s+(price|cost).{0,20}(up|increased|higher)\b",
        r"\b(billing|charged|invoiced).{0,30}(more|increase|shock|surprise)\b",
        r"\b(free tier|free plan).{0,20}(removed|gone|killed|eliminated)\b",
        r"\$\d+.{0,10}(now|became|increased to)\s*\$\d+",
    ]

    DATA_BREACH_PATTERNS = [
        r"\b(data|security)\s+(breach|leak|incident|hack)\b",
        r"\b(hack(ed)?|compromised|exposed|leaked)\b",
        r"\b(password|credential|account)s?\s+(stolen|leaked|exposed|compromised)\b",
        r"\b(unauthorized|suspicious)\s+(access|activity|login)\b",
        r"\b(phishing|ransomware|malware)\b",
        r"\bdata\s+(sold|shared|exposed)\b",
    ]

    ACQUISITION_PATTERNS = [
        r"\b(acquired|bought|purchased)\s+by\b",
        r"\b(acquisition|merger|buyout)\b",
        r"\b(new (owner|management|parent company))\b",
        r"\b(taken over|sold to)\b",
        r"\bprivate equity\b",
    ]

    SHUTDOWN_PATTERNS = [
        r"\b(shutting down|closing|sunsetting|discontinuing)\b",
        r"\b(end of life|EOL|deprecated|sunset)\b",
        r"\b(closing (down|shop)|going away)\b",
        r"\b(no longer (supported|available|maintained))\b",
        r"\b(killed|axed|cancelled|terminated)\s+(the\s+)?(product|service|app)\b",
    ]

    FEATURE_REMOVAL_PATTERNS = [
        r"\b(removed|killed|axed|dropped|eliminated)\s+(the\s+)?(feature|function|option|ability)\b",
        r"\b(feature|function|option)\s+(removed|gone|disappeared|missing)\b",
        r"\b(can no longer|can't anymore|used to be able)\b",
        r"\b(deprecated|sunset|discontinued)\s+(feature|function|API)\b",
        r"\b(breaking change|backwards? incompatible)\b",
    ]

    ENSHITTIFICATION_PATTERNS = [
        r"\b(enshittification|getting worse|quality declined)\b",
        r"\b(used to be (good|great|better)|was better)\b",
        r"\b(gone downhill|deteriorated|degraded)\b",
        r"\b(more (ads|spam|bloat)|bloated|slower)\b",
        r"\b(lost (trust|faith|confidence) in)\b",
        r"\b(hate what.{0,20}become|ruined|destroyed)\b",
    ]

    POLICY_CHANGE_PATTERNS = [
        r"\b(TOS|terms of service|privacy policy)\s+(change|update)\b",
        r"\b(new (policy|terms|rules|restrictions))\b",
        r"\b(license|licensing)\s+(change|update|switch)\b",
        r"\b(data (collection|sharing|selling))\b",
        r"\b(opt-out|consent|tracking)\b.{0,30}\b(forced|required|mandatory)\b",
    ]

    # Crisis severity multipliers
    CRISIS_SEVERITY = {
        CrisisType.DATA_BREACH: 3.0,      # Highest urgency
        CrisisType.SHUTDOWN: 2.5,          # Extremely urgent
        CrisisType.PRICE_HIKE: 2.0,        # High pain
        CrisisType.OUTAGE: 1.8,            # Immediate frustration
        CrisisType.FEATURE_REMOVAL: 1.5,   # Significant pain
        CrisisType.ACQUISITION: 1.3,       # Uncertainty
        CrisisType.ENSHITTIFICATION: 1.2,  # Gradual decline
        CrisisType.POLICY_CHANGE: 1.1,     # Concern
        CrisisType.UNKNOWN: 1.0,
    }

    def __init__(self):
        """Initialize crisis detector."""
        # Compile patterns for efficiency
        self._patterns = {
            CrisisType.OUTAGE: [re.compile(p, re.IGNORECASE) for p in self.OUTAGE_PATTERNS],
            CrisisType.PRICE_HIKE: [re.compile(p, re.IGNORECASE) for p in self.PRICE_HIKE_PATTERNS],
            CrisisType.DATA_BREACH: [re.compile(p, re.IGNORECASE) for p in self.DATA_BREACH_PATTERNS],
            CrisisType.ACQUISITION: [re.compile(p, re.IGNORECASE) for p in self.ACQUISITION_PATTERNS],
            CrisisType.SHUTDOWN: [re.compile(p, re.IGNORECASE) for p in self.SHUTDOWN_PATTERNS],
            CrisisType.FEATURE_REMOVAL: [re.compile(p, re.IGNORECASE) for p in self.FEATURE_REMOVAL_PATTERNS],
            CrisisType.ENSHITTIFICATION: [re.compile(p, re.IGNORECASE) for p in self.ENSHITTIFICATION_PATTERNS],
            CrisisType.POLICY_CHANGE: [re.compile(p, re.IGNORECASE) for p in self.POLICY_CHANGE_PATTERNS],
        }

    def detect(self, signal: Signal) -> bool:
        """
        Check if a signal contains crisis event indicators.

        Args:
            signal: Signal to check

        Returns:
            True if crisis event detected
        """
        content = signal.content

        for crisis_type, patterns in self._patterns.items():
            for pattern in patterns:
                if pattern.search(content):
                    return True

        return False

    def classify(self, signal: Signal) -> Optional[CrisisType]:
        """
        Classify the type of crisis event.

        Args:
            signal: Signal to classify

        Returns:
            CrisisType or None
        """
        content = signal.content

        # Check patterns in order of severity (highest first)
        severity_order = sorted(
            self._patterns.keys(),
            key=lambda ct: self.CRISIS_SEVERITY.get(ct, 1.0),
            reverse=True
        )

        for crisis_type in severity_order:
            patterns = self._patterns[crisis_type]
            for pattern in patterns:
                if pattern.search(content):
                    return crisis_type

        return None

    def get_severity_multiplier(self, crisis_type: Optional[CrisisType]) -> float:
        """
        Get severity multiplier for a crisis type.

        Args:
            crisis_type: The crisis type

        Returns:
            Severity multiplier (1.0 - 3.0)
        """
        if crisis_type is None:
            return 1.0
        return self.CRISIS_SEVERITY.get(crisis_type, 1.0)

    def analyze(self, signals: List[Signal]) -> CrisisReport:
        """
        Analyze crisis events across all signals.

        Args:
            signals: Signals to analyze

        Returns:
            CrisisReport with crisis analysis
        """
        if not signals:
            return self._empty_report()

        crisis_signals = []
        by_type: Dict[str, int] = {}
        crisis_timestamps: List[datetime] = []

        for signal in signals:
            crisis_type = self.classify(signal)

            if crisis_type:
                crisis_signals.append(signal)
                signal.crisis_type = crisis_type.value

                # Count by type
                type_name = crisis_type.value
                by_type[type_name] = by_type.get(type_name, 0) + 1

                # Track timestamps
                if signal.timestamp:
                    crisis_timestamps.append(signal.timestamp)

        # Find primary crisis
        primary_crisis = None
        primary_crisis_count = 0
        if by_type:
            primary_type_name = max(by_type, key=by_type.get)
            primary_crisis = CrisisType(primary_type_name)
            primary_crisis_count = by_type[primary_type_name]

        # Find timing
        crisis_first_seen = min(crisis_timestamps) if crisis_timestamps else None

        # Find peak day (simplified - just use the day with most signals)
        crisis_peak = self._find_peak_day(crisis_timestamps)

        # Calculate metrics
        total = len(signals)
        crisis_count = len(crisis_signals)
        crisis_rate = crisis_count / total if total > 0 else 0

        # Calculate Z-Crisis
        z_crisis = self.calculate_z_crisis(
            crisis_signals,
            by_type,
            total
        )

        return CrisisReport(
            total_signals=total,
            crisis_signals=crisis_count,
            crisis_rate=crisis_rate,
            by_type=by_type,
            primary_crisis=primary_crisis,
            primary_crisis_count=primary_crisis_count,
            crisis_first_seen=crisis_first_seen,
            crisis_peak=crisis_peak,
            z_crisis=z_crisis,
        )

    def _find_peak_day(self, timestamps: List[datetime]) -> Optional[datetime]:
        """Find the day with most crisis signals."""
        if not timestamps:
            return None

        # Group by day
        day_counts: Dict[str, Tuple[int, datetime]] = {}
        for ts in timestamps:
            day_key = ts.strftime("%Y-%m-%d")
            if day_key in day_counts:
                day_counts[day_key] = (day_counts[day_key][0] + 1, day_counts[day_key][1])
            else:
                day_counts[day_key] = (1, ts)

        # Find max
        max_day = max(day_counts.items(), key=lambda x: x[1][0])
        return max_day[1][1]

    def calculate_z_crisis(
        self,
        crisis_signals: List[Signal],
        by_type: Dict[str, int],
        total_signals: int
    ) -> float:
        """
        Calculate Z-Crisis score for 864z scoring.

        From Enhanced Scoring Spec V2:
        - Weight by crisis severity
        - Weight by recency
        - Weight by crisis concentration

        Returns:
            Z-Crisis score (0.0 - 1.0)
        """
        if not crisis_signals:
            return 0.0

        # Calculate weighted crisis score
        weighted_score = 0.0

        for signal in crisis_signals:
            base = 1.0

            # Crisis type severity
            if signal.crisis_type:
                crisis_type = CrisisType(signal.crisis_type)
                base *= self.get_severity_multiplier(crisis_type)

            # Recency bonus
            age_days = signal.age_days
            if age_days <= 7:
                base *= 3.0  # Very recent crisis
            elif age_days <= 30:
                base *= 2.0  # Recent
            elif age_days <= 90:
                base *= 1.0  # Normal
            else:
                base *= 0.5  # Old

            # Engagement amplification
            base *= signal.engagement_multiplier or 1.0

            weighted_score += base

        # Crisis concentration bonus (many crisis signals = active event)
        crisis_rate = len(crisis_signals) / total_signals if total_signals > 0 else 0
        if crisis_rate >= 0.5:
            weighted_score *= 1.5  # Half of all signals are crisis = major event
        elif crisis_rate >= 0.25:
            weighted_score *= 1.2

        # Normalize (expect ~30 weighted points for strong crisis)
        return min(weighted_score / 30, 1.0)

    def apply(self, signal: Signal) -> Signal:
        """
        Detect and mark crisis type on a signal.

        Args:
            signal: Signal to process

        Returns:
            Signal with crisis_type set
        """
        crisis_type = self.classify(signal)
        if crisis_type:
            signal.crisis_type = crisis_type.value
        return signal

    def _empty_report(self) -> CrisisReport:
        """Return empty report when no signals."""
        return CrisisReport(
            total_signals=0,
            crisis_signals=0,
            crisis_rate=0.0,
            by_type={},
            primary_crisis=None,
            primary_crisis_count=0,
            crisis_first_seen=None,
            crisis_peak=None,
            z_crisis=0.0,
        )

    def get_crisis_summary(self, signals: List[Signal]) -> Dict:
        """
        Get detailed crisis summary for reporting.

        Args:
            signals: Signals to analyze

        Returns:
            Dict with crisis analysis details
        """
        report = self.analyze(signals)

        return {
            "report": report.to_dict(),
            "interpretation": self._interpret_crisis(report),
        }

    def _interpret_crisis(self, report: CrisisReport) -> str:
        """Generate human-readable interpretation of crisis events."""
        if report.z_crisis >= 0.7:
            crisis_name = report.primary_crisis.value if report.primary_crisis else "CRISIS"
            return f"ACTIVE {crisis_name.upper()}: {report.crisis_signals} signals indicate ongoing crisis event"
        elif report.z_crisis >= 0.5:
            return f"SIGNIFICANT CRISIS: {report.crisis_signals} crisis signals detected"
        elif report.z_crisis >= 0.3:
            return f"Crisis activity: {report.crisis_signals} signals with crisis indicators"
        else:
            return f"Low crisis activity: {report.crisis_signals} signals (stable period)"
