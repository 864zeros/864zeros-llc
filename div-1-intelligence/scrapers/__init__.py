"""
Vulture Nest Scrapers - Multi-platform signal collection for Quest Engine V2

This package provides platform-specific scrapers that collect pain signals
with full engagement metadata (likes, retweets, scores, author info).

Supported Platforms:
- Twitter/X (via Apify)
- Reddit (via Apify/Pushshift)
- Hacker News (via Algolia API)
- G2 (via Apify)
- Capterra (via Apify)
- Product Hunt (via Apify)

Usage:
    from scrapers import ScraperManager

    manager = ScraperManager()
    signals = manager.scrape_all("1Password")
"""

from .base import (
    BaseScraper,
    Signal,
    ScraperConfig,
    Platform,
    Engagement,
    Author,
    SignalSeverity,
)
from .manager import ScraperManager

__all__ = [
    "BaseScraper",
    "Signal",
    "ScraperConfig",
    "Platform",
    "Engagement",
    "Author",
    "SignalSeverity",
    "ScraperManager",
]

__version__ = "2.0.0"
