# 864zeros Extension Templates

Reusable scaffolds and patterns for building Chrome extensions autonomously.

These templates were extracted from the ClipBoard extension build and encode proven patterns for tier-gated features, AI integration, content capture, messaging, UI components, monetization, and legal compliance.

---

## Quick Reference

### Core Templates

| Template | Purpose | Use When... |
|----------|---------|-------------|
| `feature-brief.md` | Define a feature before building | Starting any new feature |
| `gated-feature.js` | Tier-locked feature pattern | Feature requires paid tier |
| `ai-feature.js` | AI integration with Gemini | Adding AI-powered functionality |
| `capture-type.js` | New content capture method | Adding screenshot, marquee, etc. |
| `message-handler.js` | Service worker hub pattern | Setting up message routing |
| `ui-components.html` | Reusable HTML snippets | Building sidepanel/popup UI |
| `ui-components.css` | Component styles | Styling UI components |
| `setting-field.js` | Options page inputs | Adding user settings |
| `cross-context-broadcast.js` | Inter-context messaging | Syncing data across contexts |
| `console-helper.js` | Debug console backdoor | Every extension (dev/test) |

### Monetization Templates

| Template | Purpose | Use When... |
|----------|---------|-------------|
| `credit-system.js` | Pay-per-use credits | AI features, variable usage |
| `subscription-flow.js` | Recurring subscriptions | Professional tools, ongoing value |
| `pricing-model.md` | Profit margins & costs | Pricing decisions, cost analysis |

### InsightForge Templates

| Template | Purpose | Use When... |
|----------|---------|-------------|
| `insightforge-feature.js` | Multi-clip AI analysis | Building synthesis, Q&A, or report features |

### Launch Templates

| Template | Purpose | Use When... |
|----------|---------|-------------|
| `phase-4-polish.md` | Pre-launch checklist | Before Chrome Web Store submission |
| `legal-framework.md` | Terms, Privacy, Copyright | Every production release |

---

## Template Details

### feature-brief.md
**Start here for any new feature.**

Checklist-based template for defining:
- Feature ID and display name
- Required tier level
- Message types to add
- Data model changes
- Service worker handler signature
- UI components needed
- Testing checklist

### gated-feature.js
**Tier-locked feature implementation.**

Includes:
- Constants to add (MESSAGE_TYPE, FEATURE_TIER)
- Service worker handler with tier check
- UI trigger with loading state
- Upgrade prompt dialog
- Testing commands

### ai-feature.js
**AI-powered features using Gemini.**

Includes:
- PPI (Personal Identifiable Information) redaction
- API key management
- Text and vision API calls
- Service worker handler pattern
- UI trigger and result display
- Prompt templates (summarize, auto-tag, sentiment)
- Error handling for missing API key

### capture-type.js
**New content capture methods.**

Includes:
- Capture menu option HTML
- Simple capture (no page interaction)
- Interactive capture (content script injection)
- Selection overlay UI
- Image cropping with OffscreenCanvas
- Clip card rendering by type

### message-handler.js
**Service worker message hub.**

Includes:
- Full message listener structure
- Database initialization pattern
- CRUD handler examples
- Broadcast helper function
- Tab-specific messaging
- Standardized error responses
- Testing commands

### ui-components.html
**HTML snippets for common UI elements.**

Components:
- Panel header with settings cog
- Filter bar with chips
- Empty states
- Clip cards (text, screenshot)
- Bulk action bar
- Floating action button (FAB)
- Bottom navigation
- Capture menu
- Upgrade dialog
- Auto-tag banner
- Search input
- Tag chips
- Loading spinners

### ui-components.css
**Styles for all UI components.**

Uses OIA Design System CSS variables. Includes:
- All component styles from HTML snippets
- Select mode checkbox states
- Responsive utilities
- Animation keyframes
- Toast notifications

### setting-field.js
**Options page input patterns.**

Field types:
- Toggle/checkbox
- Select/dropdown
- Text input with save button
- Password with visibility toggle
- Range slider
- Radio group

Includes load, save, and storage sync patterns.

### cross-context-broadcast.js
**Communication between extension contexts.**

Covers:
- Service worker as central hub
- Broadcast to all contexts
- Tab-specific messaging
- Content script communication
- Storage-based sync (alternative)
- Request patterns (timeout, retry, fire-and-forget)
- ASCII flow diagrams

### console-helper.js
**Developer debug console for testing.**

Standardized `window.[slug]` object for all extensions. Includes:

Universal Commands:
- `status()` - Full dashboard (tier, credits, storage, tokens)
- `version()` - Extension and environment info
- `help()` - List all available commands

Tier & Credits:
- `tier()` / `setTier()` - View/override tier level
- `credits()` / `setCredits()` / `addCredits()` - Credit management
- `creditCosts()` - Show cost per AI feature

AI & Tokens:
- `tokens()` - LLM token usage with cost calculation
- `resetTokens()` - Reset session counters

Storage:
- `storage()` - IndexedDB usage (used/quota/percent)
- `settings()` - View all extension settings
- `clearData()` - Destructive clear with confirmation

Testing:
- `simulate.offline()` - Toggle offline mode
- `simulate.slowNetwork()` - Add artificial latency
- `reset()` - Reset extension to defaults

### credit-system.js
**Pay-per-use monetization.**

Ideal for AI features where usage varies. Includes:
- Credit balance storage and management
- Credit pack definitions and pricing
- Deduction before/after action patterns
- Insufficient credits prompt with purchase flow
- Credit badge UI component
- Stripe checkout integration
- Transaction history logging

### subscription-flow.js
**Recurring subscription monetization.**

Ideal for professional tools with ongoing value. Includes:
- Subscription status management
- Trial period handling
- Grace period for failed payments
- Monthly/annual plan options
- Subscription badge UI
- Stripe checkout and customer portal
- Periodic subscription verification
- Webhook handling patterns

### pricing-model.md
**Profit margins and cost analysis reference.**

Comprehensive pricing documentation:
- AI provider costs (Gemini, Claude) per token
- Vision/image token calculations
- Credit pack pricing with Stripe fees
- Per-operation cost breakdown
- Profit margin analysis (99.7% gross, 82-93% net)
- Key ratios (400:1 markup)
- Free credits strategy
- Pricing adjustment guidelines
- Constants template for implementation

### insightforge-feature.js
**Multi-clip AI analysis pattern.**

For building features that analyze multiple clips together. Includes:
- Tier + credit gating pattern
- Multi-clip content aggregation
- AI synthesis prompts (themes, insights, connections)
- JSON response parsing with fallbacks
- Results modal UI
- Credits prompt when insufficient
- Loading states and error handling

### phase-4-polish.md
**Pre-launch checklist.**

Comprehensive checklist covering:
- Privacy messaging (REQUIRED)
- Legal framework (Terms, Privacy, Copyright)
- Chrome Web Store listing optimization
- Code quality checks
- UX polish (empty states, loading, errors)
- Monetization readiness
- Testing final pass
- Submission checklist

### legal-framework.md
**Terms of Use, Privacy Policy, Copyright.**

Complete legal templates including:
- Terms of Use HTML template
- Privacy Policy HTML template (privacy-first framing)
- Legal page CSS styles
- Copyright notices for code files
- LICENSE file templates (MIT and proprietary)
- Third-party attribution template
- Options page footer with legal links

---

## How to Use

### 1. Define the Feature
```
1. Copy feature-brief.md
2. Fill in all sections
3. Get approval before building
```

### 2. Pick Relevant Scaffolds
```
Tier-gated feature?     → gated-feature.js
AI-powered?             → ai-feature.js
New capture method?     → capture-type.js
New UI components?      → ui-components.html + .css
New setting?            → setting-field.js
Cross-context sync?     → cross-context-broadcast.js
Pay-per-use billing?    → credit-system.js
Subscription billing?   → subscription-flow.js
Ready to launch?        → phase-4-polish.md
Legal compliance?       → legal-framework.md
```

### 3. Copy and Customize
```
1. Copy relevant sections to your files
2. Replace all [PLACEHOLDERS] with actual values
3. Delete instruction comments
4. Follow the testing checklist
```

---

## File Structure Reference

```
extensions/[app-slug]/
├── manifest.json
├── background/
│   └── service-worker.js      ← message-handler.js
├── sidepanel/
│   ├── index.html             ← ui-components.html
│   ├── styles.css             ← ui-components.css
│   └── main.js                ← gated-feature.js, capture-type.js
├── options/
│   ├── options.html           ← setting-field.js (HTML)
│   ├── options.css
│   └── options.js             ← setting-field.js (JS)
├── content/
│   └── content-script.js      ← capture-type.js (interactive)
├── legal/                     ← legal-framework.md
│   ├── terms.html
│   ├── privacy.html
│   └── styles.css
└── lib/
    ├── constants.js           ← All MESSAGE_TYPES, FEATURE_TIERS
    ├── db.js                  ← IndexedDB wrapper
    ├── store.js               ← Settings helpers
    ├── tiers.js               ← Tier checking
    ├── credits.js             ← credit-system.js
    ├── subscription.js        ← subscription-flow.js
    ├── api-client.js          ← ai-feature.js
    └── backup.js              ← Export/import
```

---

## Patterns Summary

### Tier Gating Flow
```
User triggers feature
    → Check getFeatureAccess('feature-id')
    → If denied: show upgrade prompt
    → If allowed: perform action
```

### AI Feature Flow
```
User triggers AI action
    → Check tier access
    → Check API key exists
    → Redact PPI from content
    → Call Gemini API
    → Display result / handle error
```

### Message Flow
```
UI Context → sendMessage(TYPE, payload)
          → Service Worker handles
          → Returns response
          → UI updates
```

### Broadcast Flow
```
Something happens (import, setting change)
    → Service Worker broadcasts
    → All open contexts receive
    → Each context updates as needed
```

### Credit-Based Monetization Flow
```
User triggers paid action
    → Check canAfford('action')
    → If insufficient: show credit purchase prompt
    → If sufficient: perform action
    → Deduct credits after success
    → Broadcast balance update
```

### Subscription Flow
```
User triggers premium feature
    → Check isSubscriptionActive()
    → If inactive: show subscription prompt
    → If active: proceed with feature
```

### InsightForge (Multi-Clip Analysis) Flow
```
User selects multiple clips → Clicks "Synthesize"
    → Check tier access (Power)
    → Check credits (canAfford)
    → If insufficient: show credits prompt
    → Aggregate clip content
    → Call AI with synthesis prompt
    → Parse JSON response
    → Deduct credits after success
    → Display results in modal
```

### Privacy-First Launch
```
Before Chrome Web Store submission:
    → Add privacy footer to UI
    → Create Terms of Use
    → Create Privacy Policy
    → Add legal links to options page
    → Add privacy claims to store listing
```

### Debug Console Pattern
```
Developer opens console
    → Type [slug].help() for commands
    → [slug].status() shows full dashboard
    → [slug].setTier('power') to test paid features
    → [slug].tokens() to monitor AI costs
    → [slug].storage() to check IndexedDB usage
```

---

## Testing Tips

1. **Set tier level:**
   ```js
   chrome.storage.local.set({ 'appslug_tier': 'pro' })
   ```

2. **Test messages:**
   ```js
   chrome.runtime.sendMessage({ type: 'GET_CLIPS' }, console.log)
   ```

3. **Check feature access:**
   ```js
   chrome.runtime.sendMessage({
     type: 'CHECK_FEATURE_ACCESS',
     payload: { feature: 'ai-summary' }
   }, console.log)
   ```

4. **Enable debug logging:**
   ```js
   const DEBUG = true; // At top of file
   ```

---

## Contributing

When adding new templates:
1. Extract patterns from working implementations
2. Use `[PLACEHOLDER]` syntax for customizable values
3. Include step-by-step sections
4. Add testing checklist at the end
5. Update this README

---

*Templates extracted from ClipBoard extension build — 864zeros LLC*
