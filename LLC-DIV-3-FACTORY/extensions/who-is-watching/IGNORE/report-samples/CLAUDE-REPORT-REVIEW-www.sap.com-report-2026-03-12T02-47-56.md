# Report Review: www.sap.com Session Report
**Report File:** `www.sap.com-report-2026-03-12T02-47-56.html`
**Review Date:** 2026-03-11
**Reviewer:** Claude Code Agent

---

## Overview

This report captures a 1m 16s session on sap.com with 907 events, 17 vendors, and 5 identity tokens. The report generation worked correctly, but several issues and enhancement opportunities were identified.

---

## Issue 1: Cross-Domain / Subdomain Tracking

### Problem
The report is titled "www.sap.com" but the user journey inevitably crosses multiple subdomains. Looking at the network requests in the timeline, we see traffic to:

- `www.sap.com` (main site)
- `smetrics.sap.com` (Adobe Analytics)
- `b.6sc.co` (6sense)
- `px.ads.linkedin.com` (LinkedIn)
- `www.facebook.com` (Facebook Pixel)
- `o.clarity.ms` (Microsoft Clarity)
- `bat.bing.com` / `bat.bing.net` (Microsoft Ads)
- `googleads.g.doubleclick.net` (Google Ads)
- `173bf10a.akstat.io` (Akamai)
- `siteintercept.qualtrics.com` (Qualtrics)
- `212-TCU-034.mktoresp.com` (Marketo)

### Current Behavior
The session is keyed only to the **primary domain** (`www.sap.com`). Subdomain and third-party domain activity is captured in events but not surfaced clearly.

### Proposed Strategy

**Option A: Subdomain Grouping**
- Track subdomains as part of the same session (e.g., `*.sap.com`)
- Add a "Domains Visited" section to the report listing all unique domains/subdomains
- Group events by domain in timeline view

**Option B: Domain Journey Map**
- Add an ASCII or visual diagram showing domain hops
- Example:
  ```
  www.sap.com → smetrics.sap.com → b.6sc.co → www.facebook.com
  ```
- Show which vendors triggered cross-domain requests

**Option C: Report Metadata Enhancement**
- Add a "Subdomains Covered" field to executive summary
- List all unique hostnames in a collapsible section
- Compute "first-party vs third-party" domain ratio

### Recommended Implementation
Add a new section to the report:

```html
<section id="domains">
  <h2>Domains Involved</h2>
  <h3>First-Party (*.sap.com)</h3>
  <ul>
    <li>www.sap.com - 423 events</li>
    <li>smetrics.sap.com - 12 events</li>
  </ul>
  <h3>Third-Party</h3>
  <ul>
    <li>b.6sc.co (6sense) - 81 events</li>
    <li>www.facebook.com (Facebook) - 38 events</li>
    ...
  </ul>
</section>
```

---

## Issue 2: Identity Graph Viewer Needs Zoom Controls

### Problem
When multiple identity tokens are detected (this report has 5), the D3.js identity graph visualization in the sidepanel becomes crowded. Nodes overlap and become difficult to read, especially when:
- Many same-vendor identities exist (4 Adobe ECIDs in this case)
- Cross-vendor links create dense clusters
- Long identity values overflow their containers

### Proposed Solution
Add simple zoom controls to the identity graph viewer in `sidepanel/main.js`:

```
┌─────────────────────────────────────┐
│ Identity Graph            [+] [-]   │  ← Zoom controls top-right
├─────────────────────────────────────┤
│                                     │
│    (D3 force graph visualization)   │
│                                     │
└─────────────────────────────────────┘
```

### Implementation Notes

**UI Changes (`sidepanel/index.html`):**
```html
<div class="identity-graph-header">
  <h3>Identity Graph</h3>
  <div class="zoom-controls">
    <button id="zoom-in" class="zoom-btn">+</button>
    <button id="zoom-out" class="zoom-btn">-</button>
    <button id="zoom-reset" class="zoom-btn">⟲</button>
  </div>
</div>
<div id="identity-graph-container">
  <svg id="identity-graph"></svg>
</div>
```

**JS Changes (`sidepanel/main.js`):**
```javascript
// Add to renderIdentityGraph()
const zoom = d3.zoom()
  .scaleExtent([0.5, 3])  // 50% to 300%
  .on('zoom', (event) => {
    svg.select('g').attr('transform', event.transform);
  });

svg.call(zoom);

// Button handlers
dom.zoomIn.addEventListener('click', () => {
  svg.transition().call(zoom.scaleBy, 1.3);
});

dom.zoomOut.addEventListener('click', () => {
  svg.transition().call(zoom.scaleBy, 0.7);
});

dom.zoomReset.addEventListener('click', () => {
  svg.transition().call(zoom.transform, d3.zoomIdentity);
});
```

**CSS (`sidepanel/styles.css`):**
```css
.identity-graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.zoom-controls {
  display: flex;
  gap: 4px;
}

.zoom-btn {
  width: 24px;
  height: 24px;
  border: 1px solid var(--oia-border);
  border-radius: 4px;
  background: var(--oia-bg-card);
  color: var(--oia-text-primary);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-btn:hover {
  background: var(--oia-bg-elevated);
}
```

---

## Issue 3: Identity Links Still Showing Duplicates

### Observation
Despite the fix implemented earlier (`links.filter(l => l.source !== l.target)`), the report still shows 22 identity links where **all have identical source and target IDs**:

```
Source: 996245a9-85d5-4420-aeeb-09a...
Target: 996245a9-85d5-4420-aeeb-09a...
Reason: same_vendor:adobe
```

### Root Cause
The filter was applied, but the **truncation is hiding the difference**. The source and target are being displayed as truncated strings (`...substring(0, 24)...`) which look identical but may have different full values.

OR the linking logic in `lib/db.js` is creating self-referential links incorrectly.

### Fix Required
1. **Debug the linking logic** - Check `autoLinkIdentities()` in `lib/db.js`
2. **Improve link display** - Show more characters or use different truncation
3. **Add deduplication** - Filter links where `source.substring(0,40) === target.substring(0,40)`

---

## Additional Observations

### Duplicate Vendor Entries
- "6sense" appears twice in vendor list (81 events + 8 events)
- "Adobe" vs "Adobe Analytics" vs "Adobe Launch" vs "Adobe Web SDK" - should these consolidate?

### Behavioral Signals Inconsistency
Adobe shows rich signals:
```
Device fingerprinting detected, Revenue/product tracking,
Microsecond precision timestamps, Personal data collection,
Form field data captured, Cross-domain tracking detected,
Collects mouse/click/scroll data
```

But 6sense shows only: `Cross-domain tracking detected`

Consider enriching signal detection for all vendors.

### Exit Tracking Appears Early
The journey flow shows "Exit tracking activated" at 10:46:37 PM (1 second after landing), which is before consent was shown (10:46:39 PM). This may be accurate but is confusing in the narrative.

---

## Priority Action Items

| Priority | Issue | Effort |
|----------|-------|--------|
| P1 | Add zoom controls to identity graph | 1-2 hrs |
| P1 | Fix identity link self-reference display | 1 hr |
| P2 | Add "Domains Involved" section to report | 2-3 hrs |
| P3 | Consolidate duplicate vendor entries | 2 hrs |
| P3 | Enrich behavioral signals for all vendors | 4+ hrs |

---

## Files to Modify

| File | Changes |
|------|---------|
| `sidepanel/index.html` | Add zoom control buttons to identity graph |
| `sidepanel/main.js` | Add D3 zoom behavior and button handlers |
| `sidepanel/styles.css` | Add zoom button styles |
| `lib/report-generator.js` | Add domains section, fix link truncation |
| `lib/db.js` | Debug autoLinkIdentities() self-reference issue |

---

*End of review.*
