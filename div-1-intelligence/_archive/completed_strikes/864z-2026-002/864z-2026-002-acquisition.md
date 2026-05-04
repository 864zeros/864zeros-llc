# GTM Acquisition Plan: 864z-2026-002 (ReadVault)

**Strike ID:** 864z-2026-002
**Product:** ReadVault - Pocket Alternative
**Pain Signals:** Export, Privacy, Import friction
**Generated:** 2026-03-17

---

## 1. The Reddit "Rescue" Protocol

### Target Subreddits (Ranked by Pain Signal Density)

| Rank | Subreddit | Pain Signal | Engagement Strategy |
|------|-----------|-------------|---------------------|
| 1 | r/pocket | Direct users, export complaints | Help thread responses |
| 2 | r/degoogle | Privacy exodus, Mozilla concerns | Privacy-first positioning |
| 3 | r/selfhosted | Local-first advocates | Technical credibility |
| 4 | r/productivity | Tool frustration, workflow issues | Solution offering |
| 5 | r/privacy | Data ownership concerns | Zero-cloud messaging |
| 6 | r/DataHoarder | Export/backup obsession | "Rescue your data" angle |

### Search Queries to Monitor

```
site:reddit.com "pocket" "export" "frustrated"
site:reddit.com "pocket" "alternative" "privacy"
site:reddit.com "pocket" "mozilla" "worried"
site:reddit.com "pocket" "sync" "broken"
site:reddit.com "leaving pocket" OR "left pocket"
```

---

## Reddit Response Templates

### Template A: Export Pain Response

**Trigger:** User complaining about Pocket export limitations

```
Hey, I saw you're having trouble getting your data out of Pocket. I actually built
something for exactly this problem after hitting the same wall.

It's called ReadVault - it's a Chrome extension that imports your Pocket export
file (the ril_export.html) and stores everything locally in your browser. No
account needed, no cloud, nothing leaves your device.

The "Rescue Wizard" walks you through it: export from Pocket → drag file into
ReadVault → done. All your articles, tags, and timestamps come over.

It's free and open source. Happy to answer any questions if you try it.

[link with UTM: ?utm_source=reddit&utm_medium=comment&utm_campaign=rescue&utm_content=export_pain]
```

### Template B: Privacy Concern Response

**Trigger:** User worried about Pocket/Mozilla data practices

```
Totally get the concern. After Mozilla acquired Pocket, a lot of us started
looking for alternatives that don't require trusting a third party with our
reading lists.

I ended up building ReadVault - it's 100% offline-first. Your articles are
stored in IndexedDB (your browser's local database), not on any server. There's
no account, no sync service, no analytics. The code doesn't even make network
requests.

If you want to migrate, it can import your Pocket export directly. Takes about
30 seconds.

[link with UTM: ?utm_source=reddit&utm_medium=comment&utm_campaign=rescue&utm_content=privacy_concern]
```

### Template C: "Looking for Alternative" Response

**Trigger:** User explicitly seeking Pocket alternatives

```
Been down this road. Most "alternatives" are just Pocket clones with the same
cloud dependency.

I built ReadVault specifically to be different:
- Everything stored locally (IndexedDB, not their servers)
- Imports your Pocket data directly (HTML or JSON export)
- Exports to JSON, HTML, CSV, or Markdown (your data is never trapped)
- No account required
- Free tier has zero limitations on core features

The paid tier ($9 one-time) is only for optional cloud sync if you want it
later. But honestly, most people don't need it.

[link with UTM: ?utm_source=reddit&utm_medium=comment&utm_campaign=rescue&utm_content=alternative_search]
```

### Template D: Technical/Self-Hosted Crowd

**Trigger:** r/selfhosted or technically-minded users

```
If you're looking for something you actually control: ReadVault stores
everything in IndexedDB with a clean export pipeline.

Architecture:
- Chrome Extension (MV3)
- IndexedDB for persistence
- Zero network calls in free tier
- Full JSON export anytime
- Imports Pocket's ril_export.html natively

I built it because I wanted a read-later tool where "my data" actually means
my data. No Firebase, no Supabase, no "sync" that's really just vendor lock-in.

MIT licensed, source available.

[link with UTM: ?utm_source=reddit&utm_medium=comment&utm_campaign=rescue&utm_content=selfhosted]
```

---

## 2. X (Twitter) "Vulture" Hooks

### Hook 1: The $0 Cloud Cost Flex

```
Built a Pocket alternative with $0/month infrastructure costs.

How:
- IndexedDB (browser-native storage)
- No server
- No database
- No "free tier that expires"

Users own their data. I own my margins.

This is the unbundling playbook: find bloated SaaS, strip out the cloud tax,
ship the core value.

ReadVault: [link with UTM: ?utm_source=twitter&utm_medium=organic&utm_campaign=buildinpublic&utm_content=zero_cost]
```

### Hook 2: The Privacy Angle

```
Pocket knows every article you've ever saved.

ReadVault knows nothing.

That's not a bug in our business model. It's the entire point.

Built a read-later app where:
✓ Data stays on your device
✓ No account required
✓ No analytics
✓ No "personalization" (surveillance)

Sometimes the best feature is what you DON'T build.

[link with UTM: ?utm_source=twitter&utm_medium=organic&utm_campaign=buildinpublic&utm_content=privacy_flex]
```

### Hook 3: The Unbundling Thesis

```
Unbundling Pocket, one feature at a time.

What Pocket charges for → What I built for free:
- Cloud storage → IndexedDB (your browser)
- Sync service → Export/Import (you control)
- Premium features → All features, one tier

The playbook:
1. Find SaaS with cloud dependency
2. Ask "does this NEED a server?"
3. Usually: no
4. Ship local-first version
5. Profit (85% margins when infra = $0)

Strike 864z-2026-002: DEPLOYED

[link with UTM: ?utm_source=twitter&utm_medium=organic&utm_campaign=buildinpublic&utm_content=unbundling]
```

---

## 3. Indie Hackers / Hacker News Technical Post

### Title Options:
- "I built a Pocket alternative with $0 infrastructure using an 80/20 automation system"
- "How I ship Chrome extensions in hours using reusable 'bricks'"
- "The economics of local-first: 85% margins by not having servers"

### Post Body:

```markdown
# Building a Pocket Alternative in One Day with 80/20 Automation

I just shipped ReadVault, a privacy-first read-later Chrome extension.
Here's how the build process worked and why it only took one day.

## The Discovery

My "Vulture Nest" system flagged Pocket as a 9.32/10 opportunity:
- Users frustrated with export (can't get their data out easily)
- Privacy concerns after Mozilla acquisition
- Import friction from competitors

Score breakdown: Convergence (pain signals) × Velocity (growing frustration)
× Scarcity (few offline-first alternatives) = Strike Qualified.

## The 80/20 Build System

Instead of starting from scratch, I pulled from a registry of pre-built
"bricks":

| Brick | Function | Time Saved |
|-------|----------|------------|
| BRK-DB-001 | IndexedDB wrapper | ~4 hours |
| BRK-MIG-002 | Multi-format export | ~3 hours |
| BRK-PAY-004 | Tier/license system | ~2 hours |
| BRK-PRI-005 | Privacy redaction | ~1 hour |

That's 80% of the extension handled by reusable code.

## The 20% Delta

The custom work was specific to this strike:

1. **BRK-MIG-003: Universal ReadLater Parser** - Parses Pocket's HTML/JSON
   export formats. Handles timestamps, tags, and deduplication.

2. **Rescue Wizard UI** - A guided import flow that makes switching from
   Pocket frictionless. This is the "aha moment" that hooks users.

After building these, I registered them back into the brick registry.
Next time I target Instapaper or Raindrop, BRK-MIG-003 is ready.

## The Economics

- Infrastructure cost: $0/month
- Chrome Store fee: $5 (one-time)
- Margin: ~85%
- Rule of 40: 115% (30% growth + 85% margin)

When your product runs entirely in the user's browser, you don't pay for
their usage. Every user is pure margin after acquisition cost.

## Results

Shipped in one day. Now monitoring the "Successful Pocket Rescues" metric
for the first 30 days. Target: 500 imports.

The brick gets smarter with each strike. The factory gets faster.

---

Chrome Web Store: [link]
Source: [link]

Happy to answer questions about the architecture or the discovery system.
```

---

## 4. UTM Tracking Configuration

### Base URL
```
https://chrome.google.com/webstore/detail/readvault/[EXTENSION_ID]
```

### UTM Parameter Schema

| Parameter | Values |
|-----------|--------|
| utm_source | reddit, twitter, hackernews, indiehackers, producthunt |
| utm_medium | comment, organic, post, launch |
| utm_campaign | rescue, buildinpublic, launch |
| utm_content | [specific_variant] |

### Tracking Links Generated

```json
{
  "reddit_export_pain": "?utm_source=reddit&utm_medium=comment&utm_campaign=rescue&utm_content=export_pain",
  "reddit_privacy": "?utm_source=reddit&utm_medium=comment&utm_campaign=rescue&utm_content=privacy_concern",
  "reddit_alternative": "?utm_source=reddit&utm_medium=comment&utm_campaign=rescue&utm_content=alternative_search",
  "reddit_selfhosted": "?utm_source=reddit&utm_medium=comment&utm_campaign=rescue&utm_content=selfhosted",
  "twitter_zero_cost": "?utm_source=twitter&utm_medium=organic&utm_campaign=buildinpublic&utm_content=zero_cost",
  "twitter_privacy": "?utm_source=twitter&utm_medium=organic&utm_campaign=buildinpublic&utm_content=privacy_flex",
  "twitter_unbundling": "?utm_source=twitter&utm_medium=organic&utm_campaign=buildinpublic&utm_content=unbundling",
  "hackernews_post": "?utm_source=hackernews&utm_medium=post&utm_campaign=launch&utm_content=technical",
  "indiehackers_post": "?utm_source=indiehackers&utm_medium=post&utm_campaign=launch&utm_content=80_20_build"
}
```

---

## Execution Checklist

- [ ] Set up Google Alerts for "Pocket export" and "Pocket alternative"
- [ ] Monitor target subreddits daily for 2 weeks
- [ ] Post Twitter hooks (1 per day for 3 days)
- [ ] Submit to Indie Hackers
- [ ] Submit to Hacker News (Show HN)
- [ ] Track installs by UTM source
- [ ] Update tracking/864z-2026-002-stats.json weekly

---

*Generated by 864zeros GTM Automation*
