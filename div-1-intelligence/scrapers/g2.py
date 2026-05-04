"""
G2 Reviews Scraper - Collects software reviews from G2.com.

Uses Google site:g2.com search or Apify G2 scraper.
Extracts: review content, star rating, helpful votes, verified status.

G2 signals are HIGH VALUE for enterprise pain - verified buyers.
"""

import os
import time
import random
import re
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional

from apify_client import ApifyClient
from dotenv import load_dotenv

from .base import (
    BaseScraper,
    Signal,
    ScraperConfig,
    Platform,
    Author,
    Engagement,
)

load_dotenv()


class G2Scraper(BaseScraper):
    """
    G2 reviews scraper using Apify.

    Collects software reviews with ratings and helpful votes.
    High-authority signals from verified enterprise buyers.
    """

    # Apify actors
    G2_ACTOR_ID = "epctex/g2-scraper"
    GOOGLE_ACTOR_ID = "apify/google-search-scraper"

    def __init__(self, config: ScraperConfig, use_google_fallback: bool = True):
        """
        Initialize G2 scraper.

        Args:
            config: Scraper configuration
            use_google_fallback: If True, use Google site:g2.com search
        """
        super().__init__(config)
        self.use_google_fallback = use_google_fallback

        token = os.getenv("APIFY_TOKEN")
        if not token:
            raise ValueError("APIFY_TOKEN not found in environment variables")
        self.client = ApifyClient(token)

    @property
    def platform(self) -> Platform:
        return Platform.G2

    def _build_queries(self) -> Dict[str, List[str]]:
        """Build G2-specific search queries."""
        target = self.config.target

        queries = {
            "ransom": [
                f'site:g2.com "{target}" "pricing" (expensive OR overpriced OR costly)',
                f'site:g2.com "{target}" review "too expensive"',
                f'site:g2.com "{target}" cons pricing',
                f'site:g2.com "{target}" "not worth the price"',
            ],
            "friction": [
                f'site:g2.com "{target}" cons (export OR migration OR "data")',
                f'site:g2.com "{target}" review "hard to" (export OR migrate OR switch)',
                f'site:g2.com "{target}" "locked in" OR "vendor lock"',
                f'site:g2.com "{target}" API (limited OR broken OR lacking)',
            ],
            "migration": [
                f'site:g2.com "{target}" "switched to" OR "moved to"',
                f'site:g2.com "{target}" "looking for alternative"',
                f'site:g2.com "{target}" vs alternative',
                f'site:g2.com "{target}" comparison',
            ],
            "crisis": [
                f'site:g2.com "{target}" (outage OR downtime OR unreliable)',
                f'site:g2.com "{target}" support (terrible OR awful OR unresponsive)',
                f'site:g2.com "{target}" (buggy OR broken OR crash)',
            ],
        }

        # Filter to only requested query types
        return {k: v for k, v in queries.items() if k in self.config.query_types}

    def scrape(self) -> List[Signal]:
        """
        Execute G2 scraping.

        Returns list of Signal objects with review metadata.
        """
        print(f"\n[G2Scraper] Scraping for: {self.config.target}")

        all_signals = []
        queries = self._build_queries()

        for query_type, query_list in queries.items():
            print(f"  [{query_type.upper()}] Running {len(query_list)} queries...")

            for query in query_list:
                try:
                    if self.use_google_fallback:
                        signals = self._scrape_via_google(query, query_type)
                    else:
                        signals = self._scrape_native(query_type)

                    all_signals.extend(signals)
                    self._stealth_pause()

                except Exception as e:
                    print(f"    [ERROR] Query failed: {e}")
                    continue

        # Deduplicate and filter
        unique_signals = self._deduplicate(all_signals)
        filtered_signals = self._filter_noise(unique_signals)

        print(f"[G2Scraper] Total: {len(filtered_signals)} signals (from {len(all_signals)} raw)")

        self.signals = filtered_signals
        return filtered_signals

    def _scrape_native(self, query_type: str) -> List[Signal]:
        """
        Scrape using native G2 scraper via Apify.

        Note: Requires Apify G2 actor which may have usage costs.
        """
        target = self.config.target
        print(f"    [Native] Scraping G2 reviews for {target}...")

        # Generate G2 product URL slug
        product_slug = target.lower().replace(" ", "-")

        run_input = {
            "startUrls": [
                {"url": f"https://www.g2.com/products/{product_slug}/reviews"}
            ],
            "maxItems": self.config.max_results,
        }

        try:
            run = self.client.actor(self.G2_ACTOR_ID).call(run_input=run_input)
            items = list(self.client.dataset(run["defaultDatasetId"]).iterate_items())

            signals = []
            for item in items:
                signal = self._parse_review(item, query_type)
                if signal:
                    signals.append(signal)

            print(f"    [Native] Found {len(signals)} reviews")
            return signals

        except Exception as e:
            print(f"    [Native] Error: {e}")
            return []

    def _scrape_via_google(self, query: str, query_type: str) -> List[Signal]:
        """
        Scrape using Google site:g2.com search.

        Free alternative with limited metadata.
        """
        print(f"    [Google] {query[:60]}...")

        run_input = {
            "queries": query,
            "maxPagesPerQuery": 1,
            "resultsPerPage": self.config.max_results,
            "mobileResults": False,
        }

        try:
            run = self.client.actor(self.GOOGLE_ACTOR_ID).call(run_input=run_input)
            items = list(self.client.dataset(run["defaultDatasetId"]).iterate_items())

            signals = []
            for item in items:
                organic_results = item.get("organicResults", [])
                for result in organic_results:
                    signal = self._parse_google_result(result, query_type)
                    if signal:
                        signals.append(signal)

            print(f"    [Google] Found {len(signals)} results")
            return signals

        except Exception as e:
            print(f"    [Google] Error: {e}")
            return []

    def _parse_review(self, item: Dict, query_type: str) -> Optional[Signal]:
        """Parse G2 review into Signal."""
        try:
            review_id = item.get("id", str(hash(item.get("text", ""))))
            content = item.get("text", item.get("review", ""))
            url = item.get("url", "")

            # Get rating (1-5 stars)
            rating = item.get("rating", item.get("stars", 3))
            if isinstance(rating, str):
                rating = int(float(rating))

            # Parse timestamp
            date_str = item.get("date", item.get("reviewDate", ""))
            try:
                if date_str:
                    timestamp = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                else:
                    timestamp = datetime.now(timezone.utc)
            except:
                timestamp = datetime.now(timezone.utc)

            # Parse author
            author_name = item.get("reviewer", item.get("author", ""))
            verified = item.get("verified", item.get("verifiedUser", False))

            author = Author(
                username=author_name if isinstance(author_name, str) else "",
                verified=verified,
            )

            # Parse engagement
            helpful = item.get("helpful", item.get("helpfulVotes", 0))

            engagement = Engagement(
                helpful_votes=helpful,
            )

            # Get pros/cons if available
            pros = item.get("pros", "")
            cons = item.get("cons", "")
            if cons:
                content = f"{content}\n\nCons: {cons}"
            if pros:
                content = f"Pros: {pros}\n\n{content}"

            return self._create_signal(
                id=f"g2_{review_id}",
                content=content,
                url=url,
                timestamp=timestamp,
                author=author,
                engagement=engagement,
                rating=rating,
                verified_purchase=verified,
            )

        except Exception as e:
            print(f"      [Parse] Review error: {e}")
            return None

    def _parse_google_result(self, result: Dict, query_type: str) -> Optional[Signal]:
        """Parse Google search result into Signal (limited metadata)."""
        try:
            url = result.get("url", "")
            if "g2.com" not in url:
                return None

            title = result.get("title", "")
            description = result.get("description", "")
            content = f"{title}\n{description}"

            # Try to extract rating from title/description
            rating = 3  # Default
            rating_match = re.search(r"(\d(?:\.\d)?)\s*(?:/\s*5|stars?|out of 5)", content.lower())
            if rating_match:
                rating = int(float(rating_match.group(1)))

            # Google results don't have full review metadata
            engagement = Engagement(helpful_votes=0)
            author = Author()

            return self._create_signal(
                id=f"g2_g_{hash(url)}",
                content=content,
                url=url,
                timestamp=datetime.now(timezone.utc) - timedelta(days=30),  # Estimate
                author=author,
                engagement=engagement,
                rating=rating,
                title=title,
            )

        except Exception as e:
            print(f"      [Parse] Error: {e}")
            return None

    def _stealth_pause(self, min_sec: float = 2.0, max_sec: float = 5.0):
        """Random pause between requests to avoid rate limiting."""
        pause = random.uniform(min_sec, max_sec)
        print(f"    [Stealth] Pause {pause:.1f}s...")
        time.sleep(pause)

    def calculate_engagement_multiplier(self, signal: Signal) -> float:
        """
        Calculate engagement multiplier for G2 signal.

        Low ratings are HIGH VALUE for pain signals.
        Based on Enhanced Scoring Spec V2:
        - 1 star: 3.0x (major pain)
        - 2 stars: 2.0x (significant pain)
        - 3 stars: 1.0x (mixed)
        - 4 stars: 0.3x (mostly positive)
        - 5 stars: 0.1x (positive noise)

        Helpful votes amplify further:
        - 50+ helpful: 3.0x
        - 10+ helpful: 2.0x
        - 3+ helpful: 1.5x
        """
        rating = signal.rating
        helpful = signal.engagement.helpful_votes

        # Rating multiplier (low = high pain signal)
        rating_mult = {1: 3.0, 2: 2.0, 3: 1.0, 4: 0.3, 5: 0.1}.get(rating, 1.0)

        # Helpful votes multiplier
        if helpful >= 50:
            helpful_mult = 3.0
        elif helpful >= 10:
            helpful_mult = 2.0
        elif helpful >= 3:
            helpful_mult = 1.5
        else:
            helpful_mult = 1.0

        return rating_mult * helpful_mult

    def calculate_author_authority(self, signal: Signal) -> float:
        """
        Calculate author authority multiplier.

        Verified G2 users are more authoritative.
        """
        if signal.verified_purchase or signal.author.verified:
            return 1.5
        return 1.0

    def enrich_signals(self, signals: List[Signal]) -> List[Signal]:
        """Apply engagement and authority multipliers to all signals."""
        for signal in signals:
            signal.engagement_multiplier = self.calculate_engagement_multiplier(signal)
            signal.author_authority = self.calculate_author_authority(signal)
            signal.calculate_weighted_score()
        return signals
