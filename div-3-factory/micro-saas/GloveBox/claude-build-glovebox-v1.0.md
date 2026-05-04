# GLOVEBOX Build Spec v1.0

**Read claude.md FIRST. This spec assumes you've read the project instructions.**

---

## Build Order: 12 Steps

Execute in this exact order. Each step has acceptance criteria. Do not proceed to the next step until the current step passes.

---

### Step 1: Project Scaffold

Create the project structure from claude.md. Initialize npm. Create package.json with:
- name: "glovebox"
- version: "1.0.0"
- author: "864zeros LLC"
- license: "MIT"
- type: "module" (ESM)
- dependencies: minimal (add as needed per step)

Create `.env.example`:
```
ANTHROPIC_API_KEY=your-key-here
# Optional
CARMD_API_KEY=
NMVTIS_API_KEY=
```

Create `.gitignore`:
```
node_modules/
cache/
output/
.env
*.pdf
```

**Acceptance:** `npm init` passes. Directory structure matches claude.md.

---

### Step 2: VIN Validator

**File:** `src/utils/vin-validator.js`

Implement VIN validation:
- Length check (17 characters)
- No I, O, Q characters
- Check digit validation (position 9, weighted sum mod 11)
- Extract: world manufacturer (pos 1-3), vehicle descriptor (pos 4-8), model year (pos 10), plant (pos 11), sequence (pos 12-17)

```javascript
export function validateVIN(vin) {
  // Returns: { valid: boolean, error?: string, decoded?: { wmi, vds, year_code, plant_code, sequence } }
}
```

**Test:** `node test/test-vin-validate.js`
```
✓ Valid VIN passes (use: 1HGBH41JXMN109186)
✓ Invalid length rejected
✓ Invalid characters (I, O, Q) rejected
✓ Bad check digit rejected
✓ Decoded fields extracted correctly
```

**Acceptance:** All 5 tests pass.

---

### Step 3: NHTSA VIN Decoder Adapter

**File:** `src/adapters/nhtsa-vin.js`

```javascript
export async function decodeVIN(vin) {
  // GET https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{vin}?format=json
  // 
  // Returns: Array of JSON-LD nodes with @type and aether:source
  // 
  // Key fields to extract as nodes:
  //   Make, Model, ModelYear, Trim, BodyClass, DriveType,
  //   EngineConfiguration, EngineCylinders, EngineHP, FuelTypePrimary,
  //   PlantCity, PlantState, PlantCountry,
  //   AirBagLocFront, AirBagLocSide, ABS, ESC, 
  //   TPMS, ForwardCollisionWarning, LaneDepartureWarning
  //
  // Each field becomes a node:
  // {
  //   "@id": "spec:{field_name_lower}",
  //   "@type": "skill:Concept",
  //   "rdfs:label": "{FieldName}: {Value}",
  //   "aether:origin": "core",
  //   "aether:source": "nhtsa-vin-api",
  //   "aether:retrieved": "{ISO timestamp}"
  // }
}
```

**Cache:** Write raw API response to `cache/{vin}-nhtsa-decode.json`. On subsequent calls, read from cache unless `--refresh` flag.

**Test:** `node test/test-vin-decode.js`
```
✓ Real VIN returns valid data
✓ Fields extracted as JSON-LD nodes
✓ Each node has @type, aether:source, aether:origin
✓ Cached response used on second call
✓ Invalid VIN returns error
```

**Acceptance:** All 5 tests pass. Returns array of typed JSON-LD nodes.

---

### Step 4: NHTSA Recalls Adapter

**File:** `src/adapters/nhtsa-recalls.js`

```javascript
export async function getRecalls(make, model, year) {
  // GET https://api.nhtsa.dot.gov/recalls/recallsByVehicle?make={make}&model={model}&modelYear={year}
  //
  // Each recall becomes a Rule node (the car MUST comply):
  // {
  //   "@id": "recall:{campaign_number}",
  //   "@type": "skill:Rule",
  //   "rdfs:label": "Recall {campaign}: {component} — {summary_short}",
  //   "aether:origin": "core",
  //   "aether:source": "nhtsa-recall-api",
  //   "aether:severity": "{consequence}",
  //   "aether:remedy": "{remedy}",
  //   "aether:date": "{report_date}"
  // }
}
```

**Cache:** `cache/{vin}-nhtsa-recalls.json`

**Test:** `node test/test-recalls.js`
```
✓ Known recalled vehicle returns recall nodes
✓ Nodes typed as skill:Rule
✓ Severity and remedy fields populated
✓ Vehicle with no recalls returns empty array
```

**Acceptance:** All 4 tests pass.

---

### Step 5: NHTSA Complaints Adapter

**File:** `src/adapters/nhtsa-complaints.js`

```javascript
export async function getComplaints(make, model, year) {
  // GET https://api.nhtsa.dot.gov/complaints/complaintsByVehicle?make={make}&model={model}&modelYear={year}
  //
  // Each complaint becomes an AntiPattern node (known problems to watch for):
  // {
  //   "@id": "complaint:{component_lower}_{index}",
  //   "@type": "skill:AntiPattern",
  //   "rdfs:label": "Known issue: {component} — {summary_short}",
  //   "aether:origin": "core",
  //   "aether:source": "nhtsa-complaints-api",
  //   "aether:crash": boolean,
  //   "aether:fire": boolean,
  //   "aether:count": number_of_complaints_for_this_component
  // }
  //
  // IMPORTANT: Aggregate by component. Don't create a node per individual complaint.
  // Group: "45 complaints about AC compressor" → one AntiPattern node with count: 45
}
```

**Cache:** `cache/{vin}-nhtsa-complaints.json`

**Test:** `node test/test-complaints.js`
```
✓ Popular vehicle returns complaint nodes
✓ Complaints aggregated by component
✓ Nodes typed as skill:AntiPattern
✓ Crash/fire flags present
```

**Acceptance:** All 4 tests pass.

---

### Step 6: EPA Fuel Economy Adapter

**File:** `src/adapters/epa-fuel.js`

```javascript
export async function getFuelEconomy(year, make, model) {
  // GET https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year={year}&make={make}&model={model}
  // Then: GET https://www.fueleconomy.gov/ws/rest/vehicle/{id} for detailed data
  //
  // Returns Concept nodes:
  // {
  //   "@id": "fuel:economy",
  //   "@type": "skill:Concept",
  //   "rdfs:label": "Fuel Economy: {city} city / {highway} highway / {combined} combined MPG",
  //   "aether:city_mpg": number,
  //   "aether:highway_mpg": number,
  //   "aether:combined_mpg": number,
  //   "aether:annual_fuel_cost": number,
  //   "aether:source": "epa-fuel-api"
  // }
}
```

**Cache:** `cache/{vin}-epa-fuel.json`

**Test:** `node test/test-fuel.js`
```
✓ Known vehicle returns fuel economy data
✓ City, highway, combined MPG present
✓ Annual fuel cost present
```

**Acceptance:** All 3 tests pass.

---

### Step 7: NHTSA Safety Ratings Adapter

**File:** `src/adapters/nhtsa-safety.js`

```javascript
export async function getSafetyRatings(year, make, model) {
  // GET https://api.nhtsa.dot.gov/SafetyRatings/modelyear/{year}/make/{make}/model/{model}
  //
  // Returns Concept nodes:
  // {
  //   "@id": "safety:overall",
  //   "@type": "skill:Concept",
  //   "rdfs:label": "Safety: {overall} stars overall ({frontal} frontal, {side} side, {rollover} rollover)",
  //   "aether:overall_rating": number,
  //   "aether:frontal_rating": number,
  //   "aether:side_rating": number,
  //   "aether:rollover_rating": number,
  //   "aether:source": "nhtsa-safety-api"
  // }
}
```

**Cache:** `cache/{vin}-nhtsa-safety.json`

**Acceptance:** Returns typed safety rating nodes.

---

### Step 8: Maintenance Schedule Generator

**File:** `src/adapters/maintenance-schedule.js`

```javascript
export function generateMaintenanceSchedule(make, model, year, currentMileage) {
  // Uses a built-in lookup table of common manufacturer maintenance intervals.
  // NOT an API call — this is static data compiled from manufacturer manuals.
  //
  // Returns Rule nodes:
  // {
  //   "@id": "maintenance:oil_change",
  //   "@type": "skill:Rule",
  //   "rdfs:label": "Oil change every 7,500 miles or 12 months",
  //   "aether:interval_miles": 7500,
  //   "aether:interval_months": 12,
  //   "aether:next_due_miles": currentMileage + (7500 - (currentMileage % 7500)),
  //   "aether:source": "manufacturer-schedule"
  // }
  //
  // Common intervals to include:
  //   Oil change, tire rotation, brake inspection, air filter,
  //   cabin filter, transmission fluid, coolant flush, spark plugs,
  //   timing belt/chain, battery check
  //
  // Start with Honda, Toyota, Ford, Chevrolet, BMW, Mercedes lookup tables.
  // Default to generic intervals for unknown makes.
}
```

**No cache needed — deterministic output.**

**Acceptance:** Returns 8-12 Rule nodes with interval and next-due calculations.

---

### Step 9: Graph Composer

**File:** `src/composer/graph-composer.js`

This is the core. It merges all adapter fragments into a single JSON-LD knowledge graph.

```javascript
export function compose(fragments, vin) {
  // fragments: Array of arrays of JSON-LD nodes from each adapter
  //
  // 1. Flatten all nodes into single array
  // 2. Deduplicate by @id (first wins)
  // 3. Wrap in JSON-LD structure with @context
  // 4. Add vehicle identity node:
  //    { "@id": "vehicle:{vin}", "@type": "skill:Concept", 
  //      "rdfs:label": "{year} {make} {model} {trim}" }
  // 5. Generate edges:
  //    - All recall nodes → vehicle (vehicle has recall)
  //    - All complaint nodes → vehicle (vehicle has known issue)
  //    - maintenance_schedule → requires → specific_parts
  //    - If complaint component matches recall component → edge
  // 6. Return complete kg.jsonld content
  //
  // @context should include:
  //   "skill": "https://aether.864zeros.com/skill/",
  //   "aether": "https://aether.864zeros.com/ns/",
  //   "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
}
```

**Test:** `node test/test-composer.js`
```
✓ Merges fragments from 5 adapters into single graph
✓ No duplicate @id values
✓ Vehicle identity node present
✓ @context correct
✓ Edge count > 0
✓ All nodes have aether:source
```

**Acceptance:** All 6 tests pass. Single coherent JSON-LD graph.

---

### Step 10: KB Narrator + Persona Generator

**File:** `src/narrator/kb-narrator.js`
**File:** `src/narrator/persona-gen.js`

```javascript
// kb-narrator.js
export async function narrateKB(kg, llmFn) {
  // Takes the composed KG and asks the LLM to write a first-person narrative.
  //
  // Prompt: "You are a {year} {make} {model}. Based on the following knowledge
  //   graph about yourself, write a first-person narrative (500-1000 words) 
  //   describing who you are, your history, your current condition, and what 
  //   your owner should know. Write as if you ARE the car speaking."
  //
  // Returns: markdown string for kb.md
}

// persona-gen.js
export async function generatePersona(kg, make, model, year) {
  // Generate persona.json from vehicle characteristics.
  // 
  // Rules:
  //   - Sport cars → confident, performance-focused
  //   - Family SUVs → protective, safety-conscious  
  //   - Trucks → tough, capable, no-nonsense
  //   - Luxury → refined, detail-oriented
  //   - Economy → practical, efficient, value-conscious
  //   - Electric → progressive, tech-forward
  //
  // Returns: persona.json content with persona_name, tone, style, traits
}
```

**Acceptance:** kb.md reads as a genuine first-person narrative. persona.json has vehicle-appropriate personality.

---

### Step 11: Capsule Stamper

**File:** `src/capsule/stamper.js`

```javascript
export function stampGloveBox(vin, kg, kb, persona, outputDir) {
  // Creates the 5-file AETHER capsule directory:
  //
  // output/glovebox-{vin_last8}/
  //   ├── glovebox-{vin_last8}-manifest.json
  //   ├── glovebox-{vin_last8}-definition.json
  //   ├── glovebox-{vin_last8}-persona.json
  //   ├── glovebox-{vin_last8}-kb.md
  //   └── glovebox-{vin_last8}-kg.jsonld
  //
  // manifest.json:
  //   uid: "glovebox-{vin_last8}-v1.0.0-{hash8}"
  //   name: "GloveBox: {year} {make} {model}"
  //   version: "1.0.0"
  //   vin: "{full_vin}"
  //
  // definition.json:
  //   agent_type: "advisor"
  //   domain_boundaries.authoritative: ["this specific vehicle", "VIN {vin}"]
  //   domain_boundaries.out_of_scope: ["other vehicles", "mechanical repair procedures"]
  //   stages: { distill: true, augment: true, generate: true, review: true }
  //   aec_threshold: 0.8
}
```

**Acceptance:** Produces valid AETHER capsule. `python cli.py validate output/glovebox-*` passes.

---

### Step 12: CLI Entry Point

**File:** `src/index.js`

```bash
# Create a GloveBox from VIN
node src/index.js create --vin 1HGBH41JXMN109186

# Create with Carfax PDF
node src/index.js create --vin 1HGBH41JXMN109186 --carfax ./my-carfax.pdf

# Create with current mileage (for maintenance schedule)
node src/index.js create --vin 1HGBH41JXMN109186 --mileage 45230

# Refresh data for existing GloveBox
node src/index.js refresh --vin 1HGBH41JXMN109186

# Show info about a GloveBox
node src/index.js info --vin 1HGBH41JXMN109186

# Talk to your car (runs DAGR pipeline via AETHER)
node src/index.js ask --vin 1HGBH41JXMN109186 "When is my next oil change due?"
```

**The `ask` command shells out to AETHER's Python CLI:**
```javascript
// Internally runs:
// python cli.py run output/glovebox-{vin_last8} "{question}" --provider anthropic
```

**Acceptance:**
```
✓ create produces valid capsule with 30+ KG nodes from free APIs alone
✓ create --carfax adds service history nodes
✓ create --mileage adds maintenance schedule with next-due dates
✓ refresh updates recall/complaint data without overwriting user data
✓ info displays capsule summary
✓ ask returns first-person response with AEC score
```

---

## End-to-End Demo

After all 12 steps pass:

```bash
# Create a GloveBox
$ node src/index.js create --vin 1HGBH41JXMN109186 --mileage 45230

[glovebox] Validating VIN: 1HGBH41JXMN109186 ✓
[glovebox] Collecting data from 6 sources...
  ├── NHTSA VIN decode: 15 nodes ✓
  ├── NHTSA recalls: 2 nodes ✓
  ├── NHTSA complaints: 8 nodes ✓
  ├── NHTSA safety: 1 node ✓
  ├── EPA fuel economy: 1 node ✓
  └── Maintenance schedule: 10 nodes ✓
[glovebox] Composing knowledge graph: 37 nodes, 24 edges
[glovebox] Generating first-person narrative...
[glovebox] Generating car persona...
[glovebox] Stamping capsule: output/glovebox-MN109186/

GloveBox created! 🚗

# Talk to your car
$ node src/index.js ask --vin 1HGBH41JXMN109186 "Do I have any open recalls?"

"Yes, I have 2 open recalls. The first is campaign 21V-560 for my fuel pump
module — the remedy is a free replacement at any Honda dealer. The second is
campaign 23V-112 for a software update to my adaptive cruise control. I'd
recommend scheduling both at your next dealer visit."

AEC Score: 1.00 (all claims grounded in NHTSA recall data)
```

---

## What v1.0 Does NOT Include

- Web frontend (CLI only)
- OBD-II integration (future — needs hardware testing)
- Carfax PDF parsing (future — complex document parsing)
- Receipt photo parsing (future — OCR integration)
- Scheduled refresh (future — needs cron/daemon)
- Multi-car support (future — one VIN per invocation)
- User accounts (future — filesystem only)

**v1.0 scope: VIN → free APIs → composed KG → first-person capsule → talk to it via CLI.**

Everything else is v1.1+.

---

## Claude Code Prompt

> Read claude.md first, then read this build spec (claude-build-glovebox-v1.0.md).
> Execute the 12 steps in order. Do not skip ahead. Each step has acceptance criteria — verify before proceeding.
> Start with Step 1: Project Scaffold.
