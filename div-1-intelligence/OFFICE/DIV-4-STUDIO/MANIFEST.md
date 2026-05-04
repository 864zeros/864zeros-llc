# DIV-4-STUDIO — Marketing Operations Manifest

> **Division:** 4 (Creative Studio)
> **Purpose:** Go-to-market, branding, and promotional content
> **Scope:** Marketing operations ONLY. No code changes, no technical work.

---

## Division Rules

1. **Marketing Only** — This division handles GTM assets, copy, and promotional materials.
2. **No Code** — Source code modifications belong in DIV-3-FACTORY.
3. **Brand Compliance** — All assets must follow 864zeros brand guidelines.
4. **Human Approval** — All public-facing content requires signature before publish.

---

## Folder Structure

```
DIV-4-STUDIO/
├── drafts/             # Work-in-progress marketing assets
│   └── {project}/      # Individual project folders
├── approved/           # Human-signed, ready to publish
├── published/          # Live assets (archive)
├── assets/             # Brand assets, images, logos
└── MANIFEST.md         # This file
```

---

## Project Lifecycle

```
INTAKE → DRAFTING → REVIEW → APPROVAL → PUBLISH
   ↓         ↓         ↓         ↓          ↓
 Brief    DIV-4     DIV-4    Gatekeeper   Launch
         Studio    Studio    Signature
```

### Entry Criteria
- [ ] Product code complete (DIV-3 signed off)
- [ ] Target audience defined
- [ ] Key messaging approved
- [ ] Launch date set

### Exit Criteria
- [ ] All assets drafted
- [ ] Brand compliance checked
- [ ] Human review complete
- [ ] Gatekeeper signature obtained

---

## Current Projects

| Product | Campaign | Status | Location |
|---------|----------|--------|----------|
| ReadFlow | Launch GTM | Drafting | `drafts/readflow/` |

---

## Asset Types

### Required for Launch
| Asset | Platform | Status |
|-------|----------|--------|
| Reddit Post | r/kobo, r/instapaper | Draft |
| Twitter Thread | @864zeros | Draft |
| Product Hunt Brief | producthunt.com | Draft |

### Optional
| Asset | Platform | Status |
|-------|----------|--------|
| Landing Page | 864zeros.com | Not started |
| Demo Video | YouTube | Not started |
| Press Kit | Media | Not started |

---

## Brand Guidelines

### Voice & Tone
- **Direct** — No fluff, no corporate speak
- **Technical but accessible** — Explain without condescending
- **Anti-SaaS** — Position against subscription fatigue
- **Local-first advocate** — Emphasize privacy and ownership

### Key Messages
1. **"Read without ransom"** — Anti-subscription positioning
2. **"Your data, your device"** — Privacy focus
3. **"Organize Your Internal Architecture"** — OIA mission
4. **"$150 once, forever yours"** — Lifetime value proposition

### Brand Assets
- Logo: `864` (bold) + `zeros` (light)
- Primary color: `#00d084` (Trust Green)
- Secondary: `#0a0a0f` (Deep Black)
- Font: Inter (400-700)

---

## Channel Strategy

### Reddit
- Target: r/kobo, r/instapaper, r/selfhosted, r/ereader
- Format: Personal story + feature list
- Engagement: Pre-written FAQ responses

### Twitter/X
- Target: #Kobo, #ReadItLater, #IndieHacker
- Format: 4-part thread
- Timing: 9am EST launch, 2pm EST follow-up

### Product Hunt
- Format: Full story + maker's comment
- Assets: Screenshots, demo video
- Metrics: 100+ upvotes day 1

---

## Approval Protocol

When assets are ready for publish:

1. Move completed drafts to `HALLWAY/`
2. Gatekeeper logs "WAITING FOR HUMAN SIGNATURE"
3. Human reviews all public-facing content
4. Approved assets move to `approved/`
5. Post-publish, archive to `published/`

---

## Prohibited Actions

- Modifying source code
- Changing technical documentation
- Updating BUILD_MANIFEST.md
- Accessing DIV-3-FACTORY projects directly

---

*864zeros Creative Studio | Marketing Operations*
*Last updated: 2026-03-18*
