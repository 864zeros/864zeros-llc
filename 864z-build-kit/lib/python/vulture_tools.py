"""
864z Centralized Scraper Utilities
Provides web search, community scraping, and content fetching capabilities using Apify.
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

class ApifyScraper:
    """
    Centralized Apify wrapper for 864z projects.
    """
    def __init__(self, token=None):
        self.token = token or os.getenv("APIFY_TOKEN")
        if not self.token:
            raise ValueError("APIFY_TOKEN not found in environment variables or passed to constructor")
        self.client = ApifyClient(self.token)
        self._request_count = 0

    def _stealth_pause(self, min_seconds: float = 2.0, max_seconds: float = 5.0):
        """
        V-Governor Protocol: Implements "Stealthfox" strategy with random delays.
        """
        self._request_count += 1
        if self._request_count % 3 == 0:
            min_seconds, max_seconds = 4.0, 8.0
        
        pause = random.uniform(min_seconds, max_seconds)
        time.sleep(pause)

    def google_search(self, query: str, max_results: int = 10) -> list:
        """
        Performs a Google search using Apify.
        """
        run_input = {
            "queries": query,
            "maxPagesPerQuery": 1,
            "resultsPerPage": max_results,
            "mobileResults": False,
            "maxConcurrency": 1,
        }
        
        run = self.client.actor("apify/google-search-scraper").call(run_input=run_input)
        items = list(self.client.dataset(run["defaultDatasetId"]).iterate_items())
        
        results = []
        for item in items:
            organic = item.get("organicResults", [])
            for res in organic[:max_results]:
                results.append({
                    "title": res.get("title"),
                    "url": res.get("url"),
                    "description": res.get("description")
                })
        return results

    def fetch_content(self, urls: list, use_proxy: bool = True) -> list:
        """
        Fetches text content from URLs using residential proxies.
        """
        if not urls:
            return []

        run_input = {
            "startUrls": [{"url": u} for u in urls[:5]],
            "maxCrawlPages": len(urls[:5]),
            "maxCrawlDepth": 0,
            "maxConcurrency": 1,
            "proxyConfiguration": {
                "useApifyProxy": use_proxy,
                "apifyProxyGroups": ["RESIDENTIAL"] if use_proxy else []
            }
        }

        run = self.client.actor("apify/website-content-crawler").call(run_input=run_input)
        items = list(self.client.dataset(run["defaultDatasetId"]).iterate_items())
        
        return [{"url": item.get("url"), "text": item.get("text", "")} for item in items]

    def find_frustrations(self, host_name: str) -> list:
        """
        Specialized 'Blood in the Water' detection for a given host.
        """
        queries = [
            f'site:reddit.com "{host_name}" (problem OR frustrating OR broken OR alternative)',
            f'site:reddit.com "{host_name}" (sucks OR hate OR annoying OR "not working")',
            f'site:g2.com "{host_name}" reviews',
            f'site:capterra.com "{host_name}" reviews'
        ]
        
        all_results = []
        for q in queries:
            self._stealth_pause()
            all_results.extend(self.google_search(q, max_results=3))
            
        return all_results
