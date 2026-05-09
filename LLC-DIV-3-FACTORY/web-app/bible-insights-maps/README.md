# Bible Insights Maps

**Status:** Proof of Concept (POC)
**Completion:** 65%
**Brand:** FHG (For His Glory)

A standalone web app for exploring biblical locations on an interactive map. Companion to the Bible Insight Chrome extension.

---

## Current Features

### Bible Reader (Left Rail)
| Feature | Status |
|---------|--------|
| KJV verse display | Done |
| Book filter dropdown | Done |
| Search input | Done |
| Clickable location keywords | Done |
| Geo-tagged verses from geodata.js | Done |

### Interactive Map (Right Rail)
| Feature | Status |
|---------|--------|
| Leaflet.js map (Esri World Topo tiles) | Done |
| Center on Middle East | Done |
| Click keyword → fly to location | Done |
| Marker with popup | Done |
| Dark/antique filter styling | Done |
| Journey Timeline (breadcrumb trail) | Done |

### Insights Panel
| Feature | Status |
|---------|--------|
| Loading spinner on location select | Done |
| Archaeological context display | Done |
| Location images | Done (94 of 1,329 locations enriched) |
| Fallback for missing data | Done |

### Notes & Storage
| Feature | Status |
|---------|--------|
| Study notes textarea | Done |
| Auto-save to IndexedDB (Dexie.js) | Done |
| Save status indicator | Done |

### Utility
| Feature | Status |
|---------|--------|
| "Surprise Me" random location | Done |
| "Test Bench" button (Jerusalem) | Done |
| FHG watermark | Done |

---

## Known Issues

| Issue | Status | Notes |
|-------|--------|-------|
| Map only responds to first click | Fix Applied | Event delegation fix (2026-03-11), needs testing |
| Limited enriched data | Open | Only 94 of 1,329 locations have verified archaeological images |

---

## Tech Stack

- **sql.js** — In-browser SQLite for Bible text + geocoding
- **Leaflet.js** — Interactive map
- **Dexie.js** — IndexedDB wrapper for notes persistence
- **Esri World Topo Map** — Tile layer with terrain + labels
- **Vanilla JS** — No frameworks

---

## File Structure

```
bible-insights-maps/
├── index.html              # Entry point (open in browser)
├── main.js                 # Core logic (map, Bible reader, notes)
├── style.css               # Dark theme styling
├── geodata.js              # Ancient location coordinates (~195k lines)
├── enriched-data.js        # Archaeological context + images (94 nodes)
├── enriched-master-geodata.json
├── lightweight-geodata.jsonl
├── json-map-schema.json
├── build_batch_01.js       # Data enrichment scripts
├── build_first100.js
├── build_js_data.js
├── source_images.js        # SerpApi image sourcing
├── setup.js
├── gemini.md               # Original prompt spec
├── README.md               # This file
└── IGNORE/
    ├── daily-summary-2026-02-22.md
    ├── design-001.html ... design-007.html
    └── (other dev files)
```

---

## How to Run

1. Open `index.html` directly in a browser (no server required)
2. Dependencies load from CDNs:
   - Leaflet.js
   - Dexie.js
   - sql.js (WASM)

---

## Completion Breakdown

| Component | Weight | Done |
|-----------|--------|------|
| Bible Reader UI | 15% | 100% |
| Map Integration | 20% | 100% |
| Location Click → Map | 15% | 95% (fix needs testing) |
| Insights Panel | 15% | 70% (limited enriched data) |
| Notes Persistence | 10% | 100% |
| Data Pipeline | 15% | 50% (94/1329 locations enriched) |
| Polish & UX | 10% | 40% |

**Overall: ~65% complete**

---

## Next Steps

1. **Test map click fix** — Verify multiple clicks work
2. **Expand enriched data** — Run SerpApi for remaining 1,200+ locations (or prioritize top 200)
3. **Insight Feed UI** — Overlay user's Bible Insight extension notes/highlights
4. **Extension integration** — Import backup JSON from Bible Insight extension
5. **Google Maps API** — Consider switching from Leaflet if stability issues persist

---

## Related Projects

- **Bible Insight Extension:** `extensions/Bible-Insight/`
- **Extension backup import:** `bible-insight-backup-2026-02-21-21-39-56.json` (in this folder)

---

*FHG (For His Glory) — 864zeros LLC*
