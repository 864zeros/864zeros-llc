# 864zeros Pricing & Profit Model

Reference document for subscription + credit monetization across all extensions.

**Updated:** February 2026
**Inspiration:** GMass ($450K MRR, 1 employee)

---

## Pricing Philosophy (GMass Model)

### Key Principles

1. **Higher price = professional positioning**
   - GMass charges $30-60/mo, not $5/mo
   - Prosumers pay for tools that save time
   - Low price signals "toy", high price signals "serious tool"

2. **Trial, not free tier**
   - GMass has no free plan, just a trial
   - Removes freeloaders, improves conversion math
   - Users who pay upfront are more engaged

3. **Unlimited core features**
   - GMass: unlimited emails, contacts, campaigns
   - ClipBoard: unlimited clips, tags, search, export
   - Pay for AI features via credits (usage-based)

4. **Team plans are the multiplier**
   - GMass teams: $175-$2,200+/mo
   - B2B revenue at 10x individual ARPU

5. **Interface arbitrage**
   - Live where users already are (browser, Gmail)
   - No separate dashboard to learn
   - Reduce friction to near zero

---

## Revised Tier Pricing

### Individual Plans

| Tier | Monthly | Annual | Annual Savings |
|------|---------|--------|----------------|
| ~~Free~~ | ~~$0~~ | - | *Removed - trial only* |
| **Starter** | $9.99 | $99/yr | 2 months free |
| **Pro** | $19.99 | $199/yr | 2 months free |
| **Power** | $29.99 | $299/yr | 2 months free |

### Team Plans (Future)

| Team Size | Monthly | Annual |
|-----------|---------|--------|
| 5 users | $39.99 | $399/yr |
| 10 users | $74.99 | $749/yr |
| 25 users | $149.99 | $1,499/yr |
| Enterprise | Custom | Custom |

### Trial Strategy

| Element | Details |
|---------|---------|
| Duration | 7 days full access |
| Credit card required | No (reduces friction) |
| Features | All Power tier features |
| AI credits | 25 free credits |
| Conversion goal | 10-15% trial → paid |

---

## Feature Matrix

| Feature | Trial | Starter | Pro | Power |
|---------|-------|---------|-----|-------|
| Unlimited clips | ✓ | ✓ | ✓ | ✓ |
| Unlimited tags | ✓ | ✓ | ✓ | ✓ |
| Search & filter | ✓ | ✓ | ✓ | ✓ |
| Local export/import | ✓ | ✓ | ✓ | ✓ |
| Screenshot capture | ✓ | ✓ | ✓ | ✓ |
| Marquee capture | ✓ | - | ✓ | ✓ |
| AI Summary | ✓ | 10/mo | 50/mo | Unlimited* |
| AI Auto-tag | ✓ | - | 20/mo | Unlimited* |
| AI Vision | ✓ | - | 10/mo | Unlimited* |
| InsightForge Synthesis | ✓ | - | - | Credits |
| Google Drive sync | ✓ | - | ✓ | ✓ |
| Priority support | - | - | - | ✓ |

*Unlimited = included in subscription, no extra credits needed*

---

## Credit System (Power Tier Add-on)

Power users get unlimited standard AI, but InsightForge features use credits:

### Credit Costs

| Feature | Credits | Description |
|---------|---------|-------------|
| Quick Summary | 3 | Themes, insights, connections |
| Research Dossier | 5 | Full analysis with sources |
| Ask Clips | 2 | Conversational Q&A |
| Visual Map | 8 | Relationship diagrams (future) |

### Credit Packs

| Pack | Credits | Price | Per Credit |
|------|---------|-------|------------|
| Starter | 25 | $4.99 | $0.20 |
| **Popular** | 60 | $9.99 | $0.17 |
| Pro | 150 | $19.99 | $0.13 |

---

## AI Provider Costs

### Gemini (Primary)

| Model | Input/1M | Output/1M |
|-------|----------|-----------|
| Gemini 2.5 Flash | $0.15 | $0.60 |

### Per-Operation Costs

| Operation | Est. Tokens | Our Cost |
|-----------|-------------|----------|
| AI Summary | ~700 | $0.0003 |
| Auto-Tag | ~450 | $0.0001 |
| AI Vision | ~1,500 | $0.0004 |
| Quick Summary | ~2,500 | $0.0006 |
| Research Dossier | ~4,000 | $0.0011 |

---

## Revenue Projections (Revised)

### ARPU Comparison

| Model | Old | New (GMass-inspired) |
|-------|-----|----------------------|
| Starter | $1.99 | $9.99 |
| Pro | $3.99 | $19.99 |
| Power | $5.99 | $29.99 |
| Avg ARPU | ~$3.50 | ~$18 |

### Monthly Projections (Year 1)

| Month | Users | Trials | Paid (12%) | Avg ARPU | MRR |
|-------|-------|--------|------------|----------|-----|
| 1 | 500 | 500 | 60 | $15 | $900 |
| 2 | 1,200 | 700 | 144 | $15 | $2,160 |
| 3 | 2,500 | 1,300 | 300 | $16 | $4,800 |
| 4 | 5,000 | 2,500 | 600 | $16 | $9,600 |
| 5 | 8,000 | 3,000 | 960 | $17 | $16,320 |
| 6 | 12,000 | 4,000 | 1,440 | $17 | $24,480 |
| 7 | 17,000 | 5,000 | 2,040 | $18 | $36,720 |
| 8 | 23,000 | 6,000 | 2,760 | $18 | $49,680 |
| 9 | 30,000 | 7,000 | 3,600 | $18 | $64,800 |
| 10 | 38,000 | 8,000 | 4,560 | $18 | $82,080 |
| 11 | 47,000 | 9,000 | 5,640 | $19 | $107,160 |
| 12 | 57,000 | 10,000 | 6,840 | $19 | $129,960 |

### Year 1 Summary (New Model)

| Metric | Old Projection | New Projection |
|--------|----------------|----------------|
| Month 12 MRR | $10,500 | **$130,000** |
| ARR Run Rate | $126K | **$1.56M** |
| Paying Users | 2,100 | 6,840 |
| Total Users | 42,000 | 57,000 |

---

## Profit Analysis (New Pricing)

### Per Subscription (After Stripe)

| Tier | Price | Stripe Fee | Net |
|------|-------|------------|-----|
| Starter | $9.99 | $0.59 | $9.40 |
| Pro | $19.99 | $0.88 | $19.11 |
| Power | $29.99 | $1.17 | $28.82 |

### Monthly P&L (Month 12 Projection)

| Line Item | Amount |
|-----------|--------|
| Gross Revenue | $130,000 |
| Stripe Fees (6%) | -$7,800 |
| API Costs (~0.5%) | -$650 |
| Infrastructure | -$200 |
| **Net Profit** | **$121,350** |
| **Margin** | **93%** |

---

## GMass Case Study Reference

| Metric | GMass | ClipBoard Target |
|--------|-------|------------------|
| MRR | $450,000 | $130,000 (Y1) |
| Employees | 1 | 1 |
| Price range | $30-60/mo | $10-30/mo |
| Users | 300,000+ | 57,000 (Y1) |
| Conversion | ~5% | 12% (trial model) |
| Key insight | Interface arbitrage | Research synthesis |

### Why GMass Works

1. **No free tier** - Everyone who uses it pays
2. **High price** - $30/mo minimum, signals value
3. **Unlimited usage** - No anxiety about limits
4. **Enterprise clients** - Uber, Google use it
5. **Solo operation** - No team overhead

### ClipBoard Adaptations

1. **Trial, not free** - 7 days full access
2. **3x price increase** - $10/20/30 vs $2/4/6
3. **Unlimited clips** - Pay for AI only
4. **Research focus** - Students, analysts, journalists
5. **Lean operation** - Solo or minimal team

---

## Implementation Checklist

### Phase 1: Price Update
- [ ] Update constants.js with new tier prices
- [ ] Update UI to show new pricing
- [ ] Add trial logic (7 days, 25 credits)
- [ ] Remove free tier from manifest/store listing

### Phase 2: Stripe Integration
- [ ] Set up subscription products
- [ ] Implement trial period handling
- [ ] Add annual billing option
- [ ] Credit pack purchase flow

### Phase 3: Team Plans
- [ ] Workspace/team data model
- [ ] Invite system
- [ ] Shared clips/tags
- [ ] Team billing

---

## Quick Reference

| Metric | Value |
|--------|-------|
| Starter price | $9.99/mo |
| Pro price | $19.99/mo |
| Power price | $29.99/mo |
| Trial duration | 7 days |
| Trial credits | 25 |
| Target conversion | 12% |
| Target ARPU | $18 |
| Y1 MRR target | $130K |
| Net margin | 93% |

---

*Last updated: February 2026*
*Model: GMass-inspired trial + subscription + credits hybrid*
