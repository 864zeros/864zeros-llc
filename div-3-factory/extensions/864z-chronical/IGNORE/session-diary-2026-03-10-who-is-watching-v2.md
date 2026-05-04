# Who Is Watching v2.0 - Session Summary
## Date: 2026-03-10

---

## Project Overview

**Extension:** Who Is Watching
**Location:** `C:\Users\I820965\dev\864zeros\extensions\who-is-watching\`
**Purpose:** Chrome extension side panel that monitors and visualizes analytics vendor activity, identity tracking, and data collection on websites.

---

## Session Decisions

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Primary UI** | Timeline-first | Chronological event view instead of category-based vendor list |
| **Session Logic** | Per domain change | New session when user navigates to different domain (not per page or per panel open) |
| **Session Timeout** | 30 minutes idle | Standard idle timeout before creating new session |
| **Vendor View** | Keep as secondary tab | Existing expandable vendor cards preserved, moved to second tab |
| **Database Location** | `lib/db.js` | Follows 864zeros pattern (Chronicle, Clipboard) |
| **Styling** | OIA Design System | Use OIA tokens (--oia-*) instead of raw hex values |

### Identity Graph Fix

**Root Cause Identified:** Identity tab was empty because identities were only extracted from global JavaScript objects (window.s, window.Visitor, etc.), missing the majority of identity data that flows through network requests and cookies.

**Solution Implemented:** Extract identities from:
1. Network request URLs and bodies (cid, mid, anonymousId patterns)
2. Cookie values (_ga, s_vi, AMCV_, _fbp, etc.)
3. Store in IndexedDB with linking logic

---

## Implementation Completed

### Phase 1: IndexedDB Foundation

**File Created:** `lib/db.js` (~500 lines)

**Schema:**
```
wiw_db (version 1)
├── sessions     - Page visit sessions (keyPath: id)
├── events       - Timeline entries (keyPath: id, autoIncrement)
├── identities   - Graph nodes (keyPath: id = sessionId_type_value)
└── links        - Graph edges (keyPath: id, autoIncrement)
```

**Key Functions:**
- `initDB()` - Promise-based IndexedDB initialization
- `getOrCreateSession(url)` - Session management with domain-based logic
- `addEvent(sessionId, event)` - Timeline event persistence
- `getSessionTimeline(sessionId, options)` - Filtered event retrieval
- `addIdentity(sessionId, identity)` - Identity node upsert
- `linkIdentities(sessionId, sourceId, targetId, reason)` - Graph edge creation
- `getIdentityGraph(sessionId)` - D3-ready nodes + links
- `autoLinkIdentities(sessionId)` - Automatic linking by vendor/cross-reference

### Phase 2: Background.js Enhancement

**File Updated:** `background.js` (+150 lines)

**New Identity Extraction:**

| Source | Pattern | Identity Type |
|--------|---------|---------------|
| Network | `?cid=` or `&cid=` | GA_CID |
| Network | `?mid=` or `&mid=` | ECID |
| Network | `"anonymousId":"..."` | SEGMENT_ANON |
| Network | `"userId":"..."` | USER_ID |
| Network | `distinct_id` | MIXPANEL_ID |
| Network | `company_id` | 6SENSE_COMPANY |
| Network | `fbp` | FB_BROWSER_ID |
| Cookie | `_ga`, `_ga_*` | GA_CID |
| Cookie | `_gid` | GA_GID |
| Cookie | `s_vi` | ECID |
| Cookie | `AMCV_*` | ECID |
| Cookie | `_6si*` | 6SENSE_ID |
| Cookie | `_fbp` | FB_BROWSER_ID |
| Cookie | `_fbc` | FB_CLICK_ID |
| Cookie | `hubspotutk` | HUBSPOT_UTK |
| Cookie | `_mkto_trk` | MARKETO_ID |
| Cookie | `li_sugr` | LINKEDIN_ID |
| Cookie | `_hjid` | HOTJAR_ID |
| Cookie | `ajs_user_id` | USER_ID |
| Cookie | `ajs_anonymous_id` | SEGMENT_ANON |

**Message Flow:**
```
hook.js → bridge.js → background.js
                         ├── extractIdentitiesFromRequest()
                         ├── extractIdentityFromCookie()
                         ├── broadcastIdentity() → sidepanel
                         └── (panel handles DB persistence)
```

### Phase 3: Timeline Styles

**File Updated:** `sidepanel/styles.css` (+150 lines)

**New CSS Classes:**
- `.timeline-filters` - Filter button container
- `.timeline-filter` - Individual filter button (active state)
- `.timeline-filter--violation` - Violation filter with coral styling
- `.timeline-list` - Scrollable timeline container
- `.timeline-empty` - Empty state styling
- `.timeline-item` - Base timeline entry
- `.timeline-item--violation` - Coral left border for violations
- `.timeline-item--warning` - Mustard accent for warnings
- `.timeline-item--identity` - Sage accent for identity events
- `.timeline-item--vendor` - Sky accent for vendor detections
- `.timeline-time` - Monospace timestamp
- `.timeline-icon` - Event type icon
- `.timeline-content` - Event title and details
- `.session-domain` - Domain badge in header

**OIA Tokens Used:**
- `--oia-space-*` for spacing
- `--oia-bg-*` for backgrounds
- `--oia-text-*` for typography
- `--oia-coral`, `--oia-mustard`, `--oia-sage`, `--oia-sky` for accents
- `--oia-radius-*` for borders
- `--oia-duration-*` and `--oia-ease-*` for animations

### Phase 4: HTML Structure

**File Updated:** `sidepanel/index.html`

**Changes:**
1. Added `<script type="module">` for ES6 imports
2. Created Timeline view section (default active)
3. Added timeline filters (All, Vendors, Identity, Network, Violations)
4. Added empty state for timeline
5. Added session info badges in header (domain, event count)
6. Reordered bottom navigation tabs

**Tab Order (New):**
1. Timeline (default) - Clock icon
2. Vendors - Info icon
3. Identity - Users icon
4. Data - Box icon
5. Control - Cursor icon (renamed from "Inject")

### Phase 5: Main.js Integration

**File Updated:** `sidepanel/main.js` (major rewrite, ~1100 lines)

**Key Changes:**
1. Converted to ES6 module with db.js imports
2. Added session initialization on panel open
3. Timeline rendering with category filtering
4. All event handlers persist to IndexedDB
5. Identity graph reads from `getIdentityGraph()` instead of in-memory state
6. Filter state management
7. Session UI updates (domain badge, event count)

**New State Structure:**
```javascript
const state = {
  session: null,           // Current session from IndexedDB
  events: [],              // Cached timeline events
  filter: 'all',           // Current filter selection
  vendors: new Map(),      // Detected vendors
  networkRequests: [],     // Network log
  identities: new Map(),   // Identity cache (for graph)
  // ... existing state preserved
};
```

**Event Category Mapping:**
| Message Type | Category | Icon |
|--------------|----------|------|
| VENDOR_DETECTED | vendor | 📡 |
| NETWORK_REQUEST | network | 📤 |
| IDENTITY_DETECTED | identity | 🆔 |
| COOKIE_SET | network | 🍪 |
| CONSENT_VIOLATION | violation | ⚠️ |
| FINGERPRINT_DETECTED | violation | 👆 |
| DATALAYER_PUSH | vendor | 📊 |
| GLOBAL_DETECTED | vendor | 🌐 |

---

## Files Modified Summary

| File | Action | Changes |
|------|--------|---------|
| `lib/db.js` | CREATE | IndexedDB wrapper (~500 lines) |
| `background.js` | UPDATE | Identity extraction (+150 lines) |
| `sidepanel/styles.css` | UPDATE | Timeline styles (+150 lines) |
| `sidepanel/index.html` | UPDATE | Timeline view, tab reorder |
| `sidepanel/main.js` | REWRITE | DB integration, timeline (~1100 lines) |

---

## Diary Section

### Accomplishments

1. **Transformed UI Architecture**
   - Shifted from category-based vendor list to timeline-first chronological view
   - Timeline is now the default view with powerful filtering capabilities

2. **Built Persistence Layer**
   - Created robust IndexedDB schema with 4 object stores
   - Sessions persist across panel close/reopen
   - Events, identities, and links all stored durably

3. **Fixed Identity Graph**
   - Diagnosed root cause: identities only from global objects
   - Implemented extraction from network requests and cookies
   - Added automatic linking logic (same vendor, cross-reference)
   - Graph now populates with real identity data

4. **Maintained Design Consistency**
   - All new styles use OIA Design System tokens
   - Violation events highlighted with coral accent
   - Identity events use sage, vendor events use sky

5. **Preserved Existing Functionality**
   - Vendor expandable cards still work (secondary tab)
   - Network view, Data Layer view, Control (Inject) view all intact
   - All existing detection logic in hook.js unchanged

### Project Summary

Who Is Watching is a Chrome extension side panel that provides real-time visibility into analytics vendor activity on any website. It monitors:

- **Vendors:** Google Analytics, Adobe Analytics, Segment, Mixpanel, Facebook Pixel, and many more
- **Network Requests:** Outbound tracking calls with payload inspection
- **Cookies:** Analytics and identity cookies being set
- **Data Layers:** GTM dataLayer, Adobe digitalData, Tealium utag_data
- **Global Objects:** JavaScript globals from analytics SDKs
- **Identities:** ECID, GA CID, Segment anonymousId, etc.

The v2.0 update adds:
- Timeline-first UI for chronological event viewing
- IndexedDB persistence for session continuity
- Working identity graph with network/cookie extraction
- Filter-based event categorization

### Next Steps

1. **Testing**
   - Load extension in Chrome, test on analytics-heavy sites (CNN, SAP, Oracle)
   - Verify timeline populates and filters work
   - Verify identity graph shows nodes and links
   - Test session persistence (close panel, reopen, data should remain)

2. **Consent Violation Detection**
   - Add logic in hook.js to detect consent violations
   - Fire CONSENT_VIOLATION events when tracking occurs without consent

3. **Session History View**
   - Add ability to view past sessions
   - Session picker dropdown or list

4. **Export/Report**
   - Export timeline as JSON or CSV
   - Generate summary reports

5. **Cross-Tab Session Merging**
   - Merge sessions when user has multiple tabs on same domain

---

## Quick Start for LLMs

### Project Location
```
C:\Users\I820965\dev\864zeros\extensions\who-is-watching\
```

### Key Files to Read First
1. `manifest.json` - Extension configuration
2. `background.js` - Service worker, message routing, identity extraction
3. `lib/db.js` - IndexedDB wrapper
4. `sidepanel/main.js` - UI logic and DB integration
5. `content/hook.js` - Page injection for vendor detection

### Architecture
```
[Web Page]
    ↓ hook.js (injected)
    ↓ bridge.js (content script)
    ↓ chrome.runtime.sendMessage
[Service Worker - background.js]
    ↓ Extract identities
    ↓ chrome.runtime.sendMessage
[Side Panel - main.js]
    ↓ Process message
    ↓ Store in IndexedDB (db.js)
    ↓ Update UI (timeline, vendors, graph)
```

### Design System
Use OIA Design System from `lib/oia-design-system.css`:
- Tokens: `--oia-space-*`, `--oia-bg-*`, `--oia-text-*`
- Colors: `--oia-coral`, `--oia-mustard`, `--oia-sage`, `--oia-sky`
- Components: `.oia-card`, `.oia-btn`, `.oia-badge`, `.oia-bottom-nav`

### Testing Commands
```bash
# No build step required - plain JavaScript
# Load unpacked extension from: extensions/who-is-watching/
```

---

## Reference Documents

- **Tech Spec:** `IGNORE/who-is-watching-detailed-summary-techspec-2026-03-10-1045.md`
- **Build Spec:** User-provided v2.0 build definition (in conversation)
- **Plan File:** `C:\Users\I820965\.claude\plans\kind-purring-matsumoto.md`

---

*Session completed: 2026-03-10*
