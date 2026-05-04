# agents.py
"""
Contains the definitions for the Vulture Nest intelligent agents.
Implements the "Blood in the Water" protocol for finding user frustrations.
"""
import time
from tool_wrapper import ToolClient


class V_Trendspotter:
    """
    Finds popular "host" applications to target.
    """
    def __init__(self, tool_client: ToolClient):
        self._tool_client = tool_client

    def find_host(self, category='chrome extension'):
        print(f"[V-Trendspotter] Searching for a popular {category}...")
        query = f'"most popular {category}s 2026" OR "top {category}s"'
        search_results = self._tool_client.google_web_search_wrapper(query=query)
        search_output = search_results.get('google_web_search_response', {}).get('output', '')

        # A simple heuristic to find a promising host from the text
        for line in search_output.split('\n'):
            if '**' in line and 'Tab' in line:  # Focus on tab managers for this run
                try:
                    host_name = line.split('**')[1].strip()
                    if len(host_name.split()) < 3:  # Prefer simple names
                        print(f"[V-Trendspotter] Identified host: {host_name}")
                        return host_name
                except IndexError:
                    continue
        return "OneTab"  # Default fallback


class V_Scout:
    """
    Finds "blood in the water" (user frustration) for a given host.
    Systematically searches multiple community platforms:
    - Reddit (complaints, alternatives discussions)
    - Chrome Web Store (negative reviews)
    - Review Sites (G2, Capterra, TrustRadius)
    - Twitter/X (complaints)
    - Product Hunt (discussions)
    """
    def __init__(self, tool_client: ToolClient):
        self._tool_client = tool_client

    def find_wounds(self, host_name: str, deep_scan: bool = True):
        """
        Performs comprehensive "blood in the water" detection across multiple platforms.

        Args:
            host_name: The target application to investigate
            deep_scan: If True, searches all community sources. If False, quick Google search only.
        """
        print(f"[V-Scout] Hunting for blood in the water around '{host_name}'...")

        wounds = {
            "host": host_name,
            "pain_points": [],
            "sources": {},
            "urls": set(),
            "raw_wounds": []
        }

        if deep_scan:
            # === PHASE 1: Reddit Search ===
            print(f"[V-Scout] Phase 1: Reddit community scan...")
            reddit_result = self._search_reddit(host_name)
            wounds["sources"]["reddit"] = reddit_result
            self._extract_pain_points(reddit_result, wounds)

            # === PHASE 2: Review Sites (G2, Capterra, TrustRadius) ===
            print(f"[V-Scout] Phase 2: Review sites scan...")
            review_result = self._search_review_sites(host_name)
            wounds["sources"]["review_sites"] = review_result
            self._extract_pain_points(review_result, wounds)

            # === PHASE 3: Google Search for general frustrations ===
            print(f"[V-Scout] Phase 3: General web search...")
            google_result = self._search_google_frustrations(host_name)
            wounds["sources"]["google"] = google_result
            self._extract_pain_points(google_result, wounds)

        else:
            # Quick scan - just Google
            google_result = self._search_google_frustrations(host_name)
            wounds["sources"]["google"] = google_result
            self._extract_pain_points(google_result, wounds)

        # Deduplicate and summarize pain points
        wounds["pain_points"] = self._deduplicate_pain_points(wounds["pain_points"])

        print(f"[V-Scout] Found {len(wounds['pain_points'])} unique pain points for {host_name}")
        print(f"[V-Scout] Sources searched: {list(wounds['sources'].keys())}")

        return wounds

    def _search_reddit(self, host_name: str) -> dict:
        """Search Reddit for complaints and frustrations via Google site search."""
        try:
            result = self._tool_client.search_reddit_via_google(host_name, max_results=15)
            return result
        except Exception as e:
            print(f"    [V-Scout] Reddit search failed: {e}")
            return {"wounds": [], "error": str(e)}

    def _search_review_sites(self, host_name: str) -> dict:
        """Search G2, Capterra, TrustRadius for negative reviews."""
        try:
            result = self._tool_client.search_review_sites(host_name)
            return result
        except Exception as e:
            print(f"    [V-Scout] Review sites search failed: {e}")
            return {"wounds": [], "error": str(e)}

    def _search_google_frustrations(self, host_name: str) -> dict:
        """Search Google for general frustration mentions."""
        try:
            query = f'"{host_name}" (frustration OR problem OR "doesn\'t work" OR alternative OR limitation OR missing feature)'
            result = self._tool_client.google_web_search(query, max_results=10)

            # Extract URLs for later fetching
            urls = []
            output = result.get("output", "")
            for line in output.split('\n'):
                if 'http' in line:
                    import re
                    match = re.search(r'https?://[^\s\)]+', line)
                    if match:
                        urls.append(match.group(0))

            # Fetch content from top URLs
            if urls:
                fetch_result = self._tool_client.web_fetch(urls=urls[:3])
                content = fetch_result.get("output", "")

                # Extract wounds from fetched content
                wounds = self._extract_wounds_from_text(content, host_name)
                return {"wounds": wounds, "urls": urls, "source": "google"}

            return {"wounds": [], "urls": [], "source": "google"}
        except Exception as e:
            print(f"    [V-Scout] Google search failed: {e}")
            return {"wounds": [], "error": str(e)}

    def _extract_wounds_from_text(self, text: str, host_name: str) -> list:
        """Extract pain points from raw text using keyword matching."""
        wounds = []

        # Pain point indicators
        pain_keywords = [
            "frustrating", "annoying", "broken", "doesn't work", "can't",
            "missing", "lacks", "wish", "hate", "slow", "buggy", "crash",
            "sync", "backup", "lost", "disappeared", "limitation", "alternative",
            "switch", "moved to", "replaced", "stopped using"
        ]

        import re
        text_lower = text.lower()

        for keyword in pain_keywords:
            if keyword in text_lower:
                # Extract surrounding context (100 chars before and after)
                pattern = rf'.{{0,100}}{re.escape(keyword)}.{{0,100}}'
                matches = re.findall(pattern, text, re.IGNORECASE)
                for match in matches[:2]:  # Limit to 2 matches per keyword
                    if host_name.lower() in match.lower() or len(wounds) < 5:
                        wounds.append({
                            "source": "web_content",
                            "content": match.strip(),
                            "keyword": keyword
                        })

        return wounds

    def _extract_pain_points(self, source_result: dict, wounds: dict):
        """Extract and categorize pain points from a source result."""
        source_wounds = source_result.get("wounds", [])

        for wound in source_wounds:
            content = wound.get("content", "") or wound.get("title", "")
            if not content:
                continue

            wounds["raw_wounds"].append(wound)

            # Categorize by pain type
            content_lower = content.lower()

            if any(kw in content_lower for kw in ["sync", "cloud", "backup", "device"]):
                wounds["pain_points"].append(f"[SYNC] {content[:200]}")
            elif any(kw in content_lower for kw in ["group", "organize", "folder", "category"]):
                wounds["pain_points"].append(f"[ORGANIZATION] {content[:200]}")
            elif any(kw in content_lower for kw in ["slow", "performance", "memory", "cpu", "lag"]):
                wounds["pain_points"].append(f"[PERFORMANCE] {content[:200]}")
            elif any(kw in content_lower for kw in ["lost", "disappeared", "crash", "data"]):
                wounds["pain_points"].append(f"[DATA LOSS] {content[:200]}")
            elif any(kw in content_lower for kw in ["ui", "interface", "design", "ugly", "confusing"]):
                wounds["pain_points"].append(f"[UX] {content[:200]}")
            elif any(kw in content_lower for kw in ["price", "expensive", "free", "subscription", "pay"]):
                wounds["pain_points"].append(f"[PRICING] {content[:200]}")
            else:
                wounds["pain_points"].append(f"[GENERAL] {content[:200]}")

            # Track URL if available
            if wound.get("url"):
                wounds["urls"].add(wound["url"])

    def _deduplicate_pain_points(self, pain_points: list) -> list:
        """Remove duplicate or very similar pain points."""
        seen = set()
        unique = []

        for point in pain_points:
            # Create a simple fingerprint (first 50 chars, lowercase)
            fingerprint = point[:50].lower().strip()
            if fingerprint not in seen:
                seen.add(fingerprint)
                unique.append(point)

        return unique[:20]  # Limit to top 20 unique pain points


class V_Analyst:
    """
    Scores an opportunity based on the 864z algorithm.
    Enhanced scoring based on community signal strength.
    """
    def calculate_score(self, wounds: dict, criteria: dict):
        print("[V-Analyst] Calculating 864z score...")
        weights = criteria['weights']

        # === Z_CONVERGENCE: How many different sources mention the pain ===
        sources_with_data = 0
        total_wounds = 0

        for source, data in wounds.get("sources", {}).items():
            wound_count = data.get("count", len(data.get("wounds", [])))
            if wound_count > 0:
                sources_with_data += 1
                total_wounds += wound_count

        # Convergence score: multiple sources = higher confidence
        # 1 source = 0.3, 2 sources = 0.6, 3+ sources = 1.0
        convergence = min(sources_with_data / 3.0, 1.0)

        # Boost convergence if many total wounds found
        if total_wounds >= 10:
            convergence = min(convergence + 0.2, 1.0)

        # === Z_VELOCITY: Recency and engagement of complaints ===
        # Check for high-engagement Reddit posts
        reddit_data = wounds.get("sources", {}).get("reddit", {})
        reddit_wounds = reddit_data.get("wounds", [])

        high_engagement_count = 0
        for wound in reddit_wounds:
            score = wound.get("score", 0)
            if score > 50:
                high_engagement_count += 1

        velocity = 0.5  # Base velocity
        if high_engagement_count > 0:
            velocity = min(0.5 + (high_engagement_count * 0.1), 1.0)

        # === Z_SCARCITY: Lack of existing solutions ===
        # Higher scarcity if pain points mention "no solution" or "wish there was"
        scarcity_keywords = ["wish", "need", "want", "no way to", "can't find", "doesn't exist"]
        scarcity_signals = 0

        for point in wounds.get("pain_points", []):
            if any(kw in point.lower() for kw in scarcity_keywords):
                scarcity_signals += 1

        scarcity = 0.6  # Base scarcity for "parasitic" solutions
        if scarcity_signals > 2:
            scarcity = min(0.6 + (scarcity_signals * 0.05), 1.0)

        # === CALCULATE FINAL SCORE ===
        score = (
            (convergence * weights['z_convergence']) +
            (velocity * weights['z_velocity']) +
            (scarcity * weights['z_scarcity'])
        ) * 10

        print(f"[V-Analyst] Score: {score:.2f}")
        print(f"    Convergence: {convergence:.2f} ({sources_with_data} sources, {total_wounds} wounds)")
        print(f"    Velocity:    {velocity:.2f} ({high_engagement_count} high-engagement posts)")
        print(f"    Scarcity:    {scarcity:.2f} ({scarcity_signals} scarcity signals)")

        return score
