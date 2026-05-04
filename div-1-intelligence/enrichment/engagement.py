"""
Engagement Calculator - Compute engagement multipliers for signals.

Engagement multipliers amplify signal weight based on social proof:
- Viral content (many likes/retweets) = high signal value
- Buried content (few interactions) = low signal value

Platform-specific thresholds from Enhanced Scoring Spec V2.
"""

from typing import Dict, Optional
import sys
import os

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.base import Signal, Platform


class EngagementCalculator:
    """
    Calculate engagement multipliers for signals.

    Multipliers amplify signal weight based on social proof metrics
    like likes, retweets, upvotes, and helpful votes.
    """

    # Platform-specific thresholds (from Enhanced Scoring Spec V2)
    TWITTER_THRESHOLDS = {
        "viral": {"min": 1000, "multiplier": 10.0},
        "high": {"min": 500, "multiplier": 5.0},
        "notable": {"min": 100, "multiplier": 3.0},
        "above_avg": {"min": 25, "multiplier": 1.5},
        "normal": {"min": 5, "multiplier": 1.0},
        "low": {"min": 0, "multiplier": 0.5},
    }

    REDDIT_POST_THRESHOLDS = {
        "front_page": {"min": 500, "multiplier": 8.0},
        "popular": {"min": 100, "multiplier": 4.0},
        "notable": {"min": 25, "multiplier": 2.0},
        "normal": {"min": 5, "multiplier": 1.0},
        "buried": {"min": 0, "multiplier": 0.3},
    }

    REDDIT_COMMENT_THRESHOLDS = {
        "top": {"min": 100, "multiplier": 5.0},
        "popular": {"min": 25, "multiplier": 2.5},
        "normal": {"min": 5, "multiplier": 1.0},
        "low": {"min": 0, "multiplier": 0.5},
    }

    HN_THRESHOLDS = {
        "top_front_page": {"min": 200, "multiplier": 15.0},
        "front_page": {"min": 100, "multiplier": 10.0},
        "rising": {"min": 50, "multiplier": 5.0},
        "notable": {"min": 10, "multiplier": 2.0},
        "normal": {"min": 0, "multiplier": 1.0},
    }

    G2_RATING_MULTIPLIERS = {
        1: 3.0,  # 1-star = major pain signal
        2: 2.0,  # 2-star = significant pain
        3: 1.0,  # 3-star = mixed
        4: 0.3,  # 4-star = mostly positive
        5: 0.1,  # 5-star = positive noise
    }

    G2_HELPFUL_THRESHOLDS = {
        "very_helpful": {"min": 50, "multiplier": 3.0},
        "helpful": {"min": 10, "multiplier": 2.0},
        "somewhat": {"min": 3, "multiplier": 1.5},
        "normal": {"min": 0, "multiplier": 1.0},
    }

    def calculate(self, signal: Signal) -> float:
        """
        Calculate engagement multiplier for a signal.

        Args:
            signal: Signal to calculate multiplier for

        Returns:
            Engagement multiplier (0.1 - 15.0)
        """
        platform = signal.platform

        if platform == Platform.TWITTER:
            return self._calculate_twitter(signal)
        elif platform == Platform.REDDIT:
            return self._calculate_reddit(signal)
        elif platform == Platform.HACKER_NEWS:
            return self._calculate_hn(signal)
        elif platform == Platform.G2:
            return self._calculate_g2(signal)
        elif platform == Platform.CAPTERRA:
            return self._calculate_review(signal)
        elif platform == Platform.PRODUCT_HUNT:
            return self._calculate_product_hunt(signal)
        else:
            return self._calculate_default(signal)

    def _calculate_twitter(self, signal: Signal) -> float:
        """Calculate Twitter engagement multiplier."""
        engagement = signal.engagement
        total = engagement.likes + (engagement.retweets * 2) + int(engagement.replies * 1.5)

        for level, config in self.TWITTER_THRESHOLDS.items():
            if total >= config["min"]:
                return config["multiplier"]

        return 0.5  # Default low

    def _calculate_reddit(self, signal: Signal) -> float:
        """Calculate Reddit engagement multiplier."""
        score = signal.engagement.score
        is_post = signal.id.startswith("rd_p_")

        thresholds = self.REDDIT_POST_THRESHOLDS if is_post else self.REDDIT_COMMENT_THRESHOLDS

        for level, config in thresholds.items():
            if score >= config["min"]:
                return config["multiplier"]

        return 0.3  # Default buried

    def _calculate_hn(self, signal: Signal) -> float:
        """Calculate Hacker News engagement multiplier."""
        points = signal.engagement.score

        for level, config in self.HN_THRESHOLDS.items():
            if points >= config["min"]:
                return config["multiplier"]

        return 1.0  # Default normal

    def _calculate_g2(self, signal: Signal) -> float:
        """Calculate G2 engagement multiplier."""
        # Rating multiplier (inverted - low ratings = high pain signal)
        rating = signal.rating or 3
        rating_mult = self.G2_RATING_MULTIPLIERS.get(rating, 1.0)

        # Helpful votes multiplier
        helpful = signal.engagement.helpful_votes
        helpful_mult = 1.0

        for level, config in self.G2_HELPFUL_THRESHOLDS.items():
            if helpful >= config["min"]:
                helpful_mult = config["multiplier"]
                break

        return rating_mult * helpful_mult

    def _calculate_review(self, signal: Signal) -> float:
        """Calculate generic review platform multiplier (Capterra, TrustPilot)."""
        # Same logic as G2
        return self._calculate_g2(signal)

    def _calculate_product_hunt(self, signal: Signal) -> float:
        """Calculate Product Hunt engagement multiplier."""
        # Similar to HN but lower ceiling
        votes = signal.engagement.score

        if votes >= 100:
            return 5.0
        elif votes >= 50:
            return 3.0
        elif votes >= 20:
            return 2.0
        elif votes >= 5:
            return 1.0
        else:
            return 0.5

    def _calculate_default(self, signal: Signal) -> float:
        """Default engagement calculation for unknown platforms."""
        engagement = signal.engagement
        total = engagement.likes + engagement.score + engagement.helpful_votes

        if total >= 100:
            return 3.0
        elif total >= 25:
            return 2.0
        elif total >= 5:
            return 1.0
        else:
            return 0.5

    def apply(self, signal: Signal) -> Signal:
        """
        Calculate and apply engagement multiplier to signal.

        Args:
            signal: Signal to enrich

        Returns:
            Signal with engagement_multiplier set
        """
        signal.engagement_multiplier = self.calculate(signal)
        return signal

    def get_engagement_tier(self, signal: Signal) -> str:
        """
        Get human-readable engagement tier name.

        Args:
            signal: Signal to evaluate

        Returns:
            Tier name (e.g., "viral", "front_page", "buried")
        """
        mult = signal.engagement_multiplier or self.calculate(signal)

        if mult >= 10.0:
            return "viral"
        elif mult >= 5.0:
            return "high"
        elif mult >= 2.0:
            return "notable"
        elif mult >= 1.0:
            return "normal"
        else:
            return "low"
