# GLOVEBOX — Claude Project Instructions

**Product:** GLOVEBOX — Your Car, As an Agent
**Company:** 864zeros LLC
**Parent Framework:** AETHER (Adaptive Embodied Thinking : Holistic Evolutionary Runtime)
**Version:** 1.0
**Date:** 2026-03-18

---

## What Is GLOVEBOX

GLOVEBOX creates a first-person AI agent for your car. Input a VIN. The system queries free public APIs, parses uploaded documents, optionally reads OBD-II diagnostics, and builds a single AETHER capsule — a 5-file agent directory that IS your car. You talk to it. It talks back in first person. It knows its own specs, recalls, service history, common problems, and maintenance schedule. It learns over time as you feed it new data.

"I'm a 2019 Honda Civic EX. I was built at the Greensburg, Indiana plant. My last oil change was at 45,230 miles. I have one open recall for a fuel pump module. Based on my mileage, my next brake inspection is due in 2,000 miles."

---

## Architecture: One VIN → One Capsule

```
Input: VIN + optional Carfax PDF + optional OBD-II data

Phase 1: COLLECT (parallel API calls)
  ├── nhtsa-vin-adapter      → vehicle specs nodes
  ├── nhtsa-recall-adapter   → open recall nodes
  ├── nhtsa-complaints-adapter → known problem nodes
  ├── epa-fuel-adapter       → fuel economy nodes
  ├── maintenance-schedule   → service interval nodes
  ├── carfax-pdf-parser      → service history nodes (if uploaded)
  └── obd-adapter            → diagnostic nodes (if connected)

Phase 2: COMPOSE (graph-composer merges all fragments)
  └── merge → single kg.jsonld with aether:source provenance on every node

Phase 3: NARRATE (LLM generates KB and persona)
  ├── vehicle-kb-narrator    → kb.md (first-person narrative)
  └── vehicle-persona-gen    → persona.json (car's voice)

Phase 4: STAMP
  └── stamper → glovebox-{vin-last8}/
      ├── manifest.json      (VIN = identity)
      ├── definition.json    (authoritative on THIS car only)
      ├── persona.json       (first-person car voice)
      ├── kb.md              (narrative service history)
      └── kg.jsonld           (all structured data, all sources)
```

**One VIN. One capsule. One agent. Your car.**

---

## Tech Stack

| Component | Tech | Why |
|-----------|------|-----|
| Runtime | Node.js (SAP CAP style) | 864zeros standard, API gateway reuse |
| API Gateway | Express or CAP | Single entry for all 864z apps |
| Adapters | Individual modules per API | Feature bricks — reusable across 864z products |
| Graph Composer | Custom module | Merges JSON-LD fragments, deduplicates, types nodes |
| Capsule Stamper | AETHER stamper (Python) or JS port | Produces 5-file capsule |
| LLM | Anthropic Claude API | KB narration + persona generation |
| OBD-II | python-obd or node-obd2 | Bluetooth ELM327 dongle interface |
| PDF Parser | pdf-parse or pdfjs-dist | Carfax PDF extraction |
| Storage | SQLite (local) or filesystem | Capsule = folder on disk |
| Frontend | Minimal — CLI first, web later | 864zeros KISS philosophy |

---

## API Reference

### Free APIs (No Key Required)

**NHTSA VIN Decoder**
```
GET https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{VIN}?format=json
Returns: Make, Model, Year, Trim, Engine, Body, Plant, Safety Equipment (~130 fields)
Rate Limit: None documented. Be respectful.
```

**NHTSA Recalls by VIN**
```
GET https://api.nhtsa.dot.gov/recalls/recallsByVehicle?make={make}&model={model}&modelYear={year}
Returns: Campaign number, component, summary, consequence, remedy, date
```

**NHTSA Complaints**
```
GET https://api.nhtsa.dot.gov/complaints/complaintsByVehicle?make={make}&model={model}&modelYear={year}
Returns: Component, description, crash/fire/injury flags, date, mileage
```

**NHTSA Safety Ratings**
```
GET https://api.nhtsa.dot.gov/SafetyRatings/modelyear/{year}/make/{make}/model/{model}
Returns: Overall rating, frontal crash, side crash, rollover rating (1-5 stars)
```

**EPA Fuel Economy**
```
GET https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year={year}&make={make}&model={model}
Returns: City MPG, Highway MPG, Combined MPG, Annual fuel cost, CO2 emissions
```

### Paid APIs (Future / Premium Tier)

| API | Data | Cost | Priority |
|-----|------|------|----------|
| NMVTIS (via VinAudit/ClearVin) | Title history, odometer, total loss | $2-5/query | MEDIUM |
| CarMD | DTC descriptions, repair costs | Free tier limited | LOW |
| Kelley Blue Book | Valuation | Partner API | FUTURE |
| Edmunds | Reviews, TCO data | Developer API | FUTURE |

### Local Data Sources

**OBD-II (Bluetooth ELM327 dongle)**
```
Library: python-obd (Python) or node-obd2 (Node.js)
Data: DTCs, engine RPM, coolant temp, battery voltage, fuel level, mileage
Cost: $15 dongle, free software
Connection: Bluetooth serial → OBD-II port
```

**User-Uploaded Documents**
- Carfax PDF → parse service events, accidents, ownership
- Service receipts (photo/PDF) → parse date, service, mileage, cost
- Purchase documents → parse price, date, dealer

---

## Data Model: JSON-LD Node Types

Every piece of data becomes a typed KG node with source provenance:

| Data Category | Node @type | aether:source | Example |
|-------------|-----------|---------------|---------|
| Vehicle specs | skill:Concept | nhtsa-vin-api | Make: Honda, Model: Civic, Year: 2019 |
| Open recalls | skill:Rule | nhtsa-recall-api | "Replace fuel pump module — campaign 21V-560" |
| Known problems | skill:AntiPattern | nhtsa-complaints-api | "AC compressor failure common at 60K miles" |
| Safety ratings | skill:Concept | nhtsa-safety-api | Overall: 5 stars, Frontal: 4 stars |
| Fuel economy | skill:Concept | epa-fuel-api | City: 30 MPG, Highway: 38 MPG |
| Service events | skill:Concept | carfax-pdf / user-receipt | "Oil change at 45,230 miles on 2026-01-15" |
| Maintenance schedule | skill:Rule | manufacturer-schedule | "Oil change every 7,500 miles or 12 months" |
| Diagnostics | skill:Technique | obd-ii-dongle | "DTC P0420: Catalyst system efficiency below threshold" |
| Owner notes | skill:Concept | user-input | "Squeaking noise from front left at low speed" |

**Edge types for cars:**

| Edge | Meaning | Example |
|------|---------|---------|
| requires | Service dependency | oil_change → requires → oil_filter_replacement |
| avoids | Known bad practice | engine → avoids → extended_idle_in_cold |
| enables | Capability | awd_system → enables → snow_driving |
| contradicts | Conflicting info | carfax_mileage → contradicts → obd_mileage (odometer discrepancy!) |

---

## 864zeros Philosophy

- **KISS** — No overengineering. CLI first. Web later.
- **Feature Bricks** — Every adapter is independently reusable by any 864z app.
- **API Gateway** — One gateway for GLOVEBOX and all future 864z products.
- **Capsule = Product** — The AETHER capsule IS the deliverable. Not a database. A folder.
- **The model is replaceable** — Same car capsule works with Claude, GPT, Gemini.
- **Free-first** — All core functionality uses free APIs. Premium data is upgrade path.

---

## Constraints

- Node.js preferred for services (SAP CAP alignment)
- Python acceptable for AETHER capsule operations (stamper, AEC, education)
- No heavy frameworks (no Next.js, no React for v1)
- SQLite or filesystem storage only (no Postgres, no cloud DB for v1)
- Standard library bias — minimize npm dependencies
- Every adapter must work independently (no adapter depends on another adapter)
- Every API response cached locally (don't re-query NHTSA every time)
- VIN validation before any API calls (check digit verification)

---

## File Structure

```
glovebox/
├── claude.md                    ← this file
├── claude-build-glovebox-v1.0.md ← build spec
├── package.json
├── src/
│   ├── index.js                 ← CLI entry point
│   ├── gateway/
│   │   └── api-gateway.js       ← 864z universal API gateway
│   ├── adapters/
│   │   ├── nhtsa-vin.js         ← NHTSA VIN decoder adapter
│   │   ├── nhtsa-recalls.js     ← NHTSA recalls adapter
│   │   ├── nhtsa-complaints.js  ← NHTSA complaints adapter
│   │   ├── nhtsa-safety.js      ← NHTSA safety ratings adapter
│   │   ├── epa-fuel.js          ← EPA fuel economy adapter
│   │   ├── carfax-parser.js     ← Carfax PDF parser adapter
│   │   ├── obd-adapter.js       ← OBD-II Bluetooth adapter
│   │   ├── receipt-parser.js    ← Service receipt parser
│   │   └── maintenance-schedule.js ← Manufacturer schedule generator
│   ├── composer/
│   │   └── graph-composer.js    ← Merges adapter fragments into single KG
│   ├── narrator/
│   │   ├── kb-narrator.js       ← LLM generates first-person KB narrative
│   │   └── persona-gen.js       ← LLM generates car persona
│   ├── capsule/
│   │   └── stamper.js           ← JS port of AETHER stamper (or shell to Python)
│   └── utils/
│       ├── vin-validator.js     ← VIN check digit validation
│       ├── cache.js             ← Local API response cache
│       └── jsonld-helpers.js    ← JSON-LD construction utilities
├── schemas/
│   ├── vehicle-context.jsonld   ← AETHER @context for vehicle domain
│   └── composition-schema.json  ← Adapter → node type mapping
├── cache/                       ← Cached API responses (gitignored)
├── output/                      ← Generated capsules
└── test/
    ├── test-vin-decode.js
    ├── test-recalls.js
    ├── test-composer.js
    └── test-full-pipeline.js
```

---

## Never Do

- Never store raw Carfax PDFs in the capsule (parse and extract, don't redistribute)
- Never call paid APIs without user confirmation
- Never hardcode API keys (use .env)
- Never skip VIN validation
- Never build a web frontend before CLI works end-to-end
- Never create multiple capsules per car (one VIN = one capsule)
- Never depend on Carfax availability (free APIs must produce a useful capsule alone)
