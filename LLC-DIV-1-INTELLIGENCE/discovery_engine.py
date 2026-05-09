# discovery_engine.py
"""
The Cynical Scraper - Vulture-Nest Discovery Engine

This module implements autonomous discovery of market gaps through:
1. Community Scraper: Reddit/X/Forums for "Negative Utility Signals"
2. Market-Cap Arbitrage: Legacy software with high traffic, low maintenance

NO FALSE OPTIMISM. Every discovery is treated as suspicious until validated.
"""
import os
import re
import sys
import json
import time
import random
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set
from validator import LeadCandidate


# =============================================================================
# CONSTANTS
# =============================================================================
NEGATIVE_UTILITY_TRIGGERS = [
    '"{incumbent}" how do I export',
    '"{incumbent}" export data',
    '"{incumbent}" alternatives {year}',
    '"{incumbent}" privacy concerns',
    '"{incumbent}" data privacy',
    '"{incumbent}" not working',
    '"{incumbent}" broken',
    '"{incumbent}" frustrating',
    '"{incumbent}" slow',
    '"{incumbent}" switched from',
    '"{incumbent}" moved away from',
    '"{incumbent}" replacement',
]

PAIN_KEYWORDS = [
    "frustrating", "annoying", "broken", "doesn't work", "can't",
    "missing", "lacks", "wish", "hate", "slow", "buggy", "crash",
    "sync", "backup", "lost", "disappeared", "limitation", "expensive",
    "overpriced", "bloat", "bloated",
    "privacy", "security", "export", "import", "lock-in", "abandoned"
]

# Categories to scan for opportunities
DISCOVERY_CATEGORIES = [
    "chrome extension",
    "micro-saas",
    "productivity app",
    "developer tool",
    "mobile app",
    "ai_agent_ui",
    "knowledge_mgmt",
]

# Known high-traffic incumbents to scan (the "carcasses")
# PRIORITY: Unbundling targets - cloud subscriptions replaceable by local-first
KNOWN_CARCASSES = [
    # === PRIORITY UNBUNDLING TARGETS (Isenberg Delta) ===
    # High-value cloud subscriptions that can be local-first
    {"name": "Evernote", "category": "chrome extension", "estimated_traffic": 4000000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},
    {"name": "LastPass", "category": "chrome extension", "estimated_traffic": 10000000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},
    {"name": "Grammarly", "category": "chrome extension", "estimated_traffic": 30000000,
     "unbundle_potential": "medium", "cloud_dependency": "ai_processing", "local_first_viable": "partial"},
    {"name": "1Password", "category": "chrome extension", "estimated_traffic": 5000000,
     "unbundle_potential": "high", "cloud_dependency": "sync", "local_first_viable": True},
    {"name": "Bitwarden", "category": "chrome extension", "estimated_traffic": 3000000,
     "unbundle_potential": "medium", "cloud_dependency": "optional", "local_first_viable": True},
    {"name": "Dashlane", "category": "chrome extension", "estimated_traffic": 2000000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},
    {"name": "Roam Research", "category": "micro-saas", "estimated_traffic": 500000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},
    {"name": "Todoist", "category": "micro-saas", "estimated_traffic": 8000000,
     "unbundle_potential": "medium", "cloud_dependency": "sync", "local_first_viable": True},
    {"name": "Raindrop.io", "category": "chrome extension", "estimated_traffic": 500000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},
    {"name": "Instapaper", "category": "chrome extension", "estimated_traffic": 1000000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},

    # === STANDARD CARCASSES ===
    # Chrome Extensions
    {"name": "OneTab", "category": "chrome extension", "estimated_traffic": 2100000},
    {"name": "Evernote Web Clipper", "category": "chrome extension", "estimated_traffic": 4000000},
    {"name": "Honey", "category": "chrome extension", "estimated_traffic": 17000000},
    {"name": "AdBlock", "category": "chrome extension", "estimated_traffic": 65000000},
    {"name": "Momentum", "category": "chrome extension", "estimated_traffic": 3000000},
    {"name": "Web Highlights", "category": "chrome extension", "estimated_traffic": 100000},
    {"name": "Session Buddy", "category": "chrome extension", "estimated_traffic": 1000000},
    {"name": "Tab Manager Plus", "category": "chrome extension", "estimated_traffic": 500000},
    # Micro-SaaS
    {"name": "Calendly", "category": "micro-saas", "estimated_traffic": 8000000},
    {"name": "Loom", "category": "micro-saas", "estimated_traffic": 5000000},
    {"name": "Notion", "category": "micro-saas", "estimated_traffic": 30000000},
    {"name": "Airtable", "category": "micro-saas", "estimated_traffic": 5000000},
    {"name": "Zapier", "category": "micro-saas", "estimated_traffic": 10000000},
    {"name": "Carrd", "category": "micro-saas", "estimated_traffic": 2000000},
    {"name": "Gumroad", "category": "micro-saas", "estimated_traffic": 3000000},
    {"name": "ConvertKit", "category": "micro-saas", "estimated_traffic": 2000000},
    # Developer Tools
    {"name": "Postman", "category": "developer tool", "estimated_traffic": 15000000},
    {"name": "Figma", "category": "developer tool", "estimated_traffic": 20000000},
    {"name": "GitHub Copilot", "category": "developer tool", "estimated_traffic": 5000000},

    # === AI AGENT UI VERTICAL (added 2026-05-06) ===
    # Hosted UIs / no-code builders for LLM agents — emerging category, sparse review-site coverage
    {"name": "CrewAI Studio", "category": "ai_agent_ui", "estimated_traffic": 80000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},
    {"name": "AgentGPT", "category": "ai_agent_ui", "estimated_traffic": 500000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},
    {"name": "AutoGen Studio", "category": "ai_agent_ui", "estimated_traffic": 120000,
     "unbundle_potential": "medium", "cloud_dependency": "optional", "local_first_viable": True},
    {"name": "LangFlow", "category": "ai_agent_ui", "estimated_traffic": 250000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},
    {"name": "Flowise", "category": "ai_agent_ui", "estimated_traffic": 200000,
     "unbundle_potential": "medium", "cloud_dependency": "optional", "local_first_viable": True},
    {"name": "Stack AI", "category": "ai_agent_ui", "estimated_traffic": 90000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},
    {"name": "Botpress", "category": "ai_agent_ui", "estimated_traffic": 600000,
     "unbundle_potential": "medium", "cloud_dependency": "core", "local_first_viable": "partial"},

    # === KNOWLEDGE MANAGEMENT VERTICAL (added 2026-05-06) ===
    # Modern KM tools — distinct from the older Evernote/Roam/Notion entries above
    {"name": "Mem.ai", "category": "knowledge_mgmt", "estimated_traffic": 200000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},
    {"name": "Tana", "category": "knowledge_mgmt", "estimated_traffic": 150000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},
    {"name": "Reflect.app", "category": "knowledge_mgmt", "estimated_traffic": 80000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},
    {"name": "Capacities", "category": "knowledge_mgmt", "estimated_traffic": 100000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},
    {"name": "Heptabase", "category": "knowledge_mgmt", "estimated_traffic": 70000,
     "unbundle_potential": "high", "cloud_dependency": "core", "local_first_viable": True},
    {"name": "Logseq Sync", "category": "knowledge_mgmt", "estimated_traffic": 50000,
     "unbundle_potential": "high", "cloud_dependency": "sync", "local_first_viable": True},
    {"name": "Obsidian Sync", "category": "knowledge_mgmt", "estimated_traffic": 300000,
     "unbundle_potential": "high", "cloud_dependency": "sync", "local_first_viable": True},
]

# Exclusion list - already analyzed or built
EXCLUSION_FILE = "analyzed_hosts.json"


@dataclass
class DiscoverySignal:
    """A single pain signal discovered from scraping."""
    source: str  # reddit, twitter, forum, review_site
    content: str
    url: Optional[str] = None
    keyword: Optional[str] = None
    sentiment_score: float = 50.0  # 0-100, lower = more negative
    engagement: int = 0  # upvotes, likes, etc.
    timestamp: Optional[str] = None


@dataclass
class CarcassProfile:
    """Profile of an incumbent being analyzed."""
    name: str
    category: str
    traffic_monthly: int = 0
    last_update_months: int = 0
    sentiment_score: float = 50.0
    pain_signals: List[DiscoverySignal] = field(default_factory=list)
    competitors: List[str] = field(default_factory=list)
    weakness: str = ""
    export_format: str = "Unknown"

    def to_lead_candidate(self, growth_proj: float = 20.0, margin_proj: float = 80.0) -> LeadCandidate:
        """Convert to LeadCandidate for validation."""
        return LeadCandidate(
            name=f"{self.name} Alternative",
            incumbent=self.name,
            weakness=self.weakness,
            export_format=self.export_format,
            traffic_monthly=self.traffic_monthly,
            last_update_months=self.last_update_months,
            sentiment_score=self.sentiment_score,
            pain_signals=[s.content for s in self.pain_signals],
            competitors=self.competitors,
            growth_projection=growth_proj,
            margin_projection=margin_proj
        )


class ExclusionList:
    """Manages the list of already-analyzed hosts with time-based exclusions."""

    def __init__(self, filepath: str = EXCLUSION_FILE):
        self.filepath = filepath
        self.data = self._load()
        self.exclusions = self._get_active_exclusions()

    def _load(self) -> Dict:
        """Load exclusions from file."""
        if os.path.exists(self.filepath):
            with open(self.filepath, 'r') as f:
                return json.load(f)
        return {"exclusions": [], "version": "1.0.0"}

    def _get_active_exclusions(self) -> Set[str]:
        """Get hosts that are still within exclusion period."""
        active = set()
        today = datetime.now().date()

        for exc in self.data.get("exclusions", []):
            exclude_until = exc.get("exclude_until")
            if exclude_until:
                try:
                    until_date = datetime.strptime(exclude_until, "%Y-%m-%d").date()
                    if today < until_date:
                        active.add(exc.get("name", "").lower())
                except ValueError:
                    pass

        # Also support legacy format
        for host in self.data.get("analyzed_hosts", []):
            active.add(host.lower())

        return active

    def save(self):
        """Save exclusions to file."""
        self.data["last_updated"] = datetime.now().isoformat()
        with open(self.filepath, 'w') as f:
            json.dump(self.data, f, indent=2)

    def is_excluded(self, host: str) -> bool:
        """Check if host is in exclusion list and still within exclusion period."""
        return host.lower() in self.exclusions

    def add(self, host: str, months: int = 6, reason: str = "ANALYZED"):
        """Add host to exclusion list with expiration."""
        from datetime import timedelta
        exclude_until = (datetime.now() + timedelta(days=months*30)).strftime("%Y-%m-%d")

        # Check if already exists
        for exc in self.data.get("exclusions", []):
            if exc.get("name", "").lower() == host.lower():
                exc["exclude_until"] = exclude_until
                exc["reason"] = reason
                self.save()
                return

        # Add new exclusion
        if "exclusions" not in self.data:
            self.data["exclusions"] = []

        self.data["exclusions"].append({
            "name": host,
            "host": f"{host.lower().replace(' ', '')}.com",
            "analyzed_at": datetime.now().strftime("%Y-%m-%d"),
            "exclude_until": exclude_until,
            "reason": reason
        })
        self.exclusions.add(host.lower())
        self.save()


class CommunityScraper:
    """
    Scrapes communities for Negative Utility Signals.

    Targets:
    - Reddit (via Google site search)
    - Review sites (G2, Capterra, TrustRadius)
    - General web complaints
    """

    def __init__(self, tool_client=None):
        self.tool_client = tool_client
        self._request_count = 0

    def _stealth_pause(self, min_sec: float = 2.0, max_sec: float = 5.0):
        """V-Governor: Random delay to avoid detection."""
        self._request_count += 1
        if self._request_count % 3 == 0:
            min_sec, max_sec = 4.0, 8.0
        pause = random.uniform(min_sec, max_sec)
        print(f"    [V-Governor] Stealth pause: {pause:.1f}s...")
        time.sleep(pause)

    def scan_reddit(self, incumbent: str) -> List[DiscoverySignal]:
        """Scan Reddit for complaints about incumbent."""
        print(f"    [CommunityScraper] Scanning Reddit for '{incumbent}'...")
        signals = []
        year = datetime.now().year

        # Build search queries from triggers
        queries = [
            f'site:reddit.com "{incumbent}" (problem OR frustrating OR broken OR alternative)',
            f'site:reddit.com "{incumbent}" (export OR migrate OR switch OR moved)',
            f'site:reddit.com "{incumbent}" alternatives {year}',
        ]

        if self.tool_client:
            for query in queries:
                self._stealth_pause(1.5, 3.0)
                try:
                    result = self.tool_client.google_web_search(query, max_results=5)
                    output = result.get("output", "")

                    # Extract signals from search results
                    for line in output.split('\n'):
                        line = line.strip()
                        if not line or line.startswith('('):
                            continue

                        # Check for pain keywords
                        for keyword in PAIN_KEYWORDS:
                            if keyword.lower() in line.lower():
                                signals.append(DiscoverySignal(
                                    source="reddit",
                                    content=line[:300],
                                    keyword=keyword,
                                    sentiment_score=self._estimate_sentiment(line)
                                ))
                                break

                except Exception as e:
                    print(f"    [CommunityScraper] Reddit scan error: {e}")

        print(f"    [CommunityScraper] Found {len(signals)} Reddit signals")
        return signals

    def scan_review_sites(self, incumbent: str) -> List[DiscoverySignal]:
        """Scan G2, Capterra, etc. for negative reviews."""
        print(f"    [CommunityScraper] Scanning review sites for '{incumbent}'...")
        signals = []

        review_queries = [
            f'site:g2.com "{incumbent}" reviews cons',
            f'site:capterra.com "{incumbent}" reviews',
            f'site:alternativeto.net "{incumbent}"',
            f'site:trustpilot.com "{incumbent}"',
        ]

        if self.tool_client:
            for query in review_queries:
                self._stealth_pause(2.0, 4.0)
                try:
                    result = self.tool_client.google_web_search(query, max_results=3)
                    output = result.get("output", "")

                    for line in output.split('\n'):
                        line = line.strip()
                        if not line:
                            continue

                        for keyword in PAIN_KEYWORDS:
                            if keyword.lower() in line.lower():
                                signals.append(DiscoverySignal(
                                    source="review_site",
                                    content=line[:300],
                                    keyword=keyword,
                                    sentiment_score=self._estimate_sentiment(line)
                                ))
                                break

                except Exception as e:
                    print(f"    [CommunityScraper] Review site scan error: {e}")

        print(f"    [CommunityScraper] Found {len(signals)} review site signals")
        return signals

    def scan_general_web(self, incumbent: str) -> List[DiscoverySignal]:
        """General web search for frustrations."""
        print(f"    [CommunityScraper] General web scan for '{incumbent}'...")
        signals = []
        year = datetime.now().year

        queries = [
            f'"{incumbent}" frustration OR problem OR "doesn\'t work"',
            f'"{incumbent}" alternative OR replacement {year}',
            f'"{incumbent}" privacy OR security concerns',
        ]

        if self.tool_client:
            for query in queries:
                self._stealth_pause(2.0, 4.0)
                try:
                    result = self.tool_client.google_web_search(query, max_results=5)
                    output = result.get("output", "")

                    for line in output.split('\n'):
                        line = line.strip()
                        if not line:
                            continue

                        for keyword in PAIN_KEYWORDS:
                            if keyword.lower() in line.lower():
                                signals.append(DiscoverySignal(
                                    source="web",
                                    content=line[:300],
                                    keyword=keyword,
                                    sentiment_score=self._estimate_sentiment(line)
                                ))
                                break

                except Exception as e:
                    print(f"    [CommunityScraper] Web scan error: {e}")

        print(f"    [CommunityScraper] Found {len(signals)} web signals")
        return signals

    def _estimate_sentiment(self, text: str) -> float:
        """
        Simple keyword-based sentiment estimation.
        Returns 0-100 where lower = more negative.
        """
        text_lower = text.lower()

        # Strong negative indicators
        strong_negative = ["hate", "terrible", "awful", "worst", "broken", "unusable", "garbage"]
        # Moderate negative
        moderate_negative = ["frustrating", "annoying", "slow", "buggy", "disappointing", "lacks"]
        # Neutral/positive
        positive = ["love", "great", "amazing", "best", "excellent", "perfect"]

        score = 50  # Start neutral

        for word in strong_negative:
            if word in text_lower:
                score -= 20

        for word in moderate_negative:
            if word in text_lower:
                score -= 10

        for word in positive:
            if word in text_lower:
                score += 15

        return max(0, min(100, score))


class MarketCapArbitrage:
    """
    Identifies legacy software with high traffic but low maintenance.

    Checks:
    - Traffic > 500k/mo
    - Last Update > 24 months
    - User Sentiment < 40%
    """

    def __init__(self, tool_client=None):
        self.tool_client = tool_client

    def check_stagnation(self, incumbent: str) -> Dict[str, Any]:
        """
        Check if incumbent shows signs of stagnation.
        Returns estimated metrics.
        """
        print(f"    [MarketCapArbitrage] Checking stagnation for '{incumbent}'...")

        # In production, this would call SimilarWeb/Semrush APIs
        # For now, we estimate based on web searches

        stagnation_signals = {
            "last_update_months": 0,
            "maintenance_signals": [],
            "stagnation_score": 0  # 0-100, higher = more stagnant
        }

        if self.tool_client:
            try:
                # Search for update/changelog info
                query = f'"{incumbent}" (changelog OR "last updated" OR "version history")'
                result = self.tool_client.google_web_search(query, max_results=5)
                output = result.get("output", "").lower()

                # Look for date patterns
                year_pattern = r'20[12][0-9]'
                years_found = re.findall(year_pattern, output)

                if years_found:
                    most_recent = max(int(y) for y in years_found)
                    current_year = datetime.now().year
                    years_since = current_year - most_recent
                    stagnation_signals["last_update_months"] = years_since * 12

                    if years_since >= 2:
                        stagnation_signals["stagnation_score"] += 40
                        stagnation_signals["maintenance_signals"].append(
                            f"Last mentioned update from {most_recent}"
                        )

                # Check for abandonment signals
                abandon_query = f'"{incumbent}" (abandoned OR "no longer maintained" OR discontinued)'
                abandon_result = self.tool_client.google_web_search(abandon_query, max_results=3)
                abandon_output = abandon_result.get("output", "").lower()

                if "abandoned" in abandon_output or "discontinued" in abandon_output:
                    stagnation_signals["stagnation_score"] += 30
                    stagnation_signals["maintenance_signals"].append("Abandonment signals detected")

            except Exception as e:
                print(f"    [MarketCapArbitrage] Stagnation check error: {e}")

        return stagnation_signals

    def find_competitors(self, incumbent: str) -> List[str]:
        """Find modern alternatives/competitors."""
        print(f"    [MarketCapArbitrage] Finding competitors for '{incumbent}'...")
        competitors = []
        year = datetime.now().year

        if self.tool_client:
            try:
                query = f'"{incumbent}" alternatives {year} OR "better than {incumbent}"'
                result = self.tool_client.google_web_search(query, max_results=10)
                output = result.get("output", "")

                # Extract product names (bold text in markdown)
                for line in output.split('\n'):
                    if '**' in line:
                        try:
                            name = line.split('**')[1].strip()
                            # Filter out the incumbent itself and common words
                            if (name.lower() != incumbent.lower() and
                                len(name) > 2 and
                                len(name.split()) <= 3 and
                                name.lower() not in ["the", "best", "top", "free", "alternative"]):
                                if name not in competitors:
                                    competitors.append(name)
                        except IndexError:
                            continue

            except Exception as e:
                print(f"    [MarketCapArbitrage] Competitor search error: {e}")

        print(f"    [MarketCapArbitrage] Found {len(competitors)} competitors")
        return competitors[:10]  # Limit to top 10

    def estimate_weakness(self, signals: List[DiscoverySignal]) -> str:
        """Synthesize the main weakness from pain signals."""
        if not signals:
            return "Unknown weakness"

        # Count keyword frequencies
        keyword_counts = {}
        for signal in signals:
            if signal.keyword:
                keyword_counts[signal.keyword] = keyword_counts.get(signal.keyword, 0) + 1

        # Find top keywords
        if keyword_counts:
            sorted_keywords = sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)
            top_keywords = [kw for kw, _ in sorted_keywords[:3]]
            return f"Users frustrated with: {', '.join(top_keywords)}"

        return "General user dissatisfaction"


class DiscoveryEngine:
    """
    Main discovery orchestrator.

    Combines Community Scraper and Market-Cap Arbitrage to find
    high-potential market gaps.
    """

    def __init__(self, tool_client=None):
        self.tool_client = tool_client
        self.community_scraper = CommunityScraper(tool_client)
        self.arbitrage = MarketCapArbitrage(tool_client)
        self.exclusion_list = ExclusionList()

    def discover_carcasses(self, categories: List[str] = None) -> List[CarcassProfile]:
        """
        Discover potential carcasses to analyze.

        Returns list of CarcassProfile objects for validation.
        """
        print("\n[DiscoveryEngine] Starting carcass discovery...")

        if categories is None:
            categories = DISCOVERY_CATEGORIES

        carcasses = []

        # Filter known carcasses by category and exclusion list
        for carcass in KNOWN_CARCASSES:
            if carcass["category"] in categories:
                if self.exclusion_list.is_excluded(carcass["name"]):
                    print(f"    [DiscoveryEngine] Skipping excluded: {carcass['name']}")
                    continue

                profile = CarcassProfile(
                    name=carcass["name"],
                    category=carcass["category"],
                    traffic_monthly=carcass.get("estimated_traffic", 0)
                )
                carcasses.append(profile)

        print(f"[DiscoveryEngine] Found {len(carcasses)} potential carcasses")
        return carcasses

    def analyze_carcass(self, profile: CarcassProfile) -> CarcassProfile:
        """
        Deep analysis of a single carcass.

        Scrapes communities and checks for arbitrage signals.
        """
        print(f"\n[DiscoveryEngine] Analyzing carcass: {profile.name}")

        # === PHASE 1: Community Scraping ===
        print("[DiscoveryEngine] Phase 1: Community Scraping...")

        reddit_signals = self.community_scraper.scan_reddit(profile.name)
        review_signals = self.community_scraper.scan_review_sites(profile.name)
        web_signals = self.community_scraper.scan_general_web(profile.name)

        all_signals = reddit_signals + review_signals + web_signals
        profile.pain_signals = all_signals

        # Calculate average sentiment
        if all_signals:
            avg_sentiment = sum(s.sentiment_score for s in all_signals) / len(all_signals)
            profile.sentiment_score = avg_sentiment
        else:
            profile.sentiment_score = 60  # Neutral-ish if no signals

        # === PHASE 2: Market-Cap Arbitrage ===
        print("[DiscoveryEngine] Phase 2: Market-Cap Arbitrage...")

        stagnation = self.arbitrage.check_stagnation(profile.name)
        profile.last_update_months = stagnation.get("last_update_months", 0)

        competitors = self.arbitrage.find_competitors(profile.name)
        profile.competitors = competitors

        # === PHASE 3: Weakness Synthesis ===
        print("[DiscoveryEngine] Phase 3: Synthesizing weakness...")
        profile.weakness = self.arbitrage.estimate_weakness(all_signals)

        # Add to exclusion list
        self.exclusion_list.add(profile.name)

        print(f"[DiscoveryEngine] Analysis complete for {profile.name}")
        print(f"    Pain signals: {len(all_signals)}")
        print(f"    Sentiment: {profile.sentiment_score:.1f}")
        print(f"    Stagnation: {profile.last_update_months} months")
        print(f"    Competitors: {len(competitors)}")
        print(f"    Weakness: {profile.weakness}")

        return profile

    def run_discovery_cycle(
        self,
        categories: List[str] = None,
        max_carcasses: int = 5
    ) -> List[CarcassProfile]:
        """
        Run a full discovery cycle.

        Returns analyzed CarcassProfiles ready for validation.
        """
        print("\n" + "=" * 60)
        print("VULTURE-NEST DISCOVERY CYCLE")
        print("=" * 60)

        # Discover potential targets
        carcasses = self.discover_carcasses(categories)

        # Limit to max_carcasses
        carcasses = carcasses[:max_carcasses]

        # Analyze each carcass
        analyzed = []
        for profile in carcasses:
            try:
                analyzed_profile = self.analyze_carcass(profile)
                analyzed.append(analyzed_profile)
            except Exception as e:
                print(f"[DiscoveryEngine] Error analyzing {profile.name}: {e}")
                continue

        print("\n" + "=" * 60)
        print(f"DISCOVERY COMPLETE: {len(analyzed)} carcasses analyzed")
        print("=" * 60)

        return analyzed


# =============================================================================
# LIVE SCAN FUNCTIONALITY
# =============================================================================
import argparse
from pathlib import Path

# Output paths
OFFICE_ROOT = Path(__file__).parent / "OFFICE"
DIV1_VULTURE = OFFICE_ROOT / "DIV-1-VULTURE"


def run_live_scan(product_name: str, output_dir: Path = None) -> Dict[str, Any]:
    """
    Execute a live market scan for a specific product/SaaS.

    Searches web for:
    - Pricing friction signals
    - Export/lock-in complaints
    - Enterprise pain points
    - Competitor landscape

    Returns structured strike report data.
    """
    from datetime import datetime

    print("\n" + "=" * 70)
    print(f"VULTURE STRIKE SCAN: {product_name.upper()}")
    print("=" * 70)

    if output_dir is None:
        output_dir = DIV1_VULTURE

    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)

    strike_report = {
        "meta": {
            "product": product_name,
            "scan_timestamp": datetime.now().isoformat(),
            "engine_version": "1.2.0",
            "mode": "live"
        },
        "pricing_friction": [],
        "export_hostage": [],
        "enterprise_pain": [],
        "sentiment_signals": [],
        "competitors": [],
        # Exact community quotes with matched blood-keywords + source URLs.
        # Populated from raw_items across all phases. Deduped by (url, quote-prefix).
        "community_pain_points": [],
        "unbundle_opportunity": {
            "viable": False,
            "local_first_possible": False,
            "estimated_market_size": 0,
            "saas_hostage_indicators": []
        },
        "score_864z": 0.0,
        "passes_8_64": False,
        "verdict": {
            "strike_worthy": False,
            "priority": "low",
            "rationale": ""
        }
    }

    def _extract_pain_quotes(raw_items, phase):
        """Pull structured pain quotes (full text + URL + matched keywords) from search raw_items."""
        quotes = []
        for item in raw_items or []:
            title = (item.get("title") or "").strip()
            desc = (item.get("description") or "").strip()
            url = item.get("url") or ""
            text = f"{title}. {desc}" if title and desc else (title or desc)
            if not text:
                continue
            text_lower = text.lower()
            matched = [kw for kw in PAIN_KEYWORDS if kw.lower() in text_lower]
            if matched:
                quotes.append({
                    "quote": text[:2000],  # exact text, generous cap for sane payload size
                    "matched_keywords": matched,
                    "source_url": url,
                    "title": title,
                    "phase": phase,
                })
        return quotes

    # Initialize scraper (will use WebSearch tool via tool_wrapper if available)
    try:
        from tool_wrapper import ToolClient
        tool_client = ToolClient()
        print("[LiveScan] ToolClient initialized - web search enabled")
    except ImportError:
        tool_client = None
        print("[LiveScan] WARNING: ToolClient not available - limited scan mode")

    scraper = CommunityScraper(tool_client)
    arbitrage = MarketCapArbitrage(tool_client)

    # === PHASE 1: Pricing Friction ===
    print(f"\n[Phase 1] Scanning pricing friction for '{product_name}'...")

    pricing_queries = [
        f'"{product_name}" pricing expensive OR "too expensive" OR overpriced',
        f'"{product_name}" enterprise pricing OR "per seat" OR "per user"',
        f'"{product_name}" free tier OR limitations OR restricted',
    ]

    if tool_client:
        for query in pricing_queries:
            try:
                result = tool_client.google_web_search(query, max_results=5)
                output = result.get("output", "")
                for line in output.split('\n'):
                    line = line.strip()
                    if line and any(kw in line.lower() for kw in ["expensive", "overpriced", "pricing", "cost", "pay", "$"]):
                        strike_report["pricing_friction"].append({
                            "source": "web",
                            "content": line[:400],
                            "query": query
                        })
                # Capture exact-quote community pain points with URLs
                strike_report["community_pain_points"].extend(
                    _extract_pain_quotes(result.get("raw_items"), "pricing")
                )
            except Exception as e:
                print(f"    [Error] Pricing scan: {e}")

    print(f"    Found {len(strike_report['pricing_friction'])} pricing friction signals")

    # === PHASE 2: Export/Lock-in (SaaS Hostage) ===
    print(f"\n[Phase 2] Scanning export/lock-in for '{product_name}'...")

    export_queries = [
        f'"{product_name}" export data OR "how to export" OR migration',
        f'"{product_name}" lock-in OR locked OR "can\'t export"',
        f'"{product_name}" alternative OR "switched from" OR replacement',
    ]

    if tool_client:
        for query in export_queries:
            try:
                result = tool_client.google_web_search(query, max_results=5)
                output = result.get("output", "")
                for line in output.split('\n'):
                    line = line.strip()
                    if line and any(kw in line.lower() for kw in ["export", "lock", "migrate", "switch", "alternative"]):
                        strike_report["export_hostage"].append({
                            "source": "web",
                            "content": line[:400],
                            "query": query
                        })
                strike_report["community_pain_points"].extend(
                    _extract_pain_quotes(result.get("raw_items"), "export")
                )
            except Exception as e:
                print(f"    [Error] Export scan: {e}")

    print(f"    Found {len(strike_report['export_hostage'])} export/lock-in signals")

    # === PHASE 3: Enterprise Pain ===
    print(f"\n[Phase 3] Scanning enterprise pain points for '{product_name}'...")

    enterprise_queries = [
        f'"{product_name}" enterprise OR B2B problems OR issues',
        f'"{product_name}" template OR "can\'t customize" OR limitations',
        f'site:reddit.com "{product_name}" frustrating OR broken OR slow',
        f'site:g2.com "{product_name}" cons OR negative',
    ]

    if tool_client:
        for query in enterprise_queries:
            try:
                result = tool_client.google_web_search(query, max_results=5)
                output = result.get("output", "")
                for line in output.split('\n'):
                    line = line.strip()
                    if line and any(kw in line.lower() for kw in PAIN_KEYWORDS):
                        strike_report["enterprise_pain"].append({
                            "source": "web",
                            "content": line[:400],
                            "query": query
                        })
                strike_report["community_pain_points"].extend(
                    _extract_pain_quotes(result.get("raw_items"), "enterprise")
                )
            except Exception as e:
                print(f"    [Error] Enterprise scan: {e}")

    print(f"    Found {len(strike_report['enterprise_pain'])} enterprise pain signals")

    # Dedupe community_pain_points by (url, quote-prefix). Same URL hit by multiple
    # phases keeps the first occurrence — matched_keywords already lists every blood
    # keyword found in that quote.
    _seen = set()
    _deduped = []
    for pp in strike_report["community_pain_points"]:
        key = (pp.get("source_url", ""), (pp.get("quote") or "")[:80])
        if key not in _seen:
            _seen.add(key)
            _deduped.append(pp)
    strike_report["community_pain_points"] = _deduped
    print(f"    Captured {len(_deduped)} unique community pain quotes (with URLs)")

    # === PHASE 4: Competitor Landscape ===
    print(f"\n[Phase 4] Mapping competitor landscape for '{product_name}'...")

    competitors = arbitrage.find_competitors(product_name)
    strike_report["competitors"] = competitors
    print(f"    Found {len(competitors)} competitors")

    # === PHASE 5: Unbundle Analysis ===
    print(f"\n[Phase 5] Analyzing unbundle opportunity...")

    total_signals = (
        len(strike_report["pricing_friction"]) +
        len(strike_report["export_hostage"]) +
        len(strike_report["enterprise_pain"])
    )

    # Determine if this is a valid strike target
    hostage_indicators = []
    if len(strike_report["export_hostage"]) >= 2:
        hostage_indicators.append("Export friction detected")
    if len(strike_report["pricing_friction"]) >= 2:
        hostage_indicators.append("Pricing complaints prevalent")
    if len(strike_report["enterprise_pain"]) >= 3:
        hostage_indicators.append("Enterprise frustration documented")

    strike_report["unbundle_opportunity"] = {
        "viable": total_signals >= 5,
        "local_first_possible": len(strike_report["export_hostage"]) >= 2,
        "estimated_market_size": len(competitors) * 100000,  # Rough estimate
        "saas_hostage_indicators": hostage_indicators
    }

    # === 864z NUMERIC SCORE (0–10) ===
    # Adapted from V_Analyst weights: convergence 0.45 / velocity 0.35 / scarcity 0.20.
    unique_urls = {pp.get("source_url") for pp in strike_report["community_pain_points"] if pp.get("source_url")}
    convergence = min(total_signals / 10.0, 1.0)
    velocity = min(len(unique_urls) / 5.0, 1.0)
    scarcity = max(0.4, 1.0 - (len(competitors) / 5.0))
    score_864z = round(((convergence * 0.45) + (velocity * 0.35) + (scarcity * 0.20)) * 10, 2)
    passes_8_64 = score_864z >= 8.64

    strike_report["score_864z"] = score_864z
    strike_report["passes_8_64"] = passes_8_64
    strike_report["score_breakdown"] = {
        "convergence": round(convergence, 3),
        "velocity": round(velocity, 3),
        "scarcity": round(scarcity, 3),
        "weights": {"convergence": 0.45, "velocity": 0.35, "scarcity": 0.20},
        "threshold": 8.64,
    }

    # === VERDICT ===
    print(f"\n[Phase 6] Rendering verdict...")

    if passes_8_64:
        priority = "high"
        strike_worthy = True
        rationale = f"864z score {score_864z} >= 8.64. Cleared the gate. {total_signals} pain signals, {len(hostage_indicators)} hostage indicators."
    elif total_signals >= 5:
        priority = "medium"
        strike_worthy = False
        rationale = f"864z score {score_864z} < 8.64 (HANGAR). {total_signals} pain signals — re-review monthly."
    elif total_signals >= 2:
        priority = "low"
        strike_worthy = False
        rationale = f"864z score {score_864z}. Weak signals: only {total_signals} pain points found."
    else:
        priority = "skip"
        strike_worthy = False
        rationale = f"864z score {score_864z}. Insufficient data: {total_signals} signals."

    strike_report["verdict"] = {
        "strike_worthy": strike_worthy,
        "priority": priority,
        "rationale": rationale,
        "total_signals": total_signals,
    }

    # === SAVE REPORT ===
    output_file = output_dir / f"STRIKE_REPORT_{product_name.upper().replace(' ', '_')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(strike_report, f, indent=2, ensure_ascii=False)

    # If the 8.64 gate passes, also write a Strike Dossier to the canonical
    # LLC-DIV-1-INTELLIGENCE/strikes/ directory (alongside validator.py output).
    dossier_file = None
    if passes_8_64:
        strikes_dir = Path(__file__).parent / "strikes"
        strikes_dir.mkdir(exist_ok=True)
        slug = re.sub(r"[^a-z0-9]+", "-", product_name.lower()).strip("-")
        date_stamp = datetime.now().strftime("%Y-%m-%d")
        dossier_file = strikes_dir / f"LIVE_SCAN_{slug}_{date_stamp}.json"
        with open(dossier_file, "w", encoding="utf-8") as f:
            json.dump(strike_report, f, indent=2, ensure_ascii=False)
        strike_report["dossier_path"] = str(dossier_file)

    print("\n" + "=" * 70)
    print("STRIKE SCAN COMPLETE")
    print("=" * 70)
    print(f"\n  Product:        {product_name}")
    print(f"  864z Score:     {score_864z} / 10  (threshold: 8.64)")
    print(f"  Passes Gate:    {'YES' if passes_8_64 else 'NO'}")
    print(f"  Priority:       {priority.upper()}")
    print(f"  Strike:         {'YES' if strike_worthy else 'NO'}")
    print(f"  Signals:        {total_signals}")
    print(f"  Pain Quotes:    {len(strike_report['community_pain_points'])}")
    print(f"  Competitors:    {len(competitors)}")
    print(f"  Report:         {output_file}")
    if dossier_file:
        print(f"  Strike Dossier: {dossier_file}")
    print("\n" + "=" * 70)

    return strike_report


def run_test_harness():
    """Original test harness for dry-run testing."""
    print("=" * 60)
    print("DISCOVERY ENGINE TEST HARNESS")
    print("=" * 60)

    engine = DiscoveryEngine(tool_client=None)

    print("\n--- Testing Exclusion List ---")
    exclusions = ExclusionList()
    print(f"Current exclusions: {exclusions.exclusions}")

    print("\n--- Testing Carcass Discovery ---")
    carcasses = engine.discover_carcasses(categories=["chrome extension"])
    for c in carcasses[:3]:
        print(f"  - {c.name} ({c.category}): {c.traffic_monthly:,} monthly traffic")

    print("\n--- Testing Profile to LeadCandidate ---")
    mock_profile = CarcassProfile(
        name="TestApp",
        category="chrome extension",
        traffic_monthly=1000000,
        last_update_months=30,
        sentiment_score=35,
        pain_signals=[
            DiscoverySignal(source="reddit", content="This app is so frustrating", keyword="frustrating"),
            DiscoverySignal(source="reddit", content="Lost all my data", keyword="lost"),
        ],
        competitors=["Alt1", "Alt2"],
        weakness="Data loss and sync issues"
    )

    lead = mock_profile.to_lead_candidate()
    print(f"  Lead: {lead.name}")
    print(f"  Incumbent: {lead.incumbent}")
    print(f"  Weakness: {lead.weakness}")
    print(f"  Pain signals: {len(lead.pain_signals)}")

    print("\n" + "=" * 60)
    print("TEST HARNESS COMPLETE")
    print("=" * 60)


# =============================================================================
# CLI ENTRY POINT
# =============================================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Vulture-Nest Discovery Engine - Market Gap Scanner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python discovery_engine.py --product "Knak" --mode live
  python discovery_engine.py --product "Calendly" --mode live
  python discovery_engine.py --mode test
  python discovery_engine.py --list-carcasses
        """
    )

    parser.add_argument(
        "--product", "-p",
        type=str,
        help="Product/SaaS name to scan (e.g., 'Knak', 'Calendly')"
    )

    parser.add_argument(
        "--mode", "-m",
        type=str,
        choices=["live", "test"],
        default="test",
        help="Scan mode: 'live' for real web search, 'test' for dry run"
    )

    parser.add_argument(
        "--output", "-o",
        type=str,
        help="Output directory for strike reports (default: OFFICE/DIV-1-VULTURE)"
    )

    parser.add_argument(
        "--list-carcasses",
        action="store_true",
        help="List all known carcasses in the database"
    )

    args = parser.parse_args()

    # Handle --list-carcasses
    if args.list_carcasses:
        print("\n" + "=" * 60)
        print("KNOWN CARCASSES DATABASE")
        print("=" * 60)
        for idx, carcass in enumerate(KNOWN_CARCASSES, 1):
            unbundle = carcass.get("unbundle_potential", "standard")
            print(f"  {idx:2}. {carcass['name']:<20} | {carcass['category']:<18} | unbundle: {unbundle}")
        print("=" * 60)
        sys.exit(0)

    # Handle --mode test
    if args.mode == "test":
        run_test_harness()
        sys.exit(0)

    # Handle --mode live (requires --product)
    if args.mode == "live":
        if not args.product:
            print("ERROR: --product is required for live mode")
            print("Usage: python discovery_engine.py --product 'Knak' --mode live")
            sys.exit(1)

        output_dir = Path(args.output) if args.output else DIV1_VULTURE
        report = run_live_scan(args.product, output_dir)
        exit(0 if report["verdict"]["strike_worthy"] else 1)
