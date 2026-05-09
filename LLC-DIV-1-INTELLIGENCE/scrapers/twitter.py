"""
Twitter/X Scraper - Collects tweets with full engagement metadata.

Uses Apify Twitter Scraper actor to fetch tweets matching pain queries.
Extracts: content, likes, retweets, replies, author followers, verified status.
"""

import os
import time
import random
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


class TwitterScraper(BaseScraper):
    """
    Twitter/X scraper using Apify.

    Collects tweets with engagement metrics for pain signal analysis.
    Supports multiple query types: ransom, friction, migration, crisis.
    """

    # Apify actor for Twitter search
    ACTOR_ID = "apify/twitter-scraper"

    # Alternative: Use Google site search (free, less metadata)
    GOOGLE_ACTOR_ID = "apify/google-search-scraper"

    def __init__(self, config: ScraperConfig, use_google_fallback: bool = True):
        """
        Initialize Twitter scraper.

        Args:
            config: Scraper configuration
            use_google_fallback: If True, use Google site:twitter.com search
                                 (free but less metadata)
        """
        super().__init__(config)
        self.use_google_fallback = use_google_fallback

        token = os.getenv("APIFY_TOKEN")
        if not token:
            raise ValueError("APIFY_TOKEN not found in environment variables")
        self.client = ApifyClient(token)

    @property
    def platform(self) -> Platform:
        return Platform.TWITTER

    def _build_queries(self) -> Dict[str, List[str]]:
        """Build Twitter-specific search queries."""
        target = self.config.target
        days_back = self.config.days_back

        # Calculate date filter
        since_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")

        queries = {
            "ransom": [
                f'"{target}" (expensive OR overpriced OR "rip off" OR "price hike") -is:retweet lang:en',
                f'"{target}" ("can\'t afford" OR "too expensive" OR "not worth") -is:retweet lang:en',
                f'"{target}" pricing (angry OR frustrated OR ridiculous) -is:retweet lang:en',
                f'"{target}" subscription (cancel OR hate OR scam) -is:retweet lang:en',
            ],
            "friction": [
                f'"{target}" (locked in OR "can\'t export" OR "data hostage") -is:retweet lang:en',
                f'"{target}" (migration OR switching OR "moving away") -is:retweet lang:en',
                f'"{target}" API (broken OR limited OR deprecated) -is:retweet lang:en',
                f'"{target}" export (impossible OR difficult OR frustrated) -is:retweet lang:en',
            ],
            "migration": [
                f'"{target}" ("switching to" OR "moved to" OR "migrated to") -is:retweet lang:en',
                f'"{target}" ("looking for alternative" OR "need replacement") -is:retweet lang:en',
                f'"leaving {target}" OR "left {target}" OR "quit {target}" -is:retweet lang:en',
                f'"ditched {target}" OR "dumped {target}" OR "dropped {target}" -is:retweet lang:en',
            ],
            "crisis": [
                f'"{target}" (breach OR hack OR "data leak") -is:retweet lang:en',
                f'"{target}" (outage OR "down again" OR unreliable) -is:retweet lang:en',
                f'"{target}" (layoffs OR "shutting down" OR sunset) -is:retweet lang:en',
                f'"{target}" (acquired OR acquisition) -is:retweet lang:en',
            ],
        }

        # Filter to only requested query types
        return {k: v for k, v in queries.items() if k in self.config.query_types}

    def scrape(self) -> List[Signal]:
        """
        Execute Twitter scraping.

        Returns list of Signal objects with engagement metadata.
        """
        print(f"\n[TwitterScraper] Scraping for: {self.config.target}")

        all_signals = []
        queries = self._build_queries()

        for query_type, query_list in queries.items():
            print(f"  [{query_type.upper()}] Running {len(query_list)} queries...")

            for query in query_list:
                try:
                    if self.use_google_fallback:
                        signals = self._scrape_via_google(query, query_type)
                    else:
                        signals = self._scrape_native(query, query_type)

                    all_signals.extend(signals)
                    self._stealth_pause()

                except Exception as e:
                    print(f"    [ERROR] Query failed: {e}")
                    continue

        # Deduplicate and filter
        unique_signals = self._deduplicate(all_signals)
        filtered_signals = self._filter_noise(unique_signals)

        print(f"[TwitterScraper] Total: {len(filtered_signals)} signals (from {len(all_signals)} raw)")

        self.signals = filtered_signals
        return filtered_signals

    def _scrape_native(self, query: str, query_type: str) -> List[Signal]:
        """
        Scrape using native Twitter API via Apify.

        Note: This requires Twitter API access through Apify.
        Returns full engagement metadata.
        """
        print(f"    [Native] {query[:50]}...")

        run_input = {
            "searchTerms": [query],
            "maxTweets": self.config.max_results,
            "addUserInfo": True,
            "scrapeTweetReplies": self.config.include_replies,
        }

        try:
            run = self.client.actor(self.ACTOR_ID).call(run_input=run_input)
            items = list(self.client.dataset(run["defaultDatasetId"]).iterate_items())

            signals = []
            for item in items:
                signal = self._parse_native_tweet(item, query_type)
                if signal:
                    signals.append(signal)

            print(f"    [Native] Found {len(signals)} tweets")
            return signals

        except Exception as e:
            print(f"    [Native] Error: {e}")
            return []

    def _scrape_via_google(self, query: str, query_type: str) -> List[Signal]:
        """
        Scrape using Google site:twitter.com search.

        Free alternative with less metadata but good for discovery.
        """
        # Convert Twitter query to Google query
        google_query = f"site:twitter.com {query.replace('-is:retweet', '').replace('lang:en', '')}"
        print(f"    [Google] {google_query[:60]}...")

        run_input = {
            "queries": google_query,
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

    def _parse_native_tweet(self, item: Dict, query_type: str) -> Optional[Signal]:
        """Parse native Twitter API response into Signal."""
        try:
            tweet_id = item.get("id", "")
            text = item.get("text", item.get("full_text", ""))
            url = item.get("url", f"https://twitter.com/i/status/{tweet_id}")

            # Parse timestamp
            created_at = item.get("createdAt", item.get("created_at", ""))
            if created_at:
                try:
                    timestamp = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                except:
                    timestamp = datetime.now(timezone.utc)
            else:
                timestamp = datetime.now(timezone.utc)

            # Parse author
            user = item.get("user", item.get("author", {}))
            author = Author(
                id=str(user.get("id", "")),
                username=user.get("username", user.get("screen_name", "")),
                display_name=user.get("name", ""),
                followers_count=user.get("followers_count", user.get("followersCount", 0)),
                verified=user.get("verified", user.get("isVerified", False)),
            )

            # Parse engagement
            engagement = Engagement(
                likes=item.get("favorite_count", item.get("likeCount", 0)),
                retweets=item.get("retweet_count", item.get("retweetCount", 0)),
                replies=item.get("reply_count", item.get("replyCount", 0)),
            )

            return self._create_signal(
                id=f"tw_{tweet_id}",
                content=text,
                url=url,
                timestamp=timestamp,
                author=author,
                engagement=engagement,
            )

        except Exception as e:
            print(f"      [Parse] Error: {e}")
            return None

    def _parse_google_result(self, result: Dict, query_type: str) -> Optional[Signal]:
        """Parse Google search result into Signal (limited metadata)."""
        try:
            url = result.get("url", "")
            if "twitter.com" not in url and "x.com" not in url:
                return None

            title = result.get("title", "")
            description = result.get("description", "")
            content = f"{title} {description}"

            # Extract tweet ID from URL
            tweet_id = ""
            if "/status/" in url:
                parts = url.split("/status/")
                if len(parts) > 1:
                    tweet_id = parts[1].split("?")[0].split("/")[0]

            # Extract username from URL
            username = ""
            if "twitter.com/" in url or "x.com/" in url:
                parts = url.replace("https://", "").replace("http://", "").split("/")
                if len(parts) > 1:
                    username = parts[1]

            # Google results don't have engagement data
            # We'll estimate based on whether it ranks highly
            engagement = Engagement(
                likes=0,  # Unknown
                retweets=0,
                replies=0,
            )

            author = Author(
                username=username,
            )

            return self._create_signal(
                id=f"tw_g_{tweet_id or hash(url)}",
                content=content,
                url=url,
                timestamp=datetime.now(timezone.utc) - timedelta(days=30),  # Estimate
                author=author,
                engagement=engagement,
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
        Calculate engagement multiplier for a Twitter signal.

        Based on Enhanced Scoring Spec V2:
        - Viral (1000+ engagement): 10x
        - High (500+): 5x
        - Notable (100+): 3x
        - Above average (25+): 1.5x
        - Normal (5+): 1.0x
        - Low (<5): 0.5x
        """
        total = signal.engagement.total

        if total >= 1000:
            return 10.0
        elif total >= 500:
            return 5.0
        elif total >= 100:
            return 3.0
        elif total >= 25:
            return 1.5
        elif total >= 5:
            return 1.0
        else:
            return 0.5

    def calculate_author_authority(self, signal: Signal) -> float:
        """
        Calculate author authority multiplier.

        Based on Enhanced Scoring Spec V2:
        - Verified or 100k+ followers: 5.0x
        - 10k+ followers: 3.0x
        - 1k+ followers: 1.5x
        - Normal: 1.0x
        """
        followers = signal.author.followers_count
        verified = signal.author.verified

        if verified or followers >= 100000:
            return 5.0
        elif followers >= 10000:
            return 3.0
        elif followers >= 1000:
            return 1.5
        else:
            return 1.0

    def enrich_signals(self, signals: List[Signal]) -> List[Signal]:
        """Apply engagement and authority multipliers to all signals."""
        for signal in signals:
            signal.engagement_multiplier = self.calculate_engagement_multiplier(signal)
            signal.author_authority = self.calculate_author_authority(signal)
            signal.calculate_weighted_score()
        return signals
