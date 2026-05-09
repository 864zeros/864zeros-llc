# aether-pulse-x — Project Review
**Date:** 2026-05-05  
**Reviewer:** Claude Code  
**Version Reviewed:** V1.1

---

## What It Is

A social engagement automation tool for 864 Zeros LLC. It monitors X (Twitter) for high-engagement posts about AI agents/frameworks, scores them for AETHER relevance using Claude, drafts replies in Jeff Conn's voice, and delivers them to Telegram for manual review and posting. **Never auto-posts — strictly human-in-the-loop.**

---

## Architecture

```
Apify (scrape X) → Scorer (Claude LLM) → Drafter (Claude) → Telegram (Jeff reviews) → Manual post
```

**9 modules, clean separation:**

| Module | Role |
|---|---|
| `scraper.py` | Apify Tweet Scraper V2 adapter |
| `scorer.py` | LLM semantic scoring (V1.1) |
| `drafter.py` | Claude reply generator |
| `notifier.py` | Async Telegram delivery |
| `logger.py` | SQLite log + dedup registry |
| `config.py` | Keywords, proof points, thresholds |
| `pulse_x.py` | Main orchestrator (monitor/snapshot/URL modes) |
| `bot.py` | Railway Telegram bot (persistent) |
| `snapshot.py` | Screenshot/URL analysis mode |

**Stack:** Python 3.11, Anthropic SDK, Apify, Telegram Bot API, SQLite. Only 4 external dependencies. No frameworks, no vector DBs.

---

## Status: Production-Ready, V1.1

- **V1.0** (March 26, 2026): Basic keyword matching + rule-based scoring
- **V1.1** (current): LLM semantic scoring with 6 intent tiers (T1–T6), recency bonuses, snapshot/URL modes, Railway deployment

The system is actively running. Proven 18% CTR on posted replies.

---

## What's Working Well

- LLM-based semantic scoring is a real quality upgrade over V1.0 keyword matching
- Hard gates enforced correctly: score ≥ 0.65, max 3 drafts/day, dedup on post ID
- Power-word enforcement with retry logic in drafter
- X character counting handles URLs as 23 chars (correct per X spec)
- AETHER capsule structure (`manifest.json`, `persona.json`, `kb.md`) is complete
- Railway deployment config is solid (`nixpacks.toml` + `Procfile`)
- 22 unit tests written and covering core paths

---

## Issues Found

### Medium — Fix Before Next Run

**1. Async/await pattern is broken in monitor mode**
- `notifier.py` declares `async def send_draft_to_telegram()` but `pulse_x.py` calls it without `await` (lines 64, 120, 159)
- In Railway bot mode this works by accident; in direct `python pulse_x.py` mode, messages may silently not send if the script exits before the coroutine completes
- **Fix:** Wrap calls in `asyncio.run()` or make notifier synchronous

**2. Tests call real Claude API**
- `test_scorer.py` calls `score_post()` which hits the Anthropic API
- These are integration tests masquerading as unit tests — cost money to run, break in CI without credentials
- **Fix:** Mock the LLM calls with `unittest.mock`

**3. No retry logic for external calls**
- If Apify or Claude returns a transient error, the post/keyword is silently skipped
- No backoff, no queue
- **Risk:** Missing a high-relevance post due to a brief outage

**4. No timeout on Claude API calls**
- `client.messages.create()` has `max_tokens` but no `timeout` parameter
- A hung API call blocks the entire run indefinitely
- **Fix:** Add `timeout=30` (or similar) to all Claude client calls

### Low — Cleanup

**5. Recency bonus values mismatch between code and tests**
- `scorer.py` line 116 returns `0.10` for fresh posts; `test_scorer.py` expects `0.15`
- `scorer.py` line 122 returns `-0.15` for stale posts; `test_scorer.py` expects `-0.20`
- 5 recency tests are currently failing

**6. `debug_scoring.py` is obsolete**
- Still implements the V1.0 rule-based scoring algorithm
- Running it produces wrong results under V1.1 LLM-based scoring
- Should be rewritten for V1.1 or deleted

**7. Model name hardcoded in three files**
- `"claude-sonnet-4-20250514"` appears in `scorer.py:154`, `drafter.py:105`, `snapshot.py:66`
- Should be centralized in `config.py` so a model update is a one-line change

**8. `capsule/kg.jsonld` is empty**
- Knowledge graph file is referenced in documentation but never populated
- Not blocking V1.1 but needs to be generated for full AETHER capsule compliance

**9. Telegram HTML not sanitized**
- `notifier.py` builds HTML-formatted messages without escaping post content
- If a scraped post contains `<` or `>` characters, Telegram message formatting may break

---

## Test Status

| Suite | Tests | Status |
|---|---|---|
| High-level scoring | 5 | Passing |
| Deduplication | 1 | Passing |
| Max drafts limit | 1 | Passing |
| X character length | 3 | Passing |
| Power words | 3 | Passing |
| Recency bonuses | 5 | **FAILING** (values mismatch) |

---

## Priority Fix List

| # | Priority | Item |
|---|---|---|
| 1 | High | Fix async/await in `pulse_x.py` monitor mode |
| 2 | High | Align recency bonus values in `scorer.py` and `test_scorer.py` |
| 3 | High | Mock LLM calls in unit tests |
| 4 | Medium | Add timeout + retry for Apify and Claude API calls |
| 5 | Low | Move model name to `config.py` |
| 6 | Low | Delete or rewrite `debug_scoring.py` for V1.1 |

---

## Overall Assessment

Solid, well-structured project. The V1.1 semantic scoring upgrade is the right architectural call and the "human in the loop" constraint is cleanly enforced — there are zero X write API calls anywhere in the codebase.

Primary risk is the async bug that could cause silent Telegram failures in standalone monitor mode. The 5 failing recency tests and the obsolete debug script are low-effort cleanup items.

**Rating: Production-functional, minor hardening needed.**
