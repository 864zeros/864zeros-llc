"""
Authority Calculator - Score author credibility and influence.

Author authority amplifies signal weight based on:
- Follower count (influencers = high value)
- Verification status
- Account age (established = more credible)
- Platform-specific karma/reputation

Platform-specific thresholds from Enhanced Scoring Spec V2.
"""

from typing import Dict, Optional
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.base import Signal, Platform, Author


class AuthorityCalculator:
    """
    Calculate author authority multipliers for signals.

    Higher authority = signal from influential/credible source.
    Amplifies weight of signals from verified accounts, influencers,
    and established community members.
    """

    # Twitter thresholds
    TWITTER_FOLLOWER_THRESHOLDS = {
        "major_influencer": {"min": 100000, "multiplier": 5.0},
        "micro_influencer": {"min": 10000, "multiplier": 3.0},
        "active_user": {"min": 1000, "multiplier": 1.5},
        "normal": {"min": 0, "multiplier": 1.0},
    }

    # Reddit karma thresholds
    REDDIT_KARMA_THRESHOLDS = {
        "power_user": {"min": 100000, "multiplier": 3.0},
        "active_user": {"min": 10000, "multiplier": 2.0},
        "established": {"min": 1000, "multiplier": 1.5},
        "normal": {"min": 0, "multiplier": 1.0},
    }

    # Hacker News karma thresholds
    HN_KARMA_THRESHOLDS = {
        "veteran": {"min": 10000, "multiplier": 4.0},
        "active": {"min": 1000, "multiplier": 2.0},
        "normal": {"min": 0, "multiplier": 1.0},
    }

    # Account age minimums (days)
    MIN_ACCOUNT_AGE = 7  # Accounts < 7 days old are suspicious

    def calculate(self, signal: Signal) -> float:
        """
        Calculate author authority multiplier for a signal.

        Args:
            signal: Signal to calculate authority for

        Returns:
            Authority multiplier (0.3 - 5.0)
        """
        platform = signal.platform
        author = signal.author

        # Check for suspicious new accounts
        if self._is_suspicious_account(author):
            return 0.3

        if platform == Platform.TWITTER:
            return self._calculate_twitter(author)
        elif platform == Platform.REDDIT:
            return self._calculate_reddit(author)
        elif platform == Platform.HACKER_NEWS:
            return self._calculate_hn(author)
        elif platform in (Platform.G2, Platform.CAPTERRA, Platform.TRUSTPILOT):
            return self._calculate_review(signal)
        else:
            return self._calculate_default(author)

    def _is_suspicious_account(self, author: Author) -> bool:
        """
        Check if account appears suspicious (spam, bot, astroturf).

        New accounts with no history are less credible.
        """
        if author.account_age_days > 0 and author.account_age_days < self.MIN_ACCOUNT_AGE:
            return True
        return False

    def _calculate_twitter(self, author: Author) -> float:
        """Calculate Twitter author authority."""
        # Verified badge = automatic boost
        if author.verified:
            return 5.0

        followers = author.followers_count

        for level, config in self.TWITTER_FOLLOWER_THRESHOLDS.items():
            if followers >= config["min"]:
                return config["multiplier"]

        return 1.0

    def _calculate_reddit(self, author: Author) -> float:
        """Calculate Reddit author authority."""
        karma = author.karma

        # Check account age penalty
        if author.account_age_days > 0 and author.account_age_days < 90:
            # New-ish accounts get reduced authority
            age_factor = min(author.account_age_days / 90, 1.0)
        else:
            age_factor = 1.0

        for level, config in self.REDDIT_KARMA_THRESHOLDS.items():
            if karma >= config["min"]:
                return config["multiplier"] * age_factor

        return 1.0 * age_factor

    def _calculate_hn(self, author: Author) -> float:
        """Calculate Hacker News author authority."""
        karma = author.karma

        for level, config in self.HN_KARMA_THRESHOLDS.items():
            if karma >= config["min"]:
                return config["multiplier"]

        return 1.0

    def _calculate_review(self, signal: Signal) -> float:
        """Calculate review platform author authority."""
        # Verified purchasers are more credible
        if signal.verified_purchase or signal.author.verified:
            return 1.5
        return 1.0

    def _calculate_default(self, author: Author) -> float:
        """Default authority calculation for unknown platforms."""
        if author.verified:
            return 2.0

        followers = author.followers_count
        karma = author.karma

        # Use whichever metric is available
        if followers >= 10000 or karma >= 10000:
            return 2.0
        elif followers >= 1000 or karma >= 1000:
            return 1.5
        else:
            return 1.0

    def apply(self, signal: Signal) -> Signal:
        """
        Calculate and apply authority multiplier to signal.

        Args:
            signal: Signal to enrich

        Returns:
            Signal with author_authority set
        """
        signal.author_authority = self.calculate(signal)
        return signal

    def get_authority_tier(self, signal: Signal) -> str:
        """
        Get human-readable authority tier name.

        Args:
            signal: Signal to evaluate

        Returns:
            Tier name (e.g., "influencer", "power_user", "suspicious")
        """
        # Check suspicious first
        if self._is_suspicious_account(signal.author):
            return "suspicious"

        mult = signal.author_authority or self.calculate(signal)

        if mult >= 4.0:
            return "influencer"
        elif mult >= 2.0:
            return "power_user"
        elif mult >= 1.5:
            return "established"
        elif mult >= 1.0:
            return "normal"
        else:
            return "low_credibility"

    def get_author_summary(self, signal: Signal) -> Dict:
        """
        Get detailed author summary for a signal.

        Args:
            signal: Signal to summarize

        Returns:
            Dict with author details and authority info
        """
        author = signal.author

        return {
            "username": author.username,
            "followers": author.followers_count,
            "karma": author.karma,
            "verified": author.verified,
            "account_age_days": author.account_age_days,
            "authority_multiplier": self.calculate(signal),
            "authority_tier": self.get_authority_tier(signal),
            "is_suspicious": self._is_suspicious_account(author),
        }
