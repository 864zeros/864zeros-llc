"""
Base Scraper - Abstract class and data models for all platform scrapers.

This module defines:
- Signal: The standardized data structure for all scraped content
- SignalSeverity: Classification levels for pain signals
- ScraperConfig: Configuration for scraper behavior
- BaseScraper: Abstract base class all scrapers must implement
"""

import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
from typing import List, Dict, Any, Optional


class SignalSeverity(Enum):
    """Classification levels for pain signals."""
    CRITICAL = "critical"  # breach, data loss, shutdown, lawsuit
    HIGH = "high"          # switching, migrating, canceling
    MEDIUM = "medium"      # frustrated, annoying, overpriced
    LOW = "low"            # wish, minor issue
    NOISE = "noise"        # positive sentiment (excluded)


class Platform(Enum):
    """Supported scraping platforms."""
    TWITTER = "twitter"
    REDDIT = "reddit"
    HACKER_NEWS = "hacker_news"
    G2 = "g2"
    CAPTERRA = "capterra"
    PRODUCT_HUNT = "product_hunt"
    LINKEDIN = "linkedin"
    TRUSTPILOT = "trustpilot"


# Platform authority weights (from Enhanced Scoring Spec V2)
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

# Severity detection patterns
SEVERITY_PATTERNS = {
    SignalSeverity.CRITICAL: [
        r"(data|security)\s*(breach|leak|hack)",
        r"(class\s*action|lawsuit|sued)",
        r"(shut\s*down|shutting\s*down|sunset|EOL|end\s*of\s*life)",
        r"lost\s*(all\s*)?(my\s*)?(data|files|work)",
        r"(account|data)\s*(deleted|wiped|gone)",
        r"compromised",
    ],
    SignalSeverity.HIGH: [
        r"(switching|migrating|moving)\s*(to|away|from)",
        r"cancel(led|ing)?\s*(my\s*)?(subscription|account)",
        r"looking\s*for\s*(an?\s*)?(alternative|replacement)",
        r"(can\'t|cannot|won\'t)\s*(afford|justify|pay)",
        r"(price|cost)\s*(hike|increase|doubled|tripled)",
        r"(left|leaving|quit|quitting)",
        r"(rip\s*off|scam|robbery)",
    ],
    SignalSeverity.MEDIUM: [
        r"(frustrated|annoying|annoyed|irritating)",
        r"(expensive|overpriced|pricey|costly)",
        r"(slow|laggy|buggy|broken|crash)",
        r"(hate|dislike|disappointed)",
        r"(locked\s*in|vendor\s*lock|can\'t\s*export)",
        r"(terrible|awful|horrible)\s*(support|service)",
    ],
    SignalSeverity.LOW: [
        r"(wish|hope|would\s*be\s*nice)",
        r"(minor|small)\s*(issue|bug|problem)",
        r"(could|should)\s*be\s*better",
    ],
}

# Migration intent patterns
MIGRATION_PATTERNS = [
    r"(switching|migrating|moving)\s*(to|from)",
    r"looking\s*for\s*(an?\s*)?(alternative|replacement)",
    r"(left|leaving|quit|quitting)\s+\w+",
    r"(moved|moving)\s*(away|to)",
    r"what\s*(should|can)\s*I\s*(switch|use|try)",
    r"best\s*alternative",
    r"(replaced|replacing)\s+\w+\s+with",
]

# Crisis event patterns
CRISIS_PATTERNS = {
    "data_breach": [r"(data|security)\s*(breach|leak|hack)", r"compromised"],
    "service_outage": [r"(outage|down|offline)", r"can\'t\s*(access|login)"],
    "price_hike": [r"price\s*(increase|hike|doubled)", r"raising\s*prices"],
    "shutdown": [r"shut(ting)?\s*down", r"sunset", r"end\s*of\s*life", r"discontinued"],
    "acquisition": [r"acquired\s*by", r"bought\s*by", r"sold\s*to"],
    "layoffs": [r"layoff", r"laid\s*off", r"downsizing"],
}


@dataclass
class Author:
    """Author metadata for authority scoring."""
    id: str = ""
    username: str = ""
    display_name: str = ""
    followers_count: int = 0
    verified: bool = False
    account_age_days: int = 0
    karma: int = 0  # Reddit/HN specific

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class Engagement:
    """Engagement metrics for signal weighting."""
    likes: int = 0
    retweets: int = 0
    replies: int = 0
    comments: int = 0
    score: int = 0  # Reddit upvotes, HN points
    helpful_votes: int = 0  # Review platforms

    def to_dict(self) -> Dict:
        return asdict(self)

    @property
    def total(self) -> int:
        """Total engagement score."""
        return self.likes + (self.retweets * 2) + (self.replies * 1.5) + self.score


@dataclass
class Signal:
    """
    Standardized signal data structure.

    Every scraped item (tweet, post, review, comment) becomes a Signal
    with normalized metadata for scoring.
    """
    # Core content
    id: str
    content: str
    url: str
    platform: Platform

    # Timing
    timestamp: datetime
    scraped_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    # Metadata
    author: Author = field(default_factory=Author)
    engagement: Engagement = field(default_factory=Engagement)

    # Classification (computed after scraping)
    severity: SignalSeverity = SignalSeverity.LOW
    is_migration_intent: bool = False
    crisis_type: Optional[str] = None

    # Computed scores (set by enrichment pipeline)
    engagement_multiplier: float = 1.0
    author_authority: float = 1.0
    platform_authority: float = 1.0
    weighted_score: float = 0.0

    # Additional context
    title: str = ""  # For posts/articles
    parent_id: str = ""  # For comments
    subreddit: str = ""  # Reddit specific
    rating: int = 0  # Review platforms (1-5 stars)
    verified_purchase: bool = False  # Review platforms

    def __post_init__(self):
        """Compute classification after initialization."""
        self.classify()
        self.platform_authority = PLATFORM_AUTHORITY.get(self.platform, 1.0)

    def classify(self):
        """Classify signal severity and detect migration intent."""
        content_lower = self.content.lower()

        # Check severity patterns
        for severity, patterns in SEVERITY_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, content_lower, re.IGNORECASE):
                    self.severity = severity
                    break
            if self.severity != SignalSeverity.LOW:
                break

        # Check migration intent
        for pattern in MIGRATION_PATTERNS:
            if re.search(pattern, content_lower, re.IGNORECASE):
                self.is_migration_intent = True
                break

        # Check crisis type
        for crisis_type, patterns in CRISIS_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, content_lower, re.IGNORECASE):
                    self.crisis_type = crisis_type
                    break
            if self.crisis_type:
                break

    @property
    def age_days(self) -> int:
        """Days since signal was created."""
        now = datetime.now(timezone.utc)
        if self.timestamp.tzinfo is None:
            self.timestamp = self.timestamp.replace(tzinfo=timezone.utc)
        delta = now - self.timestamp
        return delta.days

    @property
    def severity_weight(self) -> float:
        """Numeric weight for severity level."""
        weights = {
            SignalSeverity.CRITICAL: 5.0,
            SignalSeverity.HIGH: 3.0,
            SignalSeverity.MEDIUM: 1.5,
            SignalSeverity.LOW: 1.0,
            SignalSeverity.NOISE: 0.0,
        }
        return weights.get(self.severity, 1.0)

    def calculate_weighted_score(self) -> float:
        """Calculate final weighted score for this signal."""
        self.weighted_score = (
            self.severity_weight *
            self.engagement_multiplier *
            self.author_authority *
            self.platform_authority
        )
        return self.weighted_score

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "content": self.content[:500],  # Truncate for storage
            "url": self.url,
            "platform": self.platform.value,
            "timestamp": self.timestamp.isoformat(),
            "scraped_at": self.scraped_at.isoformat(),
            "author": self.author.to_dict(),
            "engagement": self.engagement.to_dict(),
            "severity": self.severity.value,
            "is_migration_intent": self.is_migration_intent,
            "crisis_type": self.crisis_type,
            "engagement_multiplier": self.engagement_multiplier,
            "author_authority": self.author_authority,
            "platform_authority": self.platform_authority,
            "weighted_score": self.weighted_score,
            "title": self.title,
            "age_days": self.age_days,
            "rating": self.rating,
        }


@dataclass
class ScraperConfig:
    """Configuration for scraper behavior."""
    target: str  # Product name to search
    max_results: int = 50  # Max results per query
    days_back: int = 90  # How far back to search
    include_replies: bool = True
    include_comments: bool = True
    min_engagement: int = 0  # Minimum engagement to include

    # Query types to run
    query_types: List[str] = field(default_factory=lambda: [
        "ransom",      # Pricing pain
        "friction",    # Lock-in pain
        "migration",   # Switching intent
        "crisis",      # Crisis events
    ])


class BaseScraper(ABC):
    """
    Abstract base class for all platform scrapers.

    Each platform scraper must implement:
    - platform: The Platform enum value
    - scrape(): Main scraping method
    - _build_queries(): Generate platform-specific queries
    """

    def __init__(self, config: ScraperConfig):
        self.config = config
        self.signals: List[Signal] = []

    @property
    @abstractmethod
    def platform(self) -> Platform:
        """Return the platform this scraper handles."""
        pass

    @abstractmethod
    def scrape(self) -> List[Signal]:
        """
        Execute scraping and return list of Signals.

        This method should:
        1. Build queries using _build_queries()
        2. Execute searches
        3. Parse results into Signal objects
        4. Return list of signals
        """
        pass

    @abstractmethod
    def _build_queries(self) -> Dict[str, List[str]]:
        """
        Build platform-specific queries for each query type.

        Returns:
            Dict mapping query_type to list of query strings
            e.g., {"ransom": ["query1", "query2"], "friction": [...]}
        """
        pass

    def _create_signal(
        self,
        id: str,
        content: str,
        url: str,
        timestamp: datetime,
        **kwargs
    ) -> Signal:
        """Helper to create Signal with platform set."""
        return Signal(
            id=id,
            content=content,
            url=url,
            platform=self.platform,
            timestamp=timestamp,
            **kwargs
        )

    def _filter_noise(self, signals: List[Signal]) -> List[Signal]:
        """Remove positive/noise signals."""
        return [s for s in signals if s.severity != SignalSeverity.NOISE]

    def _deduplicate(self, signals: List[Signal]) -> List[Signal]:
        """Remove duplicate signals by ID."""
        seen = set()
        unique = []
        for signal in signals:
            if signal.id not in seen:
                seen.add(signal.id)
                unique.append(signal)
        return unique
