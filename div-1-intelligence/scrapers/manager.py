"""
Scraper Manager - Orchestrates multi-platform signal collection.

Coordinates all platform scrapers for Quest Engine V2.
Supports parallel execution and aggregates results.
"""

import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Optional, Type

from .base import BaseScraper, Signal, ScraperConfig, Platform, SignalSeverity
from .twitter import TwitterScraper
from .reddit import RedditScraper
from .hn import HackerNewsScraper
from .g2 import G2Scraper


class ScraperManager:
    """
    Central manager for all platform scrapers.

    Coordinates scraping across platforms and aggregates signals
    for Quest Engine V2 scoring.
    """

    # Available scrapers
    SCRAPERS: Dict[Platform, Type[BaseScraper]] = {
        Platform.TWITTER: TwitterScraper,
        Platform.REDDIT: RedditScraper,
        Platform.HACKER_NEWS: HackerNewsScraper,
        Platform.G2: G2Scraper,
    }

    def __init__(
        self,
        platforms: Optional[List[Platform]] = None,
        max_workers: int = 4,
        use_google_fallback: bool = True,
    ):
        """
        Initialize scraper manager.

        Args:
            platforms: List of platforms to scrape (default: all)
            max_workers: Max concurrent scrapers
            use_google_fallback: Use Google search for platforms without native API
        """
        self.platforms = platforms or list(self.SCRAPERS.keys())
        self.max_workers = max_workers
        self.use_google_fallback = use_google_fallback
        self.signals: List[Signal] = []
        self.stats: Dict = {}

    def scrape_all(
        self,
        target: str,
        max_results_per_platform: int = 50,
        days_back: int = 90,
        query_types: Optional[List[str]] = None,
        parallel: bool = True,
    ) -> List[Signal]:
        """
        Scrape all configured platforms for a target.

        Args:
            target: Product name to search
            max_results_per_platform: Max results per platform
            days_back: How far back to search
            query_types: Types of queries to run (ransom, friction, migration, crisis)
            parallel: Run scrapers in parallel

        Returns:
            List of all collected signals
        """
        print(f"\n{'='*70}")
        print(f"SCRAPER MANAGER: {target.upper()}")
        print(f"Platforms: {[p.value for p in self.platforms]}")
        print(f"{'='*70}")

        config = ScraperConfig(
            target=target,
            max_results=max_results_per_platform,
            days_back=days_back,
            query_types=query_types or ["ransom", "friction", "migration", "crisis"],
        )

        all_signals = []
        self.stats = {
            "target": target,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "platforms": {},
        }

        if parallel and len(self.platforms) > 1:
            all_signals = self._scrape_parallel(config)
        else:
            all_signals = self._scrape_sequential(config)

        # Deduplicate across platforms
        unique_signals = self._deduplicate_signals(all_signals)

        # Enrich all signals
        enriched_signals = self._enrich_all(unique_signals)

        # Update stats
        self.stats["completed_at"] = datetime.now(timezone.utc).isoformat()
        self.stats["total_raw"] = len(all_signals)
        self.stats["total_unique"] = len(unique_signals)
        self.stats["total_enriched"] = len(enriched_signals)

        self.signals = enriched_signals

        # Print summary
        self._print_summary()

        return enriched_signals

    def _scrape_parallel(self, config: ScraperConfig) -> List[Signal]:
        """Run scrapers in parallel using thread pool."""
        all_signals = []

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {}

            for platform in self.platforms:
                scraper_class = self.SCRAPERS.get(platform)
                if not scraper_class:
                    continue

                future = executor.submit(self._run_scraper, scraper_class, config, platform)
                futures[future] = platform

            for future in as_completed(futures):
                platform = futures[future]
                try:
                    signals = future.result()
                    all_signals.extend(signals)
                    self.stats["platforms"][platform.value] = {
                        "count": len(signals),
                        "status": "success",
                    }
                except Exception as e:
                    print(f"[ERROR] {platform.value} failed: {e}")
                    self.stats["platforms"][platform.value] = {
                        "count": 0,
                        "status": "error",
                        "error": str(e),
                    }

        return all_signals

    def _scrape_sequential(self, config: ScraperConfig) -> List[Signal]:
        """Run scrapers sequentially."""
        all_signals = []

        for platform in self.platforms:
            scraper_class = self.SCRAPERS.get(platform)
            if not scraper_class:
                continue

            try:
                signals = self._run_scraper(scraper_class, config, platform)
                all_signals.extend(signals)
                self.stats["platforms"][platform.value] = {
                    "count": len(signals),
                    "status": "success",
                }
            except Exception as e:
                print(f"[ERROR] {platform.value} failed: {e}")
                self.stats["platforms"][platform.value] = {
                    "count": 0,
                    "status": "error",
                    "error": str(e),
                }

        return all_signals

    def _run_scraper(
        self,
        scraper_class: Type[BaseScraper],
        config: ScraperConfig,
        platform: Platform
    ) -> List[Signal]:
        """Run a single scraper."""
        # Initialize with appropriate args
        if platform == Platform.HACKER_NEWS:
            scraper = scraper_class(config)
        else:
            scraper = scraper_class(config, use_google_fallback=self.use_google_fallback)

        return scraper.scrape()

    def _deduplicate_signals(self, signals: List[Signal]) -> List[Signal]:
        """Remove duplicate signals based on content similarity."""
        seen_ids = set()
        seen_content = set()
        unique = []

        for signal in signals:
            # Skip if ID already seen
            if signal.id in seen_ids:
                continue

            # Simple content hash for near-duplicate detection
            content_key = signal.content[:100].lower().strip()
            if content_key in seen_content:
                continue

            seen_ids.add(signal.id)
            seen_content.add(content_key)
            unique.append(signal)

        return unique

    def _enrich_all(self, signals: List[Signal]) -> List[Signal]:
        """Apply enrichment to all signals."""
        for signal in signals:
            # Ensure weighted score is calculated
            signal.calculate_weighted_score()

        return signals

    def _print_summary(self):
        """Print scraping summary."""
        print(f"\n{'='*70}")
        print("SCRAPING COMPLETE")
        print(f"{'='*70}")
        print(f"Target: {self.stats['target']}")
        print(f"Total Raw: {self.stats.get('total_raw', 0)}")
        print(f"Total Unique: {self.stats.get('total_unique', 0)}")
        print(f"\nBy Platform:")

        for platform, data in self.stats.get("platforms", {}).items():
            status = data.get("status", "unknown")
            count = data.get("count", 0)
            icon = "+" if status == "success" else "X"
            print(f"  [{icon}] {platform}: {count} signals")

        print(f"\nBy Severity:")
        severity_counts = self._count_by_severity()
        for sev, count in severity_counts.items():
            print(f"  {sev}: {count}")

        print(f"\nMigration Intent Signals: {self._count_migration_intent()}")
        print(f"Crisis Signals: {self._count_crisis()}")

    def _count_by_severity(self) -> Dict[str, int]:
        """Count signals by severity level."""
        counts = {s.value: 0 for s in SignalSeverity}
        for signal in self.signals:
            counts[signal.severity.value] += 1
        return counts

    def _count_migration_intent(self) -> int:
        """Count signals with migration intent."""
        return sum(1 for s in self.signals if s.is_migration_intent)

    def _count_crisis(self) -> int:
        """Count signals with crisis indicators."""
        return sum(1 for s in self.signals if s.crisis_type)

    def get_signals_by_platform(self, platform: Platform) -> List[Signal]:
        """Get signals for a specific platform."""
        return [s for s in self.signals if s.platform == platform]

    def get_signals_by_severity(self, severity: SignalSeverity) -> List[Signal]:
        """Get signals of a specific severity."""
        return [s for s in self.signals if s.severity == severity]

    def get_migration_signals(self) -> List[Signal]:
        """Get signals indicating migration intent."""
        return [s for s in self.signals if s.is_migration_intent]

    def get_crisis_signals(self) -> List[Signal]:
        """Get signals indicating crisis events."""
        return [s for s in self.signals if s.crisis_type]

    def get_top_signals(self, n: int = 20) -> List[Signal]:
        """Get top N signals by weighted score."""
        return sorted(self.signals, key=lambda s: s.weighted_score, reverse=True)[:n]

    def calculate_totals(self) -> Dict:
        """Calculate aggregate statistics for scoring."""
        return {
            "total_signals": len(self.signals),
            "total_weighted_score": sum(s.weighted_score for s in self.signals),
            "by_platform": {
                p.value: len(self.get_signals_by_platform(p))
                for p in Platform
            },
            "by_severity": self._count_by_severity(),
            "migration_count": self._count_migration_intent(),
            "crisis_count": self._count_crisis(),
            "platforms_covered": len([
                p for p in self.stats.get("platforms", {}).values()
                if p.get("status") == "success"
            ]),
        }

    def to_json(self) -> str:
        """Export signals to JSON."""
        return json.dumps({
            "stats": self.stats,
            "totals": self.calculate_totals(),
            "signals": [s.to_dict() for s in self.signals],
        }, indent=2, default=str)

    def save_results(self, output_dir: Path, target: str):
        """Save scraping results to files."""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{target.lower().replace(' ', '_')}_{timestamp}"

        # Save JSON
        json_path = output_dir / f"{filename}.json"
        with open(json_path, "w", encoding="utf-8") as f:
            f.write(self.to_json())

        print(f"\nResults saved to: {json_path}")
        return json_path


# Convenience function for quick scraping
def scrape_target(
    target: str,
    platforms: Optional[List[Platform]] = None,
    max_results: int = 50,
    days_back: int = 90,
) -> List[Signal]:
    """
    Quick scrape function for a target.

    Args:
        target: Product name
        platforms: Platforms to scrape (default: all)
        max_results: Max results per platform
        days_back: Days to look back

    Returns:
        List of signals
    """
    manager = ScraperManager(platforms=platforms)
    return manager.scrape_all(
        target=target,
        max_results_per_platform=max_results,
        days_back=days_back,
    )
