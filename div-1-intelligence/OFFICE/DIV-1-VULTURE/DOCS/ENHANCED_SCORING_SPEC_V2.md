# ENHANCED SCORING SPECIFICATION V2.0

## Social Media GTM Scraper - Strike Qualification Engine

**Version:** 2.0.0
**Status:** DRAFT
**Created:** 2026-03-26
**Purpose:** Replace naive keyword matching with engagement-weighted, velocity-aware, multi-platform signal detection

---

## EXECUTIVE SUMMARY

The current Quest Engine (V1) uses basic keyword search across 2-3 platforms with unweighted signal counting. This spec defines V2: a social-signal-aware scoring system that measures **engagement**, **velocity**, **authority**, and **migration intent** to produce higher-fidelity Strike/Hangar/Reject verdicts.

### Key Changes from V1

| Aspect | V1 (Current) | V2 (Enhanced) |
|--------|--------------|---------------|
| Platforms | Reddit, G2 | 8+ platforms |
| Signal weighting | None (count only) | Engagement multipliers |
| Velocity | Hardcoded 18 months | Real-time spike detection |
| Sentiment | Keyword matching | NLP classification |
| Authority | None | Follower/karma scoring |
| Migration intent | Not detected | Explicit tracking |

---

## 1. PLATFORM COVERAGE

### 1.1 Primary Platforms (Must Scrape)

| Platform | Signal Type | API/Method | Priority |
|----------|-------------|------------|----------|
| **Twitter/X** | Real-time complaints, viral outrage | API v2 / Apify | P0 |
| **Reddit** | Community sentiment, migration threads | Pushshift / API | P0 |
| **Hacker News** | Tech community validation | Algolia API | P0 |
| **G2** | Enterprise buyer pain | Scrape | P1 |
| **Capterra** | SMB buyer pain | Scrape | P1 |
| **Product Hunt** | Launch/sunset reactions | API | P1 |

### 1.2 Secondary Platforms (Nice to Have)

| Platform | Signal Type | Method | Priority |
|----------|-------------|--------|----------|
| **LinkedIn** | B2B sentiment, layoff signals | Manual/Scrape | P2 |
| **Discord** | Community health | Bot join | P2 |
| **Mastodon** | Tech-forward users | API | P2 |
| **GitHub** | OSS alternative traction | API | P2 |
| **TrustPilot** | Consumer sentiment | Scrape | P3 |
| **App Store** | Mobile app reviews | Scrape | P3 |

### 1.3 Platform Authority Weights

```python
PLATFORM_AUTHORITY = {
    "hacker_news": 1.5,      # High-signal tech community
    "twitter": 1.2,          # Real-time, viral potential
    "reddit": 1.0,           # Baseline community signal
    "g2": 1.3,               # Verified enterprise buyers
    "capterra": 1.1,         # Verified SMB buyers
    "product_hunt": 1.0,     # Launch community
    "linkedin": 0.8,         # Noisy, but B2B signal
    "trustpilot": 0.7,       # Consumer, less relevant
    "discord": 0.6,          # Hard to verify
    "app_store": 0.5         # Consumer mobile
}
```

---

## 2. SEARCH QUERY TEMPLATES

### 2.1 THE RANSOM (Pricing Pain)

```python
RANSOM_QUERIES = {
    "twitter": [
        '"{target}" (expensive OR overpriced OR "rip off" OR "price hike") -is:retweet lang:en',
        '"{target}" ("can\'t afford" OR "too expensive" OR "switched because") -is:retweet',
        '"{target}" pricing (angry OR frustrated OR ridiculous) -is:retweet',
    ],
    "reddit": [
        'site:reddit.com "{target}" (expensive OR overpriced OR "price increase")',
        'site:reddit.com "{target}" (cheaper alternative OR "free alternative")',
        'site:reddit.com "{target}" subscription (hate OR cancel OR ridiculous)',
    ],
    "hacker_news": [
        'site:news.ycombinator.com "{target}" pricing',
        'site:news.ycombinator.com "{target}" expensive',
    ],
    "g2": [
        'site:g2.com "{target}" pricing cons',
        'site:g2.com "{target}" "too expensive"',
    ]
}
```

### 2.2 THE FRICTION (Lock-in Pain)

```python
FRICTION_QUERIES = {
    "twitter": [
        '"{target}" (locked in OR "can\'t export" OR "data hostage") -is:retweet',
        '"{target}" (migration OR switching OR "moving away") -is:retweet',
        '"{target}" API (broken OR limited OR deprecated) -is:retweet',
    ],
    "reddit": [
        'site:reddit.com "{target}" (export OR migrate OR "move data")',
        'site:reddit.com "{target}" ("locked in" OR "vendor lock" OR "can\'t leave")',
        'site:reddit.com "{target}" (alternative OR replacement OR competitor)',
    ],
    "hacker_news": [
        'site:news.ycombinator.com "{target}" export',
        'site:news.ycombinator.com "{target}" migration',
        'site:news.ycombinator.com "{target}" lock-in',
    ]
}
```

### 2.3 MIGRATION INTENT (GTM Gold)

```python
MIGRATION_QUERIES = {
    "twitter": [
        '"{target}" ("switching to" OR "moved to" OR "migrated to") -is:retweet',
        '"{target}" ("looking for alternative" OR "need replacement") -is:retweet',
        '"leaving {target}" OR "left {target}" OR "quit {target}" -is:retweet',
    ],
    "reddit": [
        'site:reddit.com "{target}" "what should I switch to"',
        'site:reddit.com "{target}" "best alternative"',
        'site:reddit.com "migrating from {target}"',
        'site:reddit.com "leaving {target}" OR "left {target}"',
    ],
    "hacker_news": [
        'site:news.ycombinator.com "alternative to {target}"',
        'site:news.ycombinator.com "{target}" replacement',
    ]
}
```

### 2.4 CRISIS SIGNALS (High-Value Events)

```python
CRISIS_QUERIES = {
    "all_platforms": [
        '"{target}" (breach OR hack OR "data leak")',
        '"{target}" (outage OR "down again" OR unreliable)',
        '"{target}" (layoffs OR "shutting down" OR sunset OR EOL)',
        '"{target}" (acquired OR acquisition OR "sold to")',
        '"{target}" ("terms of service" OR TOS OR "policy change")',
    ]
}
```

---

## 3. SIGNAL CLASSIFICATION

### 3.1 Signal Severity Levels

| Level | Keywords/Patterns | Weight |
|-------|-------------------|--------|
| **CRITICAL** | breach, data loss, class action, lawsuit, shutdown | 5.0x |
| **HIGH** | switching, migrating, canceling, "looking for alternative" | 3.0x |
| **MEDIUM** | frustrated, annoying, overpriced, slow, buggy | 1.5x |
| **LOW** | wish, could be better, minor issue | 1.0x |
| **NOISE** | love, great, amazing, recommend (positive) | 0.0x (exclude) |

### 3.2 Severity Detection Patterns

```python
SEVERITY_PATTERNS = {
    "critical": [
        r"(data|security)\s*(breach|leak|hack)",
        r"(class\s*action|lawsuit|sued)",
        r"(shut\s*down|shutting\s*down|sunset|EOL|end\s*of\s*life)",
        r"lost\s*(all\s*)?(my\s*)?(data|files|work)",
        r"(account|data)\s*(deleted|wiped|gone)",
    ],
    "high": [
        r"(switching|migrating|moving)\s*(to|away|from)",
        r"cancel(led|ing)?\s*(my\s*)?(subscription|account)",
        r"looking\s*for\s*(an?\s*)?(alternative|replacement)",
        r"(can\'t|cannot|won\'t)\s*(afford|justify|pay)",
        r"(price|cost)\s*(hike|increase|doubled|tripled)",
        r"(left|leaving|quit|quitting)\s*{target}",
    ],
    "medium": [
        r"(frustrated|annoying|annoyed|irritating)",
        r"(expensive|overpriced|pricey|costly)",
        r"(slow|laggy|buggy|broken|crash)",
        r"(hate|dislike|disappointed)",
        r"(locked\s*in|vendor\s*lock|can\'t\s*export)",
    ],
    "low": [
        r"(wish|hope|would\s*be\s*nice)",
        r"(minor|small)\s*(issue|bug|problem)",
        r"(could|should)\s*be\s*better",
    ]
}
```

---

## 4. ENGAGEMENT MULTIPLIERS

### 4.1 Twitter/X Engagement

```python
def twitter_engagement_multiplier(tweet: dict) -> float:
    likes = tweet.get("like_count", 0)
    retweets = tweet.get("retweet_count", 0)
    replies = tweet.get("reply_count", 0)

    # Engagement score
    engagement = likes + (retweets * 2) + (replies * 1.5)

    if engagement >= 1000:
        return 10.0  # Viral
    elif engagement >= 500:
        return 5.0   # High engagement
    elif engagement >= 100:
        return 3.0   # Notable
    elif engagement >= 25:
        return 1.5   # Above average
    elif engagement >= 5:
        return 1.0   # Normal
    else:
        return 0.5   # Low engagement
```

### 4.2 Reddit Engagement

```python
def reddit_engagement_multiplier(post: dict) -> float:
    score = post.get("score", 0)  # upvotes - downvotes
    comments = post.get("num_comments", 0)

    # Post vs Comment
    is_post = post.get("is_post", True)

    if is_post:
        if score >= 500:
            return 8.0   # Front page material
        elif score >= 100:
            return 4.0   # Popular post
        elif score >= 25:
            return 2.0   # Notable
        elif score >= 5:
            return 1.0   # Normal
        else:
            return 0.3   # Buried
    else:  # Comment
        if score >= 100:
            return 5.0   # Top comment
        elif score >= 25:
            return 2.5   # Popular comment
        elif score >= 5:
            return 1.0   # Normal
        else:
            return 0.5   # Low
```

### 4.3 Hacker News Engagement

```python
def hn_engagement_multiplier(item: dict) -> float:
    points = item.get("points", 0)
    comments = item.get("num_comments", 0)

    # HN front page is extremely high signal
    if points >= 200:
        return 15.0  # Top of front page
    elif points >= 100:
        return 10.0  # Front page
    elif points >= 50:
        return 5.0   # Rising
    elif points >= 10:
        return 2.0   # Notable
    else:
        return 1.0   # Normal
```

### 4.4 Review Platform Engagement

```python
def review_engagement_multiplier(review: dict) -> float:
    stars = review.get("rating", 3)
    helpful_votes = review.get("helpful_count", 0)
    verified = review.get("verified_purchase", False)

    # Low ratings are high signal for pain
    rating_mult = {1: 3.0, 2: 2.0, 3: 1.0, 4: 0.3, 5: 0.1}

    base = rating_mult.get(stars, 1.0)

    if verified:
        base *= 1.5

    if helpful_votes >= 50:
        base *= 3.0
    elif helpful_votes >= 10:
        base *= 2.0
    elif helpful_votes >= 3:
        base *= 1.5

    return base
```

---

## 5. AUTHORITY SCORING

### 5.1 Author Authority

```python
def calculate_author_authority(author: dict, platform: str) -> float:
    """
    High-authority authors amplify signal strength.
    Influencers complaining = GTM gold.
    """

    if platform == "twitter":
        followers = author.get("followers_count", 0)
        verified = author.get("verified", False)

        if verified or followers >= 100000:
            return 5.0   # Major influencer
        elif followers >= 10000:
            return 3.0   # Micro-influencer
        elif followers >= 1000:
            return 1.5   # Active user
        else:
            return 1.0   # Normal user

    elif platform == "reddit":
        karma = author.get("total_karma", 0)
        account_age_days = author.get("account_age_days", 0)

        if karma >= 100000 and account_age_days >= 365:
            return 3.0   # Power user
        elif karma >= 10000:
            return 2.0   # Active user
        elif karma >= 1000 and account_age_days >= 90:
            return 1.5   # Established user
        elif account_age_days < 7:
            return 0.3   # New account (possible spam)
        else:
            return 1.0   # Normal user

    elif platform == "hacker_news":
        karma = author.get("karma", 0)

        if karma >= 10000:
            return 4.0   # HN veteran
        elif karma >= 1000:
            return 2.0   # Active member
        else:
            return 1.0   # Normal

    return 1.0  # Default
```

---

## 6. VELOCITY DETECTION

### 6.1 Time Windows

```python
TIME_WINDOWS = {
    "realtime": 24 * 60 * 60,        # 24 hours
    "recent": 7 * 24 * 60 * 60,      # 7 days
    "short_term": 30 * 24 * 60 * 60, # 30 days
    "medium_term": 90 * 24 * 60 * 60, # 90 days
    "baseline": 365 * 24 * 60 * 60,  # 1 year
}
```

### 6.2 Velocity Spike Detection

```python
def calculate_velocity_spike(signals: list, target: str) -> dict:
    """
    Detect abnormal spikes in complaint volume.
    A sudden surge = something happened = GTM opportunity.
    """
    now = datetime.utcnow()

    # Bucket signals by time window
    buckets = {
        "24h": [],
        "7d": [],
        "30d": [],
        "90d": [],
        "365d": [],
    }

    for signal in signals:
        age_seconds = (now - signal["timestamp"]).total_seconds()

        if age_seconds <= TIME_WINDOWS["realtime"]:
            buckets["24h"].append(signal)
        if age_seconds <= TIME_WINDOWS["recent"]:
            buckets["7d"].append(signal)
        if age_seconds <= TIME_WINDOWS["short_term"]:
            buckets["30d"].append(signal)
        if age_seconds <= TIME_WINDOWS["medium_term"]:
            buckets["90d"].append(signal)
        if age_seconds <= TIME_WINDOWS["baseline"]:
            buckets["365d"].append(signal)

    # Calculate baseline (average per 30-day period over last year)
    baseline_per_30d = len(buckets["365d"]) / 12 if buckets["365d"] else 1

    # Calculate spike ratios
    spike_30d = len(buckets["30d"]) / max(baseline_per_30d, 1)
    spike_7d = (len(buckets["7d"]) * 4) / max(baseline_per_30d, 1)  # Normalize to 30d
    spike_24h = (len(buckets["24h"]) * 30) / max(baseline_per_30d, 1)  # Normalize to 30d

    return {
        "baseline_per_30d": baseline_per_30d,
        "count_24h": len(buckets["24h"]),
        "count_7d": len(buckets["7d"]),
        "count_30d": len(buckets["30d"]),
        "spike_ratio_30d": spike_30d,
        "spike_ratio_7d": spike_7d,
        "spike_ratio_24h": spike_24h,
        "is_spiking": spike_7d > 2.0 or spike_24h > 3.0,
        "spike_severity": max(spike_30d, spike_7d, spike_24h),
    }
```

### 6.3 Velocity Score

```python
def calculate_z_velocity_v2(velocity_data: dict, recency_weighted_signals: float) -> float:
    """
    V2 Z-Velocity: Based on actual spike detection, not hardcoded months.
    """
    spike_severity = velocity_data.get("spike_severity", 1.0)
    is_spiking = velocity_data.get("is_spiking", False)
    recent_volume = velocity_data.get("count_30d", 0)

    # Base score from recent activity
    if recent_volume >= 50:
        base = 0.8
    elif recent_volume >= 20:
        base = 0.6
    elif recent_volume >= 10:
        base = 0.4
    elif recent_volume >= 5:
        base = 0.2
    else:
        base = 0.1

    # Spike bonus
    if is_spiking:
        if spike_severity >= 5.0:
            base += 0.5  # Massive spike (crisis event)
        elif spike_severity >= 3.0:
            base += 0.3  # Major spike
        elif spike_severity >= 2.0:
            base += 0.2  # Notable spike

    # Recency bonus (weighted by how recent signals are)
    base += min(recency_weighted_signals / 100, 0.2)

    return min(base, 1.0)
```

---

## 7. ENHANCED Z-FACTORS

### 7.1 Z-Convergence V2

```python
def calculate_z_convergence_v2(signals: list) -> float:
    """
    V2: Engagement-weighted, authority-aware convergence.
    """
    if not signals:
        return 0.0

    # Calculate weighted signal strength
    total_weighted_strength = 0.0
    platforms_seen = set()
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}

    for signal in signals:
        # Base weight from severity
        severity = signal.get("severity", "low")
        severity_weight = {"critical": 5.0, "high": 3.0, "medium": 1.5, "low": 1.0}[severity]
        severity_counts[severity] += 1

        # Engagement multiplier
        engagement_mult = signal.get("engagement_multiplier", 1.0)

        # Authority multiplier
        authority_mult = signal.get("author_authority", 1.0)

        # Platform authority
        platform = signal.get("platform", "unknown")
        platform_mult = PLATFORM_AUTHORITY.get(platform, 0.8)
        platforms_seen.add(platform)

        # Combined weight
        signal_weight = severity_weight * engagement_mult * authority_mult * platform_mult
        total_weighted_strength += signal_weight

    # Normalize to 0-1 scale
    # Expected max for strong target: ~500 weighted points
    normalized = min(total_weighted_strength / 500, 1.0)

    # Platform diversity bonus (max 0.15)
    diversity_bonus = min(len(platforms_seen) * 0.03, 0.15)

    # Critical signal bonus (max 0.15)
    critical_bonus = min(severity_counts["critical"] * 0.03, 0.15)

    # High signal bonus (max 0.10)
    high_bonus = min(severity_counts["high"] * 0.01, 0.10)

    return min(normalized + diversity_bonus + critical_bonus + high_bonus, 1.0)
```

### 7.2 Z-Scarcity V2

```python
def calculate_z_scarcity_v2(competitors: list) -> float:
    """
    V2: Weighted by competitor strength, not just count.
    A dead project != a VC-backed unicorn.
    """
    if not competitors:
        return 1.0  # No competitors = maximum opportunity

    # Calculate threat score for each competitor
    total_threat = 0.0

    for comp in competitors:
        threat = 1.0  # Base threat

        # Funding status
        funding = comp.get("funding", "unknown")
        if funding in ["series_c", "series_d", "public"]:
            threat *= 3.0   # Well-funded = major threat
        elif funding in ["series_a", "series_b"]:
            threat *= 2.0   # Growing threat
        elif funding in ["seed", "angel"]:
            threat *= 1.2   # Minor threat
        elif funding == "bootstrapped":
            threat *= 1.0   # Comparable
        elif funding == "dead":
            threat *= 0.1   # Not a real competitor

        # Recency
        last_update = comp.get("last_update_months", 12)
        if last_update <= 3:
            threat *= 1.5   # Actively maintained
        elif last_update <= 6:
            threat *= 1.2   # Recently active
        elif last_update <= 12:
            threat *= 1.0   # Normal
        else:
            threat *= 0.5   # Possibly abandoned

        # Market positioning
        positioning = comp.get("positioning", "direct")
        if positioning == "direct":
            threat *= 1.5   # Same target market
        elif positioning == "adjacent":
            threat *= 1.0   # Related market
        elif positioning == "tangential":
            threat *= 0.5   # Different focus

        total_threat += threat

    # Convert threat to scarcity score (inverse relationship)
    # 0 threat = 1.0 scarcity, 10 threat = 0.1 scarcity
    scarcity = max(0.1, 1.0 - (total_threat / 15))

    return scarcity
```

### 7.3 Z-Migration V2 (NEW)

```python
def calculate_z_migration(signals: list) -> float:
    """
    NEW: Explicit migration intent scoring.
    Users actively seeking alternatives = GTM gold.
    """
    migration_signals = [s for s in signals if s.get("is_migration_intent", False)]

    if not migration_signals:
        return 0.0

    # Weight by recency and engagement
    weighted_migration = 0.0

    for signal in migration_signals:
        base = 1.0

        # Recency bonus
        age_days = signal.get("age_days", 30)
        if age_days <= 7:
            base *= 3.0   # Very recent
        elif age_days <= 30:
            base *= 2.0   # Recent
        elif age_days <= 90:
            base *= 1.0   # Normal
        else:
            base *= 0.5   # Old

        # Engagement
        base *= signal.get("engagement_multiplier", 1.0)

        weighted_migration += base

    # Normalize (expect ~20 weighted signals for strong opportunity)
    return min(weighted_migration / 20, 1.0)
```

---

## 8. FINAL SCORING FORMULA V2

### 8.1 Updated Weights

```python
WEIGHTS_V2 = {
    "z_convergence": 0.35,   # Down from 0.45 (less important with quality signals)
    "z_velocity": 0.25,      # Down from 0.35 (now properly measured)
    "z_scarcity": 0.15,      # Down from 0.20 (weighted by threat now)
    "z_migration": 0.25,     # NEW: Explicit migration intent
}
```

### 8.2 Score Calculation

```python
def calculate_864z_score_v2(
    z_convergence: float,
    z_velocity: float,
    z_scarcity: float,
    z_migration: float,
    rule_of_40: float,
    has_crisis_event: bool = False
) -> tuple:
    """
    V2 864z Score with migration intent and crisis detection.
    """
    # Base score (0-10 scale)
    base_score = (
        (z_convergence * WEIGHTS_V2["z_convergence"]) +
        (z_velocity * WEIGHTS_V2["z_velocity"]) +
        (z_scarcity * WEIGHTS_V2["z_scarcity"]) +
        (z_migration * WEIGHTS_V2["z_migration"])
    ) * 10

    # Exit multiplier (Rule of 40)
    exit_mult = 1.5 if rule_of_40 >= RULE_OF_40_THRESHOLD else 1.0

    # Crisis multiplier (breach, shutdown, major outage)
    crisis_mult = 1.3 if has_crisis_event else 1.0

    final_score = base_score * exit_mult * crisis_mult

    return final_score, exit_mult, crisis_mult
```

### 8.3 Verdict Logic V2

```python
def determine_verdict_v2(
    vulture_score: float,
    tshirt_size: str,
    competitor_threat: float,
    migration_score: float,
    has_crisis: bool
) -> StrikeStatus:
    """
    V2 Verdict with migration and crisis overrides.
    """
    # Crisis override: If there's a major crisis and migration intent, force STRIKE review
    if has_crisis and migration_score >= 0.5:
        if vulture_score >= 7.0:
            return StrikeStatus.STRIKE  # Crisis + migration = GO

    # Standard thresholds
    STRIKE_THRESHOLD = 8.64
    HANGAR_THRESHOLD = 7.0

    # High migration can lower threshold
    effective_threshold = STRIKE_THRESHOLD
    if migration_score >= 0.7:
        effective_threshold = 7.5  # Strong migration intent lowers bar
    elif migration_score >= 0.5:
        effective_threshold = 8.0  # Moderate migration helps

    # Decision
    if vulture_score >= effective_threshold:
        if tshirt_size != "L" and competitor_threat < 10.0:
            return StrikeStatus.STRIKE
        else:
            return StrikeStatus.HANGAR  # Qualified but constrained
    elif vulture_score >= HANGAR_THRESHOLD:
        return StrikeStatus.HANGAR
    else:
        return StrikeStatus.REJECT
```

---

## 9. CRISIS EVENT DETECTION

### 9.1 Crisis Types

```python
CRISIS_TYPES = {
    "data_breach": {
        "patterns": [r"(data|security)\s*(breach|leak|hack)", r"compromised"],
        "multiplier": 1.5,
        "urgency": "CRITICAL"
    },
    "service_outage": {
        "patterns": [r"(outage|down|offline)", r"can\'t\s*(access|login)"],
        "multiplier": 1.2,
        "urgency": "HIGH"
    },
    "price_hike": {
        "patterns": [r"price\s*(increase|hike|doubled)", r"raising\s*prices"],
        "multiplier": 1.3,
        "urgency": "HIGH"
    },
    "shutdown": {
        "patterns": [r"shut(ting)?\s*down", r"sunset", r"end\s*of\s*life", r"discontinued"],
        "multiplier": 1.5,
        "urgency": "CRITICAL"
    },
    "acquisition": {
        "patterns": [r"acquired\s*by", r"bought\s*by", r"sold\s*to"],
        "multiplier": 1.2,
        "urgency": "MEDIUM"
    },
    "tos_change": {
        "patterns": [r"terms\s*of\s*service", r"TOS\s*change", r"policy\s*update"],
        "multiplier": 1.1,
        "urgency": "MEDIUM"
    },
    "layoffs": {
        "patterns": [r"layoff", r"laid\s*off", r"downsizing", r"reducing\s*staff"],
        "multiplier": 1.2,
        "urgency": "MEDIUM"
    }
}
```

### 9.2 Crisis Detection

```python
def detect_crisis_events(signals: list) -> dict:
    """
    Scan signals for crisis indicators.
    """
    detected = []

    for signal in signals:
        content = signal.get("content", "").lower()

        for crisis_type, config in CRISIS_TYPES.items():
            for pattern in config["patterns"]:
                if re.search(pattern, content, re.I):
                    detected.append({
                        "type": crisis_type,
                        "signal": signal,
                        "multiplier": config["multiplier"],
                        "urgency": config["urgency"],
                        "detected_at": datetime.utcnow().isoformat()
                    })
                    break  # One match per signal per crisis type

    # Calculate overall crisis state
    has_crisis = len(detected) > 0
    max_multiplier = max([c["multiplier"] for c in detected], default=1.0)
    highest_urgency = "NONE"

    if any(c["urgency"] == "CRITICAL" for c in detected):
        highest_urgency = "CRITICAL"
    elif any(c["urgency"] == "HIGH" for c in detected):
        highest_urgency = "HIGH"
    elif any(c["urgency"] == "MEDIUM" for c in detected):
        highest_urgency = "MEDIUM"

    return {
        "has_crisis": has_crisis,
        "crisis_count": len(detected),
        "crises": detected,
        "max_multiplier": max_multiplier,
        "highest_urgency": highest_urgency
    }
```

---

## 10. OUTPUT SCHEMA V2

### 10.1 Enhanced Quest JSON

```json
{
  "quest_id": "VN-2026-Q006",
  "version": "2.0.0",
  "target_name": "ExampleSaaS",
  "generated_at": "2026-03-26T12:00:00Z",

  "signals": {
    "total_raw": 156,
    "total_weighted": 423.5,
    "by_platform": {
      "twitter": {"count": 45, "weighted": 89.2},
      "reddit": {"count": 67, "weighted": 134.8},
      "hacker_news": {"count": 12, "weighted": 156.0},
      "g2": {"count": 32, "weighted": 43.5}
    },
    "by_severity": {
      "critical": 8,
      "high": 34,
      "medium": 78,
      "low": 36
    }
  },

  "velocity": {
    "count_24h": 12,
    "count_7d": 45,
    "count_30d": 89,
    "baseline_per_30d": 23,
    "spike_ratio_30d": 3.87,
    "is_spiking": true,
    "spike_trigger": "price_hike_announcement"
  },

  "migration": {
    "intent_signals": 28,
    "weighted_score": 0.72,
    "top_destinations": ["CompetitorA", "CompetitorB"],
    "recent_threads": [
      {"platform": "reddit", "title": "Switching from ExampleSaaS - need advice", "engagement": 234}
    ]
  },

  "crisis": {
    "has_crisis": true,
    "type": "price_hike",
    "urgency": "HIGH",
    "multiplier": 1.3,
    "first_detected": "2026-03-20T09:00:00Z"
  },

  "scores": {
    "z_convergence": 0.78,
    "z_velocity": 0.82,
    "z_scarcity": 0.65,
    "z_migration": 0.72,
    "base_score": 7.42,
    "exit_multiplier": 1.5,
    "crisis_multiplier": 1.3,
    "vulture_score": 14.47,
    "effective_threshold": 7.5
  },

  "verdict": {
    "status": "STRIKE",
    "confidence": 0.89,
    "rationale": [
      "Vulture Score 14.47 exceeds threshold 7.5",
      "Strong migration intent (0.72) detected",
      "Crisis event (price_hike) active with 1.3x multiplier",
      "T-shirt size M within build capacity"
    ]
  }
}
```

---

## 11. IMPLEMENTATION PHASES

### Phase 1: Core Scraper (Week 1-2)
- [ ] Twitter/X API integration
- [ ] Reddit API integration
- [ ] Hacker News Algolia integration
- [ ] Signal storage (SQLite/PostgreSQL)

### Phase 2: Scoring Engine (Week 2-3)
- [ ] Engagement multiplier calculations
- [ ] Authority scoring
- [ ] Velocity spike detection
- [ ] Z-factor V2 calculations

### Phase 3: Classification (Week 3-4)
- [ ] Severity pattern matching
- [ ] Migration intent detection
- [ ] Crisis event detection
- [ ] NLP sentiment backup (optional)

### Phase 4: Integration (Week 4-5)
- [ ] Replace quest_engine.py V1 logic
- [ ] Output schema migration
- [ ] CLI updates
- [ ] Testing with known targets

---

## 12. SUCCESS METRICS

| Metric | V1 Baseline | V2 Target |
|--------|-------------|-----------|
| False positive rate | ~30% | <10% |
| Signal-to-noise ratio | 2:1 | 10:1 |
| Crisis detection latency | N/A | <24 hours |
| Migration intent capture | 0% | >80% |
| Platform coverage | 2 | 6+ |

---

## APPENDIX A: CONSTANTS

```python
# Thresholds
SCORE_THRESHOLD = 8.64
HANGAR_THRESHOLD = 7.0
RULE_OF_40_THRESHOLD = 40
SCARCITY_THRESHOLD = 3
TARGET_EXIT_VALUATION = 141312

# Weights V2
WEIGHTS_V2 = {
    "z_convergence": 0.35,
    "z_velocity": 0.25,
    "z_scarcity": 0.15,
    "z_migration": 0.25,
}

# Platform Authority
PLATFORM_AUTHORITY = {
    "hacker_news": 1.5,
    "twitter": 1.2,
    "reddit": 1.0,
    "g2": 1.3,
    "capterra": 1.1,
    "product_hunt": 1.0,
    "linkedin": 0.8,
    "trustpilot": 0.7,
}
```

---

**Document Version:** 2.0.0-DRAFT
**Author:** Claude Code (Opus 4.5)
**Created:** 2026-03-26
**Status:** Ready for implementation review

---
