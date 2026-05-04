# tool_wrapper.py
"""
Apify-powered tool client for the Vulture Nest application.
Provides web search, community scraping, and content fetching capabilities.
Implements "Stealthfox" protocol with delays and proxy rotation.
"""
import os
import re
import time
import random
from dotenv import load_dotenv
from apify_client import ApifyClient

# Load environment variables
load_dotenv()


class ToolClient:
    """
    A wrapper class that uses Apify actors for web search and community scraping.
    Implements the "Blood in the Water" detection across multiple platforms.
    Uses "Stealthfox" strategy with delays and proxy rotation to avoid bot detection.
    """
    def __init__(self):
        token = os.getenv("APIFY_TOKEN")
        if not token:
            raise ValueError("APIFY_TOKEN not found in environment variables")
        self.client = ApifyClient(token)
        self._request_count = 0

    def _stealth_pause(self, min_seconds: float = 2.0, max_seconds: float = 5.0):
        """
        V-Governor Agent: Implements "Stealthfox" strategy with random delays.
        Pauses between requests to avoid bot detection.
        """
        self._request_count += 1

        # More aggressive pause every 3rd request
        if self._request_count % 3 == 0:
            min_seconds = 4.0
            max_seconds = 8.0

        pause = random.uniform(min_seconds, max_seconds)
        print(f"    [V-Governor] Stealth pause: {pause:.1f}s...")
        time.sleep(pause)

    def google_web_search(self, query: str, max_results: int = 10) -> dict:
        """
        Performs a Google search using Apify's Google Search Results Scraper.
        """
        print(f"    [Apify] Google search: {query[:60]}...")

        run_input = {
            "queries": query,
            "maxPagesPerQuery": 1,
            "resultsPerPage": max_results,
            "mobileResults": False,
            "languageCode": "",
            "maxConcurrency": 1,
        }

        try:
            run = self.client.actor("apify/google-search-scraper").call(run_input=run_input)
            items = list(self.client.dataset(run["defaultDatasetId"]).iterate_items())

            output_lines = []
            for item in items:
                organic_results = item.get("organicResults", [])
                for result in organic_results[:max_results]:
                    title = result.get("title", "")
                    url = result.get("url", "")
                    description = result.get("description", "")
                    output_lines.append(f"**{title}**")
                    output_lines.append(f"  ({url})")
                    output_lines.append(f"  {description}")
                    output_lines.append("")

            output = "\n".join(output_lines)
            print(f"    [Apify] Found {len(output_lines)//4} results")

            return {
                "output": output,
                "raw_items": items,
                "source": "google"
            }
        except Exception as e:
            print(f"    [Apify] Search error: {e}")
            return {"output": "", "error": str(e), "source": "google"}

    def search_reddit_via_google(self, host_name: str, max_results: int = 15) -> dict:
        """
        Searches Reddit using Google site search (FREE - no paid actor needed).
        Targets relevant subreddits for complaints and frustrations.
        """
        print(f"    [Apify] Searching Reddit via Google for '{host_name}'...")

        # Multiple search queries targeting different complaint patterns
        search_queries = [
            f'site:reddit.com "{host_name}" (problem OR frustrating OR broken OR alternative)',
            f'site:reddit.com "{host_name}" (sucks OR hate OR annoying OR "not working")',
            f'site:reddit.com "{host_name}" (missing feature OR wish OR limitation)',
        ]

        all_wounds = []
        all_urls = set()

        for query in search_queries:
            self._stealth_pause(1.5, 3.0)  # Pause between searches

            result = self.google_web_search(query, max_results=5)
            output = result.get("output", "")

            # Extract Reddit URLs
            for line in output.split('\n'):
                if 'reddit.com' in line:
                    match = re.search(r'https?://[^\s\)]+reddit\.com[^\s\)]*', line)
                    if match:
                        url = match.group(0)
                        if url not in all_urls:
                            all_urls.add(url)

                # Extract descriptions as pain points
                if line.strip() and not line.startswith('**') and not line.startswith('  ('):
                    content = line.strip()
                    if len(content) > 30:  # Filter out short snippets
                        all_wounds.append({
                            "source": "Reddit (via Google)",
                            "content": content[:500],
                            "url": ""
                        })

        # Fetch actual Reddit content from top URLs
        if all_urls:
            self._stealth_pause(2.0, 4.0)
            fetch_result = self.web_fetch_with_proxy(urls=list(all_urls)[:3])
            content = fetch_result.get("output", "")

            # Extract wounds from Reddit content
            wounds_from_content = self._extract_wounds_from_text(content, host_name)
            for wound in wounds_from_content:
                wound["source"] = "Reddit"
                all_wounds.append(wound)

        print(f"    [Apify] Found {len(all_wounds)} Reddit mentions")
        return {
            "wounds": all_wounds,
            "urls": list(all_urls),
            "source": "reddit",
            "count": len(all_wounds)
        }

    def search_review_sites(self, host_name: str) -> dict:
        """
        Searches G2, Capterra, TrustRadius, AlternativeTo for negative reviews.
        Uses Google site search + proxy-enabled web fetch.
        """
        print(f"    [Apify] Searching review sites for '{host_name}'...")

        review_queries = [
            f'site:g2.com "{host_name}" reviews',
            f'site:capterra.com "{host_name}" reviews',
            f'site:alternativeto.net "{host_name}"',
            f'site:trustpilot.com "{host_name}"',
        ]

        all_wounds = []
        all_urls = []

        for query in review_queries:
            self._stealth_pause(2.0, 4.0)  # Stealth pause between searches

            search_result = self.google_web_search(query, max_results=3)
            output = search_result.get("output", "")

            # Extract URLs
            for line in output.split('\n'):
                match = re.search(r'https?://[^\s\)]+', line)
                if match:
                    url = match.group(0)
                    if url not in all_urls:
                        all_urls.append(url)

        # Fetch content with proxy to bypass blocks
        if all_urls:
            self._stealth_pause(3.0, 6.0)
            fetch_result = self.web_fetch_with_proxy(urls=all_urls[:4])
            content = fetch_result.get("output", "")

            # Parse for negative sentiment keywords
            negative_keywords = [
                "frustrating", "missing", "lacks", "doesn't", "can't",
                "wish", "annoying", "slow", "buggy", "broken", "poor",
                "disappointing", "limitation", "cons", "dislike", "hate",
                "problem", "issue", "alternative", "switched", "moved to"
            ]

            for keyword in negative_keywords:
                if keyword.lower() in content.lower():
                    # Extract surrounding context
                    pattern = rf'.{{0,80}}{re.escape(keyword)}.{{0,80}}'
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    for match in matches[:2]:  # Limit per keyword
                        all_wounds.append({
                            "source": "Review Sites",
                            "content": match.strip(),
                            "keyword": keyword
                        })

        print(f"    [Apify] Found {len(all_wounds)} review site mentions")
        return {
            "wounds": all_wounds,
            "source": "review_sites",
            "count": len(all_wounds)
        }

    def web_fetch_with_proxy(self, url: str = None, urls: list = None) -> dict:
        """
        Fetches web pages using Apify proxy and stealth settings to bypass bot detection.
        Uses residential proxies and browser-like behavior.
        """
        urls_to_fetch = []
        if url:
            urls_to_fetch = [url]
        elif urls:
            urls_to_fetch = urls

        if not urls_to_fetch:
            return {"output": "", "error": "No URLs", "source": "web_fetch"}

        print(f"    [Apify] Fetching {len(urls_to_fetch)} URL(s) with proxy...")

        try:
            run_input = {
                "startUrls": [{"url": u} for u in urls_to_fetch[:5]],
                "maxCrawlPages": len(urls_to_fetch[:5]),
                "maxCrawlDepth": 0,
                "maxConcurrency": 1,  # Lower concurrency to avoid detection
                "requestTimeoutSecs": 30,
                # Proxy configuration for bypassing blocks
                "proxyConfiguration": {
                    "useApifyProxy": True,
                    "apifyProxyGroups": ["RESIDENTIAL"]  # Use residential proxies
                },
                # Browser-like settings
                "maxRequestRetries": 5,
                "navigationTimeoutSecs": 60,
            }

            run = self.client.actor("apify/website-content-crawler").call(run_input=run_input)
            items = list(self.client.dataset(run["defaultDatasetId"]).iterate_items())

            output_lines = []
            for item in items:
                page_url = item.get("url", "Unknown URL")
                text = item.get("text", "")[:3000]
                output_lines.append(f"=== {page_url} ===")
                output_lines.append(text)
                output_lines.append("")

            output = "\n".join(output_lines)
            print(f"    [Apify] Fetched {len(items)} page(s)")

            return {
                "output": output,
                "raw_items": items,
                "source": "web_fetch"
            }
        except Exception as e:
            print(f"    [Apify] Fetch error: {e}")
            return {"output": "", "error": str(e), "source": "web_fetch"}

    def web_fetch(self, url: str = None, urls: list = None, prompt: str = None) -> dict:
        """
        Standard web fetch (no proxy). Use web_fetch_with_proxy for blocked sites.
        """
        urls_to_fetch = []
        if url:
            urls_to_fetch = [url]
        elif urls:
            urls_to_fetch = urls
        elif prompt:
            urls_to_fetch = re.findall(r'https?://[^\s\)]+', prompt)

        if not urls_to_fetch:
            return {"output": "", "error": "No URLs", "source": "web_fetch"}

        print(f"    [Apify] Fetching {len(urls_to_fetch)} URL(s)...")

        try:
            run_input = {
                "startUrls": [{"url": u} for u in urls_to_fetch[:5]],
                "maxCrawlPages": len(urls_to_fetch[:5]),
                "maxCrawlDepth": 0,
                "maxConcurrency": 2,
            }

            run = self.client.actor("apify/website-content-crawler").call(run_input=run_input)
            items = list(self.client.dataset(run["defaultDatasetId"]).iterate_items())

            output_lines = []
            for item in items:
                page_url = item.get("url", "Unknown URL")
                text = item.get("text", "")[:3000]
                output_lines.append(f"=== {page_url} ===")
                output_lines.append(text)
                output_lines.append("")

            output = "\n".join(output_lines)
            print(f"    [Apify] Fetched {len(items)} page(s)")

            return {
                "output": output,
                "raw_items": items,
                "source": "web_fetch"
            }
        except Exception as e:
            print(f"    [Apify] Fetch error: {e}")
            return {"output": "", "error": str(e), "source": "web_fetch"}

    def _extract_wounds_from_text(self, text: str, host_name: str) -> list:
        """Extract pain points from raw text using keyword matching."""
        wounds = []

        pain_keywords = [
            "frustrating", "annoying", "broken", "doesn't work", "can't",
            "missing", "lacks", "wish", "hate", "slow", "buggy", "crash",
            "sync", "backup", "lost", "disappeared", "limitation", "alternative",
            "switch", "moved to", "replaced", "stopped using"
        ]

        text_lower = text.lower()

        for keyword in pain_keywords:
            if keyword in text_lower:
                pattern = rf'.{{0,100}}{re.escape(keyword)}.{{0,100}}'
                matches = re.findall(pattern, text, re.IGNORECASE)
                for match in matches[:2]:
                    if host_name.lower() in match.lower() or len(wounds) < 5:
                        wounds.append({
                            "source": "web_content",
                            "content": match.strip(),
                            "keyword": keyword
                        })

        return wounds

    # Legacy wrapper methods for backwards compatibility
    def google_web_search_wrapper(self, query: str, max_results: int = 10) -> dict:
        result = self.google_web_search(query, max_results)
        return {"google_web_search_response": result}

    def web_fetch_wrapper(self, url: str = None, prompt: str = None) -> dict:
        result = self.web_fetch(url=url, prompt=prompt)
        return {"web_fetch_response": result}

    # Backwards compatibility alias
    def search_reddit(self, host_name: str, max_posts: int = 15) -> dict:
        """Alias for search_reddit_via_google for backwards compatibility."""
        return self.search_reddit_via_google(host_name, max_posts)
