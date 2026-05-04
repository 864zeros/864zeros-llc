"""
Reddit Scraper - Collects posts and comments with full engagement metadata.

Uses Apify Reddit Scraper or Google site:reddit.com search.
Extracts: content, upvotes, comments count, author karma, subreddit.
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


class RedditScraper(BaseScraper):
    """
    Reddit scraper using Apify.

    Collects posts and comments with upvote scores and author karma.
    Targets subreddits and site-wide search.
    """

    # Apify actors
    REDDIT_ACTOR_ID = "trudax/reddit-scraper"
    GOOGLE_ACTOR_ID = "apify/google-search-scraper"

    # High-value subreddits for SaaS complaints
    TARGET_SUBREDDITS = [
        "selfhosted",
        "degoogle",
        "privacy",
        "software",
        "sysadmin",
        "webdev",
        "programming",
        "technology",
        "startups",
        "SaaS",
    ]

    def __init__(self, config: ScraperConfig, use_google_fallback: bool = True):
        """
        Initialize Reddit scraper.

        Args:
            config: Scraper configuration
            use_google_fallback: If True, use Google site:reddit.com search
        """
        super().__init__(config)
        self.use_google_fallback = use_google_fallback

        token = os.getenv("APIFY_TOKEN")
        if not token:
            raise ValueError("APIFY_TOKEN not found in environment variables")
        self.client = ApifyClient(token)

    @property
    def platform(self) -> Platform:
        return Platform.REDDIT

    def _build_queries(self) -> Dict[str, List[str]]:
        """Build Reddit-specific search queries."""
        target = self.config.target

        queries = {
            "ransom": [
                f'site:reddit.com "{target}" (expensive OR overpriced OR "price increase")',
                f'site:reddit.com "{target}" (cheaper alternative OR "free alternative")',
                f'site:reddit.com "{target}" subscription (hate OR cancel OR ridiculous)',
                f'site:reddit.com "{target}" pricing (frustrating OR unfair OR scam)',
            ],
            "friction": [
                f'site:reddit.com "{target}" (export OR migrate OR "move data")',
                f'site:reddit.com "{target}" ("locked in" OR "vendor lock" OR "can\'t leave")',
                f'site:reddit.com "{target}" API (broken OR limited OR deprecated)',
                f'site:reddit.com "{target}" (import OR export) (impossible OR difficult)',
            ],
            "migration": [
                f'site:reddit.com "{target}" "what should I switch to"',
                f'site:reddit.com "{target}" "best alternative"',
                f'site:reddit.com "migrating from {target}"',
                f'site:reddit.com "leaving {target}" OR "left {target}"',
                f'site:reddit.com "switching from {target}" OR "switched from {target}"',
                f'site:reddit.com "{target}" alternative self-hosted',
            ],
            "crisis": [
                f'site:reddit.com "{target}" (breach OR hack OR "data leak")',
                f'site:reddit.com "{target}" (outage OR down OR unreliable)',
                f'site:reddit.com "{target}" (shutdown OR sunset OR "end of life")',
                f'site:reddit.com "{target}" (acquired OR acquisition OR "sold to")',
            ],
        }

        # Filter to only requested query types
        return {k: v for k, v in queries.items() if k in self.config.query_types}

    def scrape(self) -> List[Signal]:
        """
        Execute Reddit scraping.

        Returns list of Signal objects with engagement metadata.
        """
        print(f"\n[RedditScraper] Scraping for: {self.config.target}")

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

        print(f"[RedditScraper] Total: {len(filtered_signals)} signals (from {len(all_signals)} raw)")

        self.signals = filtered_signals
        return filtered_signals

    def _scrape_native(self, query: str, query_type: str) -> List[Signal]:
        """
        Scrape using native Reddit API via Apify.

        Returns full engagement metadata including upvotes and author karma.
        """
        # Extract search term from Google query format
        search_term = query.replace("site:reddit.com ", "").strip('"')
        print(f"    [Native] {search_term[:50]}...")

        run_input = {
            "searches": [search_term],
            "maxItems": self.config.max_results,
            "maxPostCount": self.config.max_results,
            "maxComments": 10 if self.config.include_comments else 0,
            "proxy": {"useApifyProxy": True},
        }

        try:
            run = self.client.actor(self.REDDIT_ACTOR_ID).call(run_input=run_input)
            items = list(self.client.dataset(run["defaultDatasetId"]).iterate_items())

            signals = []
            for item in items:
                # Handle both posts and comments
                if item.get("type") == "comment":
                    signal = self._parse_comment(item, query_type)
                else:
                    signal = self._parse_post(item, query_type)

                if signal:
                    signals.append(signal)

            print(f"    [Native] Found {len(signals)} items")
            return signals

        except Exception as e:
            print(f"    [Native] Error: {e}")
            return []

    def _scrape_via_google(self, query: str, query_type: str) -> List[Signal]:
        """
        Scrape using Google site:reddit.com search.

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

    def _parse_post(self, item: Dict, query_type: str) -> Optional[Signal]:
        """Parse Reddit post into Signal."""
        try:
            post_id = item.get("id", "")
            title = item.get("title", "")
            body = item.get("body", item.get("selftext", ""))
            content = f"{title}\n{body}".strip()
            url = item.get("url", item.get("permalink", ""))

            if not url.startswith("http"):
                url = f"https://reddit.com{url}"

            # Parse timestamp
            created_utc = item.get("createdAt", item.get("created_utc", 0))
            if isinstance(created_utc, (int, float)):
                timestamp = datetime.fromtimestamp(created_utc, tz=timezone.utc)
            else:
                try:
                    timestamp = datetime.fromisoformat(str(created_utc).replace("Z", "+00:00"))
                except:
                    timestamp = datetime.now(timezone.utc)

            # Parse author
            author_data = item.get("author", {})
            if isinstance(author_data, str):
                author = Author(username=author_data)
            else:
                author = Author(
                    id=str(author_data.get("id", "")),
                    username=author_data.get("name", author_data.get("username", "")),
                    karma=author_data.get("karma", author_data.get("total_karma", 0)),
                )

            # Parse engagement
            engagement = Engagement(
                score=item.get("score", item.get("ups", 0)),
                comments=item.get("numberOfComments", item.get("num_comments", 0)),
            )

            # Extract subreddit
            subreddit = item.get("subreddit", item.get("subredditName", ""))
            if isinstance(subreddit, dict):
                subreddit = subreddit.get("name", "")

            return self._create_signal(
                id=f"rd_p_{post_id}",
                content=content,
                url=url,
                timestamp=timestamp,
                author=author,
                engagement=engagement,
                title=title,
                subreddit=subreddit,
            )

        except Exception as e:
            print(f"      [Parse] Post error: {e}")
            return None

    def _parse_comment(self, item: Dict, query_type: str) -> Optional[Signal]:
        """Parse Reddit comment into Signal."""
        try:
            comment_id = item.get("id", "")
            content = item.get("body", item.get("text", ""))
            url = item.get("permalink", "")

            if not url.startswith("http"):
                url = f"https://reddit.com{url}"

            # Parse timestamp
            created_utc = item.get("createdAt", item.get("created_utc", 0))
            if isinstance(created_utc, (int, float)):
                timestamp = datetime.fromtimestamp(created_utc, tz=timezone.utc)
            else:
                try:
                    timestamp = datetime.fromisoformat(str(created_utc).replace("Z", "+00:00"))
                except:
                    timestamp = datetime.now(timezone.utc)

            # Parse author
            author_data = item.get("author", {})
            if isinstance(author_data, str):
                author = Author(username=author_data)
            else:
                author = Author(
                    username=author_data.get("name", ""),
                    karma=author_data.get("karma", 0),
                )

            # Parse engagement
            engagement = Engagement(
                score=item.get("score", item.get("ups", 0)),
            )

            return self._create_signal(
                id=f"rd_c_{comment_id}",
                content=content,
                url=url,
                timestamp=timestamp,
                author=author,
                engagement=engagement,
                parent_id=item.get("parentId", item.get("parent_id", "")),
            )

        except Exception as e:
            print(f"      [Parse] Comment error: {e}")
            return None

    def _parse_google_result(self, result: Dict, query_type: str) -> Optional[Signal]:
        """Parse Google search result into Signal (limited metadata)."""
        try:
            url = result.get("url", "")
            if "reddit.com" not in url:
                return None

            title = result.get("title", "")
            description = result.get("description", "")
            content = f"{title}\n{description}"

            # Extract post ID from URL
            post_id = ""
            if "/comments/" in url:
                parts = url.split("/comments/")
                if len(parts) > 1:
                    post_id = parts[1].split("/")[0]

            # Extract subreddit from URL
            subreddit = ""
            if "/r/" in url:
                parts = url.split("/r/")
                if len(parts) > 1:
                    subreddit = parts[1].split("/")[0]

            # Google results don't have engagement data
            engagement = Engagement(score=0)
            author = Author()

            return self._create_signal(
                id=f"rd_g_{post_id or hash(url)}",
                content=content,
                url=url,
                timestamp=datetime.now(timezone.utc) - timedelta(days=30),  # Estimate
                author=author,
                engagement=engagement,
                title=title,
                subreddit=subreddit,
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
        Calculate engagement multiplier for a Reddit signal.

        Based on Enhanced Scoring Spec V2:
        - Front page (500+ score): 8.0x
        - Popular (100+): 4.0x
        - Notable (25+): 2.0x
        - Normal (5+): 1.0x
        - Buried (<5): 0.3x
        """
        score = signal.engagement.score
        is_post = signal.id.startswith("rd_p_")

        if is_post:
            if score >= 500:
                return 8.0
            elif score >= 100:
                return 4.0
            elif score >= 25:
                return 2.0
            elif score >= 5:
                return 1.0
            else:
                return 0.3
        else:  # Comment
            if score >= 100:
                return 5.0
            elif score >= 25:
                return 2.5
            elif score >= 5:
                return 1.0
            else:
                return 0.5

    def calculate_author_authority(self, signal: Signal) -> float:
        """
        Calculate author authority multiplier.

        Based on Enhanced Scoring Spec V2 (Reddit karma):
        - Power user (100k+ karma): 3.0x
        - Active user (10k+): 2.0x
        - Established (1k+): 1.5x
        - New account (<7 days): 0.3x
        - Normal: 1.0x
        """
        karma = signal.author.karma
        age_days = signal.author.account_age_days

        if age_days > 0 and age_days < 7:
            return 0.3  # Possible spam
        elif karma >= 100000:
            return 3.0
        elif karma >= 10000:
            return 2.0
        elif karma >= 1000:
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
