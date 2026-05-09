"""
Hacker News Scraper - Collects stories and comments via Algolia API.

Uses the free HN Algolia API (no auth required).
Extracts: content, points, comments count, author karma.

HN signals are HIGH VALUE - front page = major tech community validation.
"""

import time
import random
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional

from .base import (
    BaseScraper,
    Signal,
    ScraperConfig,
    Platform,
    Author,
    Engagement,
)


class HackerNewsScraper(BaseScraper):
    """
    Hacker News scraper using Algolia API.

    Free API, no authentication required.
    High-authority platform for tech community signals.
    """

    # Algolia HN Search API (free, no auth)
    SEARCH_URL = "https://hn.algolia.com/api/v1/search"
    SEARCH_BY_DATE_URL = "https://hn.algolia.com/api/v1/search_by_date"
    ITEM_URL = "https://hacker-news.firebaseio.com/v0/item/{}.json"
    USER_URL = "https://hacker-news.firebaseio.com/v0/user/{}.json"

    def __init__(self, config: ScraperConfig):
        """Initialize Hacker News scraper."""
        super().__init__(config)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "VultureNest/2.0 (Research Engine)"
        })

    @property
    def platform(self) -> Platform:
        return Platform.HACKER_NEWS

    def _build_queries(self) -> Dict[str, List[str]]:
        """Build HN-specific search queries."""
        target = self.config.target

        queries = {
            "ransom": [
                f'"{target}" pricing',
                f'"{target}" expensive',
                f'"{target}" subscription',
                f'"{target}" cost',
            ],
            "friction": [
                f'"{target}" export',
                f'"{target}" migration',
                f'"{target}" lock-in',
                f'"{target}" API',
            ],
            "migration": [
                f'"{target}" alternative',
                f'"{target}" replacement',
                f'"{target}" switching',
                f'"leaving {target}"',
                f'"moved from {target}"',
            ],
            "crisis": [
                f'"{target}" breach',
                f'"{target}" outage',
                f'"{target}" shutdown',
                f'"{target}" acquired',
                f'"{target}" layoffs',
            ],
        }

        # Filter to only requested query types
        return {k: v for k, v in queries.items() if k in self.config.query_types}

    def scrape(self) -> List[Signal]:
        """
        Execute Hacker News scraping.

        Returns list of Signal objects with engagement metadata.
        """
        print(f"\n[HackerNewsScraper] Scraping for: {self.config.target}")

        all_signals = []
        queries = self._build_queries()

        for query_type, query_list in queries.items():
            print(f"  [{query_type.upper()}] Running {len(query_list)} queries...")

            for query in query_list:
                try:
                    signals = self._search(query, query_type)
                    all_signals.extend(signals)
                    self._stealth_pause(1.0, 2.0)  # HN is lenient

                except Exception as e:
                    print(f"    [ERROR] Query failed: {e}")
                    continue

        # Deduplicate and filter
        unique_signals = self._deduplicate(all_signals)
        filtered_signals = self._filter_noise(unique_signals)

        print(f"[HackerNewsScraper] Total: {len(filtered_signals)} signals (from {len(all_signals)} raw)")

        self.signals = filtered_signals
        return filtered_signals

    def _search(self, query: str, query_type: str) -> List[Signal]:
        """
        Search HN via Algolia API.

        Returns stories and comments matching the query.
        """
        print(f"    [Algolia] {query[:50]}...")

        signals = []

        # Search by relevance
        params = {
            "query": query,
            "tags": "(story,comment)",
            "hitsPerPage": self.config.max_results,
        }

        # Add date filter if specified
        if self.config.days_back:
            timestamp = int((datetime.now() - timedelta(days=self.config.days_back)).timestamp())
            params["numericFilters"] = f"created_at_i>{timestamp}"

        try:
            response = self.session.get(self.SEARCH_URL, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()

            for hit in data.get("hits", []):
                signal = self._parse_hit(hit, query_type)
                if signal:
                    signals.append(signal)

            print(f"    [Algolia] Found {len(signals)} items")

        except requests.RequestException as e:
            print(f"    [Algolia] Request error: {e}")

        return signals

    def _parse_hit(self, hit: Dict, query_type: str) -> Optional[Signal]:
        """Parse Algolia search hit into Signal."""
        try:
            item_id = hit.get("objectID", "")
            item_type = hit.get("_tags", [""])[0]  # "story" or "comment"

            # Get content
            if item_type == "story":
                title = hit.get("title", "")
                content = f"{title}\n{hit.get('story_text', '')}"
                url = hit.get("url", f"https://news.ycombinator.com/item?id={item_id}")
            else:  # comment
                content = hit.get("comment_text", hit.get("text", ""))
                title = ""
                url = f"https://news.ycombinator.com/item?id={item_id}"

            # Skip empty content
            if not content or len(content) < 10:
                return None

            # Parse timestamp
            created_at = hit.get("created_at_i", 0)
            if created_at:
                timestamp = datetime.fromtimestamp(created_at, tz=timezone.utc)
            else:
                timestamp = datetime.now(timezone.utc)

            # Parse author
            author_name = hit.get("author", "")
            author = Author(
                username=author_name,
                karma=0,  # Would need separate API call
            )

            # Parse engagement
            points = hit.get("points", 0) or 0
            num_comments = hit.get("num_comments", 0) or 0

            engagement = Engagement(
                score=points,
                comments=num_comments,
            )

            # Create signal
            signal = self._create_signal(
                id=f"hn_{item_id}",
                content=content,
                url=url,
                timestamp=timestamp,
                author=author,
                engagement=engagement,
                title=title,
                parent_id=hit.get("parent_id", ""),
            )

            return signal

        except Exception as e:
            print(f"      [Parse] Error: {e}")
            return None

    def _get_user_karma(self, username: str) -> int:
        """
        Fetch user karma from HN Firebase API.

        Note: Makes additional API call, use sparingly.
        """
        if not username:
            return 0

        try:
            response = self.session.get(
                self.USER_URL.format(username),
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("karma", 0) if data else 0
        except:
            pass

        return 0

    def _stealth_pause(self, min_sec: float = 1.0, max_sec: float = 2.0):
        """Random pause between requests."""
        pause = random.uniform(min_sec, max_sec)
        time.sleep(pause)

    def calculate_engagement_multiplier(self, signal: Signal) -> float:
        """
        Calculate engagement multiplier for HN signal.

        HN is HIGH AUTHORITY - front page signals are extremely valuable.
        Based on Enhanced Scoring Spec V2:
        - Top of front page (200+ points): 15.0x
        - Front page (100+): 10.0x
        - Rising (50+): 5.0x
        - Notable (10+): 2.0x
        - Normal: 1.0x
        """
        points = signal.engagement.score

        if points >= 200:
            return 15.0  # Top of HN = massive signal
        elif points >= 100:
            return 10.0  # Front page
        elif points >= 50:
            return 5.0   # Rising
        elif points >= 10:
            return 2.0   # Notable
        else:
            return 1.0

    def calculate_author_authority(self, signal: Signal) -> float:
        """
        Calculate author authority multiplier.

        Based on Enhanced Scoring Spec V2 (HN karma):
        - HN veteran (10k+ karma): 4.0x
        - Active member (1k+): 2.0x
        - Normal: 1.0x
        """
        karma = signal.author.karma

        if karma >= 10000:
            return 4.0
        elif karma >= 1000:
            return 2.0
        else:
            return 1.0

    def enrich_signals(self, signals: List[Signal], fetch_karma: bool = False) -> List[Signal]:
        """
        Apply engagement and authority multipliers to all signals.

        Args:
            signals: List of signals to enrich
            fetch_karma: If True, fetch author karma (slow, many API calls)
        """
        for signal in signals:
            # Optionally fetch karma
            if fetch_karma and signal.author.username:
                signal.author.karma = self._get_user_karma(signal.author.username)
                self._stealth_pause(0.5, 1.0)

            signal.engagement_multiplier = self.calculate_engagement_multiplier(signal)
            signal.author_authority = self.calculate_author_authority(signal)
            signal.calculate_weighted_score()

        return signals
