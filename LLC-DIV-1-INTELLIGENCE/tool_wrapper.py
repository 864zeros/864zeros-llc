# tool_wrapper.py
"""
Apify-powered tool client for the Vulture Nest application.
Redirects to centralized 864z-build-kit utilities.
"""
import os
import sys
import re

# Add root to path to allow importing from 864z-build-kit
# We use this trick because '864z-build-kit' is not a valid Python package name
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# We can't use standard import due to the hyphen in the folder name
# So we use importlib to load the centralized scraper
import importlib.util
build_kit_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '864z-build-kit', 'lib', 'python', 'vulture_tools.py'))
spec = importlib.util.spec_from_file_location("vulture_tools", build_kit_path)
vulture_tools = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vulture_tools)

class ToolClient:
    """
    Compatibility wrapper for Vulture Nest agents.
    Uses centralized ApifyScraper for core logic.
    """
    def __init__(self):
        self.scraper = vulture_tools.ApifyScraper()
        self._request_count = 0

    def google_web_search(self, query: str, max_results: int = 10) -> dict:
        """Compatibility wrapper for Google search."""
        print(f"    [Apify] Centralized Google search: {query[:60]}...")
        results = self.scraper.google_search(query, max_results)
        
        output_lines = []
        for res in results:
            output_lines.append(f"**{res['title']}**")
            output_lines.append(f"  ({res['url']})")
            output_lines.append(f"  {res['description']}")
            output_lines.append("")

        return {
            "output": "\n".join(output_lines),
            "raw_items": results,
            "source": "google"
        }

    def search_reddit_via_google(self, host_name: str, max_results: int = 15) -> dict:
        """Compatibility wrapper for Reddit search."""
        print(f"    [Apify] Centralized Reddit scan for '{host_name}'...")
        results = self.scraper.find_frustrations(host_name)
        
        all_wounds = []
        for res in results:
            all_wounds.append({
                "source": "Reddit/Reviews",
                "content": res['description'],
                "url": res['url']
            })

        return {
            "wounds": all_wounds,
            "source": "centralized",
            "count": len(all_wounds)
        }

    def search_review_sites(self, host_name: str) -> dict:
        """Compatibility wrapper for review sites."""
        # find_frustrations already covers this in the centralized version
        return self.search_reddit_via_google(host_name)

    def web_fetch_with_proxy(self, url: str = None, urls: list = None) -> dict:
        """Compatibility wrapper for web fetch with proxy."""
        urls_to_fetch = [url] if url else (urls or [])
        print(f"    [Apify] Centralized proxy fetch: {len(urls_to_fetch)} URLs")
        results = self.scraper.fetch_content(urls_to_fetch, use_proxy=True)
        
        output_lines = []
        for res in results:
            output_lines.append(f"=== {res['url']} ===")
            output_lines.append(res['text'][:3000])
            output_lines.append("")

        return {
            "output": "\n".join(output_lines),
            "raw_items": results,
            "source": "web_fetch"
        }

    def web_fetch(self, url: str = None, urls: list = None, prompt: str = None) -> dict:
        """Compatibility wrapper for standard web fetch."""
        return self.web_fetch_with_proxy(url, urls)

    def _extract_wounds_from_text(self, text: str, host_name: str) -> list:
        # This is agent logic, but kept for compatibility
        return []

    # Legacy wrapper methods
    def google_web_search_wrapper(self, query: str, max_results: int = 10) -> dict:
        return {"google_web_search_response": self.google_web_search(query, max_results)}

    def web_fetch_wrapper(self, url: str = None, prompt: str = None) -> dict:
        return {"web_fetch_response": self.web_fetch(url=url, prompt=prompt)}

    def search_reddit(self, host_name: str, max_posts: int = 15) -> dict:
        return self.search_reddit_via_google(host_name)

