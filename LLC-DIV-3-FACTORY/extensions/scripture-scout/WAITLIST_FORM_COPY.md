# [FHG] ScriptureScout — Founding 100 Waitlist Form Copy

**Purpose:** filter for mission-aligned users (per `OR_STRIKE_012_PREFLIGHT.md` §1) at signup.
**Hosting:** the form lives at `864zeros.com/scripturescout` (or the chosen sub-domain).
**Cap:** 100 approved users; remainder go to a wait-list for Closed Beta (Phase 4).

---

## Form structure

```
┌─────────────────────────────────────────────────────────────┐
│  Heritage-first technology. Preserving what matters most.   │
│                                                             │
│  ScriptureScout is in Founding 100 access. We're capping at │
│  100 invitations to give every early user a real human on   │
│  the other end of "this isn't working." When the cohort     │
│  fills, the door closes for ~60 days while we listen.       │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Your email                                                 │
│  [______________________________]                           │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ★ THE QUESTION (one only):                                 │
│                                                             │
│  What study work are you trying to liberate?                │
│                                                             │
│  Tell us what scripture work currently lives somewhere      │
│  it doesn't belong — locked in YouVersion, trapped in       │
│  Logos, scattered across Olive Tree highlights, or just     │
│  re-typed every Sunday because there's no other way.        │
│                                                             │
│  We read every answer personally. There's no "right"        │
│  answer — but specificity helps us help you. (1-3 sentences │
│  is plenty.)                                                │
│                                                             │
│  [ Multi-line text area, 4 rows visible ]                   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [  Request Founding 100 access  ]                          │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Built for the serious student of the Word.                 │
│  Designed to bridge the gap between digital reading         │
│  and a permanent, sovereign study vault.                    │
│  Iterated for precision; preserved for heritage.            │
└─────────────────────────────────────────────────────────────┘
```

---

## The Question — full text

> **What study work are you trying to liberate?**
>
> Tell us what scripture work currently lives somewhere it doesn't belong — locked in YouVersion, trapped in Logos, scattered across Olive Tree highlights, or just re-typed every Sunday because there's no other way.
>
> We read every answer personally. There's no "right" answer — but specificity helps us help you. (1-3 sentences is plenty.)

---

## Why this question (rationale for review board)

It does **four** jobs at once:

1. **Filters for intent.** A vague answer like "trying it out" or "looks cool" signals an experimenter, not someone with real lock-in pain. Score 1/3 → wait-list.
2. **Filters for vocation.** Answers mentioning sermon prep, seminary classes, weekly Bible study leadership, theological research, etc., signal the wedge audience (vault-native knowledge workers in faith vocations). Score 3/3 → invite.
3. **Surfaces the next selector profile.** If multiple respondents say "Logos," that confirms the Phase-2 priority. If they say "BibleStudyTools" or "STEP Bible," we know which profile to harvest next.
4. **Builds the testimonial pipeline.** A 30-day check-in to high-scoring respondents feeds the Phase 5 public-launch landing page with real, attributed quotes.

---

## Scoring rubric (manual, reviewed by Office Architect)

| Score | Signal | Outcome |
|---|---|---|
| **3** | Names a specific app/system AND a specific work product (e.g., "I have 4 years of Logos highlights I can't get out without retyping; sermon prep takes 6h/week") | Auto-invite to Founding 100 |
| **2** | Names either a specific app OR a specific use case but not both (e.g., "I want to get my YouVersion notes into Obsidian" or "Need a way to keep my Bible study work without paying $40/mo") | Invite if seats available; otherwise top of wait-list |
| **1** | Vague enthusiasm ("looks great", "would love to try", "for personal study") | Wait-list (Closed Beta phase) |
| **0** | Off-topic / spam / contradicts the wedge ("I want AI sermon-writing", "for my church to track members") | Decline politely; suggest Bible Insight (AI synthesis) when it ships |

The rubric is published nowhere — it's an internal calibration tool. Respondents see only "Thanks — we read every answer; if Founding 100 is a fit we'll be in touch within 7 days."

---

## Three "good answer" examples (for internal calibration)

> *"I'm a PCA pastor doing weekly expositional preaching. My BibleGateway highlights and Logos notes from 8 years of study are siloed in two different proprietary clouds; I'd kill to have them as Markdown alongside my sermon notes in Obsidian."* — Score 3, invite immediately.

> *"Seminary student finishing my MDiv. I take all my class notes in Logseq and want my Strong's lookups + Greek interlinear work from BibleHub to live there too instead of re-keying."* — Score 3, invite immediately.

> *"Bible study leader at my church. I currently keep verse references and discussion questions in a Google Doc. I want a workflow where my study highlights from BLB or BG end up auto-organized in something I own."* — Score 3, invite immediately.

## Three "low-signal answer" examples

> *"Looks cool, would love early access."* — Score 1, wait-list.

> *"For personal devotion."* — Score 1, wait-list (no specificity about lock-in or workflow).

> *"I want AI to summarize Bible chapters for me."* — Score 0, decline politely, mention Bible Insight roadmap.

---

## Approval email template (Score 2-3)

```
Subject: Welcome to ScriptureScout Founding 100

Hey [name],

Read your note about [specific thing they mentioned — e.g., "your Logos
highlights you can't extract"]. That's exactly the lock-in we built
ScriptureScout to dissolve.

You're in. Here's your install link (Chrome only for now):
[unlisted Chrome Web Store URL]

Three things to know:
1. ScriptureScout is local-first. Your captures never leave your device
   unless you click Liberate (which writes Markdown to your Downloads
   folder for you to drop into your vault).
2. We currently extract from BibleGateway, Blue Letter Bible, and
   BibleHub interlinear. YouVersion + Logos are coming if there's signal.
3. I'm one human. Reply to this email when something breaks or feels
   off; I'll fix it within a week.

Thank you for trusting us with your study work.

— [Operator name]
   864zeros LLC · For His Grace pillar
```

---

## Decline email template (Score 0-1)

```
Subject: ScriptureScout — wait-list confirmed

Hey [name],

Thanks for the interest in ScriptureScout. We're being deliberately
small with the Founding 100 invitations to make sure every early user
gets real support, so we're holding most signups for the next phase.

You're on the wait-list — we'll reach out in ~60 days when we open the
Closed Beta.

In the meantime: ScriptureScout's wedge is migrating *existing*
scripture study work out of proprietary apps (YouVersion, Logos, BLB,
etc.) into Markdown vaults like Obsidian. If that ends up matching
something you're trying to do, just reply and let me know — I'll bump
you up the queue.

— [Operator name]
   864zeros LLC · For His Grace pillar
```

---

## Phase 4 (Closed Beta) trigger

The wait-list opens for invites once **any one** of the Founding 100 closure criteria fires (per OR_STRIKE_012_PREFLIGHT.md §1.2):

1. 100 users completed at least one Liberation, OR
2. 60 days elapsed, OR
3. Office Architect signs off on early-close based on saturated feedback

Closed Beta sends ~50 invitations per week from the wait-list, prioritizing Score-3 then Score-2 respondents.

---

*Waitlist form copy v1.0 · 2026-05-08 · per OR_STRIKE_012_PREFLIGHT.md §1*
