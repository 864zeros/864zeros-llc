"""
Velocity Analyzer - Detect complaint spikes and trends.

Velocity analysis answers: "Is something happening RIGHT NOW?"
- Spike detection compares recent volume to historical baseline
- High spike ratio = crisis event = GTM opportunity window

From Enhanced Scoring Spec V2.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.base import Signal


@dataclass
class VelocityReport:
    """Results of velocity analysis."""
    # Raw counts
    count_24h: int
    count_7d: int
    count_30d: int
    count_90d: int
    count_365d: int

    # Baseline (average signals per 30-day period)
    baseline_per_30d: float

    # Spike ratios (current period / baseline)
    spike_ratio_24h: float
    spike_ratio_7d: float
    spike_ratio_30d: float

    # Boolean flags
    is_spiking: bool
    spike_severity: float

    # Timing
    newest_signal: Optional[datetime]
    oldest_signal: Optional[datetime]

    # Optional: detected trigger
    spike_trigger: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "count_24h": self.count_24h,
            "count_7d": self.count_7d,
            "count_30d": self.count_30d,
            "count_90d": self.count_90d,
            "count_365d": self.count_365d,
            "baseline_per_30d": round(self.baseline_per_30d, 2),
            "spike_ratio_24h": round(self.spike_ratio_24h, 2),
            "spike_ratio_7d": round(self.spike_ratio_7d, 2),
            "spike_ratio_30d": round(self.spike_ratio_30d, 2),
            "is_spiking": self.is_spiking,
            "spike_severity": round(self.spike_severity, 2),
            "spike_trigger": self.spike_trigger,
            "newest_signal": self.newest_signal.isoformat() if self.newest_signal else None,
            "oldest_signal": self.oldest_signal.isoformat() if self.oldest_signal else None,
        }


class VelocityAnalyzer:
    """
    Analyze signal velocity to detect abnormal spikes.

    A sudden surge in complaints = something happened = GTM window open.
    """

    # Time windows in seconds
    TIME_WINDOWS = {
        "24h": 24 * 60 * 60,
        "7d": 7 * 24 * 60 * 60,
        "30d": 30 * 24 * 60 * 60,
        "90d": 90 * 24 * 60 * 60,
        "365d": 365 * 24 * 60 * 60,
    }

    # Spike thresholds
    SPIKE_THRESHOLD_7D = 2.0   # 2x normal = notable spike
    SPIKE_THRESHOLD_24H = 3.0  # 3x normal = major spike
    MAJOR_SPIKE = 5.0          # 5x normal = crisis-level

    def __init__(self):
        """Initialize velocity analyzer."""
        pass

    def analyze(self, signals: List[Signal]) -> VelocityReport:
        """
        Analyze velocity of signals to detect spikes.

        Args:
            signals: List of signals with timestamps

        Returns:
            VelocityReport with spike analysis
        """
        if not signals:
            return self._empty_report()

        now = datetime.now(timezone.utc)

        # Bucket signals by time window
        buckets = self._bucket_signals(signals, now)

        # Calculate baseline (average per 30-day period over last year)
        baseline = self._calculate_baseline(buckets)

        # Calculate spike ratios
        spike_24h = self._calculate_spike_ratio(buckets["24h"], baseline, 30)
        spike_7d = self._calculate_spike_ratio(buckets["7d"], baseline, 4.3)  # ~4.3 weeks in a month
        spike_30d = self._calculate_spike_ratio(buckets["30d"], baseline, 1)

        # Determine if spiking
        is_spiking = (
            spike_7d >= self.SPIKE_THRESHOLD_7D or
            spike_24h >= self.SPIKE_THRESHOLD_24H
        )

        # Calculate severity (max of all ratios)
        spike_severity = max(spike_24h, spike_7d, spike_30d)

        # Find newest/oldest
        timestamps = [s.timestamp for s in signals if s.timestamp]
        newest = max(timestamps) if timestamps else None
        oldest = min(timestamps) if timestamps else None

        # Try to detect trigger (most common crisis type in recent signals)
        spike_trigger = self._detect_trigger(buckets["7d"]) if is_spiking else None

        return VelocityReport(
            count_24h=len(buckets["24h"]),
            count_7d=len(buckets["7d"]),
            count_30d=len(buckets["30d"]),
            count_90d=len(buckets["90d"]),
            count_365d=len(buckets["365d"]),
            baseline_per_30d=baseline,
            spike_ratio_24h=spike_24h,
            spike_ratio_7d=spike_7d,
            spike_ratio_30d=spike_30d,
            is_spiking=is_spiking,
            spike_severity=spike_severity,
            newest_signal=newest,
            oldest_signal=oldest,
            spike_trigger=spike_trigger,
        )

    def _bucket_signals(self, signals: List[Signal], now: datetime) -> Dict[str, List[Signal]]:
        """Bucket signals by time window."""
        buckets = {key: [] for key in self.TIME_WINDOWS.keys()}

        for signal in signals:
            timestamp = signal.timestamp
            if not timestamp:
                continue

            # Ensure timezone aware
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)

            age_seconds = (now - timestamp).total_seconds()

            # Add to all applicable buckets
            for window_name, window_seconds in self.TIME_WINDOWS.items():
                if age_seconds <= window_seconds:
                    buckets[window_name].append(signal)

        return buckets

    def _calculate_baseline(self, buckets: Dict[str, List[Signal]]) -> float:
        """
        Calculate baseline signals per 30-day period.

        Uses 365-day data to establish what's "normal".
        """
        yearly_count = len(buckets.get("365d", []))

        if yearly_count == 0:
            # No historical data - use 30-day count as baseline
            return max(len(buckets.get("30d", [])), 1)

        # Average per 30-day period (12 periods in a year)
        return max(yearly_count / 12, 1)

    def _calculate_spike_ratio(
        self,
        bucket: List[Signal],
        baseline: float,
        normalization_factor: float
    ) -> float:
        """
        Calculate spike ratio for a time bucket.

        Args:
            bucket: Signals in this time period
            baseline: Expected signals per 30-day period
            normalization_factor: Factor to normalize bucket to 30-day equivalent

        Returns:
            Spike ratio (1.0 = normal, 2.0 = 2x normal, etc.)
        """
        count = len(bucket)

        # Normalize to 30-day equivalent
        normalized_count = count * normalization_factor

        return normalized_count / baseline if baseline > 0 else 1.0

    def _detect_trigger(self, recent_signals: List[Signal]) -> Optional[str]:
        """
        Try to identify what triggered the spike.

        Looks for common crisis types in recent signals.
        """
        if not recent_signals:
            return None

        crisis_counts = {}
        for signal in recent_signals:
            if signal.crisis_type:
                crisis_counts[signal.crisis_type] = crisis_counts.get(signal.crisis_type, 0) + 1

        if not crisis_counts:
            return None

        # Return most common crisis type
        return max(crisis_counts, key=crisis_counts.get)

    def _empty_report(self) -> VelocityReport:
        """Return empty report when no signals."""
        return VelocityReport(
            count_24h=0,
            count_7d=0,
            count_30d=0,
            count_90d=0,
            count_365d=0,
            baseline_per_30d=1.0,
            spike_ratio_24h=0.0,
            spike_ratio_7d=0.0,
            spike_ratio_30d=0.0,
            is_spiking=False,
            spike_severity=0.0,
            newest_signal=None,
            oldest_signal=None,
        )

    def calculate_z_velocity(self, report: VelocityReport) -> float:
        """
        Calculate Z-Velocity score for 864z scoring.

        From Enhanced Scoring Spec V2:
        - Base score from recent activity volume
        - Spike bonus for abnormal activity

        Returns:
            Z-Velocity score (0.0 - 1.0)
        """
        recent_volume = report.count_30d

        # Base score from volume
        if recent_volume >= 50:
            base = 0.8
        elif recent_volume >= 20:
            base = 0.6
        elif recent_volume >= 10:
            base = 0.4
        elif recent_volume >= 5:
            base = 0.2
        else:
            base = 0.1

        # Spike bonus
        if report.is_spiking:
            if report.spike_severity >= self.MAJOR_SPIKE:
                base += 0.5  # Massive spike = crisis event
            elif report.spike_severity >= self.SPIKE_THRESHOLD_24H:
                base += 0.3  # Major spike
            elif report.spike_severity >= self.SPIKE_THRESHOLD_7D:
                base += 0.2  # Notable spike

        return min(base, 1.0)

    def get_velocity_summary(self, signals: List[Signal]) -> Dict:
        """
        Get detailed velocity summary for reporting.

        Args:
            signals: Signals to analyze

        Returns:
            Dict with velocity analysis details
        """
        report = self.analyze(signals)

        return {
            "report": report.to_dict(),
            "z_velocity": self.calculate_z_velocity(report),
            "interpretation": self._interpret_velocity(report),
        }

    def _interpret_velocity(self, report: VelocityReport) -> str:
        """Generate human-readable interpretation of velocity."""
        if report.spike_severity >= self.MAJOR_SPIKE:
            base = f"CRITICAL SPIKE: {report.spike_severity:.1f}x normal activity"
            if report.spike_trigger:
                base += f" (trigger: {report.spike_trigger})"
            return base
        elif report.is_spiking:
            return f"SPIKE DETECTED: {report.spike_severity:.1f}x normal activity in recent period"
        elif report.count_30d >= 20:
            return f"Active complaints: {report.count_30d} signals in last 30 days"
        elif report.count_30d >= 5:
            return f"Moderate activity: {report.count_30d} signals in last 30 days"
        else:
            return f"Low activity: {report.count_30d} signals in last 30 days"
