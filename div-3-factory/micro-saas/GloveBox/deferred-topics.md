# GLOVEBOX Deferred Topics

Parking lot for ideas, enhancements, and tasks to revisit later.

---

## Status Legend
- `[ ]` Not started
- `[~]` In progress / partially done
- `[x]` Completed
- `[!]` Blocked / needs input
- `[?]` Needs research

---

## Bugs / Fixes

| Status | Topic | Notes | Added |
|--------|-------|-------|-------|
| `[x]` | Vehicle identity shows "Your Vehicle" | Fixed in stamper.js and kb-narrator.js | 2026-03-26 |
| `[x]` | Car doesn't know its data sources | Fixed in chat-mode.js - added extractDataSources() | 2026-03-26 |
| `[ ]` | Persona detection: Civic = "luxury" | Should be "economy". Check pattern order in persona-gen.js | 2026-03-26 |

---

## Enhancements

| Status | Topic | Notes | Added |
|--------|-------|-------|-------|
| `[ ]` | Streaming chat responses | Currently waits for full response. Add streaming for better UX | 2026-03-26 |
| `[ ]` | Chat history persistence | Save/load conversation history to file | 2026-03-26 |
| `[ ]` | Multiple vehicles | Support multiple VINs per user | 2026-03-26 |
| `[ ]` | Mileage tracking | Update mileage over time, recalculate maintenance | 2026-03-26 |
| `[ ]` | Service history logging | Track completed maintenance | 2026-03-26 |

---

## Future Adapters (from original spec)

| Status | Topic | Notes | Added |
|--------|-------|-------|-------|
| `[ ]` | Carfax parser | Parse Carfax reports for service history | 2026-03-26 |
| `[ ]` | OBD-II adapter | Live vehicle data via OBD dongle | 2026-03-26 |
| `[ ]` | Receipt parser | OCR maintenance receipts | 2026-03-26 |
| `[ ]` | TSB (Technical Service Bulletins) | NHTSA TSB API | 2026-03-26 |

---

## Infrastructure

| Status | Topic | Notes | Added |
|--------|-------|-------|-------|
| `[ ]` | Weekly recall check impulse | Scheduled job to check for new recalls | 2026-03-26 |
| `[ ]` | AETHER framework integration | Full integration with AETHER runtime | 2026-03-26 |
| `[ ]` | Web UI | Browser-based chat interface | 2026-03-26 |
| `[ ]` | API server | REST API for capsule creation/chat | 2026-03-26 |

---

## Ideas / Research

| Status | Topic | Notes | Added |
|--------|-------|-------|-------|
| `[?]` | VIN-specific recall lookup | NHTSA has VIN-specific recall API - more accurate than make/model | 2026-03-26 |
| `[?]` | Parts pricing integration | RockAuto, AutoZone APIs? | 2026-03-26 |
| `[?]` | Dealer locator | Find nearby dealers for recall service | 2026-03-26 |
| `[?]` | Insurance integration | Estimate insurance costs by vehicle | 2026-03-26 |

---

## User Feedback

| Status | Topic | Notes | Added |
|--------|-------|-------|-------|
| | | (No feedback yet) | |

---

## How to Use This File

1. **Add new topics:** Copy a row template, fill in details
2. **Update status:** Change `[ ]` to `[x]` when done
3. **Add notes:** Keep notes brief, link to commits/files if needed
4. **Date everything:** Always add the date when topic was added

---

*Last updated: 2026-03-26*
