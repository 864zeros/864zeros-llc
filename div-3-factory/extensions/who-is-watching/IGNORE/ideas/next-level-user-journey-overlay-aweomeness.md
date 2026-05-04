I'll document this thoroughly for tomorrow's review and research phase.

https://www.kimi.com/chat/19ce00ae-bb92-8ff1-8000-090d50ff1931?chat_enter_method=history
---

## Product Decision: Extension Strategy

| Option | Approach | Tradeoff |
|--------|----------|----------|
| **A. Integrated** | Add "Journey Lens" as mode to Who Is Watching | Unified user base, one install, complexity risk |
| **B. Separate** | New extension: "Journey Lens by Who Is Watching" | Clean positioning, dedicated reviews, split attention |

**Recommendation: Integrated with tier-gating**

The visual overlay is a **Pro/Enterprise unlock**, not a separate product. Same extension, new mode. Avoids fragmenting your 100K Y1 install target and leverages existing detection engine.

---

## Documented Feature: "Journey Lens"

### Core Concept
Visual tracking observability layer that renders tracking events as contextual overlays on the actual webpage, with milestone capture for compliance and debugging.

### User Flow

```
[Install Who Is Watching] → [Browse normally] → [Badge shows tracker count]
                                    ↓
                        [Click extension icon] → [Panel opens: list view]
                                    ↓
                        [Toggle "Journey Lens" button] → [Overlay activates]
                                    ↓
        [Hover any element] → [See last 3 tracking events for that element]
                                    ↓
        [Milestone detected] → [Auto-capture screenshot + annotated overlay]
                                    ↓
        [Open Report] → [Visual timeline with synced screenshots + identity graph]
```

### Visual Language (Overlay)

| Event Type | Indicator | Animation |
|------------|-----------|-----------|
| Identity resolution | 🟢 Green ring | Expanding pulse 1s |
| High-signal conversion | 🔴 Red diamond | Flash + persist 3s |
| Intent scoring | 🟡 Yellow dot | Subtle glow |
| Consent state change | 🔵 Blue square | Border pulse |
| Cross-domain stitch | 🟣 Purple line | Draw animation between elements |

### Milestone Auto-Capture Triggers

| Trigger | Condition | Capture |
|---------|-----------|---------|
| Landing | First tracker load on new domain | Full viewport + entry point marked |
| Identity resolve | ECID → email/CRM ID stitch | Element that triggered resolution |
| Consent choice | TrustArc/OneTrust interaction | Before + after state |
| Conversion | Form submit, demo request, pricing click | Submit button + confirmation |
| Exit | Page unload beacon detected | Final viewport state |

### Output Format: "Visual Report 2.0"

```
┌─────────────────────────────────────────┐
│  Journey Report: www.sap.com           │
│  76s session • 17 vendors • 5 identities │
├─────────────────────────────────────────┤
│  [SCREENSHOT 1] Landing (10:46:36)      │
│  🟢 6sense identified company           │
│     └─ Overlay: Header region           │
├─────────────────────────────────────────┤
│  [SCREENSHOT 2] Identity resolved      │
│  (10:46:39)                             │
│  🟢 ECID stitched to jane.doe@...      │
│     └─ Overlay: Email input field       │
├─────────────────────────────────────────┤
│  [LIVE GRAPH] Identity evolution        │
│  [TIMELINE] Scrollable event log         │
└─────────────────────────────────────────┘
```

---

## Market Research Plan (Tomorrow)

### Competitor Audit: Visual/Overlay Tracking Tools

| Competitor | Visual Feature | Gap We Exploit |
|------------|--------------|----------------|
| **Tag Assistant** | None | No overlay, Google-only |
| **Omnibug** | None | Console logging only, no visual mapping |
| **Wappalyzer** | None | Detection only, no journey |
| **Adswere dataLayer Inspector+** | None | GTM-only, no screenshot |
| **Hotjar/FullStory** | Session replay | Post-hoc, no real-time tracking correlation |
| **LogRocket** | Session replay + network | No identity graph, no B2B intent visibility |
| **Fiddler/Charles** | None | Proxy-level, no DOM context |
| **Adobe Debugger** | None | Adobe-only, no visual overlay |
| **Ghostery** | Block indicators | No journey reconstruction, no identity tracking |
| **Blacklight** | None | Privacy scan, not live journey |

**Hypothesis:** No competitor combines **real-time visual overlay** + **identity graph** + **B2B intent tracking awareness** + **compliance-grade capture**.

### Research Questions to Answer

1. Does **Hotjar/FullStory** expose tracking vendor data to end users? (No — enterprise backend only)
2. Does **any** privacy tool show *which element* triggered *which beacon*? (Likely no)
3. Is there **session replay + tag debugging** in one tool? (Not at extension level)
4. Who serves **B2B marketers specifically** with journey visualization? (Gap)

### Uniqueness Vectors to Validate

| Claim | Validation Method |
|-------|-------------------|
| Only tool showing 6sense/Bombora intent on visual layer | Test on known 6sense customer sites |
| Only tool correlating consent choice → tag firing with visual proof | Compare TrustArc/OneTrust timing vs. beacon timing |
| Only tool with live identity graph overlay | Patent search, product hunt review |
| Only tool with shareable compliance artifact | Legal/privacy team interviews |

---

## Market Sizing & MRR Estimate

### TAM/SAM/SOM Framework

| Segment | Definition | Size | Our Capture |
|---------|-----------|------|-------------|
| **TAM** | All Chrome users with privacy concerns + martech professionals | 3B Chrome users × 10% aware = 300M | — |
| **SAM** | B2B marketing professionals + privacy-conscious enterprise users | 15M global | — |
| **SOM** | Active martech implementers + compliance officers who need proof | 500K | 5-10% = 25K-50K |

### Pricing Model (Integrated Extension)

| Tier | Price | Features | Target Users |
|------|-------|----------|--------------|
| **Free** | $0 | Basic detection, list view, 3-day history | Privacy-curious consumers |
| **Pro** | $29/mo | Journey Lens overlay, 10 visual reports/mo, identity graph | Solo marketers, consultants |
| **Team** | $79/user/mo | Unlimited reports, shared workspace, API access | Marketing teams |
| **Enterprise** | $499+/mo | SSO, CI/CD integration, compliance audit trail, custom SLA | Regulated industries |

### MRR Projection (Year 2, Conservative)

| Scenario | Users | Mix | MRR |
|----------|-------|-----|-----|
| Base case | 10K paid | 70% Pro, 20% Team, 10% Enterprise | $290K + $158K + $50K = **$498K** |
| Optimistic | 25K paid | 60% Pro, 30% Team, 10% Enterprise | $522K + $593K + $125K = **$1.24M** |
| With visual differentiation | +30% conversion on Pro/Team tiers | — | **$650K–$1.6M** |

### Market Capture Percentage

| Metric | Estimate | Rationale |
|--------|----------|-----------|
| Of existing privacy extension users | 2-3% | Compete with Ghostery, uBlock — but we serve pros |
| Of martech professionals | 5-8% | Adobe/Marketo/6sense user bases ~2M combined |
| Of compliance officer tools | 10-15% | New category, first-mover if validated |

---

## Tomorrow's Agenda

| Time | Activity | Output |
|------|----------|--------|
| 0:00-1:00 | Competitor deep-dive: Hotjar, FullStory, LogRocket, Adobe Debugger | Feature matrix |
| 1:00-2:00 | Test 5 known 6sense customer sites with prototype overlay logic | Validation video/GIF |
| 2:00-3:00 | Privacy/legal tool audit: Blacklight, DuckDuckGo, Brave | Gap confirmation |
| 3:00-4:00 | User interview prep: 3 B2B marketers, 1 compliance officer | Question script |
| 4:00-5:00 | Synthesize: uniqueness score, refine MRR, build/no-build decision | Go/no-go memo |

---

## Technical Debt Note (For Future)

If we build this, the overlay positioning engine needs:

```javascript
// Pseudocode: Element fingerprinting for stable overlay positioning
function fingerprintElement(el) {
  return {
    tag: el.tagName,
    id: el.id,
    stableClass: el.className.replace(/dynamic-\w+/g, ''),
    textSignature: el.innerText?.slice(0, 50),
    parentPath: getStableParentPath(el), // nth-of-type, not nth-child
    viewportRatio: {
      x: el.getBoundingClientRect().left / window.innerWidth,
      y: el.getBoundingClientRect().top / window.innerHeight
    }
  };
}
// Store with screenshot. On replay, match fingerprint + ratio to reposition overlay.
```

This survives responsive reflow, dynamic content, and minor site changes.

---

Ready for tomorrow. Priority question: **Do you want me to draft the competitor test script, or the user interview questions, first?**