"""
Vulture Nest Enrichment Pipeline - Signal processing for Quest Engine V2

This package provides signal enrichment capabilities:
- Engagement multiplier calculations
- Author authority scoring
- Velocity spike detection
- Migration intent classification
- Crisis event detection

Usage:
    from enrichment import EnrichmentPipeline

    pipeline = EnrichmentPipeline()
    enriched_signals = pipeline.enrich(signals)
"""

from .engagement import EngagementCalculator
from .authority import AuthorityCalculator
from .velocity import VelocityAnalyzer
from .migration import MigrationDetector
from .crisis import CrisisDetector
from .pipeline import EnrichmentPipeline

__all__ = [
    "EngagementCalculator",
    "AuthorityCalculator",
    "VelocityAnalyzer",
    "MigrationDetector",
    "CrisisDetector",
    "EnrichmentPipeline",
]

__version__ = "2.0.0"
