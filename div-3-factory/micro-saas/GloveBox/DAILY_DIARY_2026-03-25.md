# GLOVEBOX Daily Diary - March 25, 2026

## Project Overview

**GLOVEBOX** is an 864zeros LLC product that transforms a VIN (Vehicle Identification Number) into a first-person AI agent for a car. The car can "speak" about itself - its specs, recalls, complaints, fuel economy, and maintenance needs.

**Tagline:** "Your Car, As an Agent"

**Business Model:** Part of the 864zeros "micro-SaaS" portfolio. Free public APIs (NHTSA, EPA) provide the data. The value is in the composition, narrative, and agent persona.

---

## What Was Built Today

Complete implementation of the 12-step build spec. GLOVEBOX v1.0 is functional.

### Architecture

```
VIN Input
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                    DATA ADAPTERS                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ NHTSA   │ │ NHTSA   │ │ NHTSA   │ │ NHTSA   │       │
│  │   VIN   │ │ Recalls │ │Complaints│ │ Safety  │       │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │
│       │           │           │           │             │
│  ┌────┴────┐ ┌────┴────┐                               │
│  │  EPA    │ │  Maint  │                               │
│  │  Fuel   │ │Schedule │                               │
│  └────┬────┘ └────┬────┘                               │
└───────┼───────────┼─────────────────────────────────────┘
        │           │
        ▼           ▼
┌─────────────────────────────────────────────────────────┐
│              GRAPH COMPOSER (JSON-LD)                    │
│  - Flattens all adapter nodes                           │
│  - Deduplicates by @id                                  │
│  - Adds vehicle identity node                           │
│  - Generates relationship edges                         │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    NARRATORS                             │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   KB Narrator   │  │  Persona Gen    │              │
│  │ (first-person)  │  │ (vehicle type)  │              │
│  └────────┬────────┘  └────────┬────────┘              │
└───────────┼────────────────────┼────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│              CAPSULE STAMPER                             │
│  Creates 5-file AETHER capsule:                         │
│  - manifest.json    (metadata)                          │
│  - definition.json  (agent config)                      │
│  - persona.json     (voice/personality)                 │
│  - kb.md            (first-person narrative)            │
│  - kg.jsonld        (full knowledge graph)              │
└─────────────────────────────────────────────────────────┘
            │
            ▼
      output/glovebox-{vin_last8}/
```

---

## File Structure

```
C:\Users\I820965\dev\864zeros\micro-saas\GloveBox\
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── package.json              # Node.js config (type: "module")
├── GLOVEBOX_CLAUDE.md        # Original project instructions
├── claude-build-glovebox-v1.0.md  # 12-step build spec
├── scratch.txt               # Original brainstorm
│
├── src/
│   ├── index.js              # CLI entry point (create/info/refresh/ask)
│   │
│   ├── utils/
│   │   ├── vin-validator.js  # VIN validation + check digit (mod 11)
│   │   ├── cache.js          # Filesystem API response cache
│   │   └── jsonld-helpers.js # JSON-LD node construction helpers
│   │
│   ├── adapters/
│   │   ├── nhtsa-vin.js      # NHTSA VIN decoder API
│   │   ├── nhtsa-recalls.js  # NHTSA recalls API
│   │   ├── nhtsa-complaints.js # NHTSA complaints (aggregated)
│   │   ├── nhtsa-safety.js   # NHTSA safety ratings API
│   │   ├── epa-fuel.js       # EPA fuel economy (multi-step)
│   │   ├── maintenance-schedule.js # Manufacturer maintenance tables
│   │   ├── carfax-parser.js  # STUB - future Carfax integration
│   │   ├── obd-adapter.js    # STUB - future OBD-II integration
│   │   └── receipt-parser.js # STUB - future receipt parsing
│   │
│   ├── composer/
│   │   └── graph-composer.js # JSON-LD merger + edge generator
│   │
│   ├── narrator/
│   │   ├── kb-narrator.js    # First-person narrative generator
│   │   └── persona-gen.js    # Vehicle personality generator
│   │
│   ├── capsule/
│   │   └── stamper.js        # 5-file AETHER capsule creator
│   │
│   └── gateway/
│       └── api-gateway.js    # STUB - future API rate limiting
│
├── test/
│   ├── test-vin-validate.js  # VIN validator tests (5 tests)
│   ├── test-vin-decode.js    # NHTSA VIN decoder tests (5 tests)
│   ├── test-recalls.js       # NHTSA recalls tests (4 tests)
│   ├── test-complaints.js    # NHTSA complaints tests (4 tests)
│   ├── test-fuel.js          # EPA fuel tests (3 tests)
│   ├── test-composer.js      # Graph composer tests (6 tests)
│   └── test-full-pipeline.js # End-to-end test
│
├── schemas/
│   ├── vehicle-context.jsonld   # JSON-LD @context definition
│   └── composition-schema.json  # KG structure schema
│
├── cache/                    # API response cache (gitignored)
└── output/                   # Generated capsules (gitignored)
    └── glovebox-KH522075/    # Example: 2019 Honda Civic
        ├── glovebox-KH522075-manifest.json
        ├── glovebox-KH522075-definition.json
        ├── glovebox-KH522075-persona.json
        ├── glovebox-KH522075-kb.md
        └── glovebox-KH522075-kg.jsonld
```

---

## Key Technical Details

### VIN Validation (src/utils/vin-validator.js)
- 17-character validation
- Check digit verification using weighted sum mod 11
- Returns decoded parts: WMI, VDS, year code, plant code, sequence

### Adapters Output JSON-LD Nodes
Each adapter returns an array of nodes with this structure:
```javascript
{
  '@id': 'spec:Make',           // Unique identifier
  '@type': 'skill:Concept',     // Node type (Concept, Rule, AntiPattern)
  'rdfs:label': 'Make: HONDA',  // Human-readable label
  'aether:origin': 'core',      // Origin marker
  'aether:source': 'nhtsa-vin', // Source adapter
  'aether:field': 'Make',       // Field name
  'aether:value': 'HONDA'       // Field value
}
```

### Node Types
- `skill:Concept` - Facts, specs, fuel economy
- `skill:Rule` - Recalls, maintenance items (things to do)
- `skill:AntiPattern` - Complaints, known issues (things to avoid)

### API Endpoints Used
| API | Endpoint | Purpose |
|-----|----------|---------|
| NHTSA VIN | `vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{vin}` | Decode VIN |
| NHTSA Recalls | `api.nhtsa.gov/recalls/recallsByVehicle` | Get recalls |
| NHTSA Complaints | `api.nhtsa.gov/complaints/complaintsByVehicle` | Get complaints |
| NHTSA Safety | `api.nhtsa.gov/SafetyRatings/modelyear/{year}/make/{make}/model/{model}` | Safety ratings |
| EPA Fuel | `fueleconomy.gov/ws/rest/vehicle/menu/model` | Fuel economy |

### Graph Composer (src/composer/graph-composer.js)
- Flattens all adapter node arrays
- Deduplicates by `@id` (first occurrence wins)
- Creates vehicle identity node
- Generates edges: `hasRecall`, `hasIssue`, `hasService`, `requires`
- Wraps in JSON-LD with `@context` and `@graph`

### Persona Types (src/narrator/persona-gen.js)
| Type | Makes/Models | Tone |
|------|--------------|------|
| sports | Ferrari, Porsche, Mustang, Camaro | enthusiastic and proud |
| truck | F-150, Silverado, Ram, Tacoma | no-nonsense and dependable |
| suv | Explorer, Tahoe, Highlander, Pilot | warm and reassuring |
| luxury | Mercedes, BMW, Audi, Lexus | elegant and composed |
| electric | Tesla, Rivian, Lucid, Bolt | modern and optimistic |
| economy | Civic, Corolla, Camry, Accord | friendly and helpful |

---

## Current State

### Working
- VIN validation with check digit verification
- All 6 data adapters (NHTSA x4, EPA, maintenance)
- Graph composition with 125+ nodes, 96+ edges
- KB narrative generation (template mode)
- Persona generation based on vehicle type
- Capsule stamping (5 files)
- CLI commands: `create`, `info`, `refresh`
- File-based API caching

### Not Working / Incomplete
1. **`ask` command** - Placeholder only. Shows KB but doesn't actually chat.
2. **LLM integration** - No Anthropic/OpenAI API call to enable conversation.
3. **KB narrative identity bug** - Shows "Your Vehicle" instead of actual make/model in title.
4. **Persona detection** - Honda Civic detected as "luxury" (should be "economy").

---

## Test Results

All tests pass:
```
test-vin-validate.js   5/5 ✓
test-vin-decode.js     5/5 ✓
test-recalls.js        4/4 ✓
test-complaints.js     4/4 ✓
test-fuel.js           3/3 ✓
test-composer.js       6/6 ✓
```

### End-to-End Demo
```bash
node src/index.js create --vin 2HGFC2F59KH522075 --mileage 45000
```
Result: 2019 Honda Civic capsule with 125 nodes, 96 edges, 3 recalls, 78 complaint categories.

---

## Git Status

```
Repo: C:\Users\I820965\dev\864zeros\micro-saas\GloveBox
Branch: main
Commit: 82210ec feat: GLOVEBOX v1.0 - VIN to AETHER capsule pipeline
Files: 33 files, 4748 insertions
```

---

## Next Steps (Priority Order)

### 1. Add Interactive Chat Mode (User Requested)
Create `src/chat/chat-mode.js` that:
- Loads capsule (kb.md + persona.json)
- Builds system prompt with persona voice
- Calls Anthropic or OpenAI API
- Enables back-and-forth conversation
- CLI: `node src/index.js chat --vin <VIN>`

Needs:
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` in `.env`
- Simple readline interface for terminal chat

### 2. Fix KB Narrative Identity Bug
In `src/narrator/kb-narrator.js`, line 207:
```javascript
// Current (buggy):
const identity = `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim() || 'Your Vehicle';

// The template uses "Your Vehicle" as fallback but vehicle info IS available
// Need to pass make/model/year explicitly to generateTemplateNarrative()
```

### 3. Fix Persona Type Detection
Honda Civic incorrectly detected as "luxury". Check detection order in `persona-gen.js`.
The Honda brand matches "acura" luxury patterns. Need to check model-specific patterns first.

### 4. Future Enhancements (from original spec)
- Carfax parser adapter (receipt upload)
- OBD-II adapter (live vehicle data)
- Receipt parser (maintenance history)
- Weekly recall check impulse
- AETHER framework integration

---

## Environment Setup

```bash
# Requirements
Node.js 18+ (uses native fetch)

# Install (no dependencies needed)
cd C:\Users\I820965\dev\864zeros\micro-saas\GloveBox

# For chat mode (future), add to .env:
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
```

---

## Commands Reference

```bash
# Create capsule
node src/index.js create --vin <VIN> --mileage <miles>

# View existing capsule
node src/index.js info --vin <VIN>

# Refresh from APIs
node src/index.js refresh --vin <VIN>

# Ask (placeholder)
node src/index.js ask --vin <VIN> "question"

# Run tests
node test/test-vin-validate.js
node test/test-full-pipeline.js
```

---

## For New LLM Sessions

**To continue this project:**

1. Read this diary first
2. Read `GLOVEBOX_CLAUDE.md` for full project context
3. Read `claude-build-glovebox-v1.0.md` for the original build spec
4. The immediate task is: **Add interactive chat mode** using Anthropic or OpenAI API

**Key files to read for chat implementation:**
- `src/index.js` (CLI structure, add `chat` command)
- `src/capsule/stamper.js` (loadGloveBox function to load capsule)
- `src/narrator/persona-gen.js` (persona structure for system prompt)
- `output/glovebox-KH522075/` (example capsule files)

**The user wants:**
```bash
node src/index.js chat --vin 2HGFC2F59KH522075

🚗 2019 HONDA Civic ready. Ask me anything.

You: Do I have any recalls?
Car: Yes, I have 3 open recalls...
```

---

## End of Day Update (Late Night)

### Chat Mode Built
Added interactive chat feature. Two new files:

```
src/chat/
├── llm-client.js   # Anthropic/OpenAI API client
└── chat-mode.js    # Interactive readline loop
```

**Commits today:**
```
82210ec feat: GLOVEBOX v1.0 - VIN to AETHER capsule pipeline
23bd326 docs: Add daily diary for LLM session continuity
b66f8f8 feat: Add interactive chat mode with LLM integration
```

### Where We Left Off
- Chat mode is built and ready
- User needs to add API key to `.env` file
- **Tomorrow morning:** User will provide ANTHROPIC_API_KEY to test live chat

### To Resume Tomorrow
1. User creates `.env` with their API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

2. Test chat:
   ```bash
   cd C:\Users\I820965\dev\864zeros\micro-saas\GloveBox
   node src/index.js chat --vin 2HGFC2F59KH522075
   ```

3. If it works, we're done with v1.0!

4. Optional fixes still pending:
   - KB narrative shows "Your Vehicle" instead of actual make/model
   - Persona detection (Civic detected as luxury, should be economy)

---

*Diary written: March 25, 2026*
*Last updated: Late night, ready for morning test*
*Author: Claude Opus 4.5*
*Project: GLOVEBOX v1.0*
*Company: 864zeros LLC*
